<template>
  <div>
    <!-- Stats cards -->
    <v-row dense class="mb-4">
      <v-col cols="6" sm="3">
        <v-card color="surface-variant" rounded="lg" variant="tonal">
          <div class="pa-3 text-center">
            <div class="text-h5 font-weight-bold text-primary">{{ stats.totalActivos }}</div>
            <div class="text-caption text-medium-emphasis">Empleados activos</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card color="surface-variant" rounded="lg" variant="tonal">
          <div class="pa-3 text-center">
            <div class="text-h5 font-weight-bold text-error">{{ stats.totalBajas12Meses }}</div>
            <div class="text-caption text-medium-emphasis">Bajas (12 meses)</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card color="surface-variant" rounded="lg" variant="tonal">
          <div class="pa-3 text-center">
            <div class="text-h5 font-weight-bold text-warning">{{ tasaRotacion }}%</div>
            <div class="text-caption text-medium-emphasis">Tasa de rotación anual</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card color="surface-variant" rounded="lg" variant="tonal">
          <div class="pa-3 text-center">
            <div class="text-h5 font-weight-bold text-info">{{ promMeses }}m</div>
            <div class="text-caption text-medium-emphasis">Antigüedad promedio baja</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabla de bajas -->
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-body-1 font-weight-bold">Registro de bajas</div>
      <v-btn color="error" prepend-icon="mdi-account-minus" size="small" variant="tonal" @click="abrirBaja">Registrar baja</v-btn>
    </div>

    <v-data-table :headers="headers" :items="bajas" :loading="loadingBajas" hover>
      <template #item.nombreCompleto="{ item }">
        <div class="font-weight-medium">{{ item.nombreCompleto }}</div>
        <div class="text-caption text-medium-emphasis">{{ item.departamento }} · {{ item.puesto }}</div>
      </template>
      <template #item.fechaBaja="{ item }">{{ fmt(item.fechaBaja) }}</template>
      <template #item.motivo="{ item }">
        <v-chip :color="motivoColor(item.motivo)" size="x-small" variant="tonal">{{ item.motivo }}</v-chip>
      </template>
      <template #item.diasServicio="{ item }">
        <span class="text-caption">{{ Math.round(item.diasServicio / 30) }} meses</span>
      </template>
    </v-data-table>

    <!-- Distribución por motivo -->
    <div v-if="stats.porMotivo?.length" class="mt-4">
      <div class="text-body-1 font-weight-bold mb-3">Distribución por motivo</div>
      <v-row dense>
        <v-col v-for="m in stats.porMotivo" :key="m.motivo" cols="6" sm="3">
          <v-card color="surface-variant" rounded="lg" variant="tonal">
            <div class="pa-3 text-center">
              <div class="text-h6 font-weight-bold" :class="`text-${motivoColor(m.motivo)}`">{{ m.total }}</div>
              <div class="text-caption text-medium-emphasis">{{ m.motivo }}</div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Dialog registrar baja -->
    <v-dialog v-model="dialog" max-width="460" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">Registrar baja</span>
          <v-btn icon size="small" variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <v-autocomplete v-model="form.username" :items="empleados" item-title="nombreCompleto" item-value="username" label="Empleado *" variant="outlined" density="comfortable" :custom-filter="searchFilter" />
          <v-text-field v-model="form.fechaBaja" type="date" label="Fecha de baja *" variant="outlined" density="comfortable" />
          <v-select v-model="form.motivo" :items="motivos" label="Motivo *" variant="outlined" density="comfortable" />
          <v-textarea v-model="form.descripcion" label="Notas adicionales" variant="outlined" density="comfortable" rows="2" auto-grow />
          <v-alert color="warning" density="compact" variant="tonal" text="El usuario quedará inactivo en el sistema al registrar la baja." />
          <v-alert v-if="formError" :text="formError" color="error" density="compact" type="error" variant="tonal" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="tonal" :loading="saving" @click="submitBaja">Registrar baja</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom end">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRHStore } from '@/stores/rh'
import { searchFilter } from '@/utils/search'

const store = useRHStore()
const loadingBajas = ref(false)
const saving  = ref(false)
const dialog  = ref(false)
const bajas   = ref([])
const empleados = ref([])
const stats   = reactive({ totalActivos: 0, totalBajas12Meses: 0, promDiasServicio: 0, porMotivo: [], bajasPorMes: [], porDepartamento: [] })
const formError = ref('')
const snack   = reactive({ show: false, text: '', color: 'success' })
const form    = reactive({ username: null, fechaBaja: '', motivo: '', descripcion: '' })
const motivos = ['RENUNCIA', 'DESPIDO', 'TERMINO_CONTRATO', 'JUBILACION', 'OTRO']

const headers = [
  { title: 'Empleado',   key: 'nombreCompleto', sortable: true },
  { title: 'Fecha baja', key: 'fechaBaja', sortable: true },
  { title: 'Motivo',     key: 'motivo', align: 'center' },
  { title: 'Antigüedad', key: 'diasServicio', align: 'center' },
]

const tasaRotacion = computed(() => {
  if (!stats.totalActivos) return 0
  return ((stats.totalBajas12Meses / stats.totalActivos) * 100).toFixed(1)
})
const promMeses = computed(() => Math.round(stats.promDiasServicio / 30))

const fmt = d => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—'
const motivoColor = m => ({ RENUNCIA: 'warning', DESPIDO: 'error', TERMINO_CONTRATO: 'info', JUBILACION: 'success', OTRO: 'secondary' }[m] ?? 'secondary')
function showSnack(text, color = 'success') { snack.text = text; snack.color = color; snack.show = true }

async function cargar() {
  loadingBajas.value = true
  try {
    const [b, s] = await Promise.all([store.getBajas(), store.getRotacionStats()])
    bajas.value = b
    Object.assign(stats, s)
  } catch { showSnack('Error al cargar', 'error') }
  finally { loadingBajas.value = false }
}

async function abrirBaja() {
  Object.assign(form, { username: null, fechaBaja: new Date().toISOString().slice(0, 10), motivo: '', descripcion: '' })
  formError.value = ''
  if (!empleados.value.length) empleados.value = await store.fetchPersonal()
  dialog.value = true
}

async function submitBaja() {
  if (!form.username || !form.fechaBaja || !form.motivo) { formError.value = 'Campos requeridos'; return }
  saving.value = true; formError.value = ''
  try {
    await store.registrarBaja(form)
    showSnack('Baja registrada. Usuario desactivado.')
    dialog.value = false
    await cargar()
  } catch (err) { formError.value = err.response?.data?.message || 'Error' }
  finally { saving.value = false }
}

onMounted(cargar)
</script>
