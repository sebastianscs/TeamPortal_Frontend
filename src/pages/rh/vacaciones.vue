<script setup>
import { definePage } from 'unplugin-vue-router/runtime'
import RHVacaciones from '@/components/rh/RHVacaciones.vue'

definePage({ meta: { layout: 'auth' } })
</script>

<template>
  <v-container fluid class="pa-6">
    <div class="text-h5 font-weight-bold mb-1">Vacaciones</div>
    <div class="text-body-2 text-medium-emphasis mb-6">Gestión de solicitudes de vacaciones del personal</div>
    <RHVacaciones />
  </v-container>
</template>
