/**
 * 工作流编排 Hook
 * 使用回调串行结构编排节点执行
 *
 * 依赖关系：
 * - imageConfig 执行后产生 image 节点
 * - videoConfig 依赖 image 节点作为输入
 * - 串行执行：等待上一步完成后再执行下一步
 */

import { ref, watch } from 'vue'
import { streamChatCompletions } from '../api/chat'
import { nodes, addNode, addEdge, updateNode } from './useWorkflowCanvas'
import { MULTI_ANGLE_PROMPTS } from '../config/workflows'

// 工作流类型
const WORKFLOW_TYPES = {
  TEXT_TO_IMAGE: 'text_to_image',
  TEXT_TO_IMAGE_TO_VIDEO: 'text_to_image_to_video',
  STORYBOARD: 'storyboard',
  MULTI_ANGLE_STORYBOARD: 'multi_angle_storyboard',
}

// 意图分析系统提示词
const INTENT_ANALYSIS_PROMPT = `你是一个工作流分析助手。根据用户输入判断需要的工作流类型，并生成对应的提示词。

工作流类型：
1. text_to_image - 用户想要生成单张图片（默认）
2. text_to_image_to_video - 用户想要生成图片并转成视频（包含"视频"、"动画"、"动起来"等关键词）
3. storyboard - 用户想要生成分镜/多场景图片（包含"分镜"、"场景一"、"镜头"等关键词，或描述多个连续场景）
4. multi_angle_storyboard - 用户想要生成多角度分镜（包含"多角度"、"正视"、"侧视"、"后视"、"俯视"、"四宫格"、"景别"等关键词）

返回 JSON：
{
  "workflow_type": "text_to_image | text_to_image_to_video | storyboard | multi_angle_storyboard",
  "description": "简短描述",
  "image_prompt": "优化后的图片生成提示词",
  "video_prompt": "视频生成提示词（仅 text_to_image_to_video）",
  "character": {
    "name": "角色名称",
    "description": "角色外观描述"
  },
  "shots": [
    { "title": "分镜标题", "prompt": "该分镜的详细画面描述" }
  ],
  "multi_angle": {
    "character_description": "角色的详细外观描述"
  }
}

返回纯 JSON，不要其他内容。`

export const useWorkflowOrchestrator = () => {
  const isAnalyzing = ref(false)
  const isExecuting = ref(false)
  const currentStep = ref(0)
  const totalSteps = ref(0)
  const executionLog = ref([])
  const activeWatchers = []

  const addLog = (type, message) => {
    executionLog.value.push({ type, message, timestamp: Date.now() })
    console.log(`[工作流 ${type}] ${message}`)
  }

  const clearWatchers = () => {
    activeWatchers.forEach(stop => stop())
    activeWatchers.length = 0
  }

  // 等待配置节点完成并返回输出节点 ID
  const waitForConfigComplete = (configNodeId) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('执行超时')), 5 * 60 * 1000)
      let stopWatcher = null

      const checkNode = (node) => {
        if (!node) return false
        if (node.data?.error) {
          clearTimeout(timeout)
          stopWatcher?.()
          reject(new Error(node.data.error))
          return true
        }
        if (node.data?.executed && node.data?.outputNodeId) {
          clearTimeout(timeout)
          stopWatcher?.()
          addLog('success', `节点 ${configNodeId} 完成`)
          resolve(node.data.outputNodeId)
          return true
        }
        return false
      }

      const node = nodes.value.find(n => n.id === configNodeId)
      if (checkNode(node)) return

      stopWatcher = watch(
        () => nodes.value.find(n => n.id === configNodeId),
        (node) => checkNode(node),
        { deep: true }
      )
      activeWatchers.push(stopWatcher)
    })
  }

  // 等待输出节点准备好
  const waitForOutputReady = (outputNodeId) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('输出节点超时')), 5 * 60 * 1000)
      let stopWatcher = null

      const checkNode = (node) => {
        if (!node) return false
        if (node.data?.error) {
          clearTimeout(timeout)
          stopWatcher?.()
          reject(new Error(node.data.error))
          return true
        }
        if (node.data?.url && !node.data?.loading) {
          clearTimeout(timeout)
          stopWatcher?.()
          resolve(node)
          return true
        }
        return false
      }

      const node = nodes.value.find(n => n.id === outputNodeId)
      if (checkNode(node)) return

      stopWatcher = watch(
        () => nodes.value.find(n => n.id === outputNodeId),
        (node) => checkNode(node),
        { deep: true }
      )
      activeWatchers.push(stopWatcher)
    })
  }

  // 分析用户意图
  const analyzeIntent = async (userInput) => {
    isAnalyzing.value = true
    try {
      let response = ''
      for await (const chunk of streamChatCompletions({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: INTENT_ANALYSIS_PROMPT },
          { role: 'user', content: userInput }
        ]
      })) {
        response += chunk
      }
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return { workflow_type: WORKFLOW_TYPES.TEXT_TO_IMAGE, image_prompt: userInput }
      return JSON.parse(jsonMatch[0])
    } catch (err) {
      addLog('error', `分析失败: ${err.message}`)
      return { workflow_type: WORKFLOW_TYPES.TEXT_TO_IMAGE, image_prompt: userInput }
    } finally {
      isAnalyzing.value = false
    }
  }

  // 文生图工作流
  const executeTextToImage = async (imagePrompt, position) => {
    const sp = 400
    addLog('info', '开始执行文生图工作流')
    currentStep.value = 1
    totalSteps.value = 2

    const textId = addNode('text', { x: position.x, y: position.y }, { content: imagePrompt, label: '图片提示词' })
    const configId = addNode('imageConfig', { x: position.x + sp, y: position.y }, { label: '文生图', autoExecute: true })
    addEdge({ source: textId, target: configId, sourceHandle: 'right', targetHandle: 'left', type: 'promptOrder', data: { promptOrder: 1 } })

    addLog('success', '文生图工作流已启动')
    return { textId, configId }
  }

  // 文生图生视频工作流
  const executeTextToImageToVideo = async (imagePrompt, videoPrompt, position) => {
    const sp = 400
    addLog('info', '开始执行文生图生视频工作流')
    currentStep.value = 1
    totalSteps.value = 5

    const imgTextId = addNode('text', { x: position.x, y: position.y }, { content: imagePrompt, label: '图片提示词' })
    const vidTextId = addNode('text', { x: position.x, y: position.y + 200 }, { content: videoPrompt, label: '视频提示词' })
    const imgConfigId = addNode('imageConfig', { x: position.x + sp, y: position.y }, { label: '文生图', autoExecute: true })
    addEdge({ source: imgTextId, target: imgConfigId, sourceHandle: 'right', targetHandle: 'left', type: 'promptOrder', data: { promptOrder: 1 } })

    try {
      addLog('info', '等待图片生成完成...')
      const imageNodeId = await waitForConfigComplete(imgConfigId)
      await waitForOutputReady(imageNodeId)

      const imageNode = nodes.value.find(n => n.id === imageNodeId)
      const vx = (imageNode?.position?.x || position.x + sp) + sp

      const vidConfigId = addNode('videoConfig', { x: vx, y: position.y + 200 }, { label: '图生视频', autoExecute: true })
      addEdge({ source: vidTextId, target: vidConfigId, sourceHandle: 'right', targetHandle: 'left', type: 'promptOrder', data: { promptOrder: 1 } })
      addEdge({ source: imageNodeId, target: vidConfigId, sourceHandle: 'right', targetHandle: 'left', type: 'imageRole', data: { imageRole: 'first_frame_image' } })

      addLog('success', '文生图生视频工作流已启动')
      return { imgTextId, vidTextId, imgConfigId, imageNodeId, vidConfigId }
    } catch (err) {
      addLog('error', `工作流执行失败: ${err.message}`)
      throw err
    }
  }

  // 分镜工作流
  const executeStoryboard = async (character, shots, position) => {
    const sp = 400, rsp = 250
    const shotCount = shots?.length || 0
    addLog('info', `开始执行分镜工作流: ${character?.name || '未知角色'}, ${shotCount} 个分镜`)
    currentStep.value = 1
    totalSteps.value = 2 + shotCount * 2

    try {
      const charDesc = `${character?.name || '角色'}: ${character?.description || ''}`
      const charTextId = addNode('text', { x: position.x, y: position.y }, { content: charDesc, label: `角色: ${character?.name || '参考'}` })
      const charConfigId = addNode('imageConfig', { x: position.x + sp, y: position.y }, { label: '角色参考图', autoExecute: true })
      addEdge({ source: charTextId, target: charConfigId, sourceHandle: 'right', targetHandle: 'left', type: 'promptOrder', data: { promptOrder: 1 } })

      addLog('info', '等待角色参考图生成...')
      const charImageId = await waitForConfigComplete(charConfigId)
      await waitForOutputReady(charImageId)
      addLog('success', '角色参考图已生成')

      const createdShots = []
      for (let i = 0; i < shotCount; i++) {
        const shot = shots[i]
        const sy = position.y + (i + 1) * rsp
        currentStep.value = 3 + i * 2

        const shotTextId = addNode('text', { x: position.x, y: sy }, { content: shot.prompt, label: `分镜${i + 1}: ${shot.title}` })
        const shotConfigId = addNode('imageConfig', { x: position.x + sp, y: sy }, { label: `分镜${i + 1}`, autoExecute: true })
        addEdge({ source: shotTextId, target: shotConfigId, sourceHandle: 'right', targetHandle: 'left', type: 'promptOrder', data: { promptOrder: 1 } })
        addEdge({ source: charImageId, target: shotConfigId, sourceHandle: 'right', targetHandle: 'left', type: 'imageOrder', data: { imageOrder: 1 } })

        addLog('info', `等待分镜${i + 1}生成...`)
        const shotImageId = await waitForConfigComplete(shotConfigId)
        await waitForOutputReady(shotImageId)
        addLog('success', `分镜${i + 1}已生成`)
        createdShots.push({ textId: shotTextId, configId: shotConfigId, imageId: shotImageId })
      }

      addLog('success', `分镜工作流完成，共生成 ${shotCount} 个分镜`)
      return { charTextId, charConfigId, charImageId, shots: createdShots }
    } catch (err) {
      addLog('error', `分镜工作流执行失败: ${err.message}`)
      throw err
    }
  }

  // 多角度分镜工作流
  const executeMultiAngleStoryboard = async (multiAngle, position) => {
    const sp = 400, rsp = 300
    const characterDesc = multiAngle?.character_description || ''
    const angles = ['front', 'side', 'back', 'top']

    addLog('info', '开始执行多角度分镜工作流')
    currentStep.value = 1
    totalSteps.value = 2 + angles.length * 2

    try {
      const charImageId = addNode('image', { x: position.x, y: position.y }, { url: '', label: '主角色图（请上传）' })
      const createdAngles = []
      const ax = position.x + sp + 100

      for (let i = 0; i < angles.length; i++) {
        const key = angles[i]
        const cfg = MULTI_ANGLE_PROMPTS[key]
        const ay = position.y + i * rsp

        const textId = addNode('text', { x: ax, y: ay }, { content: cfg.prompt(characterDesc), label: `${cfg.label}提示词` })
        const configId = addNode('imageConfig', { x: ax + sp, y: ay }, { label: `${cfg.label} (${cfg.english})` })
        addEdge({ source: textId, target: configId, sourceHandle: 'right', targetHandle: 'left', type: 'promptOrder', data: { promptOrder: 1 } })
        addEdge({ source: charImageId, target: configId, sourceHandle: 'right', targetHandle: 'left', type: 'imageOrder', data: { imageOrder: 1 } })

        createdAngles.push({ key, textId, configId })
      }

      addLog('success', '多角度分镜工作流已创建，请上传主角色图后点击各节点的"立即生成"按钮')
      return { charImageId, angles: createdAngles }
    } catch (err) {
      addLog('error', `多角度分镜工作流执行失败: ${err.message}`)
      throw err
    }
  }

  // 根据工作流类型执行
  const executeWorkflow = async (params, position) => {
    isExecuting.value = true
    clearWatchers()
    executionLog.value = []

    try {
      switch (params.workflow_type) {
        case WORKFLOW_TYPES.MULTI_ANGLE_STORYBOARD:
          return await executeMultiAngleStoryboard(params.multi_angle, position)
        case WORKFLOW_TYPES.STORYBOARD:
          return await executeStoryboard(params.character, params.shots, position)
        case WORKFLOW_TYPES.TEXT_TO_IMAGE_TO_VIDEO:
          return await executeTextToImageToVideo(params.image_prompt, params.video_prompt, position)
        case WORKFLOW_TYPES.TEXT_TO_IMAGE:
        default:
          return await executeTextToImage(params.image_prompt, position)
      }
    } finally {
      isExecuting.value = false
      clearWatchers()
    }
  }

  const reset = () => {
    isAnalyzing.value = false
    isExecuting.value = false
    currentStep.value = 0
    totalSteps.value = 0
    executionLog.value = []
    clearWatchers()
  }

  return {
    isAnalyzing, isExecuting, currentStep, totalSteps, executionLog,
    analyzeIntent, executeWorkflow, reset,
    WORKFLOW_TYPES
  }
}

export default useWorkflowOrchestrator
