<script setup>
import { definePage } from 'unplugin-vue-router/runtime'
import RHRotacion from '@/components/rh/RHRotacion.vue'

definePage({ meta: { layout: 'auth' } })
</script>

<template>
  <v-container fluid class="pa-6">
    <div class="text-h5 font-weight-bold mb-1">Análisis de rotación</div>
    <div class="text-body-2 text-medium-emphasis mb-6">Registro de bajas y métricas de rotación del personal</div>
    <RHRotacion />
  </v-container>
</template>
