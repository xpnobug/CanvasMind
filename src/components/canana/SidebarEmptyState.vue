<script setup>
// 定义事件
const emit = defineEmits(['upload'])

// 触发上传
const handleUpload = () => {
  emit('upload')
}
</script>

<template>
  <div class="sidebar-empty-state-z3TqNc empty-mJrwvw">
    <div class="container-TJGGc3">
      <div class="main-title-wrapper-pHWOzE">
        <h2 class="main-title-QwAP1G">和Agent聊聊你的想法</h2>
      </div>

      <!-- 从已有素材开始 -->
      <div class="action-bar-sTOcOI action-bar-image-muVmnQ">
        <div class="section-RHLADZ">
          <div class="section-icon-nU4hZM attach-file-zDAqLM">
            <img
              src="https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/canvas-empty-creation-dark.42e6b1d1.png"
              alt="creation icon"
              class="image-UEhyr6"
            >
          </div>
          <div class="section-content-kQklE_">
            <div class="section-title-P1vkQ9">从已有素材开始</div>
            <div class="actions-vbY0pg">
              <button
                class="lv-btn lv-btn-text lv-btn-size-default lv-btn-shape-square upload-button-ujoKPL"
                type="button"
                @click="handleUpload"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path data-follow-fill="currentColor" d="M15.145 2.492a4.481 4.481 0 0 1 3.137 1.316c.805.8 1.323 1.91 1.329 3.133.006 1.237-.512 2.503-1.617 3.608l-6.24 6.24c-.611.611-1.358.884-2.101.839a2.85 2.85 0 0 1-1.826-.844 2.849 2.849 0 0 1-.842-1.824c-.046-.744.226-1.491.837-2.102L13.03 7.65a1 1 0 0 1 1.414 1.415l-5.21 5.207c-.224.225-.263.42-.254.566.01.17.097.366.261.53a.853.853 0 0 0 .533.263c.145.008.34-.031.564-.255l6.241-6.241c.773-.773 1.034-1.542 1.03-2.184a2.456 2.456 0 0 0-.739-1.725 2.482 2.482 0 0 0-1.734-.734c-.645-.002-1.412.258-2.177 1.022l-6.241 6.24c-1.163 1.164-1.571 2.38-1.54 3.458.032 1.095.52 2.136 1.303 2.916.782.78 1.826 1.266 2.925 1.298 1.079.03 2.294-.377 3.45-1.533l6.462-6.462a1 1 0 0 1 1.414 1.416l-6.462 6.46c-1.512 1.512-3.247 2.166-4.921 2.119-1.656-.047-3.172-.776-4.28-1.881-1.109-1.105-1.842-2.62-1.89-4.276-.048-1.675.608-3.411 2.125-4.928l6.241-6.242c1.1-1.099 2.364-1.612 3.599-1.607Z" fill="currentColor"></path>
                  </g>
                </svg>
                <span>上传参考图</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Agent 提示 -->
      <div class="action-bar-sTOcOI action-bar-agent-CF6O_e">
        <div class="section-RHLADZ">
          <div class="section-icon-nU4hZM agent-SXIEyw">
            <img
              src="https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/canvas-empty-agent-chat-dark.2dd77709.png"
              alt="agent chat icon"
              class="image-UEhyr6"
            >
          </div>
          <div class="section-content-kQklE_">
            <div class="section-subtitle-COEb68">
              <div>没有好创意？先和Agent聊聊，或者搜一搜站内灵感吧！</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 箭头指示 -->
      <div class="arrow-icon-WN3OtA">
        <div class="arrow-icon-inner-etO5Cz">
          <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAADwCAMAAACjSN8cAAAAeFBMVEVHcEz////n///d9f/f9v/g9//f9f/g+P/e+P/e9f/j9f/h+P/d8//n///Z8P/f9//q///h///n9//i+f/d8//U1P/f9P/g9f/n///g9P/a9f/c9f/h+v/k+P/c9P/Z9//v///e+P/h9v/h9f/e9v/i9//s///Y8v9KXTsRAAAAKHRSTlMABQtUWUM4UydOHE4tISJIJhEhLBcGSVQWMhwzPSdJIhBOPU4+SBsorL4FxAAAAzZJREFUeAHtnWF62jAQRCV5JYxxQkUcjN2krgq0979hbeMfJSfY93XfCeZbaWZXAoTjYxiGYRiGYRgwvHcIQiUxOABRZhJAapKFXe20E6Ks7PUXtTnISuvU83KgFDVsO/UVU9TWUYp6BATVN8pGdeGwKs0Okqm7k9PPmyyQlAIshVH6IgsdRekuU5TuA8VRe09RmpyDzP2108/7mWL90FO26QWzTQeZGR2A85L7hMXPMvPdUdK0cwAOIhIdxfkj5QZt7wAEmXlFhCmlpO89qaQRs0s7ivE/KFm685TZpKZ0/IhIKJkJFDu1DsAnau0Rvo+kNpoomb8HbVIAP0SkQWxSSpJOlAnqJ8pNjkChzCUY2ydMEyVNegMlSBNFKObMHE2oCdWHCTWhIyBHWZ2ppfT6ljI9/aLMo1FEOsqZKTsAMoM511PyPmJilJJONeX+oUNdPQGGvDPFS4nSQBtKXwqQLXr9Dz8Ps1vcQPk4bKJMJBHS6AMlnCbd/dNW3la+QH4udqGsfIL0+SCQPj9RJjyKlSaKlSLFSqRsipSCdpCCXhEFBWSTFdQKqp8bpKANpaAF0pQoY1MokLFpoBQU8vKTO0OiaYJEE8ZJCeKkjuKkAnHSGylCB8rCe8jCXyCOByx8oCx8giz8BIn6UEGivohIHyDJVDO+JyiJkkyBsUGFsEEhyfRJ2aAVY4MGyga9QRIUZaQ75BU/ipEAo4gvm5EQhm8hhr9BdAIOcyPE8LlCGH7r8L8hOmtIgAKC6Qi5ZUqkAL17gE5AgCJ1AiZ6QEM6rTozQ6dcIDpPgMGOoTNXJJ0tRqd2ThSdYjpNp/0vmOlUqLPXPy8lxvzpV51X/TqPjPNRKDCd2piGJ025KL0PmZ7/rWKsZCZ5nU8INc/HdxnUP3D2pngM6f954GyQhVr7W0c+ykx/0v7W0RZLWfHlV9piSXXMx22We8TSXa3OzUtbLCWv/a2jQf3pKK11jIpjaaMsAov+af4iM4SpLsnGXbfOIBvJA75HTbgMKfKgOsahHbug+fHFZ0r8aP902av10hd2o7p4mtoUz718JTqd+Nx8DrfYPwlVTX6UOAZnGIZhGIZh/AX+gDCJlVc9FgAAAABJRU5ErkJggg=="
            alt="arrow icon"
            class="image-UEhyr6"
          >
        </div>
      </div>
    </div>
  </div>
</template>
