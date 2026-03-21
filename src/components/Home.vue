<template>
  <v-container class="pa-0" fluid>
    <v-row class="home-row-top" density="compact" no-gutters>
      <v-col class="pa-2" cols="12" lg="5" md="6">
        <v-card class="d-flex flex-column align-center justify-center pa-6 home-card-top" color="surface-variant" rounded="lg">
          <v-avatar class="mb-4" size="80">
            <v-img :src="imageUrl" />
          </v-avatar>

          <h2 class="text-h5 font-weight-bold mb-2">
            Bienvenido {{ name }}!
          </h2>

          <p class="text-subtitle-1 text-center">
            {{ motivation || 'Tu espacio para gestionar tu asistencia, nómina y más.' }}
          </p>
        </v-card>
      </v-col>

      <v-col class="pa-2" cols="12" lg="7" md="6">
        <v-carousel align-content="center" class="home-carousel">
          <v-carousel-item cover>
            <v-card class="h-100" color="surface-variant" rounded="lg">
              <div class="h-100 d-flex flex-column align-center justify-center pa-6">
                <div class="text-h6 text-center font-weight-bold mb-4">
                  Valores de la empresa - Respeto
                </div>
                <div class="text-body-1 text-center">
                  Fomentamos un ambiente de trabajo respetuoso y colaborativo, valorando la diversidad y promoviendo la
                  inclusión.
                </div>
              </div>
            </v-card>
          </v-carousel-item>

          <v-carousel-item cover src="https://cdn.vuetifyjs.com/images/cards/hotel.jpg" />

          <v-carousel-item cover src="https://cdn.vuetifyjs.com/images/cards/sunshine.jpg" />
        </v-carousel>
      </v-col>
    </v-row>
    <v-row class="home-row-bottom" density="compact" no-gutters>
      <v-col class="pa-2" cols="12" md="6">
        <v-card
          class="h-100 d-flex flex-column"
          color="surface-variant"
          rounded="lg"
        >
          <div class="d-flex align-center justify-space-between px-4 pt-4 pb-3">
            <div>
              <div class="text-body-2 text-medium-emphasis mb-1">Hoy</div>
              <div class="text-h6 font-weight-bold">Resumen de asistencia</div>
            </div>
            <v-chip
              :color="asistence.estado === 'Presente' ? 'success' : 'warning'"
              size="small"
              variant="tonal"
            >
              {{ asistence.estado || 'Sin registro' }}
            </v-chip>
          </div>
          <v-divider />
          <div class="d-flex flex-column justify-space-around flex-grow-1 pa-4 gap-2">
            <div class="d-flex align-center gap-4 pa-3 rounded-lg" style="background: rgba(255,255,255,0.04)">
              <v-icon color="success" size="32">mdi-login</v-icon>
              <div>
                <div class="text-caption text-medium-emphasis">Hora de entrada</div>
                <div class="text-h5 font-weight-bold">{{ asistence.horaEntrada || '--:--' }}</div>
              </div>
            </div>
            <div class="d-flex align-center gap-4 pa-3 rounded-lg" style="background: rgba(255,255,255,0.04)">
              <v-icon color="error" size="32">mdi-logout</v-icon>
              <div>
                <div class="text-caption text-medium-emphasis">Hora de salida</div>
                <div class="text-h5 font-weight-bold">{{ asistence.horaSalida || '--:--' }}</div>
              </div>
            </div>
            <div class="d-flex align-center gap-4 pa-3 rounded-lg" style="background: rgba(255,255,255,0.04)">
              <v-icon color="info" size="32">mdi-clock-outline</v-icon>
              <div>
                <div class="text-caption text-medium-emphasis">Horas trabajadas</div>
                <div class="text-h5 font-weight-bold">{{ asistence.horasTrabajadas || '--' }}h</div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col class="pa-2" cols="12" md="6">
        <v-card
          class="d-flex flex-column home-card-ausente"
          color="surface-variant"
          rounded="lg"
        >
          <div class="d-flex align-center justify-space-between px-4 pt-4 pb-3">
            <div>
              <div class="text-body-2 text-medium-emphasis mb-1">Hoy</div>
              <div class="text-h6 font-weight-bold">Personal ausente</div>
            </div>
            <div class="d-flex align-center gap-2">
              <v-chip v-if="absentFaltasCount > 0" color="error" size="small" variant="tonal">
                {{ absentFaltasCount }} falta{{ absentFaltasCount !== 1 ? 's' : '' }}
              </v-chip>
              <v-chip v-if="absentVacacionesCount > 0" color="info" size="small" variant="tonal">
                {{ absentVacacionesCount }} vacaciones
              </v-chip>
              <v-chip v-if="absentPermisosCount > 0" color="warning" size="small" variant="tonal">
                {{ absentPermisosCount }} permiso{{ absentPermisosCount !== 1 ? 's' : '' }}
              </v-chip>
              <v-chip v-if="absentOtrosCount > 0" color="secondary" size="small" variant="tonal">
                {{ absentOtrosCount }} otro{{ absentOtrosCount !== 1 ? 's' : '' }}
              </v-chip>
            </div>
          </div>
          <v-divider />
          <div v-if="absentPersonal.length === 0" class="d-flex flex-column align-center justify-center flex-grow-1 text-medium-emphasis">
            <v-icon class="mb-3" size="48">mdi-account-check-outline</v-icon>
            <span class="text-body-2">Todo el equipo presente</span>
          </div>
          <v-list
            v-else
            bg-color="transparent"
            class="overflow-y-auto flex-grow-1"
            lines="two"
            style="min-height: 0;"
          >
            <v-list-item
              v-for="person in absentPersonal"
              :key="person.username"
              class="py-2"
            >
              <template #prepend>
                <v-avatar :color="getAvatarColor(person.username)" size="44">
                  <span class="text-body-2 font-weight-bold text-white">{{ getInitials(person) }}</span>
                </v-avatar>
              </template>
              <template #title>
                <span class="text-body-1 font-weight-medium">{{ person.nombre }}</span>
              </template>
              <template #subtitle>
                <v-chip class="mt-1" :color="getIncidenciaColor(person.incidencia)" size="x-small" variant="tonal">
                  {{ person.incidencia }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import api from '@/api'
  const imageUrl = localStorage.getItem('avatar') || 'https://res.cloudinary.com/dkvtklbab/image/upload/v1772424065/Gemini_Generated_Image_xqu1dxxqu1dxxqu1_szej44.png'
  const motivation = localStorage.getItem('motivation') || ''
  const name = localStorage.getItem('name') || 'Usuario'

  const asistence = ref({})
  const absentPersonal = ref([])
  const loading = ref(false)

  const AVATAR_COLORS = [
    '#E53935', '#8E24AA', '#1E88E5', '#00897B', '#F4511E',
    '#6D4C41', '#546E7A', '#3949AB', '#039BE5', '#43A047',
  ]

  function getInitials (person) {
    return `${person.nombre?.charAt(0) ?? ''}${person.apellidoPaterno?.charAt(0) ?? ''}`.toUpperCase()
  }

  const FALTAS = ['Falta injustificada', 'Falta justificada', 'Falta']
  const VACACIONES_PERMISOS_VACACIONES = ['Vacaciones']
  const VACACIONES_PERMISOS_PERMISOS = ['Permiso con goce de sueldo', 'Permiso sin goce de sueldo']

  const absentFaltasCount = computed(() => absentPersonal.value.filter(p => FALTAS.includes(p.incidencia)).length)
  const absentVacacionesCount = computed(() => absentPersonal.value.filter(p => VACACIONES_PERMISOS_VACACIONES.includes(p.incidencia)).length)
  const absentPermisosCount = computed(() => absentPersonal.value.filter(p => VACACIONES_PERMISOS_PERMISOS.includes(p.incidencia)).length)
  const absentOtrosCount = computed(() => absentPersonal.value.filter(p => ![...FALTAS, ...VACACIONES_PERMISOS_VACACIONES, ...VACACIONES_PERMISOS_PERMISOS].includes(p.incidencia)).length)

  function getIncidenciaColor (incidencia) {
    if (['Falta injustificada', 'Falta justificada', 'Falta'].includes(incidencia)) return 'error'
    if (['Vacaciones', 'Permiso con goce de sueldo', 'Permiso sin goce de sueldo'].includes(incidencia)) return 'info'
    if (['Retardo', 'Retardo mayor a 30 min'].includes(incidencia)) return 'warning'
    return 'secondary'
  }

  function getAvatarColor (username) {
    const index = username.split('').reduce((acc, c) => acc + (c.codePointAt(0) ?? 0), 0) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
  }

  async function getPersonalAbsent () {
    try {
      const response = await api.get('/asistence/absent-today')
      absentPersonal.value = response.data.data || []
    } catch (error) {
      console.error('Error en proceso de petición:', error)
    }
  }
  async function getAsistence () {
    loading.value = true
    const username = localStorage.getItem('user').replace('"', '') || ''
    try {
      const payload = {
        id: username,
      }
      const response = await api.post('/asistence/asistence-today', payload)
      asistence.value = response.data.data[0] || {}
      asistence.value.horaEntrada = asistence.value.horaEntrada ? new Date(asistence.value.horaEntrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : null
      asistence.value.horaSalida = asistence.value.horaSalida ? new Date(asistence.value.horaSalida).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : null
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      error.value = 'Error al cargar los datos del dashboard.'
    } finally {
      loading.value = false
    }
  }
  onMounted(async () => {
    await getAsistence()
    await getPersonalAbsent()
  })
</script>

<style scoped>
/* Desktop: filas con altura fija */
@media (min-width: 960px) {
  .home-row-top    { height: 49dvh; }
  .home-row-bottom { height: 45dvh; }
  .home-card-top   { height: 100%; }
  .home-carousel   { height: 100% !important; }
  .home-card-ausente { height: 49dvh; overflow: hidden; }
}

/* Móvil: altura automática, sin solapamiento */
@media (max-width: 959px) {
  .home-card-top     { min-height: 220px; }
  .home-carousel     { height: 240px !important; }
  .home-card-ausente { max-height: 50dvh; overflow-y: auto; }
}
</style>
