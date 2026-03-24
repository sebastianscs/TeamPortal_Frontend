<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="text-body-2 text-medium-emphasis">Documentos del empleado organizados por categoría</div>
      <v-btn color="primary" prepend-icon="mdi-upload" size="small" variant="tonal" @click="abrirSubida">
        Subir documento
      </v-btn>
    </div>

    <v-skeleton-loader v-if="loading" type="list-item, list-item, list-item" />

    <template v-else>
      <div v-if="!documentos.length" class="text-center py-8 text-medium-emphasis">
        <v-icon size="48" class="mb-2">mdi-folder-open-outline</v-icon>
        <div class="text-body-2">Sin documentos registrados</div>
      </div>

      <div v-for="(docs, tipo) in agrupadosPorTipo" :key="tipo" class="mb-4">
        <div class="text-caption text-uppercase text-medium-emphasis font-weight-bold mb-2 d-flex align-center gap-1">
          <v-icon size="14">{{ tipoIcon(tipo) }}</v-icon>
          {{ tipoLabel(tipo) }}
        </div>
        <v-list density="compact" bg-color="surface-variant" rounded="lg">
          <v-list-item v-for="doc in docs" :key="doc.id" class="py-2">
            <template #prepend>
              <v-icon color="primary" size="22">{{ extIcon(doc.nombre) }}</v-icon>
            </template>
            <template #title>
              <span class="text-body-2">{{ doc.nombre }}</span>
            </template>
            <template #subtitle>
              <span class="text-caption">
                {{ fmtFecha(doc.fechaSubida) }}
                <span v-if="doc.fechaVencimiento" :class="vencido(doc.fechaVencimiento) ? 'text-error' : 'text-success'">
                  · Vence {{ fmtFecha(doc.fechaVencimiento) }}
                </span>
              </span>
            </template>
            <template #append>
              <div class="d-flex gap-1">
                <v-btn icon size="x-small" variant="text" :href="doc.url" target="_blank">
                  <v-icon size="16">mdi-open-in-new</v-icon>
                </v-btn>
                <v-btn icon size="x-small" variant="text" color="error" @click="eliminar(doc.id)">
                  <v-icon size="16">mdi-delete-outline</v-icon>
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </template>

    <!-- Dialog subir -->
    <v-dialog v-model="dialog" max-width="440" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">Subir documento</span>
          <v-btn icon size="small" variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <v-select
            v-model="form.tipo"
            :items="tiposDocumento"
            item-title="label"
            item-value="value"
            label="Tipo de documento"
            variant="outlined"
            density="comfortable"
          />
          <v-file-input
            v-model="form.archivo"
            label="Archivo"
            variant="outlined"
            density="comfortable"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
          />
          <v-text-field
            v-model="form.fechaVencimiento"
            label="Fecha de vencimiento (opcional)"
            type="date"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="tonal" :loading="saving" @click="subir">Subir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog resultado OCR -->
    <v-dialog v-model="ocrInfo.show" max-width="460">
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center gap-2 px-4 pt-4 pb-2">
          <v-icon color="primary">mdi-text-recognition</v-icon>
          <span class="text-h6 font-weight-bold">Datos extraídos del PDF</span>
        </div>
        <v-divider />
        <v-card-text class="pa-4">
          <v-alert
            v-if="ocrInfo.actualizados.length > 0"
            class="mb-3"
            color="success"
            density="compact"
            variant="tonal"
            :text="`${ocrInfo.actualizados.length} campo(s) actualizados automáticamente en el perfil`"
          />
          <v-alert
            v-else
            class="mb-3"
            color="info"
            density="compact"
            variant="tonal"
            text="Los campos ya tenían valores — no se sobreescribió ninguno"
          />
          <v-list density="compact" bg-color="transparent">
            <v-list-item
              v-for="(val, key) in ocrInfo.campos"
              :key="key"
              class="px-0"
            >
              <template #prepend>
                <v-icon
                  :color="ocrInfo.actualizados.includes(key) ? 'success' : 'medium-emphasis'"
                  size="18"
                  class="mr-2"
                >
                  {{ ocrInfo.actualizados.includes(key) ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                </v-icon>
              </template>
              <template #title>
                <span class="text-caption text-medium-emphasis">{{ OCR_LABELS[key] ?? key }}</span>
              </template>
              <template #subtitle>
                <span class="text-body-2 font-weight-medium">{{ val }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end">
          <v-btn color="primary" variant="tonal" @click="ocrInfo.show = false">Entendido</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom end">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRHStore } from '@/stores/rh'

const props = defineProps({ username: { type: String, required: true } })
const store = useRHStore()
const loading = ref(false)
const saving  = ref(false)
const dialog  = ref(false)
const documentos = ref([])
const snack   = reactive({ show: false, text: '', color: 'success' })
const ocrInfo = reactive({ show: false, campos: {}, actualizados: [] })
const form  = reactive({ tipo: 'OTRO', archivo: null, fechaVencimiento: '' })

const tiposDocumento = [
  { value: 'CURP', label: 'CURP' },
  { value: 'RFC', label: 'RFC / Constancia SAT' },
  { value: 'INE', label: 'INE / Identificación' },
  { value: 'NSS', label: 'NSS / IMSS' },
  { value: 'CONTRATO', label: 'Contrato laboral' },
  { value: 'CONSTANCIA_SAT', label: 'Constancia de situación fiscal' },
  { value: 'OTRO', label: 'Otro' },
]

const agrupadosPorTipo = computed(() => {
  const grupos = {}
  for (const doc of documentos.value) {
    if (!grupos[doc.tipo]) grupos[doc.tipo] = []
    grupos[doc.tipo].push(doc)
  }
  return grupos
})

function tipoLabel(tipo) {
  return tiposDocumento.find(t => t.value === tipo)?.label ?? tipo
}
function tipoIcon(tipo) {
  return { CURP: 'mdi-card-account-details-outline', RFC: 'mdi-receipt-text-outline', INE: 'mdi-card-account-details', NSS: 'mdi-hospital-box-outline', CONTRATO: 'mdi-file-sign', CONSTANCIA_SAT: 'mdi-file-certificate-outline', OTRO: 'mdi-file-outline' }[tipo] ?? 'mdi-file-outline'
}
function extIcon(nombre) {
  const ext = nombre.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'mdi-file-pdf-box'
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'mdi-file-image'
  if (['doc', 'docx'].includes(ext)) return 'mdi-file-word'
  return 'mdi-file-outline'
}
function fmtFecha(d) {
  return d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
}
function vencido(d) { return d && new Date(d) < new Date() }
function showSnack(text, color = 'success') { snack.text = text; snack.color = color; snack.show = true }

async function cargar() {
  loading.value = true
  try { documentos.value = await store.getDocumentos(props.username) }
  catch { showSnack('Error al cargar documentos', 'error') }
  finally { loading.value = false }
}

function abrirSubida() {
  Object.assign(form, { tipo: 'OTRO', archivo: null, fechaVencimiento: '' })
  dialog.value = true
}

async function subir() {
  if (!form.archivo) { showSnack('Selecciona un archivo', 'warning'); return }
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('documento', form.archivo)
    fd.append('tipo', form.tipo)
    if (form.fechaVencimiento) fd.append('fechaVencimiento', form.fechaVencimiento)
    const res = await store.uploadDocumento(props.username, fd)
    dialog.value = false
    await cargar()

    // Mostrar resultado de OCR si el backend extrajo datos
    const ocr = res?.ocr
    if (ocr?.ejecutado && Object.keys(ocr.camposEncontrados ?? {}).length > 0) {
      ocrInfo.campos      = ocr.camposEncontrados
      ocrInfo.actualizados = ocr.camposActualizados ?? []
      ocrInfo.show = true
    } else {
      showSnack('Documento subido correctamente')
    }
  } catch { showSnack('Error al subir documento', 'error') }
  finally { saving.value = false }
}

// Etiqueta legible para cada campo OCR
const OCR_LABELS = {
  curp: 'CURP', rfc: 'RFC', nss: 'NSS', clabe: 'CLABE',
  fechaNacimiento: 'Fecha de nacimiento', sexo: 'Sexo',
  banco: 'Banco', regimenFiscal: 'Régimen fiscal', nacionalidad: 'Nacionalidad',
  domicilio: 'Domicilio', ciudad: 'Ciudad / Municipio',
  estadoResidencia: 'Estado', telefono: 'Teléfono',
}

async function eliminar(id) {
  try {
    await store.deleteDocumento(id)
    showSnack('Documento eliminado')
    await cargar()
  } catch { showSnack('Error al eliminar', 'error') }
}

watch(() => props.username, cargar)
onMounted(cargar)
</script>
