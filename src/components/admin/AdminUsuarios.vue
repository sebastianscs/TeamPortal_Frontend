<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h5 font-weight-bold">Administración de Usuarios</div>
        <div class="text-body-2 text-medium-emphasis mt-1">Gestiona cuentas, roles y permisos del equipo</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openCreate">
        Nuevo usuario
      </v-btn>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="users">
        <v-icon start>mdi-account-group</v-icon>
        Usuarios
      </v-tab>
      <v-tab value="perfiles">
        <v-icon start>mdi-shield-account</v-icon>
        Perfiles y Permisos
      </v-tab>
      <v-tab value="audit">
        <v-icon start>mdi-history</v-icon>
        Auditoría
      </v-tab>
      <v-tab value="avisos">
        <v-icon start>mdi-bullhorn-outline</v-icon>
        Avisos
      </v-tab>
    </v-tabs>

    <!-- USUARIOS TAB -->
    <v-window v-model="tab">
      <v-window-item value="users">
        <!-- Filters -->
        <v-card variant="tonal" class="mb-4 pa-4">
          <v-row dense align="center">
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="filters.search"
                density="compact"
                hide-details
                label="Buscar por nombre, username o email"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                clearable
                @update:model-value="debouncedFetch"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-select
                v-model="filters.rol"
                :items="rolOptions"
                density="compact"
                hide-details
                label="Rol"
                variant="outlined"
                clearable
                @update:model-value="fetchUsers"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-select
                v-model="filters.activo"
                :items="activoOptions"
                density="compact"
                hide-details
                label="Estado"
                variant="outlined"
                clearable
                @update:model-value="fetchUsers"
              />
            </v-col>
          </v-row>
        </v-card>

        <!-- Users table -->
        <v-card variant="tonal">
          <v-data-table
            :headers="headers"
            :items="store.users"
            :loading="store.loading"
            item-value="username"
            hover
          >
            <!-- Name col -->
            <template #item.nombre="{ item }">
              <div class="d-flex align-center gap-3 py-1">
                <v-avatar size="36" color="primary" class="text-caption font-weight-bold flex-shrink-0">
                  {{ initials(item) }}
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ item.nombre }} {{ item.apellidoPaterno }}</div>
                  <div class="text-caption text-medium-emphasis">{{ item.username }}</div>
                </div>
              </div>
            </template>

            <!-- Role chip -->
            <template #item.rol="{ item }">
              <v-chip
                :color="item.rol === 'ADMIN' ? 'primary' : 'secondary'"
                size="small"
                variant="tonal"
              >
                {{ item.rol }}
              </v-chip>
            </template>

            <!-- Status chip -->
            <template #item.activo="{ item }">
              <v-chip
                :color="item.activo ? 'success' : 'error'"
                size="small"
                variant="tonal"
              >
                {{ item.activo ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </template>

            <!-- Date col -->
            <template #item.fechaIngreso="{ item }">
              {{ formatDate(item.fechaIngreso) }}
            </template>

            <!-- Actions col -->
            <template #item.actions="{ item }">
              <v-menu>
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-dots-vertical" size="small" variant="text" />
                </template>
                <v-list density="compact" min-width="180">
                  <v-list-item prepend-icon="mdi-pencil" title="Editar datos" @click="openEdit(item)" />
                  <v-list-item prepend-icon="mdi-shield-account" title="Cambiar rol" @click="openRol(item)" />
                  <v-list-item prepend-icon="mdi-lock-reset" title="Cambiar contraseña" @click="openPassword(item)" />
                  <v-divider />
                  <v-list-item
                    :prepend-icon="item.activo ? 'mdi-account-off' : 'mdi-account-check'"
                    :title="item.activo ? 'Desactivar' : 'Activar'"
                    :class="item.activo ? 'text-error' : 'text-success'"
                    @click="confirmToggle(item)"
                  />
                </v-list>
              </v-menu>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- PERFILES TAB -->
      <v-window-item value="perfiles">
        <AdminPerfiles />
      </v-window-item>

      <!-- AVISOS TAB -->
      <v-window-item value="avisos">
        <AdminAvisos />
      </v-window-item>

      <!-- AUDIT TAB -->
      <v-window-item value="audit">
        <v-card variant="tonal">
          <v-card-title class="pa-4 d-flex align-center gap-3">
            <v-text-field
              v-model="auditFilters.usuarioId"
              density="compact"
              hide-details
              label="Filtrar por usuario"
              variant="outlined"
              clearable
              style="max-width: 220px"
              @update:model-value="debouncedFetchAudit"
            />
            <v-select
              v-model="auditFilters.accion"
              :items="accionOptions"
              density="compact"
              hide-details
              label="Acción"
              variant="outlined"
              clearable
              style="max-width: 220px"
              @update:model-value="fetchAudit"
            />
          </v-card-title>
          <v-data-table
            :headers="auditHeaders"
            :items="store.audit"
            :loading="store.loading"
            item-value="id"
            hover
          >
            <template #item.accion="{ item }">
              <v-chip :color="accionColor(item.accion)" size="small" variant="tonal">
                {{ item.accion.replace(/_/g, ' ') }}
              </v-chip>
            </template>
            <template #item.fecha="{ item }">
              {{ formatDateTime(item.fecha) }}
            </template>
            <template #item.detalles="{ item }">
              <v-btn
                v-if="item.detalles"
                size="x-small"
                variant="text"
                @click="viewDetalles(item)"
              >
                Ver
              </v-btn>
              <span v-else class="text-medium-emphasis">—</span>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- ============================================================ -->
    <!-- CREATE / EDIT USER DIALOG -->
    <!-- ============================================================ -->
    <v-dialog v-model="dialogs.form" max-width="520" persistent>
      <v-card>
        <v-card-title class="pa-4 pb-2">
          {{ editTarget ? 'Editar usuario' : 'Nuevo usuario' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="submitForm">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="form.nombre"
                  label="Nombre(s)"
                  variant="outlined"
                  density="compact"
                  :rules="[required]"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="form.apellidoPaterno"
                  label="Apellido paterno"
                  variant="outlined"
                  density="compact"
                  :rules="[required]"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="form.apellidoMaterno"
                  label="Apellido materno"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.email"
                  label="Email"
                  variant="outlined"
                  density="compact"
                  type="email"
                  :rules="[required]"
                />
              </v-col>
              <template v-if="!editTarget">
                <v-col cols="12">
                  <v-text-field
                    v-model="form.username"
                    label="Username"
                    variant="outlined"
                    density="compact"
                    :rules="[required]"
                    :hint="usernameEditado ? 'Editado manualmente' : 'Generado automáticamente'"
                    persistent-hint
                    @input="usernameEditado = true"
                  >
                    <template #append-inner>
                      <v-chip
                        v-if="!usernameEditado"
                        color="primary"
                        density="compact"
                        size="x-small"
                        variant="tonal"
                      >
                        auto
                      </v-chip>
                      <v-tooltip v-else text="Restaurar username automático">
                        <template #activator="{ props }">
                          <v-icon
                            v-bind="props"
                            color="medium-emphasis"
                            size="small"
                            style="cursor: pointer"
                            @click="usernameEditado = false; form.username = generarUsername(form.nombre, form.apellidoPaterno, form.apellidoMaterno)"
                          >
                            mdi-refresh
                          </v-icon>
                        </template>
                      </v-tooltip>
                    </template>
                  </v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="form.password"
                    label="Contraseña"
                    variant="outlined"
                    density="compact"
                    type="password"
                    :rules="[required, minLen]"
                  />
                </v-col>
                <v-col cols="6">
                  <v-select
                    v-model="form.rol"
                    :items="['EMPLEADO', 'LIDER', 'RH', 'ADMIN']"
                    label="Rol"
                    variant="outlined"
                    density="compact"
                    :rules="[required]"
                  />
                </v-col>
              </template>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end gap-2">
          <v-btn variant="text" @click="dialogs.form = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="submitForm">
            {{ editTarget ? 'Guardar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ROL DIALOG -->
    <v-dialog v-model="dialogs.rol" max-width="380">
      <v-card>
        <v-card-title class="pa-4 pb-2">Cambiar rol</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-3">
            Usuario: <strong>{{ rolTarget?.username }}</strong>
          </p>
          <v-select
            v-model="newRol"
            :items="['EMPLEADO', 'LIDER', 'RH', 'ADMIN']"
            label="Nuevo rol"
            variant="outlined"
            density="compact"
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end gap-2">
          <v-btn variant="text" @click="dialogs.rol = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="submitRol">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- PASSWORD DIALOG -->
    <v-dialog v-model="dialogs.password" max-width="380">
      <v-card>
        <v-card-title class="pa-4 pb-2">Cambiar contraseña</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-3">
            Usuario: <strong>{{ passwordTarget?.username }}</strong>
          </p>
          <v-form ref="passwordFormRef">
            <v-text-field
              v-model="newPassword"
              label="Nueva contraseña"
              variant="outlined"
              density="compact"
              type="password"
              :rules="[required, minLen]"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end gap-2">
          <v-btn variant="text" @click="dialogs.password = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="submitPassword">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- TOGGLE STATUS CONFIRM -->
    <v-dialog v-model="dialogs.toggle" max-width="380">
      <v-card>
        <v-card-title class="pa-4 pb-2">
          {{ toggleTarget?.activo ? 'Desactivar usuario' : 'Activar usuario' }}
        </v-card-title>
        <v-card-text>
          <p class="text-body-2">
            ¿Estás seguro de que deseas
            <strong>{{ toggleTarget?.activo ? 'desactivar' : 'activar' }}</strong>
            la cuenta de <strong>{{ toggleTarget?.username }}</strong>?
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end gap-2">
          <v-btn variant="text" @click="dialogs.toggle = false">Cancelar</v-btn>
          <v-btn
            :color="toggleTarget?.activo ? 'error' : 'success'"
            variant="flat"
            :loading="saving"
            @click="submitToggle"
          >
            {{ toggleTarget?.activo ? 'Desactivar' : 'Activar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- AUDIT DETAIL -->
    <v-dialog v-model="dialogs.detalles" max-width="480">
      <v-card>
        <v-card-title class="pa-4 pb-2">Detalle de acción</v-card-title>
        <v-card-text>
          <pre class="text-body-2" style="white-space: pre-wrap; word-break: break-all;">{{ auditDetalles }}</pre>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end">
          <v-btn variant="text" @click="dialogs.detalles = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom end">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import AdminPerfiles from '@/components/admin/AdminPerfiles.vue'
import AdminAvisos from '@/components/admin/AdminAvisos.vue'

const store = useAdminStore()
const tab = ref('users')
const saving = ref(false)

// ── Filters ──────────────────────────────────────────────────────────
const rolOptions = ['EMPLEADO', 'LIDER', 'RH', 'ADMIN']
const activoOptions = [
  { title: 'Activo', value: '1' },
  { title: 'Inactivo', value: '0' },
]
const filters = reactive({ search: '', rol: null, activo: null })

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchUsers, 400)
}

async function fetchUsers() {
  const params = {}
  if (filters.search) params.search = filters.search
  if (filters.rol) params.rol = filters.rol
  if (filters.activo !== null && filters.activo !== undefined) params.activo = filters.activo
  await store.fetchUsers(params)
}

// ── Audit ─────────────────────────────────────────────────────────────
const auditFilters = reactive({ usuarioId: '', accion: '' })
const accionOptions = [
  'CREAR_USUARIO', 'EDITAR_USUARIO', 'ACTIVAR_USUARIO', 'DESACTIVAR_USUARIO',
  'CAMBIAR_PASSWORD', 'CAMBIAR_ROL',
]
const auditDetalles = ref('')

let auditDebounce = null
function debouncedFetchAudit() {
  clearTimeout(auditDebounce)
  auditDebounce = setTimeout(fetchAudit, 400)
}

async function fetchAudit() {
  const params = {}
  if (auditFilters.usuarioId) params.usuarioId = auditFilters.usuarioId
  if (auditFilters.accion) params.accion = auditFilters.accion
  await store.fetchAudit(params)
}

function viewDetalles(item) {
  try {
    auditDetalles.value = JSON.stringify(JSON.parse(item.detalles), null, 2)
  } catch {
    auditDetalles.value = item.detalles
  }
  dialogs.detalles = true
}

// ── Table headers ─────────────────────────────────────────────────────
const headers = [
  { title: 'Usuario', key: 'nombre', sortable: true },
  { title: 'Email', key: 'email' },
  { title: 'Rol', key: 'rol', align: 'center' },
  { title: 'Estado', key: 'activo', align: 'center' },
  { title: 'Ingreso', key: 'fechaIngreso', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' },
]

const auditHeaders = [
  { title: 'Fecha', key: 'fecha', sortable: true },
  { title: 'Realizado por', key: 'nombreUsuario' },
  { title: 'Acción', key: 'accion' },
  { title: 'Tabla', key: 'tabla' },
  { title: 'Registro', key: 'registroId' },
  { title: 'Detalles', key: 'detalles', sortable: false },
]

// ── Dialogs ───────────────────────────────────────────────────────────
const dialogs = reactive({
  form: false,
  rol: false,
  password: false,
  toggle: false,
  detalles: false,
})

// ── Form ──────────────────────────────────────────────────────────────
const formRef = ref(null)
const editTarget = ref(null)
const usernameEditado = ref(false)
const form = reactive({
  nombre: '', apellidoPaterno: '', apellidoMaterno: '',
  email: '', username: '', password: '', rol: 'EMPLEADO',
})

function normalizarStr (s) {
  return (s ?? '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase()
}

function generarUsername (nombre, apellidoPaterno, apellidoMaterno) {
  const n  = normalizarStr(nombre)
  const ap = normalizarStr(apellidoPaterno)
  const am = normalizarStr(apellidoMaterno)
  if (!n || !ap) return ''
  return n[0] + ap + (am ? am[0] : '') + n[n.length - 1]
}

// Auto-generar username mientras se escribe (solo en modo creación y sin edición manual)
watch(
  () => [form.nombre, form.apellidoPaterno, form.apellidoMaterno],
  ([nombre, ap, am]) => {
    if (!editTarget.value && !usernameEditado.value) {
      form.username = generarUsername(nombre, ap, am)
    }
  },
)

function openCreate() {
  editTarget.value = null
  usernameEditado.value = false
  Object.assign(form, { nombre: '', apellidoPaterno: '', apellidoMaterno: '', email: '', username: '', password: '', rol: 'EMPLEADO' })
  dialogs.form = true
}

function openEdit(item) {
  editTarget.value = item
  Object.assign(form, {
    nombre: item.nombre,
    apellidoPaterno: item.apellidoPaterno,
    apellidoMaterno: item.apellidoMaterno ?? '',
    email: item.email,
  })
  dialogs.form = true
}

async function submitForm() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    if (editTarget.value) {
      await store.updateUser(editTarget.value.username, {
        nombre: form.nombre,
        apellidoPaterno: form.apellidoPaterno,
        apellidoMaterno: form.apellidoMaterno || null,
        email: form.email,
      })
      showSnack('Usuario actualizado', 'success')
    } else {
      await store.createUser({
        nombre: form.nombre,
        apellidoPaterno: form.apellidoPaterno,
        apellidoMaterno: form.apellidoMaterno || null,
        email: form.email,
        username: form.username,
        password: form.password,
        rol: form.rol,
      })
      showSnack('Usuario creado correctamente', 'success')
    }
    dialogs.form = false
    await fetchUsers()
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}

// ── Rol ───────────────────────────────────────────────────────────────
const rolTarget = ref(null)
const newRol = ref('EMPLEADO')

function openRol(item) {
  rolTarget.value = item
  newRol.value = item.rol
  dialogs.rol = true
}

async function submitRol() {
  saving.value = true
  try {
    await store.changeRol(rolTarget.value.username, newRol.value)
    showSnack('Rol actualizado', 'success')
    dialogs.rol = false
    await fetchUsers()
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error al cambiar rol', 'error')
  } finally {
    saving.value = false
  }
}

// ── Password ──────────────────────────────────────────────────────────
const passwordFormRef = ref(null)
const passwordTarget = ref(null)
const newPassword = ref('')

function openPassword(item) {
  passwordTarget.value = item
  newPassword.value = ''
  dialogs.password = true
}

async function submitPassword() {
  const { valid } = await passwordFormRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    await store.changePassword(passwordTarget.value.username, newPassword.value)
    showSnack('Contraseña actualizada', 'success')
    dialogs.password = false
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error al cambiar contraseña', 'error')
  } finally {
    saving.value = false
  }
}

// ── Toggle status ─────────────────────────────────────────────────────
const toggleTarget = ref(null)

function confirmToggle(item) {
  toggleTarget.value = item
  dialogs.toggle = true
}

async function submitToggle() {
  saving.value = true
  try {
    await store.toggleStatus(toggleTarget.value.username, !toggleTarget.value.activo)
    showSnack(toggleTarget.value.activo ? 'Usuario desactivado' : 'Usuario activado', 'success')
    dialogs.toggle = false
    await fetchUsers()
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error al cambiar estado', 'error')
  } finally {
    saving.value = false
  }
}

// ── Snackbar ──────────────────────────────────────────────────────────
const snack = reactive({ show: false, text: '', color: 'success' })
function showSnack(text, color = 'success') {
  snack.text = text
  snack.color = color
  snack.show = true
}

// ── Helpers ───────────────────────────────────────────────────────────
function initials(item) {
  return `${item.nombre?.[0] ?? ''}${item.apellidoPaterno?.[0] ?? ''}`.toUpperCase()
}

function formatDate(val) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(val) {
  if (!val) return '—'
  return new Date(val).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function accionColor(accion) {
  if (accion.includes('CREAR')) return 'success'
  if (accion.includes('EDITAR')) return 'info'
  if (accion.includes('DESACTIVAR')) return 'error'
  if (accion.includes('ACTIVAR')) return 'success'
  if (accion.includes('PASSWORD')) return 'warning'
  if (accion.includes('ROL')) return 'primary'
  return 'secondary'
}

const required = v => !!v || 'Campo requerido'
const minLen = v => (v && v.length >= 6) || 'Mínimo 6 caracteres'

// ── Init ──────────────────────────────────────────────────────────────
onMounted(() => {
  fetchUsers()
})
</script>
