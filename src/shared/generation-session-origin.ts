/** 后台会话来源色调：CM 暂无完整 origin 解析链，仅保留列表徽章 class。 */
export type GenerationSessionOriginCategory =
  | 'generate'
  | 'omni'
  | 'workflow'
  | 'canvas-assistant'
  | 'cutia-editor'
  | 'playlet'
  | 'other'

export const getGenerationSessionOriginToneClass = (
  category?: GenerationSessionOriginCategory | string | null,
) => {
  const normalized = String(category || 'other').trim().toLowerCase()
  switch (normalized) {
    case 'generate':
      return 'is-origin-generate'
    case 'omni':
      return 'is-origin-omni'
    case 'workflow':
      return 'is-origin-workflow'
    case 'canvas-assistant':
      return 'is-origin-canvas-assistant'
    case 'cutia-editor':
      return 'is-origin-cutia'
    case 'playlet':
      return 'is-origin-playlet'
    default:
      return 'is-origin-other'
  }
}
