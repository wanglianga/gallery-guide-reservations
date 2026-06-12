import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Visitor, AccessibilityNeed, SessionLanguage, RelocationRecord, RelocationType, ChildProfile } from '@/types'
import { visitors as mockVisitors, relocationRecords as mockRelocations } from '@/mock/data'

export const useVisitorStore = defineStore('visitor', () => {
  const visitors = ref<Visitor[]>([...mockVisitors])
  const searchQuery = ref('')
  const filterSessionId = ref('')
  const relocationRecords = ref<RelocationRecord[]>([...mockRelocations])

  const filteredVisitors = computed(() => {
    let result = visitors.value
    if (filterSessionId.value) {
      result = result.filter(v => v.sessionId === filterSessionId.value)
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(v => v.name.toLowerCase().includes(q) || v.phone.includes(q) || v.idCardNumber.includes(q))
    }
    return result
  })

  const visitorsBySession = computed(() => {
    return (sessionId: string) => visitors.value.filter(v => v.sessionId === sessionId)
  })

  const visitorStatsBySession = computed(() => {
    return (sessionId: string) => {
      const sv = visitors.value.filter(v => v.sessionId === sessionId)
      const total = sv.reduce((sum, v) => sum + v.headcount, 0)
      const children = sv.filter(v => v.isChildGroup).reduce((sum, v) => sum + v.headcount, 0)
      const withAccessibility = sv.filter(v => v.accessibilityNeeds.length > 0).length
      const late = sv.filter(v => v.isLate).length
      const blacklisted = sv.filter(v => v.isBlacklisted).length
      const withSpecialNeeds = sv.filter(v =>
        v.isChildGroup && v.childProfiles.some(c => c.specialNeeds.length > 0)
      ).length
      return { total, adults: total - children, children, withAccessibility, late, blacklisted, withSpecialNeeds, count: sv.length }
    }
  })

  const blacklistedVisitors = computed(() => visitors.value.filter(v => v.isBlacklisted))

  function getVisitorByIdCard(idCardNumber: string): Visitor | undefined {
    return visitors.value.find(v => v.idCardNumber === idCardNumber)
  }

  function getVisitorById(visitorId: string): Visitor | undefined {
    return visitors.value.find(v => v.id === visitorId)
  }

  function addVisitor(visitor: Omit<Visitor, 'id' | 'createdAt'>) {
    const newVisitor: Visitor = {
      ...visitor,
      id: `v${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    visitors.value.push(newVisitor)
    return newVisitor
  }

  function updateVisitor(visitorId: string, updates: Partial<Visitor>) {
    const idx = visitors.value.findIndex(v => v.id === visitorId)
    if (idx >= 0) {
      visitors.value[idx] = { ...visitors.value[idx], ...updates }
      return visitors.value[idx]
    }
    return null
  }

  function markLate(visitorId: string, minutes: number) {
    const v = visitors.value.find(v => v.id === visitorId)
    if (v) {
      v.isLate = true
      v.lateMinutes = minutes
    }
  }

  function markBlacklisted(visitorId: string, reason: string) {
    const v = visitors.value.find(v => v.id === visitorId)
    if (v) {
      v.isBlacklisted = true
      v.blacklistReason = reason
    }
  }

  function unmarkBlacklisted(visitorId: string) {
    const v = visitors.value.find(v => v.id === visitorId)
    if (v) {
      v.isBlacklisted = false
      v.blacklistReason = undefined
    }
  }

  function incrementComplaint(visitorId: string) {
    const v = visitors.value.find(v => v.id === visitorId)
    if (v) {
      v.complaintCount = (v.complaintCount || 0) + 1
    }
  }

  function addChildProfile(visitorId: string, child: Omit<ChildProfile, 'id'>) {
    const v = visitors.value.find(v => v.id === visitorId)
    if (v) {
      const newChild: ChildProfile = {
        ...child,
        id: `cp${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      }
      v.childProfiles.push(newChild)
      return newChild
    }
    return null
  }

  function updateChildProfile(visitorId: string, childId: string, updates: Partial<ChildProfile>) {
    const v = visitors.value.find(v => v.id === visitorId)
    if (v) {
      const idx = v.childProfiles.findIndex(c => c.id === childId)
      if (idx >= 0) {
        v.childProfiles[idx] = { ...v.childProfiles[idx], ...updates }
        return v.childProfiles[idx]
      }
    }
    return null
  }

  function removeChildProfile(visitorId: string, childId: string) {
    const v = visitors.value.find(v => v.id === visitorId)
    if (v) {
      const idx = v.childProfiles.findIndex(c => c.id === childId)
      if (idx >= 0) {
        v.childProfiles.splice(idx, 1)
      }
    }
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function setFilterSessionId(sessionId: string) {
    filterSessionId.value = sessionId
  }

  function getRelocationsByVisitor(visitorId: string) {
    return relocationRecords.value.filter(r => r.visitorId === visitorId)
  }

  function getRelocationsBySession(sessionId: string) {
    return relocationRecords.value.filter(r => r.originalSessionId === sessionId || r.newSessionId === sessionId)
  }

  function addRelocation(relocation: Omit<RelocationRecord, 'id' | 'createdAt'>) {
    const newRecord: RelocationRecord = {
      ...relocation,
      id: `rr${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    relocationRecords.value.push(newRecord)

    if (relocation.type === 'next-session' && relocation.newSessionId) {
      const visitor = visitors.value.find(v => v.id === relocation.visitorId)
      if (visitor) {
        visitor.sessionId = relocation.newSessionId
        visitor.isLate = false
        visitor.lateMinutes = 0
      }
    } else if (relocation.type === 'tail-join') {
      const visitor = visitors.value.find(v => v.id === relocation.visitorId)
      if (visitor) {
        visitor.isLate = true
      }
    } else if (relocation.type === 'audio-guide') {
      const visitor = visitors.value.find(v => v.id === relocation.visitorId)
      if (visitor) {
        visitor.sessionId = ''
      }
    }

    return newRecord
  }

  return {
    visitors,
    searchQuery,
    filterSessionId,
    relocationRecords,
    filteredVisitors,
    visitorsBySession,
    visitorStatsBySession,
    blacklistedVisitors,
    getVisitorByIdCard,
    getVisitorById,
    addVisitor,
    updateVisitor,
    markLate,
    markBlacklisted,
    unmarkBlacklisted,
    incrementComplaint,
    addChildProfile,
    updateChildProfile,
    removeChildProfile,
    setSearchQuery,
    setFilterSessionId,
    getRelocationsByVisitor,
    getRelocationsBySession,
    addRelocation,
  }
})
