<template>
  <div>
    <!-- Filtros -->
    <v-card variant="tonal" class="mb-4 pa-4">
      <v-row dense align="center">
        <v-col cols="12" sm="4">
          <v-select v-model="filtroEstatus" :items="['','PENDIENTE','APROBADA','RECHAZADA','CANCELADA']" label="Estatus" variant="outlined" density="compact" hide-details clearable @update:model-value="cargar" />
        </v-col>
        <v-col cols="12" sm="4">
          <v-text-field v-model="filtroDesde" type="date" label="Desde" variant="outlined" density="compact" hide-details @change="cargar" />
        </v-col>
        <v-col cols="auto" class="d-flex align-center">
          <v-btn color="primary" variant="tonal" size="small" @click="abrirNueva">Nueva solicitud</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-data-table :headers="headers" :items="solicitudes" :loading="loading" hover>
      <template #item.nombreCompleto="{ item }">
        <div class="font-weight-medium">{{ item.nombreCompleto }}</div>
        <div class="text-caption text-medium-emphasis">{{ item.departamento }}</div>
      </template>
      <template #item.fechaInicio="{ item }">
        <span class="text-caption">{{ fmt(item.fechaInicio) }} – {{ fmt(item.fechaFin) }}</span>
      </template>
      <template #item.diasSolicitados="{ item }">
        <v-chip size="small" variant="tonal" color="info">{{ item.diasSolicitados }} días</v-chip>
      </template>
      <template #item.estatus="{ item }">
        <v-chip :color="estatusColor(item.estatus)" size="small" variant="tonal">{{ item.estatus }}</v-chip>
      </template>
      <template #item.acciones="{ item }">
        <div v-if="item.estatus === 'PENDIENTE'" class="d-flex gap-1">
          <v-btn color="success" icon="mdi-check" size="x-small" variant="tonal" @click="resolver(item, 'APROBADA')" />
          <v-btn color="error" icon="mdi-close" size="x-small" variant="tonal" @click="resolver(item, 'RECHAZADA')" />
        </div>
        <span v-else class="text-caption text-medium-emphasis">{{ fmt(item.fechaResolucion) }}</span>
      </template>
    </v-data-table>

    <!-- Dialog nueva solicitud -->
    <v-dialog v-model="dialog" max-width="460" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">Nueva solicitud</span>
          <v-btn icon size="small" variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <v-autocomplete v-model="form.username" :items="empleados" item-title="nombreCompleto" item-value="username" label="Empleado *" variant="outlined" density="comfortable" :custom-filter="searchFilter" />
          <div v-if="form.username && disponibles" class="d-flex gap-3">
            <v-chip color="primary" size="small" variant="tonal">{{ disponibles.diasDisponibles }} días disponibles</v-chip>
            <v-chip color="secondary" size="small" variant="tonal">{{ disponibles.anios }} año(s) de servicio</v-chip>
          </div>
          <v-row dense>
            <v-col cols="6"><v-text-field v-model="form.fechaInicio" type="date" label="Inicio *" variant="outlined" density="comfortable" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.fechaFin" type="date" label="Fin *" variant="outlined" density="comfortable" /></v-col>
          </v-row>
          <v-alert v-if="formError" :text="formError" color="error" density="compact" type="error" variant="tonal" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="tonal" :loading="saving" @click="submitNueva">Solicitar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom end">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRHStore } from '@/stores/rh'
import { searchFilter } from '@/utils/search'

const store = useRHStore()
const loading = ref(false)
const saving  = ref(false)
const dialog  = ref(false)
const solicitudes = ref([])
const empleados   = ref([])
const disponibles = ref(null)
const filtroEstatus = ref('')
const filtroDesde   = ref('')
const formError = ref('')
const snack = reactive({ show: false, text: '', color: 'success' })
const form  = reactive({ username: null, fechaInicio: '', fechaFin: '' })

const headers = [
  { title: 'Empleado',   key: 'nombreCompleto', sortable: true },
  { title: 'Periodo',    key: 'fechaInicio' },
  { title: 'Días',       key: 'diasSolicitados', align: 'center' },
  { title: 'Estatus',    key: 'estatus', align: 'center' },
  { title: 'Solicitud',  key: 'fechaSolicitud' },
  { title: '',           key: 'acciones', sortable: false, align: 'end' },
]

const fmt = d => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—'
const estatusColor = e => ({ PENDIENTE: 'warning', APROBADA: 'success', RECHAZADA: 'error', CANCELADA: 'secondary' }[e] ?? 'secondary')
function showSnack(text, color = 'success') { snack.text = text; snack.color = color; snack.show = true }

async function cargar() {
  loading.value = true
  try {
    const params = {}
    if (filtroEstatus.value) params.estatus = filtroEstatus.value
    solicitudes.value = await store.getSolicitudesVacaciones(params)
  } catch { showSnack('Error al cargar', 'error') }
  finally { loading.value = false }
}

async function resolver(item, estatus) {
  try {
    await store.resolverVacaciones(item.id, { estatus })
    showSnack(`Solicitud ${estatus.toLowerCase()}`)
    await cargar()
  } catch { showSnack('Error', 'error') }
}

async function abrirNueva() {
  Object.assign(form, { username: null, fechaInicio: '', fechaFin: '' })
  disponibles.value = null
  formError.value = ''
  if (!empleados.value.length) {
    const p = await store.fetchPersonal()
    empleados.value = p
  }
  dialog.value = true
}

watch(() => form.username, async (u) => {
  if (u) disponibles.value = await store.getVacacionesDisponibles(u).catch(() => null)
  else disponibles.value = null
})

async function submitNueva() {
  if (!form.username || !form.fechaInicio || !form.fechaFin) { formError.value = 'Todos los campos son requeridos'; return }
  saving.value = true; formError.value = ''
  try {
    const res = await store.createSolicitudVacaciones({ username: form.username, fechaInicio: form.fechaInicio, fechaFin: form.fechaFin })
    showSnack(`Solicitud creada: ${res.diasSolicitados} días hábiles`)
    dialog.value = false
    await cargar()
  } catch (err) { formError.value = err.response?.data?.message || 'Error' }
  finally { saving.value = false }
}

cargar()
</script>
