<template>
  <div class="dimension-layout-FUl4Nj default-layout-bOIxyJ home-header-content-generator-RI50Ki" 
       style="--content-generator-collapse-transition-duration:350ms;--content-generator-collapse-transition-timing-function:cubic-bezier(0.15,0.75,0.3,1)">
    <div class="layout-KSckhZ">
      <div class="content-oZ2zsI">
        <!-- 参考图片上传区 -->
        <ReferenceUpload />
        
        <!-- 主内容区 -->
        <div class="main-content-pao8ef main-content-MTw5sD">
          <!-- 引用记录文本 -->
          <div class="reference-record-text-container-UOUXv6 hidden-FI_sis">
            <div class="reference-record-text-YzRnHL">
              <div class="icon-TICgEz">
                <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path data-follow-fill="currentColor" d="M7.06 10.154c-.2 0-.392.03-.583.059.062-.209.126-.42.228-.61.102-.277.262-.517.42-.758.134-.261.368-.438.54-.661.18-.217.426-.362.621-.542.191-.189.442-.283.64-.416.209-.12.39-.251.584-.314l.484-.199a.535.535 0 0 0 .313-.624l-.19-.757a.556.556 0 0 0-.669-.406l-.618.154c-.243.045-.503.168-.792.28-.285.127-.615.213-.922.418-.309.196-.665.359-.979.62-.304.271-.671.505-.942.849-.296.321-.589.659-.816 1.043-.263.366-.441.768-.63 1.165-.17.398-.308.804-.42 1.199a10.833 10.833 0 0 0-.344 2.187c-.03.644-.013 1.18.025 1.568.013.182.038.36.056.483l.023.15.023-.005a4.038 4.038 0 1 0 3.948-4.883Zm9.871 0c-.2 0-.392.03-.583.059.062-.209.125-.42.228-.61.102-.277.262-.517.42-.758.133-.261.367-.438.54-.661.18-.217.426-.362.62-.542.192-.189.442-.283.641-.416.209-.12.39-.251.584-.314l.483-.199a.535.535 0 0 0 .314-.624l-.19-.757a.556.556 0 0 0-.67-.406l-.617.154c-.244.045-.503.168-.792.28-.284.128-.615.213-.922.419-.31.195-.665.359-.98.62-.304.27-.67.505-.942.848-.296.321-.588.659-.815 1.043-.263.366-.442.768-.63 1.165-.17.398-.308.804-.42 1.199a10.832 10.832 0 0 0-.345 2.187c-.03.644-.012 1.18.025 1.568.014.182.039.36.057.483l.022.15.024-.005a4.038 4.038 0 1 0 3.948-4.883Z" fill="currentColor"></path>
                  </g>
                </svg>
              </div>
              <span class="divider-GjrSf1"></span>
              <span class="content-lZaX5g"></span>
              <span class="divider-GjrSf1"></span>
              <div class="icon-TICgEz icon-close-_TmiMV">
                <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path data-follow-fill="currentColor" d="M19.579 6.119a1.2 1.2 0 0 0-1.697-1.698L12 10.303 6.12 4.422a1.2 1.2 0 1 0-1.697 1.697L10.303 12l-5.881 5.882a1.2 1.2 0 0 0 1.697 1.697L12 13.698l5.882 5.882a1.2 1.2 0 1 0 1.697-1.697L13.697 12l5.882-5.882Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
                  </g>
                </svg>
              </div>
            </div>
          </div>
          
          <!-- 提示词输入区 -->
          <PromptInput />
        </div>
        
        <!-- 折叠提交按钮 -->
        <SubmitButton />
      </div>
      
      <!-- 工具栏 -->
      <Toolbar />
    </div>
  </div>
</template>

<script setup>
import ReferenceUpload from './ReferenceUpload.vue'
import PromptInput from './PromptInput.vue'
import SubmitButton from './SubmitButton.vue'
import Toolbar from './Toolbar.vue'
</script>
