<script setup>
const props = defineProps({
  zoom: {
    type: Number,
    default: 100
  }
})

const emit = defineEmits(['zoom-change'])

const zoomIn = () => {
  emit('zoom-change', Math.min(200, props.zoom + 10))
}

const zoomOut = () => {
  emit('zoom-change', Math.max(1, props.zoom - 10))
}
</script>

<template>
  <div class="bottom-left-widget">
    <div class="container">
      <!-- 帮助中心 -->
      <div class="help-center">
        <div class="trigger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="icon">
            <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm8.825 4.897a1.175 1.175 0 1 1 2.35 0 1.175 1.175 0 0 1-2.35 0ZM12 6.11c-.477 0-.95.09-1.395.263-.443.173-.85.43-1.195.755a3.538 3.538 0 0 0-.813 1.15c-.205.468-.289 1.049-.289 1.481a1 1 0 0 0 2 0c0-.235.055-.527.12-.677.081-.184.2-.354.355-.5a1.72 1.72 0 0 1 .551-.347 1.83 1.83 0 0 1 1.332 0c.21.082.396.2.55.347.155.146.275.316.355.5.08.183.12.377.12.571 0 .439-.108.662-.22.811-.139.185-.339.336-.686.572l-.066.044c-.302.204-.736.496-1.074.912-.403.495-.645 1.12-.645 1.923a1 1 0 0 0 2 0c0-.362.095-.536.196-.66.141-.174.34-.313.711-.564l.008-.005c.325-.22.793-.538 1.156-1.022.393-.524.62-1.178.62-2.01 0-.474-.098-.941-.288-1.375a3.538 3.538 0 0 0-.813-1.15 3.708 3.708 0 0 0-1.195-.756A3.829 3.829 0 0 0 12 6.11Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
          </svg>
        </div>
      </div>
      
      <!-- 缩放控制 -->
      <div class="zoom-container">
        <div class="zoom-button">
          <span class="zoom-icon" @click="zoomOut">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M2.8 12A1.2 1.2 0 0 1 4 10.8h16a1.2 1.2 0 1 1 0 2.4H4A1.2 1.2 0 0 1 2.8 12Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
            </svg>
          </span>
          <span class="zoom-text">{{ zoom }}%</span>
          <span class="zoom-icon" @click="zoomIn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M10.8 20a1.2 1.2 0 0 0 2.4 0v-6.8H20a1.2 1.2 0 1 0 0-2.4h-6.8V4a1.2 1.2 0 0 0-2.4 0v6.8H4a1.2 1.2 0 0 0 0 2.4h6.8V20Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bottom-left-widget {
  bottom: 12px;
  left: 12px;
  position: absolute;
  z-index: 1000001;
}

.container {
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.help-center {
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  background: var(--canvas-float-block-default);
  border: 0.5px solid var(--stroke-tertiary);
  border-radius: 8px;
  box-shadow: var(--shadow-generator-float-block);
  cursor: pointer;
  font-size: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.trigger {
  align-items: center;
  background: var(--canvas-float-block-default);
  color: var(--text-secondary);
  display: flex;
  height: 40px;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  width: 40px;
}

.trigger:hover {
  color: var(--text-primary);
}

.trigger .icon {
  height: 20px;
  width: 20px;
}

.zoom-container {
  align-items: center;
  display: flex;
  height: 40px;
}

.zoom-button {
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  background: var(--canvas-float-block-default);
  border-radius: 8px;
  box-shadow: var(--shadow-generator-float-block);
  box-sizing: border-box;
  cursor: pointer;
  gap: 4px;
  outline: 0.5px solid var(--stroke-tertiary);
  padding: 6px 8px;
  transition: background-color 0.2s;
  user-select: none;
  align-items: center;
  display: flex;
  height: 40px;
}

.zoom-icon {
  align-items: center;
  color: var(--text-secondary);
  display: flex;
  font-size: 14px;
  font-weight: 500;
  height: 16px;
  justify-content: center;
  line-height: 20px;
  width: 16px;
  cursor: pointer;
  transition: color 0.2s;
}

.zoom-icon:hover {
  color: var(--text-primary);
}

.zoom-text {
  color: var(--text-primary);
  font-family: PingFang SC, sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  margin: 0 10px;
  min-width: 24px;
  text-align: center;
}
</style>
