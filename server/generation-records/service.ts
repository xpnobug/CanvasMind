import { Buffer } from 'node:buffer'
import { invalidateAssetItemsCaches } from '../asset-items/service'
import { invalidateAdminDashboardOverviewCache } from '../admin-dashboard/service'
import { invalidateAdminUsersCaches } from '../admin-users/service'
import { invalidateRedisCachePatterns, invalidateRedisCaches } from '../redis/cache-manager'
import { getOrSetJsonCache } from '../redis/json-cache'
import { redisKeys } from '../redis/keys'
import { saveUploadedBuffer } from '../storage/service'
import { prisma } from '../db/prisma'
import {
  ensureDefaultGenerationSession,
  invalidateGenerationSessionsCache,
  refreshGenerationSessionLastRecordAt,
  resolveGenerationSessionForUser,
} from '../generation-sessions/service'
import { writeScopedLog } from '../shared/logging'
import type { GenerationRecordPayload, GenerationOutputPayload } from './shared'

const GENERATION_RECORDS_LIST_SCOPE = 'generation-records-list'
const GENERATION_RECORDS_LIST_CACHE_PATTERN = redisKeys.cache(GENERATION_RECORDS_LIST_SCOPE, '*')
const buildGenerationRecordsListCacheKey = (currentUserId: string) => {
  return redisKeys.cache(GENERATION_RECORDS_LIST_SCOPE, currentUserId)
}

const GENERATION_RECORD_STAGE_LABELS: Record<string, string> = {
  'download_remote_asset:start': '开始下载远程资源',
  'download_remote_asset:error': '下载远程资源失败',
  'download_remote_asset:success': '下载远程资源成功',
  'materialize_output_asset:start': '开始落盘输出资源',
  'materialize_output_asset:skip': '跳过落盘输出资源',
  'materialize_output_asset:uploaded': '输出资源落盘成功',
  'normalize_outputs:start': '开始整理输出结果',
  'normalize_outputs:success': '整理输出结果成功',
  'sync_asset_items:start': '开始同步资产项',
  'sync_asset_items:skip': '跳过同步资产项',
  'sync_asset_items:success': '同步资产项成功',
  'create_generation_record:start': '开始创建生成记录',
  'create_generation_record:success': '创建生成记录成功',
  'update_generation_record:start': '开始更新生成记录',
  'update_generation_record:success': '更新生成记录成功',
  'create_generation_record:normalize_assets': '创建记录时整理资源',
  'create_generation_record:create_output_invalid': '创建记录时写入输出结果',
  'create_generation_record:sync_asset_items': '创建记录时同步资产项',
  'create_generation_record:agent_run': '创建记录时写入智能体运行态',
  'create_generation_record:transaction': '创建记录事务执行',
  'create_generation_record:reload_record': '创建记录后重新读取记录',
  'create_generation_record:update_session_last_record_at': '创建记录后更新会话最近记录时间',
  'update_generation_record:normalize_assets': '更新记录时整理资源',
  'update_generation_record:create_output_invalid': '更新记录时写入输出结果',
  'update_generation_record:sync_asset_items': '更新记录时同步资产项',
  'update_generation_record:delete_agent_run': '更新记录时删除旧运行态',
  'update_generation_record:agent_run': '更新记录时写入智能体运行态',
  'update_generation_record:transaction': '更新记录事务执行',
  'update_generation_record:reload_record': '更新记录后重新读取记录',
  'update_generation_record:refresh_old_session_last_record_at': '更新记录后刷新原会话最近记录时间',
  'update_generation_record:update_new_session_last_record_at': '更新记录后写入新会话最近记录时间',
}

const translateGenerationRecordStage = (stage: string) => {
  return GENERATION_RECORD_STAGE_LABELS[stage] || stage
}

const shouldSkipGenerationRecordLog = (stage: string, detail: Record<string, unknown>) => {
  if (
    (stage === 'normalize_outputs:start' || stage === 'normalize_outputs:success')
    && Number(detail.outputCount || 0) === 0
    && Number(detail.imageCount || 0) === 0
    && Number(detail.explicitOutputCount || 0) === 0
  ) {
    return true
  }

  if (stage === 'sync_asset_items:start' && Number(detail.outputRecordCount || 0) === 0) {
    return true
  }

  if (stage === 'sync_asset_items:skip' && String(detail.reason || '') === 'no_displayable_outputs') {
    return true
  }

  if (
    (stage === 'materialize_output_asset:start' || stage === 'materialize_output_asset:skip')
    && String(detail.outputType || '') === 'text'
  ) {
    return true
  }

  if (
    stage === 'update_generation_record:start'
    && String(detail.type || '') === 'agent'
    && Boolean(detail.done) === false
    && Boolean(detail.hasAgentRun) === true
  ) {
    return true
  }

  if (
    stage === 'update_generation_record:success'
    && String(detail.type || '') === 'agent'
    && Boolean(detail.done) === false
    && Boolean(detail.hasAgentRun) === true
    && Number(detail.outputCount || 0) === 0
  ) {
    return true
  }

  return false
}

// 前端创建类型映射到数据库枚举
const mapGenerationType = (type: string) => {
  switch (String(type || '').trim()) {
    case 'agent':
    case 'research':
      return 'AGENT'
    case 'image':
      return 'IMAGE'
    case 'video':
      return 'VIDEO'
    case 'digital-human':
      return 'DIGITAL_HUMAN'
    case 'motion':
      return 'MOTION'
    default:
      return 'IMAGE'
  }
}

// 根据当前记录内容推导存储状态
const mapGenerationStatus = (payload: GenerationRecordPayload) => {
  if (payload.agentRun && typeof payload.agentRun === 'object') {
    const status = String(payload.agentRun.status || '').trim()
    switch (status) {
      case 'completed':
        return 'COMPLETED'
      case 'error':
        return 'FAILED'
      case 'stopped':
        return 'STOPPED'
      case 'thinking':
      case 'running':
        return 'RUNNING'
      default:
        return payload.done ? 'COMPLETED' : 'PENDING'
    }
  }

  // 图片直连生成没有 agentRun，显式停止时也要能落成 STOPPED。
  if (payload.stopped) return 'STOPPED'
  if (payload.error) return 'FAILED'
  if (payload.done) return 'COMPLETED'
  return 'RUNNING'
}

// 输出类型映射到数据库枚举
const mapOutputType = (outputType: GenerationOutputPayload['outputType']) => {
  switch (outputType) {
    case 'video':
      return 'VIDEO'
    case 'text':
      return 'TEXT'
    case 'file':
      return 'FILE'
    case 'image':
    default:
      return 'IMAGE'
  }
}

// 只把图片和视频输出同步为可展示资源。
const isDisplayableAssetOutput = (outputType: GenerationOutputPayload['outputType']) => {
  return outputType === 'image' || outputType === 'video'
}

// 统一收敛输出结果，兼容旧的 images 数组与新的 outputs 结构。
const collectOutputs = (payload: GenerationRecordPayload): GenerationOutputPayload[] => {
  const explicitOutputs = Array.isArray(payload.outputs) ? payload.outputs : []
  if (explicitOutputs.length) {
    return explicitOutputs
  }

  const imageOutputs = Array.isArray(payload.images)
    ? payload.images
        .filter(Boolean)
        .map((url, index) => ({
          outputType: 'image' as const,
          url,
          sortOrder: index,
        }))
    : []

  const textOutputs = payload.content && (payload.type === 'agent' || payload.type === 'research') && !payload.agentRun
    ? [{
        outputType: 'text' as const,
        textContent: payload.content,
        sortOrder: imageOutputs.length,
      }]
    : []

  return [...imageOutputs, ...textOutputs]
}

// 判断是否为 base64 Data URL。
const isDataUrl = (value?: string | null) => {
  return /^data:[^;,]+;base64,/i.test(String(value || '').trim())
}

// 判断是否为远程资源 URL。
const isRemoteHttpUrl = (value?: string | null) => {
  return /^https?:\/\//i.test(String(value || '').trim())
}

// 判断是否已经是本服务托管的本地上传地址。
const isLocalManagedAssetUrl = (value?: string | null) => {
  return String(value || '').trim().startsWith('/uploads/')
}

// 统一输出生成记录上传链路日志，便于线上排查资源落盘与入库问题。
const logGenerationRecord = (stage: string, detail: Record<string, unknown>) => {
  if (shouldSkipGenerationRecordLog(stage, detail)) {
    return
  }

  writeScopedLog('log', '生成记录', translateGenerationRecordStage(stage), detail)
}

// 统一输出生成记录服务层异常日志，补充具体失败阶段与堆栈。
const logGenerationRecordError = (stage: string, error: unknown, detail: Record<string, unknown>) => {
  const err = error as { message?: string; stack?: string }
  writeScopedLog('error', '生成记录', `异常 ${translateGenerationRecordStage(stage)}`, {
    ...detail,
    errorMessage: err?.message || '未知异常',
    errorStack: err?.stack || null,
  })
}

// 从 Data URL 中解析 MIME 类型与二进制内容。
const parseDataUrl = (value: string) => {
  const matched = String(value || '').trim().match(/^data:([^;,]+);base64,(.+)$/i)
  if (!matched) {
    throw new Error('无法解析生成结果中的 Data URL')
  }

  return {
    mimeType: matched[1] || 'application/octet-stream',
    buffer: Buffer.from(matched[2], 'base64'),
  }
}

// 下载远程资源，转换为可上传的缓冲区。
const downloadRemoteAsset = async (url: string) => {
  logGenerationRecord('download_remote_asset:start', {
    url,
  })

  const response = await fetch(url)

  if (!response.ok) {
    logGenerationRecord('download_remote_asset:error', {
      url,
      status: response.status,
    })
    throw new Error(`下载远程资源失败：${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()

  logGenerationRecord('download_remote_asset:success', {
    url,
    mimeType: String(response.headers.get('content-type') || '').trim() || undefined,
    size: arrayBuffer.byteLength,
  })

  return {
    mimeType: String(response.headers.get('content-type') || '').trim() || undefined,
    buffer: Buffer.from(arrayBuffer),
  }
}

// 将生成输出统一转存到当前启用的存储系统，并保留原始来源信息。
const materializeOutputAsset = async (
  output: GenerationOutputPayload,
  index: number,
) => {
  logGenerationRecord('materialize_output_asset:start', {
    index,
    outputType: output.outputType,
    hasUrl: Boolean(output.url),
    urlPreview: String(output.url || '').slice(0, 160),
  })

  if (!isDisplayableAssetOutput(output.outputType) || !output.url) {
    logGenerationRecord('materialize_output_asset:skip', {
      index,
      reason: 'not_displayable_or_missing_url',
      outputType: output.outputType,
    })
    return output
  }

  const rawUrl = String(output.url || '').trim()

  // 已经是当前服务本地托管地址时，直接复用，避免重复上传。
  if (isLocalManagedAssetUrl(rawUrl)) {
    logGenerationRecord('materialize_output_asset:skip', {
      index,
      reason: 'already_local_managed_asset',
      outputType: output.outputType,
      urlPreview: rawUrl.slice(0, 160),
    })
    return output
  }

  // 只处理 base64 Data URL 与远程 URL，其他形式先按原样保留。
  if (!isDataUrl(rawUrl) && !isRemoteHttpUrl(rawUrl)) {
    logGenerationRecord('materialize_output_asset:skip', {
      index,
      reason: 'unsupported_url_shape',
      outputType: output.outputType,
      urlPreview: rawUrl.slice(0, 160),
    })
    return output
  }

  const sourceAsset = isDataUrl(rawUrl)
    ? parseDataUrl(rawUrl)
    : await downloadRemoteAsset(rawUrl)

  const savedAsset = await saveUploadedBuffer({
    buffer: sourceAsset.buffer,
    mimeType: output.mimeType || sourceAsset.mimeType,
    filename: `generation-output-${index + 1}`,
    category: `generated/${output.outputType}`,
  })

  logGenerationRecord('materialize_output_asset:uploaded', {
    index,
    outputType: output.outputType,
    originalUrlPreview: rawUrl.slice(0, 160),
    savedUrl: savedAsset.publicUrl,
    storageType: savedAsset.storageType,
    storageCode: savedAsset.storageCode,
    relativePath: savedAsset.relativePath,
    mimeType: output.mimeType || sourceAsset.mimeType || savedAsset.mimeType,
    size: sourceAsset.buffer.byteLength,
  })

  return {
    ...output,
    url: savedAsset.publicUrl,
    mimeType: output.mimeType || sourceAsset.mimeType || savedAsset.mimeType,
    metaJson: {
      ...(output.metaJson || {}),
      originalUrl: rawUrl,
      storageType: savedAsset.storageType,
      storageCode: savedAsset.storageCode,
      relativePath: savedAsset.relativePath,
    },
  }
}

// 将参考图统一物化为稳定的本地上传地址，避免在记录列表里直接依赖超长 data URL。
const normalizeReferenceImages = async (referenceImages: string[] | null | undefined) => {
  const items = Array.isArray(referenceImages) ? referenceImages : []
  const normalizedItems = items
    .map(item => String(item || '').trim())
    .filter(Boolean)

  const nextUrls: string[] = []

  for (const [index, rawUrl] of normalizedItems.entries()) {
    if (isLocalManagedAssetUrl(rawUrl)) {
      nextUrls.push(rawUrl)
      continue
    }

    if (!isDataUrl(rawUrl) && !isRemoteHttpUrl(rawUrl)) {
      nextUrls.push(rawUrl)
      continue
    }

    const sourceAsset = isDataUrl(rawUrl)
      ? parseDataUrl(rawUrl)
      : await downloadRemoteAsset(rawUrl)

    const savedAsset = await saveUploadedBuffer({
      buffer: sourceAsset.buffer,
      mimeType: sourceAsset.mimeType,
      filename: `generation-reference-${index + 1}`,
      category: 'generated/reference',
    })

    nextUrls.push(savedAsset.publicUrl)
  }

  return nextUrls
}

// 统一归一化输出列表，并将需要托管的资源写入自己的存储系统。
const normalizeOutputs = async (payload: GenerationRecordPayload) => {
  const outputs = collectOutputs(payload)

  logGenerationRecord('normalize_outputs:start', {
    type: payload.type,
    outputCount: outputs.length,
    imageCount: Array.isArray(payload.images) ? payload.images.length : 0,
    explicitOutputCount: Array.isArray(payload.outputs) ? payload.outputs.length : 0,
  })

  const normalizedOutputs = await Promise.all(outputs.map((output, index) => materializeOutputAsset(output, index)))

  logGenerationRecord('normalize_outputs:success', {
    type: payload.type,
    outputCount: normalizedOutputs.length,
    outputTypes: normalizedOutputs.map(output => output.outputType),
  })

  return normalizedOutputs
}

// 根据生成输出增量同步资源层数据，供首页与资产页统一查询。
// 增量原则：
//   - 已有资产（按 fileUrl 匹配）→ UPDATE 元数据，保留 favoriteCount/viewCount/downloadCount/
//     publishedAt/visibility/publishStatus/reviewStatus/title/description/isDeleted 等用户态字段
//   - 新增资产（fileUrl 在已有列表中找不到）→ CREATE，计数从 0 起步
//   - 已不再持有的资产（已有但 incoming 中没有）→ DELETE
// 身份键选用 fileUrl 而非 generationOutputId 的原因：
//   父级 updateGenerationRecord 内会对 GenerationOutput 全量删除重建，generationOutputId 不稳定；
//   fileUrl 落盘后是稳定的物理路径（/uploads/...），同一份产物路径恒定。
const syncAssetItemsForRecord = async (
  tx: any,
  generationRecordId: string,
  currentUserId: string,
  payload: GenerationRecordPayload,
  outputRecords: Array<{
    id: string
    outputType: GenerationOutputPayload['outputType']
    url?: string | null
    textContent?: string | null
    mimeType?: string | null
    width?: number | null
    height?: number | null
    durationSeconds?: number | null
  }>,
) => {
  const assetOutputs = outputRecords.filter(output => (
    isDisplayableAssetOutput(output.outputType) && output.url
  ))

  if (!assetOutputs.length) {
    await tx.assetItem.deleteMany({
      where: { generationRecordId },
    })
    return
  }

  logGenerationRecord('sync_asset_items:start', {
    generationRecordId,
    currentUserId,
    outputRecordCount: outputRecords.length,
  })

  const existingItems = await tx.assetItem.findMany({
    where: { generationRecordId },
  })

  // 用可变副本逐个 claim，正确处理"同一 URL 出现多次"的边界场景。
  const remainingItems: Array<typeof existingItems[number]> = [...existingItems]

  const sourceMetaJson = payload.agentRun
    ? { skill: payload.skill || 'general', mode: 'agent' }
    : { skill: payload.skill || 'general', mode: 'direct' }
  const promptText = String(payload.prompt || '').trim() || null
  const modelLabel = String(payload.model || '').trim() || null
  const aspectRatio = String(payload.ratio || '').trim() || null

  let createdCount = 0
  let updatedCount = 0
  const createPayloads: any[] = []

  for (const output of assetOutputs) {
    const matchIndex = remainingItems.findIndex(item => item.fileUrl === output.url)
    if (matchIndex >= 0) {
      const existing = remainingItems.splice(matchIndex, 1)[0]
      await tx.assetItem.update({
        where: { id: existing.id },
        data: {
          // 父表删除重建后 generationOutputId 会被 SetNull，这里刷新到最新 output id。
          generationOutputId: output.id,
          assetType: output.outputType === 'video' ? 'VIDEO' : 'IMAGE',
          coverUrl: output.outputType === 'image' ? output.url : null,
          thumbnailUrl: output.outputType === 'image' ? output.url : null,
          width: output.width || null,
          height: output.height || null,
          durationSeconds: output.durationSeconds || null,
          promptText,
          modelLabel,
          aspectRatio,
          sourceMetaJson,
          // 显式不写 favoriteCount / viewCount / downloadCount / publishedAt /
          // visibility / publishStatus / reviewStatus / title / description /
          // isDeleted —— 这些是用户态/运营态字段，必须保留不动。
        },
      })
      updatedCount += 1
    } else {
      createPayloads.push({
        userId: currentUserId,
        generationRecordId,
        generationOutputId: output.id,
        assetType: output.outputType === 'video' ? 'VIDEO' : 'IMAGE',
        title: null,
        description: null,
        coverUrl: output.outputType === 'image' ? output.url : null,
        fileUrl: output.url!,
        thumbnailUrl: output.outputType === 'image' ? output.url : null,
        width: output.width || null,
        height: output.height || null,
        durationSeconds: output.durationSeconds || null,
        fileSizeBytes: null,
        promptText,
        modelLabel,
        aspectRatio,
        // 生成完成后先进入个人资产草稿态，只有用户主动发布后才进入公开流。
        visibility: 'PRIVATE',
        publishStatus: 'DRAFT',
        reviewStatus: 'APPROVED',
        favoriteCount: 0,
        viewCount: 0,
        downloadCount: 0,
        source: 'GENERATED',
        sourceMetaJson,
        isDeleted: false,
        publishedAt: null,
      })
      createdCount += 1
    }
  }

  if (createPayloads.length) {
    await tx.assetItem.createMany({ data: createPayloads })
  }

  // 未被任何 incoming 认领的资产 → 已不再持有，删除。
  if (remainingItems.length) {
    await tx.assetItem.deleteMany({
      where: { id: { in: remainingItems.map(item => item.id) } },
    })
  }

  logGenerationRecord('sync_asset_items:success', {
    generationRecordId,
    currentUserId,
    assetCount: assetOutputs.length,
    createdCount,
    updatedCount,
    deletedCount: remainingItems.length,
    assetTypes: assetOutputs.map(output => output.outputType),
  })
}

// 将前端 agentRun 结构转成数据库可持久化的数据
const toAgentRunCreateInput = (generationRecordId: string, payload: GenerationRecordPayload) => {
  const agentRun = payload.agentRun as any
  if (!agentRun || typeof agentRun !== 'object') return null

  // 线上历史数据或跨版本前端上报时，步骤数组里可能混入 null，需要先过滤。
  const steps = Array.isArray(agentRun.steps)
    ? agentRun.steps.filter((step: any) => step && typeof step === 'object')
    : []
  // 过程分组同样做容错，避免 section.key / section.kind 在脏数据下直接报错。
  const processSections = Array.isArray(agentRun.processSections)
    ? agentRun.processSections.filter((section: any) => section && typeof section === 'object')
    : []

  return {
    generationRecordId,
    query: String(agentRun.query || payload.prompt || ''),
    skill: String(agentRun.skill || payload.skill || '').trim() || null,
    status: mapAgentRunStatus(agentRun.status),
    agentName: String(agentRun.user?.name || '').trim() || null,
    agentAvatarUrl: String(agentRun.user?.avatarSrc || '').trim() || null,
    indicatorStatus: agentRun.indicator ? mapAgentIndicatorStatus(agentRun.indicator.status) : null,
    indicatorTitle: String(agentRun.indicator?.title || '').trim() || null,
    indicatorDescription: String(agentRun.indicator?.description || '').trim() || null,
    resultTitle: String(agentRun.result?.title || '').trim() || null,
    resultSummary: String(agentRun.result?.summary || '').trim() || null,
    expectedImageCount: Number(agentRun.result?.expectedImageCount || 0) || 0,
    outputVisible: Boolean(agentRun.result?.outputVisible),
    errorMessage: String(payload.error || '').trim() || null,
    stopReason: agentRun.status === 'stopped' ? String(agentRun.indicator?.description || '').trim() || null : null,
    steps: steps.map((step: any, index: number) => ({
      stepKey: String(step.id || `step-${index + 1}`),
      title: String(step.title || `步骤 ${index + 1}`),
      status: mapAgentStepStatus(step.status),
      description: String(step.description || '').trim() || null,
      sortOrder: index,
    })),
    processSections: processSections.map((section: any, index: number) => ({
      sectionKey: String(section.key || `section-${index + 1}`),
      kind: mapAgentProcessSectionKind(section.kind),
      label: String(section.label || `分组 ${index + 1}`),
      paragraphsJson: Array.isArray(section.paragraphs) ? section.paragraphs.filter((paragraph: any) => paragraph != null) : [],
      taskItemsJson: Array.isArray(section.taskItems) ? section.taskItems.filter((item: any) => item && typeof item === 'object') : [],
      sortOrder: index,
    })),
  }
}

// Agent 运行状态映射
const mapAgentRunStatus = (status?: string) => {
  switch (status) {
    case 'thinking':
      return 'THINKING'
    case 'running':
      return 'RUNNING'
    case 'completed':
      return 'COMPLETED'
    case 'error':
      return 'ERROR'
    case 'stopped':
      return 'STOPPED'
    case 'idle':
    default:
      return 'IDLE'
  }
}

// 顶部指示器状态映射
const mapAgentIndicatorStatus = (status?: string) => {
  switch (status) {
    case 'thinking':
      return 'THINKING'
    case 'running':
      return 'RUNNING'
    case 'completed':
      return 'COMPLETED'
    case 'error':
      return 'ERROR'
    case 'stopped':
      return 'STOPPED'
    case 'idle':
    default:
      return 'IDLE'
  }
}

// 阶段步骤状态映射
const mapAgentStepStatus = (status?: string) => {
  switch (status) {
    case 'running':
      return 'RUNNING'
    case 'completed':
      return 'COMPLETED'
    case 'error':
      return 'ERROR'
    case 'pending':
    default:
      return 'PENDING'
  }
}

// 过程分组类型映射
const mapAgentProcessSectionKind = (kind?: string) => {
  return kind === 'skill' ? 'SKILL' : 'REASONING'
}

// 查询详情时统一带出输出、步骤与过程分组
const buildRecordInclude = () => ({
  session: true,
  outputs: {
    orderBy: { sortOrder: 'asc' as const },
  },
  agentRun: {
    include: {
      steps: {
        orderBy: { sortOrder: 'asc' as const },
      },
      processSections: {
        orderBy: { sortOrder: 'asc' as const },
      },
    },
  },
})

// 从记录元信息中恢复参考图列表，供前端刷新后继续渲染消息头。
const resolveReferenceImagesFromMeta = (metaJson: unknown) => {
  const list = Array.isArray((metaJson as any)?.referenceImages) ? (metaJson as any).referenceImages : []
  return list
    .map((item: unknown) => String(item || '').trim())
    .filter(Boolean)
}

// 统一从记录元信息中恢复来源，未显式标记时按 generate 兜底。
const KNOWN_GENERATION_RECORD_SOURCES = new Set(['generate', 'workflow', 'canvas-assistant'])
const resolveGenerationRecordSource = (metaJson: unknown) => {
  const source = String((metaJson as any)?.source || '').trim().toLowerCase()
  if (KNOWN_GENERATION_RECORD_SOURCES.has(source)) {
    return source
  }
  return 'generate'
}

const resolveResearchRuntimeMeta = (metaJson: unknown) => {
  const research = (metaJson as any)?.research
  return research && typeof research === 'object' && !Array.isArray(research)
    ? research
    : null
}

const resolveSerializedGenerationRecordType = (record: any) => {
  if (String(record.skill || '').trim() === 'research-report') {
    return 'research'
  }
  return String(record.type || '').toLowerCase().replace('_', '-')
}

// 将数据库记录序列化为前端可直接消费的结构
const serializeGenerationRecord = (record: any) => ({
  id: record.id,
  sessionId: record.sessionId,
  sessionTitle: record.session?.title || '',
  source: resolveGenerationRecordSource(record.metaJson),
  type: resolveSerializedGenerationRecordType(record),
  prompt: record.prompt,
  content: record.content || '',
  thinkingContent: typeof (record.metaJson as any)?.thinkingContent === 'string'
    ? (record.metaJson as any).thinkingContent
    : '',
  research: resolveResearchRuntimeMeta(record.metaJson),
  error: record.errorMessage || '',
  model: record.modelLabel || '',
  modelKey: record.modelKey || '',
  ratio: record.ratio || '',
  resolution: record.resolution || '',
  duration: record.durationLabel || '',
  feature: record.feature || '',
  skill: record.skill || 'general',
  referenceImages: resolveReferenceImagesFromMeta(record.metaJson),
  done: ['COMPLETED', 'FAILED', 'STOPPED'].includes(record.status),
  stopped: record.status === 'STOPPED',
  agentTaskId: record.agentTaskId || undefined,
  createdAt: record.createdAt,
  outputs: (record.outputs || []).map((output: any) => ({
    outputType: String(output.outputType || '').toLowerCase(),
    url: output.url || '',
    textContent: output.textContent || '',
    sortOrder: output.sortOrder || 0,
    metaJson: output.metaJson || null,
  })),
  images: (record.outputs || [])
    .filter((output: any) => output.outputType === 'IMAGE' && output.url)
    .map((output: any) => output.url),
  agentRun: record.agentRun
    ? {
        id: record.agentRun.id,
        query: record.agentRun.query,
        skill: record.agentRun.skill || 'general',
        status: String(record.agentRun.status || '').toLowerCase(),
        referenceImages: resolveReferenceImagesFromMeta(record.metaJson),
        user: {
          name: record.agentRun.agentName || '',
          avatarSrc: record.agentRun.agentAvatarUrl || undefined,
        },
        indicator: record.agentRun.indicatorTitle
          ? {
              status: String(record.agentRun.indicatorStatus || 'IDLE').toLowerCase(),
              title: record.agentRun.indicatorTitle,
              description: record.agentRun.indicatorDescription || undefined,
            }
          : undefined,
        result: {
          title: record.agentRun.resultTitle || '',
          summary: record.agentRun.resultSummary || '',
          images: (record.outputs || [])
            .filter((output: any) => output.outputType === 'IMAGE' && output.url)
            .map((output: any, index: number) => ({
              id: `output-image-${index + 1}`,
              imageSrc: output.url,
              promptText: String(output.metaJson?.promptText || '').trim() || '',
            })),
          expectedImageCount: record.agentRun.expectedImageCount || 0,
          outputVisible: Boolean(record.agentRun.outputVisible),
        },
        steps: (record.agentRun.steps || []).map((step: any) => ({
          id: step.stepKey,
          title: step.title,
          status: String(step.status || '').toLowerCase(),
          description: step.description || undefined,
        })),
        processSections: (record.agentRun.processSections || []).map((section: any) => ({
          key: section.sectionKey,
          kind: String(section.kind || '').toLowerCase(),
          label: section.label,
          paragraphs: Array.isArray(section.paragraphsJson) ? section.paragraphsJson : [],
          taskItems: Array.isArray(section.taskItemsJson) ? section.taskItemsJson : [],
        })),
      }
    : undefined,
})

// 获取最近的生成记录列表
export const listGenerationRecords = async (currentUserId?: string | null) => {
  if (!currentUserId) {
    return []
  }

  const normalizedUserId = String(currentUserId || '').trim()
  return getOrSetJsonCache({
    key: buildGenerationRecordsListCacheKey(normalizedUserId),
    ttlSeconds: 15,
    factory: async () => {
      await prisma.$transaction(async (tx) => {
        await ensureDefaultGenerationSession(tx, normalizedUserId)
      })

      const records = await prisma.generationRecord.findMany({
        where: { userId: normalizedUserId },
        include: buildRecordInclude(),
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      return records.map(serializeGenerationRecord)
    },
  })
}

export const invalidateGenerationRecordsCache = async (currentUserId?: string | null) => {
  const normalizedUserId = String(currentUserId || '').trim()
  if (normalizedUserId) {
    await invalidateRedisCaches([buildGenerationRecordsListCacheKey(normalizedUserId)])
    return
  }

  await invalidateRedisCachePatterns([GENERATION_RECORDS_LIST_CACHE_PATTERN])
}

// 按 id 获取单条生成记录详情，并校验归属用户。
export const getGenerationRecordById = async (id: string, currentUserId: string) => {
  const record = await prisma.generationRecord.findFirst({
    where: {
      id,
      userId: currentUserId,
    },
    include: buildRecordInclude(),
  })

  if (!record) {
    throw new Error('生成记录不存在或无权访问')
  }

  return serializeGenerationRecord(record)
}

// 创建一条新的生成记录，并同步写入输出与 Agent 过程
export const createGenerationRecord = async (payload: GenerationRecordPayload, currentUserId: string) => {
  if (!String(payload.prompt || '').trim()) {
    throw new Error('提示词不能为空')
  }

  logGenerationRecord('create_generation_record:start', {
    currentUserId,
    source: String(payload.source || 'generate').trim() || 'generate',
    type: payload.type,
    done: Boolean(payload.done),
    hasAgentRun: Boolean(payload.agentRun),
  })

  let outputs: GenerationOutputPayload[] = []
  let normalizedReferenceImages: string[] | undefined
  try {
    outputs = await normalizeOutputs(payload)
    if (payload.referenceImages !== undefined) {
      normalizedReferenceImages = await normalizeReferenceImages(payload.referenceImages)
    }
  } catch (error) {
    logGenerationRecordError('create_generation_record:normalize_assets', error, {
      currentUserId,
      type: payload.type,
      imageCount: Array.isArray(payload.images) ? payload.images.length : 0,
      outputCount: Array.isArray(payload.outputs) ? payload.outputs.length : 0,
      referenceImageCount: Array.isArray(payload.referenceImages) ? payload.referenceImages.length : 0,
    })
    throw error
  }

  let created: { id: string }
  let sessionIdForLastRecordUpdate: string | null = null
  let lastRecordAtForUpdate: Date | null = null
  try {
    created = await prisma.$transaction(async (tx) => {
      const session = await resolveGenerationSessionForUser(tx, currentUserId, payload.sessionId, payload.source)

      const createdRecord = await tx.generationRecord.create({
        data: {
          userId: currentUserId,
          sessionId: session.id,
          type: mapGenerationType(payload.type),
          status: mapGenerationStatus(payload),
          prompt: String(payload.prompt || '').trim(),
          content: String(payload.content || '').trim() || null,
          errorMessage: String(payload.error || '').trim() || null,
          modelLabel: String(payload.model || '').trim() || null,
          modelKey: String(payload.modelKey || '').trim() || null,
          ratio: String(payload.ratio || '').trim() || null,
          resolution: String(payload.resolution || '').trim() || null,
          durationLabel: String(payload.duration || '').trim() || null,
          feature: String(payload.feature || '').trim() || null,
          skill: String(payload.skill || '').trim() || 'general',
          agentTaskId: String(payload.agentTaskId || '').trim() || null,
          metaJson: {
            source: String(payload.source || 'generate').trim() || 'generate',
            referenceImages: normalizedReferenceImages,
            ...(typeof payload.thinkingContent === 'string'
              ? { thinkingContent: payload.thinkingContent }
              : {}),
            ...(payload.research && typeof payload.research === 'object'
              ? { research: payload.research }
              : {}),
          },
          startedAt: new Date(),
          finishedAt: payload.done ? new Date() : null,
        },
      })

      const createdOutputs: Array<{
        id: string
        outputType: GenerationOutputPayload['outputType']
        url?: string | null
        textContent?: string | null
        mimeType?: string | null
        width?: number | null
        height?: number | null
        durationSeconds?: number | null
      }> = []

      for (const [index, output] of outputs.entries()) {
        const createdOutput = await tx.generationOutput.create({
          data: {
            generationRecordId: createdRecord.id,
            outputType: mapOutputType(output.outputType),
            url: output.url || null,
            textContent: output.textContent || null,
            mimeType: output.mimeType || null,
            width: output.width || null,
            height: output.height || null,
            durationSeconds: output.durationSeconds || null,
            sortOrder: Number(output.sortOrder ?? index) || index,
            metaJson: (output.metaJson as any) || undefined,
          },
        })

        // Prisma create 正常情况下必须返回带 id 的记录；若返回异常，立即打点并终止事务。
        if (!createdOutput || !createdOutput.id) {
          logGenerationRecordError('create_generation_record:create_output_invalid', new Error('generationOutput.create 返回空结果'), {
            currentUserId,
            generationRecordId: createdRecord.id,
            outputIndex: index,
            outputType: output.outputType,
            createdOutput: createdOutput || null,
          })
          throw new Error('生成输出写入成功，但返回结果异常')
        }

        createdOutputs.push({
          id: createdOutput.id,
          outputType: output.outputType,
          url: createdOutput.url,
          textContent: createdOutput.textContent,
          mimeType: createdOutput.mimeType,
          width: createdOutput.width,
          height: createdOutput.height,
          durationSeconds: createdOutput.durationSeconds,
        })
      }

      try {
        await syncAssetItemsForRecord(tx, createdRecord.id, currentUserId, payload, createdOutputs)
      } catch (error) {
        logGenerationRecordError('create_generation_record:sync_asset_items', error, {
          currentUserId,
          generationRecordId: createdRecord.id,
          outputCount: createdOutputs.length,
        })
        throw error
      }

      const agentRun = toAgentRunCreateInput(createdRecord.id, payload)
      if (agentRun) {
        try {
          const createdAgentRun = await tx.agentRun.create({
            data: {
              generationRecordId: createdRecord.id,
              userId: currentUserId,
              query: agentRun.query,
              skill: agentRun.skill,
              status: agentRun.status as any,
              agentName: agentRun.agentName,
              agentAvatarUrl: agentRun.agentAvatarUrl,
              indicatorStatus: agentRun.indicatorStatus as any,
              indicatorTitle: agentRun.indicatorTitle,
              indicatorDescription: agentRun.indicatorDescription,
              resultTitle: agentRun.resultTitle,
              resultSummary: agentRun.resultSummary,
              expectedImageCount: agentRun.expectedImageCount,
              outputVisible: agentRun.outputVisible,
              errorMessage: agentRun.errorMessage,
              stopReason: agentRun.stopReason,
            },
          })

          if (agentRun.steps.length) {
            await tx.agentRunStep.createMany({
              data: agentRun.steps.map((step) => ({
                agentRunId: createdAgentRun.id,
                stepKey: step.stepKey,
                title: step.title,
                status: step.status,
                description: step.description,
                sortOrder: step.sortOrder,
              })),
            })
          }

          if (agentRun.processSections.length) {
            await tx.agentProcessSection.createMany({
              data: agentRun.processSections.map((section) => ({
                agentRunId: createdAgentRun.id,
                sectionKey: section.sectionKey,
                kind: section.kind,
                label: section.label,
                paragraphsJson: section.paragraphsJson,
                taskItemsJson: section.taskItemsJson,
                sortOrder: section.sortOrder,
              })),
            })
          }
        } catch (error) {
          logGenerationRecordError('create_generation_record:agent_run', error, {
            currentUserId,
            generationRecordId: createdRecord.id,
            stepCount: agentRun.steps.length,
            processSectionCount: agentRun.processSections.length,
          })
          throw error
        }
      }

      // 会话最近记录时间挪到事务外更新，避免并发创建时争抢同一会话行触发死锁。
      sessionIdForLastRecordUpdate = session.id
      lastRecordAtForUpdate = createdRecord.createdAt

      return createdRecord
    })
  } catch (error) {
    logGenerationRecordError('create_generation_record:transaction', error, {
      currentUserId,
      type: payload.type,
      outputCount: outputs.length,
    })
    throw error
  }

  if (sessionIdForLastRecordUpdate && lastRecordAtForUpdate) {
    try {
      await prisma.generationSession.update({
        where: { id: sessionIdForLastRecordUpdate },
        data: { lastRecordAt: lastRecordAtForUpdate },
      })
    } catch (error) {
      // 会话时间戳为弱一致字段，更新失败不影响主流程。
      logGenerationRecordError('create_generation_record:update_session_last_record_at', error, {
        currentUserId,
        generationRecordId: created.id,
        sessionId: sessionIdForLastRecordUpdate,
      })
    }
  }

  let record: any
  try {
    record = await prisma.generationRecord.findUniqueOrThrow({
      where: { id: created.id },
      include: buildRecordInclude(),
    })
  } catch (error) {
    logGenerationRecordError('create_generation_record:reload_record', error, {
      currentUserId,
      generationRecordId: created.id,
    })
    throw error
  }

  logGenerationRecord('create_generation_record:success', {
    currentUserId,
    generationRecordId: created.id,
    outputCount: outputs.length,
  })

  await invalidateGenerationSessionsCache(currentUserId)
  await invalidateGenerationRecordsCache(currentUserId)
  await invalidateAssetItemsCaches()
  await invalidateAdminDashboardOverviewCache(currentUserId)
  await invalidateAdminUsersCaches(currentUserId)

  return serializeGenerationRecord(record)
}

// 更新已有生成记录，采用“主记录更新 + 子表重建”的方式保持结构简单
export const updateGenerationRecord = async (id: string, payload: GenerationRecordPayload, currentUserId: string) => {
  logGenerationRecord('update_generation_record:start', {
    currentUserId,
    generationRecordId: id,
    source: String(payload.source || '').trim() || null,
    type: payload.type,
    done: Boolean(payload.done),
    hasAgentRun: Boolean(payload.agentRun),
  })

  let outputs: GenerationOutputPayload[] = []
  let normalizedReferenceImages: string[] | undefined
  try {
    outputs = await normalizeOutputs(payload)
    if (payload.referenceImages !== undefined) {
      normalizedReferenceImages = await normalizeReferenceImages(payload.referenceImages)
    }
  } catch (error) {
    logGenerationRecordError('update_generation_record:normalize_assets', error, {
      currentUserId,
      generationRecordId: id,
      type: payload.type,
      imageCount: Array.isArray(payload.images) ? payload.images.length : 0,
      outputCount: Array.isArray(payload.outputs) ? payload.outputs.length : 0,
      referenceImageCount: Array.isArray(payload.referenceImages) ? payload.referenceImages.length : 0,
    })
    throw error
  }

  let oldSessionIdForRefresh: string | null = null
  let newSessionIdForLastRecordUpdate: string | null = null
  let lastRecordAtForNewSession: Date | null = null
  try {
    await prisma.$transaction(async (tx) => {
      const existingRecord = await tx.generationRecord.findUnique({
        where: { id },
        select: { id: true, userId: true, sessionId: true, createdAt: true, metaJson: true },
      })

      if (!existingRecord) {
        throw new Error('生成记录不存在')
      }

      if (existingRecord.userId !== currentUserId) {
        throw new Error('无权修改当前生成记录')
      }

      const session = await resolveGenerationSessionForUser(tx, currentUserId, payload.sessionId || existingRecord.sessionId, payload.source)
      const existingReferenceImages = Array.isArray((existingRecord.metaJson as any)?.referenceImages)
        ? (existingRecord.metaJson as any).referenceImages
        : []
      const shouldOverwriteReferenceImages = normalizedReferenceImages !== undefined
        && (normalizedReferenceImages.length > 0 || existingReferenceImages.length === 0)

      await tx.generationRecord.update({
        where: { id },
        data: {
          sessionId: session.id,
          type: mapGenerationType(payload.type),
          status: mapGenerationStatus(payload),
          prompt: String(payload.prompt || '').trim(),
          content: String(payload.content || '').trim() || null,
          errorMessage: String(payload.error || '').trim() || null,
          modelLabel: String(payload.model || '').trim() || null,
          modelKey: String(payload.modelKey || '').trim() || null,
          ratio: String(payload.ratio || '').trim() || null,
          resolution: String(payload.resolution || '').trim() || null,
          durationLabel: String(payload.duration || '').trim() || null,
          feature: String(payload.feature || '').trim() || null,
          skill: String(payload.skill || '').trim() || 'general',
          agentTaskId: String(payload.agentTaskId || '').trim() || null,
          metaJson: {
            ...(((existingRecord.metaJson as Record<string, unknown> | null) || {})),
            source: String(payload.source || (existingRecord.metaJson as any)?.source || 'generate').trim() || 'generate',
            ...(shouldOverwriteReferenceImages
              ? { referenceImages: normalizedReferenceImages }
              : {}),
            ...(typeof payload.thinkingContent === 'string'
              ? { thinkingContent: payload.thinkingContent }
              : {}),
            ...(payload.research && typeof payload.research === 'object'
              ? { research: payload.research }
              : {}),
          },
          finishedAt: payload.done ? new Date() : null,
        },
      })

      if (existingRecord.sessionId !== session.id) {
        // 会话最近记录时间挪到事务外更新，避免并发更新时争抢同一会话行触发死锁。
        oldSessionIdForRefresh = existingRecord.sessionId
        newSessionIdForLastRecordUpdate = session.id
        lastRecordAtForNewSession = existingRecord.createdAt
      }

      await tx.generationOutput.deleteMany({
        where: { generationRecordId: id },
      })

      const createdOutputs: Array<{
        id: string
        outputType: GenerationOutputPayload['outputType']
        url?: string | null
        textContent?: string | null
        mimeType?: string | null
        width?: number | null
        height?: number | null
        durationSeconds?: number | null
      }> = []

      for (const [index, output] of outputs.entries()) {
        const createdOutput = await tx.generationOutput.create({
          data: {
            generationRecordId: id,
            outputType: mapOutputType(output.outputType),
            url: output.url || null,
            textContent: output.textContent || null,
            mimeType: output.mimeType || null,
            width: output.width || null,
            height: output.height || null,
            durationSeconds: output.durationSeconds || null,
            sortOrder: Number(output.sortOrder ?? index) || index,
            metaJson: (output.metaJson as any) || undefined,
          },
        })

        // Prisma create 正常情况下必须返回带 id 的记录；若返回异常，立即打点并终止事务。
        if (!createdOutput || !createdOutput.id) {
          logGenerationRecordError('update_generation_record:create_output_invalid', new Error('generationOutput.create 返回空结果'), {
            currentUserId,
            generationRecordId: id,
            outputIndex: index,
            outputType: output.outputType,
            createdOutput: createdOutput || null,
          })
          throw new Error('生成输出写入成功，但返回结果异常')
        }

        createdOutputs.push({
          id: createdOutput.id,
          outputType: output.outputType,
          url: createdOutput.url,
          textContent: createdOutput.textContent,
          mimeType: createdOutput.mimeType,
          width: createdOutput.width,
          height: createdOutput.height,
          durationSeconds: createdOutput.durationSeconds,
        })
      }

      try {
        await syncAssetItemsForRecord(tx, id, currentUserId, payload, createdOutputs)
      } catch (error) {
        logGenerationRecordError('update_generation_record:sync_asset_items', error, {
          currentUserId,
          generationRecordId: id,
          outputCount: createdOutputs.length,
        })
        throw error
      }

      const existingAgentRun = await tx.agentRun.findUnique({
        where: { generationRecordId: id },
      })

      const agentRun = toAgentRunCreateInput(id, payload)
      if (!agentRun) {
        if (existingAgentRun) {
          try {
            await tx.agentRun.delete({
              where: { id: existingAgentRun.id },
            })
          } catch (error) {
            logGenerationRecordError('update_generation_record:delete_agent_run', error, {
              currentUserId,
              generationRecordId: id,
              existingAgentRunId: existingAgentRun.id,
            })
            throw error
          }
        }
        return
      }

      try {
        const savedAgentRun = existingAgentRun
          ? await tx.agentRun.update({
              where: { id: existingAgentRun.id },
              data: {
                userId: currentUserId,
                query: agentRun.query,
                skill: agentRun.skill,
                status: agentRun.status as any,
                agentName: agentRun.agentName,
                agentAvatarUrl: agentRun.agentAvatarUrl,
                indicatorStatus: agentRun.indicatorStatus as any,
                indicatorTitle: agentRun.indicatorTitle,
                indicatorDescription: agentRun.indicatorDescription,
                resultTitle: agentRun.resultTitle,
                resultSummary: agentRun.resultSummary,
                expectedImageCount: agentRun.expectedImageCount,
                outputVisible: agentRun.outputVisible,
                errorMessage: agentRun.errorMessage,
                stopReason: agentRun.stopReason,
              },
            })
          : await tx.agentRun.create({
              data: {
                generationRecordId: id,
                userId: currentUserId,
                query: agentRun.query,
                skill: agentRun.skill,
                status: agentRun.status as any,
                agentName: agentRun.agentName,
                agentAvatarUrl: agentRun.agentAvatarUrl,
                indicatorStatus: agentRun.indicatorStatus as any,
                indicatorTitle: agentRun.indicatorTitle,
                indicatorDescription: agentRun.indicatorDescription,
                resultTitle: agentRun.resultTitle,
                resultSummary: agentRun.resultSummary,
                expectedImageCount: agentRun.expectedImageCount,
                outputVisible: agentRun.outputVisible,
                errorMessage: agentRun.errorMessage,
                stopReason: agentRun.stopReason,
              },
            })

        await tx.agentRunStep.deleteMany({
          where: { agentRunId: savedAgentRun.id },
        })
        await tx.agentProcessSection.deleteMany({
          where: { agentRunId: savedAgentRun.id },
        })

        if (agentRun.steps.length) {
          await tx.agentRunStep.createMany({
            data: agentRun.steps.map((step) => ({
              agentRunId: savedAgentRun.id,
              stepKey: step.stepKey,
              title: step.title,
              status: step.status,
              description: step.description,
              sortOrder: step.sortOrder,
            })),
          })
        }

        if (agentRun.processSections.length) {
          await tx.agentProcessSection.createMany({
            data: agentRun.processSections.map((section) => ({
              agentRunId: savedAgentRun.id,
              sectionKey: section.sectionKey,
              kind: section.kind,
              label: section.label,
              paragraphsJson: section.paragraphsJson,
              taskItemsJson: section.taskItemsJson,
              sortOrder: section.sortOrder,
            })),
          })
        }
      } catch (error) {
        logGenerationRecordError('update_generation_record:agent_run', error, {
          currentUserId,
          generationRecordId: id,
          hasExistingAgentRun: Boolean(existingAgentRun),
          stepCount: agentRun.steps.length,
          processSectionCount: agentRun.processSections.length,
        })
        throw error
      }
    })
  } catch (error) {
    logGenerationRecordError('update_generation_record:transaction', error, {
      currentUserId,
      generationRecordId: id,
      type: payload.type,
      outputCount: outputs.length,
    })
    throw error
  }

  if (oldSessionIdForRefresh) {
    try {
      await refreshGenerationSessionLastRecordAt(prisma, oldSessionIdForRefresh)
    } catch (error) {
      // 会话时间戳为弱一致字段，刷新失败不影响主流程。
      logGenerationRecordError('update_generation_record:refresh_old_session_last_record_at', error, {
        currentUserId,
        generationRecordId: id,
        sessionId: oldSessionIdForRefresh,
      })
    }
  }

  if (newSessionIdForLastRecordUpdate && lastRecordAtForNewSession) {
    try {
      await prisma.generationSession.update({
        where: { id: newSessionIdForLastRecordUpdate },
        data: { lastRecordAt: lastRecordAtForNewSession },
      })
    } catch (error) {
      logGenerationRecordError('update_generation_record:update_new_session_last_record_at', error, {
        currentUserId,
        generationRecordId: id,
        sessionId: newSessionIdForLastRecordUpdate,
      })
    }
  }

  let record: any
  try {
    record = await prisma.generationRecord.findUniqueOrThrow({
      where: { id },
      include: buildRecordInclude(),
    })
  } catch (error) {
    logGenerationRecordError('update_generation_record:reload_record', error, {
      currentUserId,
      generationRecordId: id,
    })
    throw error
  }

  logGenerationRecord('update_generation_record:success', {
    currentUserId,
    generationRecordId: id,
    type: payload.type,
    done: Boolean(payload.done),
    hasAgentRun: Boolean(payload.agentRun),
    outputCount: outputs.length,
  })

  await invalidateGenerationSessionsCache(currentUserId)
  await invalidateGenerationRecordsCache(currentUserId)
  await invalidateAssetItemsCaches()
  await invalidateAdminDashboardOverviewCache(currentUserId)
  await invalidateAdminUsersCaches(currentUserId)

  return serializeGenerationRecord(record)
}
