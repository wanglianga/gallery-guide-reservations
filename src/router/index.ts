import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import Sessions from '@/views/Sessions.vue'
import Visitors from '@/views/Visitors.vue'
import Statistics from '@/views/Statistics.vue'
import ForeignGuide from '@/views/ForeignGuide.vue'
import GalleryFlow from '@/views/GalleryFlow.vue'
import Workshop from '@/views/Workshop.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/sessions', name: 'sessions', component: Sessions },
  { path: '/visitors', name: 'visitors', component: Visitors },
  { path: '/workshop', name: 'workshop', component: Workshop },
  { path: '/statistics', name: 'statistics', component: Statistics },
  { path: '/foreign-guide', name: 'foreign-guide', component: ForeignGuide },
  { path: '/gallery-flow', name: 'gallery-flow', component: GalleryFlow },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
