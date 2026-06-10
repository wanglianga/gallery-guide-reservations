import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import Sessions from '@/views/Sessions.vue'
import Visitors from '@/views/Visitors.vue'
import Statistics from '@/views/Statistics.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/sessions', name: 'sessions', component: Sessions },
  { path: '/visitors', name: 'visitors', component: Visitors },
  { path: '/statistics', name: 'statistics', component: Statistics },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
