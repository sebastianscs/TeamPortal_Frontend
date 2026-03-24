<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-body-1 font-weight-bold">Aprobación de asistencias</div>
        <div class="text-caption text-medium-emphasis">Revisa y confirma registros de todos los empleados</div>
      </div>
    </div>

    <!-- Filtros -->
    <v-card variant="tonal" class="mb-4 pa-3">
      <v-row dense align="center">
        <v-col cols="12" sm="3">
          <v-text-field v-model="filtros.fecha" type="date" label="Fecha" variant="outlined"
            density="compact" hide-details @update:model-value="cargar" />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select v-model="filtros.estatus" :items="estatusFiltroOpts" label="Estatus"
            variant="outlined" density="compact" hide-details clearable @update:model-value="cargar" />
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field v-model="filtros.departamento" label="Departamento" variant="outlined"
            density="compact" hide-details clearable @update:model-value="cargar" />
        </v-col>
        <v-col cols="12" sm="3">
          <div class="d-flex gap-2 justify-end">
            <v-chip color="warning" variant="tonal" size="small">
              <v-icon start size="14">mdi-clock-alert</v-icon>
              {{ pendienteCount }} pendientes
            </v-chip>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <v-card variant="tonal">
      <v-data-table :headers="headers" :items="store.asistenciaRH" :loading="store.loading" hover>
        <template #item.nombreCompleto="{ item }">
          <div class="d-flex align-center gap-2 py-1">
            <v-avatar size="32" color="primary" variant="tonal">
              <span class="text-caption font-weight-bold">{{ iniciales(item.nombreCompleto) }}</span>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.nombreCompleto }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.puesto || '—' }}</div>
            </div>
          </div>
        </template>
        <template #item.liderNombre="{ item }">
          <span class="text-caption">{{ item.liderNombre || '—' }}</span>
        </template>
        <template #item.horaEntrada="{ item }">{{ item.horaEntrada ? extractTime(item.horaEntrada) : '—' }}</template>
        <template #item.horaSalida="{ item }">{{ item.horaSalida ? extractTime(item.horaSalida) : '—' }}</template>
        <template #item.estatus="{ item }">
          <v-chip v-if="item.estatus" :color="colorEstatus(item.estatus)" size="small" variant="tonal">
            {{ etiquetaEstatus(item.estatus) }}
          </v-chip>
          <v-chip v-else color="surface-variant" size="small" variant="tonal">Sin registro</v-chip>
        </template>
        <template #item.origen="{ item }">
          <v-chip v-if="item.origen === 'CHECADOR'" color="primary" size="x-small" variant="outlined">
            <v-icon start size="10">mdi-router-wireless</v-icon>ZKTeco
          </v-chip>
          <span v-else class="text-caption text-medium-emphasis">Manual</span>
        </template>
        <template #item.acciones="{ item }">
          <v-btn icon="mdi-pencil-outline" size="small" variant="text" @click="abrirConfirmar(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog confirmar -->
    <v-dialog v-model="dialog" max-width="440" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">Confirmar asistencia</span>
          <v-btn icon size="small" variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <div class="text-body-2 font-weight-medium">{{ confirmarForm.nombreCompleto }}</div>
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="confirmarForm.horaEntrada" label="Hora entrada" type="time"
                variant="outlined" density="compact" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="confirmarForm.horaSalida" label="Hora salida" type="time"
                variant="outlined" density="compact" />
            </v-col>
          </v-row>
          <v-select v-model="confirmarForm.estatus" :items="estatusOpts" label="Estatus"
            variant="outlined" density="compact" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="submitConfirmar">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom end">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useChecadorStore } from '@/stores/checador'

const store = useChecadorStore()
const dialog = ref(false)
const saving = ref(false)
const snack = reactive({ show: false, text: '', color: 'success' })

const filtros = reactive({ fecha: new Date().toISOString().slice(0, 10), estatus: null, departamento: null })
const confirmarForm = reactive({ username: '', nombreCompleto: '', fecha: '', horaEntrada: '', horaSalida: '', estatus: 'PUNTUAL' })

const pendienteCount = computed(() => store.asistenciaRH.filter(a => a.estatus === 'PENDIENTE').length)

const estatusFiltroOpts = [
  { title: 'Pendiente', value: 'PENDIENTE' },
  { title: 'Puntual', value: 'PUNTUAL' },
  { title: 'Retardo', value: 'RETARDO' },
  { title: 'Falta', value: 'FALTA' },
  { title: 'Sin registro', value: 'SIN_REGISTRO' },
]
const estatusOpts = [
  { title: 'Puntual', value: 'PUNTUAL' },
  { title: 'Retardo', value: 'RETARDO' },
  { title: 'Falta injustificada', value: 'FALTA' },
  { title: 'Falta justificada', value: 'JUSTIFICADA' },
  { title: 'Media falta', value: 'MEDIA_FALTA' },
]
const headers = [
  { title: 'Empleado', key: 'nombreCompleto', sortable: true },
  { title: 'Líder', key: 'liderNombre' },
  { title: 'Entrada', key: 'horaEntrada' },
  { title: 'Salida', key: 'horaSalida' },
  { title: 'Estatus', key: 'estatus', align: 'center' },
  { title: 'Origen', key: 'origen', align: 'center' },
  { title: '', key: 'acciones', sortable: false, align: 'end' },
]

function iniciales(n) { return n?.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase() || '?' }
function extractTime(val) {
  if (!val) return ''
  const s = String(val)
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
  try { return new Date(s).toISOString().slice(11, 16) } catch { return '' }
}
function colorEstatus(est) {
  const m = { PUNTUAL:'success', RETARDO:'warning', FALTA:'error', MEDIA_FALTA:'orange',
              JUSTIFICADA:'info', PENDIENTE:'purple', VACACIONES:'cyan' }
  return m[est] || 'surface-variant'
}
function etiquetaEstatus(est) {
  const m = { PUNTUAL:'Puntual', RETARDO:'Retardo', FALTA:'Falta', MEDIA_FALTA:'Media falta',
              JUSTIFICADA:'Justificada', PENDIENTE:'Pendiente', VACACIONES:'Vacaciones' }
  return m[est] || est
}
function showSnack(text, color='success') { snack.text=text; snack.color=color; snack.show=true }

async function cargar() {
  await store.fetchAsistenciaRH({ fecha: filtros.fecha, estatus: filtros.estatus || undefined, departamento: filtros.departamento || undefined })
}

function abrirConfirmar(item) {
  Object.assign(confirmarForm, {
    username: item.username,
    nombreCompleto: item.nombreCompleto,
    fecha: filtros.fecha,
    horaEntrada: extractTime(item.horaEntrada),
    horaSalida: extractTime(item.horaSalida),
    estatus: item.estatus || 'PUNTUAL',
  })
  dialog.value = true
}

async function submitConfirmar() {
  saving.value = true
  try {
    await store.aprobarAsistencia({
      username: confirmarForm.username,
      fecha: confirmarForm.fecha,
      horaEntrada: confirmarForm.horaEntrada || null,
      horaSalida: confirmarForm.horaSalida || null,
      estatus: confirmarForm.estatus,
    })
    dialog.value = false
    showSnack('Asistencia confirmada')
    await cargar()
  } catch { showSnack('Error al confirmar', 'error') }
  finally { saving.value = false }
}

onMounted(cargar)
</script>
