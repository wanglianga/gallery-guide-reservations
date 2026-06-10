import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GalleryTimeSlot, SlotStatus, OverCapacityAction, GroupReservation } from '@/types'
import { galleryTimeSlots as mockSlots } from '@/mock/data'

export const useGalleryFlowStore = defineStore('galleryFlow', () => {
  const timeSlots = ref<GalleryTimeSlot[]>([...mockSlots])

  function getSlotsByDateAndGallery(date: string, galleryId: string) {
    return timeSlots.value
      .filter(s => s.date === date && s.galleryId === galleryId)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  function getSlotsByDate(date: string) {
    return timeSlots.value
      .filter(s => s.date === date)
      .sort((a, b) => {
        const gc = a.galleryId.localeCompare(b.galleryId)
        if (gc !== 0) return gc
        return a.startTime.localeCompare(b.startTime)
      })
  }

  function totalBooked(slot: GalleryTimeSlot) {
    return slot.individualBooked + slot.groupBooked
  }

  function occupancyRate(slot: GalleryTimeSlot) {
    return slot.capacity > 0 ? totalBooked(slot) / slot.capacity : 0
  }

  function getSlotStatus(slot: GalleryTimeSlot): SlotStatus {
    const rate = occupancyRate(slot)
    if (rate >= 1) return 'full'
    if (rate >= 0.85) return 'warning'
    return 'available'
  }

  const slotStatusLabel: Record<SlotStatus, { text: string; class: string }> = {
    available: { text: '可预约', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    warning: { text: '即将满员', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    full: { text: '已满员', class: 'bg-rose-50 text-rose-700 border-rose-200' },
  }

  const uniqueDates = computed(() => {
    const set = new Set<string>()
    timeSlots.value.forEach(s => set.add(s.date))
    return Array.from(set).sort()
  })

  const uniqueGalleryIds = computed(() => {
    const set = new Set<string>()
    timeSlots.value.forEach(s => set.add(s.galleryId))
    return Array.from(set).sort()
  })

  function canBook(slot: GalleryTimeSlot, headcount: number, source: 'individual' | 'group') {
    const current = totalBooked(slot)
    const remain = slot.capacity - current
    return remain >= headcount
  }

  function getOverCapacityActions(slot: GalleryTimeSlot): OverCapacityAction[] {
    return ['suggest-next', 'self-guided']
  }

  function findNextAvailableSlot(date: string, galleryId: string, fromStartTime: string): GalleryTimeSlot | null {
    const slots = getSlotsByDateAndGallery(date, galleryId)
    for (const s of slots) {
      if (s.startTime > fromStartTime && getSlotStatus(s) !== 'full') {
        return s
      }
    }
    return null
  }

  function addIndividualBooking(slotId: string, headcount: number) {
    const slot = timeSlots.value.find(s => s.id === slotId)
    if (slot) {
      const remain = slot.capacity - totalBooked(slot)
      if (remain >= headcount) {
        slot.individualBooked += headcount
        return true
      }
    }
    return false
  }

  function addGroupReservation(slotId: string, reservation: Omit<GroupReservation, 'id'>) {
    const slot = timeSlots.value.find(s => s.id === slotId)
    if (!slot) return false
    const remain = slot.capacity - totalBooked(slot)
    if (remain < reservation.headcount) return false
    const newRes: GroupReservation = {
      ...reservation,
      id: `gr${Date.now()}`,
    }
    slot.groupReservations.push(newRes)
    slot.groupBooked += reservation.headcount
    return true
  }

  function removeGroupReservation(slotId: string, reservationId: string) {
    const slot = timeSlots.value.find(s => s.id === slotId)
    if (!slot) return
    const idx = slot.groupReservations.findIndex(r => r.id === reservationId)
    if (idx >= 0) {
      const removed = slot.groupReservations.splice(idx, 1)[0]
      slot.groupBooked = Math.max(0, slot.groupBooked - removed.headcount)
    }
  }

  function toggleGroupConfirmed(slotId: string, reservationId: string) {
    const slot = timeSlots.value.find(s => s.id === slotId)
    if (!slot) return
    const res = slot.groupReservations.find(r => r.id === reservationId)
    if (res) {
      res.confirmed = !res.confirmed
    }
  }

  const overCapacityActionLabel: Record<OverCapacityAction, { text: string; desc: string; icon: string }> = {
    'suggest-next': { text: '建议下一场', desc: '推荐后续空闲时段', icon: '⏭' },
    'self-guided': { text: '改为自助导览', desc: '提供语音导览设备', icon: '🎧' },
  }

  return {
    timeSlots,
    uniqueDates,
    uniqueGalleryIds,
    slotStatusLabel,
    overCapacityActionLabel,
    getSlotsByDateAndGallery,
    getSlotsByDate,
    totalBooked,
    occupancyRate,
    getSlotStatus,
    canBook,
    getOverCapacityActions,
    findNextAvailableSlot,
    addIndividualBooking,
    addGroupReservation,
    removeGroupReservation,
    toggleGroupConfirmed,
  }
})
