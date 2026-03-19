<template>
  <v-container class="pa-4" fluid>

    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-2">
      <span class="text-h6 font-weight-bold">Mis Asistencias</span>
      <div class="d-flex align-center gap-2">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="small"
          variant="tonal"
          @click="dialog = true"
        >
          Solicitar incidencia
        </v-btn>
        <v-btn :disabled="loading" icon size="small" variant="tonal" @click="prevMonth">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <span class="text-body-1 font-weight-medium text-capitalize" style="min-width: 160px; text-align: center;">
          {{ monthLabel }}
        </span>
        <v-btn :disabled="isCurrentMonth || loading" icon size="small" variant="tonal" @click="nextMonth">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Summary -->
    <v-row class="mb-4" dense>
      <v-col v-for="stat in stats" :key="stat.label" cols="6" md="3" sm="6">
        <v-card color="surface-variant" rounded="lg" variant="tonal">
          <div class="pa-3 d-flex align-center gap-3">
            <v-icon :color="stat.color" size="28">{{ stat.icon }}</v-icon>
            <div>
              <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Table -->
    <v-card color="surface-variant" rounded="lg" variant="tonal">
      <v-data-table
        :headers="headers"
        :items="records"
        :items-per-page="35"
        :loading="loading"
        bg-color="transparent"
        density="comfortable"
        hide-default-footer
        no-data-text="Sin registros para este mes"
      >
        <template #item.fecha="{ item }">
          <span class="text-body-2 font-weight-medium">{{ formatFecha(item.fecha) }}</span>
        </template>
        <template #item.incidencia="{ item }">
          <v-chip :color="getIncidenciaColor(item.incidenciaClave)" size="x-small" variant="tonal">
            {{ item.incidencia }}
          </v-chip>
        </template>
        <template #item.horaEntrada="{ item }">
          <span class="text-body-2">{{ formatTime(item.horaEntrada) }}</span>
        </template>
        <template #item.horaSalida="{ item }">
          <span class="text-body-2">{{ formatTime(item.horaSalida) }}</span>
        </template>
        <template #item.horas="{ item }">
          <span class="text-body-2">{{ calcHoras(item.horaEntrada, item.horaSalida) }}</span>
        </template>
        <template #item.estado="{ item }">
          <v-chip
            :color="item.estado === 'CONFIRMADO' ? 'success' : 'warning'"
            size="x-small"
            variant="tonal"
          >
            {{ item.estado }}
          </v-chip>
        </template>
        <template #item.observaciones="{ item }">
          <span class="text-caption text-medium-emphasis">{{ item.observaciones || '—' }}</span>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog solicitud de incidencia -->
    <v-dialog v-model="dialog" max-width="480" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">Solicitar incidencia</span>
          <v-btn
            icon
            size="small"
            variant="text"
            @click="closeDialog"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider />
        <v-form ref="form" @submit.prevent="submitIncidencia">
          <v-card-text class="pa-4 d-flex flex-column gap-3">

            <v-select
              v-model="formData.incidenciaId"
              density="comfortable"
              item-title="nombre"
              item-value="id"
              :items="INCIDENCIAS_DISPONIBLES"
              label="Tipo de incidencia"
              :rules="[v => !!v || 'Selecciona una incidencia']"
              variant="outlined"
            />

            <v-text-field
              v-model="formData.fecha"
              :rules="[v => !!v || 'La fecha es requerida']"
              density="comfortable"
              label="Fecha"
              type="date"
              variant="outlined"
            />

            <v-textarea
              v-model="formData.observaciones"
              :rules="[
                v => !!v?.trim() || 'El comentario es obligatorio',
                v => (v?.trim().length ?? 0) >= 10 || 'Mínimo 10 caracteres',
              ]"
              auto-grow
              counter
              density="comfortable"
              label="Comentario *"
              maxlength="255"
              rows="3"
              variant="outlined"
            />

            <v-alert
              v-if="formError"
              :text="formError"
              color="error"
              density="compact"
              type="error"
              variant="tonal"
            />

          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="closeDialog">Cancelar</v-btn>
            <v-btn
              color="primary"
              :loading="submitting"
              type="submit"
              variant="tonal"
            >
              Enviar solicitud
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Snackbar feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>

  </v-container>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import api from '@/api'

  const loading = ref(false)
  const records = ref([])
  const dialog = ref(false)
  const submitting = ref(false)
  const formError = ref('')
  const form = ref(null)
  const snackbar = ref({ show: false, text: '', color: 'success' })
  const formData = ref({ incidenciaId: null, fecha: '', observaciones: '' })

  const INCIDENCIAS_DISPONIBLES = [
    { id: 6, nombre: 'Home office' },
    { id: 4, nombre: 'Falta justificada' },
    { id: 7, nombre: 'Vacaciones' },
    { id: 8, nombre: 'Incapacidad médica' },
    { id: 9, nombre: 'Permiso con goce de sueldo' },
    { id: 10, nombre: 'Permiso sin goce de sueldo' },
  ]

  // ── Mes ────────────────────────────────────────────────────────────────────
  const now = new Date()
  const selectedYear = ref(now.getFullYear())
  const selectedMonth = ref(now.getMonth() + 1)

  const isCurrentMonth = computed(() =>
    selectedYear.value === now.getFullYear() && selectedMonth.value === now.getMonth() + 1,
  )

  const monthLabel = computed(() => {
    const d = new Date(selectedYear.value, selectedMonth.value - 1, 1)
    return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  })

  const monthParam = computed(() =>
    `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`,
  )

  // ── Stats ──────────────────────────────────────────────────────────────────
  const CLAVES_PRESENTES = ['ASISTENCIA', 'HOME_OFFICE']
  const CLAVES_FALTAS = ['FALTA_JUSTIFICADA', 'FALTA_INJUSTIFICADA']
  const CLAVES_RETARDOS = ['RETARDO', 'RETARDO_GRAVE']
  const CLAVES_AUSENCIAS = ['VACACIONES', 'INCAPACIDAD', 'PERMISO_GOCE', 'PERMISO_SIN_GOCE', 'DIA_FESTIVO']

  const stats = computed(() => [
    {
      label: 'Días presentes',
      value: records.value.filter(r => CLAVES_PRESENTES.includes(r.incidenciaClave)).length,
      icon: 'mdi-check-circle-outline',
      color: 'success',
    },
    {
      label: 'Faltas',
      value: records.value.filter(r => CLAVES_FALTAS.includes(r.incidenciaClave)).length,
      icon: 'mdi-close-circle-outline',
      color: 'error',
    },
    {
      label: 'Retardos',
      value: records.value.filter(r => CLAVES_RETARDOS.includes(r.incidenciaClave)).length,
      icon: 'mdi-clock-alert-outline',
      color: 'warning',
    },
    {
      label: 'Ausencias',
      value: records.value.filter(r => CLAVES_AUSENCIAS.includes(r.incidenciaClave)).length,
      icon: 'mdi-calendar-remove-outline',
      color: 'info',
    },
  ])

  // ── Table ──────────────────────────────────────────────────────────────────
  const headers = [
    { title: 'Fecha', key: 'fecha', sortable: false },
    { title: 'Incidencia', key: 'incidencia', sortable: false },
    { title: 'Entrada', key: 'horaEntrada', sortable: false },
    { title: 'Salida', key: 'horaSalida', sortable: false },
    { title: 'Horas', key: 'horas', sortable: false },
    { title: 'Estado', key: 'estado', sortable: false },
    { title: 'Observaciones', key: 'observaciones', sortable: false },
  ]

  // ── Helpers ────────────────────────────────────────────────────────────────
  const INCIDENCIA_COLORS = {
    ASISTENCIA: 'success',
    RETARDO: 'warning',
    RETARDO_GRAVE: 'deep-orange',
    FALTA_JUSTIFICADA: 'blue',
    FALTA_INJUSTIFICADA: 'error',
    HOME_OFFICE: 'teal',
    VACACIONES: 'cyan',
    INCAPACIDAD: 'purple',
    PERMISO_GOCE: 'info',
    PERMISO_SIN_GOCE: 'orange',
    DIA_FESTIVO: 'grey',
  }

  function getIncidenciaColor (clave) {
    return INCIDENCIA_COLORS[clave] ?? 'secondary'
  }

  function formatFecha (fechaStr) {
    const d = new Date(fechaStr)
    const dayName = d.toLocaleDateString('es-MX', { weekday: 'short', timeZone: 'UTC' })
    const dayNum = d.getUTCDate()
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum}`
  }

  function formatTime (timeStr) {
    if (!timeStr) return '--:--'
    return new Date(timeStr).toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    })
  }

  function calcHoras (entrada, salida) {
    if (!entrada || !salida) return '—'
    const diff = Math.max(0, new Date(salida) - new Date(entrada))
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  // ── Dialog ─────────────────────────────────────────────────────────────────
  function closeDialog () {
    dialog.value = false
    formError.value = ''
    formData.value = { incidenciaId: null, fecha: '', observaciones: '' }
    form.value?.reset()
  }

  async function submitIncidencia () {
    const { valid } = await form.value.validate()
    if (!valid) return

    submitting.value = true
    formError.value = ''

    try {
      const username = localStorage.getItem('user')?.replaceAll('"', '') ?? ''
      await api.post('/asistence/request-incidencia', {
        username,
        incidenciaId: formData.value.incidenciaId,
        fecha: formData.value.fecha,
        observaciones: formData.value.observaciones.trim(),
      })
      closeDialog()
      snackbar.value = { show: true, text: 'Incidencia registrada correctamente.', color: 'success' }
      fetchHistory()
    } catch (err) {
      formError.value = err.response?.data?.message || 'Error al registrar la incidencia.'
    } finally {
      submitting.value = false
    }
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  async function fetchHistory () {
    loading.value = true
    try {
      const username = localStorage.getItem('user')?.replaceAll('"', '') ?? ''
      const response = await api.post('/asistence/history', { username, month: monthParam.value })
      records.value = response.data.data ?? []
    } catch (err) {
      console.error('Error al cargar historial:', err)
      records.value = []
    } finally {
      loading.value = false
    }
  }

  function prevMonth () {
    if (selectedMonth.value === 1) { selectedMonth.value = 12; selectedYear.value-- }
    else selectedMonth.value--
    fetchHistory()
  }

  function nextMonth () {
    if (isCurrentMonth.value) return
    if (selectedMonth.value === 12) { selectedMonth.value = 1; selectedYear.value++ }
    else selectedMonth.value++
    fetchHistory()
  }

  onMounted(fetchHistory)
</script>
