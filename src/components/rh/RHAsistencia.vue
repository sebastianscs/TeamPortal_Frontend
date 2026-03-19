<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">Registro de Asistencia</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          Marca la asistencia de los empleados por período de nómina
        </div>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-content-save"
        :loading="saving"
        :disabled="!periodo || !hayCambios"
        @click="guardar"
      >
        Guardar cambios
      </v-btn>
    </div>

    <!-- Selector de período -->
    <v-card class="mb-4" variant="tonal">
      <v-card-text class="d-flex align-center gap-4">
        <v-select
          v-model="periodoId"
          :items="periodos"
          item-title="nombre"
          item-value="id"
          label="Período de nómina"
          density="compact"
          hide-details
          style="max-width: 320px"
          @update:model-value="cargarAsistencia"
        />
        <div v-if="periodo" class="text-body-2 text-medium-emphasis">
          {{ fmtFecha(periodo.fechaInicio) }} — {{ fmtFecha(periodo.fechaFin) }}
          &nbsp;·&nbsp;
          <strong>{{ diasPeriodo.length }}</strong> días hábiles
        </div>
      </v-card-text>
    </v-card>

    <!-- Skeleton -->
    <v-skeleton-loader v-if="loading" type="table-tbody" />

    <!-- Tabla de asistencia -->
    <v-card v-else-if="periodo" variant="tonal">
      <div style="overflow-x: auto">
        <table class="asistencia-grid">
          <thead>
            <tr>
              <th class="col-nombre">Empleado</th>
              <th
                v-for="dia in diasPeriodo"
                :key="dia.fecha"
                class="col-dia"
                :class="{ 'dia-hoy': dia.fecha === hoy }"
              >
                <div class="text-caption text-medium-emphasis">{{ dia.diaSemana }}</div>
                <div class="text-body-2 font-weight-medium">{{ dia.dia }}</div>
              </th>
              <th class="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in empleados" :key="emp.username">
              <td class="col-nombre">
                <div class="text-body-2 font-weight-medium">{{ emp.nombre }}</div>
                <div class="text-caption text-medium-emphasis">{{ emp.username }}</div>
              </td>
              <td
                v-for="dia in diasPeriodo"
                :key="dia.fecha"
                class="col-dia text-center"
              >
                <v-checkbox
                  v-model="grid[emp.username][dia.fecha]"
                  hide-details
                  density="compact"
                  color="success"
                  class="d-flex justify-center"
                  @update:model-value="marcarCambio(emp.username, dia.fecha)"
                />
              </td>
              <td class="col-total text-center">
                <v-chip
                  :color="diasTrabajados(emp.username) === diasPeriodo.length ? 'success' : 'warning'"
                  size="small"
                  variant="tonal"
                >
                  {{ diasTrabajados(emp.username) }} / {{ diasPeriodo.length }}
                </v-chip>
              </td>
            </tr>
            <tr v-if="empleados.length === 0">
              <td :colspan="diasPeriodo.length + 2" class="text-center pa-6 text-medium-emphasis">
                No hay empleados con esta frecuencia de pago
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Leyenda -->
      <v-divider />
      <div class="pa-3 d-flex align-center gap-4 text-caption text-medium-emphasis">
        <div class="d-flex align-center gap-1">
          <v-icon size="14" color="success">mdi-checkbox-marked</v-icon>
          Asistió
        </div>
        <div class="d-flex align-center gap-1">
          <v-icon size="14">mdi-checkbox-blank-outline</v-icon>
          Falta
        </div>
        <v-spacer />
        <span v-if="hayCambios" class="text-warning">
          <v-icon size="14">mdi-circle</v-icon>
          Hay cambios sin guardar
        </span>
      </div>
    </v-card>

    <!-- Sin período seleccionado -->
    <v-card v-else variant="tonal" class="text-center pa-8">
      <v-icon size="48" color="medium-emphasis">mdi-calendar-clock</v-icon>
      <div class="text-body-1 mt-3 text-medium-emphasis">Selecciona un período para comenzar</div>
    </v-card>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom end">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRHStore } from '@/stores/rh'
import { useNominaStore } from '@/stores/nomina'

const rhStore    = useRHStore()
const nominaStore = useNominaStore()

const periodoId  = ref(null)
const periodos   = ref([])
const periodo    = ref(null)
const empleados  = ref([])
const loading    = ref(false)
const saving     = ref(false)
const snack      = reactive({ show: false, text: '', color: 'success' })

// grid[username][fecha] = true/false
const grid    = reactive({})
// cambios[username][fecha] = true (marcado como modificado)
const cambios = reactive({})

const hoy = new Date().toISOString().slice(0, 10)

const hayCambios = computed(() =>
  Object.values(cambios).some(emp => Object.keys(emp).length > 0)
)

// Genera los días hábiles (L-V) del período
const diasPeriodo = computed(() => {
  if (!periodo.value) return []
  const dias = []
  const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  let cur = new Date(periodo.value.fechaInicio + 'T12:00:00')
  const fin = new Date(periodo.value.fechaFin + 'T12:00:00')
  while (cur <= fin) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) {
      const fecha = cur.toISOString().slice(0, 10)
      dias.push({
        fecha,
        dia:      String(cur.getDate()).padStart(2, '0'),
        diaSemana: DIAS[dow],
      })
    }
    cur.setDate(cur.getDate() + 1)
  }
  return dias
})

function diasTrabajados(username) {
  return diasPeriodo.value.filter(d => grid[username]?.[d.fecha]).length
}

function fmtFecha(fecha) {
  if (!fecha) return ''
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

function marcarCambio(username, fecha) {
  if (!cambios[username]) cambios[username] = {}
  cambios[username][fecha] = true
}

async function cargarPeriodos() {
  try {
    await nominaStore.fetchPeriodos()
    periodos.value = (nominaStore.periodos ?? []).filter(p => p.estado === 'ABIERTO')
  } catch {
    periodos.value = []
  }
}

async function cargarAsistencia() {
  if (!periodoId.value) return
  loading.value = true

  // Limpiar estado
  Object.keys(grid).forEach(k => delete grid[k])
  Object.keys(cambios).forEach(k => delete cambios[k])

  try {
    const data = await rhStore.getAsistenciaPeriodo(periodoId.value)
    periodo.value  = data.periodo
    empleados.value = data.empleados

    // Inicializar grid: por defecto todos los días hábiles = true (presente)
    // luego sobreescribir con lo que ya está en BD
    for (const emp of data.empleados) {
      grid[emp.username] = {}
      for (const dia of diasPeriodo.value) {
        const registro = data.asistencias[emp.username]?.[dia.fecha]
        if (registro) {
          // Usa lo que ya está guardado: presente si descuenta=0, falta si descuenta=1
          grid[emp.username][dia.fecha] = registro.descuenta === 0 || registro.descuenta === false
        } else {
          // Sin registro previo: dejar en false (no marcado) para que RH lo capture
          grid[emp.username][dia.fecha] = false
        }
      }
    }
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error al cargar asistencia', 'error')
  } finally {
    loading.value = false
  }
}

async function guardar() {
  saving.value = true
  try {
    const registros = []
    for (const emp of empleados.value) {
      for (const dia of diasPeriodo.value) {
        // Solo enviar los que fueron modificados
        if (cambios[emp.username]?.[dia.fecha] !== undefined) {
          registros.push({
            usuarioId: emp.username,
            fecha:     dia.fecha,
            presente:  grid[emp.username][dia.fecha],
          })
        }
      }
    }

    if (registros.length === 0) {
      showSnack('No hay cambios que guardar', 'info')
      return
    }

    await rhStore.registrarAsistencias(registros)

    // Limpiar rastro de cambios
    Object.keys(cambios).forEach(k => delete cambios[k])
    showSnack('Asistencia guardada correctamente', 'success')
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}

function showSnack(text, color) {
  snack.text  = text
  snack.color = color
  snack.show  = true
}

onMounted(cargarPeriodos)
</script>

<style scoped>
.asistencia-grid {
  width: 100%;
  border-collapse: collapse;
}
.asistencia-grid th,
.asistencia-grid td {
  padding: 6px 4px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  white-space: nowrap;
}
.col-nombre {
  min-width: 180px;
  max-width: 220px;
  padding-left: 16px !important;
  text-align: left;
}
.col-dia {
  min-width: 52px;
  text-align: center;
}
.col-total {
  min-width: 72px;
  padding-right: 16px !important;
}
.dia-hoy {
  background: rgba(var(--v-theme-primary), 0.08);
}
thead th {
  background: rgba(255,255,255,0.04);
  font-weight: 600;
  padding-top: 10px;
  padding-bottom: 10px;
}
</style>
