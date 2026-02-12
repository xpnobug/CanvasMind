/**
 * Agent 模式配置
 */
import { DEFAULT_CHAT_MODEL } from '@/config/models'

export const getAgentModel = (): string => {
  return localStorage.getItem('agent-chat-model') || DEFAULT_CHAT_MODEL
}

export const setAgentModel = (model: string) => {
  localStorage.setItem('agent-chat-model', model)
}
