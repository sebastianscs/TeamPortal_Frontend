<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Mi Equipo</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          Gestiona asistencia e incidencias de tu equipo
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="asistencia">
        <v-icon start>mdi-calendar-check</v-icon>
        Asistencia
        <v-badge v-if="sinRegistro > 0" :content="sinRegistro" color="warning" inline class="ml-2" />
      </v-tab>
      <v-tab value="incidencias">
        <v-icon start>mdi-alert-circle-outline</v-icon>
        Incidencias
        <v-badge v-if="store.incidencias.length > 0" :content="store.incidencias.length" color="error" inline class="ml-2" />
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- TAB ASISTENCIA -->
      <v-window-item value="asistencia">
        <v-card variant="tonal" class="mb-4 pa-3">
          <div class="d-flex align-center gap-3 flex-wrap">
            <v-text-field
              v-model="fechaSeleccionada"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 200px"
              @update:model-value="cargarAsistencia"
            />
            <v-chip color="success" variant="tonal">
              <v-icon start size="14">mdi-check</v-icon>
              {{ resumen.puntual }} puntuales
            </v-chip>
            <v-chip color="warning" variant="tonal">
              <v-icon start size="14">mdi-clock-alert</v-icon>
              {{ resumen.retardo }} retardos
            </v-chip>
            <v-chip color="error" variant="tonal">
              <v-icon start size="14">mdi-close</v-icon>
              {{ resumen.falta }} faltas
            </v-chip>
            <v-chip color="surface-variant" variant="tonal">
              <v-icon start size="14">mdi-help</v-icon>
              {{ sinRegistro }} sin registro
            </v-chip>
            <v-chip v-if="resumen.vacaciones > 0" color="cyan" variant="tonal">
              <v-icon start size="14">mdi-beach</v-icon>
              {{ resumen.vacaciones }} vacaciones
            </v-chip>
          </div>
        </v-card>

        <v-data-table
          :headers="headersAsistencia"
          :items="store.asistencia"
          :loading="store.loading"
          item-value="username"
          hover
        >
          <!-- Empleado -->
          <template #item.nombreCompleto="{ item }">
            <div class="d-flex align-center gap-2 py-1">
              <v-avatar size="32" color="primary" variant="tonal">
                <span class="text-caption font-weight-bold">
                  {{ iniciales(item.nombreCompleto) }}
                </span>
              </v-avatar>
              <div>
                <div class="text-body-2 font-weight-medium">{{ item.nombreCompleto }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.puesto || '—' }}</div>
              </div>
            </div>
          </template>

          <!-- Turno -->
          <template #item.turno="{ item }">
            <div v-if="item.turno" class="text-caption">
              {{ item.turno }}<br>
              <span class="text-medium-emphasis">{{ item.turnoEntrada }} – {{ item.turnoSalida }}</span>
            </div>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <!-- Entrada / Salida -->
          <template #item.horaEntrada="{ item }">
            {{ item.horaEntrada ? formatHora(item.horaEntrada) : '—' }}
          </template>
          <template #item.horaSalida="{ item }">
            {{ item.horaSalida ? formatHora(item.horaSalida) : '—' }}
          </template>

          <!-- Estatus -->
          <template #item.estatus="{ item }">
            <v-chip
              v-if="item.estatus"
              :color="colorEstatus(item.estatus)"
              size="small"
              variant="tonal"
            >
              {{ etiquetaEstatus(item.estatus) }}
            </v-chip>
            <v-chip v-else color="surface-variant" size="small" variant="tonal">Sin registro</v-chip>
          </template>

          <!-- Acciones -->
          <template #item.acciones="{ item }">
            <v-tooltip v-if="item.estatus !== 'VACACIONES'" text="Confirmar / corregir asistencia" location="start">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil-outline"
                  size="small"
                  variant="text"
                  @click="abrirConfirmar(item)"
                />
              </template>
            </v-tooltip>
            <v-icon v-else color="cyan" size="small" title="Empleado de vacaciones">mdi-beach</v-icon>
          </template>
        </v-data-table>
      </v-window-item>

      <!-- TAB INCIDENCIAS -->
      <v-window-item value="incidencias">
        <div class="d-flex gap-2 mb-4">
          <v-btn-toggle v-model="filtroIncidencia" mandatory color="primary" variant="outlined" density="compact">
            <v-btn value="PENDIENTE">Pendientes</v-btn>
            <v-btn value="APROBADA">Aprobadas</v-btn>
            <v-btn value="RECHAZADA">Rechazadas</v-btn>
          </v-btn-toggle>
        </div>

        <v-data-table
          :headers="headersIncidencias"
          :items="store.incidencias"
          item-value="id"
          hover
        >
          <template #item.nombreCompleto="{ item }">
            <div class="d-flex align-center gap-2 py-1">
              <v-avatar size="32" color="secondary" variant="tonal">
                <span class="text-caption font-weight-bold">{{ iniciales(item.nombreCompleto) }}</span>
              </v-avatar>
              <div>
                <div class="text-body-2 font-weight-medium">{{ item.nombreCompleto }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.departamento || '—' }}</div>
              </div>
            </div>
          </template>

          <template #item.fecha="{ item }">
            {{ formatFecha(item.fecha) }}
          </template>

          <template #item.tipo="{ item }">
            <v-chip :color="colorTipo(item.tipo)" size="small" variant="tonal">
              {{ item.tipo }}
            </v-chip>
          </template>

          <template #item.estatus="{ item }">
            <v-chip :color="colorEstatus(item.estatus)" size="small" variant="flat">
              {{ item.estatus }}
            </v-chip>
          </template>

          <template #item.acciones="{ item }">
            <template v-if="item.estatus === 'PENDIENTE'">
              <v-tooltip text="Aprobar" location="start">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-check" size="small" variant="text" color="success"
                    @click="resolver(item, 'APROBADA')" />
                </template>
              </v-tooltip>
              <v-tooltip text="Rechazar" location="start">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-close" size="small" variant="text" color="error"
                    @click="abrirRechazo(item)" />
                </template>
              </v-tooltip>
            </template>
          </template>
        </v-data-table>
      </v-window-item>
    </v-window>

    <!-- DIALOG CONFIRMAR ASISTENCIA -->
    <v-dialog v-model="dialogs.confirmar" max-width="460">
      <v-card>
        <v-card-title class="pa-4 pb-2">
          Confirmar asistencia
          <div class="text-body-2 text-medium-emphasis font-weight-regular mt-1">
            {{ confirmarForm.nombreCompleto }} — {{ fechaSeleccionada }}
          </div>
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="confirmarForm.horaEntrada"
                label="Hora entrada"
                type="time"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="confirmarForm.horaSalida"
                label="Hora salida"
                type="time"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="confirmarForm.estatus"
                :items="estatusOptions"
                label="Estatus"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end gap-2">
          <v-btn variant="text" @click="dialogs.confirmar = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="submitConfirmar">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG RECHAZO -->
    <v-dialog v-model="dialogs.rechazo" max-width="420">
      <v-card>
        <v-card-title class="pa-4 pb-2">Motivo de rechazo</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="motivoRechazo"
            label="Motivo"
            variant="outlined"
            rows="3"
            auto-grow
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end gap-2">
          <v-btn variant="text" @click="dialogs.rechazo = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="saving" @click="submitRechazo">
            Rechazar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SNACKBAR -->
    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom end">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useLiderStore } from '@/stores/lider'

const store = useLiderStore()

const tab               = ref('asistencia')
const filtroIncidencia  = ref('PENDIENTE')
const saving            = ref(false)
const motivoRechazo     = ref('')
const incidenciaTarget  = ref(null)

const fechaSeleccionada = ref(new Date().toISOString().slice(0, 10))

const dialogs = reactive({ confirmar: false, rechazo: false })
const snack   = reactive({ show: false, text: '', color: 'success' })

const confirmarForm = reactive({
  username: '', nombreCompleto: '', horaEntrada: '', horaSalida: '', estatus: 'PUNTUAL',
})

const estatusOptions = [
  { title: 'Puntual',            value: 'PUNTUAL' },
  { title: 'Retardo',            value: 'RETARDO' },
  { title: 'Falta injustificada',value: 'FALTA' },
  { title: 'Falta justificada',  value: 'JUSTIFICADA' },
  { title: 'Media falta',        value: 'MEDIA_FALTA' },
]

const headersAsistencia = [
  { title: 'Empleado',  key: 'nombreCompleto', sortable: true },
  { title: 'Turno',     key: 'turno',          sortable: false },
  { title: 'Entrada',   key: 'horaEntrada',    sortable: false },
  { title: 'Salida',    key: 'horaSalida',     sortable: false },
  { title: 'Estatus',   key: 'estatus',        sortable: true },
  { title: 'HE (min)',  key: 'minutosExtra',   sortable: true },
  { title: '',          key: 'acciones',       sortable: false, align: 'end' },
]

const headersIncidencias = [
  { title: 'Empleado',   key: 'nombreCompleto', sortable: true },
  { title: 'Fecha',      key: 'fecha',          sortable: true },
  { title: 'Tipo',       key: 'tipo',           sortable: true },
  { title: 'Descripción',key: 'descripcion',    sortable: false },
  { title: 'Estatus',    key: 'estatus',        sortable: true },
  { title: '',           key: 'acciones',       sortable: false, align: 'end' },
]

// ── Computed ──────────────────────────────────────────────────────────
const resumen = computed(() => ({
  puntual:    store.asistencia.filter(a => a.estatus === 'PUNTUAL').length,
  retardo:    store.asistencia.filter(a => a.estatus === 'RETARDO').length,
  falta:      store.asistencia.filter(a => ['FALTA','MEDIA_FALTA'].includes(a.estatus)).length,
  vacaciones: store.asistencia.filter(a => a.estatus === 'VACACIONES').length,
}))

const sinRegistro = computed(() =>
  store.asistencia.filter(a => !a.estatus).length
)

// ── Helpers ───────────────────────────────────────────────────────────
function iniciales(nombre) {
  return nombre?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'
}

function extractTime(val) {
  if (!val) return ''
  const s = String(val)
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
  try { return new Date(s).toISOString().slice(11, 16) } catch { return '' }
}

function formatHora(hora) {
  return extractTime(hora) || '—'
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function colorEstatus(est) {
  const m = { PUNTUAL: 'success', RETARDO: 'warning', FALTA: 'error',
              MEDIA_FALTA: 'orange', JUSTIFICADA: 'info', HE_AUTORIZADA: 'purple',
              PENDIENTE: 'warning', APROBADA: 'success', RECHAZADA: 'error',
              VACACIONES: 'cyan' }
  return m[est] || 'surface-variant'
}

function etiquetaEstatus(est) {
  const m = { PUNTUAL: 'Puntual', RETARDO: 'Retardo', FALTA: 'Falta',
              MEDIA_FALTA: 'Media falta', JUSTIFICADA: 'Justificada', HE_AUTORIZADA: 'HE autorizada',
              VACACIONES: 'Vacaciones' }
  return m[est] || est
}

function colorTipo(tipo) {
  const m = { 'INC-002': 'info', 'INC-004': 'warning', 'INC-006': 'purple' }
  return m[tipo] || 'surface-variant'
}

function showSnack(text, color = 'success') {
  snack.text = text; snack.color = color; snack.show = true
}

// ── Acciones ──────────────────────────────────────────────────────────
async function cargarAsistencia() {
  await store.fetchAsistencia(fechaSeleccionada.value)
}

function abrirConfirmar(item) {
  Object.assign(confirmarForm, {
    username:      item.username,
    nombreCompleto: item.nombreCompleto,
    horaEntrada:   extractTime(item.horaEntrada),
    horaSalida:    extractTime(item.horaSalida),
    estatus:       item.estatus || 'PUNTUAL',
  })
  dialogs.confirmar = true
}

async function submitConfirmar() {
  saving.value = true
  try {
    await store.confirmarAsistencia({
      username:    confirmarForm.username,
      fecha:       fechaSeleccionada.value,
      horaEntrada: confirmarForm.horaEntrada || null,
      horaSalida:  confirmarForm.horaSalida  || null,
      estatus:     confirmarForm.estatus,
    })
    dialogs.confirmar = false
    showSnack('Asistencia actualizada')
    await cargarAsistencia()
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}

async function resolver(item, estatus) {
  saving.value = true
  try {
    await store.resolverIncidencia(item.id, estatus)
    showSnack(`Incidencia ${estatus.toLowerCase()}`)
    await store.fetchIncidencias(filtroIncidencia.value)
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error', 'error')
  } finally {
    saving.value = false
  }
}

function abrirRechazo(item) {
  incidenciaTarget.value = item
  motivoRechazo.value = ''
  dialogs.rechazo = true
}

async function submitRechazo() {
  if (!incidenciaTarget.value) return
  saving.value = true
  try {
    await store.resolverIncidencia(incidenciaTarget.value.id, 'RECHAZADA', motivoRechazo.value)
    dialogs.rechazo = false
    showSnack('Incidencia rechazada', 'warning')
    await store.fetchIncidencias(filtroIncidencia.value)
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error', 'error')
  } finally {
    saving.value = false
  }
}

// ── Watchers ──────────────────────────────────────────────────────────
watch(filtroIncidencia, val => store.fetchIncidencias(val))
watch(tab, val => {
  if (val === 'incidencias') store.fetchIncidencias(filtroIncidencia.value)
})

onMounted(async () => {
  await cargarAsistencia()
})
</script>
