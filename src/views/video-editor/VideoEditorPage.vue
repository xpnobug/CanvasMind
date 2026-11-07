<template>
	<div ref="mountRef" class="cutia-root cutia-fullscreen-mount"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import { createRoot, type Root } from 'react-dom/client'
import { createElement } from 'react'
import { useRoute } from 'vue-router'
import { VideoEditor } from '@cutia/VideoEditor'
import { ensureRemoteStorageInstalled } from '@/cutia-integration/storage-bridge'

// 必须在 React mount 前完成单例替换,确保 cutia 内部 storageService 读写
// 全部走 RemoteStorageAdapter → /api/video-projects/*。
ensureRemoteStorageInstalled()

const route = useRoute()
const mountRef = ref<HTMLElement>()
let root: Root | null = null

// 正式路由用 path param :projectId(RESTful 语义,与 workflow 路由风格一致)。
const projectId = computed(() => String(route.params.projectId || ''))

onMounted(() => {
	if (!mountRef.value) return
	root = createRoot(mountRef.value)
	renderEditor()
})

watch(projectId, () => renderEditor())

function renderEditor() {
	if (!projectId.value) return
	root?.render(createElement(VideoEditor, { projectId: projectId.value }))
}

onBeforeUnmount(() => {
	root?.unmount()
	root = null
})
</script>

<style scoped>
.cutia-root {
	isolation: isolate;
}

/* 与 FullEditorPage 同样的全屏覆盖策略:Vue 主入口 html/body/#app 高度均为 auto,
 * router-view 无显式高度,h-screen 会被父级 overflow:hidden 截断。
 * fixed inset:0 让编辑器脱离 Vue 父容器高度限制。z-index:10 留给 LoginModal 等顶层 overlay。
 */
.cutia-fullscreen-mount {
	position: fixed;
	inset: 0;
	z-index: 10;
}
</style>
