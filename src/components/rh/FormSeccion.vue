<template>
  <v-card color="surface" rounded="lg" variant="flat">
    <div class="px-4 pt-3 pb-2 d-flex align-center gap-2">
      <span class="text-caption text-uppercase font-weight-bold">{{ titulo }}</span>
      <v-chip v-if="subtitulo" color="primary" density="compact" size="x-small" variant="tonal">
        {{ subtitulo }}
      </v-chip>
    </div>
    <v-divider />
    <div class="pa-3">
      <slot />
    </div>
  </v-card>
</template>

<script setup>
defineProps({ titulo: String, subtitulo: String })
</script>
