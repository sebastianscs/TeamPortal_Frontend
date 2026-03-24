<template>
  <div>
    <v-tabs v-model="subTab" color="primary" class="mb-4">
      <v-tab value="plantilla">Plantilla de tareas</v-tab>
      <v-tab value="empleados">Por empleado</v-tab>
    </v-tabs>

    <v-window v-model="subTab">
      <!-- PLANTILLA -->
      <v-window-item value="plantilla">
        <div class="d-flex justify-end mb-3">
          <v-btn color="primary" prepend-icon="mdi-plus" size="small" variant="tonal" @click="abrirTarea()">Nueva tarea</v-btn>
        </div>
        <v-data-table :headers="hdrsPlantilla" :items="plantilla" :loading="loading" hover>
          <template #item.activo="{ item }">
            <v-chip :color="item.activo ? 'success' : 'default'" size="x-small" variant="tonal">{{ item.activo ? 'Activa' : 'Inactiva' }}</v-chip>
          </template>
          <template #item.acciones="{ item }">
            <v-btn icon="mdi-pencil" size="x-small" variant="text" color="primary" @click="abrirTarea(item)" />
          </template>
        </v-data-table>
      </v-window-item>

      <!-- POR EMPLEADO -->
      <v-window-item value="empleados">
        <v-row dense class="mb-4" align="center">
          <v-col cols="12" sm="5">
            <v-autocomplete v-model="empSeleccionado" :items="empleados" item-title="nombreCompleto" item-value="username" label="Seleccionar empleado" variant="outlined" density="compact" hide-details :custom-filter="searchFilter" @update:model-value="cargarTareasEmp" />
          </v-col>
          <v-col cols="auto">
            <v-btn :disabled="!empSeleccionado" color="primary" size="small" variant="tonal" @click="asignar">Asignar plantilla</v-btn>
          </v-col>
        </v-row>

        <div v-if="tareasEmp.length">
          <v-card variant="tonal" rounded="lg">
            <v-list>
              <v-list-item
                v-for="t in tareasEmp" :key="t.id"
                :class="t.completada ? 'text-medium-emphasis' : ''"
              >
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="!!t.completada"
                    color="primary"
                    @update:model-value="v => completar(t, v)"
                  />
                </template>
                <template #title>
                  <span :style="t.completada ? 'text-decoration:line-through' : ''">{{ t.nombre }}</span>
                </template>
                <template #subtitle>
                  <span class="text-caption">
                    Límite: {{ fmt(t.fechaLimite) }}
                    <span v-if="t.completada"> · Completada {{ fmt(t.fechaCompletada) }}</span>
                    <span v-else-if="vencida(t.fechaLimite)" class="text-error"> · Vencida</span>
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>

          <div class="d-flex align-center gap-3 mt-3">
            <v-progress-linear :model-value="pct" color="primary" rounded height="8" />
            <span class="text-caption text-medium-emphasis" style="white-space:nowrap">{{ tareasEmp.filter(t=>t.completada).length }}/{{ tareasEmp.length }}</span>
          </div>
        </div>
        <div v-else-if="empSeleccionado" class="text-center py-6 text-medium-emphasis text-caption">Sin tareas asignadas</div>
      </v-window-item>
    </v-window>

    <!-- Dialog tarea -->
    <v-dialog v-model="dialogTarea" max-width="440" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">{{ formTarea.id ? 'Editar tarea' : 'Nueva tarea' }}</span>
          <v-btn icon size="small" variant="text" @click="dialogTarea = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <v-text-field v-model="formTarea.nombre" label="Nombre *" variant="outlined" density="comfortable" />
          <v-textarea v-model="formTarea.descripcion" label="Descripción" variant="outlined" density="comfortable" rows="2" auto-grow />
          <v-row dense>
            <v-col cols="6"><v-text-field v-model.number="formTarea.diasLimite" label="Días límite" type="number" variant="outlined" density="comfortable" /></v-col>
            <v-col cols="6"><v-text-field v-model.number="formTarea.orden" label="Orden" type="number" variant="outlined" density="comfortable" /></v-col>
          </v-row>
          <v-switch v-if="formTarea.id" v-model="formTarea.activo" label="Activa" color="primary" hide-details density="compact" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogTarea = false">Cancelar</v-btn>
          <v-btn color="primary" variant="tonal" :loading="saving" @click="guardarTarea">Guardar</v-btn>
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
const subTab     = ref('plantilla')
const loading    = ref(false)
const saving     = ref(false)
const dialogTarea = ref(false)
const plantilla  = ref([])
const empleados  = ref([])
const tareasEmp  = ref([])
const empSeleccionado = ref(null)
const snack = reactive({ show: false, text: '', color: 'success' })
const FORM_DEF = { id: null, nombre: '', descripcion: '', diasLimite: 7, orden: 0, activo: true }
const formTarea = reactive({ ...FORM_DEF })

const hdrsPlantilla = [
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Descripción', key: 'descripcion' },
  { title: 'Días límite', key: 'diasLimite', align: 'center' },
  { title: 'Orden', key: 'orden', align: 'center' },
  { title: 'Estado', key: 'activo', align: 'center' },
  { title: '', key: 'acciones', sortable: false, align: 'end' },
]

const pct = computed(() => {
  if (!tareasEmp.value.length) return 0
  return Math.round(tareasEmp.value.filter(t => t.completada).length / tareasEmp.value.length * 100)
})

const fmt = d => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—'
const vencida = d => d && new Date(d) < new Date()
function showSnack(text, color = 'success') { snack.text = text; snack.color = color; snack.show = true }

async function cargarPlantilla() {
  loading.value = true
  try { plantilla.value = await store.getPlantillaOnboarding() }
  catch { showSnack('Error', 'error') }
  finally { loading.value = false }
}

async function cargarTareasEmp(u) {
  if (!u) { tareasEmp.value = []; return }
  try { tareasEmp.value = await store.getTareasEmpleado(u) }
  catch { showSnack('Error al cargar tareas', 'error') }
}

function abrirTarea(item = null) {
  Object.assign(formTarea, item ? { ...item } : { ...FORM_DEF })
  dialogTarea.value = true
}

async function guardarTarea() {
  if (!formTarea.nombre) { showSnack('Nombre requerido', 'warning'); return }
  saving.value = true
  try {
    if (formTarea.id) await store.updateTareaOnboarding(formTarea.id, formTarea)
    else await store.createTareaOnboarding(formTarea)
    dialogTarea.value = false
    showSnack('Guardado')
    await cargarPlantilla()
  } catch { showSnack('Error', 'error') }
  finally { saving.value = false }
}

async function asignar() {
  try {
    await store.asignarOnboarding(empSeleccionado.value)
    showSnack('Plantilla asignada')
    await cargarTareasEmp(empSeleccionado.value)
  } catch { showSnack('Error', 'error') }
}

async function completar(tarea, val) {
  try {
    await store.completarTareaOnboarding(empSeleccionado.value, tarea.tareaId, val)
    await cargarTareasEmp(empSeleccionado.value)
  } catch { showSnack('Error', 'error') }
}

onMounted(async () => {
  await cargarPlantilla()
  const p = await store.fetchPersonal()
  empleados.value = p
})
</script>
