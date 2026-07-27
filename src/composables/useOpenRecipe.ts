import { useRouter } from 'vue-router'
import { useStatsStore } from '@/stores/stats'
import { useAudio } from '@/composables/useAudio'

/**
 * Open the route-addressable recipe detail (`/recipe/:id`) — the modal
 * renders over the page — recording the view and playing the click sound.
 */
export function useOpenRecipe(): (id: string) => void {
  const router = useRouter()
  const statsStore = useStatsStore()
  const audio = useAudio()

  return (id: string) => {
    statsStore.recordRecipeView()
    audio.playClick()
    void router.push({ name: 'recipe', params: { id } })
  }
}
