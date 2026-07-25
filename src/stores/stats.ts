import { defineStore } from 'pinia'
import { ref } from 'vue'

// Only stats that are actually written by the app live here. The old
// totalFavorites/totalTimeSpent fields had writers that were never called,
// so their displays could only ever show zero — removed (truth over decor).
interface Stats {
  totalSearches: number
  totalRecipesViewed: number
  lastVisit: string | null
}

const STORAGE_KEY = 'culinara-stats'

const defaultStats: Stats = {
  totalSearches: 0,
  totalRecipesViewed: 0,
  lastVisit: null,
}

function loadStats(): Stats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Stats>
      return {
        totalSearches: parsed.totalSearches ?? defaultStats.totalSearches,
        totalRecipesViewed: parsed.totalRecipesViewed ?? defaultStats.totalRecipesViewed,
        lastVisit: parsed.lastVisit ?? defaultStats.lastVisit,
      }
    }
  } catch {
    // Silently handle error
  }
  return defaultStats
}

export const useStatsStore = defineStore('stats', () => {
  const savedStats = loadStats()
  const totalSearches = ref(savedStats.totalSearches)
  const totalRecipesViewed = ref(savedStats.totalRecipesViewed)
  const lastVisit = ref<string | null>(savedStats.lastVisit)

  function recordSearch(): void {
    totalSearches.value++
    lastVisit.value = new Date().toISOString()
    saveStats()
  }

  function recordRecipeView(): void {
    totalRecipesViewed.value++
    saveStats()
  }

  function resetStats(): void {
    totalSearches.value = 0
    totalRecipesViewed.value = 0
    lastVisit.value = null
    saveStats()
  }

  function saveStats(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          totalSearches: totalSearches.value,
          totalRecipesViewed: totalRecipesViewed.value,
          lastVisit: lastVisit.value,
        })
      )
    } catch {
      // Silently handle error
    }
  }

  return {
    totalSearches,
    totalRecipesViewed,
    lastVisit,
    recordSearch,
    recordRecipeView,
    resetStats,
  }
})
