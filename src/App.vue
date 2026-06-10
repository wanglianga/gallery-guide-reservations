<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>

<template>
  <div class="min-h-screen bg-museum-bg">
    <AppSidebar />
    <div
      class="transition-all duration-300"
      :class="appStore.sidebarCollapsed ? 'ml-16' : 'ml-56'"
    >
      <AppHeader />
      <main class="p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
