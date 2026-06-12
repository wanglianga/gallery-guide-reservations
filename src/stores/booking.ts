import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  BehaviorRecord,
  BookingWeightResult,
  BookingLockInfo,
  IdCardDuplicateCheck,
  GuideAttentionItem,
  CapacityReservation,
  SessionBooking,
  SpecialNeed,
  ChildProfile,
} from '@/types'
import { behaviorRecords as mockBehaviorRecords, guideAttentionItems as mockAttentionItems, capacityReservations as mockCapacityReservations, sessionBookings as mockSessionBookings } from '@/mock/data'

const WEIGHT_CONFIG = {
  baseScore: 100,
  absencePenalty: 15,
  latePenaltyPer10min: 5,
  lateMaxPenalty: 20,
  complaintPenalty: 25,
  blacklistPenalty: 100,
  threshold: 60,
  maxHistoryDays: 30,
  lockHours: 2,
  standardDeposit: 50,
}

export const useBookingStore = defineStore('booking', () => {
  const behaviorRecords = ref<BehaviorRecord[]>([...mockBehaviorRecords])
  const bookingLocks = ref<BookingLockInfo[]>([])
  const guideAttentionItems = ref<GuideAttentionItem[]>([...mockAttentionItems])
  const capacityReservations = ref<CapacityReservation[]>([...mockCapacityReservations])
  const sessionBookings = ref<SessionBooking[]>([...mockSessionBookings])

  function getDateBeforeDays(days: number): Date {
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d
  }

  function isWithin30Days(isoDate: string): boolean {
    const recordDate = new Date(isoDate)
    const cutoff = getDateBeforeDays(WEIGHT_CONFIG.maxHistoryDays)
    return recordDate >= cutoff
  }

  function getRecordsByIdCard(idCardNumber: string): BehaviorRecord[] {
    return behaviorRecords.value.filter(r => r.idCardNumber === idCardNumber)
  }

  function getRecordsByVisitor(visitorId: string): BehaviorRecord[] {
    return behaviorRecords.value.filter(r => r.visitorId === visitorId)
  }

  function calculateBookingWeight(visitorId: string, idCardNumber: string): BookingWeightResult {
    const allRecords = [
      ...getRecordsByIdCard(idCardNumber),
      ...getRecordsByVisitor(visitorId),
    ].filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i)

    const recentRecords = allRecords.filter(r => isWithin30Days(r.recordedAt))

    const absenceCount30d = recentRecords.filter(r => r.type === 'absence').length
    const lateRecords30d = recentRecords.filter(r => r.type === 'late')
    const lateCount30d = lateRecords30d.length
    const complaintCount30d = recentRecords.filter(r => r.type === 'complaint').length

    const visitorRecords = getRecordsByVisitor(visitorId)
    const isBlacklisted = visitorRecords.some(r => r.type === 'violation') &&
      (visitorRecords.filter(r => r.type === 'complaint').length >= 3 ||
        recentRecords.filter(r => r.type === 'absence').length >= 3)

    const baseScore = WEIGHT_CONFIG.baseScore
    const absenceDeduction = absenceCount30d * WEIGHT_CONFIG.absencePenalty
    let lateDeduction = 0
    for (const late of lateRecords30d) {
      const minutes = late.lateMinutes || 0
      const deduction = Math.ceil(minutes / 10) * WEIGHT_CONFIG.latePenaltyPer10min
      lateDeduction += Math.min(deduction, WEIGHT_CONFIG.lateMaxPenalty)
    }
    const complaintDeduction = complaintCount30d * WEIGHT_CONFIG.complaintPenalty
    const blacklistDeduction = isBlacklisted ? WEIGHT_CONFIG.blacklistPenalty : 0

    const weight = Math.max(0, baseScore - absenceDeduction - lateDeduction - complaintDeduction - blacklistDeduction)
    const belowThreshold = weight < WEIGHT_CONFIG.threshold
    const needDoubleDeposit = belowThreshold || isBlacklisted
    const queuePriority = weight >= WEIGHT_CONFIG.threshold ? 1 : 2

    return {
      visitorId,
      idCardNumber,
      weight,
      maxWeight: WEIGHT_CONFIG.baseScore,
      belowThreshold,
      needDoubleDeposit,
      queuePriority,
      absenceCount30d,
      lateCount30d,
      complaintCount30d,
      isBlacklisted,
      breakdown: {
        baseScore,
        absenceDeduction,
        lateDeduction,
        complaintDeduction,
        blacklistDeduction,
      },
    }
  }

  function getActiveLocksByIdCard(idCardNumber: string): BookingLockInfo[] {
    const now = new Date()
    return bookingLocks.value.filter(
      l => l.idCardNumber === idCardNumber && new Date(l.lockedUntil) > now
    )
  }

  function isVenueLocked(idCardNumber: string, venueId: string, targetTime: string): boolean {
    const activeLocks = getActiveLocksByIdCard(idCardNumber)
    const target = new Date(targetTime)
    return activeLocks.some(lock => {
      const lockUntil = new Date(lock.lockedUntil)
      const venueMatch = lock.lockedVenueIds.length === 0 || lock.lockedVenueIds.includes(venueId)
      const timeMatch = target <= lockUntil
      return venueMatch && timeMatch
    })
  }

  function getLockInfoForVenue(idCardNumber: string, venueId: string, targetTime: string): BookingLockInfo | null {
    const activeLocks = getActiveLocksByIdCard(idCardNumber)
    const target = new Date(targetTime)
    return activeLocks.find(lock => {
      const lockUntil = new Date(lock.lockedUntil)
      const venueMatch = lock.lockedVenueIds.length === 0 || lock.lockedVenueIds.includes(venueId)
      const timeMatch = target <= lockUntil
      return venueMatch && timeMatch
    }) || null
  }

  function createBookingLock(
    idCardNumber: string,
    sourceBookingId: string,
    sourceType: 'session' | 'workshop',
    startTime: string,
    endTime: string,
    venueIds: string[]
  ): BookingLockInfo {
    const end = new Date(endTime)
    const lockedUntil = new Date(end.getTime() + WEIGHT_CONFIG.lockHours * 60 * 60 * 1000)

    const lock: BookingLockInfo = {
      idCardNumber,
      lockedUntil: lockedUntil.toISOString(),
      lockedVenueIds: venueIds,
      reason: `已预约${sourceType === 'session' ? '导览' : '课程'}，${WEIGHT_CONFIG.lockHours}小时内其他场馆锁定`,
      sourceBookingId,
      sourceType,
    }

    const existingIdx = bookingLocks.value.findIndex(
      l => l.idCardNumber === idCardNumber && l.sourceBookingId === sourceBookingId
    )
    if (existingIdx >= 0) {
      bookingLocks.value[existingIdx] = lock
    } else {
      bookingLocks.value.push(lock)
    }

    return lock
  }

  function removeBookingLock(sourceBookingId: string) {
    const idx = bookingLocks.value.findIndex(l => l.sourceBookingId === sourceBookingId)
    if (idx >= 0) {
      bookingLocks.value.splice(idx, 1)
    }
  }

  function checkIdCardDuplicate(
    idCardNumber: string,
    currentBookingType: 'session' | 'workshop',
    currentStartTime: string,
    currentVenueId: string,
    excludeBookingId?: string
  ): IdCardDuplicateCheck {
    const duplicates: IdCardDuplicateCheck['duplicateBookings'] = []

    for (const sb of sessionBookings.value) {
      if (excludeBookingId && sb.id === excludeBookingId) continue
      if (sb.idCardNumber !== idCardNumber) continue
      if (sb.cancelledAt) continue

      duplicates.push({
        id: sb.id,
        type: 'session',
        startTime: '',
        venueId: '',
        title: '',
      })
    }

    return {
      isDuplicate: false,
      duplicateBookings: duplicates,
      willCancelCurrent: false,
    }
  }

  function deduplicateIdCardBookings(idCardNumber: string): string[] {
    const cancelledIds: string[] = []

    const allBookings = [
      ...sessionBookings.value
        .filter(b => b.idCardNumber === idCardNumber && !b.cancelledAt)
        .map(b => ({
          id: b.id,
          type: 'session' as const,
          startTime: b.createdAt,
          venueId: '',
          cancel: () => { b.cancelledAt = new Date().toISOString() },
        })),
    ]

    if (allBookings.length <= 1) return cancelledIds

    allBookings.sort((a, b) => a.startTime.localeCompare(b.startTime))

    for (let i = 1; i < allBookings.length; i++) {
      allBookings[i].cancel()
      cancelledIds.push(allBookings[i].id)
    }

    return cancelledIds
  }

  function validateChildSpecialNeeds(childProfiles: ChildProfile[]): {
    hasAllergy: boolean
    hasMobilityIssue: boolean
    allergies: SpecialNeed[]
    mobilityIssues: SpecialNeed[]
    allSpecialNeeds: SpecialNeed[]
    severeCount: number
  } {
    const all: SpecialNeed[] = []
    for (const child of childProfiles) {
      all.push(...child.specialNeeds)
    }
    const allergies = all.filter(s => s.type === 'allergy')
    const mobilityIssues = all.filter(s => s.type === 'mobility' || s.type === 'medical')
    const severeCount = all.filter(s => s.severity === 'severe').length

    return {
      hasAllergy: allergies.length > 0,
      hasMobilityIssue: mobilityIssues.length > 0,
      allergies,
      mobilityIssues,
      allSpecialNeeds: all,
      severeCount,
    }
  }

  function createGuideAttentionItems(
    sessionId: string,
    guideId: string,
    visitorId: string,
    visitorName: string,
    childProfiles: ChildProfile[]
  ): GuideAttentionItem[] {
    const items: GuideAttentionItem[] = []
    const validation = validateChildSpecialNeeds(childProfiles)

    for (const child of childProfiles) {
      for (const need of child.specialNeeds) {
        const typeMap: Record<string, GuideAttentionItem['type']> = {
          'allergy': 'allergy',
          'mobility': 'mobility',
          'visual-impairment': 'other',
          'hearing-impairment': 'hearing',
          'medical': 'medical',
          'other': 'other',
        }

        items.push({
          id: `gai${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          sessionId,
          guideId,
          visitorId,
          visitorName,
          type: typeMap[need.type] || 'other',
          description: `${child.name}: ${need.description}${need.allergyDetail ? `（过敏原：${need.allergyDetail}）` : ''}`,
          severity: need.severity,
          childName: child.name,
          createdAt: new Date().toISOString(),
          acknowledged: false,
        })
      }
    }

    for (const item of items) {
      guideAttentionItems.value.push(item)
    }

    return items
  }

  function createCapacityReservations(
    sessionId: string,
    visitorId: string,
    childProfiles: ChildProfile[]
  ): CapacityReservation[] {
    const reservations: CapacityReservation[] = []
    const validation = validateChildSpecialNeeds(childProfiles)

    if (validation.hasMobilityIssue) {
      const mobilityCount = validation.mobilityIssues.length
      reservations.push({
        id: `cr${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sessionId,
        reason: mobilityCount > 1 ? 'stretcher' : 'wheelchair',
        reservedSpots: Math.max(2, mobilityCount * 2),
        channelWidthReserved: true,
        visitorId,
        description: `行动障碍儿童${mobilityCount}人，预留无障碍通道及额外空间`,
      })
    }

    if (validation.severeCount >= 2) {
      reservations.push({
        id: `cr${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sessionId,
        reason: 'child-group-special',
        reservedSpots: 3,
        channelWidthReserved: false,
        visitorId,
        description: `含${validation.severeCount}名重度特殊需求儿童，需额外预留照看空间`,
      })
    }

    for (const r of reservations) {
      capacityReservations.value.push(r)
    }

    return reservations
  }

  function getAttentionItemsByGuide(guideId: string, sessionId?: string): GuideAttentionItem[] {
    return guideAttentionItems.value.filter(
      i => i.guideId === guideId && (!sessionId || i.sessionId === sessionId)
    )
  }

  function getAttentionItemsBySession(sessionId: string): GuideAttentionItem[] {
    return guideAttentionItems.value.filter(i => i.sessionId === sessionId)
  }

  function acknowledgeAttentionItem(itemId: string) {
    const item = guideAttentionItems.value.find(i => i.id === itemId)
    if (item) {
      item.acknowledged = true
    }
  }

  function getCapacityReservationsBySession(sessionId: string): CapacityReservation[] {
    return capacityReservations.value.filter(r => r.sessionId === sessionId)
  }

  function getTotalReservedCapacity(sessionId: string): { spots: number; channels: number } {
    const reservations = getCapacityReservationsBySession(sessionId)
    return {
      spots: reservations.reduce((sum, r) => sum + r.reservedSpots, 0),
      channels: reservations.filter(r => r.channelWidthReserved).length,
    }
  }

  function addBehaviorRecord(record: Omit<BehaviorRecord, 'id' | 'recordedAt'>) {
    const newRecord: BehaviorRecord = {
      ...record,
      id: `br${Date.now()}`,
      recordedAt: new Date().toISOString(),
    }
    behaviorRecords.value.push(newRecord)
    return newRecord
  }

  function getDepositAmount(weightResult: BookingWeightResult): number {
    const multiplier = weightResult.needDoubleDeposit ? 2 : 1
    return WEIGHT_CONFIG.standardDeposit * multiplier
  }

  const weightConfig = computed(() => ({ ...WEIGHT_CONFIG }))

  return {
    behaviorRecords,
    bookingLocks,
    guideAttentionItems,
    capacityReservations,
    sessionBookings,
    weightConfig,
    calculateBookingWeight,
    getActiveLocksByIdCard,
    isVenueLocked,
    getLockInfoForVenue,
    createBookingLock,
    removeBookingLock,
    checkIdCardDuplicate,
    deduplicateIdCardBookings,
    validateChildSpecialNeeds,
    createGuideAttentionItems,
    createCapacityReservations,
    getAttentionItemsByGuide,
    getAttentionItemsBySession,
    acknowledgeAttentionItem,
    getCapacityReservationsBySession,
    getTotalReservedCapacity,
    addBehaviorRecord,
    getDepositAmount,
    getRecordsByIdCard,
    getRecordsByVisitor,
  }
})
