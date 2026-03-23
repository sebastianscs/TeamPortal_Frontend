<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h6 font-weight-bold">Avisos del carrusel</div>
        <div class="text-body-2 text-medium-emphasis">Gestiona los mensajes que aparecen en el inicio</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nuevo aviso</v-btn>
    </div>

    <!-- Tabla histórico -->
    <v-card variant="tonal">
      <v-data-table
        :headers="headers"
        :items="store.historico"
        :loading="store.loading"
        item-value="id"
        hover
      >
        <template #item.tipo="{ item }">
          <v-chip :color="tipoColor(item.tipo)" :prepend-icon="tipoIcon(item.tipo)" size="small" variant="tonal">
            {{ tipoLabel(item.tipo) }}
          </v-chip>
        </template>
        <template #item.activo="{ item }">
          <v-chip :color="item.activo ? 'success' : 'default'" size="small" variant="tonal">
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>
        <template #item.fechaInicio="{ item }">
          <span class="text-caption">{{ fmtFecha(item.fechaInicio) }}</span>
        </template>
        <template #item.fechaFin="{ item }">
          <span class="text-caption">{{ fmtFecha(item.fechaFin) }}</span>
        </template>
        <template #item.fechaCreacion="{ item }">
          <span class="text-caption">{{ fmtFechaHora(item.fechaCreacion) }}</span>
        </template>
        <template #item.creadoPorNombre="{ item }">
          <span class="text-caption">{{ item.creadoPorNombre || item.creadoPor }}</span>
        </template>
        <template #item.acciones="{ item }">
          <v-btn color="primary" icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog crear/editar -->
    <v-dialog v-model="dialog" max-width="560" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">{{ form.id ? 'Editar aviso' : 'Nuevo aviso' }}</span>
          <v-btn icon size="small" variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">

          <!-- Preview -->
          <div class="aviso-preview rounded-lg pa-4 mb-1" :style="previewStyle">
            <div class="d-flex align-center gap-3 mb-2">
              <v-icon :color="tipoColor(form.tipo)" size="32">{{ tipoIcon(form.tipo) }}</v-icon>
              <div class="text-h6 font-weight-bold" style="color: inherit;">
                {{ form.titulo || 'Título del aviso' }}
              </div>
            </div>
            <div v-if="form.contenido" class="text-body-2" style="color: inherit; opacity: 0.85;">
              {{ form.contenido }}
            </div>
          </div>

          <v-btn-toggle v-model="form.tipo" mandatory color="primary" variant="outlined" density="compact" divided>
            <v-btn v-for="t in tipos" :key="t.value" :value="t.value" :prepend-icon="t.icon" size="small">
              {{ t.label }}
            </v-btn>
          </v-btn-toggle>

          <v-text-field
            v-model="form.titulo"
            label="Título *"
            variant="outlined"
            density="comfortable"
            counter="200"
            maxlength="200"
          />
          <v-textarea
            v-model="form.contenido"
            label="Contenido / descripción"
            variant="outlined"
            density="comfortable"
            rows="3"
            auto-grow
            counter="500"
            maxlength="500"
          />
          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="form.fechaInicio"
                label="Vigente desde"
                type="date"
                variant="outlined"
                density="comfortable"
                clearable
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.fechaFin"
                label="Vigente hasta"
                type="date"
                variant="outlined"
                density="comfortable"
                clearable
              />
            </v-col>
          </v-row>
          <v-switch
            v-if="form.id"
            v-model="form.activo"
            label="Aviso activo"
            color="primary"
            hide-details
            density="compact"
          />
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

    <v-snackbar v-model="snack.show" :color="snack.color" location="bottom end" :timeout="3000">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useAvisosStore } from '@/stores/avisos'

const store = useAvisosStore()
const dialog    = ref(false)
const saving    = ref(false)
const formError = ref('')
const snack     = reactive({ show: false, text: '', color: 'success' })

const tipos = [
  { value: 'INFORMATIVO', label: 'Info',       icon: 'mdi-information-outline' },
  { value: 'AVISO',       label: 'Aviso',      icon: 'mdi-bell-ring-outline' },
  { value: 'URGENTE',     label: 'Urgente',    icon: 'mdi-alert-octagon-outline' },
  { value: 'CELEBRACION', label: 'Celebración',icon: 'mdi-party-popper' },
]

const FORM_DEFAULT = { id: null, titulo: '', contenido: '', tipo: 'INFORMATIVO', fechaInicio: '', fechaFin: '', activo: true }
const form = reactive({ ...FORM_DEFAULT })

const headers = [
  { title: 'Título',     key: 'titulo',          sortable: true },
  { title: 'Tipo',       key: 'tipo',            sortable: true,  width: '130px' },
  { title: 'Estado',     key: 'activo',          sortable: true,  width: '100px', align: 'center' },
  { title: 'Desde',      key: 'fechaInicio',     sortable: true,  width: '100px' },
  { title: 'Hasta',      key: 'fechaFin',        sortable: true,  width: '100px' },
  { title: 'Creado por', key: 'creadoPorNombre', sortable: false, width: '140px' },
  { title: 'Fecha',      key: 'fechaCreacion',   sortable: true,  width: '140px' },
  { title: '',           key: 'acciones',        sortable: false, width: '60px',  align: 'end' },
]

function tipoColor (tipo) {
  return { INFORMATIVO: 'info', AVISO: 'warning', URGENTE: 'error', CELEBRACION: 'primary' }[tipo] ?? 'secondary'
}
function tipoIcon (tipo) {
  return { INFORMATIVO: 'mdi-information-outline', AVISO: 'mdi-bell-ring-outline', URGENTE: 'mdi-alert-octagon-outline', CELEBRACION: 'mdi-party-popper' }[tipo] ?? 'mdi-information'
}
function tipoLabel (tipo) {
  return { INFORMATIVO: 'Informativo', AVISO: 'Aviso', URGENTE: 'Urgente', CELEBRACION: 'Celebración' }[tipo] ?? tipo
}

const previewStyle = computed(() => {
  const gradients = {
    INFORMATIVO: 'linear-gradient(135deg, rgba(126,206,232,0.15) 0%, rgba(126,206,232,0.05) 100%); border-left: 3px solid #7ECEE8',
    AVISO:       'linear-gradient(135deg, rgba(255,213,79,0.15)  0%, rgba(255,213,79,0.05)  100%); border-left: 3px solid #FFD54F',
    URGENTE:     'linear-gradient(135deg, rgba(242,139,130,0.2)  0%, rgba(242,139,130,0.05) 100%); border-left: 3px solid #F28B82',
    CELEBRACION: 'linear-gradient(135deg, rgba(141,198,63,0.15)  0%, rgba(141,198,63,0.05)  100%); border-left: 3px solid #8DC63F',
  }
  return { background: gradients[form.tipo] ?? gradients.INFORMATIVO }
})

function fmtFecha (d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
function fmtFechaHora (d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function openDialog (item = null) {
  formError.value = ''
  Object.assign(form, item
    ? { ...item, activo: !!item.activo, fechaInicio: item.fechaInicio ? String(item.fechaInicio).slice(0,10) : '', fechaFin: item.fechaFin ? String(item.fechaFin).slice(0,10) : '' }
    : { ...FORM_DEFAULT }
  )
  dialog.value = true
}

async function submit () {
  if (!form.titulo?.trim()) { formError.value = 'El título es requerido'; return }
  saving.value = true; formError.value = ''
  try {
    const payload = {
      titulo: form.titulo, contenido: form.contenido, tipo: form.tipo,
      fechaInicio: form.fechaInicio || null, fechaFin: form.fechaFin || null,
      activo: form.activo ? 1 : 0,
    }
    if (form.id) await store.updateAviso(form.id, payload)
    else         await store.createAviso(payload)
    dialog.value = false
    Object.assign(snack, { show: true, text: form.id ? 'Aviso actualizado' : 'Aviso creado', color: 'success' })
    await store.fetchHistorico()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

onMounted(() => store.fetchHistorico())
</script>
