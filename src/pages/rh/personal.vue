<script setup>
import { definePage } from 'unplugin-vue-router/runtime'
import RHPersonal from '@/components/rh/RHPersonal.vue'

definePage({ meta: { layout: 'auth' } })
</script>

<template>
  <RHPersonal />
</template>
