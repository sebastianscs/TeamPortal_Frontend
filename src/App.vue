<template>
  <v-app>
    <AppNav v-if="authStore.isLoggedIn" />

    <v-main>
      <router-view />
    </v-main>

    <v-snackbar
      v-model="authStore.sessionWarning"
      color="warning"
      location="bottom right"
      :timeout="-1"
    >
      <v-icon class="mr-2">mdi-clock-alert-outline</v-icon>
      Tu sesión está por vencer. ¿Deseas renovarla?

      <template #actions>
        <v-btn
          :loading="refreshing"
          variant="text"
          @click="renovar"
        >
          Renovar sesión
        </v-btn>
        <v-btn
          variant="text"
          @click="authStore.sessionWarning = false"
        >
          Ignorar
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const refreshing = ref(false)

  onMounted(() => {
    authStore.setupSessionTimers()
  })

  async function renovar () {
    refreshing.value = true
    await authStore.refreshSession()
    refreshing.value = false
  }
</script>
