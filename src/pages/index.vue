<template>
  <LoginForm />
</template>

<script setup>
  import LoginForm from '@/components/Login.vue'

  definePage({ meta: { layout: 'auth' } })
</script>
