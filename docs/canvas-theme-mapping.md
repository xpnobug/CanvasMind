# 画布主题映射表

把 infinite-canvas 的 `canvasThemes`（`web/src/lib/canvas-theme.ts`）全部色板，对照到 canana-vue 的 `lv-theme` CSS 变量。组件中**禁止硬编码颜色**，必须按下表查表替换。

> 来源：infinite-canvas 的 `canvasThemes[light|dark]` 是 ~25 个具名色板的命名空间集合，分 `canvas / node / toolbar` 三组。canana-vue 已有 `--canvas-* / --text-* / --stroke-* / --brand-* / --shadow-*` 体系，本表把两者对齐，必要时新增了 3 个 token。

## 新增 token（已写入 `src/styles/styles.css`）

| 新 token | 浅色值 | 深色值 | 用途 |
|---|---|---|---|
| `--canvas-selection-border` | `var(--brand-main-default)` 即 `#00a1c2` | `var(--brand-main-default)` 即 `#00cae0` | 节点 / 连线选中描边；连线 hover 加粗发光基色 |
| `--canvas-resize-handle-bg` | `var(--canvas-frame)` 即 `#fff` | `var(--canvas-frame)` 即 `#1c1e22` | 四角 resize 手柄填充，外加 2px solid `--canvas-selection-border` 描边 |
| `--canvas-drag-ghost-opacity` | `0.7` | `0.7` | 拖拽副本（节点复制粘贴/拖入文件预览）的透明度 |

## 三组色板对照

### canvas 组（画布壳）

| infinite-canvas | canana-vue 等价用法 | 备注 |
|---|---|---|
| `canvas.background` | `var(--canvas-bg)` | 主画布底色 |
| `canvas.dot` | `rgba(<text-primary 解出>, 0.28)` | 点阵背景；用 `--text-primary` 叠加 alpha |
| `canvas.line` | `rgba(<text-primary 解出>, 0.12)` | 网格线背景 |
| `canvas.selectionStroke` | `var(--canvas-selection-border)` | 框选框边线；新 token |
| `canvas.selectionFill` | `rgba(0,161,194,.08)` / `rgba(0,202,224,.08)` | 框选填充；直接展开 brand-main-default 叠 8% |

### node 组（节点）

| infinite-canvas | canana-vue 等价用法 | 备注 |
|---|---|---|
| `node.label` | `var(--text-secondary)` | 节点小标签文字 |
| `node.fill` | `var(--canvas-bg-block-default)` | 节点 body 背景（毛玻璃) |
| `node.panel` | `var(--canvas-float-block-default)` | 节点浮层/Popover 背景 |
| `node.stroke` | `var(--stroke-secondary)` | 节点常态描边 |
| `node.activeStroke` | `var(--canvas-selection-border)` | 节点选中/聚焦描边；新 token |
| `node.placeholder` | `var(--text-placeholder)` | 占位文字 |
| `node.text` | `var(--text-primary)` | 节点主文字 |
| `node.muted` | `var(--stroke-primary)` | 连线常态色 / 软描边 |
| `node.faint` | `var(--stroke-tertiary)` | 极弱描边/灰显 |

### toolbar 组（底部 Dock + 节点 hover 工具栏）

| infinite-canvas | canana-vue 等价用法 | 备注 |
|---|---|---|
| `toolbar.panel` | `var(--canvas-float-block-default)` | 工具栏胶囊背景 |
| `toolbar.border` | `var(--stroke-secondary)` | 胶囊边线 |
| `toolbar.item` | `var(--text-secondary)` | 按钮图标默认色 |
| `toolbar.itemHover` | `var(--canvas-float-block-hover)` | 按钮 hover 背景 |
| `toolbar.activeBg` | `var(--brand-main-block-default)` | 按钮激活背景（青色块 ~12% 透明度） |
| `toolbar.activeText` | `var(--brand-main-default)` | 按钮激活文字 |

## 其他特殊色

| infinite-canvas | canana-vue 等价用法 | 备注 |
|---|---|---|
| `selectionBlue=#2f80ff`（硬编码） | `var(--canvas-selection-border)` | infinite-canvas 里多处直接写 `#2f80ff`，统一替换 |
| 危险按钮 `#f87171` | `var(--component-secondary-button-...)` 中的 destructive 色，或直接 `#ef4444`（保留即可） | 删除/清空按钮 |
| 工具栏阴影（亮 `0 16px 40px rgba(28,25,23,.12)`，暗 `0 18px 45px rgba(0,0,0,.32)`） | `box-shadow: var(--shadow-generator-float-block)` | 项目已统一 |
| 毛玻璃模糊（无对应） | `backdrop-filter: blur(var(--canvas-float-backdrop-blur))`（32px） | 项目已统一 |

## 节点小色块（小地图用）

infinite-canvas 在 mini-map 里硬编码了：

| 类型 | 颜色 | canana-vue 等价 |
|---|---|---|
| Image | `#10b981` | `var(--brand-image)` 即 `#39acff` |
| Config | `#60a5fa` | `var(--brand-main-default)` |
| Other | `theme.node.muted` | `var(--stroke-primary)` |
| Video（隐含） | 同 Other | `var(--brand-video)` 即 `#6b68ff` |

## 使用约定

1. **不要在组件里写颜色 hex**。新写代码统一引用 CSS 变量。
2. **不要在组件里直接用 `dark:` Tailwind 修饰符控制颜色**。颜色由 CSS 变量切主题自动响应。
3. 透明度叠加：用 `color-mix(in srgb, var(--brand-main-default) 8%, transparent)` 或直接展开 hex+alpha。
4. 节点描边宽度：常态 1px，选中态 2px（infinite-canvas 是 `border-2` + `0 0 0 1px ${selectionBlue}55` outline，可改为 `outline: 2px solid var(--canvas-selection-border)`）。
5. resize 手柄视觉：`8x8` 圆点，`background: var(--canvas-resize-handle-bg)`，`border: 2px solid var(--canvas-selection-border)`。

## 留作 P2 时再确认

下列色 infinite-canvas 在节点内部用过，但语义可由现有变量覆盖，待 P2 节点改造时按需引用：

- 图片加载占位渐变 → 已有 `--canvas-image-loading-start/--canvas-image-loading-end`
- 错误态描边 → 用 `#ef4444`（红）即可，不引入新 token
- 批量组叠卡阴影 → 用现有 `--shadow-generator-float-block` 叠 translate/rotate
