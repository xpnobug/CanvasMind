<template>
  <div ref="_chartRef" class="admin-dashboard-echart" :style="{ height }" />
</template>

<script setup lang="ts">
import { graphic, type EChartsOption } from '@/lib/echarts'
import {
  adminChartAxisStyle,
  readAdminCssVar,
  useAdminEcharts,
} from '../composables/useAdminEcharts'

export interface DashboardAreaSeries {
  key: string
  label: string
  color?: string
}

const props = withDefaults(defineProps<{
  labels: string[]
  series: DashboardAreaSeries[]
  values: Record<string, number[]>
  height?: string
}>(), {
  height: '18.75rem',
})

const defaultColors = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6']

const buildOptions = (): EChartsOption => {
  // 读取 props，驱动 useAdminEcharts 的 watchEffect 重绘。
  const labels = props.labels
  const series = props.series
  const values = props.values
  const axis = adminChartAxisStyle({ showSplitLine: true })
  const palette = series.map((item, index) => (
    item.color || readAdminCssVar('--brand-main-default', defaultColors[index % defaultColors.length])
  ))

  return {
    animationDuration: 900,
    color: palette,
    grid: { top: 28, right: 12, bottom: 8, left: 8, containLabel: true },
    legend: {
      top: 0,
      left: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: readAdminCssVar('--text-secondary', '#64748b'),
        fontSize: 11,
      },
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      ...axis,
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      ...axis,
    },
    series: series.map((item, index) => {
      const color = palette[index]
      return {
        name: item.label,
        type: 'line',
        data: values[item.key] || [],
        smooth: true,
        symbol: 'none',
        showSymbol: false,
        stack: 'total',
        lineStyle: { width: 2, color },
        itemStyle: { color },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${color}cc` },
            { offset: 1, color: `${color}1a` },
          ]),
        },
      }
    }),
  }
}

const { chartRef: _chartRef } = useAdminEcharts(buildOptions)
</script>
