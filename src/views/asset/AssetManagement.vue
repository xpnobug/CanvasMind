<template>
  <div class="jimeng-home-container">
    <div id="csr-root">
      <div class="global-dreamina-container">
        <div id="dreamina" class="root_bf55f">
          <div class="top-down-layer-ilr3Ve">
            <div class="container-moSF_y" style="--side-menu-width:76px">
              <!-- 侧边菜单 -->
              <SideMenu />
              
              <!-- 主内容区 -->
              <div class="content-wrapper-cF1zaN">
                <div class="main-container-nXfW_A">
                  <div class="content-TZbgMr">
                    <div class="scroll-container-Jsws2j">
                      <div class="scroll-content-DaYLnh">
                        <!-- 资产管理容器 -->
                        <div class="entryContainer-fe9" style>
                          <div class="header-2ov">
                            <div class="container-c5d">
                              <div class="tabs-y6n">
                                <div 
                                  v-for="tab in tabs" 
                                  :key="tab.id"
                                  class="tabItem-mls" 
                                  :class="{ 'active-2nk': activeTab === tab.id }" 
                                  @click="switchTab(tab.id)"
                                >
                                  {{ tab.label }}
                                </div>
                              </div>
                            </div>
                          </div>
                          <!-- Image Tab Content -->
                          <div class="content-1rx" :class="{ 'hidden-w3p': activeTab !== 'image' }">
                            <div class="tab-entry-mxq">
                              <div class="image-yhz">
                                <div class="history-vxc">
                                  <div class="header-2ov">
                                    <div class="container-c5d">
                                      <div class="operatePanel-rz9">
                                        <div class="categoryContainer-g3l">
                                          <span 
                                            v-for="option in imageFilterOptions" 
                                            :key="option.value"
                                            :class="{ [option.activeClass]: imageFilter === option.value }" 
                                            @click="setImageFilter(option.value)"
                                          >
                                            {{ option.label }}
                                          </span>
                                        </div>
                                        <!-- 批量操作栏 -->
                                        <div v-if="isBatchMode" class="operationWrap-oqo">
                                          <div class="select-zkx text-5vo">已选择 {{ selectedCount }} 项内容</div>
                                          <div class="style-ctWQJ"></div>
                                          <!-- 删除按钮 -->
                                          <button class="btn-7n1 btn-secondary-y4e btn-rec btn-3qb" type="button" :disabled="selectedCount === 0" @click="handleBatchDelete">
                                            <div class="button-flt">
                                              <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="actionIcon-hCHJjW">
                                                <g>
                                                  <path data-follow-fill="currentColor" d="M10.5 2.277a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2h-3ZM3.572 5.27a1 1 0 1 0 0 2H4.86v10a4 4 0 0 0 4 4h6.336a4 4 0 0 0 4-4v-10h1.231a1 1 0 1 0 0-2H3.571Zm3.289 12v-10h10.336v10a2 2 0 0 1-2 2H8.86a2 2 0 0 1-2-2Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                </g>
                                              </svg>
                                              <span class="text-5vo">删除</span>
                                            </div>
                                          </button>
                                          <!-- 下载按钮 -->
                                          <button class="btn-7n1 btn-secondary-y4e btn-rec btn-3qb" type="button" :disabled="selectedCount === 0" @click="handleBatchDownload">
                                            <div class="button-flt">
                                              <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="actionIcon-hCHJjW">
                                                <g>
                                                  <path data-follow-fill="currentColor" d="M12 2a1 1 0 0 1 1 1v10.312l4.023-4.021a1 1 0 0 1 1.414 1.414l-5.73 5.728a1 1 0 0 1-1.414 0l-5.73-5.728A1 1 0 1 1 6.977 9.29L11 13.312V3a1 1 0 0 1 1-1ZM3 20.002a1 1 0 0 1 1-1L20 19a1 1 0 0 1 0 2l-16 .002a1 1 0 0 1-1-1Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                </g>
                                              </svg>
                                              <span class="text-5vo">下载</span>
                                            </div>
                                          </button>
                                          <!-- 发布按钮 -->
                                          <button class="btn-7n1 btn-secondary-y4e btn-rec btn-3qb" type="button" :disabled="selectedCount === 0" @click="handleBatchPublish">
                                            <div class="button-flt">
                                              <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="actionIcon-hCHJjW">
                                                <g>
                                                  <path data-follow-fill="currentColor" d="M17.523 8.332a1 1 0 0 1-1.415 0L13 5.223v9.357a1 1 0 1 1-2 0V5.223L7.892 8.332a1 1 0 1 1-1.415-1.415l4.816-4.815a1 1 0 0 1 1.414 0l4.816 4.816a1 1 0 0 1 0 1.414ZM4.439 14.58a1 1 0 1 0-2 0v2.35a4 4 0 0 0 4 4h11.122a4 4 0 0 0 4-4v-2.35a1 1 0 0 0-2 0v2.35a2 2 0 0 1-2 2H6.439a2 2 0 0 1-2-2v-2.35Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                </g>
                                              </svg>
                                              <span class="text-5vo">发布</span>
                                            </div>
                                          </button>
                                          <!-- 收藏按钮 -->
                                          <button class="btn-7n1 btn-secondary-y4e btn-rec btn-3qb" type="button" :disabled="selectedCount === 0" @click="handleBatchFavorite">
                                            <div class="button-flt">
                                              <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="actionIcon-hCHJjW">
                                                <g>
                                                  <path data-follow-fill="currentColor" d="M9.893 7.177 12 3.787l2.107 3.39a3 3 0 0 0 1.829 1.329l3.874.956-2.572 3.052a3 3 0 0 0-.698 2.15l.287 3.98-3.697-1.503a3 3 0 0 0-2.26 0l-3.697 1.503.287-3.98a3 3 0 0 0-.698-2.15L4.19 9.462l3.874-.956a3 3 0 0 0 1.829-1.329Zm1.258-5.811a1 1 0 0 1 1.698 0l2.957 4.755a1 1 0 0 0 .61.443l5.435 1.342a1 1 0 0 1 .525 1.616l-3.609 4.28a1 1 0 0 0-.232.717l.403 5.585a1 1 0 0 1-1.374.998l-5.187-2.109a1 1 0 0 0-.754 0l-5.187 2.11a1 1 0 0 1-1.374-.999l.404-5.585a1 1 0 0 0-.233-.716l-3.61-4.281a1 1 0 0 1 .526-1.616l5.436-1.342a1 1 0 0 0 .61-.443l2.956-4.755Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                </g>
                                              </svg>
                                              <span class="text-5vo">收藏</span>
                                            </div>
                                          </button>
                                          <!-- 去剪映编辑按钮 -->
                                          <button class="btn-7n1 btn-secondary-y4e btn-rec btn-3qb" type="button" :disabled="selectedCount === 0" @click="handleEditInCapCut">
                                            <div class="btn-bm4">
                                              <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="capcut-icon-rb64XH">
                                                <g>
                                                  <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M22.002 7.646V4.61l-3.749 1.917v-.115c0-1.21-.892-1.94-2.181-1.94H4.183c-1.36 0-2.181.73-2.181 1.94v3.066l5.252 2.642-5.252 2.67v3.059c0 1.186.825 1.917 2.181 1.917H16.07c1.29 0 2.182-.73 2.182-1.917v-.16L22 19.63v-3.081l-8.72-4.429 8.722-4.474Zm-11.747 5.98 6.448 3.287H3.784l6.47-3.286Zm6.4-6.3-6.4 3.265-6.47-3.265h12.87Z" fill="currentColor" />
                                                </g>
                                              </svg>去剪映编辑
                                            </div>
                                          </button>
                                          <div class="divider-4o4"></div>
                                          <!-- 取消选择按钮 -->
                                          <div class="select-rfs" @click="exitBatchMode">
                                            <svg width="14" height="14" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                              <g>
                                                <path data-follow-fill="currentColor" d="M19.579 6.119a1.2 1.2 0 0 0-1.697-1.698L12 10.303 6.12 4.422a1.2 1.2 0 1 0-1.697 1.697L10.303 12l-5.881 5.882a1.2 1.2 0 0 0 1.697 1.697L12 13.698l5.882 5.882a1.2 1.2 0 1 0 1.697-1.697L13.697 12l5.882-5.882Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                              </g>
                                            </svg>取消选择
                                          </div>
                                        </div>
                                        <!-- 普通操作栏 -->
                                        <div v-else class="operationWrap-431">
                                          <div class="operateArea-aqq">
                                            <div class="search-7ey">
                                              <div class="container-cpr mini-bsk search-krp">
                                                <div class="container-dbs">
                                                  <div class="btn-v6i">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="back-icon-FgnnZF">
                                                      <g>
                                                        <path data-follow-fill="currentColor" d="M4.533 12.844a1.2 1.2 0 0 1 0-1.687l7.655-7.747a1.2 1.2 0 0 1 1.708 1.687l-6.822 6.904 6.822 6.903a1.2 1.2 0 1 1-1.708 1.686l-7.655-7.746Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                      </g>
                                                    </svg>
                                                  </div>
                                                </div>
                                                <div class="container-7bd">
                                                  <div class="wrapper-kw3 search-fzo button-kin input-gji disabled-bod mini-irl col-zom">
                                                    <span class="input-ffs">
                                                      <span class="wrapper-8e3 wrapper-vc5 wrapper-9ij">
                                                        <span class="input-idr">
                                                          <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                            <g>
                                                              <path data-follow-fill="currentColor" d="M4.563 10.75a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm6.5-8.5a8.5 8.5 0 1 0 5.261 15.176l3.406 3.406a1 1 0 0 0 1.415-1.414l-3.407-3.406A8.5 8.5 0 0 0 11.062 2.25Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                            </g>
                                                          </svg>
                                                        </span>
                                                        <input placeholder="搜索" class="input-z1m" value>
                                                      </span>
                                                      <span class="input-xd8">
                                                        <button class="btn-4ac btn-primary-exr btn-j99 btn-a2l loading-9av search-wvd" type="button">
                                                          <div class="container-29w disabled-mib">
                                                            <span class="search-as4">搜索</span>
                                                          </div>
                                                        </button>
                                                      </span>
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            <div class="divider-hb7"></div>
                                            <div class="btn-g4h" @click="enterBatchMode">批量操作</div>
                                            <div class="divider-hb7"></div>
                                            <div class="edit-in-capcut-54s">
                                              <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="capcut-icon-rb64XH">
                                                <g>
                                                  <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M22.002 7.646V4.61l-3.749 1.917v-.115c0-1.21-.892-1.94-2.181-1.94H4.183c-1.36 0-2.181.73-2.181 1.94v3.066l5.252 2.642-5.252 2.67v3.059c0 1.186.825 1.917 2.181 1.917H16.07c1.29 0 2.182-.73 2.182-1.917v-.16L22 19.63v-3.081l-8.72-4.429 8.722-4.474Zm-11.747 5.98 6.448 3.287H3.784l6.47-3.286Zm6.4-6.3-6.4 3.265-6.47-3.265h12.87Z" fill="currentColor" />
                                                </g>
                                              </svg>去剪映编辑
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div class="image-s9z">
                                    <div class="vList-q9n style-FG29L" id="style-FG29L">
                                      <div id="style-MK2n3" class="style-MK2n3">
                                        <div id="style-TK4rG" class="style-TK4rG">
                                          <template v-for="group in imageGroups" :key="group.date">
                                            <div>
                                              <div class="container-c5d">
                                                <div class="time-gcp" :class="{ 'first-fo4': group.isFirst }">{{ group.date }}</div>
                                              </div>
                                            </div>
                                            <div class="row-zep">
                                              <div class="container-c5d">
                                                <div class="image-qvw">
                                                  <div 
                                                    v-for="image in group.images" 
                                                    :key="image.id"
                                                    class="image-bqm"
                                                    :class="{ 'select-1kz': isBatchMode && isSelected(image.id) }"
                                                    @click="handleAssetClick(image.id)"
                                                  >
                                                    <div>
                                                      <div class="container-pm3">
                                                        <img class="image-w9g" :src="image.src" :alt="image.id">
                                                      </div>
                                                    </div>
                                                    <!-- 选择指示器 -->
                                                    <div v-if="isBatchMode" class="select-av5">
                                                      <svg v-if="isSelected(image.id)" width="12" height="12" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                        <g>
                                                          <path data-follow-fill="currentColor" d="M18.28 7.502a1.25 1.25 0 0 1 0 1.768l-7.2 7.2a1.25 1.25 0 0 1-1.767 0l-3.6-3.6a1.25 1.25 0 1 1 1.767-1.768l2.716 2.717 6.317-6.317a1.25 1.25 0 0 1 1.767 0Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                        </g>
                                                      </svg>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </template>
                                          <div class="load-more-detector-c4r"></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <!-- Video Tab Content -->
                          <div class="content-1rx" :class="{ 'hidden-w3p': activeTab !== 'video' }">
                            <div class="tab-entry-mxq">
                              <div class="video-c49">
                                <div class="header-2ov">
                                  <div class="container-c5d">
                                    <div class="header-2wr">
                                      <div class="filter-wxj">
                                        <div 
                                          v-for="option in videoFilterOptions" 
                                          :key="option.value"
                                          class="filter-qxo" 
                                          :class="{ [option.activeClass]: videoFilter === option.value }" 
                                          @click="setVideoFilter(option.value)"
                                        >
                                          {{ option.label }}
                                        </div>
                                      </div>
                                      <div class="select-ald">
                                        <div class="select-cff"></div>
                                        <div class="operateArea-aqq">
                                          <div class="search-7ey">
                                            <div class="container-cpr mini-bsk search-krp">
                                              <div class="container-dbs">
                                                <div class="btn-v6i">
                                                  <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="back-icon-FgnnZF">
                                                    <g>
                                                      <path data-follow-fill="currentColor" d="M4.533 12.844a1.2 1.2 0 0 1 0-1.687l7.655-7.747a1.2 1.2 0 0 1 1.708 1.687l-6.822 6.904 6.822 6.903a1.2 1.2 0 1 1-1.708 1.686l-7.655-7.746Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                    </g>
                                                  </svg>
                                                </div>
                                              </div>
                                              <div class="container-7bd">
                                                <div class="wrapper-kw3 search-fzo button-kin input-gji disabled-bod mini-irl col-zom">
                                                  <span class="input-ffs">
                                                    <span class="wrapper-8e3 wrapper-vc5 wrapper-9ij">
                                                      <span class="input-idr">
                                                        <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                          <g>
                                                            <path data-follow-fill="currentColor" d="M4.563 10.75a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm6.5-8.5a8.5 8.5 0 1 0 5.261 15.176l3.406 3.406a1 1 0 0 0 1.415-1.414l-3.407-3.406A8.5 8.5 0 0 0 11.062 2.25Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                          </g>
                                                        </svg>
                                                      </span>
                                                      <input placeholder="搜索" class="input-z1m" value>
                                                    </span>
                                                    <span class="input-xd8">
                                                      <button class="btn-4ac btn-primary-exr btn-j99 btn-a2l loading-9av search-wvd" type="button">
                                                        <div class="container-29w disabled-mib">
                                                          <span class="search-as4">搜索</span>
                                                        </div>
                                                      </button>
                                                    </span>
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <div class="divider-hb7"></div>
                                          <div class="btn-g4h" @click="enterBatchMode">批量操作</div>
                                          <div class="divider-hb7"></div>
                                          <div class="edit-in-capcut-54s">
                                            <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="capcut-icon-rb64XH">
                                              <g>
                                                <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M22.002 7.646V4.61l-3.749 1.917v-.115c0-1.21-.892-1.94-2.181-1.94H4.183c-1.36 0-2.181.73-2.181 1.94v3.066l5.252 2.642-5.252 2.67v3.059c0 1.186.825 1.917 2.181 1.917H16.07c1.29 0 2.182-.73 2.182-1.917v-.16L22 19.63v-3.081l-8.72-4.429 8.722-4.474Zm-11.747 5.98 6.448 3.287H3.784l6.47-3.286Zm6.4-6.3-6.4 3.265-6.47-3.265h12.87Z" fill="currentColor" />
                                              </g>
                                            </svg>去剪映编辑
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div class="video-cv8">
                                  <div class="empty-page-ij3">
                                    <img src="https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/empty-image-dark.6e788cae.png" class="image-eyv">
                                    <div class="description-96w">暂无相关资产</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <!-- Canvas Tab Content -->
                          <div class="content-1rx" :class="{ 'hidden-w3p': activeTab !== 'canvas' }">
                            <div class="tab-entry-mxq">
                              <div class="canvasEntryContainer-dp8">
                                <div class="header-2ov">
                                  <div class="container-c5d">
                                    <div class="header-2wr">
                                      <div class="filter-wxj">
                                        <div 
                                          v-for="option in canvasFilterOptions" 
                                          :key="option.value"
                                          class="filter-qxo" 
                                          :class="{ [option.activeClass]: canvasFilter === option.value }" 
                                          @click="setCanvasFilter(option.value)"
                                        >
                                          {{ option.label }}
                                        </div>
                                      </div>
                                      <div class="select-ald">
                                        <div class="operateArea-aqq">
                                          <div class="search-7ey">
                                            <div class="container-cpr mini-bsk search-krp">
                                              <div class="container-dbs">
                                                <div class="btn-v6i">
                                                  <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="back-icon-FgnnZF">
                                                    <g>
                                                      <path data-follow-fill="currentColor" d="M4.533 12.844a1.2 1.2 0 0 1 0-1.687l7.655-7.747a1.2 1.2 0 0 1 1.708 1.687l-6.822 6.904 6.822 6.903a1.2 1.2 0 1 1-1.708 1.686l-7.655-7.746Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                    </g>
                                                  </svg>
                                                </div>
                                              </div>
                                              <div class="container-7bd">
                                                <div class="wrapper-kw3 search-fzo button-kin input-gji disabled-bod mini-irl col-zom">
                                                  <span class="input-ffs">
                                                    <span class="wrapper-8e3 wrapper-vc5 wrapper-9ij">
                                                      <span class="input-idr">
                                                        <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                          <g>
                                                            <path data-follow-fill="currentColor" d="M4.563 10.75a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm6.5-8.5a8.5 8.5 0 1 0 5.261 15.176l3.406 3.406a1 1 0 0 0 1.415-1.414l-3.407-3.406A8.5 8.5 0 0 0 11.062 2.25Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                          </g>
                                                        </svg>
                                                      </span>
                                                      <input placeholder="搜索" class="input-z1m" value>
                                                    </span>
                                                    <span class="input-xd8">
                                                      <button class="btn-4ac btn-primary-exr btn-j99 btn-a2l loading-9av search-wvd" type="button">
                                                        <div class="container-29w disabled-mib">
                                                          <span class="search-as4">搜索</span>
                                                        </div>
                                                      </button>
                                                    </span>
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <div class="divider-hb7"></div>
                                          <div class="btn-g4h" @click="enterBatchMode">批量操作</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div class="canvasWrapper-ysg">
                                  <div class="container-c5d">
                                    <div class="canvasList-oos">
                                      <div class="canvasCard-yoo">
                                        <div class="emptyItem-jk6">
                                          <svg width="32" height="32" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                            <g>
                                              <path data-follow-fill="currentColor" d="M10.8 20a1.2 1.2 0 0 0 2.4 0v-6.8H20a1.2 1.2 0 1 0 0-2.4h-6.8V4a1.2 1.2 0 0 0-2.4 0v6.8H4a1.2 1.2 0 0 0 0 2.4h6.8V20Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                            </g>
                                          </svg>
                                        </div>
                                        <span class="canvasTitle-j2c style-Z9bSC" id="style-Z9bSC">新建项目</span>
                                        <div class="updateTime-dyo"></div>
                                      </div>
                                      <div class="canvasCard-yoo cavasNewCard-xsi">
                                        <div class="image-d9m">
                                          <div class="image-grw"><img src="https://p3-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/42b6674b5ee448c7a0a0381f024d0886~tplv-tb4s082cfz-resize:360:360.webp?lk3s=ad9f132c&x-expires=1800684352&x-signature=hdKXYk6L1fBOeSNVVjzcwnCjGC4%3D"></div>
                                          <div class="fa-9r8 hideFavorite-znw">
                                            <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                              <g>
                                                <path data-follow-fill="currentColor" d="M9.893 7.177 12 3.787l2.107 3.39a3 3 0 0 0 1.829 1.329l3.874.956-2.572 3.052a3 3 0 0 0-.698 2.15l.287 3.98-3.697-1.503a3 3 0 0 0-2.26 0l-3.697 1.503.287-3.98a3 3 0 0 0-.698-2.15L4.19 9.462l3.874-.956a3 3 0 0 0 1.829-1.329Zm1.258-5.811a1 1 0 0 1 1.698 0l2.957 4.755a1 1 0 0 0 .61.443l5.435 1.342a1 1 0 0 1 .525 1.616l-3.609 4.28a1 1 0 0 0-.232.717l.403 5.585a1 1 0 0 1-1.374.998l-5.187-2.109a1 1 0 0 0-.754 0l-5.187 2.11a1 1 0 0 1-1.374-.999l.404-5.585a1 1 0 0 0-.233-.716l-3.61-4.281a1 1 0 0 1 .526-1.616l5.436-1.342a1 1 0 0 0 .61-.443l2.956-4.755Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                              </g>
                                            </svg>
                                          </div>
                                          <div class="tooltip-3ot"></div>
                                          <div class="canvasSize-zl2">
                                            <span>1920</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 12 12">
                                              <g>
                                                <path d="M9.24 9.823a.25.25 0 0 1-.353 0l-6.71-6.71a.25.25 0 0 1 0-.353l.583-.583a.25.25 0 0 1 .353 0l6.71 6.71a.25.25 0 0 1 0 .353z" />
                                                <path d="M2.76 9.823a.25.25 0 0 0 .353 0l6.71-6.71a.25.25 0 0 0 0-.353l-.583-.583a.25.25 0 0 0-.353 0l-6.71 6.71a.25.25 0 0 0 0 .353z" />
                                              </g>
                                              <defs>
                                                <clipPath>
                                                  <path fill="#fff" d="M0 0h12v12H0z" />
                                                </clipPath>
                                                <filter width="11.793" height="11.793">
                                                  <feFlood />
                                                  <feColorMatrix />
                                                  <feOffset />
                                                  <feGaussianBlur />
                                                  <feComposite />
                                                  <feColorMatrix />
                                                  <feBlend />
                                                  <feBlend />
                                                </filter>
                                              </defs>
                                            </svg>
                                            <span>1080</span>
                                            <span id="style-QFwdW" class="style-QFwdW">px</span>
                                          </div>
                                          <div class="canvasShadow-akt"></div>
                                        </div>
                                        <span class="canvasTitle-j2c style-ZwMOO" id="style-ZwMOO">未命名</span>
                                        <div class="updateTime-dyo">21小时前修改</div>
                                        <div class="canvasControls-rkg style-7gdA4" id="style-7gdA4">
                                          <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="iconMore-cHtSH7" style="color: var(--text-secondary);">
                                            <g>
                                              <path data-follow-fill="currentColor" d="M7 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm7 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                            </g>
                                          </svg>
                                        </div>
                                      </div>
                                      <div class="canvasCard-yoo cavasNewCard-xsi">
                                        <div class="image-d9m">
                                          <div class="loading-rw9 style-n77HF" id="style-n77HF"></div>
                                        </div>
                                        <span class="canvasTitle-j2c style-bxOi2" id="style-bxOi2">未命名项目</span>
                                        <div class="updateTime-dyo">21小时前修改</div>
                                        <div class="canvasControls-rkg style-S5EMJ" id="style-S5EMJ">
                                          <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="iconMore-cHtSH7" style="color: var(--text-secondary);">
                                            <g>
                                              <path data-follow-fill="currentColor" d="M7 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm7 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                            </g>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div class="load-more-detector-c4r"></div>
                              </div>
                            </div>
                          </div>
                          <!-- Editor Tab Content -->
                          <div class="content-1rx" :class="{ 'hidden-w3p': activeTab !== 'editor' }">
                            <div class="tab-entry-mxq">
                              <div class="canvasEntryContainer-dp8">
                                <div class="header-2ov">
                                  <div class="container-c5d">
                                    <div class="header-2wr">
                                      <div class="filter-wxj">
                                        <div 
                                          v-for="option in editorFilterOptions" 
                                          :key="option.value"
                                          class="filter-qxo" 
                                          :class="{ [option.activeClass]: editorFilter === option.value }" 
                                          @click="setEditorFilter(option.value)"
                                        >
                                          {{ option.label }}
                                        </div>
                                      </div>
                                      <div class="select-ald">
                                        <div class="operateArea-aqq">
                                          <div class="search-7ey">
                                            <div class="container-cpr mini-bsk search-krp">
                                              <div class="container-dbs">
                                                <div class="btn-v6i">
                                                  <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="back-icon-FgnnZF">
                                                    <g>
                                                      <path data-follow-fill="currentColor" d="M4.533 12.844a1.2 1.2 0 0 1 0-1.687l7.655-7.747a1.2 1.2 0 0 1 1.708 1.687l-6.822 6.904 6.822 6.903a1.2 1.2 0 1 1-1.708 1.686l-7.655-7.746Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                    </g>
                                                  </svg>
                                                </div>
                                              </div>
                                              <div class="container-7bd">
                                                <div class="wrapper-kw3 search-fzo button-kin input-gji disabled-bod mini-irl col-zom">
                                                  <span class="input-ffs">
                                                    <span class="wrapper-8e3 wrapper-vc5 wrapper-9ij">
                                                      <span class="input-idr">
                                                        <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                          <g>
                                                            <path data-follow-fill="currentColor" d="M4.563 10.75a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm6.5-8.5a8.5 8.5 0 1 0 5.261 15.176l3.406 3.406a1 1 0 0 0 1.415-1.414l-3.407-3.406A8.5 8.5 0 0 0 11.062 2.25Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                          </g>
                                                        </svg>
                                                      </span>
                                                      <input placeholder="搜索" class="input-z1m" value>
                                                    </span>
                                                    <span class="input-xd8">
                                                      <button class="btn-4ac btn-primary-exr btn-j99 btn-a2l loading-9av search-wvd" type="button">
                                                        <div class="container-29w disabled-mib">
                                                          <span class="search-as4">搜索</span>
                                                        </div>
                                                      </button>
                                                    </span>
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <div class="divider-hb7"></div>
                                          <div class="btn-g4h" @click="enterBatchMode">批量操作</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div class="canvasWrapper-ysg">
                                  <div class="container-c5d">
                                    <div class="canvasList-oos">
                                      <div class="canvasCard-yoo cavasNewCard-xsi">
                                        <div class="image-d9m">
                                          <div class="canvasFail-zxx">
                                            <svg width="24" height="24" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                              <g>
                                                <path data-follow-fill="currentColor" d="M16.947 3a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-1.51a1 1 0 0 0-.768.36l-1.133 1.359a2 2 0 0 1-3.072 0L9.03 20H7.053a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h9.894ZM7.053 5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3H9.03a2 2 0 0 1 1.537.72L12 20.438l1.132-1.359A3 3 0 0 1 15.437 18h1.51a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H7.053Zm5.029 9.14c.307 0 .563.106.77.318.207.213.31.476.311.79 0 .312-.101.574-.31.786-.208.213-.464.32-.771.32a1.02 1.02 0 0 1-.77-.319 1.09 1.09 0 0 1-.312-.788 1.092 1.092 0 0 1 .664-1.03c.133-.054.275-.08.418-.076Zm0-6.64c.306.001.562.108.77.32.208.212.311.474.311.787v3.32c0 .313-.101.576-.31.788a1.037 1.037 0 0 1-.771.318 1.025 1.025 0 0 1-.77-.317 1.072 1.072 0 0 1-.312-.79V8.608c0-.311.104-.574.312-.788.208-.213.464-.319.77-.319Z" fill="currentColor" />
                                              </g>
                                            </svg>无法预览画布内容
                                          </div>
                                        </div>
                                        <span class="canvasTitle-j2c style-UeXf7" id="style-UeXf7">未命名项目</span>
                                        <div class="updateTime-dyo">2025年6月7日修改</div>
                                        <div class="canvasControls-rkg style-GbagA" id="style-GbagA">
                                          <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="iconMore-cHtSH7" style="color: var(--text-secondary);">
                                            <g>
                                              <path data-follow-fill="currentColor" d="M7 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm7 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                            </g>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div class="load-more-detector-c4r"></div>
                              </div>
                            </div>
                          </div>
                          <!-- Story Tab Content -->
                          <div class="content-1rx" :class="{ 'hidden-w3p': activeTab !== 'story' }">
                            <div class="tab-entry-mxq">
                              <div class="storyEntryContainer-9vj">
                                <div class="header-2ov">
                                  <div class="container-c5d">
                                    <div class="header-2wr">
                                      <div class="filter-wxj">
                                        <div 
                                          v-for="option in storyFilterOptions" 
                                          :key="option.value"
                                          class="filter-qxo" 
                                          :class="{ [option.activeClass]: storyFilter === option.value }" 
                                          @click="setStoryFilter(option.value)"
                                        >
                                          {{ option.label }}
                                        </div>
                                      </div>
                                      <div class="select-ald">
                                        <div class="operateArea-aqq">
                                          <div class="search-7ey">
                                            <div class="container-cpr mini-bsk search-krp">
                                              <div class="container-dbs">
                                                <div class="btn-v6i">
                                                  <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="back-icon-FgnnZF">
                                                    <g>
                                                      <path data-follow-fill="currentColor" d="M4.533 12.844a1.2 1.2 0 0 1 0-1.687l7.655-7.747a1.2 1.2 0 0 1 1.708 1.687l-6.822 6.904 6.822 6.903a1.2 1.2 0 1 1-1.708 1.686l-7.655-7.746Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                    </g>
                                                  </svg>
                                                </div>
                                              </div>
                                              <div class="container-7bd">
                                                <div class="wrapper-kw3 search-fzo button-kin input-gji disabled-bod mini-irl col-zom">
                                                  <span class="input-ffs">
                                                    <span class="wrapper-8e3 wrapper-vc5 wrapper-9ij">
                                                      <span class="input-idr">
                                                        <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                          <g>
                                                            <path data-follow-fill="currentColor" d="M4.563 10.75a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm6.5-8.5a8.5 8.5 0 1 0 5.261 15.176l3.406 3.406a1 1 0 0 0 1.415-1.414l-3.407-3.406A8.5 8.5 0 0 0 11.062 2.25Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                          </g>
                                                        </svg>
                                                      </span>
                                                      <input placeholder="搜索" class="input-z1m" value>
                                                    </span>
                                                    <span class="input-xd8">
                                                      <button class="btn-4ac btn-primary-exr btn-j99 btn-a2l loading-9av search-wvd" type="button">
                                                        <div class="container-29w disabled-mib">
                                                          <span class="search-as4">搜索</span>
                                                        </div>
                                                      </button>
                                                    </span>
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <div class="divider-hb7"></div>
                                          <div class="btn-g4h" @click="enterBatchMode">批量操作</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div class="storyWrapper-shp">
                                  <div class="container-c5d style-phEgc" id="style-phEgc">
                                    <div class="empty-page-ij3">
                                      <img src="https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/empty-image-dark.6e788cae.png" class="image-eyv">
                                      <div class="description-96w">暂无相关资产</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <!-- Audio Tab Content -->
                          <div class="content-1rx" :class="{ 'hidden-w3p': activeTab !== 'audio' }">
                            <div class="tab-entry-mxq">
                              <div class="audio-ont">
                                <div class="header-2ov">
                                  <div class="container-c5d">
                                    <div class="header-2wr">
                                      <div class="container-txy">
                                        <div 
                                          v-for="option in audioFilterOptions" 
                                          :key="option.value"
                                          class="filter-t5e" 
                                          :class="{ [option.activeClass]: audioFilter === option.value }" 
                                          @click="setAudioFilter(option.value)"
                                        >
                                          {{ option.label }}
                                        </div>
                                      </div>
                                      <div class="select-3my">
                                        <div class="select-g9t"></div>
                                        <div class="operateArea-aqq">
                                          <div class="search-7ey">
                                            <div class="container-cpr mini-bsk search-krp">
                                              <div class="container-dbs">
                                                <div class="btn-v6i">
                                                  <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="back-icon-FgnnZF">
                                                    <g>
                                                      <path data-follow-fill="currentColor" d="M4.533 12.844a1.2 1.2 0 0 1 0-1.687l7.655-7.747a1.2 1.2 0 0 1 1.708 1.687l-6.822 6.904 6.822 6.903a1.2 1.2 0 1 1-1.708 1.686l-7.655-7.746Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                    </g>
                                                  </svg>
                                                </div>
                                              </div>
                                              <div class="container-7bd">
                                                <div class="wrapper-kw3 search-fzo button-kin input-gji disabled-bod mini-irl col-zom">
                                                  <span class="input-ffs">
                                                    <span class="wrapper-8e3 wrapper-vc5 wrapper-9ij">
                                                      <span class="input-idr">
                                                        <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                                                          <g>
                                                            <path data-follow-fill="currentColor" d="M4.563 10.75a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm6.5-8.5a8.5 8.5 0 1 0 5.261 15.176l3.406 3.406a1 1 0 0 0 1.415-1.414l-3.407-3.406A8.5 8.5 0 0 0 11.062 2.25Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor" />
                                                          </g>
                                                        </svg>
                                                      </span>
                                                      <input placeholder="搜索" class="input-z1m" value>
                                                    </span>
                                                    <span class="input-xd8">
                                                      <button class="btn-4ac btn-primary-exr btn-j99 btn-a2l loading-9av search-wvd" type="button">
                                                        <div class="container-29w disabled-mib">
                                                          <span class="search-as4">搜索</span>
                                                        </div>
                                                      </button>
                                                    </span>
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <div class="divider-hb7"></div>
                                          <div class="btn-g4h" @click="enterBatchMode">批量操作</div>
                                          <div class="divider-hb7"></div>
                                          <div class="edit-in-capcut-54s">
                                            <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="capcut-icon-rb64XH">
                                              <g>
                                                <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M22.002 7.646V4.61l-3.749 1.917v-.115c0-1.21-.892-1.94-2.181-1.94H4.183c-1.36 0-2.181.73-2.181 1.94v3.066l5.252 2.642-5.252 2.67v3.059c0 1.186.825 1.917 2.181 1.917H16.07c1.29 0 2.182-.73 2.182-1.917v-.16L22 19.63v-3.081l-8.72-4.429 8.722-4.474Zm-11.747 5.98 6.448 3.287H3.784l6.47-3.286Zm6.4-6.3-6.4 3.265-6.47-3.265h12.87Z" fill="currentColor" />
                                              </g>
                                            </svg>去剪映编辑
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div class="empty-page-ij3">
                                  <img src="https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/empty-image-dark.6e788cae.png" class="image-eyv">
                                  <div class="description-96w">暂无相关资产</div>
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
        </div>
      </div>
    </div>
  </div>
  
  <!-- 图片预览组件 -->
  <ImagePreview
    v-model:visible="previewVisible"
    v-model:currentIndex="previewIndex"
    :images="allImages"
    @download="handlePreviewDownload"
    @favorite="handlePreviewFavorite"
    @publish="handlePreviewPublish"
    @generate-video="handlePreviewGenerateVideo"
    @edit-in-canvas="handlePreviewEditInCanvas"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import SideMenu from '@/components/home/components/SideMenu.vue'
import ImagePreview from '@/components/ImagePreview.vue'

// 类型定义
type TabType = 'image' | 'video' | 'canvas' | 'editor' | 'story' | 'audio'
type ImageFilterType = 'all' | 'hd' | 'favorite'
type VideoFilterType = 'all' | 'favorite'
type CanvasFilterType = 'all'
type EditorFilterType = 'all' | 'favorite'
type StoryFilterType = 'all' | 'favorite'
type AudioFilterType = 'all' | 'voice' | 'song' | 'music' | 'favorite'

// 标签页配置
const tabs = [
  { id: 'image' as TabType, label: '图片' },
  { id: 'video' as TabType, label: '视频' },
  { id: 'canvas' as TabType, label: '无限画布' },
  { id: 'editor' as TabType, label: '图片编辑器' },
  { id: 'story' as TabType, label: '故事' },
  { id: 'audio' as TabType, label: '音频' }
]

// 筛选选项配置
const imageFilterOptions = [
  { value: 'all' as ImageFilterType, label: '所有图片', activeClass: 'active-rpp' },
  { value: 'hd' as ImageFilterType, label: '超清', activeClass: 'active-rpp' },
  { value: 'favorite' as ImageFilterType, label: '我的收藏', activeClass: 'active-rpp' }
]

const videoFilterOptions = [
  { value: 'all' as VideoFilterType, label: '所有视频', activeClass: 'active-chb' },
  { value: 'favorite' as VideoFilterType, label: '我的收藏', activeClass: 'active-chb' }
]

const canvasFilterOptions = [
  { value: 'all' as CanvasFilterType, label: '全部', activeClass: 'active-chb' }
]

const editorFilterOptions = [
  { value: 'all' as EditorFilterType, label: '全部', activeClass: 'active-chb' },
  { value: 'favorite' as EditorFilterType, label: '我的收藏', activeClass: 'active-chb' }
]

const storyFilterOptions = [
  { value: 'all' as StoryFilterType, label: '所有故事', activeClass: 'active-chb' },
  { value: 'favorite' as StoryFilterType, label: '我的收藏', activeClass: 'active-chb' }
]

const audioFilterOptions = [
  { value: 'all' as AudioFilterType, label: '所有音频', activeClass: 'active-txq' },
  { value: 'voice' as AudioFilterType, label: '人声配音', activeClass: 'active-txq' },
  { value: 'song' as AudioFilterType, label: '人声歌曲', activeClass: 'active-txq' },
  { value: 'music' as AudioFilterType, label: '纯音乐', activeClass: 'active-txq' },
  { value: 'favorite' as AudioFilterType, label: '我的收藏', activeClass: 'active-txq' }
]

// 标签页状态
const activeTab = ref<TabType>('image')

// 筛选状态
const imageFilter = ref<ImageFilterType>('all')
const videoFilter = ref<VideoFilterType>('all')
const canvasFilter = ref<CanvasFilterType>('all')
const editorFilter = ref<EditorFilterType>('all')
const storyFilter = ref<StoryFilterType>('all')
const audioFilter = ref<AudioFilterType>('music')

// 批量操作模式状态
const isBatchMode = ref<boolean>(false)

// 选择状态管理
const selectedItems = ref<Set<string>>(new Set())

// 图片预览状态
const previewVisible = ref<boolean>(false)
const previewIndex = ref<number>(0)

// 选中数量计算属性
const selectedCount = computed(() => selectedItems.value.size)

// 切换选择状态
const toggleSelection = (itemId: string) => {
  if (!isBatchMode.value) return
  
  if (selectedItems.value.has(itemId)) {
    selectedItems.value.delete(itemId)
  } else {
    selectedItems.value.add(itemId)
  }
  // 触发响应式更新
  selectedItems.value = new Set(selectedItems.value)
}

// 清空选择
const clearSelection = () => {
  selectedItems.value.clear()
  selectedItems.value = new Set()
}

// 进入批量操作模式
const enterBatchMode = () => {
  isBatchMode.value = true
}

// 退出批量操作模式
const exitBatchMode = () => {
  isBatchMode.value = false
  clearSelection()
}

// 检查是否选中
const isSelected = (itemId: string) => {
  return selectedItems.value.has(itemId)
}

// 处理资产项点击（区分批量模式和正常模式）
const handleAssetClick = (itemId: string) => {
  if (isBatchMode.value) {
    // 批量操作模式：切换选择状态
    toggleSelection(itemId)
  } else {
    // 正常模式：打开预览
    openPreview(itemId)
  }
}

// 打开图片预览
const openPreview = (itemId: string) => {
  // 获取所有图片的扁平列表
  const allImages = imageGroups.value.flatMap(group => group.images)
  // 找到点击图片的索引
  const index = allImages.findIndex(img => img.id === itemId)
  if (index !== -1) {
    previewIndex.value = index
    previewVisible.value = true
  }
}

// 获取所有图片的扁平列表（用于预览组件）
const allImages = computed(() => {
  return imageGroups.value.flatMap(group => group.images)
})

// 图片数据 - 按日期分组
interface ImageItem {
  id: string
  src: string
}

interface ImageGroup {
  date: string
  isFirst?: boolean
  images: ImageItem[]
}

const imageGroups = ref<ImageGroup[]>([
  {
    date: '11月29日',
    isFirst: true,
    images: [
      { id: 'img-1', src: 'https://p3-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/a5e970c89c744bec8fe85119d63b9715~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=czQl6PyRsjuofo4PtjJE4bRXFYM%3D&format=.webp' },
      { id: 'img-2', src: 'https://p3-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/4ee948b55091412191db9b02ac2d66c4~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=p8BCZkygcMGb7YMkPxTTlJD%2Frew%3D&format=.webp' },
      { id: 'img-3', src: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/3b0243be18c3416f93c851076f0beebf~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=iDesfW8n5qU9V9k8GHpCl%2BMqffA%3D&format=.webp' },
      { id: 'img-4', src: 'https://p3-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/0c066ae0f7034059b11c420ae584ffa0~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=jvxs2iug%2FYfma8EiYXSEhrEWpqI%3D&format=.webp' },
      { id: 'img-5', src: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/6a37e138cede4802be9fcc05c42ab87c~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=2YR2n1dzzivSlAzbqiqli7N1Lb0%3D&format=.webp' },
      { id: 'img-6', src: 'https://p3-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/2fbae30526cc47d48ba6fbb5a453bd60~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=NV2Miqg10VhzcQPGMm6pa5ucMpQ%3D&format=.webp' },
      { id: 'img-7', src: 'https://p3-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/75488455460346dd9b616e0060cf1269~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=3zeQhAgjVCjAZOc0RvT9erw%2Bd7g%3D&format=.webp' },
      { id: 'img-8', src: 'https://p3-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/fdc6599ca4874361bcffe9e7029642ec~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=krzZtZtYPJ96UI0fN15py9nhQ8w%3D&format=.webp' },
      { id: 'img-9', src: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/65ae292d758147b3bcbe3d9ccc6c3cac~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=YqqEOweyazUdX9kPSdWPgQjh9eY%3D&format=.webp' },
      { id: 'img-10', src: 'https://p3-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/deca19f516884a77949c7b1482ce9b34~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=s8mRuNgu1BuHvjJpfrAjWUv0W%2BM%3D&format=.webp' },
      { id: 'img-11', src: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/7ff39da275df44a1b97361d5e323cf7e~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=4ChxktROl45pzyrNfrskyA%2FPSQ8%3D&format=.webp' },
      { id: 'img-12', src: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/90278f6cfbf44c40a1c95a934251383e~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=p7IicJgQ%2B67zLT7eQ21%2B1ZxRz5Q%3D&format=.webp' }
    ]
  },
  {
    date: '11月26日',
    images: [
      { id: 'img-13', src: 'https://p3-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/6b5e1fff32f24903a4ba6a3117e32b37~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=y2wwp3YaumABd1EfHf7NnOEs%2Fog%3D&format=.webp' },
      { id: 'img-14', src: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/5fd396caca3a461ea98fd2a52ac5bac2~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=26ayF7FKkymbEZjlOXdcnJquQ8A%3D&format=.webp' },
      { id: 'img-15', src: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/33ddd928499040da9be75b9f6626c587~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=9Iid3z9lsoPsy8idhC%2BAEpJB10U%3D&format=.webp' },
      { id: 'img-16', src: 'https://p26-dreamina-sign.byteimg.com/tos-cn-i-tb4s082cfz/7650746fa48c4bd58f9afb11b42bcd08~tplv-tb4s082cfz-aigc_resize_mark:360:360.webp?lk3s=43402efa&x-expires=1771632000&x-signature=ibhsDLIxFoaZ%2FJyNL%2BqBfWahiuM%3D&format=.webp' }
    ]
  }
])

// 切换标签页
const switchTab = (tab: TabType) => {
  activeTab.value = tab
}

// 设置筛选条件
const setImageFilter = (filter: ImageFilterType) => {
  imageFilter.value = filter
}

const setVideoFilter = (filter: VideoFilterType) => {
  videoFilter.value = filter
}

const setCanvasFilter = (filter: CanvasFilterType) => {
  canvasFilter.value = filter
}

const setEditorFilter = (filter: EditorFilterType) => {
  editorFilter.value = filter
}

const setStoryFilter = (filter: StoryFilterType) => {
  storyFilter.value = filter
}

const setAudioFilter = (filter: AudioFilterType) => {
  audioFilter.value = filter
}

// 批量操作处理函数
const handleBatchDelete = async () => {
  const itemIds = Array.from(selectedItems.value)
  console.log('批量删除:', itemIds)
  // TODO: 实现删除逻辑
  ElMessage.info(`将删除 ${itemIds.length} 项内容`)
}

const handleBatchDownload = async () => {
  const itemIds = Array.from(selectedItems.value)
  console.log('批量下载:', itemIds)
  // TODO: 实现下载逻辑
  ElMessage.info(`将下载 ${itemIds.length} 个文件`)
}

const handleBatchPublish = async () => {
  const itemIds = Array.from(selectedItems.value)
  console.log('批量发布:', itemIds)
  // TODO: 实现发布逻辑
  ElMessage.info(`将发布 ${itemIds.length} 项内容`)
}

const handleBatchFavorite = async () => {
  const itemIds = Array.from(selectedItems.value)
  console.log('批量收藏:', itemIds)
  // TODO: 实现收藏逻辑
  ElMessage.success(`将收藏 ${itemIds.length} 项内容`)
}

const handleEditInCapCut = async () => {
  const itemIds = Array.from(selectedItems.value)
  console.log('去剪映编辑:', itemIds)
  // TODO: 实现剪映编辑逻辑
  ElMessage.info(`将在剪映中编辑 ${itemIds.length} 项内容`)
}

// 监听标签页切换，退出批量操作模式
watch(activeTab, () => {
  exitBatchMode()
})

// 图片预览事件处理
const handlePreviewDownload = (image: ImageItem) => {
  console.log('下载图片:', image)
  ElMessage.info('开始下载图片')
  // TODO: 实现下载逻辑
}

const handlePreviewFavorite = (image: ImageItem) => {
  console.log('收藏图片:', image)
  ElMessage.success('已添加到收藏')
  // TODO: 实现收藏逻辑
}

const handlePreviewPublish = (image: ImageItem) => {
  console.log('发布图片:', image)
  ElMessage.info('准备发布图片')
  // TODO: 实现发布逻辑
}

const handlePreviewGenerateVideo = (image: ImageItem) => {
  console.log('生成视频:', image)
  ElMessage.info('开始生成视频')
  // TODO: 实现生成视频逻辑
}

const handlePreviewEditInCanvas = (image: ImageItem) => {
  console.log('去画布编辑:', image)
  ElMessage.info('打开画布编辑器')
  // TODO: 实现画布编辑逻辑
}
</script>

<style>
@import "./AssetManagement.css";
</style>
