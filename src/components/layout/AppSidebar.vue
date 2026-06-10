<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { LayoutDashboard, CalendarRange, Users, BarChart3, ChevronLeft, ChevronRight, Globe2, Building2, Palette } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

const navItems = [
  { path: '/', label: '导览总览', icon: LayoutDashboard },
  { path: '/sessions', label: '场次管理', icon: CalendarRange },
  { path: '/foreign-guide', label: '外语导览匹配', icon: Globe2 },
  { path: '/gallery-flow', label: '展厅人流管理', icon: Building2 },
  { path: '/visitors', label: '观众管理', icon: Users },
  { path: '/workshop', label: '手作课程', icon: Palette },
  { path: '/statistics', label: '统计总览', icon: BarChart3 },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <aside
    class="fixed left-0 top-0 h-screen bg-museum-surface border-r border-museum-border z-30 transition-all duration-300 flex flex-col"
    :class="appStore.sidebarCollapsed ? 'w-16' : 'w-56'"
  >
    <div class="h-16 flex items-center border-b border-museum-border px-4">
      <div
        class="flex items-center gap-3 overflow-hidden transition-all duration-300"
        :class="appStore.sidebarCollapsed ? 'justify-center' : ''"
      >
        <div class="w-8 h-8 rounded-lg bg-museum-gold flex items-center justify-center flex-shrink-0">
          <span class="text-white text-sm font-serif font-bold">美</span>
        </div>
        <span
          v-if="!appStore.sidebarCollapsed"
          class="font-serif text-lg font-semibold text-museum-text whitespace-nowrap"
        >
          导览预约
        </span>
      </div>
    </div>

    <nav class="flex-1 py-4 px-2 space-y-1">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative"
        :class="isActive(item.path)
          ? 'bg-museum-gold/10 text-museum-gold'
          : 'text-museum-muted hover:bg-museum-bg hover:text-museum-text'"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span
          v-if="!appStore.sidebarCollapsed"
          class="text-sm font-medium whitespace-nowrap"
        >
          {{ item.label }}
        </span>
        <div
          v-if="isActive(item.path)"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-museum-gold rounded-r"
        />
      </router-link>
    </nav>

    <button
      @click="appStore.toggleSidebar()"
      class="h-12 flex items-center justify-center border-t border-museum-border text-museum-muted hover:text-museum-gold transition-colors"
    >
      <component :is="appStore.sidebarCollapsed ? ChevronRight : ChevronLeft" class="w-4 h-4" />
    </button>
  </aside>
</template>
