<template>
  <span
    class="thyuu-theme-mode-icon"
    :class="[`is-${resolvedMode}`, `is-${resolvedSize}`]"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThemeMode } from '@/stores/theme-preference'

const props = withDefaults(defineProps<{
  mode: ThemeMode | 'light' | 'dark' | 'system'
  size?: 'sm' | 'md' | 'lg' | 'menu'
}>(), {
  size: 'md',
})

const resolvedMode = computed(() => {
  if (props.mode === 'system') {
    return 'system'
  }
  return props.mode === 'dark' ? 'dark' : 'light'
})

const resolvedSize = computed(() => props.size)
</script>

<style scoped>
.thyuu-theme-mode-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: inherit;
  line-height: 0;
}

.thyuu-theme-mode-icon.is-sm {
  font-size: 14px;
  width: 14px;
  height: 14px;
}

.thyuu-theme-mode-icon.is-md {
  font-size: 18px;
  width: 18px;
  height: 18px;
}

.thyuu-theme-mode-icon.is-lg {
  font-size: 20px;
  width: 20px;
  height: 20px;
}

/* 与侧栏 SVG（.icon-menu font-size:20px / 1em）光学对齐：月亮本身偏瘦，略放大 */
.thyuu-theme-mode-icon.is-menu {
  font-size: 1em;
  width: 1em;
  height: 1em;
}

.thyuu-theme-mode-icon::before {
  content: ' ';
  display: block;
  width: 1em;
  height: 1em;
  background: currentColor;
  border-radius: 50%;
  box-shadow:
    -0.7em 0 0 -0.4em,
    -0.5em 0.5em 0 -0.4em,
    0 -0.7em 0 -0.4em,
    0.5em -0.5em 0 -0.4em,
    0.7em 0 0 -0.4em,
    0.5em 0.5em 0 -0.4em,
    0 0.7em 0 -0.4em,
    -0.5em -0.5em 0 -0.4em,
    inset 0 0;
  transform: scale(0.65) rotate(0deg);
  transition: transform 0.7s cubic-bezier(0.6, 0.1, 0, 1), color 0s;
}

.thyuu-theme-mode-icon.is-dark::before {
  background: transparent;
  box-shadow:
    0 0 0 -0.4em,
    0 0 0 -0.4em,
    0 0 0 -0.4em,
    0 0 0 -0.4em,
    0 0 0 -0.4em,
    0 0 0 -0.4em,
    0 0 0 -0.4em,
    0 0 0 -0.4em,
    inset -0.4em -0.4em;
  transform: none;
}

.thyuu-theme-mode-icon.is-menu.is-dark::before {
  transform: scale(0.82);
}

.thyuu-theme-mode-icon.is-system::before {
  content: 'A';
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  box-shadow: none;
  outline: 2px solid currentColor;
  outline-offset: 0.25em;
  font-size: 0.52em;
  font-weight: 600;
  line-height: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .thyuu-theme-mode-icon::before {
    transition: none;
  }
}
</style>

<style>
@media (hover: hover) {
  .thyuu-theme-mode-icon.is-light:hover::before,
  .sideMenu .bottomMenu .lv-menu-item:hover .thyuu-theme-mode-icon.is-light::before,
  .sideMenu .side-menu-theme-item:hover .thyuu-theme-mode-icon.is-light::before,
  .mobile-top-bar__icon-btn:hover .thyuu-theme-mode-icon.is-light::before {
    transform: scale(0.8) rotate(-180deg);
  }
}
</style>
