<template>
  <v-navigation-drawer
    v-model="drawerOpen"
    :permanent="mdAndUp"
    :rail="mdAndUp && rail"
    :temporary="!mdAndUp"
    color="surface-variant"
    width="210"
  >
    <v-list-item
      :prepend-icon="rail && mdAndUp ? 'mdi-menu' : 'mdi-menu-open'"
      @click="mdAndUp ? rail = !rail : drawerOpen = false"
    >
      <template #title>
        <span style="font-size: 12px">
          <span style="color: #8DC63F; font-weight: 700; letter-spacing: 1px;">TEAM</span><span style="color: #B5CA72; font-weight: 300; letter-spacing: 3px;">PORTAL</span>
        </span>
      </template>
    </v-list-item>
    <v-divider />
    <v-list nav>
      <v-tooltip
        v-for="item in items"
        :key="item.title"
        :disabled="!(rail && mdAndUp)"
        :text="item.title"
        location="end"
      >
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            link
            :prepend-icon="item.icon"
            :title="item.title"
            :to="item.to"
            @click="!mdAndUp && (drawerOpen = false)"
          />
        </template>
      </v-tooltip>
    </v-list>
    <template #append>
      <v-divider />
      <v-tooltip :disabled="!(rail && mdAndUp)" location="end" text="Cerrar sesión">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            link
            prepend-icon="mdi-logout"
            title="Cerrar sesión"
            @click="logout"
          />
        </template>
      </v-tooltip>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const { mdAndUp } = useDisplay()
  const rail = ref(true)
  const drawerOpen = ref(false)

  defineExpose({ drawerOpen })

  const items = computed(() =>
    authStore.modulos.map(m => ({
      title: m.nombre,
      icon: m.icono,
      to: m.ruta,
    })),
  )

  function logout () {
    authStore.logout()
  }
</script>
