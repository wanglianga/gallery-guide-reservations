import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Session, SessionType, SessionLanguage, SessionStatus } from '@/types'
import { sessions as mockSessions } from '@/mock/data'

export const useSessionStore = defineStore('session', () => {
  const sessions = ref<Session[]>([...mockSessions])

  const sessionsByDate = computed(() => {
    return (date: string) => sessions.value.filter(s => s.startTime.startsWith(date)).sort((a, b) => a.startTime.localeCompare(b.startTime))
  })

  const sessionsByType = computed(() => {
    return (type: SessionType) => sessions.value.filter(s => s.type === type)
  })

  const sessionsByLanguage = computed(() => {
    return (lang: SessionLanguage) => sessions.value.filter(s => s.language === lang)
  })

  function getSessionStatus(session: Session): SessionStatus {
    const now = new Date()
    const start = new Date(session.startTime)
    const end = new Date(session.endTime)
    if (now < start) return 'upcoming'
    if (now >= start && now <= end) return 'ongoing'
    return 'completed'
  }

  function getSessionById(id: string) {
    return sessions.value.find(s => s.id === id)
  }

  function updateBooked(sessionId: string, delta: number) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.booked = Math.max(0, Math.min(session.capacity, session.booked + delta))
    }
  }

  return { sessions, sessionsByDate, sessionsByType, sessionsByLanguage, getSessionStatus, getSessionById, updateBooked }
})
