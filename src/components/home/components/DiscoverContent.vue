<template>
  <div class="masonry-layout-ynW6QL masonry-layout" style="height:1000px">
    <div class="masonry-layout-scroll-content-clXJoF" style="height:1000px;max-height:1000px">
      <!-- Carousel Item -->
      <div class="masonry-layout-item-J63wqA masonry-layout-item" data-index="0"
           data-col="0" style="left:0px;top:0px;height:244px;width:650px">
        <div class="carousel-FWRj1r">
          <div class="list-container-vuJDVb">
            <div
              v-for="(item, index) in carouselItems"
              :key="index"
              :class="['list-item-ZCXUDd', 'animated-iDahmY', getCarouselItemClass(index)]"
            >
              <div class="carousel-item-etX02e" :data-index="index">
                <div class="container-bG3PQ9">
                  <div style="transition:opacity 300ms;opacity:1">
                    <img
                      crossorigin="anonymous"
                      data-apm-action="feed-item-video"
                      fetchpriority="high"
                      loading="lazy"
                      class="image-dDSP59"
                      :src="item.image"
                    >
                  </div>
                </div>
                <div class="gradient-s76omw"></div>
                <div class="description-LBLc4Y">
                  <p class="title-rWMvWE">{{ item.title }}</p>
                  <p v-if="item.participants" class="subtitle-gSQDQC">
                    已有<span class="number-GeGXES">{{ item.participants }}</span>人参与
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Carousel Arrows -->
          <div class="arrow-container-LaBgq_">
            <div class="arrow-button-h6oOIX" role="button" tabindex="0" aria-label="上一个" @click="prevSlide">
              <svg width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                   xmlns="http://www.w3.org/2000/svg" class="icon-XIKnET">
                <g>
                  <path data-follow-fill="currentColor" fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M6.26 12.844a1.2 1.2 0 0 1 0-1.688L14.321 3a1.2 1.2 0 0 1 1.707 1.687L8.801 12l7.227 7.313A1.2 1.2 0 0 1 14.321 21l-8.06-8.156Z"
                        fill="currentColor"></path>
                </g>
              </svg>
            </div>
            <div class="arrow-button-h6oOIX" role="button" tabindex="0" aria-label="下一个" @click="nextSlide">
              <svg width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                   xmlns="http://www.w3.org/2000/svg" class="icon-XIKnET">
                <g>
                  <path data-follow-fill="currentColor"
                        d="M17.74 12.844a1.2 1.2 0 0 0 0-1.688L9.678 3A1.2 1.2 0 1 0 7.97 4.687L15.2 12l-7.23 7.313A1.2 1.2 0 1 0 9.68 21l8.06-8.156Z"
                        fill="currentColor"></path>
                </g>
              </svg>
            </div>
          </div>
          
          <!-- Carousel Dots -->
          <div class="dots-container-FwLPgG">
            <div
              v-for="(item, index) in carouselItems"
              :key="index"
              :data-index="index"
              :class="['dot-uLga1M', { 'curr-F1jSlh': currentSlide === index }]"
              @click="goToSlide(index)"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Feed Item -->
<!--      <div class="masonry-layout-item-J63wqA masonry-layout-item" data-index="1" data-col="2" style="left:652px;top:0px;height:576px;width:324px">-->
<!--        <div class="feed-item-IXsc39 feed-item-image-NrtAVV cover-container-zfPgao">-->
<!--          <div class="content-TIH4aR">-->
<!--            <div class="container-bG3PQ9">-->
<!--              <div style="transition:opacity 300ms;opacity:1">-->
<!--                <img-->
<!--                  crossorigin="anonymous"-->
<!--                  data-apm-action="feed-item-image"-->
<!--                  elementtiming-->
<!--                  fetchpriority="high"-->
<!--                  loading="lazy"-->
<!--                  class="cover-W9HnBB"-->
<!--                  ccfmp-element="true"-->
<!--                >-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->
    </div>
  </div>
  <div>
    <div class="feed-list-normal-PjbW7g"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currentSlide = ref(0)

const carouselItems = ref([
  {
    title: '视觉实验室第1期 · 图标银行',
    participants: 4888,
    image: 'https://p9-heycan-hgt-sign.byteimg.com/tos-cn-i-31yrirwxg7/7854351dae514807b2411d3ed374be2f~tplv-3jr8j4ixpe-resize:720:720.webp?lk3s=8e790bc3&x-expires=1800580713&x-signature=9CfIpRLH%2BnjqJMGA0iOyWYBmqIQ%3D'
  },
  {
    title: '第105届ADC年度设计大奖·AI设计作品征集',
    participants: null,
    image: 'https://p9-heycan-hgt-sign.byteimg.com/tos-cn-i-31yrirwxg7/35cb2eb1fd6a465090d743cd79344dcc~tplv-3jr8j4ixpe-resize:720:720.webp?lk3s=8e790bc3&x-expires=1800580713&x-signature=rJdP73v4TQQ6I%2BGP0yeUGGIOLkA%3D'
  },
  {
    title: '迷你剧场第21期 · 看见那一刻的发生',
    participants: 926,
    image: 'https://p9-heycan-hgt-sign.byteimg.com/tos-cn-i-31yrirwxg7/62a31d95776e4106b2e2533626551ad2~tplv-3jr8j4ixpe-resize:720:720.webp?lk3s=8e790bc3&x-expires=1800580713&x-signature=m5M3guAWnzX5TTgBNdpTuFZUNZQ%3D'
  }
])

const getCarouselItemClass = (index) => {
  if (index === currentSlide.value) return 'curr-F1jSlh'
  if (index === (currentSlide.value + 1) % carouselItems.value.length) return 'next-fFJk8u'
  if (index === (currentSlide.value - 1 + carouselItems.value.length) % carouselItems.value.length) return 'prev-CbPcEG'
  return ''
}

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % carouselItems.value.length
}

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + carouselItems.value.length) % carouselItems.value.length
}

const goToSlide = (index) => {
  currentSlide.value = index
}
</script>

<style scoped>
/* 发现内容样式已在全局样式中定义 */
</style>
