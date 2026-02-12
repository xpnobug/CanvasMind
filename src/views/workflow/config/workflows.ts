/**
 * 工作流模板配置
 * 预设工作流模板，支持一键添加到画布
 */

// 多角度提示词模板
export const MULTI_ANGLE_PROMPTS = {
  front: {
    label: '正视',
    english: 'Front View',
    prompt: (character: string) => `使用提供的图片，生成四宫格分镜，每张四宫格包括人物正面对着镜头的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性。\n\n角色参考: ${character}`
  },
  side: {
    label: '侧视',
    english: 'Side View',
    prompt: (character: string) => `使用提供的图片，生成四宫格分镜，每张四宫格包括人物侧面角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性。\n\n角色参考: ${character}`
  },
  back: {
    label: '后视',
    english: 'Back View',
    prompt: (character: string) => `使用提供的图片，生成四宫格分镜，每张四宫格包括人物背影角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性。\n\n角色参考: ${character}`
  },
  top: {
    label: '俯视',
    english: "Top/Bird's Eye View",
    prompt: (character: string) => `使用提供的图片，生成四宫格分镜，每张四宫格包括俯视角度的4个景别（远景、中景、近景、和局部特写），保持场景、产品、人物特征的一致性。\n\n角色参考: ${character}`
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
    createNodes: (startPosition: any) => {
      _counter = 0
      const sp = 400, rsp = 420
      const angles = ['front', 'side', 'back', 'top']
      const nodes: any[] = [], edges: any[] = []

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
    createNodes: (startPosition: any) => {
      _counter = 0
      const col = 500, row = 480
      const nodes: any[] = [], edges: any[] = []

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
    createNodes: (startPosition: any) => {
      _counter = 0
      const nodes: any[] = [], edges: any[] = []

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
    createNodes: (startPosition: any) => {
      _counter = 0
      const nodes: any[] = [], edges: any[] = []

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
  },

  // ========== 5. 短剧角色设计 ==========
  {
    id: 'drama-character-design',
    name: '短剧角色设计',
    description: '根据角色描述生成一致性角色形象，多角度图依赖正面图保持一致性',
    category: 'drama',
    createNodes: (startPosition: any) => {
      _counter = 0
      const col = 400, row = 420
      const nodes: any[] = [], edges: any[] = []

      // 第一阶段：生成正面角色图
      const descId = getId()
      nodes.push({ id: descId, type: 'text', position: { x: startPosition.x, y: startPosition.y }, data: { content: '角色名称：林小雨\n性别：女\n年龄：22岁\n外貌特征：长发及腰，眼睛明亮有神，皮肤白皙，身材高挑\n服装风格：现代都市风，白色连衣裙\n性格特点：温柔善良，内心坚强', label: '角色描述' } })

      const styleRefId = getId()
      nodes.push({ id: styleRefId, type: 'image', position: { x: startPosition.x, y: startPosition.y + row }, data: { url: '', label: '风格参考图（可选）' } })

      const frontPromptId = getId()
      nodes.push({ id: frontPromptId, type: 'text', position: { x: startPosition.x + col, y: startPosition.y }, data: { content: '根据角色描述，生成角色的正面全身照，人物居中，白色简洁背景，高清写实风格，电影级画质', label: '正面全身提示词' } })

      const frontCfgId = getId()
      nodes.push({ id: frontCfgId, type: 'imageConfig', position: { x: startPosition.x + col * 2, y: startPosition.y }, data: { label: '生成正面全身图', model: 'doubao-seedream-4-5-251128', size: '1440x2560' } })

      const frontImgId = getId()
      nodes.push({ id: frontImgId, type: 'image', position: { x: startPosition.x + col * 3, y: startPosition.y }, data: { url: '', label: '正面角色图（参考基准）' } })

      // 第二阶段：基于正面图生成多角度
      const variants = [
        { label: '侧面半身提示词', content: '参考提供的角色正面图，保持人物外貌、服装完全一致，生成角色的侧面半身照，45度角侧脸，展示五官轮廓，白色简洁背景，高清写实风格', cfgLabel: '侧面半身图', size: '2048x2048' },
        { label: '表情特写提示词', content: '参考提供的角色正面图，保持人物五官、发型完全一致，生成角色的面部特写，展示多种表情（微笑、严肃、惊讶、悲伤），四宫格布局，高清写实风格', cfgLabel: '表情特写图', size: '2048x2048' },
        { label: '背面全身提示词', content: '参考提供的角色正面图，保持人物发型、服装、身材完全一致，生成角色的背面全身照，展示背影，白色简洁背景，高清写实风格', cfgLabel: '背面全身图', size: '1440x2560' }
      ]

      // 第一阶段连线
      edges.push({ id: `e_${descId}_${frontCfgId}`, source: descId, target: frontCfgId, type: 'promptOrder', data: { promptOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${styleRefId}_${frontCfgId}`, source: styleRefId, target: frontCfgId, type: 'imageOrder', data: { imageOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${frontPromptId}_${frontCfgId}`, source: frontPromptId, target: frontCfgId, type: 'promptOrder', data: { promptOrder: 2 }, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${frontCfgId}_${frontImgId}`, source: frontCfgId, target: frontImgId, sourceHandle: 'right', targetHandle: 'left' })

      // 第二阶段节点和连线
      const vx = startPosition.x + col * 3 + 100
      variants.forEach((v, i) => {
        const vy = startPosition.y + (i + 1) * row
        const tId = getId()
        nodes.push({ id: tId, type: 'text', position: { x: vx, y: vy }, data: { content: v.content, label: v.label } })
        const cId = getId()
        nodes.push({ id: cId, type: 'imageConfig', position: { x: vx + col, y: vy }, data: { label: v.cfgLabel, model: 'doubao-seedream-4-5-251128', size: v.size } })
        edges.push({ id: `e_${frontImgId}_${cId}`, source: frontImgId, target: cId, type: 'imageOrder', data: { imageOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
        edges.push({ id: `e_${tId}_${cId}`, source: tId, target: cId, type: 'promptOrder', data: { promptOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
      })

      return { nodes, edges }
    }
  },

  // ========== 6. 多时段场景背景 ==========
  {
    id: 'drama-scene-background',
    name: '多时段场景背景',
    description: '先生成基础场景，再基于基础场景生成多时段变体，保持场景一致性',
    category: 'drama',
    createNodes: (startPosition: any) => {
      _counter = 0
      const col = 400, row = 420
      const nodes: any[] = [], edges: any[] = []

      // 第一阶段：生成基础场景
      const sceneDescId = getId()
      nodes.push({ id: sceneDescId, type: 'text', position: { x: startPosition.x, y: startPosition.y }, data: { content: '场景名称：现代都市街道\n位置：繁华商业区主街道\n环境特征：高楼大厦林立，霓虹灯招牌，车水马龙\n氛围：都市繁华、现代感强\n特殊元素：咖啡店、书店、商场入口', label: '场景描述' } })

      const basePromptId = getId()
      nodes.push({ id: basePromptId, type: 'text', position: { x: startPosition.x + col, y: startPosition.y }, data: { content: '根据场景描述，生成白天正午时段的场景背景作为基准，阳光明媚，光线充足均匀，展示场景全貌和所有环境元素，纯背景无人物，电影级画质，宽屏构图', label: '基础场景提示词' } })

      const baseCfgId = getId()
      nodes.push({ id: baseCfgId, type: 'imageConfig', position: { x: startPosition.x + col * 2, y: startPosition.y }, data: { label: '生成基础场景', model: 'doubao-seedream-4-5-251128', size: '2560x1440' } })

      const baseImgId = getId()
      nodes.push({ id: baseImgId, type: 'image', position: { x: startPosition.x + col * 3, y: startPosition.y }, data: { url: '', label: '基础场景图（参考基准）' } })

      // 第一阶段连线
      edges.push({ id: `e_${sceneDescId}_${baseCfgId}`, source: sceneDescId, target: baseCfgId, type: 'promptOrder', data: { promptOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${basePromptId}_${baseCfgId}`, source: basePromptId, target: baseCfgId, type: 'promptOrder', data: { promptOrder: 2 }, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${baseCfgId}_${baseImgId}`, source: baseCfgId, target: baseImgId, sourceHandle: 'right', targetHandle: 'left' })

      // 第二阶段：多时段变体
      const variants = [
        { label: '傍晚场景提示词', content: '参考提供的基础场景图，保持场景构图、建筑、环境元素完全一致，仅改变光照为傍晚时段：夕阳西下，天空呈橙红色渐变，光线柔和温暖，建筑投射长影', cfgLabel: '傍晚场景' },
        { label: '夜晚场景提示词', content: '参考提供的基础场景图，保持场景构图、建筑、环境元素完全一致，仅改变光照为夜晚时段：霓虹灯亮起，城市灯光璀璨，天空深蓝或黑色，窗户透出暖光', cfgLabel: '夜晚场景' },
        { label: '雨天场景提示词', content: '参考提供的基础场景图，保持场景构图、建筑、环境元素完全一致，仅改变天气为雨天：细雨绵绵，地面湿润有倒影，天空阴沉灰暗，氛围忧郁', cfgLabel: '雨天场景' }
      ]

      const vx = startPosition.x + col * 3 + 100
      variants.forEach((v, i) => {
        const vy = startPosition.y + (i + 1) * row
        const tId = getId()
        nodes.push({ id: tId, type: 'text', position: { x: vx, y: vy }, data: { content: v.content, label: v.label } })
        const cId = getId()
        nodes.push({ id: cId, type: 'imageConfig', position: { x: vx + col, y: vy }, data: { label: v.cfgLabel, model: 'doubao-seedream-4-5-251128', size: '2560x1440' } })
        edges.push({ id: `e_${baseImgId}_${cId}`, source: baseImgId, target: cId, type: 'imageOrder', data: { imageOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
        edges.push({ id: `e_${tId}_${cId}`, source: tId, target: cId, type: 'promptOrder', data: { promptOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
      })

      return { nodes, edges }
    }
  },

  // ========== 7. 绘本生成器 ==========
  {
    id: 'picture-book-generator',
    name: '绘本生成器',
    description: '根据故事大纲生成绘本，包含角色设计、剧情拆分和图文生成',
    category: 'creative',
    createNodes: (startPosition: any) => {
      _counter = 0
      const col = 420, row = 420, pageRow = 350
      const nodes: any[] = [], edges: any[] = []

      // 第一阶段：故事输入与角色设计
      const storyId = getId()
      nodes.push({ id: storyId, type: 'text', position: { x: startPosition.x, y: startPosition.y }, data: { content: '【绘本名称】小兔子的冒险之旅\n\n【故事主题】勇气与友谊\n\n【主要角色】\n1. 小白兔米米 - 主角，白色毛发，粉红色耳朵内侧，穿蓝色背带裤\n2. 小狐狸橙橙 - 伙伴，橙色毛发，白色尾巴尖，戴绿色围巾\n\n【故事梗概】\n小白兔米米发现了一张神秘的藏宝图，在好朋友小狐狸橙橙的陪伴下踏上寻宝之旅。\n\n【画风要求】温馨治愈的水彩绘本风格，色彩明亮柔和，适合3-6岁儿童阅读', label: '故事大纲' } })

      // 角色设计 LLM
      const charLlmId = getId()
      nodes.push({ id: charLlmId, type: 'llmConfig', position: { x: startPosition.x + col * 2, y: startPosition.y - row }, data: { label: '角色设计生成', systemPrompt: '你是专业的绘本角色设计师。根据故事大纲提取所有角色，为每个角色生成适合图像生成的详细提示词。包含：外貌特征、服装、表情、姿态、背景色。使用绘本水彩风格描述。', model: 'gemini-3-flash-preview', outputFormat: 'text' } })

      // 角色1
      const char1PromptId = getId()
      nodes.push({ id: char1PromptId, type: 'text', position: { x: startPosition.x + col * 2.5, y: startPosition.y - row * 1.5 }, data: { content: '可爱的小白兔，白色毛发蓬松柔软，粉红色耳朵内侧，穿着蓝色背带裤，大眼睛明亮有神，全身正面站立，白色简洁背景，儿童绘本水彩风格', label: '角色1:小白兔米米' } })
      const char1CfgId = getId()
      nodes.push({ id: char1CfgId, type: 'imageConfig', position: { x: startPosition.x + col * 3, y: startPosition.y - row * 1.5 }, data: { label: '主角色1设计图', model: 'doubao-seedream-4-5-251128', size: '2048x2048' } })
      const char1ImgId = getId()
      nodes.push({ id: char1ImgId, type: 'image', position: { x: startPosition.x + col * 4, y: startPosition.y - row * 1.5 }, data: { url: '', label: '角色1参考图' } })

      // 角色2
      const char2PromptId = getId()
      nodes.push({ id: char2PromptId, type: 'text', position: { x: startPosition.x + col * 2.5, y: startPosition.y - row * 0.5 }, data: { content: '可爱的小狐狸，橙色毛发光泽亮丽，白色尾巴尖，戴着绿色围巾，机灵的眼睛，调皮的微笑，全身正面站立，白色简洁背景，儿童绘本水彩风格', label: '角色2:小狐狸橙橙' } })
      const char2CfgId = getId()
      nodes.push({ id: char2CfgId, type: 'imageConfig', position: { x: startPosition.x + col * 3, y: startPosition.y - row * 0.5 }, data: { label: '主角色2设计图', model: 'doubao-seedream-4-5-251128', size: '2048x2048' } })
      const char2ImgId = getId()
      nodes.push({ id: char2ImgId, type: 'image', position: { x: startPosition.x + col * 4, y: startPosition.y - row * 0.5 }, data: { url: '', label: '角色2参考图' } })

      // 第二阶段：剧情拆分
      const storyLlmId = getId()
      nodes.push({ id: storyLlmId, type: 'llmConfig', position: { x: startPosition.x + col, y: startPosition.y + row }, data: { label: '剧情拆分(16页)', systemPrompt: '你是专业的绘本编剧。将故事拆分成16页绘本内容。\n\n输出格式：\n第1页：[场景描述] | [画面内容] | [配文]\n...\n第16页：[场景描述] | [画面内容] | [配文]\n\n要求：每页有明确场景和配文，故事节奏合理，配文简洁适合幼儿。', model: 'gpt-4o', outputFormat: 'text' } })

      // 第三阶段：示例前4页
      const pages = [
        { scene: '森林边的小木屋', content: '清晨阳光洒在森林边的小木屋上，小白兔米米在窗边伸懒腰' },
        { scene: '发现藏宝图', content: '米米在阁楼的旧箱子里发现一张泛黄的藏宝图，眼睛闪闪发光' },
        { scene: '找好朋友', content: '米米跑到橙橙家门口敲门，小狐狸橙橙探出头来，好奇地看着藏宝图' },
        { scene: '出发冒险', content: '米米和橙橙背着小背包，站在森林入口，阳光照在她们身上' }
      ]

      const pageBaseY = startPosition.y + row * 2.5
      pages.forEach((p, i) => {
        const py = pageBaseY + i * pageRow
        const pTxtId = getId()
        nodes.push({ id: pTxtId, type: 'text', position: { x: startPosition.x + col * 3, y: py }, data: { content: `【第${i + 1}页】场景：${p.scene}\n画面描述：${p.content}\n\n图像提示词：${p.content}，儿童绘本水彩风格，温馨治愈，色彩明亮柔和，高清画质`, label: `第${i + 1}页内容` } })
        const pCfgId = getId()
        nodes.push({ id: pCfgId, type: 'imageConfig', position: { x: startPosition.x + col * 4, y: py }, data: { label: `第${i + 1}页插图`, model: 'doubao-seedream-4-5-251128', size: '2048x2048' } })
        edges.push({ id: `e_${pTxtId}_${pCfgId}`, source: pTxtId, target: pCfgId, type: 'promptOrder', data: { promptOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
        edges.push({ id: `e_${char1ImgId}_${pCfgId}`, source: char1ImgId, target: pCfgId, type: 'imageOrder', data: { imageOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
        if (i >= 2) {
          edges.push({ id: `e_${char2ImgId}_${pCfgId}`, source: char2ImgId, target: pCfgId, type: 'imageOrder', data: { imageOrder: 2 }, sourceHandle: 'right', targetHandle: 'left' })
        }
      })

      // 连线
      edges.push({ id: `e_${storyId}_${charLlmId}`, source: storyId, target: charLlmId, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${char1PromptId}_${char1CfgId}`, source: char1PromptId, target: char1CfgId, type: 'promptOrder', data: { promptOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${char1CfgId}_${char1ImgId}`, source: char1CfgId, target: char1ImgId, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${char2PromptId}_${char2CfgId}`, source: char2PromptId, target: char2CfgId, type: 'promptOrder', data: { promptOrder: 1 }, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${char2CfgId}_${char2ImgId}`, source: char2CfgId, target: char2ImgId, sourceHandle: 'right', targetHandle: 'left' })
      edges.push({ id: `e_${storyId}_${storyLlmId}`, source: storyId, target: storyLlmId, sourceHandle: 'right', targetHandle: 'left' })

      return { nodes, edges }
    }
  }
]
