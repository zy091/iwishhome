<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.initializeAuth()
})

</script>

<template>
  <RouterView/>
</template>

<style scoped>

</style>
