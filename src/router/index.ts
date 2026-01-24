import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from '../views/home/home.vue'
import Generate from '../views/generate/generate.vue'
import Canana from '../views/canana/canana.vue'
import AccountManagement from '../views/account/AccountManagement.vue'
import PublishCenter from '../views/publish/PublishCenter.vue'
import AssetManagement from '../views/asset/AssetManagement.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/generate',
    name: 'Generate',
    component: Generate
  },
  {
    path: '/canvas',
    name: 'Canvas',
    component: Canana
  },
  {
    path: '/account',
    name: 'AccountManagement',
    component: AccountManagement
  },
  {
    path: '/publish',
    name: 'PublishCenter',
    component: PublishCenter
  },
  {
    path: '/asset',
    name: 'AssetManagement',
    component: AssetManagement
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
