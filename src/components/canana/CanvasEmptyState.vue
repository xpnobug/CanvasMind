<script setup lang="ts">
import { ref } from 'vue'
import { AssetSelector, type AssetItem } from '@/components/generate/common'

// 定义事件
const emit = defineEmits(['upload', 'select-asset', 'asset-selected'])

// 资产选择器弹窗状态
const showAssetSelector = ref(false)

// 模拟资产数据（实际使用时从 API 获取）
const mockAssets = ref<AssetItem[]>([])
const assetsLoading = ref(false)

// 本地上传
const handleUpload = () => {
  emit('upload')
}

// 选择资产 - 打开弹窗
const handleSelectAsset = () => {
  showAssetSelector.value = true
  emit('select-asset')
  // 模拟加载资产数据
  loadAssets()
}

// 加载资产数据
const loadAssets = async () => {
  assetsLoading.value = true
  // 模拟 API 请求
  setTimeout(() => {
    // 示例数据，实际使用时替换为 API 调用
    mockAssets.value = [
      {
        id: '1',
        url: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/003c91f7f32947c6874aaab9d79778cb~tplv-tb4s082cfz-aigc_resize_mark:640:640.jpeg?lk3s=43402efa&x-expires=1769425200&x-signature=zaZPRco%2BPmSEZK3jJDy6tg9rM%2BA%3D&format=.jpeg',
        type: 'image',
        name: '示例图片1'
      },
      {
        id: '2',
        url: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/003c91f7f32947c6874aaab9d79778cb~tplv-tb4s082cfz-aigc_resize_mark:640:640.jpeg?lk3s=43402efa&x-expires=1769425200&x-signature=zaZPRco%2BPmSEZK3jJDy6tg9rM%2BA%3D&format=.jpeg',
        type: 'image',
        name: '示例图片2'
      },
      {
        id: '3',
        url: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/003c91f7f32947c6874aaab9d79778cb~tplv-tb4s082cfz-aigc_resize_mark:640:640.jpeg?lk3s=43402efa&x-expires=1769425200&x-signature=zaZPRco%2BPmSEZK3jJDy6tg9rM%2BA%3D&format=.jpeg',
        type: 'image',
        name: '示例图片3'
      },
      {
        id: '4',
        url: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/003c91f7f32947c6874aaab9d79778cb~tplv-tb4s082cfz-aigc_resize_mark:640:640.jpeg?lk3s=43402efa&x-expires=1769425200&x-signature=zaZPRco%2BPmSEZK3jJDy6tg9rM%2BA%3D&format=.jpeg',
        type: 'image',
        name: '示例图片4'
      }
    ]
    assetsLoading.value = false
  }, 500)
}

// 确认选择资产
const handleAssetConfirm = (assets: AssetItem[]) => {
  emit('asset-selected', assets)
}

// Tab 切换
const handleTabChange = (tabKey: string) => {
  // 根据 tab 重新加载数据
  console.log('切换到 Tab:', tabKey)
  loadAssets()
}
</script>

<template>
  <div class="empty-state-HN97p1">
    <main class="main-content-G8f_tC">
      <div class="toolbar-zDoGgL top-toolbar-V6aN6e"></div>
      <div class="canvas-container-ciI9cJ">
        <div class="empty-state-HN97p1">
          <div class="container-ptvUr6">
            <div class="main-title-wrapper-pwESrQ">
              <h2 class="main-title-PgsCa7">这次创作想从哪里开始？</h2>
            </div>
            <div class="action-bar-Fa2xZO action-bar-resource-xR3AL2">
              <div class="section-_nkEz9">
                <div class="section-icon-ki8oMA attach-file-HZXGRe">
                  <img
                    src="https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/canvas-empty-creation-dark.42e6b1d1.png"
                    alt="creation icon"
                    class="image-xfuWXV"
                  >
                </div>
                <div class="section-content-XFt2i_">
                  <div class="section-title-XvPWPK">使用已有素材开启创作</div>
                  <div class="actions-wRpyif">
                    <div class="action-button-wrapper-njMSG3">
                      <button
                        class="lv-btn lv-btn-text lv-btn-size-default lv-btn-shape-square btn-KlsyFs"
                        type="button"
                        @click="handleUpload"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                          <g>
                            <path data-follow-fill="currentColor" d="M18.437 8.128a1 1 0 1 1-1.414 1.414L13 5.52v10.316a1 1 0 1 1-2 0V5.521L6.977 9.54a1 1 0 0 1-1.414-1.413l5.73-5.728a1 1 0 0 1 1.414 0l5.73 5.728ZM3 20.002a1 1 0 0 1 1-1L20 19a1 1 0 0 1 0 2l-16 .002a1 1 0 0 1-1-1Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
                          </g>
                        </svg>
                        <span>本地上传</span>
                      </button>
                    </div>
                    <div class="divider-U00Vac"></div>
                    <div class="action-button-wrapper-njMSG3">
                      <button
                        class="lv-btn lv-btn-text lv-btn-size-default lv-btn-shape-square btn-IJ7nrL"
                        type="button"
                        @click="handleSelectAsset"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                          <g>
                            <path data-follow-fill="currentColor" d="M19.75 14a1 1 0 0 1 1 1v1.75h1.75a1 1 0 1 1 0 2h-1.75v1.75a1 1 0 1 1-2 0v-1.75H17a1 1 0 1 1 0-2h1.75V15a1 1 0 0 1 1-1ZM8.43 2.77a3 3 0 0 1 2.164.922l1.11 1.156c.165.171.386.278.62.302l.102.005h5.737a3 3 0 0 1 3 3v3.495H4.837v5.004a2 2 0 0 0 2 2H14v2H6.837a4 4 0 0 1-4-4V5.771a3 3 0 0 1 3-3H8.43Zm-2.593 2a1 1 0 0 0-1 1v3.88h14.326V8.155a1 1 0 0 0-1-1h-5.737a3.003 3.003 0 0 1-2.164-.922l-1.11-1.155a1.002 1.002 0 0 0-.721-.307H5.837Z" fill="currentColor"></path>
                          </g>
                        </svg>
                        <span>选择资产</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="action-bar-Fa2xZO action-bar-agent-tbF7Ii">
              <div class="section-_nkEz9">
                <div class="section-icon-ki8oMA agent-onJGaN">
                  <img
                    src="https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/canvas-empty-agent-chat-dark.2dd77709.png"
                    alt="agent chat icon"
                    class="image-xfuWXV"
                  >
                </div>
                <div class="section-content-XFt2i_">
                  <div class="section-subtitle-RdKBy1">
                    <div>没有好创意？先和Agent聊聊，或者搜一搜站内灵感吧！</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="arrow-icon-aUi_CP">
              <div class="arrow-icon-inner-JiNT6K">
                <img
                  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAADwCAMAAACjSN8cAAAAeFBMVEVHcEz////n///d9f/f9v/g9//f9f/g+P/e+P/e9f/j9f/h+P/d8//n///Z8P/f9//q///h///n9//i+f/d8//U1P/f9P/g9f/n///g9P/a9f/c9f/h+v/k+P/c9P/Z9//v///e+P/h9v/h9f/e9v/i9//s///Y8v9KXTsRAAAAKHRSTlMABQtUWUM4UydOHE4tISJIJhEhLBcGSVQWMhwzPSdJIhBOPU4+SBsorL4FxAAAAzZJREFUeAHtnWF62jAQRCV5JYxxQkUcjN2krgq0979hbeMfJSfY93XfCeZbaWZXAoTjYxiGYRiGYRgwvHcIQiUxOABRZhJAapKFXe20E6Ks7PUXtTnISuvU83KgFDVsO/UVU9TWUYp6BATVN8pGdeGwKs0Okqm7k9PPmyyQlAIshVH6IgsdRekuU5TuA8VRe09RmpyDzP2108/7mWL90FO26QWzTQeZGR2A85L7hMXPMvPdUdK0cwAOIhIdxfkj5QZt7wAEmXlFhCmlpO89qaQRs0s7ivE/KFm685TZpKZ0/IhIKJkJFDu1DsAnau0Rvo+kNpoomb8HbVIAP0SkQWxSSpJOlAnqJ8pNjkChzCUY2ydMEyVNegMlSBNFKObMHE2oCdWHCTWhIyBHWZ2ppfT6ljI9/aLMo1FEOsqZKTsAMoM511PyPmJilJJONeX+oUNdPQGGvDPFS4nSQBtKXwqQLXr9Dz8Ps1vcQPk4bKJMJBHS6AMlnCbd/dNW3la+QH4udqGsfIL0+SCQPj9RJjyKlSaKlSLFSqRsipSCdpCCXhEFBWSTFdQKqp8bpKANpaAF0pQoY1MokLFpoBQU8vKTO0OiaYJEE8ZJCeKkjuKkAnHSGylCB8rCe8jCXyCOByx8oCx8giz8BIn6UEGivohIHyDJVDO+JyiJkkyBsUGFsEEhyfRJ2aAVY4MGyga9QRIUZaQ75BU/ipEAo4gvm5EQhm8hhr9BdAIOcyPE8LlCGH7r8L8hOmtIgAKC6Qi5ZUqkAL17gE5AgCJ1AiZ6QEM6rTozQ6dcIDpPgMGOoTNXJJ0tRqd2ThSdYjpNp/0vmOlUqLPXPy8lxvzpV51X/TqPjPNRKDCd2piGJ025KL0PmZ7/rWKsZCZ5nU8INc/HdxnUP3D2pngM6f954GyQhVr7W0c+ykx/0v7W0RZLWfHlV9piSXXMx22We8TSXa3OzUtbLCWv/a2jQf3pKK11jIpjaaMsAov+af4iM4SpLsnGXbfOIBvJA75HTbgMKfKgOsahHbug+fHFZ0r8aP902av10hd2o7p4mtoUz718JTqd+Nx8DrfYPwlVTX6UOAZnGIZhGIZh/AX+gDCJlVc9FgAAAABJRU5ErkJggg=="
                  alt="arrow icon"
                  class="image-xfuWXV"
                >
              </div>
            </div>
          </div>
        </div>
        <!-- 画布占位区域 -->
        <div style="width:100%;height:100%">
          <div id="main-container" style="position:relative;top:0px;left:0px;width:100%;height:100%;z-index:1000;overflow:hidden;user-select:none">
            <div data-type="l" id="widget-wtfdwylb9" tabindex="0" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:2160px;height:1318px;transform:translate(0px,0px) rotate(0deg) scale(1,1);opacity:1;z-index:0;pointer-events:auto;display:block;overflow:visible">
              <!-- 水平滚动条占位 -->
              <div data-type="O" id="widget-2qnduea9v" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:100%;height:12px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:0;z-index:10000;pointer-events:auto;display:block;overflow:visible;transition:opacity 0.2s ease-in-out;left:0px;bottom:0px">
                <div style="position:absolute;top:0px;left:0px;width:100%;height:100%;background-color:rgba(0,0,0,0)">
                  <div style="position:absolute;background-color:var(--component-upload-button-hover);border-radius:2px;cursor:default;transition:background-color 0.3s cubic-bezier(0.4,0,0.2,1);top:4px;height:4px;left:0px;width:100px"></div>
                </div>
              </div>
              <!-- 垂直滚动条占位 -->
              <div data-type="O" id="widget-qaaaupugq" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:12px;height:100%;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:0;z-index:10000;pointer-events:auto;display:block;overflow:visible;transition:opacity 0.2s ease-in-out;right:0px;top:0px">
                <div style="position:absolute;top:0px;left:0px;width:100%;height:100%;background-color:rgba(0,0,0,0)">
                  <div style="position:absolute;background-color:var(--component-upload-button-hover);border-radius:2px;cursor:default;transition:background-color 0.3s cubic-bezier(0.4,0,0.2,1);left:4px;width:4px;top:0px;height:100px"></div>
                </div>
              </div>
              <!-- 画布渲染区域占位 -->
              <div data-type="R" id="widget-c0b1oodmp" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:0px;height:0px;transform:translate(0px,0px) rotate(0deg) scale(0.172,0.172);opacity:1;z-index:0;pointer-events:auto;display:block;overflow:visible">
                <div data-type="g" id="widget-9tu3t2tmx" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:0px;height:0px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:-1000;pointer-events:none;display:block;overflow:visible;background-color:transparent"></div>
                <div data-type="g" id="widget-utmvqtivv" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:0px;height:0px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:0;pointer-events:none;display:block;overflow:visible"></div>
                <div data-type="W" id="widget-zbfdk6rck" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:100%;height:100%;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:1000;pointer-events:none;display:block;overflow:visible;left:0px;top:0px">
                  <div data-type="A" id="widget-4xgqt3eax" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:100%;height:100%;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:998;pointer-events:none;display:block;overflow:visible;left:0px;top:0px"></div>
                  <div data-type="R" id="widget-ar89c8tlj" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:0px;height:0px;transform:translate(-5.81395e+06px,-5.81395e+06px) rotate(0deg) scale(1,1);opacity:1;z-index:1000;pointer-events:none;display:none;overflow:visible"></div>
                  <div data-type="b" id="widget-lqci2rlek" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:0px;height:0px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:999;pointer-events:none;display:none;overflow:visible;border-style:solid;border-width:1px;border-color:rgb(0,202,224);background-color:rgba(0,202,224,0.12);transition:border-color 0.2s,background-color 0.2s"></div>
                  <!-- 对齐线 -->
                  <div data-type="s" id="snap-line-left" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:1px;height:2px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:0px;left:-0.5px;border-radius:0px;background-image:repeating-linear-gradient(rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                  <div data-type="s" id="snap-line-center-vertical" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:1px;height:2px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:0px;left:-0.5px;border-radius:0px;background-image:repeating-linear-gradient(rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                  <div data-type="s" id="snap-line-right" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:1px;height:2px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:0px;left:-0.5px;border-radius:0px;background-image:repeating-linear-gradient(rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                  <div data-type="s" id="snap-line-top" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:2px;height:1px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:-0.5px;left:0px;border-radius:0px;background-image:repeating-linear-gradient(to right,rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                  <div data-type="s" id="snap-line-center-horizontal" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:2px;height:1px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:-0.5px;left:0px;border-radius:0px;background-image:repeating-linear-gradient(to right,rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                  <div data-type="s" id="snap-line-bottom" style="transform-origin:left top;position:absolute;box-sizing:border-box;width:2px;height:1px;transform:rotate(0deg) translate(0px,0px) scale(1,1);opacity:1;z-index:100;pointer-events:none;display:none;overflow:visible;top:-0.5px;left:0px;border-radius:0px;background-image:repeating-linear-gradient(to right,rgb(0,202,224) 0px,rgb(0,202,224) 2px,transparent 2px,transparent 4px);background-color:transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="toolbar-zDoGgL bottom-toolbar-PE8gbm"></div>
    </main>

    <!-- 资产选择器弹窗 -->
    <AssetSelector
      v-model:visible="showAssetSelector"
      asset-type="image"
      :assets="mockAssets"
      :loading="assetsLoading"
      title="选择资产"
      @confirm="handleAssetConfirm"
      @tab-change="handleTabChange"
    />
  </div>
</template>
