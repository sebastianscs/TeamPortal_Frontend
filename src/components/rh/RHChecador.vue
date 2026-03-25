<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-body-1 font-weight-bold">Checadores ZKTeco</div>
        <div class="text-caption text-medium-emphasis">Configura y sincroniza dispositivos de asistencia</div>
      </div>
    </div>

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="dispositivos"><v-icon start>mdi-router-wireless</v-icon>Dispositivos</v-tab>
      <v-tab value="mapeo"><v-icon start>mdi-account-key</v-icon>Mapeo empleados</v-tab>
      <v-tab value="historial"><v-icon start>mdi-history</v-icon>Historial</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- TAB DISPOSITIVOS -->
      <v-window-item value="dispositivos">
        <div class="d-flex justify-end mb-3">
          <v-btn color="primary" prepend-icon="mdi-plus" size="small" variant="tonal" @click="openDialog()">
            Nuevo dispositivo
          </v-btn>
        </div>
        <v-card variant="tonal">
          <v-data-table :headers="headersDisp" :items="store.checadores" :loading="store.loading" hover>
            <template #item.activo="{ item }">
              <v-chip :color="item.activo ? 'success' : 'default'" size="small" variant="tonal">
                {{ item.activo ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </template>
            <template #item.ultimaSync="{ item }">
              <span class="text-caption">{{ item.ultimaSync ? fmtFecha(item.ultimaSync) : 'Nunca' }}</span>
            </template>
            <template #item.acciones="{ item }">
              <div class="d-flex gap-1 justify-end">
                <v-tooltip text="Probar conexión">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-wifi" size="small" variant="text" :loading="testingId === item.id" @click="probarConexion(item)" />
                  </template>
                </v-tooltip>
                <v-tooltip text="Ver usuarios del dispositivo">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-account-multiple" size="small" variant="text" color="info" :loading="usersLoadingId === item.id" @click="verUsuarios(item)" />
                  </template>
                </v-tooltip>
                <v-tooltip text="Previsualizar registros">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-eye" size="small" variant="text" color="secondary" :loading="previewingId === item.id" @click="previsualizar(item)" />
                  </template>
                </v-tooltip>
                <v-tooltip text="Sincronizar ahora">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-sync" size="small" variant="text" color="primary" :loading="syncingId === item.id" @click="sincronizar(item)" />
                  </template>
                </v-tooltip>
                <v-btn icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)" />
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- TAB MAPEO -->
      <v-window-item value="mapeo">
        <div class="d-flex align-center gap-3 mb-4 flex-wrap">
          <v-select v-model="mapeoDeviceId" :items="store.checadores" item-title="nombre" item-value="id"
            label="Dispositivo" variant="outlined" density="compact" hide-details style="max-width:260px"
            @update:model-value="cargarMapeo" />
          <v-btn v-if="mapeoDeviceId" color="primary" prepend-icon="mdi-plus" size="small" variant="tonal"
            @click="openMapeoDialog">Agregar mapeo</v-btn>
        </div>
        <v-card v-if="mapeoDeviceId" variant="tonal">
          <v-data-table :headers="headersMapeo" :items="store.mapeo" hover>
            <template #item.nombreCompleto="{ item }">
              <div class="font-weight-medium">{{ item.nombreCompleto || item.username }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.username }}</div>
            </template>
            <template #item.acciones="{ item }">
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="eliminarMapeo(item)" />
            </template>
          </v-data-table>
        </v-card>
        <div v-else class="text-center text-medium-emphasis pa-8">Selecciona un dispositivo para ver su mapeo</div>
      </v-window-item>

      <!-- TAB HISTORIAL -->
      <v-window-item value="historial">
        <v-select v-model="histDeviceId" :items="store.checadores" item-title="nombre" item-value="id"
          label="Dispositivo" variant="outlined" density="compact" hide-details class="mb-4" style="max-width:260px"
          @update:model-value="cargarHistorial" />
        <v-card v-if="histDeviceId" variant="tonal">
          <v-data-table :headers="headersHist" :items="store.syncLog" hover>
            <template #item.fechaSync="{ item }">
              <span class="text-caption">{{ fmtFecha(item.fechaSync) }}</span>
            </template>
            <template #item.errores="{ item }">
              <v-chip v-if="item.errores" color="error" size="small" variant="tonal">Error</v-chip>
              <span v-else class="text-success text-caption">OK</span>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Dialog dispositivo -->
    <v-dialog v-model="dialog" max-width="460" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">{{ editTarget ? 'Editar dispositivo' : 'Nuevo dispositivo' }}</span>
          <v-btn icon size="small" variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <v-text-field v-model="form.nombre" label="Nombre *" variant="outlined" density="compact" />
          <v-row dense>
            <v-col cols="8">
              <v-text-field v-model="form.ip" label="Dirección IP *" variant="outlined" density="compact" placeholder="192.168.1.100" />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="form.puerto" label="Puerto" variant="outlined" density="compact" type="number" />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model.number="form.password" label="Password dispositivo" variant="outlined" density="compact" type="number" hint="Generalmente 0" persistent-hint />
            </v-col>
            <v-col cols="6">
              <v-switch v-if="editTarget" v-model="form.activo" label="Activo" color="primary" hide-details />
            </v-col>
          </v-row>
          <v-text-field v-model="form.ubicacion" label="Ubicación" variant="outlined" density="compact" placeholder="Ej: Entrada principal" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="submitDialog">
            {{ editTarget ? 'Guardar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog mapeo -->
    <v-dialog v-model="mapeoDialog" max-width="420" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">Agregar mapeo</span>
          <v-btn icon size="small" variant="text" @click="mapeoDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-4 d-flex flex-column gap-3">
          <v-text-field v-model.number="mapeoForm.deviceUserId" label="ID en el dispositivo *" variant="outlined" density="compact" type="number" hint="Número de usuario registrado en el ZKTeco" persistent-hint />
          <v-autocomplete v-model="mapeoForm.username" :items="empleados" item-title="nombreCompleto" item-value="username"
            label="Empleado *" variant="outlined" density="compact" :custom-filter="filtroNombre" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 justify-end gap-2">
          <v-btn variant="text" @click="mapeoDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="submitMapeo">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog usuarios del dispositivo -->
    <v-dialog v-model="usersDialog" max-width="700">
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <div>
            <div class="text-h6 font-weight-bold">Usuarios en el dispositivo</div>
            <div class="text-caption text-medium-emphasis">Total: <strong>{{ usersData.total }}</strong> usuarios registrados</div>
          </div>
          <v-btn icon size="small" variant="text" @click="usersDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-0">
          <v-data-table :headers="headersUsers" :items="usersData.usuarios" density="compact" hover :items-per-page="15">
            <template #item.privilege="{ item }">
              <v-chip size="x-small" :color="item.privilege > 0 ? 'warning' : 'default'" variant="tonal">
                {{ item.privilege > 0 ? 'Admin' : 'Usuario' }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-3">
          <v-icon color="info" size="small">mdi-information</v-icon>
          <span class="text-caption text-medium-emphasis ml-1">
            Si el campo <code>userId</code> acepta texto, puedes usarlo como username directamente sin tabla de mapeo.
          </span>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog previsualización -->
    <v-dialog v-model="previewDialog" max-width="900">
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <div>
            <div class="text-h6 font-weight-bold">Registros del checador</div>
            <div class="text-caption text-medium-emphasis">
              Total: <strong>{{ previewData.totalRegistros }}</strong> registros —
              Campos disponibles: <code>{{ previewData.camposDisponibles?.join(', ') }}</code>
            </div>
          </div>
          <v-btn icon size="small" variant="text" @click="previewDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-0">
          <v-data-table
            :headers="headersPreview"
            :items="previewData.muestra || []"
            density="compact"
            hover
            :items-per-page="10"
          >
            <template #item.recordTime="{ item }">
              {{ item.recordTime ? new Date(item.recordTime).toLocaleString('es-MX') : '—' }}
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="4000" location="bottom end">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useChecadorStore } from '@/stores/checador'
import api from '@/api'

const store = useChecadorStore()
const tab = ref('dispositivos')
const saving = ref(false)
const testingId = ref(null)
const syncingId = ref(null)
const previewingId = ref(null)
const previewDialog = ref(false)
const previewData = ref({ totalRegistros: 0, muestra: [], camposDisponibles: [] })
const usersLoadingId = ref(null)
const usersDialog = ref(false)
const usersData = ref({ total: 0, usuarios: [] })
const dialog = ref(false)
const mapeoDialog = ref(false)
const editTarget = ref(null)
const mapeoDeviceId = ref(null)
const histDeviceId = ref(null)
const empleados = ref([])
const snack = reactive({ show: false, text: '', color: 'success' })

const form = reactive({ nombre: '', ip: '', puerto: 4370, password: 0, ubicacion: '', activo: true })
const mapeoForm = reactive({ deviceUserId: null, username: '' })

const headersUsers = [
  { title: 'uid', key: 'uid', align: 'center' },
  { title: 'userId', key: 'userId' },
  { title: 'Nombre', key: 'name' },
  { title: 'Tarjeta', key: 'cardno' },
  { title: 'Rol', key: 'privilege', align: 'center' },
]

const headersPreview = [
  { title: 'userSn', key: 'userSn', align: 'center' },
  { title: 'deviceUserId', key: 'deviceUserId', align: 'center' },
  { title: 'Fecha/Hora (recordTime)', key: 'recordTime' },
  { title: 'IP', key: 'ip' },
]

const headersDisp = [
  { title: 'Nombre', key: 'nombre' },
  { title: 'IP', key: 'ip' },
  { title: 'Puerto', key: 'puerto', align: 'center' },
  { title: 'Ubicación', key: 'ubicacion' },
  { title: 'Estado', key: 'activo', align: 'center' },
  { title: 'Última sync', key: 'ultimaSync' },
  { title: '', key: 'acciones', sortable: false, align: 'end' },
]
const headersMapeo = [
  { title: 'ID dispositivo', key: 'deviceUserId', align: 'center' },
  { title: 'Empleado', key: 'nombreCompleto' },
  { title: '', key: 'acciones', sortable: false, align: 'end' },
]
const headersHist = [
  { title: 'Fecha/Hora', key: 'fechaSync' },
  { title: 'Obtenidos', key: 'registrosObtenidos', align: 'center' },
  { title: 'Nuevos', key: 'registrosNuevos', align: 'center' },
  { title: 'Omitidos', key: 'registrosOmitidos', align: 'center' },
  { title: 'Resultado', key: 'errores', align: 'center' },
  { title: 'Realizado por', key: 'realizadoPor' },
]

function fmtFecha(val) {
  if (!val) return '—'
  return new Date(val).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function filtroNombre(_, query, item) {
  const texto = `${item.raw.nombreCompleto} ${item.raw.username}`.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return q.split(' ').every(p => texto.includes(p))
}

function showSnack(text, color = 'success') { snack.text = text; snack.color = color; snack.show = true }

function openDialog(item = null) {
  editTarget.value = item
  if (item) {
    Object.assign(form, { nombre: item.nombre, ip: item.ip, puerto: item.puerto,
      password: item.password, ubicacion: item.ubicacion || '', activo: !!item.activo })
  } else {
    Object.assign(form, { nombre: '', ip: '', puerto: 4370, password: 0, ubicacion: '', activo: true })
  }
  dialog.value = true
}

async function submitDialog() {
  saving.value = true
  try {
    if (editTarget.value) await store.updateChecador(editTarget.value.id, form)
    else await store.createChecador(form)
    dialog.value = false
    showSnack(editTarget.value ? 'Dispositivo actualizado' : 'Dispositivo creado')
  } catch { showSnack('Error al guardar', 'error') }
  finally { saving.value = false }
}

async function verUsuarios(item) {
  usersLoadingId.value = item.id
  try {
    const r = await api.get(`/checador/${item.id}/usuarios`)
    usersData.value = r.data
    usersDialog.value = true
  } catch (e) {
    showSnack(e.response?.data?.message || 'Error al obtener usuarios', 'error')
  } finally { usersLoadingId.value = null }
}

async function previsualizar(item) {
  previewingId.value = item.id
  try {
    const r = await api.get(`/checador/${item.id}/preview`)
    previewData.value = r.data
    previewDialog.value = true
  } catch (e) {
    showSnack(e.response?.data?.message || 'Error al obtener registros', 'error')
  } finally { previewingId.value = null }
}

async function probarConexion(item) {
  testingId.value = item.id
  try {
    await store.testConexion(item.id)
    showSnack(`Conexión exitosa con ${item.nombre}`, 'success')
  } catch (e) {
    showSnack(e.response?.data?.message || 'No se pudo conectar', 'error')
  } finally { testingId.value = null }
}

async function sincronizar(item) {
  syncingId.value = item.id
  try {
    showSnack(`Probando conexión con ${item.nombre}...`, 'info')
    await store.testConexion(item.id)
    showSnack(`Sincronizando ${item.nombre}...`, 'info')
    const r = await store.sincronizar(item.id)
    showSnack(`Sync completada: ${r.registrosNuevos} nuevos de ${r.registrosObtenidos}`, 'success')
  } catch (e) {
    showSnack(e.response?.data?.message || 'No se pudo conectar con el dispositivo', 'error')
  } finally { syncingId.value = null }
}

async function cargarMapeo(id) {
  await store.fetchMapeo(id)
}

function openMapeoDialog() {
  Object.assign(mapeoForm, { deviceUserId: null, username: '' })
  mapeoDialog.value = true
}

async function submitMapeo() {
  if (!mapeoForm.deviceUserId || !mapeoForm.username) return showSnack('Completa todos los campos', 'warning')
  saving.value = true
  try {
    await store.saveMapeo(mapeoDeviceId.value, mapeoForm)
    mapeoDialog.value = false
    showSnack('Mapeo guardado')
  } catch { showSnack('Error al guardar mapeo', 'error') }
  finally { saving.value = false }
}

async function eliminarMapeo(item) {
  await store.deleteMapeo(item.id, mapeoDeviceId.value)
  showSnack('Mapeo eliminado')
}

async function cargarHistorial(id) {
  await store.fetchSyncLog(id)
}

onMounted(async () => {
  await store.fetchChecadores()
  const r = await api.get('/rh/personal')
  empleados.value = (r.data.data || []).map(e => ({
    username: e.username,
    nombreCompleto: `${e.nombre} ${e.apellidoPaterno}`,
  }))
})
</script>
