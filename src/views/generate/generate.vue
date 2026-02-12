<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SideMenu from '../../components/home/components/SideMenu.vue'
import ContentGenerator from '../../components/generate/ContentGenerator.vue'
import ImageLoadingRecord from '../../components/generate/common/ImageLoadingRecord.vue'
import AgentLoadingRecord from '../../components/generate/common/AgentLoadingRecord.vue'
import ApiSettingsDialog from '@/components/common/ApiSettingsDialog.vue'
import { streamChatCompletions } from '@/api/chat'
import { getAgentModel } from '@/api/agent'
import { generateImage } from '@/views/workflow/api/image'
import { getAllImageModels } from '@/config/models'
import type { CreationType } from '../../components/generate/selectors'

const route = useRoute()
const router = useRouter()

// ContentGenerator 组件引用
const contentGeneratorRef = ref<InstanceType<typeof ContentGenerator> | null>(null)

// 生成记录列表
interface GeneratingRecord {
  id: number
  type: CreationType
  prompt: string
  time: string
  model: string
  modelKey: string
  ratio: string
  resolution: string
  duration: string
  feature: string
  content: string
  images: string[]
  done: boolean
  error: string
}
const generatingRecords = ref<GeneratingRecord[]>([])
let nextId = 0

// 设置弹窗
const showSettings = ref(false)

// 格式化时间分组标签
const formatGroupLabel = (date: Date): string => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = today.getTime() - target.getTime()
  const dayMs = 86400000

  if (diff === 0) return '今天'
  if (diff === dayMs) return '昨天'
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 处理发送事件
const handleSend = (message: string, type: CreationType, options?: { model?: string, modelKey?: string, ratio?: string, resolution?: string, duration?: string, feature?: string }) => {
  const record: GeneratingRecord = {
    id: nextId++,
    type,
    prompt: message,
    time: formatGroupLabel(new Date()),
    model: options?.model || '',
    modelKey: options?.modelKey || '',
    ratio: options?.ratio || '',
    resolution: options?.resolution || '',
    duration: options?.duration || '',
    feature: options?.feature || '',
    content: '',
    images: [],
    done: false,
    error: ''
  }
  generatingRecords.value.unshift(record)

  // 根据类型触发不同的生成逻辑
  if (type === 'agent') {
    runAgentStream(generatingRecords.value[0])
  } else if (type === 'image') {
    runImageGeneration(generatingRecords.value[0])
  }
}

// 图片生成
const runImageGeneration = async (record: GeneratingRecord) => {
  try {
    // 根据模型配置构建请求参数
    const modelConfig = getAllImageModels().find(m => m.key === record.modelKey)
    const sizeKey = modelConfig?.sizes?.length
      ? (modelConfig.sizes.find(s => s.includes(record.ratio.replace(':', 'x'))) || modelConfig.defaultParams?.size || '')
      : ''

    const data: any = {
      model: record.modelKey,
      prompt: record.prompt,
      n: 1
    }
    if (sizeKey) data.size = sizeKey

    const result = await generateImage(data)

    // 提取图片 URL
    const urls: string[] = []
    if (result?.data) {
      for (const item of result.data) {
        if (item.url) urls.push(item.url)
        else if (item.b64_json) urls.push(`data:image/png;base64,${item.b64_json}`)
      }
    }

    if (urls.length) {
      record.images = urls
    } else {
      record.error = '未能获取到生成的图片'
    }
  } catch (e: unknown) {
    record.error = e instanceof Error ? e.message : '图片生成失败'
  } finally {
    record.done = true
  }
}

// agent 流式对话（逐字输出效果）
const runAgentStream = async (record: GeneratingRecord) => {
  let buffer = ''
  let flushing = false
  let streamDone = false

  // 逐字刷新到页面
  const flush = () => {
    if (flushing) return
    flushing = true
    const step = () => {
      if (buffer.length > 0) {
        // 每次输出 1~3 个字符，模拟打字效果
        const chars = Math.min(buffer.length, Math.ceil(Math.random() * 2) + 1)
        record.content += buffer.slice(0, chars)
        buffer = buffer.slice(chars)
        requestAnimationFrame(step)
      } else {
        flushing = false
        if (streamDone) record.done = true
      }
    }
    requestAnimationFrame(step)
  }

  try {
    const stream = streamChatCompletions({
      model: getAgentModel(),
      messages: [{ role: 'user', content: record.prompt }]
    })
    for await (const chunk of stream) {
      buffer += chunk
      flush()
    }
  } catch (e: unknown) {
    record.error = e instanceof Error ? e.message : '请求失败'
  }
  streamDone = true
  if (!buffer.length) record.done = true
  else flush()
}

// 上一次滚动位置
let lastScrollTop = 0

// 点击空白区域折叠
const handlePageClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  // 检查点击的是否是输入框组件内部
  const contentGenerator = document.querySelector('.dimension-layout-FUl4Nj')
  if (contentGenerator && !contentGenerator.contains(target)) {
    // 点击的是输入框组件外部，折叠
    contentGeneratorRef.value?.collapse()
  }
}

// 修复滚动方向反转问题 + 控制输入框折叠/展开
onMounted(() => {
  // 检查路由参数（从首页跳转过来的发送请求）
  const { message, type, model, ratio, resolution } = route.query
  if (message && type) {
    handleSend(
      message as string,
      type as CreationType,
      { model: model as string, ratio: ratio as string, resolution: resolution as string }
    )
    // 清除 query 参数，避免刷新重复创建
    router.replace({ path: '/generate' })
  }

  const scrollContainer = document.querySelector('.virtual-list-gUs6jj') as HTMLElement

  // 添加页面点击监听
  document.addEventListener('click', handlePageClick)

  if (scrollContainer) {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      // 反转滚动方向：由于容器被旋转了180度，我们需要反转滚动增量
      scrollContainer.scrollTop -= e.deltaY
    }

    // 滚动事件处理：控制输入框折叠/展开
    const handleScroll = () => {
      const currentScrollTop = scrollContainer.scrollTop

      // 判断是否滚动到底部（由于容器旋转180度，底部实际上是 scrollTop 接近 0）
      const isAtBottom = currentScrollTop <= 10

      // 判断滚动方向（由于容器旋转，方向也反转了）
      const isScrollingUp = currentScrollTop > lastScrollTop  // 实际是向上滚动（看旧内容）

      if (contentGeneratorRef.value) {
        if (isAtBottom) {
          // 滚动到底部时展开
          contentGeneratorRef.value.expand()
        } else if (isScrollingUp && currentScrollTop > 50) {
          // 向上滚动（看旧内容）时折叠
          contentGeneratorRef.value.collapse()
        }
      }

      lastScrollTop = currentScrollTop
    }

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false })
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    // 清理函数
    onUnmounted(() => {
      scrollContainer.removeEventListener('wheel', handleWheel)
      scrollContainer.removeEventListener('scroll', handleScroll)
      document.removeEventListener('click', handlePageClick)
    })
  }
})
</script>

<template>
  <div class="jimeng-home-container">
    <div id="csr-root">
      <div class="global-dreamina-container">
        <div id="dreamina" class="root_bf55f">
          <div class="top-down-layer-ilr3Ve">
            <div class="container-moSF_y"
                 style="--side-menu-width:76px;--side-drawer-width:440px;--side-drawer-float-limit-width:1280px">
              <!-- 侧边菜单 -->
              <SideMenu/>
              <div class=content-wrapper-cF1zaN>
                <div id=dreamina-ui-configuration-content-wrapper class=main-container-nXfW_A>
                  <div class=content-TZbgMr>
                    <div class=entry-lav5_s>
                      <div class=record-list-container-YQhwuM>
                        <div class="record-list-RjGugi record-virtual-list"
                             style=--content-generator-height:174px>
                          <div class=virtual-list-container-rarVwb
                               style=--virtual-list-rotate:rotate(180deg);--virtual-list-direction:rtl;--virtual-list-justify-content:flex-end>
                            <div class=scroll-container-j7wUS8 style=height:100%>
                              <div class=virtual-list-gUs6jj style=height:100%>
                                <div style=height:1056.88px></div>
                                <div id=scroll-list-9341e2ed-6804-4e34-9b38-1eb6fe79c48e
                                     class=scroll-list-gsJVWP
                                     style=transform:translate3d(0px,0px,0px)>
                                  <div class=scroll-slot-coWS6S></div>
                                  <div class=top-placeholder-fTCjHC>
                                    <div class=top-placeholder-aEry7y>
                                      <div class=clean-agent-context-wrapper-QM8uAh><span
                                          class=clean-agent-context-text-Lx4BjY>创建新会话</span>
                                      </div>
                                      <div class=empty-placeholder-dcs8S2></div>
                                    </div>
                                  </div>
                                  <!-- 正在生成中的记录 -->
                                  <template v-for="(record, index) in generatingRecords" :key="record.id">
                                    <div class=item-Xh64V7 :data-index="index * 2 + 1" style=z-index:1>
                                      <AgentLoadingRecord v-if="record.type === 'agent'" :prompt="record.prompt" :content="record.content" :done="record.done" :error="record.error" />
                                      <ImageLoadingRecord v-else
                                        :prompt="record.prompt"
                                        :model="record.model"
                                        :ratio="record.ratio"
                                        :resolution="record.resolution"
                                        :duration="record.duration"
                                        :feature="record.feature"
                                        :done="record.done"
                                        :images="record.images"
                                        :error="record.error"
                                      />
                                    </div>
                                    <div class=item-Xh64V7 :data-index="index * 2 + 2" style=z-index:1>
                                      <div class=responsive-container-msS_cP>
                                        <div class="content-DPogfx ai-generated-record-content-hg5EL8">
                                          <div class=group-title-mhd8yy>{{ record.time }}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </template>
                                  <div id=item_9341e2ed-6804-4e34-9b38-1eb6fe79c48e_034d015f-dde5-f7fc-ad92-e079b6c18e44
                                       class=item-Xh64V7
                                       data-id=034d015f-dde5-f7fc-ad92-e079b6c18e44
                                       data-index=0 style=z-index:1>
                                    <div class="responsive-container-msS_cP responsive-container-Nivf0N">
                                      <div class="content-DPogfx ai-generated-record-content-hg5EL8">
                                        <div class=agentic-record-qV_0lS>
                                          <div class="agentic-record-content-pUXA3k completed-E206yG">
                                            <div class=user-message-IyG6vx>
                                              <div class=context-menu-trigger-QXaWD5>
                                                <div class=user-message-content-Qs9l2b>
                                                  <div class=user-message-text-Fb_kWq>
                                                    <span class=prompt-value-container-KCtKOf><span>你好</span></span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            <div class=assistant-message-text-e69SR6>
                                              <div class="markdown-render-DkILWY markdown-render-UH4_kU">
                                                <h1>意图分析</h1>
                                                <p>
                                                  用户输入了“你好”，这是一个友好的问候。根据系统提示，我需要主动引导用户进入创作流程。因此，我将通过提问来激发用户的创作灵感，为后续的图片或视频生成任务做准备。</p>
                                                <h1>任务规划</h1>
                                                <ol>
                                                  <li>回应用户的问候。</li>
                                                  <li>
                                                    提出一系列引导性问题，涵盖图片生成、视频生成、图片编辑等多个方面，以帮助用户明确自己的创作需求。
                                                  </li>
                                                  <li>
                                                    保持对话的开放性和友好性，鼓励用户分享他们的想法。
                                                  </li>
                                                </ol>
                                                <p>你好！很高兴能为您服务。</p>
                                                <p>
                                                  我是您的AI创作助手，可以为您生成图片、视频，或者对您的图片进行编辑。您今天想创作些什么呢？</p>
                                                <p>
                                                  是想生成一张全新的图片，比如“赛博朋克风格的城市夜景”？还是想让一张静态的图片动起来，比如“让照片里的小猫眨眨眼”？或者，您有一张图片想进行修改，比如“把照片里的背景换成星空”？</p>
                                                <p>
                                                  告诉我您的想法，我们一起把它变成现实！</p>
                                              </div>
                                            </div>
                                            <div class=ai-generated-notice-U9hEwy>
                                              以上内容由 AI 生成
                                            </div>
                                          </div>
                                          <div class=record-bottom-slots-AYv3JV>
                                            <div>
                                              <div class=card-bottom-button-view-xY_JqR
                                                   style=--right-padding:14px>
                                                <div class=icon-Eb0kRz>
                                                  <svg fill=none height=1em
                                                       preserveAspectRatio="xMidYMid meet"
                                                       role=presentation
                                                       viewBox="0 0 24 24"
                                                       width=1em
                                                       xmlns=http://www.w3.org/2000/svg>
                                                    <g>
                                                      <path clip-rule=evenodd
                                                            d="m8.56 5.726 3.948-2.776a.5.5 0 0 1 .788.41v2.23h2.72v2H9.187a.996.996 0 0 1-.631-.225c-.518-.367-.61-1.208.003-1.64Zm10.775 9.213a1 1 0 1 0 1.5 1.323 6.403 6.403 0 0 0 1.605-4.249 6.403 6.403 0 0 0-1.606-4.249 6.41 6.41 0 0 0-4.817-2.174v2a4.41 4.41 0 0 1 3.318 1.498 4.403 4.403 0 0 1 1.105 2.925 4.403 4.403 0 0 1-1.105 2.926Zm-14.67-5.88a1 1 0 1 0-1.5-1.323 6.403 6.403 0 0 0-1.605 4.249c0 1.628.607 3.117 1.606 4.25a6.41 6.41 0 0 0 4.817 2.174v-2a4.41 4.41 0 0 1-3.318-1.498 4.403 4.403 0 0 1-1.105-2.926c0-1.123.416-2.145 1.105-2.926Zm3.318 9.35h2.404v2.232a.5.5 0 0 0 .788.409l3.962-2.785a.816.816 0 0 0 .066-.05.999.999 0 0 0-.591-1.806H7.983v2Z"
                                                            data-follow-fill=currentColor
                                                            fill=currentColor
                                                            fill-rule=evenodd></path>
                                                    </g>
                                                  </svg>
                                                </div>
                                                <div>重新生成</div>
                                              </div>
                                            </div>
                                            <div>
                                              <div class=card-icon-button-PCRIDi>
                                                <div class=icon-Eb0kRz>
                                                  <svg fill=none height=1em
                                                       preserveAspectRatio="xMidYMid meet"
                                                       role=presentation
                                                       viewBox="0 0 24 24"
                                                       width=1em
                                                       xmlns=http://www.w3.org/2000/svg>
                                                    <g>
                                                      <path d="M7.06 10.154c-.2 0-.392.03-.583.059.062-.209.126-.42.228-.61.102-.277.262-.517.42-.758.134-.261.368-.438.54-.661.18-.217.426-.362.621-.542.191-.189.442-.283.64-.416.209-.12.39-.251.584-.314l.484-.199a.535.535 0 0 0 .313-.624l-.19-.757a.556.556 0 0 0-.669-.406l-.618.154c-.243.045-.503.168-.792.28-.285.127-.615.213-.922.418-.309.196-.665.359-.979.62-.304.271-.671.505-.942.849-.296.321-.589.659-.816 1.043-.263.366-.441.768-.63 1.165-.17.398-.308.804-.42 1.199a10.833 10.833 0 0 0-.344 2.187c-.03.644-.013 1.18.025 1.568.013.182.038.36.056.483l.023.15.023-.005a4.038 4.038 0 1 0 3.948-4.883Zm9.871 0c-.2 0-.392.03-.583.059.062-.209.125-.42.228-.61.102-.277.262-.517.42-.758.133-.261.367-.438.54-.661.18-.217.426-.362.62-.542.192-.189.442-.283.641-.416.209-.12.39-.251.584-.314l.483-.199a.535.535 0 0 0 .314-.624l-.19-.757a.556.556 0 0 0-.67-.406l-.617.154c-.244.045-.503.168-.792.28-.284.128-.615.213-.922.419-.31.195-.665.359-.98.62-.304.27-.67.505-.942.848-.296.321-.588.659-.815 1.043-.263.366-.442.768-.63 1.165-.17.398-.308.804-.42 1.199a10.832 10.832 0 0 0-.345 2.187c-.03.644-.012 1.18.025 1.568.014.182.039.36.057.483l.022.15.024-.005a4.038 4.038 0 1 0 3.948-4.883Z"
                                                            data-follow-fill=currentColor
                                                            fill=currentColor></path>
                                                    </g>
                                                  </svg>
                                                </div>
                                              </div>
                                              <div class="simple-tooltip-scroll-anchor sf-hidden"></div>
                                            </div>
                                            <div class="operation-button-oVtvlN normal-button-mS74ha">
                                                                                    <span class=icon-oB5C0a><svg
                                                                                        fill=none height=1em
                                                                                        preserveAspectRatio="xMidYMid meet"
                                                                                        role=presentation
                                                                                        viewBox="0 0 24 24"
                                                                                        width=1em
                                                                                        xmlns=http://www.w3.org/2000/svg><g><path
                                                                                        clip-rule=evenodd
                                                                                        d="M7 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm7 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                                                                                        data-follow-fill=currentColor
                                                                                        fill=currentColor
                                                                                        fill-rule=evenodd></path></g></svg></span>
                                            </div>
                                            <div class="simple-tooltip-scroll-anchor sf-hidden"></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div id=item_9341e2ed-6804-4e34-9b38-1eb6fe79c48e_febd2940-ccfc-11f0-b294-af2ab3cf6b8b
                                       class=item-Xh64V7
                                       data-id=febd2940-ccfc-11f0-b294-af2ab3cf6b8b
                                       data-index=3 style=z-index:1>
                                    <div class="responsive-container-msS_cP responsive-container-NBoaUU">
                                      <div class="content-DPogfx ai-generated-record-content-hg5EL8">
                                        <div class=image-record-ytX6Dp>
                                          <div class=record-header-E91Dfj>
                                            <div class=record-header-content-Lkk9CM>
                                              <div class=prompt-suffix-labels-wrapper-qthJZj
                                                   style=--line-height:24px;--padding-top:4px>
                                                <div class=prompt-suffix-labels-NBprFc
                                                     style=--line-height:24px;--padding-top:4px>
                                                  <div class=prompt-suffix-labels-content-uFKTga>
                                                                                                <span class=prompt-P_8aF8><span
                                                                                                    class=prompt-value-container-KCtKOf><span>一只猫在花园里玩耍，卡通风格</span></span></span><span
                                                      class=labels-mHLx1x
                                                      style=visibility:visible><span
                                                      class=label-lhnDlt>图片 4.0</span><span
                                                      class=label-lhnDlt>1:1</span><span
                                                      class=label-lhnDlt>2K</span></span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <div class=record-box-wrapper-MDgaBP>
                                            <div class=image-record-content-TuJi21>
                                              <div class=responsive-image-grid-WOh0lB>
                                                <div class="image-card-wrapper-WOgXrk landscape-Ven8Mz"
                                                     style=--aspect-ratio:1>
                                                  <div class=image-record-item-W6Y7Df>
                                                    <div class=context-menu-trigger-WJ6VDZ>
                                                      <div class="slot-card-container-gulhrr image-card-container-dFemyw">
                                                        <div class=content-container-z0JOWv>
                                                          <div aria-describedby=DndDescribedBy-0
                                                               aria-disabled=false
                                                               aria-roledescription=draggable
                                                               class=image-card-container-qy7ui4
                                                               role=button
                                                               tabindex=0>
                                                            <div class="container-bG3PQ9 image-GnB1sY">
                                                              <div style="transition:opacity 300ms;opacity:1">
                                                                <img class=image-TLmgkP
                                                                     crossorigin=anonymous
                                                                     data-apm-action=ai-generated-image-record-card
                                                                     draggable=false
                                                                     fetchpriority=high
                                                                     loading=lazy
                                                                     src="https://p3-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/6a37e138cede4802be9fcc05c42ab87c~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=tTmi9yn9JBoHnwIQwoqg5p%2BYuDA%3D&format=.webp">
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div class="image-card-wrapper-WOgXrk landscape-Ven8Mz"
                                                     style=--aspect-ratio:1>
                                                  <div class=image-record-item-W6Y7Df>
                                                    <div class=context-menu-trigger-WJ6VDZ>
                                                      <div class="slot-card-container-gulhrr image-card-container-dFemyw">
                                                        <div class=content-container-z0JOWv>
                                                          <div aria-describedby=DndDescribedBy-0
                                                               aria-disabled=false
                                                               aria-roledescription=draggable
                                                               class=image-card-container-qy7ui4
                                                               role=button
                                                               tabindex=0>
                                                            <div class="container-bG3PQ9 image-GnB1sY">
                                                              <div style="transition:opacity 300ms;opacity:1">
                                                                <img class=image-TLmgkP
                                                                     crossorigin=anonymous
                                                                     data-apm-action=ai-generated-image-record-card
                                                                     draggable=false
                                                                     fetchpriority=high
                                                                     loading=lazy
                                                                     src="https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/2fbae30526cc47d48ba6fbb5a453bd60~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=T%2Fo9gmYv7pHhMF4l85a87IhBrBI%3D&format=.webp">
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>

                                              </div>
                                            </div>
                                            <div class=operations-NxPE1B>
                                              <div class=record-bottom-slots-AYv3JV>
                                                <div>
                                                  <div class=card-bottom-button-view-xY_JqR
                                                       style=--right-padding:14px>
                                                    <div class=icon-Eb0kRz>
                                                      <svg fill=none
                                                           height=1em
                                                           preserveAspectRatio="xMidYMid meet"
                                                           role=presentation
                                                           viewBox="0 0 24 24"
                                                           width=1em
                                                           xmlns=http://www.w3.org/2000/svg>
                                                        <g>
                                                          <path clip-rule=evenodd
                                                                d="M3.764 8.02a2.5 2.5 0 0 1 2.5-2.5H17.03a2.5 2.5 0 0 1 2.5 2.5V9.8a3.25 3.25 0 0 1 2-.082V8.019a4.5 4.5 0 0 0-4.5-4.5H6.264a4.5 4.5 0 0 0-4.5 4.5v7.932a4.5 4.5 0 0 0 4.5 4.5h5.837a2.436 2.436 0 0 1-.05-.57v-1.43H6.263a2.5 2.5 0 0 1-2.5-2.5V8.019Zm17.67 3.964a1 1 0 0 0-1.41-.004l-5.773 5.707a.25.25 0 0 0-.074.178v2.366c0 .138.112.25.25.25h2.347a.25.25 0 0 0 .178-.075l5.71-5.791a1 1 0 0 0-.006-1.41l-1.221-1.22Z"
                                                                data-follow-fill=currentColor
                                                                fill=currentColor
                                                                fill-rule=evenodd></path>
                                                        </g>
                                                      </svg>
                                                    </div>
                                                    <div>重新编辑</div>
                                                  </div>
                                                </div>
                                                <div>
                                                  <div>
                                                    <div class=tooltip-container-jIHxiC>
                                                      <div class=card-bottom-button-view-xY_JqR
                                                           style=--right-padding:14px>
                                                        <div class=icon-Eb0kRz>
                                                          <svg fill=none
                                                               height=1em
                                                               preserveAspectRatio="xMidYMid meet"
                                                               role=presentation
                                                               viewBox="0 0 24 24"
                                                               width=1em
                                                               xmlns=http://www.w3.org/2000/svg>
                                                            <g>
                                                              <path clip-rule=evenodd
                                                                    d="m8.56 5.726 3.948-2.776a.5.5 0 0 1 .788.41v2.23h2.72v2H9.187a.996.996 0 0 1-.631-.225c-.518-.367-.61-1.208.003-1.64Zm10.775 9.213a1 1 0 1 0 1.5 1.323 6.403 6.403 0 0 0 1.605-4.249 6.403 6.403 0 0 0-1.606-4.249 6.41 6.41 0 0 0-4.817-2.174v2a4.41 4.41 0 0 1 3.318 1.498 4.403 4.403 0 0 1 1.105 2.925 4.403 4.403 0 0 1-1.105 2.926Zm-14.67-5.88a1 1 0 1 0-1.5-1.323 6.403 6.403 0 0 0-1.605 4.249c0 1.628.607 3.117 1.606 4.25a6.41 6.41 0 0 0 4.817 2.174v-2a4.41 4.41 0 0 1-3.318-1.498 4.403 4.403 0 0 1-1.105-2.926c0-1.123.416-2.145 1.105-2.926Zm3.318 9.35h2.404v2.232a.5.5 0 0 0 .788.409l3.962-2.785a.816.816 0 0 0 .066-.05.999.999 0 0 0-.591-1.806H7.983v2Z"
                                                                    data-follow-fill=currentColor
                                                                    fill=currentColor
                                                                    fill-rule=evenodd></path>
                                                            </g>
                                                          </svg>
                                                        </div>
                                                        <div>再次生成
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div class="operation-button-oVtvlN normal-button-mS74ha">
                                                                                            <span class=icon-oB5C0a><svg
                                                                                                fill=none height=1em
                                                                                                preserveAspectRatio="xMidYMid meet"
                                                                                                role=presentation
                                                                                                viewBox="0 0 24 24"
                                                                                                width=1em
                                                                                                xmlns=http://www.w3.org/2000/svg><g><path
                                                                                                clip-rule=evenodd
                                                                                                d="M7 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm7 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                                                                                                data-follow-fill=currentColor
                                                                                                fill=currentColor
                                                                                                fill-rule=evenodd></path></g></svg></span>
                                                </div>
                                                <div class="simple-tooltip-scroll-anchor sf-hidden"></div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div id=item_9341e2ed-6804-4e34-9b38-1eb6fe79c48e_1764404742876
                                       class=item-Xh64V7 data-id=1764404742876 data-index=4
                                       style=z-index:1>
                                    <div class=responsive-container-msS_cP>
                                      <div class="content-DPogfx ai-generated-record-content-hg5EL8">
                                        <div class=group-title-mhd8yy>11月29日</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div class=scroll-slot-coWS6S></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class=filter-mask-IOpWQJ></div>
                        <div class="filter-container-wyGTle filter-F4oqdf">
                          <div class="container-ufW1eH collapsed-HB97Ck">
                            <div class="lv-input-group-wrapper lv-input-group-wrapper-default search-input-ZwhOpf">
                                                    <span class=lv-input-group><span
                                                        class="lv-input-inner-wrapper lv-input-inner-wrapper-has-prefix lv-input-inner-wrapper-default lv-input-clear-wrapper"><span
                                                        class=lv-input-group-prefix><svg
                                                        class="search-icon-rvzopq search-icon-interactive-LHh2d0"
                                                        fill=none
                                                        height=1em
                                                        preserveAspectRatio="xMidYMid meet"
                                                        role=presentation viewBox="0 0 24 24"
                                                        width=1em
                                                        xmlns=http://www.w3.org/2000/svg><g><path
                                                        clip-rule=evenodd
                                                        d="M4.563 10.75a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm6.5-8.5a8.5 8.5 0 1 0 5.261 15.176l3.406 3.406a1 1 0 0 0 1.415-1.414l-3.407-3.406A8.5 8.5 0 0 0 11.062 2.25Z"
                                                        data-follow-fill=currentColor fill=currentColor
                                                        fill-rule=evenodd></path></g></svg></span><input
                                                        class="lv-input lv-input-size-default" maxlength=100
                                                        placeholder=搜索 value></span></span>
                            </div>
                          </div>
                          <span class=separator-AluiGy></span>
                          <div class=container-KL2j0F><span class=trigger-AnFRb7><span
                              class="filter-text-bBfqrS filter-text-MnA06c">时间</span><svg
                              class=dropdown-arrow-qZsXaR fill=none height=1em
                              preserveAspectRatio="xMidYMid meet" role=presentation
                              viewBox="0 0 24 24"
                              width=1em xmlns=http://www.w3.org/2000/svg><g><path
                              clip-rule=evenodd
                              d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z"
                              data-follow-fill=currentColor
                              fill=currentColor
                              fill-rule=evenodd></path></g></svg></span></div>
                          <span class=separator-AluiGy></span>
                          <div class=container-KL2j0F><span class=trigger-AnFRb7><span
                              class=filter-text-bBfqrS>生成类型</span><svg
                              class=dropdown-arrow-qZsXaR fill=none
                              height=1em
                              preserveAspectRatio="xMidYMid meet"
                              role=presentation
                              viewBox="0 0 24 24"
                              width=1em
                              xmlns=http://www.w3.org/2000/svg><g><path
                              clip-rule=evenodd
                              d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z"
                              data-follow-fill=currentColor
                              fill=currentColor
                              fill-rule=evenodd></path></g></svg></span></div>
                          <span class=separator-AluiGy></span>
                          <div class=container-KL2j0F><span class=trigger-AnFRb7><span
                              class=filter-text-bBfqrS>操作类型</span><svg
                              class=dropdown-arrow-qZsXaR fill=none
                              height=1em
                              preserveAspectRatio="xMidYMid meet"
                              role=presentation
                              viewBox="0 0 24 24"
                              width=1em
                              xmlns=http://www.w3.org/2000/svg><g><path
                              clip-rule=evenodd
                              d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z"
                              data-follow-fill=currentColor
                              fill=currentColor
                              fill-rule=evenodd></path></g></svg></span></div>
                          <!-- API 设置按钮 -->
                          <button class="agent-settings-btn" @click="showSettings = true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="2"/>
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" stroke-width="2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <!-- 内容生成器输入框组件 -->
                      <ContentGenerator ref="contentGeneratorRef" @send="handleSend"/>
                      <!-- API 设置弹窗 -->
                      <ApiSettingsDialog :visible="showSettings" @update:visible="showSettings = $event" />
                      <div class=task-indicator-container-flqXza data-task-indicator-container=true
                           style=--content-generator-collapse-transition-duration:350ms;--content-generator-collapse-transition-timing-function:cubic-bezier(0.15,0.75,0.3,1);--content-generator-height:174px>
                        <div class="task-indicator-wWf8DJ task-indicator-srBESV inside-content-generator-ZzUKJD no-task-pKFF37 hidden-EhjzJD"
                             data-task-indicator=true>
                          <div class="status-jfz4Bo inside-content-generator-jGogM6 no-task-DcVE6g">
                            <svg class=icon-M8qF2b fill=none height=1em
                                 preserveAspectRatio="xMidYMid meet" role=presentation
                                 viewBox="0 0 24 24"
                                 width=1em xmlns=http://www.w3.org/2000/svg>
                              <g>
                                <path clip-rule=evenodd
                                      d="M2 12C2 6.48 6.48 2 12 2c5.53 0 10 4.48 10 10s-4.47 10-10 10C6.48 22 2 17.52 2 12Zm9.12-3.79c0-.48.4-.88.88-.88s.87.4.87.88v4.42a.87.87 0 0 1-.87.87.879.879 0 0 1-.88-.87V8.21Zm.89 8.47c-.49 0-.88-.4-.88-.88s.39-.87.87-.87c.49 0 .88.39.88.87s-.39.88-.87.88Z"
                                      data-follow-fill=currentColor
                                      fill=currentColor
                                      fill-rule=evenodd></path>
                              </g>
                            </svg>
                            <div class="preview-container-RzT24s preview-container-iPrKb6 sf-hidden"></div>
                          </div>
                          <button class="lv-btn lv-btn-secondary lv-btn-size-mini lv-btn-shape-square button-c41WFq"
                                  type=button><span>回到底部</span>
                            <svg fill=none height=1em preserveAspectRatio="xMidYMid meet"
                                 role=presentation viewBox="0 0 24 24" width=1em
                                 xmlns=http://www.w3.org/2000/svg>
                              <g>
                                <path clip-rule=evenodd
                                      d="M12.701 19.704a1 1 0 0 1-1.403 0l-7.786-7.669a1 1 0 0 1 1.403-1.425l7.084 6.978 7.085-6.978a1 1 0 1 1 1.403 1.425l-7.786 7.67Z"
                                      data-follow-fill=currentColor
                                      fill=currentColor
                                      fill-rule=evenodd></path>
                                <path clip-rule=evenodd
                                      d="M12.701 13.1a1 1 0 0 1-1.403 0L3.532 5.45a1 1 0 1 1 1.403-1.424L12 10.983l7.064-6.957a1 1 0 1 1 1.404 1.424L12.7 13.1Z"
                                      data-follow-fill=currentColor
                                      fill=currentColor
                                      fill-rule=evenodd></path>
                              </g>
                            </svg>
                          </button>
                          <div class=card-cMUBrX>
                            <div class=card-background-tErOcE>
                              <div class=card-gradient-kUKcJ8>
                                <div class=card-content-GKrKfc>
                                  <svg fill=none height=1em
                                       preserveAspectRatio="xMidYMid meet"
                                       role=presentation viewBox="0 0 24 24"
                                       width=1em xmlns=http://www.w3.org/2000/svg>
                                    <g>
                                      <path d="M18.104 14.462c-1.359 2.008-2.203 4.3-1.87 6.566a.723.723 0 0 1-.397.76.747.747 0 0 1-.852-.162c-1.603-1.683-3.903-2.463-6.301-2.643a26.536 26.536 0 0 0 5.107-1.877 26.004 26.004 0 0 0 4.316-2.647l-.003.003ZM6.339 2.258a.575.575 0 0 1 .732.202c3.953 5.991 8.172 7.646 13.622 6.642a.931.931 0 0 1 .997.496c.415.832-.438 1.344-.964 1.832-1.485 1.198-4.25 2.932-7.573 4.553-3.326 1.621-6.397 2.734-8.251 3.166-.402.063-.808.188-1.216.202-.81-.054-1.2-1.119-.583-1.669C7.235 14.016 8.323 9.77 6.047 2.96a.574.574 0 0 1 .292-.701Z"
                                            data-follow-fill=currentColor
                                            fill=currentColor></path>
                                    </g>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style=height:1px></div>
                    </div>
                  </div>
                  <div class="platform-ui-service-side-drawer-container normal-mode legacy">
                    <div class=side-drawer-panel></div>
                  </div>
                  <div class=container_44d3c style=bottom:20px;right:20px>
                    <div class=help-center-nTCbew
                         style=background-color:var(--background-dropdown-menu);color:var(--text-tertiary)>
                      <div class=trigger-REbHBM>
                        <svg class=icon-RC7nOi fill=none height=1em
                             preserveAspectRatio="xMidYMid meet" role=presentation viewBox="0 0 24 24"
                             width=1em xmlns=http://www.w3.org/2000/svg>
                          <g>
                            <path clip-rule=evenodd
                                  d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm8.825 4.897a1.175 1.175 0 1 1 2.35 0 1.175 1.175 0 0 1-2.35 0ZM12 6.11c-.477 0-.95.09-1.395.263-.443.173-.85.43-1.195.755a3.538 3.538 0 0 0-.813 1.15c-.205.468-.289 1.049-.289 1.481a1 1 0 0 0 2 0c0-.235.055-.527.12-.677.081-.184.2-.354.355-.5a1.72 1.72 0 0 1 .551-.347 1.83 1.83 0 0 1 1.332 0c.21.082.396.2.55.347.155.146.275.316.355.5.08.183.12.377.12.571 0 .439-.108.662-.22.811-.139.185-.339.336-.686.572l-.066.044c-.302.204-.736.496-1.074.912-.403.495-.645 1.12-.645 1.923a1 1 0 0 0 2 0c0-.362.095-.536.196-.66.141-.174.34-.313.711-.564l.008-.005c.325-.22.793-.538 1.156-1.022.393-.524.62-1.178.62-2.01 0-.474-.098-.941-.288-1.375a3.538 3.538 0 0 0-.813-1.15 3.708 3.708 0 0 0-1.195-.756A3.829 3.829 0 0 0 12 6.11Z"
                                  data-follow-fill=currentColor fill=currentColor
                                  fill-rule=evenodd></path>
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "./generate.css";
</style>