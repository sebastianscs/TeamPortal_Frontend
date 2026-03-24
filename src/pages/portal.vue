<script setup>
import { definePage } from 'unplugin-vue-router/runtime'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRHStore } from '@/stores/rh'

definePage({ meta: { layout: 'auth' } })

const store  = useRHStore()
const nombre = localStorage.getItem('name') || 'Empleado'
const me     = (localStorage.getItem('user') || '').replace(/"/g, '')
const tab    = ref('vacaciones')

const disponibles  = reactive({ diasDisponibles: null, diasTotales: null, diasUsados: null, anios: null })
const solicitudes  = ref([])
const tareasOnb    = ref([])
const loadingVac   = ref(false)
const dialogVac    = ref(false)
const savingVac    = ref(false)
const errVac       = ref('')
const formVac      = reactive({ fechaInicio: '', fechaFin: '' })
const snack        = reactive({ show: false, text: '', color: 'success' })

const hdrsVac = [
  { title: 'Periodo', key: 'fechaInicio' },
  { title: 'Días', key: 'diasSolicitados', align: 'center' },
  { title: 'Estatus', key: 'estatus', align: 'center' },
]

const pctOnb = computed(() => tareasOnb.value.length ? Math.round(tareasOnb.value.filter(t=>t.completada).length / tareasOnb.value.length * 100) : 0)
const fmt = d => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—'
const estatusColor = e => ({ PENDIENTE: 'warning', APROBADA: 'success', RECHAZADA: 'error', CANCELADA: 'secondary' }[e] ?? 'secondary')
function showSnack(text, color = 'success') { snack.text = text; snack.color = color; snack.show = true }

async function submitVac() {
  if (!formVac.fechaInicio || !formVac.fechaFin) { errVac.value = 'Fechas requeridas'; return }
  savingVac.value = true; errVac.value = ''
  try {
    const r = await store.createSolicitudVacaciones({ fechaInicio: formVac.fechaInicio, fechaFin: formVac.fechaFin })
    showSnack(`Solicitud enviada: ${r.diasSolicitados} días hábiles`)
    dialogVac.value = false
    solicitudes.value = await store.getSolicitudesVacaciones()
  } catch (err) { errVac.value = err.response?.data?.message || 'Error' }
  finally { savingVac.value = false }
}

onMounted(async () => {
  loadingVac.value = true
  try {
    const [disp, sols, tareas] = await Promise.all([
      store.getVacacionesDisponibles(me),
      store.getSolicitudesVacaciones(),
      store.getTareasEmpleado(me),
    ])
    Object.assign(disponibles, disp)
    solicitudes.value = sols
    tareasOnb.value = tareas
  } catch { showSnack('Error al cargar datos', 'error') }
  finally { loadingVac.value = false }
})
</script>

<template>
  <v-container fluid class="pa-6">
    <div class="text-h5 font-weight-bold mb-1">Mi Portal</div>
    <div class="text-body-2 text-medium-emphasis mb-4">Bienvenido, {{ nombre }}</div>

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="vacaciones"><v-icon start>mdi-beach</v-icon>Vacaciones</v-tab>
      <v-tab value="onboarding"><v-icon start>mdi-clipboard-check-outline</v-icon>Mis tareas</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- Mis vacaciones -->
      <v-window-item value="vacaciones">
        <v-row dense class="mb-4">
          <v-col cols="6" sm="3">
            <v-card color="surface-variant" rounded="lg" variant="tonal">
              <div class="pa-3 text-center">
                <div class="text-h5 font-weight-bold text-primary">{{ disponibles.diasDisponibles ?? '—' }}</div>
                <div class="text-caption text-medium-emphasis">Días disponibles</div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card color="surface-variant" rounded="lg" variant="tonal">
              <div class="pa-3 text-center">
                <div class="text-h5 font-weight-bold text-secondary">{{ disponibles.diasTotales ?? '—' }}</div>
                <div class="text-caption text-medium-emphasis">Días totales (LFT)</div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card color="surface-variant" rounded="lg" variant="tonal">
              <div class="pa-3 text-center">
                <div class="text-h5 font-weight-bold text-warning">{{ disponibles.diasUsados ?? '—' }}</div>
                <div class="text-caption text-medium-emphasis">Días usados</div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card color="surface-variant" rounded="lg" variant="tonal">
              <div class="pa-3 text-center">
                <div class="text-h5 font-weight-bold text-info">{{ disponibles.anios ?? '—' }}</div>
                <div class="text-caption text-medium-emphasis">Años de servicio</div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div class="d-flex align-center justify-space-between mb-3">
          <div class="text-body-1 font-weight-bold">Mis solicitudes</div>
          <v-btn color="primary" prepend-icon="mdi-plus" size="small" variant="tonal" @click="dialogVac = true">Solicitar vacaciones</v-btn>
        </div>

        <v-data-table :headers="hdrsVac" :items="solicitudes" :loading="loadingVac" hover density="compact">
          <template #item.fechaInicio="{ item }">
            <span class="text-caption">{{ fmt(item.fechaInicio) }} – {{ fmt(item.fechaFin) }}</span>
          </template>
          <template #item.diasSolicitados="{ item }">
            <v-chip size="x-small" color="info" variant="tonal">{{ item.diasSolicitados }} días</v-chip>
          </template>
          <template #item.estatus="{ item }">
            <v-chip :color="estatusColor(item.estatus)" size="x-small" variant="tonal">{{ item.estatus }}</v-chip>
          </template>
        </v-data-table>
      </v-window-item>

      <!-- Mis tareas de onboarding -->
      <v-window-item value="onboarding">
        <div v-if="tareasOnb.length">
          <div class="d-flex align-center gap-3 mb-4">
            <v-progress-linear :model-value="pctOnb" color="primary" rounded height="10" />
            <span class="text-caption text-medium-emphasis" style="white-space:nowrap">{{ tareasOnb.filter(t=>t.completada).length }}/{{ tareasOnb.length }} completadas</span>
          </div>
          <v-list bg-color="surface-variant" rounded="lg">
            <v-list-item v-for="t in tareasOnb" :key="t.id" class="py-2">
              <template #prepend>
                <v-icon :color="t.completada ? 'success' : 'medium-emphasis'" size="22">
                  {{ t.completada ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                </v-icon>
              </template>
              <template #title>
                <span :style="t.completada ? 'text-decoration:line-through' : ''" class="text-body-2">{{ t.nombre }}</span>
              </template>
              <template #subtitle>
                <span class="text-caption">{{ t.descripcion }}</span>
              </template>
            </v-list-item>
          </v-list>
        </div>
        <div v-else class="text-center py-8 text-medium-emphasis">
          <v-icon size="48" class="mb-2">mdi-clipboard-check-outline</v-icon>
          <div class="text-body-2">Sin tareas de incorporación pendientes</div>
        </div>
      </v-window-item>
    </v-window>

    <!-- Dialog solicitar vacaciones -->
    <v-dialog v-model="dialogVac" max-width="400" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">Solicitar vacaciones</span>
          <v-btn icon size="small" variant="text" @click="dialogVac = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <v-row dense>
            <v-col cols="6"><v-text-field v-model="formVac.fechaInicio" type="date" label="Inicio" variant="outlined" density="comfortable" /></v-col>
            <v-col cols="6"><v-text-field v-model="formVac.fechaFin" type="date" label="Fin" variant="outlined" density="comfortable" /></v-col>
          </v-row>
          <v-alert v-if="errVac" :text="errVac" color="error" density="compact" type="error" variant="tonal" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogVac = false">Cancelar</v-btn>
          <v-btn color="primary" variant="tonal" :loading="savingVac" @click="submitVac">Solicitar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom end">{{ snack.text }}</v-snackbar>
  </v-container>
</template>
