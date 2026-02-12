<template>
  <!-- Agent 模式发送后的加载记录 -->
  <div class="responsive-container-msS_cP responsive-container-Nivf0N">
    <div class="content-DPogfx ai-generated-record-content-hg5EL8">
      <div class="agentic-record-qV_0lS">
        <div :class="['agentic-record-content-pUXA3k', { 'completed-E206yG': done }]">
          <!-- 用户消息 -->
          <div class="user-message-IyG6vx">
            <div class="context-menu-trigger-QXaWD5">
              <div class="user-message-content-Qs9l2b">
                <div class="user-message-text-Fb_kWq">
                  <span class="prompt-value-container-KCtKOf"><span>{{ prompt }}</span></span>
                </div>
              </div>
            </div>
          </div>
          <!-- AI 加载/回复区域 -->
          <div v-if="!done && !content" class="agent-loading-status-wrapper">
            <AgentLoadingIcon :size="22" />
            <span class="agent-loading-text">思考中</span>
          </div>
          <div v-else class="assistant-message-text-e69SR6">
            <div class="markdown-render-DkILWY markdown-render-UH4_kU" v-html="renderedContent"></div>
          </div>
          <!-- 错误提示 -->
          <div v-if="error" class="agent-error-text">{{ error }}</div>
          <!-- AI 生成标识 -->
          <div v-if="done" class="ai-generated-notice-U9hEwy">以上内容由 AI 生成</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AgentLoadingIcon from './AgentLoadingIcon.vue'

const props = defineProps<{
  prompt: string
  content: string
  done: boolean
  error?: string
}>()

// 简单的 markdown 渲染（标题、段落、列表）
const renderedContent = computed(() => {
  return props.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
})
</script>

<style scoped>
.agent-loading-status-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
}

.agent-loading-text {
  color: var(--text-tertiary);
  font-size: 14px;
  line-height: 20px;
}

.agent-error-text {
  color: var(--functional-danger, #f53f3f);
  font-size: 13px;
  padding: 8px 0;
}
</style>
