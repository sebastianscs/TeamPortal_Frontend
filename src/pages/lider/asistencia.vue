<script setup>
import { definePage } from 'unplugin-vue-router/runtime'
import LiderAsistencia from '@/components/lider/LiderAsistencia.vue'
definePage({ meta: { layout: 'auth' } })
</script>

<template>
  <LiderAsistencia />
</template>
