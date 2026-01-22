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

              <!-- 主内容区 -->
              <div class="content-wrapper-cF1zaN">
                <div id="dreamina-ui-configuration-content-wrapper" class="main-container-nXfW_A">
                  <div class="content-TZbgMr">
                    <div class="scroll-container-Jsws2j scroll-container-QnV2C9">
                      <div>
                        <div class="scroll-content-DaYLnh scroll-content">
                          <div class="section-generator-q8kS_W">
                            <!-- 首页头部 -->
                            <HomeHeader/>
                          </div>
                          
                          <!-- Tabs 区域 -->
                          <TabsSection @tab-change="handleTabChange" @search="handleSearch" />

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
  </div>
</template>

<script setup>
import SideMenu from '../../components/home/components/SideMenu.vue'
import HomeHeader from '../../components/home/components/HomeHeader.vue'
import TabsSection from '@components/home/components/TabsSection.vue'

const handleTabChange = (index) => {
  console.log('Tab changed to:', index)
}

const handleSearch = (searchText) => {
  console.log('Search:', searchText)
}
</script>

<style scoped>

</style>
