<template>
  <Teleport to="body">
    <Transition
        name="home-work-detail-modal"
        :duration="{ enter: 360, leave: 240 }"
    >
      <div
          v-if="modelValue"
          class="home-work-detail-modal-host lv-modal-wrapper lv-modal-wrapper-align-center work-detail-modal-wrapper-3L0Dzs"
          style="display: block"
      >
        <div
            class="home-work-detail-backdrop"
            aria-hidden="true"
            @click="close"
        ></div>
        <div
            ref="dialogRef"
            role="dialog"
            aria-modal="true"
            aria-label="作品详情"
            class="lv-modal lv-modal-simple lv-modal-closable"
            @click.stop
        >
          <div data-focus-lock-disabled="false" tabindex="-1">
            <div class="lv-modal-header sf-hidden"></div>
            <div class="lv-modal-content">
              <div class="container-sIRIJR" tabindex="0">
                <div class="container-kvmiPn container-iGQAgS">
                  <div class="preview-area-TnDJHN">
                    <div
                        class="container-T1jCWT home-work-detail-preview-column"
                        :class="{
                                                                'home-work-detail-generator-expanded':
                                                                  contentGeneratorVisible && contentGeneratorExpanded,
                                                              }"
                    >
                      <div class="preview-area-QscVpt home-work-detail-preview-stage">
                        <div class="context-menu-trigger-container-w5xaCZ">
                          <div class="image-left-content-myH1iF">
                            <div class="image-player-KCJSe1">
                              <div class="image-player-container-V9ZRXE">
                                <div class="image-player-content-Ml9sbe">
                                  <div class="container-bbbsvQ image-player-image-_Tib2c home-work-detail-image-frame">
                                    <div
                                        v-show="!detailImageReady"
                                        class="home-work-detail-img-skeleton"
                                        aria-hidden="true"
                                    ></div>
                                    <Transition name="work-detail-img" mode="out-in">
                                      <img
                                          :key="imageSrc"
                                          data-apm-action="ai-generated-image-detail-card"
                                          draggable="false"
                                          fetchpriority="high"
                                          loading="eager"
                                          class="image-eTuIBd noAnimation-RP9btL home-work-detail-main-img"
                                          :src="imageSrc"
                                          @load="onDetailImageLoad"
                                          @error="onDetailImageError">
                                    </Transition>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <!-- 底部嵌入生成器：v-show 仅控制是否已点「使用提示词」；收起用组件内 collapse，不隐藏整条 -->
                      <div
                          v-show="contentGeneratorVisible"
                          class="work-detail-content-generator-oprkFz content-generator-z1rciw home-work-detail-embedded-generator"
                          @click.stop
                      >
                        <!-- 透传 ContentGenerator 的 send 载荷（message、类型、可选配置） -->
                        <ContentGenerator
                            ref="contentGeneratorRef"
                            :collapsible="true"
                            :default-expanded="true"
                            initial-creation-type="image"
                            :external-prompt="generatorPromptForSync"
                            :prompt-sync-key="contentGeneratorPromptSyncKey"
                            popup-placement="top"
                            @send="(...args) => emit('content-send', ...args)"
                            @expanded-change="contentGeneratorExpanded = $event"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="operation-area-EihPQ7 middle-content-xyawTY">
                    <div class="switch-area-AKmr_H">
                      <button class="lv-btn lv-btn-text lv-btn-size-default lv-btn-shape-square operation-icon-w5Y4Pg"
                              type="button"
                              aria-label="上一张"
                              :disabled="!galleryNavigable"
                              @click.stop="emitGalleryNav(-1)">
                        <svg width="20" height="20" viewBox="0 0 24 24"
                             preserveAspectRatio="xMidYMid meet" fill="none"
                             role="presentation"
                             xmlns="http://www.w3.org/2000/svg">
                          <g>
                            <path data-follow-fill="currentColor"
                                  fill-rule="evenodd" clip-rule="evenodd"
                                  d="M21.01 16.018a1.2 1.2 0 0 0-.01-1.697l-8.156-8.06a1.2 1.2 0 0 0-1.688 0L3 14.32a1.2 1.2 0 0 0 1.687 1.707L12 8.801l7.313 7.227a1.2 1.2 0 0 0 1.697-.01Z"
                                  fill="currentColor"></path>
                          </g>
                        </svg>
                      </button>
                      <button class="lv-btn lv-btn-text lv-btn-size-default lv-btn-shape-square operation-icon-w5Y4Pg"
                              type="button"
                              aria-label="下一张"
                              :disabled="!galleryNavigable"
                              @click.stop="emitGalleryNav(1)">
                        <svg width="20" height="20" viewBox="0 0 24 24"
                             preserveAspectRatio="xMidYMid meet" fill="none"
                             role="presentation"
                             xmlns="http://www.w3.org/2000/svg">
                          <g>
                            <path data-follow-fill="currentColor"
                                  fill-rule="evenodd" clip-rule="evenodd"
                                  d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z"
                                  fill="currentColor"></path>
                          </g>
                        </svg>
                      </button>
                    </div>
                    <button class="lv-btn lv-btn-text lv-btn-size-default lv-btn-shape-square operation-icon-w5Y4Pg close-button-PTpYOA"
                            type="button"
                            @click.stop="close">
                      <svg width="20" height="20" viewBox="0 0 24 24"
                           preserveAspectRatio="xMidYMid meet" fill="none"
                           role="presentation" xmlns="http://www.w3.org/2000/svg">
                        <g>
                          <path data-follow-fill="currentColor"
                                d="M19.579 6.119a1.2 1.2 0 0 0-1.697-1.698L12 10.303 6.12 4.422a1.2 1.2 0 1 0-1.697 1.697L10.303 12l-5.881 5.882a1.2 1.2 0 0 0 1.697 1.697L12 13.698l5.882 5.882a1.2 1.2 0 1 0 1.697-1.697L13.697 12l5.882-5.882Z"
                                clip-rule="evenodd"
                                fill-rule="evenodd"
                                fill="currentColor"></path>
                        </g>
                      </svg>
                    </button>
                    <button
                        v-show="contentGeneratorVisible"
                        class="lv-btn lv-btn-text lv-btn-size-default lv-btn-shape-square operation-icon-w5Y4Pg collapse-button-L4UIFa"
                        type="button"
                        :aria-expanded="contentGeneratorExpanded"
                        aria-label="展开或收起底部创作栏"
                        @click.stop="toggleEmbeddedContentGenerator"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24"
                           preserveAspectRatio="xMidYMid meet" fill="none"
                           role="presentation" xmlns="http://www.w3.org/2000/svg">
                        <g>
                          <path data-follow-fill="currentColor"
                                fill-rule="evenodd" clip-rule="evenodd"
                                d="M7 12a1 1 0 0 1 1-1h10.312L14.29 6.977a1 1 0 0 1 1.414-1.414l5.728 5.73a1 1 0 0 1 0 1.414l-5.728 5.73a1 1 0 1 1-1.414-1.414L18.31 13H8a1 1 0 0 1-1-1Zm-2.998 9a1 1 0 0 1-1-1L3 4a1 1 0 1 1 2 0l.002 16a1 1 0 0 1-1 1Z"
                                fill="currentColor"></path>
                        </g>
                      </svg>
                    </button>
                  </div>
                  <div class="detail-area-mylLyv">
                    <div class="main-container-MeJEJY">
                      <div class="content-wrapper-yGrcJJ">
                        <div class="user-profile-container-YpAS0A">
                          <div class="left-container-vYu9RS">
                            <div class="user-section-O05SIg">
                              <div class="user-avatar-gP6jYP"><img
                                  :src="resolvedAuthorAvatarSrc"
                                  class="avatar-image-Xos7qj"
                                  crossorigin="anonymous"
                                  :alt="authorName"
                                  :style="authorAvatarSrc ? undefined : fallbackAvatarStyle">
                              </div>
                              <div class="user-name-UPyK2X">{{ authorName }}</div>
                            </div>
                            <div class="operation-follow-MhTx3J">
                              <svg width="1em" height="1em"
                                   viewBox="0 0 24 24"
                                   preserveAspectRatio="xMidYMid meet"
                                   fill="none" role="presentation"
                                   xmlns="http://www.w3.org/2000/svg">
                                <g>
                                  <path data-follow-fill="currentColor"
                                        d="M10.8 20a1.2 1.2 0 0 0 2.4 0v-6.8H20a1.2 1.2 0 1 0 0-2.4h-6.8V4a1.2 1.2 0 0 0-2.4 0v6.8H4a1.2 1.2 0 0 0 0 2.4h6.8V20Z"
                                        clip-rule="evenodd"
                                        fill-rule="evenodd"
                                        fill="currentColor"></path>
                                </g>
                              </svg>
                              <span>关注</span></div>
                          </div>
                          <div class="right-container-Oz90lW">
                            <div>
                              <div class="favorite-RlC8dW favorite-t8jQY4">
                                <div class="lottie-icon-container icon-QlNaEG">
                                  <div class="lottie-icon-content">
                                    <svg width="1em" height="1em"
                                         viewBox="0 0 24 24"
                                         preserveAspectRatio="xMidYMid meet"
                                         fill="none"
                                         role="presentation"
                                         xmlns="http://www.w3.org/2000/svg"
                                         class="icon-QlNaEG">
                                      <g>
                                        <path data-follow-fill="currentColor"
                                              d="M8.538 3.513a6.077 6.077 0 0 0-6.085 6.07c0 2.819 1.639 5.278 3.37 7.025 1.75 1.764 3.914 3.13 5.588 3.685a1.87 1.87 0 0 0 1.174 0c1.675-.556 3.84-1.92 5.588-3.685 1.732-1.747 3.37-4.206 3.37-7.025a6.077 6.077 0 0 0-6.084-6.07c-1.381 0-2.572.717-3.46 1.432-.889-.715-2.08-1.432-3.461-1.432Zm0 2a4.077 4.077 0 0 0-4.085 4.07c0 2.05 1.215 4.028 2.79 5.617 1.557 1.57 3.436 2.73 4.755 3.18 1.32-.45 3.2-1.61 4.755-3.18 1.575-1.59 2.79-3.568 2.79-5.617 0-2.24-1.82-4.07-4.084-4.07-.929 0-1.877.652-2.78 1.49a1 1 0 0 1-1.36 0c-.904-.838-1.853-1.49-2.781-1.49Z"
                                              clip-rule="evenodd"
                                              fill-rule="evenodd"
                                              fill="currentColor"></path>
                                      </g>
                                    </svg>
                                  </div>
                                </div>
                                <span class="count-GysjBc">{{ likeCount }}</span>
                              </div>
                            </div>
                            <div class="operation-wrapper-Hc6lfr">
                              <svg width="1em" height="1em"
                                   viewBox="0 0 24 24"
                                   preserveAspectRatio="xMidYMid meet"
                                   fill="none" role="presentation"
                                   xmlns="http://www.w3.org/2000/svg"
                                   class="more-options-icon-p31JuD">
                                <g>
                                  <path data-follow-fill="currentColor"
                                        d="M7 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm7 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                                        clip-rule="evenodd"
                                        fill-rule="evenodd"
                                        fill="currentColor"></path>
                                </g>
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div class="work-info-section-kNeD31">
                          <div class="meta-info-wrapper-xhHsPv">
                            <div class="create-time-wrapper-fqUhx0">
                              {{ createDate }}
                            </div>
                            <div class="ai-generated-text-IHOsIL">{{ aiGeneratedText }}</div>
                          </div>
                        </div>
                      </div>
                      <div class="detail-info-n1sIVT">
                        <div class="prompt-tip-_S_YjR">{{ promptTipLabel }}</div>
                        <div class="prompt-value-H7u3lm">
                          <div class="prompt-value-text-cJL62n"><span
                              class="prompt-value-container-lIP4pF"><span>{{ promptText }}</span></span>
                          </div>
                        </div>
                        <button
                            type="button"
                            class="home-work-detail-use-prompt-trigger lv-btn lv-btn-text lv-btn-size-default lv-btn-shape-square"
                            @click.stop="openContentGeneratorFromPrompt"
                        >
                                                                        <span class="home-work-detail-use-prompt-icon" aria-hidden="true">
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" stroke-width="1.2"/>
                                                                                <path d="M8.5 17V7.5h2.2c1.2 0 2.05.85 2.05 2.02 0 1.18-.85 2.03-2.05 2.03H9.2V17H8.5zm.7-5.9h1.45c.82 0 1.4-.55 1.4-1.38 0-.85-.58-1.4-1.4-1.4H9.2v2.78z" fill="currentColor"/>
                                                                            </svg>
                                                                        </span>
                          <span>{{ usePromptLabel }}</span>
                        </button>
                        <div class="prompt-tags-Ixl0vJ">
                          <div>{{ modelLabel }}</div>
                          <span class="divider-RsIwo2"></span>
                          <div>{{ aspectRatioLabel }}</div>
                          <span class="divider-RsIwo2"></span><span
                            class="more-info-label-v4090A"><span
                            class="more-info-label-inner-pYC8kr">更多 <svg
                            width="1em" height="1em" viewBox="0 0 24 24"
                            preserveAspectRatio="xMidYMid meet"
                            fill="none" role="presentation"
                            xmlns="http://www.w3.org/2000/svg"
                            class="icon-RB4Hon"><g><path
                            data-follow-fill="currentColor"
                            d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-10.3a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm0 7.2a1.2 1.2 0 0 0 1.2-1.2v-3.6a1.2 1.2 0 0 0-2.4 0v3.6a1.2 1.2 0 0 0 1.2 1.2Z"
                            fill="currentColor"></path></g></svg></span></span>
                        </div>
                      </div>
                      <div class="action-buttons-wrapper-ibCKz2">
                        <div tabindex="0" class="operation-button-ZGVDtf">
                          <svg width="1em" height="1em" viewBox="0 0 24 24"
                               preserveAspectRatio="xMidYMid meet"
                               fill="none" role="presentation"
                               xmlns="http://www.w3.org/2000/svg"
                               class="operation-icon-cJWKaj">
                            <g>
                              <path data-follow-fill="currentColor"
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    d="M4.92 3.537a4 4 0 0 0-2.83 4.899l2.585 9.645a4 4 0 0 0 4.899 2.829l2.737-.733a3.403 3.403 0 0 1-.874-1.837l-2.381.638a2 2 0 0 1-2.45-1.414L4.023 7.918a2 2 0 0 1 1.414-2.45l3.288-.88a2 2 0 0 1 2.45 1.414l2.318 8.654.553-.246a.683.683 0 0 0 .345-.368l.214-.516a3.56 3.56 0 0 1 .445-.784l-1.944-7.257a4 4 0 0 0-4.899-2.829l-3.287.881ZM21.6 9.766l-.885 3.303a3.332 3.332 0 0 0-1.687-1.433l.64-2.388a1.5 1.5 0 0 0-1.061-1.837l-2.437-.653a1.492 1.492 0 0 0-.659-.026l-.473-1.765c-.01-.039-.022-.077-.034-.115l-.016-.055a3.485 3.485 0 0 1 1.7.03l2.436.652A3.5 3.5 0 0 1 21.6 9.766Zm-3.433 11.127.208-.477a3.68 3.68 0 0 1 1.871-1.899l.64-.285a.447.447 0 0 0 0-.812l-.604-.269a3.682 3.682 0 0 1-1.898-1.961l-.214-.516a.427.427 0 0 0-.794 0l-.213.516a3.681 3.681 0 0 1-1.898 1.961l-.605.27a.447.447 0 0 0 0 .811l.64.285a3.68 3.68 0 0 1 1.872 1.899l.207.477a.427.427 0 0 0 .788 0Z"
                                    fill="currentColor"></path>
                            </g>
                          </svg>
                          <p class="operation-text-sYthqa">{{ makeSameLabel }}</p></div>
                        <div tabindex="0" class="operation-button-ZGVDtf">
                          <svg width="1em" height="1em" viewBox="0 0 24 24"
                               preserveAspectRatio="xMidYMid meet"
                               fill="none" role="presentation"
                               xmlns="http://www.w3.org/2000/svg"
                               class="operation-icon-cJWKaj">
                            <g>
                              <path data-follow-fill="currentColor"
                                    d="M17.67 16.55a1 1 0 0 1 1.414 0l2.121 2.12a1.007 1.007 0 0 1 0 1.415l-2.121 2.122a1 1 0 0 1-1.414-1.415l.414-.414h-4.211a1 1 0 0 1 0-2h4.211l-.414-.414a1 1 0 0 1 0-1.414ZM16.39 2.607a5 5 0 0 1 5 5v8.421l-.892-.891a2.985 2.985 0 0 0-1.108-.7v-6.83a3 3 0 0 0-3-3H7.604a3 3 0 0 0-3 3v8.786c0 .188.02.372.052.55.143-.418.381-.813.719-1.151l2.797-2.797a3 3 0 0 1 4.092-.14l3.13 2.726c.113.1.215.206.31.314-.08.156-.145.319-.195.484h-1.636a3 3 0 0 0-3 3c0 .776.298 1.481.781 2.014h-4.05l-.256-.007a5 5 0 0 1-4.737-4.737l-.007-.256V7.607a5 5 0 0 1 5-5h8.786Zm-.727 4.183a1.556 1.556 0 1 1 0 3.112 1.556 1.556 0 0 1 0-3.112Z"
                                    fill="currentColor"></path>
                            </g>
                          </svg>
                          <p class="operation-text-sYthqa">{{ useAsReferenceLabel }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div id="DndDescribedBy-1" style="display:none">
                To pick up a draggable item, press the space bar.
                While dragging, use the arrow keys to move the item.
                Press space again to drop the item in its new position, or press
                escape to cancel.
              </div>
              <div id="DndLiveRegion-1" role="status" aria-live="assertive" aria-atomic="true"
                   style="position:fixed;width:1px;height:1px;margin:-1px;border:0px;padding:0px;overflow:hidden;clip:rect(0px,0px,0px,0px);clip-path:inset(100%);white-space:nowrap"></div>
            </div>
            <span
                class="lv-modal-close-icon"
                role="button"
                tabindex="0"
                aria-label="关闭"
                @click.stop="close"
                @keydown.enter.prevent="close"
                @keydown.space.prevent="close"
            ></span></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import ContentGenerator from '@components/generate/ContentGenerator.vue'
import { computed, nextTick, onBeforeUnmount, ref, unref, watch } from 'vue'

const BODY_SCROLL_LOCK = 'home-work-detail-modal-scroll-lock'

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const DEFAULT_DETAIL_PROMPT =
    '极简线画，黑色潦草线条，纯白背景，随性勾勒出极简轮廓，剔除所有细节，以最凝练的线条捕捉瞬间'
const EMPTY_AVATAR_DATA_URI =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill-opacity='0'/%3E%3C/svg%3E"
const fallbackAvatarStyle =
    'background-blend-mode:normal!important;background-clip:content-box!important;background-position:50% 50%!important;background-color:rgba(0,0,0,0)!important;background-image:var(--sf-img-20)!important;background-size:100% 100%!important;background-origin:content-box!important;background-repeat:no-repeat!important'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  imageSrc: { type: String, default: '' },
  /** 当前画廊条目数；大于 1 时可点左侧上下箭头切换 */
  galleryLength: { type: Number, default: 0 },
  authorName: { type: String, default: '创作者' },
  authorAvatarSrc: { type: String, default: '' },
  likeCount: { type: [String, Number], default: 999 },
  createDate: { type: String, default: '2026-04-16' },
  aiGeneratedText: { type: String, default: '内容由 AI 生成' },
  promptTipLabel: { type: String, default: '图片提示词' },
  promptText: {
    type: String,
    default: DEFAULT_DETAIL_PROMPT,
  },
  modelLabel: { type: String, default: '图片 4.1' },
  aspectRatioLabel: { type: String, default: '9:16' },
  makeSameLabel: { type: String, default: '做同款' },
  useAsReferenceLabel: { type: String, default: '用作参考图' },
  /** 右侧「使用提示词」，点击后展示底部 ContentGenerator */
  usePromptLabel: { type: String, default: '使用提示词' },
})

const emit = defineEmits(['update:modelValue', 'close', 'gallery-nav', 'content-send'])

const dialogRef = ref(/** @type {HTMLElement | null} */ (null))
const contentGeneratorRef = ref(/** @type {InstanceType<typeof ContentGenerator> | null} */ (null))
/** 点击「使用提示词」后为 true，关闭弹层前保持：底部条始终在（折叠态），不用 v-show 在点空白时关掉整条 */
const contentGeneratorVisible = ref(false)
/** 递增以强制 ContentGenerator 将当前提示词写入输入框 */
const contentGeneratorSyncNonce = ref(0)
/** 与 ContentGenerator 展开态联动，用于预览区底部留白（即梦式叠层） */
const contentGeneratorExpanded = ref(true)
const detailImageReady = ref(true)

/** 同步到生成器输入框的文案（与当前大图 / 画廊条目一致） */
const generatorPromptForSync = computed(() =>
    props.promptText.trim() !== '' ? props.promptText : DEFAULT_DETAIL_PROMPT,
)

const resolvedAuthorAvatarSrc = computed(() => props.authorAvatarSrc || EMPTY_AVATAR_DATA_URI)

const contentGeneratorPromptSyncKey = computed(
    () => `${props.imageSrc}\0${contentGeneratorSyncNonce.value}`,
)

/** @type {Element | null} */
let focusBeforeOpen = null

const galleryNavigable = computed(() => props.galleryLength > 1)

function getFocusableElements() {
  const root = dialogRef.value
  if (!root) return []
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (el) => el instanceof HTMLElement && !el.closest('[inert]'),
  )
}

/** 弹层内键盘：Esc 先折叠已展开的生成器，再关弹层；Tab 在可聚焦元素间循环 */
function onDocumentKeydown(/** @type {KeyboardEvent} */ e) {
  if (!props.modelValue) return
  if (e.key === 'Escape') {
    e.preventDefault()
    if (contentGeneratorVisible.value) {
      const inst = contentGeneratorRef.value
      if (inst && !unref(inst.isCollapsed)) {
        inst.collapse()
        return
      }
    }
    close()
    return
  }
  if (e.key !== 'Tab') return
  const list = getFocusableElements()
  if (list.length === 0) return
  const first = list[0]
  const last = list[list.length - 1]
  const active = document.activeElement
  if (e.shiftKey) {
    if (active === first || !focusableListContains(active, list)) {
      e.preventDefault()
      last.focus()
    }
  } else if (active === last || !focusableListContains(active, list)) {
    e.preventDefault()
    first.focus()
  }
}

/** @param {Element | null} el @param {Element[]} list */
function focusableListContains(el, list) {
  return !!(el && list.includes(el))
}

function emitGalleryNav(delta) {
  if (!galleryNavigable.value) return
  emit('gallery-nav', delta)
}

function toggleEmbeddedContentGenerator() {
  contentGeneratorRef.value?.toggle()
}

/** 使用提示词：刷新同步 key、确保底部栏展示并展开 */
function openContentGeneratorFromPrompt() {
  contentGeneratorSyncNonce.value += 1
  contentGeneratorVisible.value = true
  nextTick(() => contentGeneratorRef.value?.expand())
}

/**
 * 与 generate 页一致：在 document 捕获阶段监听 click（lv-modal 有 @click.stop，冒泡到不了 document）。
 * 点击不在 ContentGenerator 根节点（.dimension-layout-FUl4Nj）内则仅 collapse，不隐藏整条。
 */
function handleDocumentClickForGenerator(/** @type {MouseEvent} */ e) {
  if (!contentGeneratorVisible.value || !props.modelValue) return
  const t = e.target
  if (!(t instanceof Node)) return
  if (t instanceof Element && t.closest('.lv-select-popup')) return
  const host = document.querySelector('.home-work-detail-modal-host')
  const genRoot = host?.querySelector('.dimension-layout-FUl4Nj')
  if (genRoot?.contains(t)) return
  contentGeneratorRef.value?.collapse()
}

function onDetailImageLoad() {
  detailImageReady.value = true
}

function onDetailImageError() {
  detailImageReady.value = true
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function teardownModalChrome() {
  document.removeEventListener('keydown', onDocumentKeydown, true)
  document.removeEventListener('click', handleDocumentClickForGenerator, true)
  document.body.classList.remove(BODY_SCROLL_LOCK)
  document.documentElement.classList.remove(BODY_SCROLL_LOCK)
  if (focusBeforeOpen instanceof HTMLElement) {
    focusBeforeOpen.focus()
  }
  focusBeforeOpen = null
}

watch(
    () => props.imageSrc,
    (src) => {
      if (!src) {
        detailImageReady.value = true
        return
      }
      if (props.modelValue) detailImageReady.value = false
    },
)

/** 打开：锁滚动、注册 Esc/Tab；关闭：复位生成器显隐并 teardown */
watch(
    () => props.modelValue,
    (open) => {
      document.removeEventListener('keydown', onDocumentKeydown, true)
      document.removeEventListener('click', handleDocumentClickForGenerator, true)
      if (open) {
        contentGeneratorVisible.value = false
        detailImageReady.value = !props.imageSrc
        focusBeforeOpen = document.activeElement
        document.body.classList.add(BODY_SCROLL_LOCK)
        document.documentElement.classList.add(BODY_SCROLL_LOCK)
        document.addEventListener('keydown', onDocumentKeydown, true)
        nextTick(() => {
          const list = getFocusableElements()
          if (list.length) list[0].focus()
        })
      } else {
        contentGeneratorVisible.value = false
        teardownModalChrome()
      }
    },
    { immediate: true },
)

/** 仅在弹层打开且已启用生成器时绑定「点外部收起」；关闭或隐藏栏时移除监听 */
watch(
    () => [props.modelValue, contentGeneratorVisible.value],
    ([open, vis]) => {
      document.removeEventListener('click', handleDocumentClickForGenerator, true)
      if (open && vis) {
        document.addEventListener('click', handleDocumentClickForGenerator, true)
      }
    },
)

onBeforeUnmount(() => {
  teardownModalChrome()
})
</script>

<style src="../styles/homeDetailModal.css"></style>
<style>
html.home-work-detail-modal-scroll-lock,
body.home-work-detail-modal-scroll-lock {
  overflow: hidden !important;
}

.home-work-detail-modal-host.lv-modal-wrapper {
  position: fixed;
  inset: 0;
  z-index: 1002;
  overflow: hidden;
  pointer-events: auto;
}

.home-work-detail-modal-host .home-work-detail-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: rgba(0, 0, 0, 0.48);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .home-work-detail-modal-host .home-work-detail-backdrop {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

/* 打开 / 关闭：外层淡入，内层轻微放大 */
.home-work-detail-modal-enter-active,
.home-work-detail-modal-leave-active {
  transition: opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.home-work-detail-modal-enter-active .lv-modal,
.home-work-detail-modal-leave-active .lv-modal {
  transition: transform 0.36s cubic-bezier(0.22, 1, 0.36, 1),
  opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: center center;
}

.home-work-detail-modal-enter-from,
.home-work-detail-modal-leave-to {
  opacity: 0;
}

.home-work-detail-modal-enter-from .lv-modal,
.home-work-detail-modal-leave-to .lv-modal {
  opacity: 0;
  transform: scale(0.94);
}

.home-work-detail-modal-enter-to .lv-modal,
.home-work-detail-modal-leave-from .lv-modal {
  opacity: 1;
  transform: scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .home-work-detail-modal-enter-active,
  .home-work-detail-modal-leave-active,
  .home-work-detail-modal-enter-active .lv-modal,
  .home-work-detail-modal-leave-active .lv-modal {
    transition-duration: 0.01ms !important;
  }

  .home-work-detail-modal-enter-from .lv-modal,
  .home-work-detail-modal-leave-to .lv-modal {
    transform: none;
  }
}

.home-work-detail-modal-host .lv-modal {
  position: relative;
  z-index: 1;
  height: 100%;
  width: 100%;
  max-width: none;
}

.home-work-detail-modal-host.work-detail-modal-wrapper-3L0Dzs .lv-modal-content {
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;
}

.home-work-detail-modal-host .collapse-button-L4UIFa {
  visibility: visible !important;
}

/*
 * 宽度在列内占满可用宽度并受 max-width 约束（与 generate 页断点一致）。
 */
.home-work-detail-modal-host .home-work-detail-embedded-generator {
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 5;
  transform: translateX(-50%);
  box-sizing: border-box;
  width: min(924px, calc(100% - 32px));
  min-width: min(622px, calc(100% - 32px));
  max-width: 924px;
  pointer-events: none;
}

.home-work-detail-modal-host .home-work-detail-embedded-generator .dimension-layout-FUl4Nj {
  pointer-events: auto;
}

@media screen and (max-width: 1920px) {
  .home-work-detail-modal-host .home-work-detail-embedded-generator .default-layout-bOIxyJ:not(.collapsed-WjKggt) {
    max-width: 800px;
  }
}

@media screen and (max-width: 1280px) {
  .home-work-detail-modal-host .home-work-detail-embedded-generator .default-layout-bOIxyJ:not(.collapsed-WjKggt) {
    max-width: 700px;
  }
}

.home-work-detail-modal-host .home-work-detail-image-frame {
  position: relative;
}

.home-work-detail-modal-host .home-work-detail-img-skeleton {
  position: absolute;
  inset: 0;
  z-index: 1;
  margin: auto;
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
  pointer-events: none;
  background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.06) 25%,
      rgba(255, 255, 255, 0.12) 37%,
      rgba(255, 255, 255, 0.06) 63%
  );
  background-size: 400% 100%;
  animation: home-work-detail-shimmer 1.1s ease-in-out infinite;
}

.home-work-detail-modal-host .home-work-detail-main-img {
  position: relative;
  z-index: 2;
}

@keyframes home-work-detail-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

.work-detail-img-enter-active,
.work-detail-img-leave-active {
  transition: opacity 0.22s ease;
}

.work-detail-img-enter-from,
.work-detail-img-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .home-work-detail-modal-host .home-work-detail-img-skeleton {
    animation: none;
    opacity: 0.35;
  }

  .work-detail-img-enter-active,
  .work-detail-img-leave-active {
    transition-duration: 0.01ms !important;
  }
}

/* 左栏大图：在预览区内水平垂直居中 */
.home-work-detail-modal-host .preview-area-TnDJHN {
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.home-work-detail-modal-host .home-work-detail-preview-column {
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  justify-content: center;
  align-items: center;
}

.home-work-detail-modal-host .home-work-detail-preview-stage {
  contain: none;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: padding-bottom 0.35s cubic-bezier(0.15, 0.75, 0.3, 1);
}

/* 创作栏收起/展开时预留底部空间，大图区域随栏高度变化（叠在底部） */
.home-work-detail-modal-host .home-work-detail-preview-column:not(.home-work-detail-generator-expanded) .home-work-detail-preview-stage {
  padding-bottom: 72px;
}

.home-work-detail-modal-host .home-work-detail-preview-column.home-work-detail-generator-expanded .home-work-detail-preview-stage {
  padding-bottom: min(220px, 28vh);
}

@media (prefers-reduced-motion: reduce) {
  .home-work-detail-modal-host .home-work-detail-preview-stage {
    transition-duration: 0.01ms;
  }
}

.home-work-detail-modal-host .context-menu-trigger-container-w5xaCZ,
.home-work-detail-modal-host .image-left-content-myH1iF {
  min-height: 0;
  max-height: 100%;
}

.home-work-detail-modal-host .image-player-KCJSe1,
.home-work-detail-modal-host .image-player-container-V9ZRXE,
.home-work-detail-modal-host .image-player-content-Ml9sbe {
  min-height: 0;
  max-height: 100%;
}

.home-work-detail-modal-host .image-player-image-_Tib2c {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  max-height: 100%;
}

.home-work-detail-modal-host .image-eTuIBd {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>

<style scoped>
.home-work-detail-modal-host .lv-btn-text:not(.lv-btn-disabled) {
  background-color: initial;
  border: 1px solid transparent;
  color: var(--lvv-color-text-secondary, var(--text-secondary, rgba(224, 245, 255, 0.6)));
}

.home-work-detail-modal-host .lv-btn-text:not(.lv-btn-disabled):not(.lv-btn-loading):hover {
  background-color: var(--lvv-color-fill-transparency-hover, var(--bg-block-primary-hover));
  border-color: transparent;
  color: var(--lvv-color-text-secondary, var(--text-secondary, rgba(224, 245, 255, 0.6)));
}

.home-work-detail-modal-host .lv-btn-text:not(.lv-btn-disabled):not(.lv-btn-loading):active {
  background-color: var(--lvv-color-fill-transparency-pressed, var(--bg-block-primary-pressed));
  border-color: transparent;
  color: var(--lvv-color-text-secondary, var(--text-secondary, rgba(224, 245, 255, 0.6)));
}

.home-work-detail-modal-host .lv-btn-text:not(.lv-btn-disabled):focus-visible {
  box-shadow: 0 0 0 2px var(--lv-color-neutral-4, rgba(204, 221, 255, 0.2));
}

.home-work-detail-modal-host .home-work-detail-use-prompt-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 4px 0 !important;
  height: auto !important;
  border: none !important;
  color: var(--lvv-color-text-secondary, var(--text-secondary, rgba(224, 245, 255, 0.6)));
}

.home-work-detail-modal-host .home-work-detail-use-prompt-trigger:hover {
  color: var(--lvv-color-text-primary, rgba(224, 245, 255, 0.95));
}

.home-work-detail-modal-host .home-work-detail-use-prompt-icon {
  display: inline-flex;
  opacity: 0.85;
}
</style>
