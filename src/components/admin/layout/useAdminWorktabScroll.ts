import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export const useAdminWorktabScroll = (
  activePath: Ref<string>,
  tabCount: Ref<number>,
) => {
  const scrollRef = ref<HTMLElement | null>(null)
  const listRef = ref<HTMLElement | null>(null)
  const translateX = ref(0)
  const transition = ref('')

  const setTransition = () => {
    transition.value = 'transform 0.35s cubic-bezier(0.15, 0, 0.15, 1)'
    window.setTimeout(() => {
      transition.value = ''
    }, 360)
  }

  const autoPositionTab = () => {
    const scrollEl = scrollRef.value
    const listEl = listRef.value
    if (!scrollEl || !listEl) {
      return
    }

    const activeEl = listEl.querySelector<HTMLElement>('[data-active="true"]')
    if (!activeEl) {
      return
    }

    const scrollWidth = scrollEl.offsetWidth
    const listWidth = listEl.offsetWidth
    if (listWidth <= scrollWidth) {
      translateX.value = 0
      return
    }

    const { offsetLeft, clientWidth } = activeEl
    const tabRight = offsetLeft + clientWidth
    const maxShift = scrollWidth - listWidth
    const targetLeft = scrollWidth - tabRight

    if (tabRight > scrollWidth) {
      translateX.value = Math.max(targetLeft - 6, maxShift)
      return
    }

    if (offsetLeft < Math.abs(translateX.value)) {
      translateX.value = -offsetLeft
    }
  }

  const handleWheel = (event: WheelEvent) => {
    const scrollEl = scrollRef.value
    const listEl = listRef.value
    if (!scrollEl || !listEl || listEl.offsetWidth <= scrollEl.offsetWidth) {
      return
    }

    event.preventDefault()
    const maxShift = 0
    const minShift = scrollEl.offsetWidth - listEl.offsetWidth
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
    translateX.value = Math.min(Math.max(translateX.value - delta, minShift), maxShift)
  }

  const bindListeners = () => {
    listRef.value?.addEventListener('wheel', handleWheel, { passive: false })
  }

  const unbindListeners = () => {
    listRef.value?.removeEventListener('wheel', handleWheel)
  }

  watch([activePath, tabCount], () => {
    nextTick(() => {
      setTransition()
      autoPositionTab()
    })
  })

  onMounted(() => {
    bindListeners()
    nextTick(autoPositionTab)
  })

  onBeforeUnmount(unbindListeners)

  return {
    scrollRef,
    listRef,
    translateX,
    transition,
    autoPositionTab,
  }
}
