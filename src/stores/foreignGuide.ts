import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SessionLanguage, GuideMatchInfo, GuideLeave, AssistiveDevice, Session } from '@/types'
import { guides, sessions as mockSessions, guideLeaves as mockLeaves, assistiveDevices as mockDevices } from '@/mock/data'

export const useForeignGuideStore = defineStore('foreignGuide', () => {
  const leaves = ref<GuideLeave[]>([...mockLeaves])
  const devices = ref<AssistiveDevice[]>([...mockDevices])

  const foreignSessions = computed(() =>
    mockSessions.filter(s => s.type === 'foreign')
  )

  const sessionsByLanguage = computed(() => {
    return (lang: SessionLanguage) => foreignSessions.value.filter(s => s.language === lang)
  })

  function getAvailableGuidesForLanguage(lang: SessionLanguage, excludeGuideId?: string) {
    return guides.filter(g => {
      const hasLang = g.languages.includes(lang)
      const notExcluded = !excludeGuideId || g.id !== excludeGuideId
      return hasLang && notExcluded
    }).map(g => g.id)
  }

  function isGuideOnLeave(guideId: string, dateStr: string) {
    return leaves.value.find(l => l.guideId === guideId && l.date === dateStr)
  }

  function getSessionDate(session: Session) {
    return session.startTime.slice(0, 10)
  }

  const matchInfos = computed<GuideMatchInfo[]>(() => {
    return foreignSessions.value.map(s => {
      const date = getSessionDate(s)
      const leave = isGuideOnLeave(s.guideId, date)
      const affected = !!leave
      const replacement = leave?.replacementGuideId ?? null
      const excludeForCalc = replacement ?? undefined
      const available = getAvailableGuidesForLanguage(s.language, excludeForCalc)
      const devs = devicesForLanguage(s.language)
      return {
        sessionId: s.id,
        language: s.language,
        availableGuides: available,
        bookedCount: s.booked,
        capacity: s.capacity,
        assistiveDevices: devs,
        isLeaveAffected: affected,
        leaveRecordId: leave?.id ?? null,
        originalGuideId: s.guideId,
        replacementGuideId: replacement,
      }
    })
  })

  function devicesForLanguage(lang: SessionLanguage): AssistiveDevice[] {
    switch (lang) {
      case 'en':
        return devices.value.filter(d =>
          d.type === 'audio-guide' && d.name.includes('英文') ||
          d.type === 'hearing-loop' || d.type === 'magnifier' || d.type === 'wheelchair'
        ).slice(0, 4)
      case 'ja':
        return devices.value.filter(d =>
          (d.type === 'audio-guide' && d.name.includes('日文')) ||
          d.type === 'hearing-loop' || d.type === 'magnifier' || d.type === 'wheelchair'
        ).slice(0, 4)
      case 'sign':
        return devices.value.filter(d =>
          d.type === 'sign-interpreter' || d.type === 'hearing-loop' ||
          d.type === 'magnifier' || d.type === 'wheelchair'
        ).slice(0, 4)
      case 'fr':
        return devices.value.filter(d =>
          (d.type === 'audio-guide' && d.name.includes('法文')) ||
          d.type === 'magnifier' || d.type === 'wheelchair'
        ).slice(0, 4)
      case 'de':
        return devices.value.filter(d =>
          d.type === 'hearing-loop' || d.type === 'magnifier' || d.type === 'wheelchair'
        ).slice(0, 4)
      default:
        return devices.value.slice(0, 4)
    }
  }

  function matchInfoBySession(sessionId: string) {
    return matchInfos.value.find(m => m.sessionId === sessionId)
  }

  function assignReplacement(leaveId: string, replacementGuideId: string) {
    const leave = leaves.value.find(l => l.id === leaveId)
    if (leave) {
      leave.replacementGuideId = replacementGuideId
    }
  }

  function addLeave(leave: Omit<GuideLeave, 'id'>) {
    const newLeave: GuideLeave = {
      ...leave,
      id: `gl${Date.now()}`,
    }
    leaves.value.push(newLeave)
    return newLeave
  }

  function updateDeviceAvailability(deviceId: string, delta: number) {
    const dev = devices.value.find(d => d.id === deviceId)
    if (dev) {
      dev.available = Math.max(0, Math.min(dev.total, dev.available + delta))
    }
  }

  return {
    leaves,
    devices,
    foreignSessions,
    sessionsByLanguage,
    matchInfos,
    getAvailableGuidesForLanguage,
    isGuideOnLeave,
    matchInfoBySession,
    assignReplacement,
    addLeave,
    updateDeviceAvailability,
  }
})
