<script setup>
import { definePage } from 'unplugin-vue-router/runtime'
import RHOnboarding from '@/components/rh/RHOnboarding.vue'

definePage({ meta: { layout: 'auth' } })
</script>

<template>
  <v-container fluid class="pa-6">
    <div class="text-h5 font-weight-bold mb-1">Onboarding</div>
    <div class="text-body-2 text-medium-emphasis mb-6">Gestión de tareas de incorporación de nuevos empleados</div>
    <RHOnboarding />
  </v-container>
</template>
