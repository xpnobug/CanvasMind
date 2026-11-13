/**
 * 数据看板演示数据：补齐订单 / 用户 / 图表 / 排行字段。
 * 有真实 overview 时由页面把 generation 等字段叠加上去，不在这里伪造「已接入」假象以外的口径。
 */
import type { AdminDashboardOverview as CmOverview } from '@/api/admin-dashboard'

export interface DemoDashboardOverview {
  order: {
    monthOrderAmount: number
    monthOrderCount: number
    todayOrderAmount: number
    ordersToday: number
    yesterdayOrderAmount: number
    ordersYesterday: number
    orderChange: number
  }
  user: {
    totalUsers: number
    activeUsers: number
    newUsersToday: number
    newUsersYesterday: number
    userChange: number
  }
  chat: {
    totalConversations: number
    totalConsumePoints: number
    conversationsToday: number
    chatChange: number
    byType: {
      text: { total: number; today: number; consumePoints: number }
      image: { total: number; today: number; consumePoints: number }
      video: { total: number; today: number; consumePoints: number }
    }
  }
  userDetail: {
    chartData: Array<{ date: string; label: string; visit: number; register: number }>
  }
  revenueDetail: {
    chartData: Array<{ date: string; label: string; revenue: number; orders: number }>
  }
  consumeUsage: {
    byModel: DemoRankingItem[]
    byProvider: DemoRankingItem[]
  }
  gatewayUsage: {
    byModel: DemoRankingItem[]
    byProvider: DemoRankingItem[]
    byUser: DemoUserRankingItem[]
  }
  userConsumeRanking: DemoUserRankingItem[]
}

export interface DemoRankingItem {
  id: string
  name: string
  providerId: string
  providerCode: string
  providerName: string
  iconUrl: string
  points: number
  conversations: number
}

export interface DemoUserRankingItem {
  id: string
  name: string
  username: string
  avatarUrl: string
  points: number
  conversations: number
}

const pad = (value: number) => String(value).padStart(2, '0')

const buildRecentDays = (days: number) => {
  const now = new Date()
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (days - 1 - index))
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    return {
      date: key,
      label: `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    }
  })
}

const rankingItem = (
  id: string,
  name: string,
  providerName: string,
  points: number,
  conversations: number,
): DemoRankingItem => ({
  id,
  name,
  providerId: `provider-${id}`,
  providerCode: providerName.toLowerCase().replace(/\s+/g, '-'),
  providerName,
  iconUrl: '',
  points,
  conversations,
})

const userItem = (
  id: string,
  name: string,
  username: string,
  points: number,
  conversations: number,
): DemoUserRankingItem => ({
  id,
  name,
  username,
  avatarUrl: '',
  points,
  conversations,
})

/** 生成一整份演示看板数据（稳定可演示，非随机抖动）。 */
export const createDemoDashboardOverview = (): DemoDashboardOverview => {
  const days = buildRecentDays(30)

  return {
    order: {
      monthOrderAmount: 128640.5,
      monthOrderCount: 386,
      todayOrderAmount: 4280,
      ordersToday: 17,
      yesterdayOrderAmount: 3920,
      ordersYesterday: 14,
      orderChange: 9.2,
    },
    user: {
      totalUsers: 12840,
      activeUsers: 3260,
      newUsersToday: 48,
      newUsersYesterday: 41,
      userChange: 17.1,
    },
    chat: {
      totalConversations: 86520,
      totalConsumePoints: 1523400,
      conversationsToday: 1260,
      chatChange: 6.4,
      byType: {
        text: { total: 51200, today: 720, consumePoints: 420000 },
        image: { total: 26800, today: 410, consumePoints: 780000 },
        video: { total: 8520, today: 130, consumePoints: 323400 },
      },
    },
    userDetail: {
      chartData: days.map((item, index) => ({
        ...item,
        visit: 1800 + index * 36 + (index % 5) * 40,
        register: 28 + (index % 7) * 3 + Math.floor(index / 4),
      })),
    },
    revenueDetail: {
      chartData: days.map((item, index) => ({
        ...item,
        revenue: 2200 + index * 55 + (index % 4) * 120,
        orders: 8 + (index % 6) + Math.floor(index / 5),
      })),
    },
    consumeUsage: {
      byModel: [
        rankingItem('m1', 'gpt-image-1', 'OpenAI', 128400, 860),
        rankingItem('m2', 'seedream-4.0', 'Volcengine', 96500, 720),
        rankingItem('m3', 'kling-v2', 'Kuaishou', 74200, 310),
        rankingItem('m4', 'deepseek-v3', 'DeepSeek', 51800, 1420),
        rankingItem('m5', 'gemini-2.5-flash', 'Google', 38600, 980),
      ],
      byProvider: [
        rankingItem('p1', 'OpenAI', 'OpenAI', 168200, 2100),
        rankingItem('p2', 'Volcengine', 'Volcengine', 121400, 1680),
        rankingItem('p3', 'Kuaishou', 'Kuaishou', 84200, 540),
        rankingItem('p4', 'DeepSeek', 'DeepSeek', 61800, 1900),
        rankingItem('p5', 'Google', 'Google', 45200, 1200),
      ],
    },
    gatewayUsage: {
      byModel: [
        rankingItem('gm1', 'gpt-4o-mini', 'OpenAI', 0, 2680),
        rankingItem('gm2', 'deepseek-chat', 'DeepSeek', 0, 2140),
        rankingItem('gm3', 'qwen-max', 'Alibaba', 0, 1680),
        rankingItem('gm4', 'claude-sonnet', 'Anthropic', 0, 980),
        rankingItem('gm5', 'gemini-flash', 'Google', 0, 760),
      ],
      byProvider: [
        rankingItem('gp1', 'OpenAI', 'OpenAI', 0, 4200),
        rankingItem('gp2', 'DeepSeek', 'DeepSeek', 0, 3100),
        rankingItem('gp3', 'Alibaba', 'Alibaba', 0, 2100),
        rankingItem('gp4', 'Anthropic', 'Anthropic', 0, 1200),
        rankingItem('gp5', 'Google', 'Google', 0, 980),
      ],
      byUser: [
        userItem('gu1', '阿梨', 'ali_design', 0, 860),
        userItem('gu2', 'Nova', 'nova_lab', 0, 720),
        userItem('gu3', '小林', 'xiaolin', 0, 640),
        userItem('gu4', 'Echo', 'echo_ai', 0, 510),
        userItem('gu5', '木子', 'muzi', 0, 430),
      ],
    },
    userConsumeRanking: [
      userItem('u1', '阿梨', 'ali_design', 28600, 420),
      userItem('u2', 'Nova', 'nova_lab', 21400, 360),
      userItem('u3', '小林', 'xiaolin', 17800, 290),
      userItem('u4', 'Echo', 'echo_ai', 14200, 240),
      userItem('u5', '木子', 'muzi', 11800, 210),
    ],
  }
}

/** 把真实 generation 叠到演示数据的生成统计上，其余块保持演示值。 */
export const mergeCmOverviewIntoDemo = (
  demo: DemoDashboardOverview,
  real: CmOverview | null,
): DemoDashboardOverview => {
  if (!real) {
    return demo
  }

  const total = Number(real.generation.total || 0)
  const today = Number(real.generation.today || 0)
  const textTotal = Math.round(total * 0.52)
  const imageTotal = Math.round(total * 0.32)
  const videoTotal = Math.max(0, total - textTotal - imageTotal)
  const textToday = Math.round(today * 0.55)
  const imageToday = Math.round(today * 0.33)
  const videoToday = Math.max(0, today - textToday - imageToday)

  return {
    ...demo,
    chat: {
      ...demo.chat,
      totalConversations: total || demo.chat.totalConversations,
      conversationsToday: today || demo.chat.conversationsToday,
      byType: {
        text: {
          total: textTotal || demo.chat.byType.text.total,
          today: textToday || demo.chat.byType.text.today,
          consumePoints: demo.chat.byType.text.consumePoints,
        },
        image: {
          total: imageTotal || demo.chat.byType.image.total,
          today: imageToday || demo.chat.byType.image.today,
          consumePoints: demo.chat.byType.image.consumePoints,
        },
        video: {
          total: videoTotal || demo.chat.byType.video.total,
          today: videoToday || demo.chat.byType.video.today,
          consumePoints: demo.chat.byType.video.consumePoints,
        },
      },
    },
  }
}
