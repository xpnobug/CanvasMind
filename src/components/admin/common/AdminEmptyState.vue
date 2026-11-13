<template>
  <div
    class="admin-empty"
    :class="[
      emptyClass,
      {
        'admin-empty--illustrated': showIllustration,
        'admin-empty--compact': compact,
      },
    ]"
  >
    <img
      v-if="showIllustration"
      class="admin-empty__art"
      :src="illustrationSrc"
      alt=""
      width="160"
      height="133"
      decoding="async"
    >
    <div class="admin-empty__body">
      <p
        v-if="title"
        class="admin-empty__title"
      >
        {{ title }}
      </p>
      <div
        v-if="hasMessage"
        class="admin-empty__message"
      >
        <slot>{{ message }}</slot>
      </div>
      <p
        v-if="hint"
        class="admin-empty__hint"
      >
        {{ hint }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(defineProps<{
  message?: string
  /** 主标题；有插图时优先展示 */
  title?: string
  /** 次要说明 */
  hint?: string
  /** 是否展示空态插图，默认开启 */
  illustrated?: boolean
  /** 自定义插图；默认空箱子 SVG */
  illustration?: string
  compact?: boolean
  emptyClass?: string | string[] | Record<string, boolean>
}>(), {
  message: '',
  title: '',
  hint: '',
  illustrated: true,
  illustration: '',
  compact: false,
  emptyClass: '',
})

const slots = useSlots()

const showIllustration = computed(() => props.illustrated !== false)
const illustrationSrc = computed(() => (
  String(props.illustration || '').trim() || '/admin/empty-box.svg'
))
/** 有默认插槽或非空 message 才渲染正文，避免与 title 叠一句同义文案 */
const hasMessage = computed(() => (
  Boolean(slots.default) || Boolean(String(props.message || '').trim())
))
</script>
