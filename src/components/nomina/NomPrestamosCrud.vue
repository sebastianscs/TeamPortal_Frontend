<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-body-1 font-weight-bold">Préstamos y anticipos</div>
        <div class="text-caption text-medium-emphasis">La cuota se descuenta automáticamente al generar nómina</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" size="small" variant="tonal" @click="openDialog()">Nuevo préstamo</v-btn>
    </div>

    <!-- Resumen cards -->
    <v-row dense class="mb-4">
      <v-col cols="6" sm="3">
        <v-card color="surface-variant" rounded="lg" variant="tonal">
          <div class="pa-3 text-center">
            <div class="text-h6 font-weight-bold text-primary">{{ store.prestamos.filter(p => p.activo).length }}</div>
            <div class="text-caption text-medium-emphasis">Activos</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card color="surface-variant" rounded="lg" variant="tonal">
          <div class="pa-3 text-center">
            <div class="text-h6 font-weight-bold text-error">{{ fmt(totalSaldo) }}</div>
            <div class="text-caption text-medium-emphasis">Saldo total</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card variant="tonal">
      <v-data-table :headers="headers" :items="store.prestamos" item-value="id" hover>
        <template #item.nombreCompleto="{ item }">
          <div class="font-weight-medium">{{ item.nombreCompleto }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.puesto }}</div>
        </template>
        <template #item.montoTotal="{ item }">
          <span class="text-body-2">{{ fmt(item.montoTotal) }}</span>
        </template>
        <template #item.saldoPendiente="{ item }">
          <v-chip :color="item.saldoPendiente > 0 ? 'warning' : 'success'" size="small" variant="tonal">
            {{ fmt(item.saldoPendiente) }}
          </v-chip>
        </template>
        <template #item.cuotaQuincenal="{ item }">
          <span class="text-body-2">{{ fmt(item.cuotaQuincenal) }}</span>
        </template>
        <template #item.activo="{ item }">
          <v-chip :color="item.activo ? 'success' : 'default'" size="small" variant="tonal">
            {{ item.activo ? 'Activo' : 'Liquidado' }}
          </v-chip>
        </template>
        <template #item.fechaInicio="{ item }">
          <span class="text-caption">{{ fmtFecha(item.fechaInicio) }}</span>
        </template>
        <template #item.acciones="{ item }">
          <v-btn color="primary" icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">{{ form.id ? 'Editar préstamo' : 'Nuevo préstamo' }}</span>
          <v-btn icon size="small" variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <v-autocomplete
            v-if="!form.id"
            v-model="form.username"
            :items="empleados"
            item-title="nombreCompleto"
            item-value="username"
            label="Empleado *"
            variant="outlined"
            density="comfortable"
            :custom-filter="searchFilter"
          />
          <v-text-field v-model="form.concepto" label="Concepto" variant="outlined" density="comfortable" />
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model.number="form.montoTotal" label="Monto total *" type="number" prefix="$" variant="outlined" density="comfortable" :disabled="!!form.id" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="form.cuotaQuincenal" label="Cuota por período *" type="number" prefix="$" variant="outlined" density="comfortable" />
            </v-col>
          </v-row>
          <v-row dense v-if="form.id">
            <v-col cols="6">
              <v-text-field v-model.number="form.saldoPendiente" label="Saldo pendiente" type="number" prefix="$" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="6">
              <v-switch v-model="form.activo" label="Activo" color="primary" hide-details density="compact" class="mt-2" />
            </v-col>
          </v-row>
          <v-text-field v-if="!form.id" v-model="form.fechaInicio" label="Fecha inicio" type="date" variant="outlined" density="comfortable" />
          <v-alert v-if="formError" :text="formError" color="error" density="compact" type="error" variant="tonal" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="tonal" :loading="saving" @click="submit">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" location="bottom end" :timeout="3000">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useNominaStore } from '@/stores/nomina'
import { searchFilter } from '@/utils/search'
import api from '@/api'

const store   = useNominaStore()
const dialog  = ref(false)
const saving  = ref(false)
const formError = ref('')
const empleados = ref([])
const snack   = reactive({ show: false, text: '', color: 'success' })

const FORM_DEF = { id: null, username: null, concepto: 'Préstamo', montoTotal: null, cuotaQuincenal: null, saldoPendiente: null, fechaInicio: '', activo: true }
const form = reactive({ ...FORM_DEF })

const headers = [
  { title: 'Empleado',     key: 'nombreCompleto',  sortable: true },
  { title: 'Concepto',     key: 'concepto',        sortable: false },
  { title: 'Monto total',  key: 'montoTotal',      sortable: true, align: 'end' },
  { title: 'Saldo',        key: 'saldoPendiente',  sortable: true, align: 'center' },
  { title: 'Cuota/período',key: 'cuotaQuincenal',  sortable: false, align: 'end' },
  { title: 'Inicio',       key: 'fechaInicio',     sortable: true },
  { title: 'Estado',       key: 'activo',          sortable: true, align: 'center', width: '100px' },
  { title: '',             key: 'acciones',        sortable: false, width: '60px', align: 'end' },
]

const totalSaldo = computed(() => store.prestamos.filter(p => p.activo).reduce((s, p) => s + Number(p.saldoPendiente || 0), 0))

const fmt = (n) => n != null ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n)) : '—'
const fmtFecha = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—'

function openDialog (item = null) {
  formError.value = ''
  Object.assign(form, item
    ? { ...item, activo: !!item.activo }
    : { ...FORM_DEF, fechaInicio: new Date().toISOString().slice(0, 10) })
  dialog.value = true
}

async function submit () {
  if (!form.montoTotal || !form.cuotaQuincenal) { formError.value = 'Monto y cuota son requeridos'; return }
  saving.value = true; formError.value = ''
  try {
    if (form.id) {
      await store.updatePrestamo(form.id, { concepto: form.concepto, cuotaQuincenal: form.cuotaQuincenal, saldoPendiente: form.saldoPendiente, activo: form.activo ? 1 : 0 })
    } else {
      await store.createPrestamo({ username: form.username, concepto: form.concepto, montoTotal: form.montoTotal, cuotaQuincenal: form.cuotaQuincenal, fechaInicio: form.fechaInicio })
    }
    dialog.value = false
    Object.assign(snack, { show: true, text: 'Guardado correctamente', color: 'success' })
    await store.fetchPrestamos()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await store.fetchPrestamos()
  const res = await api.get('/rh/personal')
  empleados.value = res.data.data ?? []
})
</script>
