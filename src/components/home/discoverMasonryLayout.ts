/**
 * 「发现」页 masonry：5 列 + 左侧顶部大卡，feed 每张卡片宽度固定，
 * 高度由图片原始宽高比换算；列选择「当前最短列」，与常见瀑布流一致。
 */

export type MasonryRect = {
  left: number
  top: number
  width: number
  height: number
}

/** 顶部轮播区占位（与即梦栅格一致：占两列宽） */
export const HERO_RECT: MasonryRect = {
  left: 0,
  top: 0,
  width: 660,
  height: 248,
}

const COL_LEFT = [0, 331, 662, 993, 1324] as const
const COL_WIDTH = 329
const FEED_GAP = 2

function displayHeight(nw: number, nh: number): number {
  if (!nw || !nh || nw <= 0 || nh <= 0) return COL_WIDTH
  return Math.max(1, Math.round((COL_WIDTH * nh) / nw))
}

/**
 * 根据每张图的自然尺寸（未知时用 1:1 占位）计算绝对定位矩形。
 * @param sizes 与 feed 列表等长；元素为 null 时表示尚未加载，按正方形占位。
 */
export function buildFeedLayoutsFromSizes(
  sizes: ReadonlyArray<{ w: number; h: number } | null | undefined>,
): MasonryRect[] {
  const heroBottom = HERO_RECT.top + HERO_RECT.height
  /** 各列当前堆叠到的底部 y（不含即将放入的块） */
  const colBottom = [heroBottom, heroBottom, 0, 0, 0]
  const out: MasonryRect[] = []

  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i]
    const nw = s && s.w > 0 ? s.w : 1
    const nh = s && s.h > 0 ? s.h : 1
    const h = displayHeight(nw, nh)

    let c = 0
    let minB = colBottom[0]
    for (let k = 1; k < 5; k++) {
      if (colBottom[k] < minB) {
        minB = colBottom[k]
        c = k
      }
    }

    const top = colBottom[c] + (colBottom[c] > 0 ? FEED_GAP : 0)
    const left = COL_LEFT[c]
    colBottom[c] = top + h
    out.push({ left, top, width: COL_WIDTH, height: h })
  }

  return out
}

export function masonryScrollHeight(feedLayouts: MasonryRect[]): number {
  let maxY = HERO_RECT.top + HERO_RECT.height
  for (const r of feedLayouts) {
    maxY = Math.max(maxY, r.top + r.height)
  }
  return maxY + 24
}
