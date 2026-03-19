<script setup>
import { definePage } from 'unplugin-vue-router/runtime'
import RHAsistencia from '@/components/rh/RHAsistencia.vue'
definePage({ meta: { layout: 'auth' } })
</script>

<template>
  <RHAsistencia />
</template>
