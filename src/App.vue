<template>
  <v-app>
    <AppNav v-if="authStore.isLoggedIn" ref="navRef" />

    <!-- Toolbar solo visible en móvil -->
    <v-app-bar v-if="authStore.isLoggedIn && !mdAndUp" flat color="surface-variant" density="compact">
      <v-app-bar-nav-icon @click="openNav" />
      <span style="font-size: 13px">
        <span style="color: #8DC63F; font-weight: 700; letter-spacing: 1px;">TEAM</span><span style="color: #B5CA72; font-weight: 300; letter-spacing: 3px;">PORTAL</span>
      </span>
    </v-app-bar>

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
  import { useDisplay } from 'vuetify'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const { mdAndUp } = useDisplay()
  const refreshing = ref(false)
  const navRef = ref(null)

  function openNav () {
    if (navRef.value) navRef.value.drawerOpen = true
  }

  onMounted(() => {
    authStore.setupSessionTimers()
  })

  async function renovar () {
    refreshing.value = true
    await authStore.refreshSession()
    refreshing.value = false
  }
</script>
