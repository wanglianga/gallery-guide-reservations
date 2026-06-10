<script setup lang="ts">
import { UserCheck, Mic2, GraduationCap } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { Role } from '@/types'

const appStore = useAppStore()

const roles: { key: Role; label: string; icon: any; desc: string }[] = [
  { key: 'front-desk', label: '前台', icon: UserCheck, desc: '安排观众入场' },
  { key: 'guide', label: '讲解员', icon: Mic2, desc: '查看场次信息' },
  { key: 'education', label: '教育负责人', icon: GraduationCap, desc: '监控场次占用' },
]
</script>

<template>
  <header class="h-14 bg-museum-surface/90 backdrop-blur-sm border-b border-museum-border/50 flex items-center justify-between px-6 sticky top-0 z-20">
    <div class="flex items-center gap-3">
      <h2 class="font-serif text-base font-semibold text-museum-text">{{ appStore.roleLabel }}</h2>
      <span class="text-[10px] text-museum-muted bg-museum-bg px-2 py-0.5 rounded-full border border-museum-border/40">
        {{ appStore.selectedDate }}
      </span>
    </div>

    <div class="flex items-center gap-0.5 bg-museum-bg rounded-lg p-0.5 border border-museum-border/40">
      <button
        v-for="role in roles"
        :key="role.key"
        @click="appStore.setRole(role.key)"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
        :class="appStore.currentRole === role.key
          ? 'bg-museum-surface text-museum-gold shadow-sm border border-museum-gold/20'
          : 'text-museum-muted hover:text-museum-text'"
      >
        <component :is="role.icon" class="w-3.5 h-3.5" />
        {{ role.label }}
      </button>
    </div>
  </header>
</template>
