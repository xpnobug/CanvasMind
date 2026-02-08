/**
 * 模型配置
 */

// 豆包图片尺寸选项
export const SEEDREAM_SIZE_OPTIONS = [
  { label: '21:9', key: '3024x1296' },
  { label: '16:9', key: '2560x1440' },
  { label: '4:3', key: '2304x1728' },
  { label: '3:2', key: '2496x1664' },
  { label: '1:1', key: '2048x2048' },
  { label: '2:3', key: '1664x2496' },
  { label: '3:4', key: '1728x2304' },
  { label: '9:16', key: '1440x2560' },
  { label: '9:21', key: '1296x3024' }
]

export const SEEDREAM_4K_SIZE_OPTIONS = [
  { label: '21:9', key: '6198x2656' },
  { label: '16:9', key: '5404x3040' },
  { label: '4:3', key: '4694x3520' },
  { label: '3:2', key: '4992x3328' },
  { label: '1:1', key: '4096x4096' },
  { label: '2:3', key: '3328x4992' },
  { label: '3:4', key: '3520x4694' },
  { label: '9:16', key: '3040x5404' },
  { label: '9:21', key: '2656x6198' }
]

export const SEEDREAM_QUALITY_OPTIONS = [
  { label: '标准画质', key: 'standard' },
  { label: '4K 高清', key: '4k' }
]

export const BANANA_SIZE_OPTIONS = [
  { label: '21:9', key: '21x9' },
  { label: '16:9', key: '16x9' },
  { label: '4:3', key: '4x3' },
  { label: '3:2', key: '3x2' },
  { label: '1:1', key: '1x1' },
  { label: '2:3', key: '2x3' },
  { label: '3:4', key: '3x4' },
  { label: '9:16', key: '9x16' },
  { label: '9:21', key: '9x21' }
]

// 图片生成模型
export const IMAGE_MODELS = [
  {
    label: 'Nano Banana Pro',
    key: 'nano-banana-pro',
    sizes: BANANA_SIZE_OPTIONS.map(s => s.key),
    defaultParams: { size: '1x1', quality: 'standard', style: 'vivid' }
  },
  {
    label: '豆包 Seedream 4.5',
    key: 'doubao-seedream-4-5-251128',
    sizes: SEEDREAM_SIZE_OPTIONS.map(s => s.key),
    qualities: SEEDREAM_QUALITY_OPTIONS,
    getSizesByQuality: (quality) => quality === '4k' ? SEEDREAM_4K_SIZE_OPTIONS : SEEDREAM_SIZE_OPTIONS,
    defaultParams: { size: '2048x2048', quality: 'standard', style: 'vivid' }
  },
  {
    label: 'Nano Banana',
    key: 'nano-banana',
    tips: '尺寸写在提示词中: 尺寸 9:16',
    sizes: [],
    defaultParams: { quality: 'standard', style: 'vivid' }
  }
]

// 视频比例选项
export const VIDEO_RATIO_LIST = [
  { label: '16:9 (横版)', key: '16x9' },
  { label: '4:3', key: '4x3' },
  { label: '1:1 (方形)', key: '1x1' },
  { label: '3:4', key: '3x4' },
  { label: '9:16 (竖版)', key: '9x16' }
]

// 视频生成模型
export const VIDEO_MODELS = [
  {
    label: 'veo3.1',
    key: 'veo3.1',
    ratios: VIDEO_RATIO_LIST.map(s => s.key),
    durs: [{ label: '5 秒', key: 5 }, { label: '10 秒', key: 10 }],
    defaultParams: { ratio: '16:9', duration: 5 }
  }
]

// 对话模型
export const CHAT_MODELS = [
  { label: 'GPT-4o Mini', key: 'gpt-4o-mini' },
  { label: 'GPT-4o', key: 'gpt-4o' },
  { label: 'GPT-5.2', key: 'gpt-5.2' },
  { label: 'DeepSeek Chat', key: 'deepseek-chat' },
  { label: '豆包 Seed Flash', key: 'doubao-seed-1-6-flash-250615' },
  { label: 'Gemini 3 Pro', key: 'gemini-3-pro' }
]

// 默认值
export const DEFAULT_IMAGE_MODEL = 'nano-banana-pro'
export const DEFAULT_VIDEO_MODEL = 'veo3.1'
export const DEFAULT_CHAT_MODEL = 'gpt-4o-mini'

// 根据 key 获取模型
export const getModelByName = (key) => {
  return [...IMAGE_MODELS, ...VIDEO_MODELS, ...CHAT_MODELS].find(m => m.key === key)
}

// 获取包含自定义模型的完整列表
export const getAllImageModels = () => [
  ...IMAGE_MODELS,
  ...JSON.parse(localStorage.getItem('wf-custom-image-models') || '[]')
]

export const getAllVideoModels = () => [
  ...VIDEO_MODELS,
  ...JSON.parse(localStorage.getItem('wf-custom-video-models') || '[]')
]

export const getAllChatModels = () => [
  ...CHAT_MODELS,
  ...JSON.parse(localStorage.getItem('wf-custom-chat-models') || '[]')
]
