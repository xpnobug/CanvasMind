import { prisma } from '../db/prisma'
import { decryptProviderApiKey, encryptProviderApiKey, maskApiKey } from './crypto'
import { normalizeCustomModelList, type ProviderRuntimePayload } from './shared'

const DEFAULT_RUNTIME_CONFIG = {
  baseUrl: process.env.PROVIDER_DEFAULT_BASE_URL || 'https://api.chatfire.site/v1',
  apiKey: '',
  apiKeyHint: '',
  chatEndpoint: '/chat/completions',
  imageEndpoint: '/images/generations',
  videoEndpoint: '/videos',
  defaultChatModel: '',
  customModels: {
    image: [] as Array<{ label: string; key: string }>,
    video: [] as Array<{ label: string; key: string }>,
    chat: [] as Array<{ label: string; key: string }>,
  },
}

const DEFAULT_SCENE = 'generate'
const DEFAULT_NAME = '默认生成配置'

const toRuntimeConfig = async (config: Awaited<ReturnType<typeof prisma.aiProviderConfig.findFirst>>) => {
  if (!config) {
    return DEFAULT_RUNTIME_CONFIG
  }

  const customModels = await prisma.aiProviderCustomModel.findMany({
    where: {
      providerConfigId: config.id,
      isEnabled: true,
    },
    orderBy: [
      { category: 'asc' },
      { sortOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  })

  return {
    baseUrl: config.baseUrl,
    apiKey: decryptProviderApiKey(config.apiKeyEncrypted),
    apiKeyHint: config.apiKeyHint || '',
    chatEndpoint: config.chatEndpoint,
    imageEndpoint: config.imageEndpoint,
    videoEndpoint: config.videoEndpoint,
    defaultChatModel: config.defaultChatModel || '',
    customModels: {
      image: customModels
        .filter(item => item.category === 'IMAGE')
        .map(item => ({ label: item.label, key: item.modelKey })),
      video: customModels
        .filter(item => item.category === 'VIDEO')
        .map(item => ({ label: item.label, key: item.modelKey })),
      chat: customModels
        .filter(item => item.category === 'CHAT')
        .map(item => ({ label: item.label, key: item.modelKey })),
    },
  }
}

const getDefaultConfigRecord = () => prisma.aiProviderConfig.findFirst({
  where: {
    userId: null,
    scene: DEFAULT_SCENE,
  },
  orderBy: [
    { isDefault: 'desc' },
    { updatedAt: 'desc' },
  ],
})

export const getProviderRuntimeConfig = async () => {
  const config = await getDefaultConfigRecord()
  return toRuntimeConfig(config)
}

export const saveProviderRuntimeConfig = async (payload: ProviderRuntimePayload) => {
  const baseUrl = String(payload.baseUrl || '').trim()
  if (!baseUrl) {
    throw new Error('API 地址不能为空')
  }

  const data = {
    baseUrl,
    apiKey: String(payload.apiKey || '').trim(),
    chatEndpoint: String(payload.chatEndpoint || '/chat/completions').trim() || '/chat/completions',
    imageEndpoint: String(payload.imageEndpoint || '/images/generations').trim() || '/images/generations',
    videoEndpoint: String(payload.videoEndpoint || '/videos').trim() || '/videos',
    defaultChatModel: String(payload.defaultChatModel || '').trim(),
    customModels: {
      image: normalizeCustomModelList(payload.customModels?.image),
      video: normalizeCustomModelList(payload.customModels?.video),
      chat: normalizeCustomModelList(payload.customModels?.chat),
    },
  }

  const encryptedApiKey = encryptProviderApiKey(data.apiKey)
  const existing = await getDefaultConfigRecord()

  const config = existing
    ? await prisma.aiProviderConfig.update({
        where: { id: existing.id },
        data: {
          name: DEFAULT_NAME,
          providerType: 'OPENAI_COMPATIBLE',
          baseUrl: data.baseUrl,
          apiKeyEncrypted: encryptedApiKey,
          apiKeyHint: maskApiKey(data.apiKey),
          chatEndpoint: data.chatEndpoint,
          imageEndpoint: data.imageEndpoint,
          videoEndpoint: data.videoEndpoint,
          defaultChatModel: data.defaultChatModel || null,
          isDefault: true,
          isEnabled: true,
        },
      })
    : await prisma.aiProviderConfig.create({
        data: {
          name: DEFAULT_NAME,
          scene: DEFAULT_SCENE,
          providerType: 'OPENAI_COMPATIBLE',
          baseUrl: data.baseUrl,
          apiKeyEncrypted: encryptedApiKey,
          apiKeyHint: maskApiKey(data.apiKey),
          chatEndpoint: data.chatEndpoint,
          imageEndpoint: data.imageEndpoint,
          videoEndpoint: data.videoEndpoint,
          defaultChatModel: data.defaultChatModel || null,
          isDefault: true,
          isEnabled: true,
        },
      })

  await prisma.$transaction([
    prisma.aiProviderCustomModel.deleteMany({
      where: { providerConfigId: config.id },
    }),
    prisma.aiProviderCustomModel.createMany({
      data: [
        ...data.customModels.image.map((item, index) => ({
          providerConfigId: config.id,
          category: 'IMAGE' as const,
          label: item.label,
          modelKey: item.key,
          sortOrder: index,
        })),
        ...data.customModels.video.map((item, index) => ({
          providerConfigId: config.id,
          category: 'VIDEO' as const,
          label: item.label,
          modelKey: item.key,
          sortOrder: index,
        })),
        ...data.customModels.chat.map((item, index) => ({
          providerConfigId: config.id,
          category: 'CHAT' as const,
          label: item.label,
          modelKey: item.key,
          sortOrder: index,
        })),
      ],
    }),
  ])

  return getProviderRuntimeConfig()
}
