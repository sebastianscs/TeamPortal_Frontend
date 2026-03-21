<template>
  <div>
    <!-- Header con botón crear -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
      <div class="text-body-2 text-medium-emphasis">
        {{ turnos.length }} turno{{ turnos.length !== 1 ? 's' : '' }} registrado{{ turnos.length !== 1 ? 's' : '' }}
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
        Nuevo turno
      </v-btn>
    </div>

    <!-- Tabla de turnos -->
    <v-card variant="tonal">
      <v-data-table
        :headers="headers"
        :items="turnos"
        :loading="loading"
        item-value="id"
        no-data-text="No hay turnos registrados"
      >
        <template #item.horaEntrada="{ item }">
          {{ fmtHora(item.horaEntrada) }}
        </template>
        <template #item.horaSalida="{ item }">
          {{ fmtHora(item.horaSalida) }}
        </template>
        <template #item.diasLaborables="{ item }">
          <v-chip size="x-small" variant="tonal" color="info">
            {{ DIAS_LABELS[item.diasLaborables] ?? item.diasLaborables }}
          </v-chip>
        </template>
        <template #item.activo="{ item }">
          <v-chip :color="item.activo ? 'success' : 'error'" size="x-small" variant="tonal">
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>
        <template #item.acciones="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEdit(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog crear/editar turno -->
    <v-dialog v-model="dialog" max-width="520" persistent scrollable>
      <v-card>
        <v-card-title class="pa-4 pb-2 text-h6">
          {{ editando ? 'Editar turno' : 'Nuevo turno' }}
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="formRef">
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="form.clave"
                  label="Clave *"
                  variant="outlined"
                  density="compact"
                  placeholder="T-ADM"
                  :rules="[v => !!v || 'Requerido']"
                />
              </v-col>
              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="form.nombre"
                  label="Nombre *"
                  variant="outlined"
                  density="compact"
                  placeholder="Turno diurno administrativo"
                  :rules="[v => !!v || 'Requerido']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.horaEntrada"
                  label="Hora de entrada *"
                  variant="outlined"
                  density="compact"
                  type="time"
                  :rules="[v => !!v || 'Requerido']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.horaSalida"
                  label="Hora de salida *"
                  variant="outlined"
                  density="compact"
                  type="time"
                  :rules="[v => !!v || 'Requerido']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.toleranciaEntrada"
                  label="Tolerancia entrada (min)"
                  variant="outlined"
                  density="compact"
                  type="number"
                  min="0"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.toleranciaSalida"
                  label="Tolerancia salida (min)"
                  variant="outlined"
                  density="compact"
                  type="number"
                  min="0"
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="form.diasLaborables"
                  :items="diasOpciones"
                  item-title="label"
                  item-value="value"
                  label="Días laborables *"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col v-if="editando" cols="12">
                <v-switch
                  v-model="form.activo"
                  color="success"
                  density="compact"
                  hide-details
                  label="Turno activo"
                />
              </v-col>
            </v-row>

            <!-- Resumen del turno -->
            <v-alert v-if="form.horaEntrada && form.horaSalida" class="mt-3" density="compact" type="info" variant="tonal">
              Duración: <strong>{{ duracion }}</strong> horas
              · Tolerancia entrada: <strong>{{ form.toleranciaEntrada ?? 10 }} min</strong>
              · Tolerancia salida: <strong>{{ form.toleranciaSalida ?? 10 }} min</strong>
            </v-alert>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="guardar">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" location="bottom end" timeout="3000">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRHStore } from '@/stores/rh'

const store = useRHStore()

const DIAS_LABELS = {
  'L-V':  'Lunes a viernes',
  'L-S':  'Lunes a sábado',
  'L-D':  'Lunes a domingo',
}

const diasOpciones = [
  { value: 'L-V', label: 'Lunes a viernes' },
  { value: 'L-S', label: 'Lunes a sábado' },
  { value: 'L-D', label: 'Lunes a domingo' },
]

const headers = [
  { title: 'Clave',    key: 'clave',    width: '110px' },
  { title: 'Nombre',   key: 'nombre' },
  { title: 'Entrada',  key: 'horaEntrada',  width: '90px' },
  { title: 'Salida',   key: 'horaSalida',   width: '90px' },
  { title: 'Tol. ent', key: 'toleranciaEntrada', width: '90px' },
  { title: 'Tol. sal', key: 'toleranciaSalida',  width: '90px' },
  { title: 'Días',     key: 'diasLaborables', width: '140px' },
  { title: 'Estado',   key: 'activo',   width: '90px' },
  { title: '',         key: 'acciones', sortable: false, width: '50px' },
]

const turnos  = ref([])
const loading = ref(false)
const saving  = ref(false)
const dialog  = ref(false)
const editando = ref(false)
const formRef = ref(null)
const snack   = reactive({ show: false, text: '', color: 'success' })

const FORM_DEFAULT = {
  clave: '', nombre: '', horaEntrada: '', horaSalida: '',
  toleranciaEntrada: 10, toleranciaSalida: 10,
  diasLaborables: 'L-V', activo: true,
}
const form = reactive({ ...FORM_DEFAULT })
let editId = null

const duracion = computed(() => {
  if (!form.horaEntrada || !form.horaSalida) return '--'
  const [hE, mE] = form.horaEntrada.split(':').map(Number)
  const [hS, mS] = form.horaSalida.split(':').map(Number)
  const mins = (hS * 60 + mS) - (hE * 60 + mE)
  return mins > 0 ? (mins / 60).toFixed(1) : '--'
})

function fmtHora (val) {
  if (!val) return '--'
  return String(val).slice(0, 5)
}

function openCreate () {
  editando.value = false
  editId = null
  Object.assign(form, FORM_DEFAULT)
  dialog.value = true
}

function openEdit (item) {
  editando.value = true
  editId = item.id
  Object.assign(form, {
    clave:             item.clave,
    nombre:            item.nombre,
    horaEntrada:       String(item.horaEntrada).slice(0, 5),
    horaSalida:        String(item.horaSalida).slice(0, 5),
    toleranciaEntrada: item.toleranciaEntrada,
    toleranciaSalida:  item.toleranciaSalida,
    diasLaborables:    item.diasLaborables,
    activo:            !!item.activo,
  })
  dialog.value = true
}

async function guardar () {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    if (editando.value) {
      await store.updateTurno(editId, { ...form })
    } else {
      await store.createTurno({ ...form })
    }
    dialog.value = false
    showSnack(editando.value ? 'Turno actualizado' : 'Turno creado', 'success')
    await cargar()
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}

async function cargar () {
  loading.value = true
  try {
    turnos.value = await store.fetchTurnos()
  } finally {
    loading.value = false
  }
}

function showSnack (text, color) {
  snack.text = text
  snack.color = color
  snack.show = true
}

onMounted(cargar)
</script>
