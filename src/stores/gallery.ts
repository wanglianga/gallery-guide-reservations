import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Gallery } from '@/types'
import { galleries as mockGalleries } from '@/mock/data'

export const useGalleryStore = defineStore('gallery', () => {
  const galleries = ref<Gallery[]>([...mockGalleries])

  function getGalleryById(id: string) {
    return galleries.value.find(g => g.id === id)
  }

  function getOccupancyRate(gallery: Gallery) {
    return gallery.capacity > 0 ? gallery.currentCount / gallery.capacity : 0
  }

  function getOccupancyLevel(gallery: Gallery): 'normal' | 'warning' | 'critical' {
    const rate = getOccupancyRate(gallery)
    if (rate >= 1) return 'critical'
    if (rate >= 0.9) return 'warning'
    return 'normal'
  }

  function updateCurrentCount(galleryId: string, delta: number) {
    const gallery = galleries.value.find(g => g.id === galleryId)
    if (gallery) {
      gallery.currentCount = Math.max(0, Math.min(gallery.capacity, gallery.currentCount + delta))
    }
  }

  return { galleries, getGalleryById, getOccupancyRate, getOccupancyLevel, updateCurrentCount }
})
