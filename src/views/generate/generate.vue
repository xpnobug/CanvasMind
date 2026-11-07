<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FrontstagePageShell from '@/components/layout/FrontstagePageShell.vue'
import ContentGenerator from '../../components/generate/ContentGenerator.vue'
import ImageLoadingRecord from '../../components/generate/common/ImageLoadingRecord.vue'
import AgentLoadingRecord from '../../components/generate/common/AgentLoadingRecord.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { getAgentModel } from '@/api/agent'
import { CAPABILITY_FLAGS_REQUEST_FIELD, type ModelCapabilityFlags } from '@/shared/provider-capability'
import { findCatalogModel, getModelByName, loadPublicModelCatalog, resolveModelLabel, type ImageModel } from '@/config/models'
import { buildAgentChatMessages, getAgentSkillCatalogItem, isAgentWorkspaceSkill, loadPublicSkillCatalog } from '@/config/agentSkills'
import {
  createGenerationRecord as createGenerationRecordRequest,
  listGenerationRecords as listGenerationRecordsRequest,
  updateGenerationRecord as updateGenerationRecordRequest,
  type GenerationRecordType,
  type GenerationRecordUpsertPayload,
  type PersistedResearchRuntimeMeta,
  type PersistedGenerationRecord,
} from '@/api/generation-records'
import {
  createGenerationSession as createGenerationSessionRequest,
  deleteGenerationSession as deleteGenerationSessionRequest,
  listGenerationSessions as listGenerationSessionsRequest,
  updateGenerationSession as updateGenerationSessionRequest,
  type PersistedGenerationSession,
} from '@/api/generation-sessions'
import { createGenerationTask, resolveGenerationTaskModel, stopGenerationTask, subscribeGenerationTaskEvents, type GenerationTaskStreamEvent } from '@/api/generation-tasks'
import type { CreationType } from '../../components/generate/selectors'
import type {
  AgentRunState,
} from '@/types/agent'
import {
  applyAgentWorkspaceEvent,
  buildAgentPendingRun,
  type AgentWorkspaceEvent,
} from '@/shared/agent-workspace'
import type {
  ResearchEvidence,
  ResearchFact,
  ResearchOutlineSection,
  ResearchTokenUsage,
  ResearchVerificationResult,
} from '@/shared/research/research-types'
import { normalizeGenerationErrorMessage } from '@/shared/generation-error'
import { appendImageReferencesToRequestBody } from '@/shared/image-generation-request'
import { AUTH_LOGIN_SUCCESS_EVENT, useAuthStore } from '@/stores/auth'
import { useLoginModalStore } from '@/stores/login-modal'
import { useSystemSettingsStore } from '@/stores/system-settings'
import GenerateAgentRecord from './components/GenerateAgentRecord.vue'
import ResearchReportRecord from './components/ResearchReportRecord.vue'
import type {
  ResearchSearchGroupViewItem,
  ResearchSearchSourceViewItem,
  ResearchTimelineViewItem,
} from './components/research-report-record.types'
import GenerateSessionList from './components/GenerateSessionList.vue'
import GenerateConversationSidebar, { type GenerateConversationSidebarItem } from './components/GenerateConversationSidebar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { openLoginModal } = useLoginModalStore()
const { publicSystemSettings, loadPublicSettings } = useSystemSettingsStore()
const conversationHeroSettings = computed(() => publicSystemSettings.value.conversationSettings.entryDisplay.hero)

const RESEARCH_REPORT_SKILL_KEY = 'research-report'

const formatGenerationError = (message?: string | null, fallback = '任务执行失败') => {
  return normalizeGenerationErrorMessage(String(message || '').trim(), fallback)
}

// ContentGenerator 组件引用
const contentGeneratorRef = ref<InstanceType<typeof ContentGenerator> | null>(null)
const generateSessionListRef = ref<InstanceType<typeof GenerateSessionList> | null>(null)

// 生成记录列表
interface GeneratingRecord {
  id: number
  dbId?: string
  sessionId?: string
  sessionTitle?: string
  source?: string
  type: GenerationRecordType
  prompt: string
  time: string
  model: string
  modelKey: string
  referenceImages?: string[]
  ratio: string
  resolution: string
  duration: string
  feature: string
  skill: string
  /** 文生图/图生图本次任务希望生成的张数，对应上游 n 参数。仅图片任务有意义 */
  count?: number
  content: string
  /** 模型的思考过程（reasoning_content / thinking block）。从 record.metaJson.thinkingContent 回填。 */
  thinkingContent?: string
  /** 思考开始时间戳（毫秒）。用于 UI 计算"已思考 N 秒"。 */
  thinkingStartedAt?: number
  /** 思考结束时间戳（毫秒）。完成态时设置，用于 UI 显示固定耗时。 */
  thinkingEndedAt?: number
  images: string[]
  done: boolean
  stopped?: boolean
  progressStage?: string
  progressMessage?: string
  progressPercent?: number
  error: string
  agentTaskId?: string
  agentRun?: AgentRunState
  /** Agent 模式下当前选中的扩展能力开关，转发给 createGenerationTask 注入上游请求 */
  capabilityFlags?: ModelCapabilityFlags
  researchTimeline?: ResearchTimelineViewItem[]
  researchSearchGroups?: ResearchSearchGroupViewItem[]
  researchEvidences?: ResearchEvidence[]
  researchFacts?: ResearchFact[]
  researchOutlineSections?: ResearchOutlineSection[]
  researchVerification?: ResearchVerificationResult | null
  researchTokenUsage?: ResearchTokenUsage | null
  researchVerificationPending?: boolean
}

interface GeneratePreviewImageItem {
  id: string
  src: string
  promptText?: string
  modelLabel?: string
  aspectRatioLabel?: string
  resolutionLabel?: string
  featureLabel?: string
  createDate?: string
  sourceRecordId?: number
  type?: GenerationRecordType
  model?: string
  modelKey?: string
  ratio?: string
  resolution?: string
  duration?: string
  feature?: string
  skill?: string
  referenceImages?: string[]
}

interface RawTranscriptStreamEvent {
  type: 'begin' | 'text' | 'tool_call' | 'tool_result' | 'token_usage' | 'end'
  id?: string
  role?: string
  timestamp?: number
  reasoningContent?: string | null
  toolName?: string
  toolCallId?: string
  content?: unknown
}

interface GenerateSessionScrollState {
  scrollTop: number
  isAtBottom: boolean
  isScrollingUp: boolean
}
const generatingRecords = ref<GeneratingRecord[]>([])
let nextId = 0
const recordPersistTimers = new Map<number, ReturnType<typeof setTimeout>>()
const recordPersistInflight = new Set<number>()
const researchSearchRevealTimers = new Map<string, ReturnType<typeof setTimeout>>()
const researchSearchRevealQueues = new Map<string, ResearchSearchSourceViewItem[]>()
const researchUiRevealTimers = new Map<number, ReturnType<typeof setTimeout>>()
const researchUiRevealQueues = new Map<number, Array<() => void>>()
const taskStreamControllers = new Map<string, AbortController>()
const previewVisible = ref(false)
const previewIndex = ref(0)
const previewImages = ref<GeneratePreviewImageItem[]>([])
const sessionSearchKeyword = ref('')
const generationSessions = ref<PersistedGenerationSession[]>([])
const currentSessionId = ref('')
const conversationSidebarCollapsed = ref(false)
const isGenerationSessionsLoading = ref(false)

const RESEARCH_SEARCH_REVEAL_INTERVAL_MS = 90
const RESEARCH_UI_REVEAL_INTERVAL_MS = 70

const GENERATE_SIDEBAR_COLLAPSED_STORAGE_KEY = 'generate_conversation_sidebar_collapsed'

const GENERATE_ACTIVE_SESSION_STORAGE_KEY = 'generate_active_session_id'

const readStoredCurrentSessionId = () => {
  if (typeof window === 'undefined') {
    return ''
  }
  return String(window.localStorage.getItem(GENERATE_ACTIVE_SESSION_STORAGE_KEY) || '').trim()
}

const writeStoredCurrentSessionId = (sessionId: string) => {
  if (typeof window === 'undefined') {
    return
  }
  if (!sessionId) {
    window.localStorage.removeItem(GENERATE_ACTIVE_SESSION_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(GENERATE_ACTIVE_SESSION_STORAGE_KEY, sessionId)
}

const readStoredConversationSidebarCollapsed = () => {
  if (typeof window === 'undefined') {
    return false
  }
  return window.localStorage.getItem(GENERATE_SIDEBAR_COLLAPSED_STORAGE_KEY) === '1'
}

const writeStoredConversationSidebarCollapsed = (collapsed: boolean) => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(GENERATE_SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0')
}

interface StageConversationEntry {
  stageKey: string
  text: string
}

// 用现有 content 字段持久化图片任务阶段对话，避免额外改表。
const parseStageConversationEntries = (content: string): StageConversationEntry[] => {
  return String(content || '')
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^\[\[(.+?)\]\](.+)$/)
        if (!match) {
          return {
            stageKey: '',
            text: line,
          }
        }
        return {
          stageKey: String(match[1] || '').trim(),
          text: String(match[2] || '').trim(),
        }
      })
      .filter(item => item.text)
}

// 把阶段对话序列化回 content，便于刷新后恢复。
const stringifyStageConversationEntries = (entries: StageConversationEntry[]) => {
  return entries
      .map(item => item.stageKey ? `[[${item.stageKey}]]${item.text}` : item.text)
      .join('\n')
}

// 生成当前记录在对话区展示的阶段文案。
const getRecordConversationEntries = (record: GeneratingRecord) => {
  return parseStageConversationEntries(record.content)
}

const formatResearchTimelineTime = () => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const ensureResearchTimeline = (record: GeneratingRecord) => {
  if (!Array.isArray(record.researchTimeline)) {
    record.researchTimeline = []
  }
  return record.researchTimeline
}

type ResearchTimelineAppendMode = 'dedupe' | 'always'

const buildResearchTimelineUniqueId = (
  timeline: ResearchTimelineViewItem[],
  item: Omit<ResearchTimelineViewItem, 'id' | 'time'> & { id?: string, time?: string },
) => {
  const normalizedBaseId = String(item.id || `${item.kind}-${timeline.length + 1}`).trim() || `${item.kind}-${timeline.length + 1}`
  return `${normalizedBaseId}-${Date.now()}-${timeline.length + 1}`
}

const pushResearchTimeline = (
  record: GeneratingRecord,
  item: Omit<ResearchTimelineViewItem, 'id' | 'time'> & { id?: string, time?: string },
  options?: { appendMode?: ResearchTimelineAppendMode },
) => {
  const timeline = ensureResearchTimeline(record)
  const appendMode = options?.appendMode || 'dedupe'
  const fallbackId = `${item.kind}-${timeline.length + 1}-${Date.now()}`
  const candidateId = item.id || fallbackId
  if (appendMode === 'dedupe' && timeline.some(existing => existing.id === candidateId)) {
    return
  }
  const itemId = appendMode === 'always'
    ? buildResearchTimelineUniqueId(timeline, item)
    : candidateId
  timeline.push({
    id: itemId,
    kind: item.kind,
    title: item.title,
    description: item.description,
    stage: item.stage,
    confidence: item.confidence,
    meta: item.meta,
    time: item.time || formatResearchTimelineTime(),
  })
  if (timeline.length > 80) {
    timeline.splice(0, timeline.length - 80)
  }
}

const flushResearchUiRevealQueue = (record: GeneratingRecord) => {
  const queue = researchUiRevealQueues.get(record.id) || []
  if (!queue.length) {
    researchUiRevealQueues.delete(record.id)
    researchUiRevealTimers.delete(record.id)
    return
  }

  const nextMutation = queue.shift()
  researchUiRevealQueues.set(record.id, queue)
  if (nextMutation) {
    nextMutation()
    schedulePersistRecord(record)
  }

  if (!queue.length) {
    researchUiRevealQueues.delete(record.id)
    researchUiRevealTimers.delete(record.id)
    return
  }

  const timer = setTimeout(() => {
    flushResearchUiRevealQueue(record)
  }, RESEARCH_UI_REVEAL_INTERVAL_MS)
  researchUiRevealTimers.set(record.id, timer)
}

const enqueueResearchUiReveal = (record: GeneratingRecord, mutation: () => void) => {
  const queue = researchUiRevealQueues.get(record.id) || []
  queue.push(mutation)
  researchUiRevealQueues.set(record.id, queue)

  if (researchUiRevealTimers.has(record.id)) {
    return
  }

  flushResearchUiRevealQueue(record)
}

const mergeResearchEvidence = (record: GeneratingRecord, evidence?: ResearchEvidence | null) => {
  if (!evidence?.id) {
    return
  }
  const list = Array.isArray(record.researchEvidences) ? record.researchEvidences : []
  const existingIndex = list.findIndex(item => item.id === evidence.id)
  record.researchEvidences = existingIndex >= 0
    ? list.map(item => item.id === evidence.id ? evidence : item)
    : [...list, evidence]
}

const mergeResearchFact = (record: GeneratingRecord, fact?: ResearchFact | null) => {
  if (!fact?.id) {
    return
  }
  const list = Array.isArray(record.researchFacts) ? record.researchFacts : []
  const existingIndex = list.findIndex(item => item.id === fact.id)
  record.researchFacts = existingIndex >= 0
    ? list.map(item => item.id === fact.id ? fact : item)
    : [...list, fact]
}

const readResearchSourceDomain = (url?: string) => {
  const value = String(url || '').trim()
  if (!value) {
    return ''
  }

  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const readPlainObject = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

const readResearchSkillConfig = () => {
  return readPlainObject(getAgentSkillCatalogItem(RESEARCH_REPORT_SKILL_KEY)?.configJson)
}

const readResearchModelBindingConfig = (configJson = readResearchSkillConfig()) => {
  const binding = readPlainObject(configJson.researchModelBinding || configJson.research_model_binding)
  return {
    providerId: String(binding.providerId || binding.provider_id || configJson.researchModelProviderId || configJson.research_model_provider_id || '').trim(),
    modelKey: String(binding.modelKey || binding.model_key || configJson.researchModelKey || configJson.research_model_key || '').trim(),
  }
}

const readResearchSearchConfig = (configJson = readResearchSkillConfig()) => {
  const search = readPlainObject(configJson.researchSearch || configJson.research_search)
  return {
    provider: String(search.provider || search.searchProvider || configJson.researchSearchProvider || configJson.research_search_provider || '').trim(),
    providerId: String(search.providerId || search.provider_id || configJson.researchSearchProviderId || configJson.research_search_provider_id || '').trim(),
    model: String(search.model || search.modelKey || search.model_key || configJson.researchSearchModel || configJson.research_search_model || '').trim(),
  }
}

const normalizeResearchSearchSource = (raw: unknown): ResearchSearchSourceViewItem | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const item = raw as Record<string, unknown>
  const url = String(item.url || '').trim()
  const title = String(item.title || item.name || url || '').trim()
  if (!title && !url) {
    return null
  }

  const siteName = String(item.siteName || item.type || readResearchSourceDomain(url) || '').trim()
  const snippet = String(item.snippet || item.summary || item.note || '').trim()
  return {
    title: title || siteName || '未命名结果',
    url,
    siteName,
    snippet,
    siteIcon: String(item.siteIcon || item.icon || item.favicon || '').trim(),
    publishedTime: String(item.publishedTime || item.datePublished || item.published_at || '').trim(),
    referenceIndex: typeof item.referenceIndex === 'number'
      ? item.referenceIndex
      : Number.isFinite(Number(item.referenceIndex))
        ? Number(item.referenceIndex)
        : undefined,
  }
}

const normalizeResearchSearchDiagnostics = (raw: unknown) => {
  if (!raw || typeof raw !== 'object') {
    return ''
  }

  const item = raw as Record<string, unknown>
  const reason = String(item.reason || '').trim()
  const provider = String(item.provider || '').trim()
  const providerIdConfigured = item.providerIdConfigured === true
  const modelConfigured = item.modelConfigured === true
  const missingItems = [
    providerIdConfigured ? '' : '搜索供应商',
    modelConfigured ? '' : '搜索模型',
  ].filter(Boolean)

  return [
    reason || '搜索上游未返回可用链接',
    provider ? `当前搜索供应商：${provider}` : '',
    missingItems.length ? `请到后台「技能配置 / 深度研究报告」选择${missingItems.join('和')}，并在「供应商配置」维护 Base URL、API Key 和接口路径` : '',
  ].filter(Boolean).join('；')
}

const buildResearchSearchRevealKey = (record: GeneratingRecord, groupId: string) => {
  return `${record.id}:${String(groupId || '').trim()}`
}

const upsertResearchSearchGroupBase = (
  record: GeneratingRecord,
  input: {
    groupId: string
    query: string
    diagnostics?: string
    pending: boolean
  },
) => {
  const normalizedGroupId = String(input.groupId || '').trim()
  const normalizedQuery = String(input.query || '').trim()
  if (!normalizedGroupId || !normalizedQuery) {
    return
  }

  const list = Array.isArray(record.researchSearchGroups) ? record.researchSearchGroups : []
  const existingIndex = list.findIndex(item => item.id === normalizedGroupId || item.query === normalizedQuery)
  const existing = existingIndex >= 0 ? list[existingIndex] : null
  const nextGroup: ResearchSearchGroupViewItem = {
    id: normalizedGroupId,
    query: normalizedQuery,
    title: normalizedQuery || existing?.title || '搜索结果',
    sources: existing?.sources || [],
    stage: record.progressStage,
    time: existing?.time || formatResearchTimelineTime(),
    pending: input.pending,
    order: existing?.order || list.length + 1,
    diagnostics: input.diagnostics !== undefined ? input.diagnostics : (existing?.diagnostics || ''),
  }
  record.researchSearchGroups = existingIndex >= 0
    ? list.map((item, index) => index === existingIndex ? nextGroup : item)
    : [...list, nextGroup].slice(-12)
}

const appendResearchSearchSource = (
  record: GeneratingRecord,
  input: {
    groupId: string
    query: string
    source: ResearchSearchSourceViewItem
    diagnostics?: string
    pending?: boolean
  },
) => {
  const normalizedGroupId = String(input.groupId || '').trim()
  const normalizedQuery = String(input.query || '').trim()
  if (!normalizedGroupId || !normalizedQuery) {
    return
  }

  const list = Array.isArray(record.researchSearchGroups) ? record.researchSearchGroups : []
  const existingIndex = list.findIndex(item => item.id === normalizedGroupId || item.query === normalizedQuery)
  const existing = existingIndex >= 0 ? list[existingIndex] : null
  const existingSources = existing?.sources || []
  const dedupedSources = existingSources.some(item => (
    (item.url && input.source.url && item.url === input.source.url)
    || (!item.url && !input.source.url && item.title === input.source.title && item.snippet === input.source.snippet)
  ))
    ? existingSources
    : [...existingSources, input.source].slice(0, 12)
  const nextGroup: ResearchSearchGroupViewItem = {
    id: normalizedGroupId,
    query: normalizedQuery,
    title: normalizedQuery || existing?.title || '搜索结果',
    sources: dedupedSources,
    stage: record.progressStage,
    time: existing?.time || formatResearchTimelineTime(),
    pending: input.pending ?? existing?.pending ?? false,
    order: existing?.order || list.length + 1,
    diagnostics: input.diagnostics !== undefined ? input.diagnostics : (existing?.diagnostics || ''),
  }
  record.researchSearchGroups = existingIndex >= 0
    ? list.map((item, index) => index === existingIndex ? nextGroup : item)
    : [...list, nextGroup].slice(-12)
}

const finalizeResearchSearchReveal = (
  record: GeneratingRecord,
  input: {
    groupId: string
    query: string
    diagnostics?: string
  },
) => {
  const normalizedGroupId = String(input.groupId || '').trim()
  const normalizedQuery = String(input.query || '').trim()
  if (!normalizedGroupId || !normalizedQuery) {
    return
  }

  const list = Array.isArray(record.researchSearchGroups) ? record.researchSearchGroups : []
  const existingIndex = list.findIndex(item => item.id === normalizedGroupId || item.query === normalizedQuery)
  if (existingIndex < 0) {
    upsertResearchSearchGroupBase(record, {
      groupId: normalizedGroupId,
      query: normalizedQuery,
      diagnostics: input.diagnostics,
      pending: false,
    })
    return
  }

  record.researchSearchGroups = list.map((item, index) => index === existingIndex
    ? {
      ...item,
      pending: false,
      diagnostics: input.diagnostics !== undefined ? input.diagnostics : item.diagnostics,
    }
    : item)
}

const flushResearchSearchRevealQueue = (
  record: GeneratingRecord,
  input: {
    groupId: string
    query: string
    diagnostics?: string
  },
) => {
  const revealKey = buildResearchSearchRevealKey(record, input.groupId)
  const queue = researchSearchRevealQueues.get(revealKey) || []
  if (!queue.length) {
    researchSearchRevealQueues.delete(revealKey)
    researchSearchRevealTimers.delete(revealKey)
    finalizeResearchSearchReveal(record, input)
    schedulePersistRecord(record)
    return
  }

  const nextSource = queue.shift()
  researchSearchRevealQueues.set(revealKey, queue)
  if (nextSource) {
    appendResearchSearchSource(record, {
      groupId: input.groupId,
      query: input.query,
      source: nextSource,
      diagnostics: input.diagnostics,
      pending: true,
    })
    schedulePersistRecord(record)
  }

  const nextTimer = setTimeout(() => {
    flushResearchSearchRevealQueue(record, input)
  }, RESEARCH_SEARCH_REVEAL_INTERVAL_MS)
  researchSearchRevealTimers.set(revealKey, nextTimer)
}

const enqueueResearchSearchReveal = (
  record: GeneratingRecord,
  input: {
    groupId: string
    query: string
    sources: ResearchSearchSourceViewItem[]
    diagnostics?: string
  },
) => {
  const normalizedGroupId = String(input.groupId || '').trim()
  const normalizedQuery = String(input.query || '').trim()
  if (!normalizedGroupId || !normalizedQuery) {
    return
  }

  upsertResearchSearchGroupBase(record, {
    groupId: normalizedGroupId,
    query: normalizedQuery,
    diagnostics: input.diagnostics,
    pending: true,
  })

  const revealKey = buildResearchSearchRevealKey(record, normalizedGroupId)
  const existingQueue = researchSearchRevealQueues.get(revealKey) || []
  const dedupedIncoming = input.sources.filter(source => !existingQueue.some(item => (
    (item.url && source.url && item.url === source.url)
    || (!item.url && !source.url && item.title === source.title && item.snippet === source.snippet)
  )))
  researchSearchRevealQueues.set(revealKey, [...existingQueue, ...dedupedIncoming])

  if (researchSearchRevealTimers.has(revealKey)) {
    return
  }

  flushResearchSearchRevealQueue(record, {
    groupId: normalizedGroupId,
    query: normalizedQuery,
    diagnostics: input.diagnostics,
  })
}

const mergeResearchSearchGroup = (
  record: GeneratingRecord,
  toolResult?: { id?: string, toolName?: string, preview?: Record<string, unknown> } | null,
) => {
  if (toolResult?.toolName !== 'web-search' || !toolResult.preview) {
    return
  }

  const preview = toolResult.preview
  const query = String(preview.query || '').trim()
  if (!query) {
    return
  }
  const rawSources = Array.isArray(preview.searchSourcesPreview) && preview.searchSourcesPreview.length
      ? preview.searchSourcesPreview
      : Array.isArray(preview.topResults)
          ? preview.topResults
          : []
  const sources = rawSources
      .map(normalizeResearchSearchSource)
      .filter((item): item is ResearchSearchSourceViewItem => Boolean(item))
      .slice(0, 12)
  if (!query && !sources.length) {
    return
  }

  const groupId = String(toolResult.id || query || `search-${(record.researchSearchGroups || []).length + 1}`).trim()
  const diagnostics = normalizeResearchSearchDiagnostics(preview.diagnostics)
  if (!sources.length) {
    finalizeResearchSearchReveal(record, {
      groupId,
      query,
      diagnostics,
    })
    return
  }

  enqueueResearchSearchReveal(record, {
    groupId,
    query,
    sources,
    diagnostics,
  })
}

const upsertResearchSearchPendingGroup = (
  record: GeneratingRecord,
  groupId: string,
  query: string,
) => {
  const normalizedId = String(groupId || '').trim()
  const normalizedQuery = String(query || '').trim()
  if (!normalizedId || !normalizedQuery) {
    return
  }

  const list = Array.isArray(record.researchSearchGroups) ? record.researchSearchGroups : []
  const existingIndex = list.findIndex(item => item.id === normalizedId || item.query === normalizedQuery)
  upsertResearchSearchGroupBase(record, {
    groupId: normalizedId,
    query: normalizedQuery,
    diagnostics: existingIndex >= 0 ? list[existingIndex].diagnostics : '',
    pending: true,
  })
}

const mergeRawResearchSearchGroup = (
  record: GeneratingRecord,
  rawEvent: RawTranscriptStreamEvent,
) => {
  const list = Array.isArray(rawEvent.content) ? rawEvent.content : []
  if (!list.length) {
    return
  }

  const sources = list
    .map(normalizeResearchSearchSource)
    .filter((item): item is ResearchSearchSourceViewItem => Boolean(item))
    .slice(0, 12)
  const groupId = String(rawEvent.toolCallId || rawEvent.id || '').trim()
  const existing = (record.researchSearchGroups || []).find(item => item.id === groupId)
  const query = String(existing?.query || '').trim()
  if (!groupId || !query) {
    return
  }

  mergeResearchSearchGroup(record, {
    id: groupId,
    toolName: 'web-search',
    preview: {
      query,
      topResults: sources,
    },
  })
}

const buildResearchRuntimeMeta = (record: GeneratingRecord): PersistedResearchRuntimeMeta | null => {
  if (record.type !== 'research') {
    return null
  }

  return {
    version: 1,
    timeline: Array.isArray(record.researchTimeline) ? record.researchTimeline.slice(-80) : [],
    searchGroups: Array.isArray(record.researchSearchGroups) ? record.researchSearchGroups.slice(-12) : [],
    evidences: Array.isArray(record.researchEvidences) ? record.researchEvidences.slice(-120) : [],
    facts: Array.isArray(record.researchFacts) ? record.researchFacts.slice(-80) : [],
    outlineSections: Array.isArray(record.researchOutlineSections) ? record.researchOutlineSections : [],
    verification: record.researchVerification || null,
    tokenUsage: record.researchTokenUsage || null,
  }
}

const readResearchRuntimeMeta = (record: PersistedGenerationRecord): PersistedResearchRuntimeMeta | null => {
  const research = record.research
  if (!research || typeof research !== 'object' || research.version !== 1) {
    return null
  }
  return research
}

// 某个阶段重复到达时只覆盖该阶段文案，不重复堆积。
const upsertRecordStageConversation = (record: GeneratingRecord, stageKey: string, text: string) => {
  const normalizedStageKey = String(stageKey || '').trim()
  const normalizedText = String(text || '').trim()
  if (!normalizedText) {
    return false
  }

  const nextEntries = parseStageConversationEntries(record.content)
  const currentIndex = normalizedStageKey
      ? nextEntries.findIndex(item => item.stageKey === normalizedStageKey)
      : -1

  if (currentIndex >= 0) {
    if (nextEntries[currentIndex].text === normalizedText) {
      return false
    }
    nextEntries[currentIndex] = {
      stageKey: normalizedStageKey,
      text: normalizedText,
    }
  } else {
    nextEntries.push({
      stageKey: normalizedStageKey,
      text: normalizedText,
    })
  }

  record.content = stringifyStageConversationEntries(nextEntries)
  return true
}

const describeResearchTool = (toolName?: string) => {
  switch (toolName) {
    case 'web-search':
      return '网页搜索'
    case 'web-reader':
      return '网页阅读'
    case 'gap-analyzer':
      return '缺口分析'
    case 'fact-verifier':
      return '事实核查'
    case 'start-report':
      return '报告生成'
    default:
      return toolName || '研究工具'
  }
}

const readResearchPreviewDescription = (preview?: Record<string, unknown>) => {
  if (!preview || typeof preview !== 'object') {
    return ''
  }

  const resultCount = Number(preview.resultCount || 0)
  const query = String(preview.query || '').trim()
  if (query && resultCount) {
    return `${query}，返回 ${resultCount} 条结果`
  }
  if (query) {
    return query
  }

  const queries = Array.isArray(preview.queries) ? preview.queries : []
  if (queries.length) {
    return `已规划 ${queries.length} 个查询方向`
  }

  const title = String(preview.title || '').trim()
  const excerpt = String(preview.excerpt || '').trim()
  if (title && excerpt) {
    return `${title}｜${excerpt}`
  }
  if (title) {
    return title
  }

  const subject = String(preview.subject || '').trim()
  return subject ? `研究主体：${subject}` : ''
}

const readResearchPreviewMeta = (preview?: Record<string, unknown>) => {
  if (!preview || typeof preview !== 'object') {
    return undefined
  }

  const meta: Record<string, unknown> = {}
  for (const key of ['url', 'title', 'excerpt', 'content', 'siteName', 'siteIcon', 'query', 'referenceIndex', 'contentLength', 'redirected', 'contentType']) {
    const value = preview[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      meta[key] = value
    }
  }

  return Object.keys(meta).length ? meta : undefined
}

const isResearchReportRecord = (record: GeneratingRecord) => {
  const content = String(record.content || '')
  return record.type === 'research'
      || record.skill === RESEARCH_REPORT_SKILL_KEY
      || /^#\s*Deep Research\s*执行结果/m.test(content)
      || /^##\s*核查说明/m.test(content)
}

const isResearchPersistedRecord = (record?: PersistedGenerationRecord | null) => {
  if (!record) {
    return false
  }
  return record.type === 'research' || record.skill === RESEARCH_REPORT_SKILL_KEY
}

// 将服务端阶段映射成前台百分比，避免继续显示固定 99%。
const mapTaskStageToProgressPercent = (stage?: string) => {
  const configuredStage = publicSystemSettings.value.generationProgressSettings?.stages?.find(item => item.key === String(stage || '').trim())
  if (configuredStage && Number.isFinite(Number(configuredStage.percent))) {
    return Math.max(0, Math.min(100, Number(configuredStage.percent)))
  }

  switch (String(stage || '').trim()) {
    case 'queued':
      return 5
    case 'intake':
      return 8
    case 'bootstrap_planning':
      return 14
    case 'parallel_search':
      return 24
    case 'initial_analysis':
      return 34
    case 'disambiguation':
      return 40
    case 'gap_detection':
      return 46
    case 'targeted_search':
      return 56
    case 'deep_reading':
      return 66
    case 'evidence_merge':
      return 72
    case 'fact_verification':
      return 80
    case 'uncertainty_marking':
      return 84
    case 'report_planning':
      return 88
    case 'report_writing':
      return 94
    case 'final_review':
      return 98
    case 'resolved_provider':
      return 12
    case 'requesting_upstream':
      return 35
    case 'receiving_upstream_result':
      return 72
    case 'syncing_record':
      return 92
    case 'completed':
    case 'failed':
    case 'stopped':
      return 100
    case 'failing':
      return 96
    case 'stopping':
      return 98
    default:
      return 0
  }
}

// 根据后台配置解析当前阶段展示文案。
const resolveTaskStageLabel = (stage?: string, fallback = '造梦中') => {
  if (publicSystemSettings.value.generationProgressSettings?.enabled !== false) {
    const configuredStage = publicSystemSettings.value.generationProgressSettings?.stages?.find(item => item.key === String(stage || '').trim())
    if (configuredStage?.label) {
      return configuredStage.label
    }
  }

  switch (String(stage || '').trim()) {
    case 'intake':
      return '理解研究问题'
    case 'bootstrap_planning':
      return '制定研究计划'
    case 'parallel_search':
      return '并行搜索资料'
    case 'initial_analysis':
      return '初步分析资料'
    case 'disambiguation':
      return '澄清研究范围'
    case 'gap_detection':
      return '识别信息缺口'
    case 'targeted_search':
      return '定向补充搜索'
    case 'deep_reading':
      return '深度阅读信源'
    case 'evidence_merge':
      return '合并证据'
    case 'fact_verification':
      return '事实核查'
    case 'uncertainty_marking':
      return '标记不确定性'
    case 'report_planning':
      return '规划报告结构'
    case 'report_writing':
      return '撰写研究报告'
    case 'final_review':
      return '最终审阅'
    case 'completed':
      return '任务已完成'
    case 'failed':
      return '任务执行失败'
    case 'stopped':
      return '任务已停止'
    case 'stopping':
      return '任务停止中'
    default:
      return fallback
  }
}

// 页面进入时预加载后台公开模型目录，确保工具栏与生成请求使用同一份模型清单。
onMounted(() => {
  void loadPublicModelCatalog()
  void loadPublicSkillCatalog()
  void loadPublicSettings()
})

const buildPreviewImagesFromRecord = (record: GeneratingRecord): GeneratePreviewImageItem[] => {
  return (record.images || []).map((imageUrl, index) => ({
    id: `${record.id}-${index + 1}`,
    src: imageUrl,
    promptText: record.prompt,
    modelLabel: resolveModelLabel(record.modelKey || record.model, 'IMAGE') || record.model,
    aspectRatioLabel: record.ratio,
    resolutionLabel: record.resolution,
    featureLabel: record.feature,
    createDate: record.time,
    sourceRecordId: record.id,
    type: record.type,
    model: record.model,
    modelKey: record.modelKey,
    ratio: record.ratio,
    resolution: record.resolution,
    duration: record.duration,
    feature: record.feature,
    skill: record.skill,
    referenceImages: [...(record.referenceImages || [])],
  }))
}

const buildDraftReferenceImages = (generatedImage?: string, referenceImages?: string[]) => {
  const merged = [String(generatedImage || '').trim(), ...(referenceImages || []).map(item => String(item || '').trim())]
    .filter(Boolean)
  return Array.from(new Set(merged)).slice(0, 9)
}

const findGeneratingRecordById = (recordId?: number) =>
  generatingRecords.value.find(record => record.id === recordId)

const openRecordPreview = (record: GeneratingRecord, index = 0) => {
  if (!record.done || !record.images.length) {
    return
  }

  previewImages.value = buildPreviewImagesFromRecord(record)
  previewIndex.value = Math.min(Math.max(0, index), Math.max(0, previewImages.value.length - 1))
  previewVisible.value = true
}

const handlePreviewRecordImage = (record: GeneratingRecord, index: number) => {
  openRecordPreview(record, index)
}

const handleEditImageRecord = async (record: GeneratingRecord, imageUrl?: string) => {
  if (record.type !== 'image') {
    return
  }
  const draftReferenceImages = buildDraftReferenceImages(imageUrl || record.images[0], record.referenceImages)
  previewVisible.value = false
  await contentGeneratorRef.value?.applyDraft({
    type: record.type,
    prompt: record.prompt,
    modelKey: record.modelKey,
    ratio: record.ratio,
    resolution: record.resolution,
    duration: record.duration,
    feature: record.feature,
    skill: record.skill,
    referenceImages: draftReferenceImages,
  })
}

const handleRegenerateImageRecord = async (record: GeneratingRecord) => {
  if (record.type !== 'image') {
    return
  }
  await handleSend(record.prompt, record.type, {
    model: record.model,
    modelKey: record.modelKey,
    ratio: record.ratio,
    resolution: record.resolution,
    duration: record.duration,
    feature: record.feature,
    skill: record.skill,
    referenceImages: [...(record.referenceImages || [])],
    count: record.count && record.count > 0 ? record.count : 1,
  })
}

const handleOpenImageRecordMore = (record: GeneratingRecord) => {
  openRecordPreview(record, 0)
}

const handlePreviewDownload = async (image: GeneratePreviewImageItem) => {
  const anchor = document.createElement('a')
  anchor.href = image.src
  anchor.download = `generate-${Date.now()}.png`
  anchor.rel = 'noopener'
  anchor.click()
}

const handlePreviewFavorite = () => {
  ElMessage.success('生成页预览暂不支持收藏入库')
}

const handlePreviewPublish = () => {
  ElMessage.success('请前往资产页或发布流程继续操作')
}

const handlePreviewGenerateVideo = () => {
  ElMessage.success('生视频能力请在资产页详情中使用')
}

const handlePreviewEditInCanvas = () => {
  ElMessage.success('请前往画布页继续编辑')
}

const handlePreviewEdit = async (image: GeneratePreviewImageItem) => {
  const record = findGeneratingRecordById(image.sourceRecordId)
  if (!record) {
    ElMessage.warning('未找到对应生成记录，暂时无法重新编辑')
    return
  }

  await handleEditImageRecord(record, image.src)
}

const handlePreviewRegenerate = async (image: GeneratePreviewImageItem) => {
  const record = findGeneratingRecordById(image.sourceRecordId)
  if (!record) {
    ElMessage.warning('未找到对应生成记录，暂时无法再次生成')
    return
  }

  previewVisible.value = false
  await handleRegenerateImageRecord(record)
}

// 当前会话列表先支持关键词搜索，便于快速定位提示词和结果文本。
const visibleGeneratingRecords = computed(() => {
  const activeSession = String(currentSessionId.value || '').trim()
  const keyword = String(sessionSearchKeyword.value || '').trim().toLowerCase()

  return generatingRecords.value.filter((record) => {
    if (activeSession && record.sessionId !== activeSession) {
      return false
    }

    if (!keyword) {
      return true
    }

    return [
      record.prompt,
      record.content,
      record.model,
      record.feature,
      record.skill,
      record.type,
      record.error,
    ].some((field) => String(field || '').toLowerCase().includes(keyword))
  })
})

const isCurrentSessionEmpty = computed(() => {
  if (sessionSearchKeyword.value.trim()) {
    return false
  }
  return visibleGeneratingRecords.value.length === 0
})

const mainContentClassName = computed(() => {
  const classNames = ['main-content-G632JF']
  if (isCurrentSessionEmpty.value) {
    classNames.push('new-conversation')
  }
  if (!isConversationSidebarEffectivelyCollapsed.value) {
    classNames.push('with-sidebar')
  }
  return classNames.join(' ')
})

const sidebarRecentSessions = computed<GenerateConversationSidebarItem[]>(() => {
  return generationSessions.value
      .filter(session => !session.isDefault)
      .map((session) => ({
        id: session.id,
        title: String(session.title || '未命名会话').trim(),
        imageUrl: session.coverImageUrl || '',
      }))
})

const sidebarDefaultSession = computed<GenerateConversationSidebarItem>(() => ({
  id: generationSessions.value.find(session => session.isDefault)?.id || 'default',
  title: generationSessions.value.find(session => session.isDefault)?.title || '默认创作',
  imageUrl: generationSessions.value.find(session => session.isDefault)?.coverImageUrl || '',
}))

// 空会话且没有最近记录时，左侧空栏没有信息价值，直接走折叠态保证主区居中。
const isConversationSidebarEffectivelyCollapsed = computed(() => {
  if (conversationSidebarCollapsed.value) {
    return true
  }
  return isCurrentSessionEmpty.value && sidebarRecentSessions.value.length === 0
})

const applyCurrentSessionId = (sessionId: string) => {
  currentSessionId.value = sessionId
  writeStoredCurrentSessionId(sessionId)
}

const syncCurrentSessionWithSessionList = (sessions: PersistedGenerationSession[]) => {
  if (!sessions.length) {
    applyCurrentSessionId('')
    return
  }

  const current = String(currentSessionId.value || '').trim()
  if (current && sessions.some(session => session.id === current)) {
    return
  }

  const stored = readStoredCurrentSessionId()
  const matchedStored = stored
      ? sessions.find(session => session.id === stored)
      : null

  applyCurrentSessionId(matchedStored?.id || sessions[0].id)
}

const loadPersistedGenerationSessions = async () => {
  if (!authStore.isLoggedIn.value) {
    generationSessions.value = []
    applyCurrentSessionId('')
    return
  }

  try {
    isGenerationSessionsLoading.value = true
    const sessions = await listGenerationSessionsRequest('generate')
    generationSessions.value = sessions
    syncCurrentSessionWithSessionList(sessions)
  } catch {
    generationSessions.value = []
    applyCurrentSessionId('')
  } finally {
    isGenerationSessionsLoading.value = false
  }
}

// 新建正式会话，并切换到新会话视图。
const handleCreateSession = async () => {
  if (!authStore.isLoggedIn.value) {
    openLoginModal('generate-session-create')
    return
  }

  const createdSession = await createGenerationSessionRequest({ source: 'generate' })
  generationSessions.value = generationSessions.value
      .filter(session => session.id !== createdSession.id)
  generationSessions.value.push(createdSession)
  generationSessions.value = [...generationSessions.value].sort((left, right) => {
    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? -1 : 1
    }
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  })
  applyCurrentSessionId(createdSession.id)
  sessionSearchKeyword.value = ''
  const scrollNode = document.getElementById('scroll-list-generate-session')
  scrollNode?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  contentGeneratorRef.value?.expand()
}

const handleSessionSearch = () => {
  contentGeneratorRef.value?.expand()
}

const handleSessionTimeFilterClick = () => {
  ElMessage.info('时间筛选下一步接入。')
}

const handleSessionTypeFilterClick = () => {
  ElMessage.info('生成类型筛选下一步接入。')
}

const handleSessionActionFilterClick = () => {
  ElMessage.info('操作类型筛选下一步接入。')
}

const handleJumpToResearchVerification = (targetId: string) => {
  generateSessionListRef.value?.scrollToElementById(targetId)
}

const buildManualResearchVerificationRecord = (sourceRecord: GeneratingRecord): GeneratingRecord => {
  const recordId = nextId++
  return {
    id: recordId,
    sessionId: sourceRecord.sessionId,
    sessionTitle: sourceRecord.sessionTitle,
    source: 'generate',
    type: 'research',
    prompt: `核查报告：${sourceRecord.prompt}`,
    time: formatGroupLabel(new Date()),
    model: sourceRecord.model,
    modelKey: sourceRecord.modelKey,
    referenceImages: [],
    ratio: '',
    resolution: '',
    duration: '',
    feature: '',
    skill: RESEARCH_REPORT_SKILL_KEY,
    capabilityFlags: sourceRecord.capabilityFlags || undefined,
    content: '',
    images: [],
    done: false,
    stopped: false,
    progressStage: 'fact_verification',
    progressMessage: resolveTaskStageLabel('fact_verification', '已创建报告核查任务'),
    progressPercent: mapTaskStageToProgressPercent('fact_verification'),
    error: '',
    researchTimeline: [{
      id: `research-verify-created-${recordId}`,
      kind: 'begin',
      title: '报告核查任务已创建',
      description: '正在基于现有报告和证据快照执行手动核查',
      stage: 'fact_verification',
      time: formatResearchTimelineTime(),
    }],
    researchSearchGroups: [],
    researchEvidences: [],
    researchFacts: [],
    researchOutlineSections: [],
    researchVerification: null,
    researchTokenUsage: null,
    researchVerificationPending: true,
  }
}

const handleVerifyResearchReport = async (record: GeneratingRecord) => {
  if (
    record.researchVerificationPending
    || !record.prompt.trim()
    || !String(record.content || '').trim()
    || record.prompt.startsWith('核查报告：')
  ) {
    return
  }

  const verificationRecord = buildManualResearchVerificationRecord(record)
  generatingRecords.value.unshift(verificationRecord)
  if (verificationRecord.sessionId) {
    touchSessionAfterRecordCreated(verificationRecord.sessionId)
  }

  try {
    await startResearchTask(verificationRecord, {
      manualVerificationSource: record,
    })
  } catch {
    verificationRecord.researchVerificationPending = false
  }
}

const handleSelectSidebarDefault = () => {
  applyCurrentSessionId(sidebarDefaultSession.value.id)
  sessionSearchKeyword.value = ''
}

const handleSelectSidebarSession = (id: string) => {
  applyCurrentSessionId(id)
  sessionSearchKeyword.value = ''
}

const sessionRenameDialogVisible = ref(false)
const sessionDeleteDialogVisible = ref(false)
const sessionActionLoading = ref(false)
const renamingSessionId = ref('')
const deletingSessionId = ref('')
const sessionRenameDraftTitle = ref('')
const deletingSessionTitle = computed(() => {
  const targetSession = generationSessions.value.find(session => session.id === deletingSessionId.value)
  return String(targetSession?.title || '').trim() || '未命名会话'
})

const closeSessionRenameDialog = (force = false) => {
  if (sessionActionLoading.value && !force) {
    return
  }
  sessionRenameDialogVisible.value = false
  renamingSessionId.value = ''
  sessionRenameDraftTitle.value = ''
}

const closeSessionDeleteDialog = (force = false) => {
  if (sessionActionLoading.value && !force) {
    return
  }
  sessionDeleteDialogVisible.value = false
  deletingSessionId.value = ''
}

const handleRenameSidebarSession = (id: string) => {
  const targetSession = generationSessions.value.find(session => session.id === id)
  if (!targetSession) {
    return
  }

  renamingSessionId.value = id
  sessionRenameDraftTitle.value = targetSession.title
  sessionRenameDialogVisible.value = true
}

const submitRenameSidebarSession = async () => {
  const id = renamingSessionId.value
  const nextTitle = String(sessionRenameDraftTitle.value || '').trim()
  if (!id) {
    return
  }

  if (!nextTitle) {
    ElMessage.warning('会话名称不能为空')
    return
  }

  sessionActionLoading.value = true
  try {
    const savedSession = await updateGenerationSessionRequest(id, {
      title: nextTitle,
    })

    generationSessions.value = generationSessions.value.map((session) => {
      if (session.id !== savedSession.id) {
        return session
      }
      return savedSession
    })

    generatingRecords.value = generatingRecords.value.map((record) => {
      if (record.sessionId !== savedSession.id) {
        return record
      }
      return {
        ...record,
        sessionTitle: savedSession.title,
      }
    })

    closeSessionRenameDialog(true)
  } catch (error) {
    ElMessage.error(formatGenerationError(error instanceof Error ? error.message : String(error || ''), '会话重命名失败'))
  } finally {
    sessionActionLoading.value = false
  }
}

const handleDeleteSidebarSession = (id: string) => {
  const targetSession = generationSessions.value.find(session => session.id === id)
  if (!targetSession) {
    return
  }

  deletingSessionId.value = id
  sessionDeleteDialogVisible.value = true
}

const submitDeleteSidebarSession = async () => {
  const id = deletingSessionId.value
  if (!id) {
    return
  }

  const targetSession = generationSessions.value.find(session => session.id === id)
  if (!targetSession) {
    closeSessionDeleteDialog(true)
    return
  }

  sessionActionLoading.value = true
  try {
    const runningRecords = generatingRecords.value.filter(record => record.sessionId === id && !record.done && record.dbId)
    await Promise.allSettled(runningRecords.map(async (record) => {
      if (!record.dbId) {
        return
      }

      const saved = await stopGenerationTask(record.dbId)
      syncRecordWithPersisted(record, saved)
      const controller = taskStreamControllers.get(record.dbId)
      if (controller) {
        controller.abort()
        taskStreamControllers.delete(record.dbId)
      }
    }))

    await deleteGenerationSessionRequest(id)

    generationSessions.value = generationSessions.value.filter(session => session.id !== id)
    generatingRecords.value = generatingRecords.value.filter(record => record.sessionId !== id)

    if (currentSessionId.value === id) {
      const fallbackSession = generationSessions.value.find(session => session.isDefault) || generationSessions.value[0]
      applyCurrentSessionId(fallbackSession?.id || '')
    }

    if (!generationSessions.value.length) {
      conversationSidebarCollapsed.value = false
      writeStoredConversationSidebarCollapsed(false)
    }
    closeSessionDeleteDialog(true)
  } catch (error) {
    ElMessage.error(formatGenerationError(error instanceof Error ? error.message : String(error || ''), '会话删除失败'))
  } finally {
    sessionActionLoading.value = false
  }
}

const handleToggleConversationSidebar = () => {
  conversationSidebarCollapsed.value = !conversationSidebarCollapsed.value
  writeStoredConversationSidebarCollapsed(conversationSidebarCollapsed.value)
}

// 只有显式选择普通技能时，才进入工作台式 Agent 流程；研究报告走独立 research 策略。
const shouldUseAgentWorkspaceFlow = (skill?: string) => {
  const normalizedSkill = String(skill || '').trim()
  return normalizedSkill !== RESEARCH_REPORT_SKILL_KEY && isAgentWorkspaceSkill(normalizedSkill)
}

const buildAgentRequestMessages = (record: GeneratingRecord) => {
  const baseMessages = buildAgentChatMessages(
      record.skill || 'general',
      record.prompt,
      Array.isArray(record.referenceImages) ? record.referenceImages : [],
  )

  // 从同 session 已完成的 agent 记录中提取历史上下文
  const model = getModelByName(record.modelKey)
  const maxContext = Number((model as any)?.defaultParams?.maxContext) || 3
  const sessionId = record.sessionId
  if (!sessionId || maxContext <= 0) {
    return baseMessages
  }

  const historyRecords = generatingRecords.value
    .filter(item =>
      item !== record
      && item.sessionId === sessionId
      && item.type === 'agent'
      && item.done
      && !item.error
      && item.content.trim()
    )
    .sort((a, b) => b.id - a.id)
    .slice(0, maxContext)
    .reverse()

  if (!historyRecords.length) {
    return baseMessages
  }

  // system + 历史轮次 + 当前 user
  const historyMessages = historyRecords.flatMap(item => [
    { role: 'user', content: item.prompt },
    { role: 'assistant', content: item.content },
  ])

  const [systemMessage, ...currentMessages] = baseMessages
  return [systemMessage, ...historyMessages, ...currentMessages]
}

// 将页面内的记录结构转换为后端持久化结构。
const toGenerationRecordPayload = (record: GeneratingRecord): GenerationRecordUpsertPayload => ({
  sessionId: record.sessionId,
  source: record.source || 'generate',
  type: record.type,
  prompt: record.prompt,
  content: record.content,
  error: record.error,
  model: record.model,
  modelKey: record.modelKey,
  ratio: record.ratio,
  resolution: record.resolution,
  duration: record.duration,
  feature: record.feature,
  skill: record.skill,
  referenceImages: record.referenceImages || [],
  done: record.done,
  stopped: Boolean(record.stopped),
  agentTaskId: record.agentTaskId,
  images: record.images,
  agentRun: record.agentRun,
  research: buildResearchRuntimeMeta(record),
})

// 格式化时间分组标签
const formatGroupLabel = (date: Date): string => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = today.getTime() - target.getTime()
  const dayMs = 86400000

  if (diff === 0) return '今天'
  if (diff === dayMs) return '昨天'
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 将后端返回的持久化记录还原成页面使用结构。
const createRecordFromPersisted = (record: PersistedGenerationRecord): GeneratingRecord => {
  const isImageRecord = record.type === 'image'
  const isResearchRecord = isResearchPersistedRecord(record)
  const researchMeta = isResearchRecord ? readResearchRuntimeMeta(record) : null
  const modelCategory = record.type === 'image'
      ? 'IMAGE'
      : record.type === 'video'
        ? 'VIDEO'
        : 'CHAT'
  return {
    id: nextId++,
    dbId: record.id,
    sessionId: record.sessionId,
    sessionTitle: record.sessionTitle || '',
    source: record.source || 'generate',
    type: record.type,
    prompt: record.prompt,
    time: formatGroupLabel(new Date(record.createdAt)),
    // 后端若返回旧的 model 文本，这里统一按最新后台模型目录重新解析展示名称。
    model: resolveModelLabel(
        record.modelKey || record.model,
        modelCategory,
    ) || record.model,
    modelKey: record.modelKey,
    ratio: record.ratio,
    resolution: record.resolution,
    duration: record.duration,
    feature: record.feature,
    skill: record.skill,
    referenceImages: Array.isArray(record.referenceImages) ? [...record.referenceImages] : [],
    content: isImageRecord
        ? (record.content || (!record.done ? '[[queued]]任务已创建，等待服务端执行' : ''))
        : record.content,
    thinkingContent: record.thinkingContent || '',
    images: record.images,
    done: record.done,
    stopped: Boolean(record.stopped),
    progressStage: isImageRecord || isResearchRecord
        ? (record.done ? (record.stopped ? 'stopped' : record.error ? 'failed' : 'completed') : (isResearchRecord ? 'intake' : 'queued'))
        : undefined,
    progressMessage: isImageRecord
        ? (record.done
            ? resolveTaskStageLabel(record.stopped ? 'stopped' : 'completed', record.stopped ? '任务已停止' : '任务已完成')
            : resolveTaskStageLabel('queued', '任务已创建，等待服务端执行'))
        : isResearchRecord
          ? (record.done
              ? resolveTaskStageLabel(record.stopped ? 'stopped' : record.error ? 'failed' : 'completed', record.stopped ? '研究任务已停止' : record.error ? record.error : '研究报告已完成')
              : resolveTaskStageLabel('intake', '研究任务已创建，等待服务端执行'))
        : undefined,
    progressPercent: isImageRecord || isResearchRecord ? (record.done ? 100 : (isResearchRecord ? 8 : 5)) : 0,
    error: record.done || record.stopped ? record.error : '',
    agentTaskId: record.agentTaskId,
    agentRun: record.agentRun,
    researchTimeline: isResearchRecord
        ? (Array.isArray(researchMeta?.timeline) && researchMeta.timeline.length
            ? [...researchMeta.timeline]
            : [{
          id: `persisted-${record.id}`,
          kind: record.done ? (record.stopped ? 'stopped' : record.error ? 'failed' : 'completed') : 'stage',
          title: record.done ? (record.stopped ? '研究任务已停止' : record.error ? '研究任务失败' : '研究报告已完成') : '研究任务执行中',
          description: record.done ? '' : '历史记录恢复后会继续订阅运行中的研究事件',
          stage: record.done ? (record.stopped ? 'stopped' : record.error ? 'failed' : 'completed') : 'intake',
          time: formatGroupLabel(new Date(record.createdAt)),
        }])
        : [],
    researchSearchGroups: Array.isArray(researchMeta?.searchGroups) ? [...researchMeta.searchGroups] : [],
    researchEvidences: Array.isArray(researchMeta?.evidences) ? [...researchMeta.evidences] : [],
    researchFacts: Array.isArray(researchMeta?.facts) ? [...researchMeta.facts] : [],
    researchOutlineSections: Array.isArray(researchMeta?.outlineSections) ? [...researchMeta.outlineSections] : [],
    researchVerification: researchMeta?.verification || null,
    researchTokenUsage: researchMeta?.tokenUsage || null,
    researchVerificationPending: false,
  }
}

const shouldDisplayThinkingContent = (record: GeneratingRecord) => Boolean(record.capabilityFlags?.reasoning)


// 将后端持久化后的正式资源地址回写到当前记录，避免重复提交 base64 或上游临时链接。
const syncRecordWithPersisted = (record: GeneratingRecord, saved: PersistedGenerationRecord) => {
  record.dbId = saved.id
  record.sessionId = saved.sessionId
  record.sessionTitle = saved.sessionTitle || record.sessionTitle || ''
  record.source = saved.source || record.source || 'generate'
  record.type = isResearchPersistedRecord(saved) || isResearchReportRecord(record)
      ? 'research'
      : (saved.type || record.type)
  record.content = saved.content || record.content
  if (typeof saved.thinkingContent === 'string' && saved.thinkingContent && shouldDisplayThinkingContent(record)) {
    record.thinkingContent = saved.thinkingContent
    if (!record.thinkingStartedAt) {
      record.thinkingStartedAt = Date.now()
    }
    if (saved.done && !record.thinkingEndedAt) {
      record.thinkingEndedAt = Date.now()
    }
  } else if (!shouldDisplayThinkingContent(record)) {
    record.thinkingContent = ''
    record.thinkingStartedAt = undefined
    record.thinkingEndedAt = undefined
  }
  record.error = saved.done || saved.stopped ? saved.error : ''
  record.done = saved.done
  record.stopped = Boolean(saved.stopped)
  const nextRunningStage = record.progressStage === 'stopping'
      ? 'stopping'
      : (record.progressStage || 'queued')
  record.progressStage = saved.done
      ? (saved.stopped ? 'stopped' : saved.error ? 'failed' : 'completed')
      : nextRunningStage
  record.progressMessage = saved.done
      ? resolveTaskStageLabel(
          saved.stopped ? 'stopped' : saved.error ? 'failed' : 'completed',
          saved.stopped ? '任务已停止' : saved.error ? saved.error : '任务已完成',
      )
      : resolveTaskStageLabel(
          nextRunningStage,
          nextRunningStage === 'stopping'
              ? '任务已收到停止指令，正在收口状态'
              : (record.progressMessage || '任务执行中'),
      )
  record.progressPercent = saved.done
      ? 100
      : Math.max(record.progressPercent || 0, mapTaskStageToProgressPercent(record.progressStage))
  record.images = Array.isArray(saved.images) ? [...saved.images] : []
  if (Array.isArray(saved.referenceImages) && saved.referenceImages.length) {
    record.referenceImages = [...saved.referenceImages]
  } else if (!Array.isArray(record.referenceImages)) {
    record.referenceImages = []
  }
  if (saved.agentRun) {
    const nextAgentRunReferenceImages = Array.isArray(saved.agentRun.referenceImages) && saved.agentRun.referenceImages.length
        ? [...saved.agentRun.referenceImages]
        : Array.isArray(record.referenceImages) && record.referenceImages.length
            ? [...record.referenceImages]
            : Array.isArray(record.agentRun?.referenceImages) && record.agentRun.referenceImages.length
                ? [...record.agentRun.referenceImages]
                : []

    record.agentRun = {
      ...saved.agentRun,
      referenceImages: nextAgentRunReferenceImages,
      result: {
        ...saved.agentRun.result,
        images: Array.isArray(saved.agentRun.result?.images)
            ? [...saved.agentRun.result.images]
            : [],
      },
      steps: Array.isArray(saved.agentRun.steps) ? [...saved.agentRun.steps] : [],
      processSections: Array.isArray(saved.agentRun.processSections)
          ? saved.agentRun.processSections.map(section => ({
            ...section,
            paragraphs: Array.isArray(section.paragraphs) ? [...section.paragraphs] : [],
            taskItems: Array.isArray(section.taskItems) ? [...section.taskItems] : [],
          }))
          : [],
    }
    return
  }

  if (record.type === 'agent') {
    record.agentRun = undefined
  }

  if (record.type === 'research') {
    const researchMeta = readResearchRuntimeMeta(saved)
    record.agentRun = undefined
    record.skill = record.skill || RESEARCH_REPORT_SKILL_KEY
    if (Array.isArray(researchMeta?.timeline) && researchMeta.timeline.length && !Array.isArray(record.researchTimeline)) {
      record.researchTimeline = [...researchMeta.timeline]
    } else if (!Array.isArray(record.researchTimeline)) {
      record.researchTimeline = []
    }
    if (Array.isArray(researchMeta?.searchGroups) && researchMeta.searchGroups.length && !Array.isArray(record.researchSearchGroups)) {
      record.researchSearchGroups = [...researchMeta.searchGroups]
    } else if (!Array.isArray(record.researchSearchGroups)) {
      record.researchSearchGroups = []
    }
    if (Array.isArray(researchMeta?.evidences) && researchMeta.evidences.length && !Array.isArray(record.researchEvidences)) {
      record.researchEvidences = [...researchMeta.evidences]
    } else if (!Array.isArray(record.researchEvidences)) {
      record.researchEvidences = []
    }
    if (Array.isArray(researchMeta?.facts) && researchMeta.facts.length && !Array.isArray(record.researchFacts)) {
      record.researchFacts = [...researchMeta.facts]
    } else if (!Array.isArray(record.researchFacts)) {
      record.researchFacts = []
    }
    if (Array.isArray(researchMeta?.outlineSections) && researchMeta.outlineSections.length && !Array.isArray(record.researchOutlineSections)) {
      record.researchOutlineSections = [...researchMeta.outlineSections]
    } else if (!Array.isArray(record.researchOutlineSections)) {
      record.researchOutlineSections = []
    }
    record.researchVerification = record.researchVerification || researchMeta?.verification || null
    record.researchTokenUsage = record.researchTokenUsage || researchMeta?.tokenUsage || null
  }

  syncSessionMetaFromRecord(record, saved)
}

// 用户点击停止后，先在本地切到“停止中”，避免等待接口回包期间像没点到一样。
const markRecordStopping = (record: GeneratingRecord) => {
  record.progressStage = 'stopping'
  record.progressMessage = resolveTaskStageLabel('stopping', '任务已收到停止指令，正在收口状态')
  record.progressPercent = Math.max(record.progressPercent || 0, mapTaskStageToProgressPercent('stopping'))
}

// 立即持久化一条记录；创建与更新都走这里统一收口。
const persistRecordNow = async (record: GeneratingRecord) => {
  if (recordPersistInflight.has(record.id)) return
  recordPersistInflight.add(record.id)

  try {
    if (!record.dbId) {
      const saved = await createGenerationRecordRequest(toGenerationRecordPayload(record))
      syncRecordWithPersisted(record, saved)
      return
    }

    const saved = await updateGenerationRecordRequest(record.dbId, toGenerationRecordPayload(record))
    syncRecordWithPersisted(record, saved)
  } catch {
    // 持久化失败时不影响当前页面的生成流程。
  } finally {
    recordPersistInflight.delete(record.id)
  }
}

// 执行过程中的频繁状态变化走节流更新，减少后端写入次数。
const schedulePersistRecord = (record: GeneratingRecord, immediate = false) => {
  const existingTimer = recordPersistTimers.get(record.id)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  const run = () => {
    recordPersistTimers.delete(record.id)
    void persistRecordNow(record)
  }

  if (immediate) {
    run()
    return
  }

  const timer = setTimeout(run, 200)
  recordPersistTimers.set(record.id, timer)
}

// 处理任务事件流推送，SSE 已直接携带完整记录，不再额外回拉详情。
const handleGenerationTaskStreamEvent = (recordId: string, streamEvent: GenerationTaskStreamEvent | RawTranscriptStreamEvent) => {
  const targetRecord = generatingRecords.value.find(item => item.dbId === recordId)
  if (!targetRecord) {
    return
  }

  let stageConversationChanged = false

  const standardEvent = 'done' in streamEvent ? streamEvent as GenerationTaskStreamEvent : null
  const rawEvent = standardEvent ? null : streamEvent as RawTranscriptStreamEvent

  const eventRecordType = standardEvent && isResearchPersistedRecord(standardEvent.record) ? 'research' : standardEvent?.record?.type
  if (standardEvent?.record) {
    syncRecordWithPersisted(targetRecord, standardEvent.record)
  }

  const isImageTaskRecord = targetRecord.type === 'image'
  const isResearchTaskRecord = targetRecord.type === 'research'
      || eventRecordType === 'research'
      || targetRecord.skill === RESEARCH_REPORT_SKILL_KEY

  if (isResearchTaskRecord && rawEvent?.type === 'text') {
    const reasoningContent = typeof rawEvent.reasoningContent === 'string' ? rawEvent.reasoningContent.trim() : ''
    if (reasoningContent) {
      pushResearchTimeline(targetRecord, {
        id: rawEvent.id ? `event-${rawEvent.id}` : `raw-reasoning-${Date.now()}`,
        kind: 'reasoning',
        title: '阶段性推理',
        description: reasoningContent.split('\n').map(item => item.trim()).filter(Boolean).slice(0, 3).join('；'),
        stage: targetRecord.progressStage || 'intake',
      }, {
        appendMode: 'always',
      })
    }

    if (rawEvent.role === 'assistant' && typeof rawEvent.content === 'string' && rawEvent.content.trim()) {
      targetRecord.error = ''
      targetRecord.content = rawEvent.content
      targetRecord.progressStage = targetRecord.progressStage || 'report_writing'
      targetRecord.progressMessage = resolveTaskStageLabel(targetRecord.progressStage, '研究报告生成中')
      targetRecord.progressPercent = Math.max(
          targetRecord.progressPercent || 0,
          mapTaskStageToProgressPercent(targetRecord.progressStage),
      )
    }
  }

  if (isResearchTaskRecord && rawEvent?.type === 'begin') {
    const rawContent = rawEvent.content && typeof rawEvent.content === 'object'
      ? rawEvent.content as Record<string, unknown>
      : null
    targetRecord.error = ''
    targetRecord.progressStage = 'intake'
    targetRecord.progressMessage = resolveTaskStageLabel('intake', '研究任务已开始')
    targetRecord.progressPercent = Math.max(
        targetRecord.progressPercent || 0,
        mapTaskStageToProgressPercent('intake'),
    )
    pushResearchTimeline(targetRecord, {
      id: rawEvent.id ? `event-${rawEvent.id}` : 'raw-research-begin',
      kind: 'begin',
      title: String(rawContent?.title || '研究任务已开始').trim() || '研究任务已开始',
      description: String(rawContent?.summary || rawEvent.role || '').trim(),
      stage: 'intake',
    }, {
      appendMode: 'always',
    })
  }

  if (isResearchTaskRecord && rawEvent?.type === 'tool_call') {
    const rawContent = rawEvent.content && typeof rawEvent.content === 'object'
      ? rawEvent.content as Record<string, unknown>
      : null
    const toolName = String(rawContent?.name || rawEvent.toolName || '').trim()
    const rawToolId = String(rawContent?.id || rawEvent.toolCallId || rawEvent.id || '').trim()
    const parameters = rawContent?.parameters && typeof rawContent.parameters === 'object'
      ? rawContent.parameters as Record<string, unknown>
      : {}
    const toolDescription = toolName === 'web-reader'
      ? String(parameters.url || '').trim()
      : String(parameters.query || '').trim()

    if (toolName) {
      targetRecord.error = ''
      pushResearchTimeline(targetRecord, {
        id: rawToolId || (rawEvent.id ? `event-${rawEvent.id}` : `raw-tool-call-${Date.now()}`),
        kind: 'tool_call',
        title: `调用${describeResearchTool(toolName)}`,
        description: toolDescription,
        stage: targetRecord.progressStage || 'parallel_search',
        meta: {
          toolId: rawToolId,
          ...(toolName === 'web-search' ? { query: toolDescription } : {}),
          ...(toolName === 'web-reader' ? { url: toolDescription } : {}),
        },
      }, {
        appendMode: 'always',
      })
      if (toolName === 'web-search' && rawToolId && toolDescription) {
        upsertResearchSearchPendingGroup(targetRecord, rawToolId, toolDescription)
      }
    }
  }

  if (isResearchTaskRecord && rawEvent?.type === 'tool_result') {
    const rawToolName = String(rawEvent.toolName || '').trim()
    enqueueResearchUiReveal(targetRecord, () => {
      if (rawToolName === 'web-search') {
        mergeRawResearchSearchGroup(targetRecord, rawEvent)
      }
      pushResearchTimeline(targetRecord, {
        id: rawEvent.id ? `event-${rawEvent.id}` : `raw-tool-result-${Date.now()}`,
        kind: 'tool_result',
        title: `${describeResearchTool(rawToolName || 'web-search')}完成`,
        description: rawToolName === 'web-search'
          ? `返回 ${Array.isArray(rawEvent.content) ? rawEvent.content.length : 0} 条结果`
          : '',
        stage: targetRecord.progressStage || 'parallel_search',
        meta: rawEvent.toolCallId ? { toolId: rawEvent.toolCallId } : undefined,
      }, {
        appendMode: 'always',
      })
    })
  }

  if (isResearchTaskRecord && rawEvent?.type === 'token_usage') {
    const rawUsage = rawEvent.content && typeof rawEvent.content === 'object'
      ? rawEvent.content as Record<string, unknown>
      : null
    const tokenUsage = {
      inputTokens: Number(rawUsage?.prompt_tokens || 0),
      outputTokens: Number(rawUsage?.completion_tokens || 0),
      totalTokens: Number(rawUsage?.total_tokens || 0),
    }
    if (tokenUsage.totalTokens > 0) {
      targetRecord.researchTokenUsage = tokenUsage
        pushResearchTimeline(targetRecord, {
          id: rawEvent.id ? `event-${rawEvent.id}` : 'raw-token-usage',
          kind: 'usage',
          title: '模型消耗已更新',
          description: `总计 ${tokenUsage.totalTokens} tokens`,
          stage: targetRecord.progressStage || 'report_writing',
        }, {
          appendMode: 'always',
        })
    }
  }

  if (isResearchTaskRecord && rawEvent?.type === 'end') {
    targetRecord.researchVerificationPending = false
    targetRecord.done = true
    targetRecord.stopped = false
    targetRecord.progressStage = 'completed'
    targetRecord.progressMessage = resolveTaskStageLabel('completed', '研究任务已完成')
    targetRecord.progressPercent = 100
  }

  if (!standardEvent) {
    if (isResearchTaskRecord) {
      schedulePersistRecord(targetRecord, rawEvent?.type === 'end')
    }
    return
  }

  const event = standardEvent

  if (event.type === 'progress' && event.message) {
    targetRecord.error = ''
    targetRecord.progressStage = event.stage || targetRecord.progressStage || 'queued'
    targetRecord.progressMessage = resolveTaskStageLabel(event.stage, event.message)
    targetRecord.progressPercent = Math.max(
        targetRecord.progressPercent || 0,
        mapTaskStageToProgressPercent(event.stage),
    )
    if (isImageTaskRecord) {
      stageConversationChanged = upsertRecordStageConversation(
          targetRecord,
          targetRecord.progressStage || event.stage || 'queued',
          `${targetRecord.progressMessage}：${event.message}`,
      ) || stageConversationChanged
    }
  }

  if (event.type === 'content_delta') {
    targetRecord.error = ''
    if (typeof event.content === 'string') {
      targetRecord.content = event.content
    } else if (typeof event.delta === 'string') {
      targetRecord.content += event.delta
    }
    targetRecord.progressStage = event.stage || targetRecord.progressStage || 'receiving_upstream_result'
    targetRecord.progressMessage = resolveTaskStageLabel(event.stage, '内容生成中')
  }

  if (event.type === 'thinking_delta') {
    if (!shouldDisplayThinkingContent(targetRecord)) {
      targetRecord.thinkingContent = ''
      targetRecord.thinkingStartedAt = undefined
      targetRecord.thinkingEndedAt = undefined
      return
    }
    targetRecord.error = ''
    if (typeof event.thinkingContent === 'string') {
      targetRecord.thinkingContent = event.thinkingContent
    } else if (typeof event.thinkingDelta === 'string') {
      targetRecord.thinkingContent = (targetRecord.thinkingContent || '') + event.thinkingDelta
    }
    if (!targetRecord.thinkingStartedAt) {
      targetRecord.thinkingStartedAt = Date.now()
    }
    targetRecord.progressStage = event.stage || targetRecord.progressStage || 'receiving_upstream_thinking'
    targetRecord.progressMessage = resolveTaskStageLabel(event.stage, '模型正在深度思考')
  }

  if (event.type === 'stage_changed') {
    targetRecord.error = ''
    targetRecord.progressStage = event.stage || event.researchStage?.stage || targetRecord.progressStage || 'queued'
    targetRecord.progressMessage = resolveTaskStageLabel(
        targetRecord.progressStage,
        event.message || event.researchStage?.message || '研究任务执行中',
    )
    targetRecord.progressPercent = Math.max(
        targetRecord.progressPercent || 0,
        mapTaskStageToProgressPercent(targetRecord.progressStage),
    )
    if (isResearchTaskRecord) {
      pushResearchTimeline(targetRecord, {
        id: event.id ? `event-${event.id}` : undefined,
        kind: 'stage',
        title: resolveTaskStageLabel(targetRecord.progressStage, '研究阶段更新'),
        description: event.message || event.researchStage?.message || '',
        stage: targetRecord.progressStage,
      }, {
        appendMode: 'always',
      })
    }
  }

  if (
      event.type === 'tool_call'
      || event.type === 'tool_result'
      || event.type === 'reasoning_summary'
      || event.type === 'evidence_added'
      || event.type === 'fact_update'
      || event.type === 'verification'
      || event.type === 'outline_ready'
      || event.type === 'token_usage'
      || event.type === 'begin'
  ) {
    targetRecord.error = ''
    targetRecord.progressStage = event.stage || targetRecord.progressStage || 'queued'
    targetRecord.progressMessage = resolveTaskStageLabel(
        targetRecord.progressStage,
        event.message || '研究任务执行中',
    )
    targetRecord.progressPercent = Math.max(
        targetRecord.progressPercent || 0,
        mapTaskStageToProgressPercent(targetRecord.progressStage),
    )
    if (isResearchTaskRecord) {
      if (event.type === 'begin') {
        pushResearchTimeline(targetRecord, {
          id: event.id ? `event-${event.id}` : 'research-begin',
          kind: 'begin',
          title: event.researchBegin?.title || '研究任务已开始',
          description: event.researchBegin?.subject || event.message || '',
          stage: targetRecord.progressStage,
        }, {
          appendMode: 'always',
        })
      } else if (event.type === 'reasoning_summary' && event.reasoningSummary) {
        pushResearchTimeline(targetRecord, {
          id: event.id ? `event-${event.id}` : undefined,
          kind: 'reasoning',
          title: event.message || '完成阶段性推理',
          description: [
            event.reasoningSummary.goal,
            ...(event.reasoningSummary.nextActions || []).slice(0, 2),
          ].filter(Boolean).join('；'),
          stage: event.reasoningSummary.stage,
        }, {
          appendMode: 'always',
        })
      } else if (event.type === 'tool_call' && event.toolCall) {
        const toolDescription = event.toolCall.toolName === 'web-reader'
          ? String(event.toolCall.parameters?.url || event.message || '').trim()
          : String(event.toolCall.parameters?.query || event.message || '').trim()
        pushResearchTimeline(targetRecord, {
          id: event.id ? `event-${event.id}` : event.toolCall.id,
          kind: 'tool_call',
          title: `调用${describeResearchTool(event.toolCall.toolName)}`,
          description: toolDescription,
          stage: targetRecord.progressStage,
          meta: event.toolCall.toolName === 'web-reader'
            ? {
              toolId: event.toolCall.id,
              url: String(event.toolCall.parameters?.url || '').trim(),
            }
            : event.toolCall.toolName === 'web-search'
              ? {
                toolId: event.toolCall.id,
                query: String(event.toolCall.parameters?.query || '').trim(),
              }
              : {
                toolId: event.toolCall.id,
              },
        }, {
          appendMode: 'always',
        })
      } else if (event.type === 'tool_result' && event.toolResult) {
        const toolResult = event.toolResult
        const eventId = event.id
        const eventMessage = event.message
        const progressStage = targetRecord.progressStage
        enqueueResearchUiReveal(targetRecord, () => {
          mergeResearchSearchGroup(targetRecord, toolResult)
          pushResearchTimeline(targetRecord, {
            id: eventId ? `event-${eventId}` : `result-${toolResult.id}`,
            kind: 'tool_result',
            title: `${describeResearchTool(toolResult.toolName)}完成`,
            description: readResearchPreviewDescription(toolResult.preview) || eventMessage || '',
            stage: progressStage,
            meta: toolResult.toolName === 'web-reader'
              ? {
                ...(readResearchPreviewMeta(toolResult.preview) || {}),
                toolId: toolResult.id,
              }
              : undefined,
          }, {
            appendMode: 'always',
          })
        })
      } else if (event.type === 'evidence_added' && event.evidence) {
        const evidence = event.evidence
        const eventId = event.id
        const progressStage = targetRecord.progressStage
        enqueueResearchUiReveal(targetRecord, () => {
          mergeResearchEvidence(targetRecord, evidence)
          pushResearchTimeline(targetRecord, {
            id: eventId ? `event-${eventId}` : `evidence-${evidence.id}`,
            kind: 'evidence',
            title: '新增信源',
            description: evidence.summary || evidence.title || evidence.source?.title || '',
            stage: progressStage,
            confidence: evidence.confidence,
            meta: {
              title: evidence.title || evidence.source?.title || '',
              url: evidence.source?.url || '',
              excerpt: evidence.summary || '',
              siteName: evidence.source?.note || evidence.source?.sourceType || '',
            },
          }, {
            appendMode: 'always',
          })
        })
      } else if (event.type === 'fact_update' && event.fact) {
        const fact = event.fact
        const eventId = event.id
        const progressStage = targetRecord.progressStage
        enqueueResearchUiReveal(targetRecord, () => {
          mergeResearchFact(targetRecord, fact)
          pushResearchTimeline(targetRecord, {
            id: eventId ? `event-${eventId}` : `fact-${fact.id}`,
            kind: 'fact',
            title: '更新事实',
            description: fact.statement,
            stage: progressStage,
            confidence: fact.confidence,
          }, {
            appendMode: 'always',
          })
        })
      } else if (event.type === 'verification' && event.verification) {
        targetRecord.researchVerificationPending = false
        targetRecord.researchVerification = event.verification
        pushResearchTimeline(targetRecord, {
          id: event.id ? `event-${event.id}` : 'verification',
          kind: 'verification',
          title: '完成事实核查',
          description: `已核查 ${event.verification.checkedFacts} 条事实`,
          stage: targetRecord.progressStage,
        }, {
          appendMode: 'always',
        })
      } else if (event.type === 'outline_ready' && event.outline) {
        targetRecord.researchOutlineSections = [...(event.outline.sections || [])]
        pushResearchTimeline(targetRecord, {
          id: event.id ? `event-${event.id}` : 'outline-ready',
          kind: 'outline',
          title: '报告大纲已生成',
          description: `共 ${event.outline.sections?.length || 0} 个章节`,
          stage: targetRecord.progressStage,
        }, {
          appendMode: 'always',
        })
      } else if (event.type === 'token_usage' && event.tokenUsage) {
        targetRecord.researchTokenUsage = event.tokenUsage
        pushResearchTimeline(targetRecord, {
          id: event.id ? `event-${event.id}` : 'token-usage',
          kind: 'usage',
          title: '模型消耗已更新',
          description: `总计 ${event.tokenUsage.totalTokens} tokens`,
          stage: targetRecord.progressStage,
        }, {
          appendMode: 'always',
        })
      }
    }
  }

  if (event.type === 'section_delta') {
    targetRecord.error = ''
    const nextDelta = typeof event.sectionDelta?.delta === 'string'
        ? event.sectionDelta.delta
        : typeof event.content === 'string'
            ? event.content
            : typeof event.delta === 'string'
                ? event.delta
                : ''
    if (nextDelta) {
      targetRecord.content += nextDelta
    }
    targetRecord.progressStage = event.stage || targetRecord.progressStage || 'report_writing'
    targetRecord.progressMessage = resolveTaskStageLabel(event.stage, event.message || '研究报告写作中')
    targetRecord.progressPercent = Math.max(
        targetRecord.progressPercent || 0,
        mapTaskStageToProgressPercent(event.stage),
    )
    if (isResearchTaskRecord && nextDelta) {
      pushResearchTimeline(targetRecord, {
        id: event.id ? `event-${event.id}` : `section-${event.sectionDelta?.sectionId || targetRecord.content.length}`,
        kind: 'section',
        title: event.sectionDelta?.title || '写入报告章节',
        description: '报告正文正在流式生成',
        stage: targetRecord.progressStage,
      })
    }
  }

  if (event.type === 'agent_event' && targetRecord.agentRun && event.agentEvent) {
    targetRecord.error = ''
    if (!event.record) {
      targetRecord.agentRun = applyAgentWorkspaceEvent(targetRecord.agentRun, event.agentEvent as AgentWorkspaceEvent)
    }
    targetRecord.progressStage = event.stage || targetRecord.progressStage || 'agent_workspace_running'
    targetRecord.progressMessage = resolveTaskStageLabel(event.stage, event.message || '技能任务执行中')
  }

  if (event.type === 'connected' && event.message) {
    targetRecord.error = ''
    targetRecord.progressStage = event.stage || targetRecord.progressStage || (isResearchTaskRecord ? 'intake' : 'queued')
    targetRecord.progressMessage = resolveTaskStageLabel(event.stage, isResearchTaskRecord ? '研究任务连接中' : '造梦中')
    targetRecord.progressPercent = Math.max(
        targetRecord.progressPercent || 0,
        mapTaskStageToProgressPercent(event.stage),
    )
    if (isImageTaskRecord) {
      stageConversationChanged = upsertRecordStageConversation(
          targetRecord,
          targetRecord.progressStage || event.stage || 'queued',
          event.message,
      ) || stageConversationChanged
    }
  }

  if (event.type === 'completed') {
    targetRecord.researchVerificationPending = false
    targetRecord.progressStage = 'completed'
    targetRecord.progressMessage = resolveTaskStageLabel('completed', event.message || (isResearchTaskRecord ? '研究报告已完成' : '图片生成完成'))
    targetRecord.progressPercent = 100
    if (targetRecord.thinkingStartedAt && !targetRecord.thinkingEndedAt) {
      targetRecord.thinkingEndedAt = Date.now()
    }
    if (isImageTaskRecord) {
      stageConversationChanged = upsertRecordStageConversation(
          targetRecord,
          'completed',
          `${targetRecord.progressMessage}：${event.message || '图片生成完成'}`,
      ) || stageConversationChanged
    }
    if (isResearchTaskRecord) {
      pushResearchTimeline(targetRecord, {
        id: event.id ? `event-${event.id}` : 'research-completed',
        kind: 'completed',
        title: '研究报告已完成',
        description: event.message || '',
        stage: 'completed',
      })
    }
  } else if (event.type === 'failed') {
    targetRecord.researchVerificationPending = false
    targetRecord.progressStage = 'failed'
    targetRecord.progressMessage = resolveTaskStageLabel('failed', event.message || '任务执行失败')
    targetRecord.progressPercent = 100
    if (isImageTaskRecord) {
      stageConversationChanged = upsertRecordStageConversation(
          targetRecord,
          'failed',
          `${targetRecord.progressMessage}：${event.message || '任务执行失败'}`,
      ) || stageConversationChanged
    }
    if (isResearchTaskRecord) {
      pushResearchTimeline(targetRecord, {
        id: event.id ? `event-${event.id}` : 'research-failed',
        kind: 'failed',
        title: '研究任务失败',
        description: event.message || '',
        stage: 'failed',
      })
    }
  } else if (event.type === 'stopped') {
    targetRecord.researchVerificationPending = false
    targetRecord.progressStage = 'stopped'
    targetRecord.progressMessage = resolveTaskStageLabel('stopped', event.message || '任务已停止')
    targetRecord.progressPercent = 100
    if (isImageTaskRecord) {
      stageConversationChanged = upsertRecordStageConversation(
          targetRecord,
          'stopped',
          `${targetRecord.progressMessage}：${event.message || '任务已停止'}`,
      ) || stageConversationChanged
    }
    if (isResearchTaskRecord) {
      pushResearchTimeline(targetRecord, {
        id: event.id ? `event-${event.id}` : 'research-stopped',
        kind: 'stopped',
        title: '研究任务已停止',
        description: event.message || '',
        stage: 'stopped',
      })
    }
  }

  // 终止态（completed/failed/stopped，event.done=true）的最终 record 已由 SSE 带回并通过
  // syncRecordWithPersisted 同步到本地，无需再 PATCH 回写。回写会触发服务端二次
  // normalizeOutputs + 事务 + outputs 重建 + 资产同步，纯属冗余。仅在中间态持久化阶段对话。
  if ((stageConversationChanged || isResearchTaskRecord) && !event.done) {
    schedulePersistRecord(targetRecord)
  }

  if (event.done) {
    const controller = taskStreamControllers.get(recordId)
    if (controller) {
      controller.abort()
      taskStreamControllers.delete(recordId)
    }
  }
}

// 连接单个任务的 SSE 事件流，断线后自动重连，直到任务完成。
const connectGenerationTaskStream = (record: GeneratingRecord) => {
  if (!record.dbId || record.done) {
    return
  }

  if (taskStreamControllers.has(record.dbId)) {
    return
  }

  const controller = new AbortController()
  taskStreamControllers.set(record.dbId, controller)

  void (async () => {
    try {
      await subscribeGenerationTaskEvents(record.dbId!, {
        signal: controller.signal,
        onEvent: (event) => {
          handleGenerationTaskStreamEvent(record.dbId!, event)
        },
      })
    } catch {
      if (controller.signal.aborted) {
        return
      }
      const latestRecord = generatingRecords.value.find(item => item.dbId === record.dbId)
      if (latestRecord && !latestRecord.done) {
        taskStreamControllers.delete(record.dbId!)
        setTimeout(() => {
          connectGenerationTaskStream(latestRecord)
        }, 1500)
        return
      }
    }

    if (taskStreamControllers.get(record.dbId!) === controller) {
      taskStreamControllers.delete(record.dbId!)
    }
  })()
}

// 首屏加载最近的生成记录，用于刷新后回放历史。
const loadPersistedGeneratingRecords = async () => {
  try {
    if (!authStore.isLoggedIn.value) {
      generatingRecords.value = []
      return
    }

    const records = await listGenerationRecordsRequest()
    if (!records.length) return

    const existingDbIds = new Set(
        generatingRecords.value
            .map(item => item.dbId)
            .filter((id): id is string => Boolean(id)),
    )

    const nextRecords = records
        .filter(record => (record.source || 'generate') === 'generate')
        .filter(record => !existingDbIds.has(record.id))
        .map(createRecordFromPersisted)

    if (!nextRecords.length) return

    generatingRecords.value = [...generatingRecords.value, ...nextRecords]
    nextRecords.forEach(connectGenerationTaskStream)
  } catch {
    // 数据库未配置或接口失败时，继续使用前端内存态。
  }
}


const ensureCurrentGenerationSession = async () => {
  if (!authStore.isLoggedIn.value) {
    return null
  }

  if (!generationSessions.value.length) {
    await loadPersistedGenerationSessions()
  }

  if (currentSessionId.value) {
    const matchedSession = generationSessions.value.find(session => session.id === currentSessionId.value)
    if (matchedSession) {
      return matchedSession
    }
  }

  const defaultSession = generationSessions.value.find(session => session.isDefault) || generationSessions.value[0]
  if (defaultSession) {
    applyCurrentSessionId(defaultSession.id)
    return defaultSession
  }

  await loadPersistedGenerationSessions()
  const reloadedDefaultSession = generationSessions.value.find(session => session.isDefault) || generationSessions.value[0]
  if (reloadedDefaultSession) {
    applyCurrentSessionId(reloadedDefaultSession.id)
    return reloadedDefaultSession
  }

  return null
}

const touchSessionAfterRecordCreated = (sessionId: string) => {
  const now = new Date().toISOString()
  generationSessions.value = generationSessions.value
      .map((session) => {
        if (session.id !== sessionId) {
          return session
        }
        return {
          ...session,
          lastRecordAt: now,
          updatedAt: now,
          recordCount: Number(session.recordCount || 0) + 1,
        }
      })
      .sort((left, right) => {
        if (left.isDefault !== right.isDefault) {
          return left.isDefault ? -1 : 1
        }
        return new Date(right.lastRecordAt || right.updatedAt).getTime() - new Date(left.lastRecordAt || left.updatedAt).getTime()
      })
}

// 生成记录回写后直接更新本地会话元数据，避免再次请求会话列表造成闪动。
const syncSessionMetaFromRecord = (record: GeneratingRecord, saved: PersistedGenerationRecord) => {
  const sessionId = String(saved.sessionId || record.sessionId || '').trim()
  if (!sessionId) {
    return
  }

  const nextCoverImageUrl = String(saved.images?.[0] || record.images?.[0] || '').trim()
  generationSessions.value = generationSessions.value.map((session) => {
    if (session.id !== sessionId) {
      return session
    }
    return {
      ...session,
      title: saved.sessionTitle || record.sessionTitle || session.title,
      coverImageUrl: nextCoverImageUrl || session.coverImageUrl,
    }
  })
}

// 处理发送事件
const handleSend = async (message: string, type: CreationType, options?: { model?: string, modelKey?: string, ratio?: string, resolution?: string, duration?: string, feature?: string, skill?: string, referenceImages?: string[], count?: number, capabilityFlags?: ModelCapabilityFlags }) => {
  if (!authStore.isLoggedIn.value) {
    openLoginModal('generate-send-guard')
    return
  }

  const activeSession = await ensureCurrentGenerationSession()
  if (!activeSession) {
    return
  }

  const recordId = nextId++
  const normalizedSkill = String(options?.skill || 'general').trim() || 'general'
  const isResearchReport = type === 'agent' && normalizedSkill === RESEARCH_REPORT_SKILL_KEY
  const recordType: GenerationRecordType = isResearchReport ? 'research' : type
  const modelCategory = recordType === 'image'
      ? 'IMAGE'
      : recordType === 'video'
        ? 'VIDEO'
        : 'CHAT'
  const record: GeneratingRecord = {
    id: recordId,
    sessionId: activeSession.id,
    sessionTitle: activeSession.title,
    source: 'generate',
    type: recordType,
    prompt: message,
    time: formatGroupLabel(new Date()),
    model: options?.model || resolveModelLabel(options?.modelKey || '', modelCategory) || '',
    modelKey: options?.modelKey || '',
    referenceImages: options?.referenceImages || [],
    ratio: options?.ratio || '',
    resolution: options?.resolution || '',
    duration: options?.duration || '',
    feature: options?.feature || '',
    skill: normalizedSkill,
    count: recordType === 'image' ? (options?.count && options.count > 0 ? options.count : 1) : undefined,
    capabilityFlags: options?.capabilityFlags || undefined,
    content: recordType === 'image' ? '[[queued]]任务已创建，等待服务端执行' : '',
    images: [],
    done: false,
    stopped: false,
    progressStage: recordType === 'image' ? 'queued' : recordType === 'research' ? 'intake' : undefined,
    progressMessage: recordType === 'image'
        ? resolveTaskStageLabel('queued', '任务已创建，等待服务端执行')
        : recordType === 'research'
          ? resolveTaskStageLabel('intake', '研究任务已创建，等待服务端执行')
          : undefined,
    progressPercent: recordType === 'image' ? 5 : recordType === 'research' ? 8 : 0,
    error: '',
    agentRun: recordType === 'agent' && shouldUseAgentWorkspaceFlow(normalizedSkill)
        ? buildAgentPendingRun(
            recordId,
            message,
            normalizedSkill,
            Array.isArray(options?.referenceImages) ? options.referenceImages : [],
        )
        : undefined,
    researchTimeline: recordType === 'research'
        ? [{
          id: `research-created-${recordId}`,
          kind: 'begin',
          title: '研究任务已创建',
          description: '正在等待服务端执行深度研究',
          stage: 'intake',
          time: formatResearchTimelineTime(),
        }]
        : [],
    researchSearchGroups: [],
    researchEvidences: [],
    researchFacts: [],
    researchOutlineSections: [],
    researchVerification: null,
    researchTokenUsage: null,
  }

  generatingRecords.value.unshift(record)
  touchSessionAfterRecordCreated(activeSession.id)

  // 根据类型触发不同的生成逻辑
  if (record.type === 'research') {
    void startResearchTask(generatingRecords.value[0])
  } else if (record.type === 'agent') {
    if (record.agentRun) {
      void startWorkspaceAgentTask(generatingRecords.value[0])
    } else {
      void startGeneralAgentTask(generatingRecords.value[0])
    }
  } else if (record.type === 'image') {
    // 一次对话内按用户设定的 count 生成 N 张图：单条 record 携带 N 个 GenerationOutput。
    void startImageGenerationTask(generatingRecords.value[0])
  }
}

// 技能工作台同样改为服务端任务，由后端持续推送结构化阶段事件。
const startWorkspaceAgentTask = async (record: GeneratingRecord) => {
  try {
    const { providerId, modelKey: currentModelKey } = resolveGenerationTaskModel({
      modelKey: record.modelKey,
      fallbackModelKey: getAgentModel(),
      category: 'CHAT',
      missingModelMessage: '缺少对话模型标识',
    })

    const saved = await createGenerationTask({
      sessionId: record.sessionId,
      source: 'generate',
      type: 'agent',
      prompt: record.prompt,
      model: record.model,
      modelKey: currentModelKey,
      skill: record.skill,
      referenceImages: Array.isArray(record.referenceImages) ? [...record.referenceImages] : [],
      requestBody: {
        providerId,
        model: currentModelKey,
        messages: buildAgentRequestMessages(record),
        stream: true,
        ...(record.capabilityFlags && Object.keys(record.capabilityFlags).length
          ? { [CAPABILITY_FLAGS_REQUEST_FIELD]: record.capabilityFlags }
          : {}),
      },
    })

    syncRecordWithPersisted(record, saved)
    connectGenerationTaskStream(record)
  } catch (error: unknown) {
    record.done = true
    record.stopped = false
    record.error = formatGenerationError(error instanceof Error ? error.message : '', '技能任务生成失败')
    schedulePersistRecord(record, true)
  }
}

// 通用 AI 对话同样提交到服务端任务，由后端持续执行并通过 SSE 回推文本增量。
const startGeneralAgentTask = async (record: GeneratingRecord) => {
  try {
    const { providerId, modelKey: currentModelKey } = resolveGenerationTaskModel({
      modelKey: record.modelKey,
      fallbackModelKey: getAgentModel(),
      category: 'CHAT',
      missingModelMessage: '缺少对话模型标识',
    })

    const saved = await createGenerationTask({
      sessionId: record.sessionId,
      source: 'generate',
      type: 'agent',
      prompt: record.prompt,
      model: record.model,
      modelKey: currentModelKey,
      skill: record.skill,
      referenceImages: Array.isArray(record.referenceImages) ? [...record.referenceImages] : [],
      requestBody: {
        providerId,
        model: currentModelKey,
        messages: buildAgentRequestMessages(record),
        stream: true,
        ...(record.capabilityFlags && Object.keys(record.capabilityFlags).length
          ? { [CAPABILITY_FLAGS_REQUEST_FIELD]: record.capabilityFlags }
          : {}),
      },
    })

    syncRecordWithPersisted(record, saved)
    connectGenerationTaskStream(record)
  } catch (error: unknown) {
    record.done = true
    record.stopped = false
    record.error = formatGenerationError(error instanceof Error ? error.message : '', '对话生成失败')
    schedulePersistRecord(record, true)
  }
}

// 深度研究报告复用 generate 对话入口，提交到 research-report 策略执行。
const startResearchTask = async (
  record: GeneratingRecord,
  options?: {
    manualVerificationSource?: GeneratingRecord | null
  },
) => {
  try {
    await Promise.all([
      loadPublicModelCatalog(),
      loadPublicSkillCatalog(),
    ])
    const researchSkillConfig = readResearchSkillConfig()
    const modelBinding = readResearchModelBindingConfig(researchSkillConfig)
    const searchConfig = readResearchSearchConfig(researchSkillConfig)
    const configuredModelKey = modelBinding.modelKey || record.modelKey
    const configuredModel = configuredModelKey ? findCatalogModel(configuredModelKey, 'CHAT') : null
    const { providerId, modelKey: currentModelKey } = resolveGenerationTaskModel({
      modelKey: configuredModel?.selectionKey || configuredModelKey || record.modelKey,
      fallbackModelKey: getAgentModel(),
      category: 'CHAT',
      missingModelMessage: '缺少研究模型标识',
    })
    const currentProviderId = modelBinding.providerId || providerId
    const verificationSource = options?.manualVerificationSource || null
    const isManualVerification = Boolean(verificationSource)

    const saved = await createGenerationTask({
      sessionId: record.sessionId,
      source: 'generate',
      type: 'research',
      prompt: record.prompt,
      model: record.model || resolveModelLabel(currentModelKey, 'CHAT'),
      modelKey: currentModelKey,
      skill: RESEARCH_REPORT_SKILL_KEY,
      referenceImages: Array.isArray(record.referenceImages) ? [...record.referenceImages] : [],
      researchConfig: {
        outputType: 'report',
        requireVerification: isManualVerification,
      },
      requestBody: {
        providerId: currentProviderId,
        model: currentModelKey,
        stream: true,
        ...(isManualVerification && verificationSource
          ? {
            manualVerification: {
              subject: verificationSource.prompt,
              report: verificationSource.content,
              evidences: verificationSource.researchEvidences || [],
              facts: verificationSource.researchFacts || [],
            },
          }
          : {}),
        ...(searchConfig.provider ? { researchSearchProvider: searchConfig.provider } : {}),
        ...(searchConfig.providerId ? { researchSearchProviderId: searchConfig.providerId } : {}),
        ...(searchConfig.model ? { researchSearchModel: searchConfig.model } : {}),
        ...(record.capabilityFlags && Object.keys(record.capabilityFlags).length
          ? { [CAPABILITY_FLAGS_REQUEST_FIELD]: record.capabilityFlags }
          : {}),
      },
    })

    syncRecordWithPersisted(record, saved)
    connectGenerationTaskStream(record)
  } catch (error: unknown) {
    const errorMessage = formatGenerationError(error instanceof Error ? error.message : '', '研究任务生成失败')
    record.researchVerificationPending = false
    record.done = true
    record.stopped = false
    record.progressStage = 'failed'
    record.progressMessage = resolveTaskStageLabel('failed', errorMessage)
    record.progressPercent = 100
    record.error = errorMessage
    pushResearchTimeline(record, {
      kind: 'failed',
      title: '研究任务失败',
      description: errorMessage,
      stage: 'failed',
    })
    schedulePersistRecord(record, true)
  }
}

// 图片生成改为提交服务端任务，由后端继续执行并写回生成记录。
const startImageGenerationTask = async (record: GeneratingRecord) => {
  try {
    const { providerId, modelKey: requestModelKey } = resolveGenerationTaskModel({
      modelKey: record.modelKey,
      category: 'IMAGE',
      missingModelMessage: '未匹配到有效图片模型，请先检查后台模型配置',
    })

    const modelConfig = getModelByName(record.modelKey || requestModelKey) as ImageModel | null
    const size = modelConfig?.sizes?.length
        ? (modelConfig.sizes.find((sizeItem: string) => sizeItem.includes(record.ratio.replace(':', 'x'))) || modelConfig.defaultParams?.size || '')
        : (record.ratio ? record.ratio.replace(':', 'x') : '')
    const hasReferenceImages = Array.isArray(record.referenceImages) && record.referenceImages.length > 0
    // 单次 n 上限来自 capabilityJson.maxImagesPerRequest（后台可配置；不同上游限制不一致：
    // gpt-image-2 = 4，dall-e-3 = 1，dall-e-2 = 10）。未配置时落到保守值 1。
    const modelMaxImages = Number((modelConfig as { maxImagesPerRequest?: number } | null)?.maxImagesPerRequest)
    const upperBound = Number.isFinite(modelMaxImages) && modelMaxImages >= 1 ? Math.floor(modelMaxImages) : 1
    const requestCount = record.count && record.count > 0
      ? Math.min(upperBound, Math.max(1, Math.floor(record.count)))
      : 1
    let data: any = {
      model: requestModelKey,
      prompt: record.prompt,
      // n：文生图直传上游；count：图生图 FormData 归一化时使用。后端按场景取用其一。
      n: requestCount,
      count: requestCount,
      providerId,
    }
    if (size) {
      data.size = size
    }
    if (!hasReferenceImages) {
      data = appendImageReferencesToRequestBody(data, record.referenceImages)
    }

    const saved = await createGenerationTask({
      sessionId: record.sessionId,
      source: 'generate',
      type: 'image',
      requestMode: hasReferenceImages ? 'image-edit' : 'image-generation',
      prompt: record.prompt,
      model: record.model,
      modelKey: requestModelKey,
      ratio: record.ratio,
      resolution: record.resolution,
      duration: record.duration,
      feature: record.feature,
      skill: record.skill,
      referenceImages: Array.isArray(record.referenceImages) ? [...record.referenceImages] : [],
      requestBody: data,
    })

    syncRecordWithPersisted(record, saved)
    connectGenerationTaskStream(record)
  } catch (error: unknown) {
    record.done = true
    record.stopped = false
    record.progressStage = 'failed'
    record.progressMessage = resolveTaskStageLabel(
        'failed',
        formatGenerationError(error instanceof Error ? error.message : '', '图片生成失败'),
    )
    record.progressPercent = 100
    record.error = formatGenerationError(error instanceof Error ? error.message : '', '图片生成失败')
  }
}

// 图片生成支持跨页面中断；只要服务端任务仍在运行，就能远程停止。
const handleStopImageGeneration = async (record: GeneratingRecord) => {
  if (record.done) return
  if (!record.dbId) return

  try {
    markRecordStopping(record)
    const saved = await stopGenerationTask(record.dbId)
    syncRecordWithPersisted(record, saved)
    const controller = taskStreamControllers.get(record.dbId)
    if (controller) {
      controller.abort()
      taskStreamControllers.delete(record.dbId)
    }
  } catch {
    // 停止失败时保持当前状态，等待 SSE 或后续同步刷新。
  }
}

const handleStopAgentExecution = async (record: GeneratingRecord) => {
  if (!record.agentRun || record.done || !record.dbId) return

  try {
    markRecordStopping(record)
    const saved = await stopGenerationTask(record.dbId)
    syncRecordWithPersisted(record, saved)
    const controller = taskStreamControllers.get(record.dbId)
    if (controller) {
      controller.abort()
      taskStreamControllers.delete(record.dbId)
    }
  } catch {
    // 停止失败时保持当前状态，等待 SSE 或后续同步刷新。
  }
}

const handleStopResearchTask = async (record: GeneratingRecord) => {
  if (record.done || !record.dbId) return

  try {
    record.researchVerificationPending = false
    markRecordStopping(record)
    pushResearchTimeline(record, {
      kind: 'stopped',
      title: '已发送停止指令',
      description: '服务端正在收口研究任务状态',
      stage: 'stopping',
    })
    const saved = await stopGenerationTask(record.dbId)
    syncRecordWithPersisted(record, saved)
    const controller = taskStreamControllers.get(record.dbId)
    if (controller) {
      controller.abort()
      taskStreamControllers.delete(record.dbId)
    }
  } catch {
    // 停止失败时保持当前状态，等待 SSE 或后续同步刷新。
  }
}

// 处理 GenerateSessionList 上抛的滚动状态，控制输入框折叠/展开。
const handleSessionListScrollState = (state: GenerateSessionScrollState) => {
  if (!contentGeneratorRef.value) return
  if (state.isAtBottom) {
    contentGeneratorRef.value.expand()
  } else if (state.isScrollingUp && state.scrollTop > 50) {
    contentGeneratorRef.value.collapse()
  }
}

// 登录成功后的页面数据刷新监听器。
let authLoginSuccessListener: (() => void) | null = null

// 点击空白区域折叠
const handlePageClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  // 检查点击的是否是输入框组件内部
  const contentGenerator = document.querySelector('.dimension-layout-FUl4Nj')
  if (contentGenerator && !contentGenerator.contains(target)) {
    // 点击的是输入框组件外部，折叠
    contentGeneratorRef.value?.collapse()
  }
}

onMounted(() => {
  currentSessionId.value = readStoredCurrentSessionId()
  conversationSidebarCollapsed.value = readStoredConversationSidebarCollapsed()
  void loadPersistedGenerationSessions()
  void loadPersistedGeneratingRecords()

  // 检查路由参数（从首页跳转过来的发送请求）
  const { message, type, model, ratio, resolution, skill } = route.query
  const pendingPayloadRaw = typeof window !== 'undefined'
      ? window.sessionStorage.getItem('canana:home-header:pending-send')
      : ''
  let pendingPayload: {
    referenceImages?: string[]
    modelKey?: string
    duration?: string
    feature?: string
  } | null = null
  if (pendingPayloadRaw) {
    try {
      pendingPayload = JSON.parse(pendingPayloadRaw)
    } catch {
      pendingPayload = null
    }
    window.sessionStorage.removeItem('canana:home-header:pending-send')
  }
  if (message && type) {
    handleSend(
        message as string,
        type as CreationType,
        {
          model: model as string,
          modelKey: pendingPayload?.modelKey || '',
          ratio: ratio as string,
          resolution: resolution as string,
          duration: pendingPayload?.duration || '',
          feature: pendingPayload?.feature || '',
          skill: skill as string,
          referenceImages: Array.isArray(pendingPayload?.referenceImages) ? pendingPayload.referenceImages : [],
        }
    )
    router.replace({ path: '/generate' })
  }

  document.addEventListener('click', handlePageClick)

  authLoginSuccessListener = () => {
    void loadPersistedGenerationSessions()
    void loadPersistedGeneratingRecords()
  }
  window.addEventListener(AUTH_LOGIN_SUCCESS_EVENT, authLoginSuccessListener)
})

onUnmounted(() => {
  recordPersistTimers.forEach(timer => clearTimeout(timer))
  recordPersistTimers.clear()
  researchSearchRevealTimers.forEach(timer => clearTimeout(timer))
  researchSearchRevealTimers.clear()
  researchSearchRevealQueues.clear()
  researchUiRevealTimers.forEach(timer => clearTimeout(timer))
  researchUiRevealTimers.clear()
  researchUiRevealQueues.clear()
  document.removeEventListener('click', handlePageClick)

  if (authLoginSuccessListener) {
    window.removeEventListener(AUTH_LOGIN_SUCCESS_EVENT, authLoginSuccessListener)
    authLoginSuccessListener = null
  }

  taskStreamControllers.forEach(controller => controller.abort())
  taskStreamControllers.clear()
})
</script>

<template>
  <FrontstagePageShell
    class="generate-page-shell"
    main-container-id="dreamina-ui-configuration-content-wrapper"
    content-scroll-y="hidden"
  >
    <div class="entry-erESAd">
      <GenerateConversationSidebar
          :active-session-id="currentSessionId"
          :collapsed="isConversationSidebarEffectivelyCollapsed"
          :loading="isGenerationSessionsLoading"
          :default-session="sidebarDefaultSession"
          :sessions="sidebarRecentSessions"
          @toggle-sidebar="handleToggleConversationSidebar"
          @create-session="handleCreateSession"
          @select-default="handleSelectSidebarDefault"
          @select-session="handleSelectSidebarSession"
          @rename-session="handleRenameSidebarSession"
          @delete-session="handleDeleteSidebarSession"
      />
      <div :class="mainContentClassName">
        <template v-if="isCurrentSessionEmpty">
          <div v-if="conversationHeroSettings.enabled" class="new-conversation-hero-canana">
            <h1 class="new-conversation-title" ccfmp-element="true">
              {{ conversationHeroSettings.title || '你好，想创作什么？' }}
            </h1>
            <p v-if="conversationHeroSettings.subtitle" class="new-conversation-subtitle-canana">
              {{ conversationHeroSettings.subtitle }}
            </p>
          </div>
          <ContentGenerator
              ref="contentGeneratorRef"
              :default-expanded="true"
              @send="handleSend"
          />
        </template>
        <div v-else class=entry-lav5_s>
          <GenerateSessionList
              ref="generateSessionListRef"
              v-model:search-value="sessionSearchKeyword"
              scroll-list-id="scroll-list-generate-session"
              @create-session="handleCreateSession"
              @search="handleSessionSearch"
              @time-filter-click="handleSessionTimeFilterClick"
              @type-filter-click="handleSessionTypeFilterClick"
              @action-filter-click="handleSessionActionFilterClick"
              @scroll-state="handleSessionListScrollState"
          >
            <template v-for="(record, index) in visibleGeneratingRecords" :key="record.id">
              <div class="item-Xh64V7" :data-index="index * 2 + 1" style="z-index:1">
                <GenerateAgentRecord
                    v-if="!isResearchReportRecord(record) && record.type === 'agent' && record.agentRun"
                    :run="record.agentRun"
                    :reference-images="record.referenceImages || []"
                    :error-text="record.error ? formatGenerationError(record.error, '任务执行失败') : ''"
                    @stop="handleStopAgentExecution(record)"
                />
                <ResearchReportRecord
                    v-else-if="isResearchReportRecord(record)"
                    :record-id="String(record.dbId || record.id)"
                    :prompt="record.prompt"
                    :content="record.content"
                    :done="record.done"
                    :stopped="Boolean(record.stopped)"
                    :error="record.error ? formatGenerationError(record.error, '研究任务失败') : ''"
                    :progress-stage="record.progressStage"
                    :progress-message="record.progressMessage"
                    :progress-percent="record.progressPercent || 0"
                    :timeline="record.researchTimeline || []"
                    :search-groups="record.researchSearchGroups || []"
                    :evidences="record.researchEvidences || []"
                    :facts="record.researchFacts || []"
                    :outline-sections="record.researchOutlineSections || []"
                    :verification="record.researchVerification || null"
                    :token-usage="record.researchTokenUsage || null"
                    :verification-pending="Boolean(record.researchVerificationPending)"
                    @stop="handleStopResearchTask(record)"
                    @jump-to-verification="handleJumpToResearchVerification"
                    @verify-report="handleVerifyResearchReport(record)"
                />
                <AgentLoadingRecord
                    v-else-if="record.type === 'agent'"
                    :prompt="record.prompt"
                    :content="record.content"
                    :done="record.done"
                    :reference-images="record.referenceImages || []"
                    :error="record.error ? formatGenerationError(record.error, '对话生成失败') : ''"
                    :thinking-content="record.thinkingContent || ''"
                    :thinking-started-at="record.thinkingStartedAt"
                    :thinking-ended-at="record.thinkingEndedAt"
                />
                <ImageLoadingRecord
                    v-else
                    :time="record.time"
                    :prompt="record.prompt"
                    :model="record.model"
                    :ratio="record.ratio"
                    :resolution="record.resolution"
                    :duration="record.duration"
                    :feature="record.feature"
                    :reference-images="record.referenceImages || []"
                    :progress="record.progressPercent || 0"
                    :progress-text="record.progressMessage || ''"
                    :done="record.done"
                    :stopped="Boolean(record.stopped)"
                    :images="record.images"
                    :conversation-entries="getRecordConversationEntries(record)"
                    :error="record.error ? formatGenerationError(record.error, '图片生成失败') : ''"
                    @preview="handlePreviewRecordImage(record, $event)"
                    @edit="handleEditImageRecord(record)"
                    @regenerate="handleRegenerateImageRecord(record)"
                    @more="handleOpenImageRecordMore(record)"
                    @stop="handleStopImageGeneration(record)"
                />
              </div>
              <div
                  v-if="record.type === 'agent' || isResearchReportRecord(record)"
                  class="item-Xh64V7"
                  :data-index="index * 2 + 2"
                  style="z-index:1"
              >
                <div class="responsive-container-msS_cP">
                  <div class="content-DPogfx ai-generated-record-content-hg5EL8">
                    <div class="group-title">{{ record.time }}</div>
                  </div>
                </div>
              </div>
            </template>
          </GenerateSessionList>
          <ContentGenerator
              ref="contentGeneratorRef"
              :default-expanded="true"
              @send="handleSend"
          />
          <div style=height:1px></div>
        </div>
      </div>
    </div>
    <div class="platform-ui-service-side-drawer-container normal-mode legacy">
      <div class=side-drawer-panel></div>
    </div>
    <div class=container_44d3c style=bottom:20px;right:20px>
      <div class=help-center-nTCbew
           style=background-color:var(--background-dropdown-menu);color:var(--text-tertiary)>
        <div class=trigger-REbHBM>
          <svg class=icon-RC7nOi fill=none height=1em
               preserveAspectRatio="xMidYMid meet" role=presentation viewBox="0 0 24 24"
               width=1em xmlns=http://www.w3.org/2000/svg>
            <g>
              <path clip-rule=evenodd
                    d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm8.825 4.897a1.175 1.175 0 1 1 2.35 0 1.175 1.175 0 0 1-2.35 0ZM12 6.11c-.477 0-.95.09-1.395.263-.443.173-.85.43-1.195.755a3.538 3.538 0 0 0-.813 1.15c-.205.468-.289 1.049-.289 1.481a1 1 0 0 0 2 0c0-.235.055-.527.12-.677.081-.184.2-.354.355-.5a1.72 1.72 0 0 1 .551-.347 1.83 1.83 0 0 1 1.332 0c.21.082.396.2.55.347.155.146.275.316.355.5.08.183.12.377.12.571 0 .439-.108.662-.22.811-.139.185-.339.336-.686.572l-.066.044c-.302.204-.736.496-1.074.912-.403.495-.645 1.12-.645 1.923a1 1 0 0 0 2 0c0-.362.095-.536.196-.66.141-.174.34-.313.711-.564l.008-.005c.325-.22.793-.538 1.156-1.022.393-.524.62-1.178.62-2.01 0-.474-.098-.941-.288-1.375a3.538 3.538 0 0 0-.813-1.15 3.708 3.708 0 0 0-1.195-.756A3.829 3.829 0 0 0 12 6.11Z"
                    data-follow-fill=currentColor fill=currentColor
                    fill-rule=evenodd></path>
            </g>
          </svg>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="sessionRenameDialogVisible"
      title="重命名会话"
      width="420px"
      :close-on-click-modal="false"
      :close-on-press-escape="!sessionActionLoading"
      :show-close="!sessionActionLoading"
      destroy-on-close
      @close="closeSessionRenameDialog()"
    >
      <div class="session-action-dialog__body">
        <el-input
          v-model="sessionRenameDraftTitle"
          maxlength="100"
          placeholder="请输入会话名称"
          @keydown.enter="submitRenameSidebarSession"
        />
      </div>
      <template #footer>
        <div class="session-action-dialog__footer">
          <el-button :disabled="sessionActionLoading" @click="closeSessionRenameDialog">取消</el-button>
          <el-button type="primary" :loading="sessionActionLoading" @click="submitRenameSidebarSession">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="sessionDeleteDialogVisible"
      title="删除会话"
      width="420px"
      :close-on-click-modal="false"
      :close-on-press-escape="!sessionActionLoading"
      :show-close="!sessionActionLoading"
      destroy-on-close
      @close="closeSessionDeleteDialog()"
    >
      <div class="session-action-dialog__body">
        确定删除会话“{{ deletingSessionTitle }}”吗？该会话下的生成记录也会一并移除。
      </div>
      <template #footer>
        <div class="session-action-dialog__footer">
          <el-button :disabled="sessionActionLoading" @click="closeSessionDeleteDialog">取消</el-button>
          <el-button type="danger" :loading="sessionActionLoading" @click="submitDeleteSidebarSession">删除</el-button>
        </div>
      </template>
    </el-dialog>

    <template #after>
      <ImagePreview
          v-model:visible="previewVisible"
          v-model:currentIndex="previewIndex"
          :images="previewImages"
          @download="handlePreviewDownload"
          @edit="handlePreviewEdit"
          @regenerate="handlePreviewRegenerate"
          @favorite="handlePreviewFavorite"
          @publish="handlePreviewPublish"
          @generate-video="handlePreviewGenerateVideo"
          @edit-in-canvas="handlePreviewEditInCanvas"
      />
    </template>
  </FrontstagePageShell>
</template>

<style>
@import "./generate.css";

.main-content-G632JF.new-conversation {
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
  padding: 32px 24px 96px;
}

.new-conversation-hero-canana {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.new-conversation-title {
  color: var(--text-primary, #fff);
  font-family: "Founder Yashi Black", var(--font-family, inherit);
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  margin: 0 0 40px;
  text-align: center;
}

.new-conversation-subtitle-canana {
  color: var(--text-secondary, rgba(255, 255, 255, 0.64));
  font-size: 14px;
  line-height: 22px;
  margin: -28px 0 24px;
  text-align: center;
}

.session-action-dialog__body {
  color: var(--text-primary, #0f1419);
  font-size: 14px;
  line-height: 22px;
}

.session-action-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
