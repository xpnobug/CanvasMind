<script setup>
import { ref } from 'vue'
import Header from '@components/canana/Header.vue'
import LeftToolbar from '@components/canana/LeftToolbar.vue'
import InfiniteCanvas from '@components/canana/InfiniteCanvas.vue'
import BottomToolbar from '@components/canana/BottomToolbar.vue'
import PromptEditor from '@components/canana/PromptEditor.vue'
import RightPanel from '@components/canana/RightPanel.vue'

const zoom = ref(10)
const projectTitle = ref('生成二次元手办多风格图片')
const rightPanelOpen = ref(false)
const selectedImage = ref(null)
const canvasRef = ref(null)
const canvasCreated = ref(false)

const handleZoomChange = (newZoom) => {
  zoom.value = Math.max(1, Math.min(200, newZoom))
}

const toggleRightPanel = () => {
  rightPanelOpen.value = !rightPanelOpen.value
}

const handleSelectionChange = (image) => {
  selectedImage.value = image
}

// 处理中间底部发送的消息
const pendingMessage = ref('')
const handlePromptSend = (message) => {
  pendingMessage.value = message
  rightPanelOpen.value = true
  // 创建画布并生成图片
  if (!canvasCreated.value) {
    canvasCreated.value = true
    // 等待画布渲染后再生成
    setTimeout(() => {
      canvasRef.value?.generateImages()
    }, 100)
  } else {
    canvasRef.value?.generateImages()
  }
}
</script>

<template>
  <div class="image-editor-container-QrfPhz">
    <div class="workbench-A4zK0t" :class="{ 'right-panel-open-JXfTGq': rightPanelOpen }" :style="{ '--right-panel-width': rightPanelOpen ? '440px' : '0px' }">
      <div class="workbench-main-content-ykueXe">
        <div class="workbench-content-m9A7DE">
          <!-- 顶部栏 -->
          <Header
              :title="projectTitle"
              @update:title="projectTitle = $event"
              @toggle-panel="toggleRightPanel"
          />

          <!-- 主内容区 -->
          <main class="main-content-G8f_tC">
            <!-- 顶部工具栏 - 选中图片时显示 -->
            <div class="toolbar-zDoGgL top-toolbar-V6aN6e" :class="{ visible: selectedImage }">
              <div class="top-toolbar-content" v-if="selectedImage">
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15v-4H7l5-7v4h4l-5 7Z" fill="currentColor"/></svg>
                  <span>局部重绘</span>
                </button>
                <button class="top-tool-btn has-dropdown">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V5h14v14Zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4v4Z" fill="currentColor"/></svg>
                  <span>超清</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="dropdown-icon"><path d="M7 10l5 5 5-5H7Z" fill="currentColor"/></svg>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" fill="currentColor"/></svg>
                  <span>抠图</span>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 3H9v2h6V3Zm-4 13h2V8h-2v8Zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0 0 12 5a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9c0-2.12-.74-4.07-1.97-5.61ZM12 21c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7Z" fill="currentColor"/></svg>
                  <span>扩图</span>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 4v1h-2V4c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v1H6V4c0-.55-.45-1-1-1s-1 .45-1 1v16c0 .55.45 1 1 1s1-.45 1-1v-1h2v1c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-1h2v1c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1s-1 .45-1 1ZM8 17H6v-2h2v2Zm0-4H6v-2h2v2Zm0-4H6V7h2v2Zm10 8h-2v-2h2v2Zm0-4h-2v-2h2v2Zm0-4h-2V7h2v2Z" fill="currentColor"/></svg>
                  <span>生成视频</span>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58ZM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6Z" fill="currentColor"/></svg>
                  <span>消除笔</span>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17v2h6v-2H3ZM3 5v2h10V5H3Zm10 16v-2h8v-2h-8v-2h-2v6h2ZM7 9v2H3v2h4v2h2V9H7Zm14 4v-2H11v2h10Zm-6-4h2V7h4V5h-4V3h-2v6Z" fill="currentColor"/></svg>
                  <span>画面微调</span>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2.5 4v3h5v12h3V7h5V4h-13Zm19 5h-9v3h3v7h3v-7h3V9Z" fill="currentColor"/></svg>
                  <span>文字重绘</span>
                </button>
              </div>
            </div>

            <!-- 画布容器 -->
            <div class="canvas-container-ciI9cJ">
              <!-- 空状态 - 复用HTML布局 -->
              <div v-if="!canvasCreated" class="empty-state-HN97p1">
                <main class=main-content-G8f_tC>
                  <div class="toolbar-zDoGgL top-toolbar-V6aN6e"></div>
                  <div class=canvas-container-ciI9cJ>
                    <div class=empty-state-HN97p1>
                      <div class=container-ptvUr6>
                        <div class=main-title-wrapper-pwESrQ><h2
                            class=main-title-PgsCa7>
                          这次创作想从哪里开始？</h2></div>
                        <div class="action-bar-Fa2xZO action-bar-resource-xR3AL2">
                          <div class=section-_nkEz9>
                            <div class="section-icon-ki8oMA attach-file-HZXGRe">
                              <img
                                  src='https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/canvas-empty-creation-dark.42e6b1d1.png'
                                  alt="creation icon" class=image-xfuWXV
                                  style="background-blend-mode:normal!important;background-clip:content-box!important;background-position:50% 50%!important;background-color:rgba(0,0,0,0)!important;background-image:var(--sf-img-4)!important;background-size:contain!important;background-origin:content-box!important;background-repeat:no-repeat!important">
                            </div>
                            <div class=section-content-XFt2i_>
                              <div class=section-title-XvPWPK>
                                使用已有素材开启创作
                              </div>
                              <div class=actions-wRpyif>
                                <div class=action-button-wrapper-njMSG3>
                                  <button class="lv-btn lv-btn-text lv-btn-size-default lv-btn-shape-square btn-KlsyFs"
                                          type=button>
                                    <svg width=16 height=16
                                         viewBox="0 0 24 24"
                                         preserveAspectRatio="xMidYMid meet"
                                         fill=none role=presentation
                                         xmlns=http://www.w3.org/2000/svg>
                                      <g>
                                        <path data-follow-fill=currentColor
                                              d="M18.437 8.128a1 1 0 1 1-1.414 1.414L13 5.52v10.316a1 1 0 1 1-2 0V5.521L6.977 9.54a1 1 0 0 1-1.414-1.413l5.73-5.728a1 1 0 0 1 1.414 0l5.73 5.728ZM3 20.002a1 1 0 0 1 1-1L20 19a1 1 0 0 1 0 2l-16 .002a1 1 0 0 1-1-1Z"
                                              clip-rule=evenodd
                                              fill-rule=evenodd
                                              fill=currentColor></path>
                                      </g>
                                    </svg>
                                    <span>本地上传</span></button>
                                </div>
                                <div class=divider-U00Vac></div>
                                <div class=action-button-wrapper-njMSG3>
                                  <button class="lv-btn lv-btn-text lv-btn-size-default lv-btn-shape-square btn-IJ7nrL"
                                          type=button>
                                    <svg width=16 height=16
                                         viewBox="0 0 24 24"
                                         preserveAspectRatio="xMidYMid meet"
                                         fill=none role=presentation
                                         xmlns=http://www.w3.org/2000/svg>
                                      <g>
                                        <path data-follow-fill=currentColor
                                              d="M19.75 14a1 1 0 0 1 1 1v1.75h1.75a1 1 0 1 1 0 2h-1.75v1.75a1 1 0 1 1-2 0v-1.75H17a1 1 0 1 1 0-2h1.75V15a1 1 0 0 1 1-1ZM8.43 2.77a3 3 0 0 1 2.164.922l1.11 1.156c.165.171.386.278.62.302l.102.005h5.737a3 3 0 0 1 3 3v3.495H4.837v5.004a2 2 0 0 0 2 2H14v2H6.837a4 4 0 0 1-4-4V5.771a3 3 0 0 1 3-3H8.43Zm-2.593 2a1 1 0 0 0-1 1v3.88h14.326V8.155a1 1 0 0 0-1-1h-5.737a3.003 3.003 0 0 1-2.164-.922l-1.11-1.155a1.002 1.002 0 0 0-.721-.307H5.837Z"
                                              fill=currentColor></path>
                                      </g>
                                    </svg>
                                    <span>选择资产</span></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="action-bar-Fa2xZO action-bar-agent-tbF7Ii">
                          <div class=section-_nkEz9>
                            <div class="section-icon-ki8oMA agent-onJGaN">
                              <img
                                  src='https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/canvas-empty-agent-chat-dark.2dd77709.png'
                                  alt="agent chat icon"
                                  class=image-xfuWXV
                                  style="background-blend-mode:normal!important;background-clip:content-box!important;background-position:50% 50%!important;background-color:rgba(0,0,0,0)!important;background-image:var(--sf-img-5)!important;background-size:contain!important;background-origin:content-box!important;background-repeat:no-repeat!important">
                            </div>
                            <div class=section-content-XFt2i_>
                              <div class=section-subtitle-RdKBy1>
                                <div>
                                  没有好创意？先和Agent聊聊，或者搜一搜站内灵感吧！
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class=arrow-icon-aUi_CP>
                          <div class=arrow-icon-inner-JiNT6K><img
                              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAADwCAMAAACjSN8cAAAAeFBMVEVHcEz////n///d9f/f9v/g9//f9f/g+P/e+P/e9f/j9f/h+P/d8//n///Z8P/f9//q///h///n9//i+f/d8//U1P/f9P/g9f/n///g9P/a9f/c9f/h+v/k+P/c9P/Z9//v///e+P/h9v/h9f/e9v/i9//s///Y8v9KXTsRAAAAKHRSTlMABQtUWUM4UydOHE4tISJIJhEhLBcGSVQWMhwzPSdJIhBOPU4+SBsorL4FxAAAAzZJREFUeAHtnWF62jAQRCV5JYxxQkUcjN2krgq0979hbeMfJSfY93XfCeZbaWZXAoTjYxiGYRiGYRgwvHcIQiUxOABRZhJAapKFXe20E6Ks7PUXtTnISuvU83KgFDVsO/UVU9TWUYp6BATVN8pGdeGwKs0Okqm7k9PPmyyQlAIshVH6IgsdRekuU5TuA8VRe09RmpyDzP2108/7mWL90FO26QWzTQeZGR2A85L7hMXPMvPdUdK0cwAOIhIdxfkj5QZt7wAEmXlFhCmlpO89qaQRs0s7ivE/KFm685TZpKZ0/IhIKJkJFDu1DsAnau0Rvo+kNpoomb8HbVIAP0SkQWxSSpJOlAnqJ8pNjkChzCUY2ydMEyVNegMlSBNFKObMHE2oCdWHCTWhIyBHWZ2ppfT6ljI9/aLMo1FEOsqZKTsAMoM511PyPmJilJJONeX+oUNdPQGGvDPFS4nSQBtKXwqQLXr9Dz8Ps1vcQPk4bKJMJBHS6AMlnCbd/dNW3la+QH4udqGsfIL0+SCQPj9RJjyKlSaKlSLFSqRsipSCdpCCXhEFBWSTFdQKqp8bpKANpaAF0pQoY1MokLFpoBQU8vKTO0OiaYJEE8ZJCeKkjuKkAnHSGylCB8rCe8jCXyCOByx8oCx8giz8BIn6UEGivohIHyDJVDO+JyiJkkyBsUGFsEEhyfRJ2aAVY4MGyga9QRIUZaQ75BU/ipEAo4gvm5EQhm8hhr9BdAIOcyPE8LlCGH7r8L8hOmtIgAKC6Qi5ZUqkAL17gE5AgCJ1AiZ6QEM6rTozQ6dcIDpPgMGOoTNXJJ0tRqd2ThSdYjpNp/0vmOlUqLPXPy8lxvzpV51X/TqPjPNRKDCd2piGJ025KL0PmZ7/rWKsZCZ5nU8INc/HdxnUP3D2pngM6f954GyQhVr7W0c+ykx/0v7W0RZLWfHlV9piSXXMx22We8TSXa3OzUtbLCWv/a2jQf3pKK11jIpjaaMsAov+af4iM4SpLsnGXbfOIBvJA75HTbgMKfKgOsahHbug+fHFZ0r8aP902av10hd2o7p4mtoUz718JTqd+Nx8DrfYPwlVTX6UOAZnGIZhGIZh/AX+gDCJlVc9FgAAAABJRU5ErkJggg=="
                              alt="arrow icon" class=image-xfuWXV></div>
                        </div>
                      </div>
                    </div>
                    <div style=width:100%;height:100%>
                      <div id=main-container
                           style=position:relative;top:0px;left:0px;width:100%;height:100%;z-index:1000;overflow:hidden;user-select:none>
                        <div data-type=l id=widget-wtfdwylb9 tabindex=0
                             style="transform-origin:left top;position:absolute;box-sizing:border-box;width:2160px;height:1318px;transform:translate(0px,0px) rotate(0deg) scale(1,1);opacity:1;z-index:0;pointer-events:auto;display:block;overflow:visible">
                          <div data-type=O id=widget-2qnduea9v
                               style="transform-origin:left top;position:absolute;box-sizing:border-box;width:100%;height:12px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:0;z-index:10000;pointer-events:auto;display:block;overflow:visible;transition:opacity 0.2s ease-in-out;left:0px;bottom:0px">
                            <div
                                style=position:absolute;top:0px;left:0px;width:100%;height:100%;background-color:rgba(0,0,0,0)>
                              <div
                                  style="position:absolute;background-color:var(--component-upload-button-hover);border-radius:2px;cursor:default;transition:background-color 0.3s cubic-bezier(0.4,0,0.2,1);top:4px;height:4px;left:0px;width:100px"></div>
                            </div>
                          </div>
                          <div data-type=O id=widget-qaaaupugq
                               style="transform-origin:left top;position:absolute;box-sizing:border-box;width:12px;height:100%;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:0;z-index:10000;pointer-events:auto;display:block;overflow:visible;transition:opacity 0.2s ease-in-out;right:0px;top:0px">
                            <div
                                style=position:absolute;top:0px;left:0px;width:100%;height:100%;background-color:rgba(0,0,0,0)>
                              <div
                                  style="position:absolute;background-color:var(--component-upload-button-hover);border-radius:2px;cursor:default;transition:background-color 0.3s cubic-bezier(0.4,0,0.2,1);left:4px;width:4px;top:0px;height:100px"></div>
                            </div>
                          </div>
                          <div data-type=R id=widget-c0b1oodmp
                               style="transform-origin:left top;position:absolute;box-sizing:border-box;width:0px;height:0px;transform:translate(0px,0px) rotate(0deg) scale(0.172,0.172);opacity:1;z-index:0;pointer-events:auto;display:block;overflow:visible">
                            <div data-type=g id=widget-9tu3t2tmx
                                 style="transform-origin:left top;position:absolute;box-sizing:border-box;width:0px;height:0px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:-1000;pointer-events:none;display:block;overflow:visible;background-color:transparent"></div>
                            <div data-type=g id=widget-utmvqtivv
                                 style="transform-origin:left top;position:absolute;box-sizing:border-box;width:0px;height:0px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:0;pointer-events:none;display:block;overflow:visible"></div>
                            <div data-type=W id=widget-zbfdk6rck
                                 style="transform-origin:left top;position:absolute;box-sizing:border-box;width:100%;height:100%;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:1000;pointer-events:none;display:block;overflow:visible;left:0px;top:0px">
                              <div data-type=A id=widget-4xgqt3eax
                                   style="transform-origin:left top;position:absolute;box-sizing:border-box;width:100%;height:100%;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:998;pointer-events:none;display:block;overflow:visible;left:0px;top:0px"></div>
                              <div data-type=R id=widget-ar89c8tlj
                                   style="transform-origin:left top;position:absolute;box-sizing:border-box;width:0px;height:0px;transform:translate(-5.81395e+06px,-5.81395e+06px) rotate(0deg) scale(1,1);opacity:1;z-index:1000;pointer-events:none;display:none;overflow:visible"></div>
                              <div data-type=b id=widget-lqci2rlek
                                   style="transform-origin:left top;position:absolute;box-sizing:border-box;width:0px;height:0px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:999;pointer-events:none;display:none;overflow:visible;border-style:solid;border-width:1px;border-color:rgb(0,202,224);background-color:rgba(0,202,224,0.12);transition:border-color 0.2s,background-color 0.2s"></div>
                              <div data-type=s id=snap-line-left
                                   style="transform-origin:left top;position:absolute;box-sizing:border-box;width:1px;height:2px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:0px;left:-0.5px;border-radius:0px;background-image:repeating-linear-gradient(rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                              <div data-type=s
                                   id=snap-line-center-vertical
                                   style="transform-origin:left top;position:absolute;box-sizing:border-box;width:1px;height:2px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:0px;left:-0.5px;border-radius:0px;background-image:repeating-linear-gradient(rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                              <div data-type=s id=snap-line-right
                                   style="transform-origin:left top;position:absolute;box-sizing:border-box;width:1px;height:2px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:0px;left:-0.5px;border-radius:0px;background-image:repeating-linear-gradient(rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                              <div data-type=s id=snap-line-top
                                   style="transform-origin:left top;position:absolute;box-sizing:border-box;width:2px;height:1px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:-0.5px;left:0px;border-radius:0px;background-image:repeating-linear-gradient(to right,rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                              <div data-type=s
                                   id=snap-line-center-horizontal
                                   style="transform-origin:left top;position:absolute;box-sizing:border-box;width:2px;height:1px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:-0.5px;left:0px;border-radius:0px;background-image:repeating-linear-gradient(to right,rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                              <div data-type=s id=snap-line-bottom
                                   style="transform-origin:left top;position:absolute;box-sizing:border-box;width:2px;height:1px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:-0.5px;left:0px;border-radius:0px;background-image:repeating-linear-gradient(to right,rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="toolbar-zDoGgL bottom-toolbar-PE8gbm"></div>
                </main>
              </div>
              <!-- 画布 -->
              <InfiniteCanvas v-else ref="canvasRef" :zoom="zoom" @zoom-change="handleZoomChange" @selection-change="handleSelectionChange" />
            </div>

            <div class="toolbar-zDoGgL bottom-toolbar-PE8gbm"></div>
          </main>
        </div>

        <!-- 左侧工具栏 -->
        <div class="left-toolbar-R3x3z9">
          <LeftToolbar />
        </div>

        <!-- 底部左侧控件 -->
        <div class="bottom-left-widget-jcEzp3">
          <BottomToolbar
              :zoom="zoom"
              @zoom-change="handleZoomChange"
          />
        </div>

        <!-- 提示词编辑器 - 右侧面板关闭时显示 -->
        <PromptEditor v-show="!rightPanelOpen" @send="handlePromptSend" />
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel-gZhdnT">
        <RightPanel
            :title="projectTitle"
            :visible="rightPanelOpen"
            :initial-message="pendingMessage"
            @close="rightPanelOpen = false"
            @message-received="pendingMessage = ''"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 导入提取的样式 */
@import './styles/index.css';
@import './styles/empty-state.css';
@import './styles/canvas.css';

</style>
