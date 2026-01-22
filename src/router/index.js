import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/home/home.vue'
import Canana from '../views/canana/canana.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/canvas',
    name: 'Canvas',
    component: Canana
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
