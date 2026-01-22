<template>
  <div class="lv-tabs lv-tabs-horizontal lv-tabs-line lv-tabs-top lv-tabs-size-default section-tab-maWQnS">
    <!-- Tabs Header -->
    <div class="lv-tabs-header-nav lv-tabs-header-nav-horizontal lv-tabs-header-nav-top lv-tabs-header-size-default lv-tabs-header-nav-line">
      <div class="lv-tabs-header-scroll">
        <div class="lv-tabs-header-wrapper">
          <div class="lv-tabs-header" style="transform:translateX(0px)">
            <div
              v-for="(tab, index) in tabs"
              :key="index"
              :class="['lv-tabs-header-title', { 'lv-tabs-header-title-active': activeTab === index }]"
              role="tab"
              :aria-selected="activeTab === index"
              tabindex="0"
              :id="`lv-tabs-0-tab-${index}`"
              :aria-controls="`lv-tabs-0-panel-${index}`"
              @click="changeTab(index)"
            >
              <span class="lv-tabs-header-title-text">
                <div>{{ tab.label }}</div>
              </span>
            </div>
            <div class="lv-tabs-header-ink" :style="inkStyle"></div>
          </div>
        </div>
        <div class="lv-tabs-header-extra">
          <div class="container-o9SXsC">
            <div class="container-nEcHp3">
              <div class="back-btn-container-HARZxe">
                <div class="back-btn-V0aQz5">
                  <svg width="16" height="16" viewBox="0 0 24 24"
                       preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                       xmlns="http://www.w3.org/2000/svg" class="back-icon-FgnnZF">
                    <g>
                      <path data-follow-fill="currentColor"
                            d="M4.533 12.844a1.2 1.2 0 0 1 0-1.687l7.655-7.747a1.2 1.2 0 0 1 1.708 1.687l-6.822 6.904 6.822 6.903a1.2 1.2 0 1 1-1.708 1.686l-7.655-7.746Z"
                            clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
                    </g>
                  </svg>
                </div>
              </div>
              <div class="search-container-p7CpmJ">
                <div class="lv-input-group-wrapper lv-input-group-wrapper-default lv-input-search lv-input-search-button input-group-loJOoJ mini-collapse-rBuoPM">
                  <span class="lv-input-group">
                    <span class="lv-input-inner-wrapper lv-input-inner-wrapper-has-prefix lv-input-inner-wrapper-default lv-input-clear-wrapper">
                      <span class="lv-input-group-prefix">
                        <svg width="1em" height="1em" viewBox="0 0 24 24"
                             preserveAspectRatio="xMidYMid meet" fill="none"
                             role="presentation" xmlns="http://www.w3.org/2000/svg">
                          <g>
                            <path data-follow-fill="currentColor"
                                  d="M4.563 10.75a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm6.5-8.5a8.5 8.5 0 1 0 5.261 15.176l3.406 3.406a1 1 0 0 0 1.415-1.414l-3.407-3.406A8.5 8.5 0 0 0 11.062 2.25Z"
                                  clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
                          </g>
                        </svg>
                      </span>
                      <input
                        v-model="searchText"
                        maxlength="800"
                        placeholder="标题"
                        class="lv-input lv-input-size-default"
                        @input="handleSearch"
                      >
                    </span>
                    <span class="lv-input-group-addafter sf-hidden"></span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Content -->
    <div class="lv-tabs-content lv-tabs-content-horizontal">
      <div class="lv-tabs-content-inner" :style="{ marginLeft: contentMargin }">
        <div
          v-for="(tab, index) in tabs"
          :key="index"
          :class="['lv-tabs-content-item', { 'lv-tabs-content-item-active': activeTab === index }]"
          role="tabpanel"
          :tabindex="activeTab === index ? 0 : -1"
          :id="`lv-tabs-0-panel-${index}`"
          :aria-labelledby="`lv-tabs-0-tab-${index}`"
          :aria-hidden="activeTab !== index"
        >
          <div data-apm-action="tab-pane" class="lv-tabs-pane">
            <slot :name="`tab-${index}`" :tab="tab">
              <!-- 默认内容 -->
              <div v-if="index === 0">
                <DiscoverContent />
              </div>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DiscoverContent from './DiscoverContent.vue'

const props = defineProps({
  tabs: {
    type: Array,
    default: () => [
      { label: '发现' },
      { label: '短片' },
      { label: '活动' }
    ]
  }
})

const emit = defineEmits(['tab-change', 'search'])

const activeTab = ref(0)
const searchText = ref('')

const inkStyle = computed(() => {
  const width = 66
  const gap = 8
  const left = activeTab.value * (width + gap)
  return {
    left: `${left}px`,
    width: `${width}px`
  }
})

const contentMargin = computed(() => {
  return `${-activeTab.value * 100}%`
})

const changeTab = (index) => {
  activeTab.value = index
  emit('tab-change', index)
}

const handleSearch = () => {
  emit('search', searchText.value)
}
</script>

<style scoped>
/* Tabs 样式已在全局样式中定义 */
</style>
