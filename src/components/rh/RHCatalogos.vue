<template>
  <div class="mt-2">
    <v-tabs v-model="subtab" color="primary" class="mb-4">
      <v-tab value="departamentos" prepend-icon="mdi-office-building-outline">Departamentos</v-tab>
      <v-tab value="puestos" prepend-icon="mdi-briefcase-outline">Puestos</v-tab>
    </v-tabs>

    <v-window v-model="subtab">

      <!-- ── DEPARTAMENTOS ── -->
      <v-window-item value="departamentos">
        <div class="d-flex justify-end mb-3">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openDepDialog()">Nuevo departamento</v-btn>
        </div>
        <v-card variant="tonal">
          <v-data-table
            :headers="depHeaders"
            :items="store.departamentos"
            :loading="loading"
            item-value="id"
            hover
          >
            <template #item.activo="{ item }">
              <v-chip :color="item.activo ? 'success' : 'error'" size="small" variant="tonal">
                {{ item.activo ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </template>
            <template #item.acciones="{ item }">
              <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDepDialog(item)" />
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- ── PUESTOS ── -->
      <v-window-item value="puestos">
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
          <v-select
            v-model="filtroDep"
            :items="[{ id: null, nombre: 'Todos' }, ...store.departamentos]"
            item-title="nombre"
            item-value="id"
            label="Filtrar por departamento"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 260px"
          />
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openPuestoDialog()">Nuevo puesto</v-btn>
        </div>
        <v-card variant="tonal">
          <v-data-table
            :headers="puestoHeaders"
            :items="puestosFiltrados"
            :loading="loading"
            item-value="id"
            hover
          >
            <template #item.activo="{ item }">
              <v-chip :color="item.activo ? 'success' : 'error'" size="small" variant="tonal">
                {{ item.activo ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </template>
            <template #item.acciones="{ item }">
              <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openPuestoDialog(item)" />
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

    </v-window>

    <!-- Dialog Departamento -->
    <v-dialog v-model="depDialog" max-width="420" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">{{ depForm.id ? 'Editar' : 'Nuevo' }} departamento</span>
          <v-btn icon size="small" variant="text" @click="depDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <v-text-field
            v-model="depForm.nombre"
            label="Nombre del departamento *"
            variant="outlined"
            density="comfortable"
            autofocus
            :rules="[v => !!v?.trim() || 'Requerido']"
          />
          <v-switch
            v-if="depForm.id"
            v-model="depForm.activo"
            label="Activo"
            color="primary"
            hide-details
            density="compact"
          />
          <v-alert v-if="formError" :text="formError" color="error" density="compact" type="error" variant="tonal" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="depDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="tonal" :loading="saving" @click="submitDep">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Puesto -->
    <v-dialog v-model="puestoDialog" max-width="480" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">{{ puestoForm.id ? 'Editar' : 'Nuevo' }} puesto</span>
          <v-btn icon size="small" variant="text" @click="puestoDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <v-text-field
            v-model="puestoForm.nombre"
            label="Nombre del puesto *"
            variant="outlined"
            density="comfortable"
            autofocus
            :rules="[v => !!v?.trim() || 'Requerido']"
          />
          <v-select
            v-model="puestoForm.departamentoId"
            :items="store.departamentos.filter(d => d.activo)"
            item-title="nombre"
            item-value="id"
            label="Departamento"
            variant="outlined"
            density="comfortable"
            clearable
          />
          <v-switch
            v-if="puestoForm.id"
            v-model="puestoForm.activo"
            label="Activo"
            color="primary"
            hide-details
            density="compact"
          />
          <v-alert v-if="formError" :text="formError" color="error" density="compact" type="error" variant="tonal" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="puestoDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="tonal" :loading="saving" @click="submitPuesto">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" location="bottom end" :timeout="3000">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRHStore } from '@/stores/rh'

const store   = useRHStore()
const subtab  = ref('departamentos')
const loading = ref(false)
const saving  = ref(false)
const formError = ref('')
const filtroDep = ref(null)

const depDialog    = ref(false)
const puestoDialog = ref(false)
const snack = reactive({ show: false, text: '', color: 'success' })

const DEP_DEFAULT    = { id: null, nombre: '', activo: true }
const PUESTO_DEFAULT = { id: null, nombre: '', departamentoId: null, activo: true }
const depForm    = reactive({ ...DEP_DEFAULT })
const puestoForm = reactive({ ...PUESTO_DEFAULT })

const depHeaders = [
  { title: 'Nombre',  key: 'nombre', sortable: true },
  { title: 'Estado',  key: 'activo', sortable: true, align: 'center', width: '110px' },
  { title: '',        key: 'acciones', sortable: false, align: 'end', width: '60px' },
]

const puestoHeaders = [
  { title: 'Puesto',        key: 'nombre',       sortable: true },
  { title: 'Departamento',  key: 'departamento', sortable: true },
  { title: 'Estado',        key: 'activo',       sortable: true, align: 'center', width: '110px' },
  { title: '',              key: 'acciones',     sortable: false, align: 'end', width: '60px' },
]

const puestosFiltrados = computed(() => {
  if (!filtroDep.value) return store.puestos
  return store.puestos.filter(p => p.departamentoId === filtroDep.value)
})

function openDepDialog (item = null) {
  formError.value = ''
  Object.assign(depForm, item ? { ...item } : { ...DEP_DEFAULT })
  depDialog.value = true
}

function openPuestoDialog (item = null) {
  formError.value = ''
  Object.assign(puestoForm, item ? { ...item } : { ...PUESTO_DEFAULT })
  puestoDialog.value = true
}

async function submitDep () {
  if (!depForm.nombre?.trim()) { formError.value = 'El nombre es requerido'; return }
  saving.value = true; formError.value = ''
  try {
    if (depForm.id) {
      await store.updateDepartamento(depForm.id, { nombre: depForm.nombre, activo: depForm.activo ? 1 : 0 })
    } else {
      await store.createDepartamento({ nombre: depForm.nombre })
    }
    depDialog.value = false
    showSnack(depForm.id ? 'Departamento actualizado' : 'Departamento creado')
    await store.fetchDepartamentos()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

async function submitPuesto () {
  if (!puestoForm.nombre?.trim()) { formError.value = 'El nombre es requerido'; return }
  saving.value = true; formError.value = ''
  try {
    if (puestoForm.id) {
      await store.updatePuesto(puestoForm.id, { nombre: puestoForm.nombre, departamentoId: puestoForm.departamentoId, activo: puestoForm.activo ? 1 : 0 })
    } else {
      await store.createPuesto({ nombre: puestoForm.nombre, departamentoId: puestoForm.departamentoId })
    }
    puestoDialog.value = false
    showSnack(puestoForm.id ? 'Puesto actualizado' : 'Puesto creado')
    await store.fetchPuestos()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

function showSnack (text, color = 'success') { Object.assign(snack, { show: true, text, color }) }

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([store.fetchDepartamentos(), store.fetchPuestos()])
  } finally {
    loading.value = false
  }
})
</script>
