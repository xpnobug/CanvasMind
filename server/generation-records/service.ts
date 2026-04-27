import { Buffer } from 'node:buffer'
import { saveUploadedBuffer } from '../storage/service'
import { prisma } from '../db/prisma'
import type { GenerationRecordPayload, GenerationOutputPayload } from './shared'

// 前端创建类型映射到数据库枚举
const mapGenerationType = (type: string) => {
  switch (String(type || '').trim()) {
    case 'agent':
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
    const status = String((payload.agentRun as any).status || '').trim()
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

  const textOutputs = payload.content && payload.type === 'agent' && !payload.agentRun
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
  console.log('[generation-records]', stage, JSON.stringify(detail))
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

// 根据生成输出重建资源层数据，供首页与资产页统一查询。
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
  logGenerationRecord('sync_asset_items:start', {
    generationRecordId,
    currentUserId,
    outputRecordCount: outputRecords.length,
  })

  await tx.assetItem.deleteMany({
    where: { generationRecordId },
  })

  const assetOutputs = outputRecords.filter(output => (
    isDisplayableAssetOutput(output.outputType) && output.url
  ))

  if (!assetOutputs.length) {
    logGenerationRecord('sync_asset_items:skip', {
      generationRecordId,
      reason: 'no_displayable_outputs',
    })
    return
  }

  await tx.assetItem.createMany({
    data: assetOutputs.map((output) => ({
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
      promptText: String(payload.prompt || '').trim() || null,
      modelLabel: String(payload.model || '').trim() || null,
      aspectRatio: String(payload.ratio || '').trim() || null,
      // 生成完成后先进入个人资产草稿态，只有用户主动发布后才进入公开流。
      visibility: 'PRIVATE',
      publishStatus: 'DRAFT',
      reviewStatus: 'APPROVED',
      favoriteCount: 0,
      viewCount: 0,
      downloadCount: 0,
      source: 'GENERATED',
      sourceMetaJson: payload.agentRun
        ? { skill: payload.skill || 'general', mode: 'agent' }
        : { skill: payload.skill || 'general', mode: 'direct' },
      isDeleted: false,
      publishedAt: null,
    })),
  })

  logGenerationRecord('sync_asset_items:success', {
    generationRecordId,
    currentUserId,
    assetCount: assetOutputs.length,
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

// 将数据库记录序列化为前端可直接消费的结构
const serializeGenerationRecord = (record: any) => ({
  id: record.id,
  type: String(record.type || '').toLowerCase().replace('_', '-'),
  prompt: record.prompt,
  content: record.content || '',
  error: record.errorMessage || '',
  model: record.modelLabel || '',
  modelKey: record.modelKey || '',
  ratio: record.ratio || '',
  resolution: record.resolution || '',
  duration: record.durationLabel || '',
  feature: record.feature || '',
  skill: record.skill || 'general',
  done: ['COMPLETED', 'FAILED', 'STOPPED'].includes(record.status),
  agentTaskId: record.agentTaskId || undefined,
  createdAt: record.createdAt,
  outputs: (record.outputs || []).map((output: any) => ({
    outputType: String(output.outputType || '').toLowerCase(),
    url: output.url || '',
    textContent: output.textContent || '',
    sortOrder: output.sortOrder || 0,
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
              promptText: '',
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
  const records = await prisma.generationRecord.findMany({
    where: { userId: currentUserId },
    include: buildRecordInclude(),
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return records.map(serializeGenerationRecord)
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
    type: payload.type,
    done: Boolean(payload.done),
    hasAgentRun: Boolean(payload.agentRun),
  })

  const outputs = await normalizeOutputs(payload)

  const created = await prisma.$transaction(async (tx) => {
    const createdRecord = await tx.generationRecord.create({
      data: {
        userId: currentUserId,
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

    await syncAssetItemsForRecord(tx, createdRecord.id, currentUserId, payload, createdOutputs)

    const agentRun = toAgentRunCreateInput(createdRecord.id, payload)
    if (agentRun) {
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
    }

    return createdRecord
  })

  const record = await prisma.generationRecord.findUniqueOrThrow({
    where: { id: created.id },
    include: buildRecordInclude(),
  })

  logGenerationRecord('create_generation_record:success', {
    currentUserId,
    generationRecordId: created.id,
    outputCount: outputs.length,
  })

  return serializeGenerationRecord(record)
}

// 更新已有生成记录，采用“主记录更新 + 子表重建”的方式保持结构简单
export const updateGenerationRecord = async (id: string, payload: GenerationRecordPayload, currentUserId: string) => {
  logGenerationRecord('update_generation_record:start', {
    currentUserId,
    generationRecordId: id,
    type: payload.type,
    done: Boolean(payload.done),
    hasAgentRun: Boolean(payload.agentRun),
  })

  const outputs = await normalizeOutputs(payload)

  await prisma.$transaction(async (tx) => {
    const existingRecord = await tx.generationRecord.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!existingRecord) {
      throw new Error('生成记录不存在')
    }

    if (existingRecord.userId !== currentUserId) {
      throw new Error('无权修改当前生成记录')
    }

    await tx.generationRecord.update({
      where: { id },
      data: {
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
        finishedAt: payload.done ? new Date() : null,
      },
    })

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

    await syncAssetItemsForRecord(tx, id, currentUserId, payload, createdOutputs)

    const existingAgentRun = await tx.agentRun.findUnique({
      where: { generationRecordId: id },
    })

    const agentRun = toAgentRunCreateInput(id, payload)
    if (!agentRun) {
      if (existingAgentRun) {
        await tx.agentRun.delete({
          where: { id: existingAgentRun.id },
        })
      }
      return
    }

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
  })

  const record = await prisma.generationRecord.findUniqueOrThrow({
    where: { id },
    include: buildRecordInclude(),
  })

  logGenerationRecord('update_generation_record:success', {
    currentUserId,
    generationRecordId: id,
    outputCount: outputs.length,
  })

  return serializeGenerationRecord(record)
}
