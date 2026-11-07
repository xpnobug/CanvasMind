import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSystemInitStore } from '../stores/system-init'
import { useLoadingStore } from '../stores/loading'

// 核心页面懒加载，避免全部进入主 bundle 拖慢首屏
const Home = () => import('../views/home/home.vue')
const Generate = () => import('../views/generate/generate.vue')
const Canana = () => import('../views/canana/canana.vue')
const AccountManagement = () => import('../views/account/AccountManagement.vue')
const PublishCenter = () => import('../views/publish/PublishCenter.vue')
const AssetManagement = () => import('../views/asset/AssetManagement.vue')
const Workflow = () => import('../views/workflow/index.vue')
const Install = () => import('../views/install/InstallView.vue')
const PolicyDetail = () => import('../views/policies/PolicyDetail.vue')
const AgenticAssetsCanvasView = () => import('../views/agentic-assets-canvas/AgenticAssetsCanvasView.vue')
const AdminLayout = () => import('../components/admin/layout/AdminLayout.vue')
const AdminDashboard = () => import('../views/admin/dashboard/AdminDashboard.vue')
const AdminAssets = () => import('../views/admin/assets/AdminAssets.vue')
const AdminConversations = () => import('../views/admin/conversations/AdminConversations.vue')
const AdminConversationSettings = () => import('../views/admin/conversations/AdminConversationSettings.vue')
const AdminGenerations = () => import('../views/admin/generations/AdminGenerations.vue')
const AdminMarketing = () => import('../views/admin/marketing/AdminMarketing.vue')
const AdminSkills = () => import('../views/admin/skills/AdminSkills.vue')
const AdminProviders = () => import('../views/admin/providers/AdminProviders.vue')
const AdminStorage = () => import('../views/admin/storage/AdminStorage.vue')
const AdminSystem = () => import('../views/admin/system/AdminSystem.vue')
const AdminRedis = () => import('../views/admin/redis/AdminRedis.vue')
const AdminTheme = () => import('../views/admin/theme/AdminTheme.vue')
const AdminUsers = () => import('../views/admin/users/AdminUsers.vue')
const AdminAuditLogs = () => import('../views/admin/audit/AdminAuditLogs.vue')
const AdminAccessDenied = () => import('../views/admin/AdminAccessDenied.vue')

// 视频编辑器正式路由(替代 POC,数据持久化到后端 video_projects 表)
const VideoProjectList = () => import('../views/video-editor/VideoProjectList.vue')
const VideoEditorPage = () => import('../views/video-editor/VideoEditorPage.vue')
const AdminVideoProjects = () => import('../views/admin/video-projects/VideoProjectsManage.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/install',
    name: 'Install',
    component: Install,
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/generate',
    name: 'Generate',
    component: Generate,
  },
  {
    path: '/canvas',
    name: 'Canvas',
    component: Canana,
  },
  {
    path: '/account',
    name: 'AccountManagement',
    component: AccountManagement,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/publish',
    name: 'PublishCenter',
    component: PublishCenter,
  },
  {
    path: '/asset',
    name: 'AssetManagement',
    component: AssetManagement,
  },
  {
    path: '/workflow',
    name: 'Workflow',
    component: Workflow,
  },
  {
    path: '/agentic-assets-canvas',
    name: 'AgenticAssetsCanvas',
    component: AgenticAssetsCanvasView,
  },
  {
    path: '/policies/:type',
    name: 'PolicyDetail',
    component: PolicyDetail,
  },
  {
    path: '/video-editor',
    name: 'VideoProjectList',
    component: VideoProjectList,
    meta: { requiresAuth: true },
  },
  {
    path: '/video-editor/:projectId',
    name: 'VideoEditor',
    component: VideoEditorPage,
    meta: { requiresAuth: true },
    props: true,
  },
  {
    path: '/admin-forbidden',
    name: 'AdminAccessDenied',
    component: AdminAccessDenied,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'assets',
        name: 'AdminAssets',
        component: AdminAssets,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'video-projects',
        name: 'AdminVideoProjects',
        component: AdminVideoProjects,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'conversations',
        name: 'AdminConversations',
        component: AdminConversations,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'conversations/settings',
        name: 'AdminConversationSettings',
        component: AdminConversationSettings,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'generations',
        name: 'AdminGenerations',
        component: AdminGenerations,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'publish',
        redirect: '/admin/assets',
      },

      {
        path: 'marketing',
        name: 'AdminMarketing',
        component: AdminMarketing,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'skills',
        name: 'AdminSkills',
        component: AdminSkills,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'providers',
        name: 'AdminProviders',
        component: AdminProviders,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'models',
        redirect: '/admin/providers',
      },
      {
        path: 'storage',
        name: 'AdminStorage',
        component: AdminStorage,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: AdminUsers,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'system',
        name: 'AdminSystem',
        component: AdminSystem,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'redis',
        name: 'AdminRedis',
        component: AdminRedis,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'audit-logs',
        name: 'AdminAuditLogs',
        component: AdminAuditLogs,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
      {
        path: 'layout',
        name: 'AdminLayout',
        component: AdminSystem,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          defaultSystemTab: 'layout',
        },
      },
      {
        path: 'theme',
        name: 'AdminTheme',
        component: AdminTheme,
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
        },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 对需要登录的页面做统一拦截，未登录时回到首页显示登录入口。
router.beforeEach(async (to) => {
  // 路由切换开启全局进度条
  useLoadingStore().start('route')

  const systemInitStore = useSystemInitStore()
  if (!systemInitStore.systemInitInitialized.value || systemInitStore.systemInitLoading.value) {
    await systemInitStore.loadStatus()
  }

  if (!systemInitStore.isInitialized.value && to.path !== '/install') {
    return {
      path: '/install',
      query: to.fullPath && to.fullPath !== '/install'
        ? { redirect: to.fullPath }
        : undefined,
    }
  }

  if (systemInitStore.isInitialized.value && to.path === '/install') {
    return {
      path: '/',
    }
  }

  if (!to.meta?.requiresAuth) {
    return true
  }

  const authStore = useAuthStore()
  if (!authStore.sessionInitialized.value && !authStore.sessionLoading.value) {
    await authStore.loadSession()
  }

  if (authStore.sessionLoading.value) {
    await authStore.loadSession()
  }

  if (!authStore.isLoggedIn.value) {
    return {
      path: '/',
      query: {
        login: '1',
      },
    }
  }

  if (to.meta?.requiresAdmin && !authStore.isAdmin.value) {
    return {
      path: '/admin-forbidden',
    }
  }

  return true
})

// 路由结束/失败时关闭进度条
router.afterEach(() => {
  useLoadingStore().stop('route')
})

router.onError(() => {
  useLoadingStore().stop('route')
})

export default router
