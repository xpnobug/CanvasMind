/**
 * 工作流模板配置
 * 预设工作流模板，支持一键添加到画布
 */

// 多角度提示词模板
export const MULTI_ANGLE_PROMPTS = {
  front: {
    label: '正视',
    english: 'Front View',
    prompt: (character) => `使用提供的图片，生成四宫格分镜，每张四宫格包括人物正面对着镜头的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性。\n\n角色参考: ${character}`
  },
  side: {
    label: '侧视',
    english: 'Side View',
    prompt: (character) => `使用提供的图片，生成四宫格分镜，每张四宫格包括人物侧面角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性。\n\n角色参考: ${character}`
  },
  back: {
    label: '后视',
    english: 'Back View',
    prompt: (character) => `使用提供的图片，生成四宫格分镜，每张四宫格包括人物背影角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性。\n\n角色参考: ${character}`
  },
  top: {
    label: '俯视',
    english: "Top/Bird's Eye View",
    prompt: (character) => `使用提供的图片，生成四宫格分镜，每张四宫格包括俯视角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性。\n\n角色参考: ${character}`
  }
}

let _counter = 0
const getId = () => `wf_${Date.now()}_${_counter++}`

/**
 * 工作流模板列表
 */
export const WORKFLOW_TEMPLATES = [
  // ========== 1. 多角度分镜 ==========
  {
    id: 'multi-angle-storyboard',
    name: '多角度分镜',
    description: '生成角色的正视、侧视、后视、俯视四宫格分镜图',
    category: 'storyboard',
    createNodes: (startPosition) => {
      _counter = 0
      const sp = 400, rsp = 280
      const angles = ['front', 'side', 'back', 'top']
      const nodes = [], edges = []

      // 角色提示词
      const txtId = getId()
      nodes.push({ id: txtId, type: 'text', position: { x: startPosition.x, y: startPosition.y + rsp * 1.5 }, data: { content: '', label: '角色提示词' } })

      // 角色图配置
      const cfgId = getId()
      nodes.push({ id: cfgId, type: 'imageConfig', position: { x: startPosition.x + sp, y: startPosition.y + rsp * 1.5 }, data: { label: '主角色图', model: 'doubao-seedream-4-5-251128', size: '2048x2048' } })

      // 角色图结果
      const imgId = getId()
      nodes.push({ id: imgId, type: 'image', position: { x: startPosition.x + sp * 2, y: startPosition.y + rsp * 1.5 }, data: { url: '', label: '角色图结果' } })

      edges.push({ id: `e_${txtId}_${cfgId}`, source: txtId, target: cfgId, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${cfgId}_${imgId}`, source: cfgId, target: imgId, sourceHandle: 'right', targetHandle: 'left' })

      // 4个角度
      const ax = startPosition.x + sp * 3 + 100
      angles.forEach((key, i) => {
        const cfg = MULTI_ANGLE_PROMPTS[key]
        const ay = startPosition.y + i * rsp

        const tId = getId()
        nodes.push({ id: tId, type: 'text', position: { x: ax, y: ay }, data: { content: cfg.prompt(''), label: `${cfg.label}提示词` } })

        const cId = getId()
        nodes.push({ id: cId, type: 'imageConfig', position: { x: ax + sp, y: ay }, data: { label: `${cfg.label} (${cfg.english})`, model: 'doubao-seedream-4-5-251128', size: '2048x2048' } })

        edges.push({ id: `e_${tId}_${cId}`, source: tId, target: cId, type: 'promptOrder', data: { promptOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
        edges.push({ id: `e_${imgId}_${cId}`, source: imgId, target: cId, type: 'imageOrder', data: { imageOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
      })

      return { nodes, edges }
    }
  },

  // ========== 2. 通用产品全套电商图 ==========
  {
    id: 'product-ecommerce-full-set',
    name: '通用产品全套电商图',
    description: '根据产品信息和图片，生成模特图、侧面图、俯瞰图、拆解图',
    category: 'ecommerce',
    createNodes: (startPosition) => {
      _counter = 0
      const col = 500, row = 350
      const nodes = [], edges = []

      // 输入：产品信息
      const infoId = getId()
      nodes.push({ id: infoId, type: 'text', position: { x: startPosition.x, y: startPosition.y }, data: { content: '在此输入产品信息...', label: '产品信息' } })

      // 输入：产品图片
      const imgId = getId()
      nodes.push({ id: imgId, type: 'image', position: { x: startPosition.x, y: startPosition.y + row }, data: { url: '', label: '产品图片' } })

      // 4组提示词 + 配置
      const prompts = [
        { label: '模特图提示词', content: '根据产品特性，生成一个适合展示该产品且时尚富有高级感的模特图，彩色人像，背景是白底，人物居中', configLabel: '生成模特图' },
        { label: '侧面展示图提示词', content: '根据产品图和产品信息，生成左侧侧面45度的展示图，高清展示侧面的产品形状和细节', configLabel: '侧面展示图' },
        { label: '俯瞰展示图提示词', content: '根据产品图和产品信息，生成从上往下俯瞰的产品展示图，高清展示俯瞰角度的产品形状和细节', configLabel: '俯瞰展示图' },
        { label: '拆解图提示词', content: '根据产品材质功能，生成一张产品核心部件的结构示意图，展现产品核心部件的内部构造', configLabel: '拆解图' }
      ]

      prompts.forEach((p, i) => {
        const tId = getId()
        nodes.push({ id: tId, type: 'text', position: { x: startPosition.x + col, y: startPosition.y + i * row }, data: { content: p.content, label: p.label } })

        const cId = getId()
        nodes.push({ id: cId, type: 'imageConfig', position: { x: startPosition.x + col * 2, y: startPosition.y + i * row }, data: { label: p.configLabel, model: 'doubao-seedream-4-5-251128', size: '2048x2048' } })

        // 产品信息 → 提示词
        edges.push({ id: `e_${infoId}_${tId}`, source: infoId, target: tId, sourceHandle: 'right', targetHandle: 'left' })
        // 提示词 → 配置
        edges.push({ id: `e_${tId}_${cId}`, source: tId, target: cId, type: 'promptOrder', data: { promptOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
        // 产品图 → 配置
        edges.push({ id: `e_${imgId}_${cId}`, source: imgId, target: cId, type: 'imageOrder', data: { imageOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
      })

      return { nodes, edges }
    }
  },

  // ========== 3. 文生图基础工作流 ==========
  {
    id: 'text-to-image-basic',
    name: '文生图基础',
    description: '最简单的文本到图片生成工作流',
    category: 'basic',
    createNodes: (startPosition) => {
      _counter = 0
      const nodes = [], edges = []

      const tId = getId()
      nodes.push({ id: tId, type: 'text', position: { x: startPosition.x, y: startPosition.y }, data: { content: '', label: '提示词' } })

      const cId = getId()
      nodes.push({ id: cId, type: 'imageConfig', position: { x: startPosition.x + 400, y: startPosition.y }, data: { label: '文生图' } })

      edges.push({ id: `e_${tId}_${cId}`, source: tId, target: cId, type: 'promptOrder', data: { promptOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })

      return { nodes, edges }
    }
  },

  // ========== 4. 图生视频工作流 ==========
  {
    id: 'image-to-video',
    name: '图生视频',
    description: '从文本生成图片，再从图片生成视频',
    category: 'video',
    createNodes: (startPosition) => {
      _counter = 0
      const nodes = [], edges = []

      const tId = getId()
      nodes.push({ id: tId, type: 'text', position: { x: startPosition.x, y: startPosition.y }, data: { content: '', label: '提示词' } })

      const icId = getId()
      nodes.push({ id: icId, type: 'imageConfig', position: { x: startPosition.x + 400, y: startPosition.y }, data: { label: '文生图' } })

      const imgId = getId()
      nodes.push({ id: imgId, type: 'image', position: { x: startPosition.x + 800, y: startPosition.y }, data: { url: '', label: '生成图片' } })

      const vcId = getId()
      nodes.push({ id: vcId, type: 'videoConfig', position: { x: startPosition.x + 1200, y: startPosition.y }, data: { label: '图生视频' } })

      edges.push({ id: `e_${tId}_${icId}`, source: tId, target: icId, type: 'promptOrder', data: { promptOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${icId}_${imgId}`, source: icId, target: imgId, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${imgId}_${vcId}`, source: imgId, target: vcId, type: 'imageRole', data: { imageRole: 'first_frame_image' }, sourceHandle: 'right', targetHandle: 'left' })

      return { nodes, edges }
    }
  }
]
