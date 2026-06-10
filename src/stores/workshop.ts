import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Workshop, WorkshopMaterial, WorkshopBooking, WorkshopMaterialCheckResult } from '@/types'
import { workshops as mockWorkshops, workshopMaterials as mockMaterials, workshopBookings as mockBookings } from '@/mock/data'

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

  const confirmedBookingsByWorkshop = computed(() => {
    return (workshopId: string) => bookings.value.filter(b => b.workshopId === workshopId && b.confirmed)
  })

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
    const confirmed = confirmedBookingsByWorkshop.value(workshopId).length
    const available = workshop.capacity - confirmed
    return { canBook: available > 0, availableSpots: available }
  }

  function addBooking(booking: Omit<WorkshopBooking, 'id' | 'createdAt'>) {
    const newBooking: WorkshopBooking = {
      ...booking,
      id: `wb${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    bookings.value.push(newBooking)
    if (newBooking.confirmed) {
      const workshop = getWorkshopById(booking.workshopId)
      if (workshop) {
        workshop.booked += 1
      }
    }
    return newBooking
  }

  function confirmBooking(bookingId: string) {
    const booking = bookings.value.find(b => b.id === bookingId)
    if (booking && !booking.confirmed) {
      booking.confirmed = true
      const workshop = getWorkshopById(booking.workshopId)
      if (workshop) {
        workshop.booked += 1
      }
    }
  }

  function cancelBooking(bookingId: string) {
    const idx = bookings.value.findIndex(b => b.id === bookingId)
    if (idx >= 0) {
      const booking = bookings.value[idx]
      if (booking.confirmed) {
        const workshop = getWorkshopById(booking.workshopId)
        if (workshop) {
          workshop.booked = Math.max(0, workshop.booked - 1)
        }
      }
      bookings.value.splice(idx, 1)
    }
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
    confirmedBookingsByWorkshop,
    getWorkshopById,
    getMaterialById,
    getMaterialByName,
    checkMaterials,
    checkAge,
    checkCapacity,
    addBooking,
    confirmBooking,
    cancelBooking,
    useMaterials,
    returnMaterials,
  }
})
