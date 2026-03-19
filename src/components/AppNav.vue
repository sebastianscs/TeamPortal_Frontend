<template>
  <v-navigation-drawer color="surface-variant" permanent :rail="rail" width="210">
    <v-list-item
      :prepend-icon="rail ? 'mdi-menu' : 'mdi-menu-open'"
      @click="rail = !rail"
    >
      <template #title>
        <span v-if="!rail" style="font-size: 12px">
          <span style="color: #8DC63F; font-weight: 700; letter-spacing: 1px;">TEAM</span><span style="color: #B5CA72; font-weight: 300; letter-spacing: 3px;">PORTAL</span>
        </span>
      </template>
    </v-list-item>
    <v-divider />
    <v-list nav>
      <v-tooltip
        v-for="item in items"
        :key="item.title"
        :text="item.title"
        location="end"
        :disabled="!rail"
      >
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            link
            :prepend-icon="item.icon"
            :title="item.title"
            :to="item.to"
          />
        </template>
      </v-tooltip>
    </v-list>
    <template #append>
      <v-divider />
      <v-tooltip text="Cerrar sesión" location="end" :disabled="!rail">
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
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const rail = ref(true)

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
