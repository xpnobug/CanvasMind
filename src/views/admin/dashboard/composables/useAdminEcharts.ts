import { echarts, type EChartsOption } from '@/lib/echarts'
import type { ECharts } from 'echarts/core'
import { onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'

export const readAdminCssVar = (name: string, fallback = '') => {
  if (typeof document === 'undefined') {
    return fallback
  }

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

export const useAdminEcharts = (buildOptions: () => EChartsOption) => {
  const chartRef = ref<HTMLElement | null>(null)
  let chart: ECharts | null = null

  const render = () => {
    if (!chartRef.value) {
      return
    }

    if (!chart) {
      chart = echarts.init(chartRef.value)
    }

    chart.setOption(buildOptions(), true)
  }

  const resize = () => {
    chart?.resize()
  }

  const dispose = () => {
    chart?.dispose()
    chart = null
  }

  onMounted(() => {
    render()
    window.addEventListener('resize', resize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    dispose()
  })

  watchEffect(() => {
    buildOptions()
    render()
  })

  return {
    chartRef,
    render,
    resize,
    dispose,
  }
}

export const adminChartAxisStyle = (options?: { showSplitLine?: boolean }) => {
  const line = readAdminCssVar('--line-divider', 'rgba(0, 0, 0, 0.08)')
  const text = readAdminCssVar('--text-tertiary', '#94a3b8')

  return {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: text, fontSize: 11 },
    splitLine: options?.showSplitLine
      ? {
          show: true,
          lineStyle: { color: line, type: 'dashed' as const },
        }
      : { show: false },
  }
}
