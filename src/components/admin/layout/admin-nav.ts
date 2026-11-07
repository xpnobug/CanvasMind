export interface AdminNavItem {
  label: string
  path: string
  description: string
  /** Remix Icon 类名，供工作标签与侧栏展示 */
  icon?: string
}

export interface AdminNavGroup {
  title: string
  items: AdminNavItem[]
}

export type AdminNavVisibilityContext = {
  isFullAdmin?: boolean
  permissions?: string[]
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: '总览',
    items: [
      {
        label: '仪表盘',
        path: '/admin/dashboard',
        description: '查看整体运行概览与趋势',
        icon: 'ri-dashboard-line',
      },
    ],
  },
  {
    title: '内容管理',
    items: [
      {
        label: '资源管理',
        path: '/admin/assets',
        description: '管理图片、视频与发布状态',
        icon: 'ri-image-line',
      },
      {
        label: '营销中心',
        path: '/admin/marketing',
        description: '管理会员订阅、积分充值与奖励活动',
        icon: 'ri-megaphone-line',
      },
    ],
  },
  {
    title: '会话管理',
    items: [
      {
        label: '会话列表',
        path: '/admin/conversations',
        description: '管理全站创作会话与会话明细',
        icon: 'ri-chat-3-line',
      },
      {
        label: '会话配置',
        path: '/admin/conversations/settings',
        description: '统一维护会话规则、入口展示与管理策略',
        icon: 'ri-settings-3-line',
      },
    ],
  },
  {
    title: '系统配置',
    items: [
      {
        label: '技能配置',
        path: '/admin/skills',
        description: '管理技能目录、提示词模板与工作流模板',
        icon: 'ri-puzzle-line',
      },
      {
        label: '厂商配置',
        path: '/admin/providers',
        description: '管理 AI 厂商地址、密钥与请求端点',
        icon: 'ri-building-2-line',
      },
      {
        label: '存储配置',
        path: '/admin/storage',
        description: '管理本地与对象存储方案',
        icon: 'ri-hard-drive-2-line',
      },
      {
        label: '用户管理',
        path: '/admin/users',
        description: '查看用户列表并调整后台角色',
        icon: 'ri-user-3-line',
      },
      {
        label: '系统设置',
        path: '/admin/system',
        description: '维护站点信息、协议文案与登录方式',
        icon: 'ri-settings-3-line',
      },
      {
        label: 'Redis 管理',
        path: '/admin/redis',
        description: '查看 Redis 健康状态、缓存数量与任务运行态',
        icon: 'ri-database-2-line',
      },
      {
        label: '审计日志',
        path: '/admin/audit-logs',
        description: '查看后台关键操作、操作者与变更摘要',
        icon: 'ri-file-search-line',
      },
      {
        label: '主题配置',
        path: '/admin/theme',
        description: '单独维护主题模式、品牌主色、渐变与界面尺寸',
        icon: 'ri-palette-line',
      },
    ],
  },
]

export const ADMIN_DASHBOARD_PATH = '/admin/dashboard'

/** 公开版暂无细粒度权限码：能进后台即可见全部导航（路由守卫另做鉴权） */
export const isAdminNavItemVisible = (
  _item: AdminNavItem,
  _context: AdminNavVisibilityContext = {},
) => true

export const canAccessAdminDashboard = (_context: AdminNavVisibilityContext = {}) => true

export const resolveAdminNavGroups = (context: AdminNavVisibilityContext = {}) => {
  return adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isAdminNavItemVisible(item, context)),
    }))
    .filter((group) => group.items.length > 0)
}

export const getAdminNavPaths = (groups: AdminNavGroup[] = adminNavGroups) => {
  return groups
    .flatMap((group) => group.items.map((item) => item.path))
    .sort((left, right) => right.length - left.length)
}

export const findAdminNavItemByPath = (
  path: string,
  groups: AdminNavGroup[] = adminNavGroups,
) => {
  const currentPath = String(path || '').trim()
  const paths = getAdminNavPaths(groups)

  const matchedPath = paths.find((navPath) => currentPath === navPath || currentPath.startsWith(`${navPath}/`))
  if (!matchedPath) {
    return null
  }

  for (const group of groups) {
    const matchedItem = group.items.find((item) => item.path === matchedPath)
    if (matchedItem) {
      return matchedItem
    }
  }

  return null
}

export const isAdminRemixIcon = (value?: string | null) => (
  String(value || '').trim().startsWith('ri-')
)

/** 返回菜单项的 Remix Icon 类名 */
export const getAdminNavItemIcon = (item: AdminNavItem) => {
  const icon = String(item.icon || '').trim()
  return isAdminRemixIcon(icon) ? icon : ''
}
