# CanvasMind

> AI-powered infinite canvas for image generation and creative collaboration

**CanvasMind** 是一个基于 Vue 3 的 AI 图像生成工具，提供无限画布交互界面，支持图片生成、视频生成、数字人等多种 AI 创作模式。

## 🎯 项目定位

- 🎨 **无限画布**: 突破固定尺寸限制，自由扩展的网格布局
- 🔄 **拖拽重排**: 图片可在画布中拖拽重新排序，实时避让效果
- 💬 **对话式AI**: 完整的对话面板，支持多轮对话和历史记录
- 📦 **批量管理**: 同时管理多组生成结果，提高创作效率
- 🎬 **多模态创作**: 支持图片生成、视频生成、数字人、动作模仿等多种模式
- 🔗 **工作流编排**: 基于 Vue Flow 的可视化节点连线工作流
- 📤 **多平台发布**: 支持抖音、快手、视频号、小红书多平台定时发布

## ✨ 核心特性

### 已实现功能 ✅

- 🎨 **无限画布** - 可缩放、拖拽的图片网格布局，流畅的交互体验
- 🤖 **AI 对话** - 右侧对话面板，支持文本和图片输入，智能生成图片
- 🎯 **拖拽重排** - 支持图片在画布中拖拽重新排序，实时避让效果
- 🎭 **引导页面** - 首次进入时显示精美的引导界面，提供清晰的操作指引
- 🌓 **完整主题系统** - 深色/浅色主题无缝切换
- 💎 **现代设计语言** - 完整的样式系统
- 🪟 **毛玻璃美学** - Glassmorphism 视觉效果
- ⚡ **极速开发** - 基于 Vite 构建，热更新快如闪电
- 🎬 **多模态内容生成** - Agent模式、图片生成、视频生成、数字人、动作模仿
- 🔗 **工作流编排** - 基于 Vue Flow 的可视化节点连线，支持文本/图像/视频/LLM 节点
- 📤 **发布中心** - 多平台多账号发布，支持定时发布和批量操作
- 👤 **账号管理** - 多平台账号管理，Cookie 上传/下载/验证

### 规划功能 🔲

| 功能 | 优先级 | 状态 |
|-----|-------|------|
| **文生图** (Text-to-Image) | P0 | UI完成，待接入API |
| **图生图** (Image-to-Image) | P1 | 规划中 |
| **局部重绘** | P1 | UI完成，待实现 |
| **智能扩图** | P1 | UI完成，待实现 |
| **智能抠图** | P1 | UI完成，待实现 |
| **超清放大** | P2 | UI完成，待实现 |
| **多图层管理** | P2 | 规划中 |
| **社区探索** | P2 | 规划中 |
| **文生视频** | P1 | UI完成，待接入API |
| **数字人** | P2 | UI完成，待实现 |

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0（推荐 22.x）

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5010 查看应用

### 生产构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 📦 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **框架** | Vue 3 (Composition API) | ^3.5.24 |
| **构建工具** | Vite | ^7.2.4 |
| **语言** | TypeScript + JavaScript | ^5.9.3 |
| **状态管理** | Vue 3 Composition API 单例模式 | - |
| **路由** | Vue Router | ^4.2.5 |
| **UI 组件库** | Element Plus | ^2.13.1 |
| **流程图** | Vue Flow | ^1.48.2 |
| **样式** | Tailwind CSS + CSS Variables | ^4.1.18 |

## 📁 项目结构

```
canana-vue/
├── src/
│   ├── api/                           # API 接口层
│   │   ├── account.ts                 # 账户相关接口
│   │   ├── material.ts                # 素材相关接口
│   │   └── publish.ts                 # 发布相关接口
│   │
│   ├── components/                    # 公共组件
│   │   ├── canana/                    # 画布相关组件
│   │   │   ├── InfiniteCanvas.vue     # 无限画布（核心）
│   │   │   ├── LeftToolbar.vue        # 左侧工具栏
│   │   │   ├── BottomToolbar.vue      # 底部缩放控制
│   │   │   ├── PromptEditor.vue       # 提示词编辑器
│   │   │   ├── RightPanel.vue         # 右侧对话面板
│   │   │   └── SettingsModal.vue      # 设置弹窗
│   │   ├── generate/                  # 内容生成组件
│   │   │   ├── ContentGenerator.vue   # 内容生成器主组件
│   │   │   ├── common/                # 通用组件
│   │   │   ├── selectors/             # 选择器组件
│   │   │   └── toolbars/              # 工具栏组件
│   │   ├── home/                      # 首页组件
│   │   ├── prompt-editor/             # 提示词编辑器子组件
│   │   ├── art-design/                # 艺术设计组件
│   │   ├── layout/                    # 布局组件
│   │   ├── ThemeToggle.vue            # 主题切换
│   │   ├── NetworkStatus.vue          # 网络状态
│   │   ├── ImagePreview.vue           # 图片预览
│   │   └── FailedTasksDrawer.vue      # 失败任务抽屉
│   │
│   ├── views/                         # 页面视图
│   │   ├── home/                      # 首页
│   │   ├── generate/                  # 生成页面
│   │   ├── canana/                    # 画布页面
│   │   ├── workflow/                  # 工作流页面
│   │   │   ├── index.vue              # 工作流主页面
│   │   │   ├── components/            # 工作流组件
│   │   │   │   ├── nodes/             # 自定义节点
│   │   │   │   └── edges/             # 自定义边
│   │   │   ├── composables/           # 工作流组合式函数
│   │   │   ├── config/                # 工作流配置
│   │   │   └── api/                   # 工作流 API
│   │   ├── account/                   # 账户管理页面
│   │   ├── asset/                     # 素材管理页面
│   │   └── publish/                   # 发布页面
│   │       ├── PublishCenter.vue       # 发布中心主页面
│   │       ├── publish.css             # 发布页面公共样式
│   │       └── components/             # 发布子组件
│   │
│   ├── composables/                   # 可复用组合式函数
│   │   ├── useCanvasState.js          # 画布状态管理
│   │   ├── useDragSort.js             # 拖拽排序
│   │   ├── useGridLayout.js           # 网格布局
│   │   ├── useHistory.js              # 历史记录（撤销/重做）
│   │   ├── useImageResize.js          # 图片缩放
│   │   ├── usePointerEvents.js        # 指针事件
│   │   └── useViewport.js             # 视口控制
│   │
│   ├── stores/                        # 状态管理（Composition API 单例）
│   │   ├── account.ts                 # 账户状态
│   │   └── app.js                     # 应用状态
│   │
│   ├── utils/                         # 工具函数
│   │   ├── errorHandler.ts            # 错误处理
│   │   └── request.ts                 # 请求封装（含重试机制）
│   │
│   ├── types/                         # TypeScript 类型定义
│   ├── router/                        # 路由配置
│   ├── styles/                        # 全局样式
│   │   └── styles.css                 # 主样式文件（CSS 变量 + Tailwind）
│   ├── assets/                        # 静态资源
│   ├── App.vue                        # 根组件
│   └── main.ts                        # 应用入口
│
├── public/                            # 公共静态资源
├── docs/                              # 项目文档
├── index.html                         # HTML 模板
├── vite.config.ts                     # Vite 配置
├── package.json                       # 项目配置
└── README.md                          # 项目说明
```

## 🎯 核心模块

### 内容生成系统 (Generate)

- **ContentGenerator** - 统一的内容生成入口，支持 Agent模式、图片生成、视频生成、数字人、动作模仿
- **工具栏组件** - AgentToolbar、ImageToolbar、VideoToolbar、DigitalHumanToolbar
- **通用组件** - SelectPopup（选择弹窗）、PreferencePanel（偏好设置）、TypeSelector（类型选择）

### 画布系统 (Canvas)

- **InfiniteCanvas** - 4列网格布局，支持缩放、拖拽、平移，图片拖拽重排序
- **RightPanel** - 对话面板，支持文本和图片输入，4种消息类型
- **PromptEditor** - 底部浮动胶囊，Agent模式、灵感搜索、创意设计

### 工作流系统 (Workflow)

- 基于 Vue Flow 的可视化节点连线
- 自定义节点类型：文本、图像、视频、LLM 配置
- 自定义边类型：角色、顺序
- 工作流模板系统，撤销/重做，小地图和背景网格

### 发布中心 (Publish)

- 多 Tab 管理，支持批量发布
- 多平台支持：抖音、快手、视频号、小红书
- 定时发布配置（每日发布数、时间点、起始天数）
- 素材库选择和本地上传
- 失败任务跟踪和重试

### 组合式函数 (Composables)

- **useCanvasState** - 画布状态管理（图片、缩放、平移）
- **useDragSort** - 拖拽排序逻辑
- **useGridLayout** - 网格布局计算
- **useHistory** - 撤销/重做历史记录
- **useImageResize** - 图片缩放和调整
- **usePointerEvents** - 指针事件处理（鼠标、触摸）
- **useViewport** - 视口控制和变换

## 🎨 设计语言

基于现代 UI 设计理念的完整设计系统：

- **主题**: 深色/浅色自动切换
- **品牌色**: #00CAE0 (青色)
- **视觉效果**: Glassmorphism（毛玻璃美学）
- **动画**: 流畅的过渡和缩放效果，GPU 加速
- **响应式**: 移动端、平板、桌面全覆盖
- **CSS 变量**: 200+ 设计变量，支持主题切换
- **全局组件类**: `lv-btn`、`lv-input`、`lv-textarea` 等统一样式

### 主题切换

```javascript
// 切换到浅色主题
document.documentElement.setAttribute('data-theme', 'light')

// 切换到深色主题（默认）
document.documentElement.setAttribute('data-theme', 'dark')
```

## 📝 待开发功能

### 第一阶段：基础AI能力（P0）
- [ ] 文生图 API 接入
- [ ] 基础图像生成
- [ ] 模型选择器
- [ ] 风格预设

### 第二阶段：编辑工具（P1）
- [ ] 局部重绘实现（画笔选区、蒙版编辑）
- [ ] 智能扩图实现（边界识别、智能填充）
- [ ] 智能抠图实现（主体识别、边缘优化）
- [ ] 图生图实现（风格迁移、主体保持）
- [ ] 文生视频 API 接入

### 第三阶段：高级功能（P2）
- [ ] 超清放大
- [ ] 消除笔工具
- [ ] 多图层管理
- [ ] 社区探索功能
- [ ] 数字人功能完善

## 💬 交流群
微信: 加群洽谈，过期请备注 进群

欢迎加入微信群交流 AI 产品体验：
<p align="center">
  <img src="./微信图片.jpg" width="300" alt="AI 产品体验交流群" />
  <img src="./wechat.jpg" width="300" alt="AI 产品体验交流群" />
</p>

## 📄 License

MIT

## 🔗 相关链接

- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [Vue Flow 文档](https://vueflow.dev/)
- [Element Plus 文档](https://element-plus.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [即梦AI](https://jimeng.jianying.com/) - 字节跳动AI创作平台
- [Dreamina](https://www.capcut.com/ai-tool/platform) - 剪映AI创作工具
---

**CanvasMind** - 让 AI 创作更简单 🎨✨
