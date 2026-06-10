import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Feedback } from '@/types'
import { feedbacks as mockFeedbacks } from '@/mock/data'

export const useFeedbackStore = defineStore('feedback', () => {
  const feedbacks = ref<Feedback[]>([...mockFeedbacks])

  function getFeedbacksBySession(sessionId: string) {
    return feedbacks.value.filter(f => f.sessionId === sessionId)
  }

  function getFeedbacksByGuide(guideId: string) {
    return feedbacks.value.filter(f => f.guideId === guideId)
  }

  function addFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>) {
    const newFeedback: Feedback = {
      ...feedback,
      id: `f${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    feedbacks.value.push(newFeedback)
    return newFeedback
  }

  return { feedbacks, getFeedbacksBySession, getFeedbacksByGuide, addFeedback }
})
