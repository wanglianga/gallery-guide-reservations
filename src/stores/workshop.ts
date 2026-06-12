import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Workshop,
  WorkshopMaterial,
  WorkshopBooking,
  WorkshopMaterialCheckResult,
  SpecialNeed,
  BookingWeightResult,
  IdCardDuplicateCheck,
  BookingLockInfo,
} from '@/types'
import { workshops as mockWorkshops, workshopMaterials as mockMaterials, workshopBookings as mockBookings } from '@/mock/data'
import { useBookingStore } from '@/stores/booking'
import { useVisitorStore } from '@/stores/visitor'

export const useWorkshopStore = defineStore('workshop', () => {
  const workshops = ref<Workshop[]>([...mockWorkshops])
  const materials = ref<WorkshopMaterial[]>([...mockMaterials])
  const bookings = ref<WorkshopBooking[]>([...mockBookings])

  const workshopsBySession = computed(() => {
    return (sessionId: string) => workshops.value.filter(w => w.sessionId === sessionId)
  })

  const getWorkshopById = (id: string) => {
    return workshops.value.find(w => w.id === id)
  }

  const getMaterialById = (id: string) => {
    return materials.value.find(m => m.id === id)
  }

  const getMaterialByName = (name: string) => {
    return materials.value.find(m => m.name === name)
  }

  const bookingsByWorkshop = computed(() => {
    return (workshopId: string) => bookings.value.filter(b => b.workshopId === workshopId)
  })

  const bookingsByVisitor = computed(() => {
    return (visitorId: string) => bookings.value.filter(b => b.visitorId === visitorId)
  })

  const bookingsByIdCard = computed(() => {
    return (idCardNumber: string) => bookings.value.filter(
      b => b.idCardNumber === idCardNumber && !b.cancelledAt
    )
  })

  const confirmedBookingsByWorkshop = computed(() => {
    return (workshopId: string) => {
      const all = bookings.value.filter(b => b.workshopId === workshopId && b.confirmed && !b.cancelledAt)
      return all.sort((a, b) => {
        if (a.queuePriority !== b.queuePriority) return a.queuePriority - b.queuePriority
        return a.weightScore - b.weightScore
      })
    }
  })

  const pendingBookingsByWorkshop = computed(() => {
    return (workshopId: string) => bookings.value.filter(b => b.workshopId === workshopId && !b.confirmed && !b.cancelledAt)
  })

  const getConfirmedCountByWorkshop = (workshopId: string) => {
    return confirmedBookingsByWorkshop.value(workshopId).length
  }

  function checkMaterials(workshopId: string, count: number): WorkshopMaterialCheckResult {
    const workshop = getWorkshopById(workshopId)
    if (!workshop) return { hasAllMaterials: false, missingMaterials: [] }

    const missing: string[] = []
    for (const matId of workshop.materialIds) {
      const mat = getMaterialById(matId)
      if (!mat) {
        missing.push('未知材料')
        continue
      }
      const available = mat.total - mat.used
      if (available < count) {
        missing.push(mat.name)
      }
    }
    return { hasAllMaterials: missing.length === 0, missingMaterials: missing }
  }

  function checkAge(workshopId: string, age: number): boolean {
    const workshop = getWorkshopById(workshopId)
    if (!workshop) return false
    return age >= workshop.minAge && age <= workshop.maxAge
  }

  function checkCapacity(workshopId: string): { canBook: boolean; availableSpots: number } {
    const workshop = getWorkshopById(workshopId)
    if (!workshop) return { canBook: false, availableSpots: 0 }
    const confirmed = getConfirmedCountByWorkshop(workshopId)
    const available = workshop.capacity - confirmed
    return { canBook: available > 0, availableSpots: available }
  }

  function calculateWeight(visitorId: string, idCardNumber: string): BookingWeightResult {
    const bookingStore = useBookingStore()
    return bookingStore.calculateBookingWeight(visitorId, idCardNumber)
  }

  function checkIdCardDuplicateForWorkshop(
    idCardNumber: string,
    workshopId: string,
    excludeBookingId?: string
  ): IdCardDuplicateCheck {
    const workshop = getWorkshopById(workshopId)
    if (!workshop) {
      return { isDuplicate: false, duplicateBookings: [], willCancelCurrent: false }
    }

    const duplicateBookings: IdCardDuplicateCheck['duplicateBookings'] = []
    const sameIdBookings = bookings.value.filter(b => {
      if (excludeBookingId && b.id === excludeBookingId) return false
      if (b.idCardNumber !== idCardNumber) return false
      if (b.cancelledAt) return false
      return true
    })

    const allBookingsWithTime: Array<{
      id: string
      type: 'session' | 'workshop'
      startTime: string
      venueId: string
      title: string
      isCurrent: boolean
    }> = []

    for (const b of sameIdBookings) {
      const w = getWorkshopById(b.workshopId)
      if (w) {
        allBookingsWithTime.push({
          id: b.id,
          type: 'workshop',
          startTime: w.startTime,
          venueId: w.classroom,
          title: w.title,
          isCurrent: b.workshopId === workshopId,
        })
        duplicateBookings.push({
          id: b.id,
          type: 'workshop',
          startTime: w.startTime,
          venueId: w.classroom,
          title: w.title,
        })
      }
    }

    const bookingStore = useBookingStore()
    for (const sb of bookingStore.sessionBookings) {
      if (sb.idCardNumber !== idCardNumber) continue
      if (sb.cancelledAt) continue
      duplicateBookings.push({
        id: sb.id,
        type: 'session',
        startTime: sb.createdAt,
        venueId: sb.sessionId,
        title: `导览场次 ${sb.sessionId}`,
      })
    }

    allBookingsWithTime.push({
      id: '__current__',
      type: 'workshop',
      startTime: workshop.startTime,
      venueId: workshop.classroom,
      title: workshop.title,
      isCurrent: true,
    })

    allBookingsWithTime.sort((a, b) => a.startTime.localeCompare(b.startTime))
    const earliestIdx = allBookingsWithTime.findIndex(b => b.isCurrent)
    const willCancelCurrent = earliestIdx !== 0

    const earliest = allBookingsWithTime[0]

    return {
      isDuplicate: duplicateBookings.length > 0,
      duplicateBookings,
      earliestBooking: earliest && earliest.id !== '__current__'
        ? { id: earliest.id, type: earliest.type, startTime: earliest.startTime }
        : undefined,
      willCancelCurrent,
    }
  }

  function deduplicateWorkshopBookings(idCardNumber: string): string[] {
    const cancelledIds: string[] = []
    const allBookings = bookings.value
      .filter(b => b.idCardNumber === idCardNumber && !b.cancelledAt)
      .map(b => {
        const w = getWorkshopById(b.workshopId)
        return {
          booking: b,
          startTime: w?.startTime || b.createdAt,
        }
      })

    if (allBookings.length <= 1) return cancelledIds

    allBookings.sort((a, b) => a.startTime.localeCompare(b.startTime))

    for (let i = 1; i < allBookings.length; i++) {
      allBookings[i].booking.cancelledAt = new Date().toISOString()
      cancelledIds.push(allBookings[i].booking.id)
    }

    return cancelledIds
  }

  function checkBookingLock(
    idCardNumber: string,
    workshopId: string
  ): { locked: boolean; lockInfo: BookingLockInfo | null } {
    const workshop = getWorkshopById(workshopId)
    if (!workshop) return { locked: false, lockInfo: null }

    const bookingStore = useBookingStore()
    const lockInfo = bookingStore.getLockInfoForVenue(
      idCardNumber,
      workshop.classroom,
      workshop.startTime
    )

    return { locked: !!lockInfo, lockInfo }
  }

  interface AddSmartBookingParams {
    workshopId: string
    visitorId: string
    idCardNumber: string
    childName: string
    childAge: number
    childSpecialNeeds?: SpecialNeed[]
    autoDeduplicate?: boolean
  }

  function addSmartBooking(params: AddSmartBookingParams): {
    success: boolean
    booking?: WorkshopBooking
    weightResult: BookingWeightResult
    duplicateCheck: IdCardDuplicateCheck
    lockCheck: { locked: boolean; lockInfo: BookingLockInfo | null }
    cancelledBookings?: string[]
    warnings: string[]
  } {
    const warnings: string[] = []
    const bookingStore = useBookingStore()
    const visitorStore = useVisitorStore()

    const workshop = getWorkshopById(params.workshopId)
    const visitor = visitorStore.getVisitorById(params.visitorId)

    if (!workshop) {
      return {
        success: false,
        weightResult: {} as BookingWeightResult,
        duplicateCheck: { isDuplicate: false, duplicateBookings: [], willCancelCurrent: false },
        lockCheck: { locked: false, lockInfo: null },
        warnings: ['课程不存在'],
      }
    }

    const weightResult = calculateWeight(params.visitorId, params.idCardNumber)

    if (weightResult.isBlacklisted) {
      warnings.push('该观众在黑名单中，需经管理员审批方可预约')
    }

    const duplicateCheck = checkIdCardDuplicateForWorkshop(
      params.idCardNumber,
      params.workshopId
    )

    let cancelledBookings: string[] | undefined
    if (duplicateCheck.isDuplicate) {
      if (params.autoDeduplicate) {
        cancelledBookings = deduplicateWorkshopBookings(params.idCardNumber)
        warnings.push(`检测到重复预约，已自动保留最早场次，取消了 ${cancelledBookings.length} 个重复预约`)
      } else if (duplicateCheck.willCancelCurrent) {
        warnings.push('该身份证号已有更早的预约记录，若继续提交将保留最早的场次')
      }
    }

    const lockCheck = checkBookingLock(params.idCardNumber, params.workshopId)
    if (lockCheck.locked && lockCheck.lockInfo) {
      warnings.push(lockCheck.lockInfo.reason)
    }

    const depositAmount = bookingStore.getDepositAmount(weightResult)
    const depositMultiplier = weightResult.needDoubleDeposit ? 2 : 1

    if (weightResult.needDoubleDeposit) {
      warnings.push(`由于历史行为记录，需缴纳双倍押金 ¥${depositAmount}（标准 ¥${bookingStore.weightConfig.standardDeposit}）`)
    }

    if (weightResult.queuePriority === 2) {
      warnings.push('权重较低，排位将在正常预约观众之后')
    }

    const matCheck = checkMaterials(params.workshopId, 1)
    const capCheck = checkCapacity(params.workshopId)
    const hasAllMaterials = matCheck.hasAllMaterials
    const confirmed = hasAllMaterials && capCheck.canBook && !lockCheck.locked

    const newBooking: WorkshopBooking = {
      id: `wb${Date.now()}`,
      workshopId: params.workshopId,
      visitorId: params.visitorId,
      idCardNumber: params.idCardNumber,
      childName: params.childName,
      childAge: params.childAge,
      childSpecialNeeds: params.childSpecialNeeds || [],
      hasAllMaterials,
      missingMaterials: matCheck.missingMaterials,
      confirmed,
      depositAmount,
      depositMultiplier,
      queuePosition: 0,
      queuePriority: weightResult.queuePriority,
      weightScore: weightResult.weight,
      attendanceStatus: 'attended',
      createdAt: new Date().toISOString(),
    }

    const pendingSamePriority = bookings.value.filter(
      b => b.workshopId === params.workshopId &&
        !b.confirmed &&
        !b.cancelledAt &&
        b.queuePriority === weightResult.queuePriority
    )
    newBooking.queuePosition = pendingSamePriority.length + 1

    bookings.value.push(newBooking)

    if (confirmed) {
      useMaterials(params.workshopId, 1)
      bookingStore.createBookingLock(
        params.idCardNumber,
        newBooking.id,
        'workshop',
        workshop.startTime,
        workshop.endTime,
        [workshop.classroom]
      )

      if (visitor && visitor.isChildGroup && visitor.childProfiles.length > 0) {
        if (workshop.sessionId) {
          const sessionBooking = {
            id: `sb_ws_${newBooking.id}`,
            sessionId: workshop.sessionId,
            visitorId: params.visitorId,
            idCardNumber: params.idCardNumber,
            headcount: 1,
            confirmed: true,
            depositAmount,
            depositMultiplier,
            queuePosition: 0,
            weightScore: weightResult.weight,
            attendanceStatus: 'attended' as const,
            createdAt: new Date().toISOString(),
          }
          bookingStore.sessionBookings.push(sessionBooking)

          bookingStore.createGuideAttentionItems(
            workshop.sessionId,
            '',
            params.visitorId,
            visitor.name,
            visitor.childProfiles
          )
          bookingStore.createCapacityReservations(
            workshop.sessionId,
            params.visitorId,
            visitor.childProfiles
          )
        }
      }
    }

    return {
      success: true,
      booking: newBooking,
      weightResult,
      duplicateCheck,
      lockCheck,
      cancelledBookings,
      warnings,
    }
  }

  function addBooking(booking: Omit<WorkshopBooking, 'id' | 'createdAt'>) {
    const newBooking: WorkshopBooking = {
      ...booking,
      id: `wb${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    bookings.value.push(newBooking)
    return newBooking
  }

  function updateBookingMaterials(bookingId: string, materialCheck: WorkshopMaterialCheckResult) {
    const booking = bookings.value.find(b => b.id === bookingId)
    if (booking) {
      booking.hasAllMaterials = materialCheck.hasAllMaterials
      booking.missingMaterials = materialCheck.missingMaterials
    }
  }

  function confirmBooking(bookingId: string): boolean {
    const booking = bookings.value.find(b => b.id === bookingId)
    if (!booking || booking.confirmed) return false
    if (booking.cancelledAt) return false
    if (!booking.hasAllMaterials || booking.missingMaterials.length > 0) return false
    const cap = checkCapacity(booking.workshopId)
    if (!cap.canBook) return false

    const lockCheck = checkBookingLock(booking.idCardNumber, booking.workshopId)
    if (lockCheck.locked) return false

    booking.confirmed = true
    useMaterials(booking.workshopId, 1)

    const workshop = getWorkshopById(booking.workshopId)
    const bookingStore = useBookingStore()
    const visitorStore = useVisitorStore()
    const visitor = visitorStore.getVisitorById(booking.visitorId)

    if (workshop) {
      bookingStore.createBookingLock(
        booking.idCardNumber,
        booking.id,
        'workshop',
        workshop.startTime,
        workshop.endTime,
        [workshop.classroom]
      )

      if (visitor && visitor.isChildGroup && visitor.childProfiles.length > 0 && workshop.sessionId) {
        bookingStore.createGuideAttentionItems(
          workshop.sessionId,
          '',
          booking.visitorId,
          visitor.name,
          visitor.childProfiles
        )
        bookingStore.createCapacityReservations(
          workshop.sessionId,
          booking.visitorId,
          visitor.childProfiles
        )
      }
    }

    return true
  }

  function cancelBooking(bookingId: string) {
    const booking = bookings.value.find(b => b.id === bookingId)
    if (!booking) return

    booking.cancelledAt = new Date().toISOString()
    booking.confirmed = false

    if (booking.confirmed) {
      returnMaterials(booking.workshopId, 1)
    }

    const bookingStore = useBookingStore()
    bookingStore.removeBookingLock(bookingId)
  }

  function useMaterials(workshopId: string, count: number) {
    const workshop = getWorkshopById(workshopId)
    if (!workshop) return
    for (const matId of workshop.materialIds) {
      const mat = getMaterialById(matId)
      if (mat) {
        mat.used = Math.min(mat.total, mat.used + count)
      }
    }
  }

  function returnMaterials(workshopId: string, count: number) {
    const workshop = getWorkshopById(workshopId)
    if (!workshop) return
    for (const matId of workshop.materialIds) {
      const mat = getMaterialById(matId)
      if (mat) {
        mat.used = Math.max(0, mat.used - count)
      }
    }
  }

  return {
    workshops,
    materials,
    bookings,
    workshopsBySession,
    bookingsByWorkshop,
    bookingsByVisitor,
    bookingsByIdCard,
    confirmedBookingsByWorkshop,
    pendingBookingsByWorkshop,
    getConfirmedCountByWorkshop,
    getWorkshopById,
    getMaterialById,
    getMaterialByName,
    checkMaterials,
    checkAge,
    checkCapacity,
    calculateWeight,
    checkIdCardDuplicateForWorkshop,
    deduplicateWorkshopBookings,
    checkBookingLock,
    addSmartBooking,
    addBooking,
    updateBookingMaterials,
    confirmBooking,
    cancelBooking,
    useMaterials,
    returnMaterials,
  }
})
