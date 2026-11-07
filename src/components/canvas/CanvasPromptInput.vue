<script setup lang="ts">
/**
 * 画布底部统一输入框（即梦风样板）
 *
 * 视觉对照 RunningHUB / 即梦 AI 截图：
 *   - 黑色圆角胶囊外壳（毛玻璃 + 边框 + 阴影）
 *   - 顶部插槽：可放「+ 添加」/「素材库」/ tab 切换等
 *   - 中部：placeholder 提示语 + textarea
 *   - 底部一排：模型下拉 / 参数 chip 列表 / 数量下拉 / 价格 chip / 圆形发送按钮
 *
 * 用法（workflow/index.vue 里替换 ContentGenerator 时）：
 *   <CanvasPromptInput
 *     v-model="prompt"
 *     v-model:model-key="selectedModel"
 *     :model-options="modelOptions"
 *     :params="[{ label: '自适应/中/1k', value: 'preset-1' }]"
 *     :count="1"
 *     :price="0.38"
 *     placeholder="描述你想要生成的内容…"
 *     @send="handleSend"
 *   />
 */
import { computed, nextTick, ref } from 'vue'
import { Plus, Top, ArrowDown } from '@element-plus/icons-vue'

interface ModelOption {
  key: string
  label: string
}
interface ParamChip {
  label: string
  value?: string
  /** 点击时触发的事件 id，调用方监听 @param-click */
  id?: string
}
export interface PromptReference {
  id: string
  /** 缩略图 url（图片节点）；不传则只显示文本卡 */
  url?: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    modelKey?: string
    modelOptions?: ModelOption[]
    params?: ParamChip[]
    references?: PromptReference[]
    count?: number
    /** 价格（数字 = ¥xx 显示；字符串 = 直接显示，如 "今日限免还剩 3次"） */
    price?: number | string
    placeholder?: string
    sending?: boolean
    showAddBtn?: boolean
  }>(),
  {
    modelKey: '',
    modelOptions: () => [],
    params: () => [],
    references: () => [],
    count: 1,
    price: undefined,
    placeholder: '描述你想要生成的内容…',
    sending: false,
    showAddBtn: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:modelKey', key: string): void
  (e: 'send', text: string): void
  (e: 'add'): void
  (e: 'count-change', count: number): void
  (e: 'param-click', id: string): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isModelOpen = ref(false)
const isCountOpen = ref(false)

const localText = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v),
})

const currentModelLabel = computed(() => {
  const found = props.modelOptions.find((m) => m.key === props.modelKey)
  return found?.label || props.modelKey || '选择模型'
})

const priceLabel = computed(() => {
  if (props.price === undefined) return ''
  if (typeof props.price === 'string') return props.price
  return `¥ ${props.price.toFixed(2)}`
})

const isSendDisabled = computed(() => props.sending || !localText.value.trim())

const handleSend = () => {
  if (isSendDisabled.value) return
  emit('send', localText.value.trim())
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return
  event.preventDefault()
  handleSend()
}

const selectModel = (option: ModelOption) => {
  emit('update:modelKey', option.key)
  isModelOpen.value = false
}

const toggleModel = () => {
  isModelOpen.value = !isModelOpen.value
  isCountOpen.value = false
}
const toggleCount = () => {
  isCountOpen.value = !isCountOpen.value
  isModelOpen.value = false
}
const selectCount = (n: number) => {
  emit('count-change', n)
  isCountOpen.value = false
}

const handleAdd = () => {
  emit('add')
}
const handleParamClick = (chip: ParamChip) => {
  if (chip.id) emit('param-click', chip.id)
}

// 暴露 focus 给父组件用（例如点节点菜单"自己编写内容"时自动 focus）
defineExpose({
  focus: async () => {
    await nextTick()
    textareaRef.value?.focus()
  },
})

const countOptions = [1, 2, 3, 4]
</script>

<template>
  <div class="canvas-prompt-input" @click.stop>
    <!-- 顶部插槽：references chip / tab / "+ 添加" / 素材库 -->
    <div v-if="$slots.top || showAddBtn || references.length > 0" class="canvas-prompt-input__top">
      <!-- 上游参考素材 chip -->
      <div
        v-for="ref in references"
        :key="ref.id"
        class="canvas-prompt-input__ref"
        :title="ref.label"
      >
        <img v-if="ref.url" :src="ref.url" alt="" class="canvas-prompt-input__ref-img" />
        <span v-else class="canvas-prompt-input__ref-fallback">{{ ref.label.slice(0, 2) }}</span>
        <span class="canvas-prompt-input__ref-label">{{ ref.label }}</span>
      </div>
      <slot name="top">
        <button v-if="showAddBtn" class="canvas-prompt-input__add" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          <span>添加</span>
        </button>
      </slot>
    </div>

    <!-- 主输入区 -->
    <div class="canvas-prompt-input__body">
      <textarea
        ref="textareaRef"
        v-model="localText"
        class="canvas-prompt-input__textarea"
        :placeholder="placeholder"
        rows="2"
        @keydown="handleKeydown"
      />
    </div>

    <!-- 底部控件 -->
    <div class="canvas-prompt-input__footer">
      <!-- 模型下拉 -->
      <div class="canvas-prompt-input__selector" :class="{ 'is-open': isModelOpen }">
        <button class="canvas-prompt-input__pill" @click="toggleModel">
          <span class="canvas-prompt-input__pill-icon" aria-hidden="true">✦</span>
          <span>{{ currentModelLabel }}</span>
          <el-icon class="canvas-prompt-input__pill-caret"><ArrowDown /></el-icon>
        </button>
        <Transition name="canvas-prompt-input-dropdown">
          <ul v-if="isModelOpen" class="canvas-prompt-input__dropdown">
            <li
              v-for="opt in modelOptions"
              :key="opt.key"
              class="canvas-prompt-input__dropdown-item"
              :class="{ 'is-active': opt.key === modelKey }"
              @click="selectModel(opt)"
            >
              {{ opt.label }}
            </li>
            <li v-if="modelOptions.length === 0" class="canvas-prompt-input__dropdown-empty">
              暂无可用模型
            </li>
          </ul>
        </Transition>
      </div>

      <!-- 参数 chip 列表 -->
      <button
        v-for="chip in params"
        :key="chip.label"
        class="canvas-prompt-input__pill"
        :class="{ 'is-action': !!chip.id }"
        @click="handleParamClick(chip)"
      >
        <span>{{ chip.label }}</span>
      </button>

      <span class="canvas-prompt-input__spacer" />

      <!-- 数量下拉 -->
      <div class="canvas-prompt-input__selector" :class="{ 'is-open': isCountOpen }">
        <button class="canvas-prompt-input__pill" @click="toggleCount">
          <span>{{ count }}x</span>
          <el-icon class="canvas-prompt-input__pill-caret"><ArrowDown /></el-icon>
        </button>
        <Transition name="canvas-prompt-input-dropdown">
          <ul v-if="isCountOpen" class="canvas-prompt-input__dropdown canvas-prompt-input__dropdown--count">
            <li
              v-for="n in countOptions"
              :key="n"
              class="canvas-prompt-input__dropdown-item"
              :class="{ 'is-active': n === count }"
              @click="selectCount(n)"
            >
              {{ n }}x
            </li>
          </ul>
        </Transition>
      </div>

      <!-- 价格 chip -->
      <span v-if="priceLabel" class="canvas-prompt-input__price">{{ priceLabel }}</span>

      <!-- 发送按钮 -->
      <button
        class="canvas-prompt-input__send"
        :disabled="isSendDisabled"
        :title="isSendDisabled ? '请输入内容' : '发送 (Enter)'"
        @click="handleSend"
      >
        <el-icon><Top /></el-icon>
      </button>
    </div>
  </div>
</template>

<style scoped>
.canvas-prompt-input {
  position: relative;
  width: 100%;
  max-width: 760px;
  padding: 14px 16px 12px;
  background: var(--canvas-float-block-default);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  border: 0.5px solid var(--stroke-secondary);
  border-radius: 18px;
  box-shadow: var(--shadow-generator-float-block);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
}

/* 顶部插槽：tab / 添加 */
.canvas-prompt-input__top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.canvas-prompt-input__add {
  display: inline-flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  width: 56px;
  height: 56px;
  background: var(--canvas-bg-block-default);
  border: 0.5px dashed var(--stroke-secondary);
  border-radius: var(--lv-border-radius-medium);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s, border-color 0.12s;
}
.canvas-prompt-input__add .el-icon {
  font-size: 16px;
}
.canvas-prompt-input__add:hover {
  background: var(--canvas-float-block-hover);
  color: var(--brand-main-default);
  border-color: var(--brand-main-default);
}

/* 上游参考素材 chip */
.canvas-prompt-input__ref {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: var(--lv-border-radius-medium);
  overflow: hidden;
  background: var(--canvas-bg-block-default);
  border: 0.5px solid var(--stroke-secondary);
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
  flex-shrink: 0;
}
.canvas-prompt-input__ref-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.canvas-prompt-input__ref-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-secondary);
}
.canvas-prompt-input__ref-label {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 2px 4px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
  color: #fff;
  font-size: 10px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 主输入区 */
.canvas-prompt-input__body {
  display: flex;
}
.canvas-prompt-input__textarea {
  flex: 1 1 0;
  resize: none;
  background: transparent;
  border: 0;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.55;
  min-height: 44px;
  max-height: 200px;
  padding: 0;
  font-family: inherit;
}
.canvas-prompt-input__textarea::placeholder {
  color: var(--text-placeholder);
}

/* 底部一排 */
.canvas-prompt-input__footer {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.canvas-prompt-input__spacer {
  flex: 1 1 auto;
}
.canvas-prompt-input__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--canvas-bg-block-default);
  border: 0.5px solid var(--stroke-secondary);
  border-radius: 999px;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s, border-color 0.12s;
  user-select: none;
  white-space: nowrap;
}
.canvas-prompt-input__pill:hover {
  background: var(--canvas-float-block-hover);
}
.canvas-prompt-input__pill.is-action:hover {
  color: var(--brand-main-default);
  border-color: var(--brand-main-default);
}
.canvas-prompt-input__pill-icon {
  color: var(--brand-main-default);
  font-size: 12px;
}
.canvas-prompt-input__pill-caret {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* 模型 / 数量 下拉 */
.canvas-prompt-input__selector {
  position: relative;
}
.canvas-prompt-input__dropdown {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  min-width: 160px;
  max-height: 280px;
  overflow-y: auto;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--canvas-float-block-default);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  border: 0.5px solid var(--stroke-secondary);
  border-radius: var(--lv-border-radius-medium);
  box-shadow: var(--shadow-generator-float-block);
  z-index: 10;
}
.canvas-prompt-input__dropdown--count {
  min-width: 80px;
  text-align: center;
}
.canvas-prompt-input__dropdown-item {
  padding: 6px 10px;
  border-radius: var(--lv-border-radius-small);
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s;
}
.canvas-prompt-input__dropdown-item:hover {
  background: var(--canvas-float-block-hover);
}
.canvas-prompt-input__dropdown-item.is-active {
  color: var(--brand-main-default);
  background: var(--brand-main-block-default);
}
.canvas-prompt-input__dropdown-empty {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

/* 价格 chip */
.canvas-prompt-input__price {
  padding: 4px 10px;
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  user-select: none;
}

/* 发送按钮 */
.canvas-prompt-input__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: var(--text-primary);
  color: var(--canvas-bg-block-default);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: opacity 0.12s, transform 0.12s;
}
.canvas-prompt-input__send:not(:disabled):hover {
  transform: translateY(-1px);
}
.canvas-prompt-input__send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.canvas-prompt-input__send .el-icon {
  font-size: 16px;
}

/* 动画 */
.canvas-prompt-input-dropdown-enter-active,
.canvas-prompt-input-dropdown-leave-active {
  transition: opacity 0.12s, transform 0.12s;
}
.canvas-prompt-input-dropdown-enter-from,
.canvas-prompt-input-dropdown-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
