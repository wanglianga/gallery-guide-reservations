import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Visitor, AccessibilityNeed, SessionLanguage, RelocationRecord, RelocationType } from '@/types'
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
      result = result.filter(v => v.name.toLowerCase().includes(q) || v.phone.includes(q))
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
      return { total, adults: total - children, children, withAccessibility, late, count: sv.length }
    }
  })

  function addVisitor(visitor: Omit<Visitor, 'id' | 'createdAt'>) {
    const newVisitor: Visitor = {
      ...visitor,
      id: `v${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    visitors.value.push(newVisitor)
    return newVisitor
  }

  function markLate(visitorId: string, minutes: number) {
    const v = visitors.value.find(v => v.id === visitorId)
    if (v) {
      v.isLate = true
      v.lateMinutes = minutes
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

  return { visitors, searchQuery, filterSessionId, relocationRecords, filteredVisitors, visitorsBySession, visitorStatsBySession, addVisitor, markLate, setSearchQuery, setFilterSessionId, getRelocationsByVisitor, getRelocationsBySession, addRelocation }
})
