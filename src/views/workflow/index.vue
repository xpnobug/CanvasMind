<script setup>
/**
 * 工作流主页面
 * 基于 Vue Flow 的节点连线工作流画布
 */
import { ref, computed, onMounted, onUnmounted, nextTick, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import {
  nodes, edges, addNode, addEdge, updateNode,
  clearCanvas, canvasViewport, updateViewport,
  undo, redo, canUndo, canRedo, manualSaveHistory, initSampleData, initHistory
} from './composables/useWorkflowCanvas'
import { WORKFLOW_TEMPLATES } from './config/workflows'
import SettingsDialog from '@/components/common/ApiSettingsDialog.vue'
import ContentGenerator from '@/components/generate/ContentGenerator.vue'
import { useWorkflowOrchestrator } from './composables/useWorkflowOrchestrator'

// 节点组件
import TextNode from './components/nodes/TextNode.vue'
import ImageConfigNode from './components/nodes/ImageConfigNode.vue'
import ImageNode from './components/nodes/ImageNode.vue'
import VideoConfigNode from './components/nodes/VideoConfigNode.vue'
import VideoNode from './components/nodes/VideoNode.vue'
import LlmConfigNode from './components/nodes/LlmConfigNode.vue'

// 边组件
import ImageRoleEdge from './components/edges/ImageRoleEdge.vue'
import PromptOrderEdge from './components/edges/PromptOrderEdge.vue'
import ImageOrderEdge from './components/edges/ImageOrderEdge.vue'

const router = useRouter()
const { viewport, zoomIn, zoomOut, fitView, updateNodeInternals } = useVueFlow()

// 注册自定义节点类型
const nodeTypes = {
  text: markRaw(TextNode),
  imageConfig: markRaw(ImageConfigNode),
  image: markRaw(ImageNode),
  videoConfig: markRaw(VideoConfigNode),
  video: markRaw(VideoNode),
  llmConfig: markRaw(LlmConfigNode)
}

// 注册自定义边类型
const edgeTypes = {
  imageRole: markRaw(ImageRoleEdge),
  promptOrder: markRaw(PromptOrderEdge),
  imageOrder: markRaw(ImageOrderEdge)
}

// 工作流编排器
const { analyzeIntent, executeWorkflow, isAnalyzing, isExecuting } = useWorkflowOrchestrator()

// UI 状态
const showNodeMenu = ref(false)
const showTemplatePanel = ref(false)
const showSettings = ref(false)

// 添加工作流模板
const handleAddWorkflow = (workflow) => {
  const cx = -viewport.value.x / viewport.value.zoom + (window.innerWidth / 2) / viewport.value.zoom
  const cy = -viewport.value.y / viewport.value.zoom + (window.innerHeight / 2) / viewport.value.zoom
  const start = { x: cx - 300, y: cy - 200 }
  const { nodes: newNodes, edges: newEdges } = workflow.createNodes(start)

  newNodes.forEach(node => {
    const id = addNode(node.type, node.position, node.data)
    newEdges.forEach(edge => {
      if (edge.source === node.id) edge.source = id
      if (edge.target === node.id) edge.target = id
    })
    node.newId = id
  })

  setTimeout(() => {
    newEdges.forEach(edge => {
      addEdge({ source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle || 'right', targetHandle: edge.targetHandle || 'left', type: edge.type, data: edge.data })
    })
    newNodes.forEach(node => { if (node.newId) updateNodeInternals(node.newId) })
  }, 100)

  showTemplatePanel.value = false
}

// 节点类型菜单选项
const nodeTypeOptions = [
  { type: 'text', name: '文本节点', color: '#3b82f6', icon: 'M4 6h16M4 12h8m-8 6h16' },
  { type: 'imageConfig', name: '文生图配置', color: '#22c55e', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { type: 'videoConfig', name: '视频生成配置', color: '#f59e0b', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { type: 'llmConfig', name: 'LLM 文本生成', color: '#a855f7', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z' },
  { type: 'image', name: '图片节点', color: '#8b5cf6', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { type: 'video', name: '视频节点', color: '#ef4444', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' }
]

// 工具栏按钮
const tools = [
  { id: 'text', name: '文本', icon: 'M4 6h16M4 12h8m-8 6h16', action: () => addNewNode('text') },
  { id: 'imageConfig', name: '文生图', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', action: () => addNewNode('imageConfig') },
  { id: 'videoConfig', name: '视频生成', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', action: () => addNewNode('videoConfig') }
]

// 添加新节点
const addNewNode = (type) => {
  const cx = -viewport.value.x / viewport.value.zoom + (window.innerWidth / 2) / viewport.value.zoom
  const cy = -viewport.value.y / viewport.value.zoom + (window.innerHeight / 2) / viewport.value.zoom
  const id = addNode(type, { x: cx - 140, y: cy - 100 })
  const maxZ = Math.max(0, ...nodes.value.map(n => n.zIndex || 0))
  updateNode(id, { zIndex: maxZ + 1 })
  setTimeout(() => updateNodeInternals(id), 50)
  showNodeMenu.value = false
}

// 处理连接
const onConnect = (params) => {
  const sourceNode = nodes.value.find(n => n.id === params.source)
  const targetNode = nodes.value.find(n => n.id === params.target)

  if (sourceNode?.type === 'text' && targetNode?.type === 'imageConfig') {
    const existing = edges.value.filter(e => e.target === params.target && e.type === 'promptOrder')
    addEdge({ ...params, type: 'promptOrder', data: { promptOrder: existing.length + 1 } })
  } else if (sourceNode?.type === 'image' && targetNode?.type === 'imageConfig') {
    const existing = edges.value.filter(e => e.target === params.target && e.type === 'imageOrder')
    addEdge({ ...params, type: 'imageOrder', data: { imageOrder: existing.length + 1 } })
  } else if (sourceNode?.type === 'image' && targetNode?.type === 'videoConfig') {
    addEdge({ ...params, type: 'imageRole', data: { imageRole: 'first_frame_image' } })
  } else if (sourceNode?.type === 'text' && targetNode?.type === 'videoConfig') {
    addEdge({ ...params, type: 'promptOrder', data: { promptOrder: 1 } })
  } else {
    addEdge(params)
  }
}

// 处理视口变化
const handleViewportChange = (v) => updateViewport(v)

// 处理边变化
const onEdgesChange = (changes) => {
  if (changes.some(c => c.type === 'remove')) {
    nextTick(() => manualSaveHistory())
  }
}

// 处理画布点击
const onPaneClick = () => { showNodeMenu.value = false }

// 处理内容生成器发送（使用工作流编排器）
const handlePromptSend = async (message, type) => {
  const cx = -viewport.value.x / viewport.value.zoom + (window.innerWidth / 2) / viewport.value.zoom
  const cy = -viewport.value.y / viewport.value.zoom + (window.innerHeight / 2) / viewport.value.zoom
  const position = { x: cx - 300, y: cy - 100 }

  if (type === 'agent') {
    // agent 类型：意图分析 + 自动编排执行
    try {
      const intent = await analyzeIntent(message)
      await executeWorkflow(intent, position)
    } catch (err) {
      console.error('工作流执行失败:', err)
    }
  } else if (type === 'image') {
    await executeWorkflow({ workflow_type: 'text_to_image', image_prompt: message }, position)
  } else if (type === 'video') {
    await executeWorkflow({ workflow_type: 'text_to_image_to_video', image_prompt: message, video_prompt: message }, position)
  }
}

// 返回首页
const goBack = () => router.push('/')

// 键盘快捷键
const handleKeydown = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
    e.preventDefault()
    e.shiftKey ? redo() : undo()
  }
}

onMounted(() => {
  initSampleData()
  initHistory()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="workflow-container">
    <div class="workflow-workbench">
      <div class="workflow-main">
        <!-- Vue Flow 画布 -->
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          v-model:viewport="viewport"
          :node-types="nodeTypes"
          :edge-types="edgeTypes"
          :default-viewport="canvasViewport"
          :min-zoom="0.1"
          :max-zoom="2"
          :snap-to-grid="true"
          :snap-grid="[20, 20]"
          @connect="onConnect"
          @pane-click="onPaneClick"
          @viewport-change="handleViewportChange"
          @edges-change="onEdgesChange"
          class="workflow-canvas"
        >
          <Background :gap="20" :size="1" />
          <MiniMap position="bottom-right" :pannable="true" :zoomable="true" />
        </VueFlow>

        <!-- 顶部栏 -->
        <header class="workflow-header">
          <div class="workflow-header-left">
            <button class="wf-btn wf-btn-sm" @click="goBack" title="返回">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <span style="font-size: 13px; color: var(--text-primary); padding: 0 8px;">工作流</span>
          </div>
          <div class="workflow-header-right">
            <button class="wf-btn wf-btn-sm" @click="showSettings = !showSettings" title="API 设置">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- 左侧工具栏 -->
        <nav class="workflow-left-toolbar">
          <div class="workflow-left-toolbar-container">
            <!-- 添加节点按钮 -->
            <button
              class="wf-btn wf-btn-icon"
              :class="{ active: showNodeMenu }"
              @click="showNodeMenu = !showNodeMenu"
              title="添加节点"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>

            <!-- 工作流模板按钮 -->
            <button
              class="wf-btn wf-btn-icon"
              :class="{ active: showTemplatePanel }"
              @click="showTemplatePanel = !showTemplatePanel"
              title="工作流模板"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>

            <div class="wf-divider"></div>

            <!-- 工具按钮 -->
            <button
              v-for="tool in tools"
              :key="tool.id"
              class="wf-btn wf-btn-icon"
              @click="tool.action"
              :title="tool.name"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path :d="tool.icon" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div class="wf-divider"></div>

            <!-- 撤销/重做 -->
            <button class="wf-btn wf-btn-icon" :disabled="!canUndo()" @click="undo()" title="撤销">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 14l-4-4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="wf-btn wf-btn-icon" :disabled="!canRedo()" @click="redo()" title="重做">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 10H11a5 5 0 00-5 5v0a5 5 0 005 5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 14l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </nav>

        <!-- 节点菜单弹窗 -->
        <div v-if="showNodeMenu" class="wf-node-menu">
          <button
            v-for="opt in nodeTypeOptions"
            :key="opt.type"
            class="wf-node-menu-item"
            @click="addNewNode(opt.type)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path :d="opt.icon" :stroke="opt.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ opt.name }}</span>
          </button>
        </div>

        <!-- 底部控制栏 -->
        <div class="workflow-bottom-toolbar">
          <div class="workflow-bottom-toolbar-container">
            <button class="wf-btn wf-btn-sm" @click="fitView({ padding: 0.2 })" title="适应视图">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="wf-btn wf-btn-sm" @click="zoomOut()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <span class="wf-zoom-text">{{ Math.round(viewport.zoom * 100) }}%</span>
            <button class="wf-btn wf-btn-sm" @click="zoomIn()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 工作流模板面板 -->
        <Transition name="wf-panel">
          <div v-if="showTemplatePanel" class="wf-template-panel" @click.self="showTemplatePanel = false">
            <div class="wf-template-panel-inner">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 500; color: var(--text-primary);">工作流模板</span>
                <button class="wf-btn wf-btn-sm" @click="showTemplatePanel = false">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
              </div>
              <div class="wf-template-list">
                <div
                  v-for="tpl in WORKFLOW_TEMPLATES"
                  :key="tpl.id"
                  class="wf-template-card"
                  @click="handleAddWorkflow(tpl)"
                >
                  <div class="wf-template-card-title">{{ tpl.name }}</div>
                  <div class="wf-template-card-desc">{{ tpl.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 底部内容生成器 -->
        <ContentGenerator
          class="workflow-content-generator"
          :collapsible="true"
          :default-expanded="false"
          popup-placement="top"
          @send="handlePromptSend"
        />

        <!-- 设置弹窗 -->
        <SettingsDialog v-model:visible="showSettings" />
      </div>
    </div>
  </div>
</template>

<style>
@import './styles/workflow.css';
</style>
