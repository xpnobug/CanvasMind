# CanvasMind 

> AI-powered infinite canvas for image generation and creative collaboration

**CanvasMind** 是一个基于 Vue 3 的 AI 图像生成工具，借鉴**即梦AI**的智能画布和多模态创作理念，提供无限画布交互界面，支持图片生成、编辑和对话式协作。

## 🎯 项目定位

参考 [即梦AI](https://jimeng.jianying.com/) (字节跳动AI创作平台)

**差异化优势**:
- 🎨 **无限画布**: 突破固定尺寸限制，自由扩展的网格布局
- 🔄 **拖拽重排**: 图片可在画布中拖拽重新排序，实时避让效果
- 💬 **对话式AI**: 完整的对话面板，支持多轮对话和历史记录
- 📦 **批量管理**: 同时管理多组生成结果，提高创作效率
- 🤝 **协作友好**: 规划中的多人实时协作功能

## ✨ 核心特性

### 已实现功能 ✅

- 🎨 **无限画布** - 可缩放、拖拽的图片网格布局，流畅的交互体验
- 🤖 **AI 对话** - 右侧对话面板，支持文本和图片输入，智能生成图片
- 🎯 **拖拽重排** - 支持图片在画布中拖拽重新排序，实时避让效果
- 🎭 **引导页面** - 首次进入时显示精美的引导界面，提供清晰的操作指引
- 🌓 **完整主题系统** - 深色/浅色主题无缝切换
- 💎 **Dreamina 设计语言** - 完整的即梦 AI 样式系统
- 🪟 **毛玻璃美学** - Glassmorphism 视觉效果
- ⚡ **极速开发** - 基于 Vite 构建，热更新快如闪电

### 规划功能（对标即梦AI）🔲

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
| **文生视频** | P3 | 未来功能 |

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 生产构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 📦 技术栈

- **框架**: Vue 3.5.24
- **构建工具**: Vite 7.2.4
- **语法**: Composition API + `<script setup>`
- **模块**: ESM (ES Module)
- **样式系统**: Dreamina CSS Variables (基于即梦 AI)

## 🎨 Dreamina 样式系统

本项目完整实现了基于即梦 AI (Dreamina) 的设计系统，包括：

### 核心特性
- ✅ **完整的 CSS 变量系统** - 200+ 设计变量，支持主题切换
- ✅ **工具类库** - 即用即有的样式类
- ✅ **组件样式** - 按钮、卡片、输入框、面板等
- ✅ **毛玻璃效果** - Glassmorphism 美学
- ✅ **响应式设计** - 移动端、平板、桌面全覆盖
- ✅ **性能优化** - GPU 加速和智能动画

### 快速使用

```html
<!-- 毛玻璃面板 -->
<div class="dreamina-glass">浮动面板</div>

<!-- 主按钮 -->
<button class="dreamina-btn-primary">确认</button>

<!-- 使用 CSS 变量 -->
<style>
.my-component {
  color: var(--text-primary);
  background: var(--bg-block-primary-default);
}
</style>
```

### 主题切换

```javascript
// 切换到浅色主题
document.documentElement.setAttribute('data-theme', 'light')

// 切换到深色主题（默认）
document.documentElement.setAttribute('data-theme', 'dark')
```

**详细文档**:
- [Dreamina 样式系统使用指南](./docs/DREAMINA_STYLES.md)
- [快速开始指南](./docs/QUICK_START.md)
- [重构完成报告](./docs/REFACTORING_COMPLETE.md)
- [画布重构进度](./docs/CANVAS_REFACTORING_PROGRESS.md)
- [项目分析](./docs/PROJECT_ANALYSIS.md)
- [Vite 配置说明](./docs/VITE_CONFIG.md)

## 📁 项目结构

```
canana-vue/
├── src/
│   ├── components/                     # Vue 组件
│   │   ├── canana/                     # 画布相关组件
│   │   │   ├── Header.vue              # 顶部标题栏
│   │   │   ├── InfiniteCanvas.vue      # 无限画布（核心）
│   │   │   ├── LeftToolbar.vue         # 左侧工具栏
│   │   │   ├── BottomToolbar.vue       # 底部缩放控制
│   │   │   ├── PromptEditor.vue        # 提示词编辑器
│   │   │   ├── RightPanel.vue          # 右侧对话面板
│   │   │   └── SettingsModal.vue       # 设置弹窗
│   │   ├── prompt-editor/              # 提示词编辑器子组件
│   │   │   ├── RatioSelector.vue       # 比例选择器
│   │   │   ├── ImageModelSelector.vue  # 模型选择器
│   │   │   └── ModeSelector.vue        # 模式选择器
│   │   └── home/                       # 首页组件
│   │       └── components/             # 首页子组件
│   │           ├── HomeHeader.vue      # 首页头部
│   │           ├── HomeBanner.vue      # 首页横幅
│   │           ├── PromptInput.vue     # 提示词输入
│   │           ├── ReferenceUpload.vue # 参考图上传
│   │           ├── ContentGenerator.vue # 内容生成器
│   │           ├── DiscoverContent.vue # 发现内容
│   │           ├── Toolbar.vue         # 工具栏
│   │           ├── SideMenu.vue        # 侧边菜单
│   │           ├── CenterMenu.vue      # 中心菜单
│   │           ├── BottomMenu.vue      # 底部菜单
│   │           ├── TabsSection.vue     # 标签页区域
│   │           ├── TypeSelector.vue    # 类型选择器
│   │           ├── SubmitButton.vue    # 提交按钮
│   │           ├── TaskIndicator.vue   # 任务指示器
│   │           ├── ToolbarButton.vue   # 工具栏按钮
│   │           ├── MenuIconButton.vue  # 菜单图标按钮
│   │           ├── MenuItem.vue        # 菜单项
│   │           └── index.js            # 组件导出
│   ├── views/                          # 页面视图
│   │   ├── canana/                     # 画布页面
│   │   │   ├── canana.vue              # 画布主页面
│   │   │   └── styles/                 # 画布样式
│   │   │       ├── index.css           # 样式入口
│   │   │       ├── canvas.css          # 画布样式
│   │   │       ├── prompt-editor.css   # 编辑器样式
│   │   │       └── empty-state.css     # 空状态样式
│   │   └── home/                       # 首页
│   │       └── home.vue                # 首页主页面
│   ├── composables/                    # Vue 组合式函数
│   │   ├── index.js                    # 组合式函数导出
│   │   ├── useCanvasState.js           # 画布状态管理
│   │   ├── useDragSort.js              # 拖拽排序
│   │   ├── useGridLayout.js            # 网格布局
│   │   ├── useHistory.js               # 历史记录
│   │   ├── useImageResize.js           # 图片缩放
│   │   ├── usePointerEvents.js         # 指针事件
│   │   └── useViewport.js              # 视口控制
│   ├── router/                         # 路由配置
│   │   └── index.js                    # 路由定义
│   ├── styles/                         # 全局样式
│   │   └── styles.css                  # 主样式文件
│   ├── assets/                         # 静态资源
│   │   └── vue.svg                     # Vue logo
│   ├── App.vue                         # 主应用组件
│   └── main.js                         # 应用入口
├── public/                             # 公共静态资源
│   └── vite.svg                        # Vite logo
├── index.html                          # HTML 模板
├── vite.config.js                      # Vite 配置
├── package.json                        # 项目配置
└── README.md                           # 项目说明
```

## 🎯 核心组件

### 画布系统 (Canana)

#### InfiniteCanvas (无限画布)
- 4列网格布局，支持缩放、拖拽、平移
- 图片拖拽重排序，带实时避让效果
- 四角拖拽调整图片尺寸
- 空格 + 拖拽移动画布，Ctrl + 滚轮缩放

#### RightPanel (对话面板)
- 支持文本和图片输入
- 堆叠卡片效果的图片上传
- 4种消息类型：用户文本、AI图片、带参考图、生成图片组
- 图片预览和下载功能

#### PromptEditor (提示词编辑器)
- 底部浮动胶囊，支持展开/折叠
- Agent模式、灵感搜索、创意设计等选项
- Enter 发送，外部点击自动收起
- 子组件：
  - RatioSelector - 图片比例选择
  - ImageModelSelector - AI 模型选择
  - ModeSelector - 生成模式选择

#### 工具栏组件
- Header - 顶部标题栏和主题切换
- LeftToolbar - 左侧工具栏（选择、画笔、文本等）
- BottomToolbar - 底部缩放控制和视图操作
- SettingsModal - 设置弹窗

### 首页系统 (Home)

#### 核心组件
- HomeHeader - 首页头部导航
- HomeBanner - 精美的引导横幅
- PromptInput - 提示词输入框
- ReferenceUpload - 参考图片上传
- ContentGenerator - 内容生成器
- DiscoverContent - 发现和探索内容

#### 交互组件
- Toolbar - 工具栏容器
- SideMenu - 侧边菜单
- CenterMenu - 中心菜单
- BottomMenu - 底部菜单
- TabsSection - 标签页区域
- TypeSelector - 类型选择器
- SubmitButton - 提交按钮
- TaskIndicator - 任务进度指示器

### 组合式函数 (Composables)

项目采用 Vue 3 Composition API，将复杂逻辑拆分为可复用的组合式函数：

- **useCanvasState** - 画布状态管理（图片、缩放、平移）
- **useDragSort** - 拖拽排序逻辑
- **useGridLayout** - 网格布局计算
- **useHistory** - 撤销/重做历史记录
- **useImageResize** - 图片缩放和调整
- **usePointerEvents** - 指针事件处理（鼠标、触摸）
- **useViewport** - 视口控制和变换

## 🎨 设计语言

基于即梦 AI (Dreamina) 的完整设计系统：

- **主题**: 深色/浅色自动切换
- **品牌色**: #00CAE0 (青色)
- **视觉效果**: Glassmorphism（毛玻璃美学）
- **动画**: 流畅的过渡和缩放效果，GPU 加速
- **响应式**: 移动端、平板、桌面全覆盖
- **模块化样式**: 组件级样式隔离，易于维护

**样式组织**:
- `src/styles/styles.css` - 全局样式和 Dreamina 设计系统
- `src/views/canana/styles/` - 画布页面专属样式
  - `index.css` - 样式入口
  - `canvas.css` - 画布核心样式
  - `prompt-editor.css` - 编辑器样式
  - `empty-state.css` - 空状态样式

**查看文档**: 详细的样式系统使用指南请参考 [DREAMINA_STYLES.md](./docs/DREAMINA_STYLES.md)


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

### 第三阶段：高级功能（P2）
- [ ] 超清放大
- [ ] 消除笔工具
- [ ] 多图层管理
- [ ] 社区探索功能

### 通用功能
- [ ] 项目保存/加载
- [ ] 多选图片和批量操作
- [ ] 撤销/重做功能
- [ ] 历史记录管理

## 📄 License

MIT

## 🙏 致谢

设计灵感来自:
- [即梦AI](https://jimeng.jianying.com/) - 字节跳动AI创作平台
- [Dreamina](https://www.capcut.com/ai-tool/platform) - 剪映AI创作工具

## 🔗 相关链接

- [即梦AI官网](https://jimeng.jianying.com/)
- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)

---

**CanvasMind** - 让 AI 创作更简单 🎨✨

*参考即梦AI，打造更自由的无限画布体验*
