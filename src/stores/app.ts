import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Role } from '@/types'

export const useAppStore = defineStore('app', () => {
  const currentRole = ref<Role>('front-desk')

  const roleLabel = computed(() => {
    const labels: Record<Role, string> = {
      'front-desk': '前台工作人员',
      'guide': '讲解员',
      'education': '教育负责人',
    }
    return labels[currentRole.value]
  })

  const selectedDate = ref(new Date().toISOString().slice(0, 10))
  const sidebarCollapsed = ref(false)

  function setRole(role: Role) {
    currentRole.value = role
  }

  function setSelectedDate(date: string) {
    selectedDate.value = date
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return { currentRole, roleLabel, selectedDate, sidebarCollapsed, setRole, setSelectedDate, toggleSidebar }
})
