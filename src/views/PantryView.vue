<script setup lang="ts">
import DataStrip from '@/components/ui/DataStrip.vue'
import PantryManager from '@/components/pantry/PantryManager.vue'
import CookMatches from '@/components/pantry/CookMatches.vue'
import { useOpenRecipe } from '@/composables/useOpenRecipe'

const openRecipe = useOpenRecipe()
</script>

<template>
  <div class="space-y-16">
    <DataStrip />
    <PantryManager />
    <CookMatches @open-recipe="openRecipe" />
  </div>
</template>
