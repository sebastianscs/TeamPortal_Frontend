<template>
  <div>
    <v-tabs v-model="subtab" color="primary" class="mb-4">
      <v-tab value="conceptos" prepend-icon="mdi-percent">Tasas IMSS / INFONAVIT</v-tab>
      <v-tab value="isr" prepend-icon="mdi-table">Tablas ISR</v-tab>
    </v-tabs>

    <v-window v-model="subtab">

      <!-- CONCEPTOS -->
      <v-window-item value="conceptos">
        <div class="text-body-2 text-medium-emphasis mb-3">
          Porcentajes aplicados como deducción sobre el total de percepciones de cada empleado.
        </div>
        <v-card variant="tonal">
          <v-data-table :headers="conceptoHeaders" :items="nominaStore.conceptos" :loading="nominaStore.loading" item-value="id" hover>
            <template #item.porcentaje="{ item }">
              <template v-if="editingId === item.id">
                <v-text-field v-model.number="editPct" density="compact" hide-details type="number" style="max-width:120px" variant="outlined" suffix="%" />
              </template>
              <template v-else>{{ (Number(item.porcentaje) * 100).toFixed(2) }}%</template>
            </template>
            <template #item.acciones="{ item }">
              <template v-if="editingId === item.id">
                <v-btn color="success" icon="mdi-check" size="small" variant="text" :loading="saving" @click="savePct(item)" />
                <v-btn icon="mdi-close" size="small" variant="text" @click="editingId = null" />
              </template>
              <template v-else>
                <v-btn color="primary" icon="mdi-pencil" size="small" variant="text" @click="startEdit(item)" />
              </template>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- TABLAS ISR -->
      <v-window-item value="isr">
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
          <div class="d-flex gap-2">
            <v-select v-model="filtroFrecuencia" :items="['QUINCENAL','MENSUAL','SEMANAL']" label="Frecuencia" density="compact" hide-details variant="outlined" style="max-width:160px" clearable />
            <v-select v-model="filtroAnio" :items="aniosDisponibles" label="Año" density="compact" hide-details variant="outlined" style="max-width:110px" clearable />
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" size="small" variant="tonal" @click="openISRDialog()">Agregar rango</v-btn>
        </div>
        <v-card variant="tonal">
          <v-data-table :headers="isrHeaders" :items="isrFiltrada" :loading="loadingISR" item-value="id" hover density="compact">
            <template #item.limiteInferior="{ item }">{{ fmt(item.limiteInferior) }}</template>
            <template #item.limiteSuperior="{ item }">{{ fmt(item.limiteSuperior) }}</template>
            <template #item.cuotaFija="{ item }">{{ fmt(item.cuotaFija) }}</template>
            <template #item.porcentajeExcedente="{ item }">{{ (Number(item.porcentajeExcedente) * 100).toFixed(2) }}%</template>
            <template #item.acciones="{ item }">
              <v-btn color="primary" icon="mdi-pencil" size="small" variant="text" @click="openISRDialog(item)" />
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Dialog ISR -->
    <v-dialog v-model="isrDialog" max-width="480" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">{{ isrForm.id ? 'Editar rango ISR' : 'Nuevo rango ISR' }}</span>
          <v-btn icon size="small" variant="text" @click="isrDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <v-row dense v-if="!isrForm.id">
            <v-col cols="6"><v-select v-model="isrForm.frecuencia" :items="['QUINCENAL','MENSUAL','SEMANAL']" label="Frecuencia *" variant="outlined" density="comfortable" /></v-col>
            <v-col cols="6"><v-text-field v-model.number="isrForm.anio" label="Año *" type="number" variant="outlined" density="comfortable" /></v-col>
          </v-row>
          <v-row dense>
            <v-col cols="6"><v-text-field v-model.number="isrForm.limiteInferior" label="Límite inferior *" type="number" prefix="$" variant="outlined" density="comfortable" /></v-col>
            <v-col cols="6"><v-text-field v-model.number="isrForm.limiteSuperior" label="Límite superior *" type="number" prefix="$" variant="outlined" density="comfortable" /></v-col>
          </v-row>
          <v-row dense>
            <v-col cols="6"><v-text-field v-model.number="isrForm.cuotaFija" label="Cuota fija *" type="number" prefix="$" variant="outlined" density="comfortable" /></v-col>
            <v-col cols="6"><v-text-field v-model.number="isrForm.porcentajeExcedente" label="% sobre excedente *" type="number" suffix="%" variant="outlined" density="comfortable" hint="Ej: 6.4 para 6.4%" persistent-hint /></v-col>
          </v-row>
          <v-alert v-if="isrError" :text="isrError" color="error" density="compact" type="error" variant="tonal" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="isrDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="tonal" :loading="saving" @click="submitISR">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" location="bottom end" :timeout="3000">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useNominaStore } from '@/stores/nomina'

const nominaStore = useNominaStore()
const subtab = ref('conceptos')
const editingId = ref(null)
const editPct   = ref(0)
const saving    = ref(false)
const loadingISR = ref(false)
const isrDialog  = ref(false)
const isrError   = ref('')
const snack = reactive({ show: false, text: '', color: 'success' })
const filtroFrecuencia = ref('QUINCENAL')
const filtroAnio = ref(null)

const ISR_FORM_DEF = { id: null, frecuencia: 'QUINCENAL', anio: new Date().getFullYear(), limiteInferior: 0, limiteSuperior: 0, cuotaFija: 0, porcentajeExcedente: 0 }
const isrForm = reactive({ ...ISR_FORM_DEF })

const conceptoHeaders = [
  { title: 'Clave',      key: 'clave',      sortable: true },
  { title: 'Descripción',key: 'descripcion',sortable: false },
  { title: 'Porcentaje', key: 'porcentaje', sortable: false, align: 'center', width: '160px' },
  { title: '',           key: 'acciones',   sortable: false, width: '100px', align: 'end' },
]
const isrHeaders = [
  { title: 'Frecuencia',   key: 'frecuencia',         sortable: true, width: '120px' },
  { title: 'Año',          key: 'anio',                sortable: true, width: '80px' },
  { title: 'Límite inf.',  key: 'limiteInferior',      sortable: true, align: 'end' },
  { title: 'Límite sup.',  key: 'limiteSuperior',      sortable: true, align: 'end' },
  { title: 'Cuota fija',   key: 'cuotaFija',           sortable: false, align: 'end' },
  { title: '% excedente',  key: 'porcentajeExcedente', sortable: false, align: 'center' },
  { title: '',             key: 'acciones',            sortable: false, width: '60px', align: 'end' },
]

const aniosDisponibles = computed(() => [...new Set(nominaStore.tablaISR.map(r => r.anio))].sort((a, b) => b - a))
const isrFiltrada = computed(() => nominaStore.tablaISR.filter(r =>
  (!filtroFrecuencia.value || r.frecuencia === filtroFrecuencia.value) &&
  (!filtroAnio.value       || r.anio       === filtroAnio.value)
))

const fmt = (n) => n != null ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n)) : '—'

function startEdit (item) { editingId.value = item.id; editPct.value = Number(item.porcentaje) * 100 }

async function savePct (item) {
  saving.value = true
  try {
    await nominaStore.updateConcepto(item.id, { porcentaje: editPct.value / 100 })
    editingId.value = null
    Object.assign(snack, { show: true, text: 'Porcentaje actualizado', color: 'success' })
    await nominaStore.fetchConceptos()
  } finally { saving.value = false }
}

function openISRDialog (item = null) {
  isrError.value = ''
  Object.assign(isrForm, item ? { ...item, porcentajeExcedente: Number(item.porcentajeExcedente) * 100 } : { ...ISR_FORM_DEF })
  isrDialog.value = true
}

async function submitISR () {
  saving.value = true; isrError.value = ''
  try {
    const payload = { ...isrForm, porcentajeExcedente: isrForm.porcentajeExcedente / 100 }
    await nominaStore.upsertTablaISR(payload)
    isrDialog.value = false
    Object.assign(snack, { show: true, text: 'Tabla ISR actualizada', color: 'success' })
    await nominaStore.fetchTablaISR()
  } catch (err) {
    isrError.value = err.response?.data?.message || 'Error al guardar'
  } finally { saving.value = false }
}

onMounted(async () => {
  loadingISR.value = true
  await Promise.all([nominaStore.fetchConceptos(), nominaStore.fetchTablaISR()])
  if (aniosDisponibles.value.length) filtroAnio.value = aniosDisponibles.value[0]
  loadingISR.value = false
})
</script>
