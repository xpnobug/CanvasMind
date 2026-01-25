<script setup lang="ts">
// 数字人/动作模仿工具栏组件
// 基础配置工具栏，包含设置按钮
// 支持弹出方向设置

// 弹出方向类型
type Placement = 'top' | 'bottom' | 'auto'

// Props 定义（保持接口一致性，未来可能使用）
interface Props {
  // 弹出方向：top-向上, bottom-向下, auto-自动计算
  placement?: Placement
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'auto'
})
</script>

<template>
  <div class="digital-human-toolbar">
    <!-- 设置按钮 -->
    <button class="lv-btn lv-btn-secondary lv-btn-size-default lv-btn-shape-square button-lc3WzE toolbar-button-FhFnQ_"
            type="button">
      <svg width="1em" height="1em" viewBox="0 0 24 24"
           preserveAspectRatio="xMidYMid meet" fill="none"
           role="presentation" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path data-follow-fill="currentColor"
                d="M18.047 4.1a1 1 0 1 0-2 0v2.8a1 1 0 1 0 2 0v-.447h3.103a1 1 0 1 0 0-2h-3.103V4.1Zm-4 2.353H2.85a1 1 0 0 1 0-2h11.197v2Zm-7 3.247a1 1 0 0 0-1 1v.4H2.85a1 1 0 1 0 0 2h3.197v.4a1 1 0 1 0 2 0v-2.8a1 1 0 0 0-1-1Zm14.103 3.4H10.047v-2H21.15a1 1 0 1 1 0 2Zm-10.103 3a1 1 0 0 0-1 1v2.8a1 1 0 1 0 2 0v-2.8a1 1 0 0 0-1-1ZM2.85 17.497h5.197v2H2.85a1 1 0 1 1 0-2Zm18.3 2h-9.103v-2h9.103a1 1 0 1 1 0 2Z"
                clip-rule="evenodd" fill-rule="evenodd"
                fill="currentColor"></path>
        </g>
      </svg>
      <span>设置</span>
    </button>
  </div>
</template>

<style>
/* 样式已在 generate.css 中定义 */
.digital-human-toolbar {
  display: contents;
}
</style>
