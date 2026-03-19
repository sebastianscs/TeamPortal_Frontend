<template>
  <div>
    <div class="text-body-2 text-medium-emphasis mb-5">
      Define qué módulos puede ver cada perfil. Los cambios aplican en el próximo inicio de sesión del usuario.
    </div>

    <v-skeleton-loader v-if="loading" type="table" />

    <v-card v-else variant="tonal">
      <v-table>
        <thead>
          <tr>
            <th class="text-left" style="min-width: 200px">Módulo</th>
            <th
              v-for="rol in roles"
              :key="rol"
              class="text-center"
              style="min-width: 120px"
            >
              <v-chip :color="rol === 'ADMIN' ? 'primary' : rol === 'RH' ? 'info' : 'secondary'" size="small" variant="tonal">
                {{ rol }}
              </v-chip>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="modulo in modulos" :key="modulo.clave">
            <td>
              <div class="d-flex align-center gap-2 py-1">
                <v-icon :icon="modulo.icono" size="18" color="primary" />
                <div>
                  <div class="text-body-2 font-weight-medium">{{ modulo.nombre }}</div>
                  <div class="text-caption text-medium-emphasis">{{ modulo.ruta }}</div>
                </div>
              </div>
            </td>
            <td
              v-for="rol in roles"
              :key="rol"
              class="text-center"
            >
              <v-checkbox
                :model-value="hasPermiso(rol, modulo.clave)"
                hide-details
                density="compact"
                color="primary"
                class="d-flex justify-center"
                @update:model-value="togglePermiso(rol, modulo.clave, $event)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>

      <v-divider />

      <div class="pa-4 d-flex justify-end gap-3">
        <v-btn variant="text" :disabled="saving" @click="loadData">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" @click="guardar">
          Guardar cambios
        </v-btn>
      </div>
    </v-card>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom end">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const store = useAdminStore()

const roles = ['EMPLEADO', 'RH', 'ADMIN']
const modulos = ref([])
// permisos: { EMPLEADO: Set(['inicio', 'asistencia',...]), ADMIN: Set([...]) }
const permisos = reactive({})
const loading = ref(true)
const saving = ref(false)
const snack = reactive({ show: false, text: '', color: 'success' })

async function loadData () {
  loading.value = true
  try {
    const [mods, perms] = await Promise.all([
      store.fetchModulos(),
      store.fetchPermisos(),
    ])
    modulos.value = mods
    for (const rol of roles) {
      permisos[rol] = new Set(perms[rol] ?? [])
    }
  } finally {
    loading.value = false
  }
}

function hasPermiso (rol, clave) {
  return permisos[rol]?.has(clave) ?? false
}

function togglePermiso (rol, clave, val) {
  if (!permisos[rol]) permisos[rol] = new Set()
  if (val) {
    permisos[rol].add(clave)
  } else {
    permisos[rol].delete(clave)
  }
}

async function guardar () {
  saving.value = true
  try {
    await Promise.all(
      roles.map(rol =>
        store.updatePermisos(rol, [...(permisos[rol] ?? new Set())]),
      ),
    )
    showSnack('Permisos actualizados correctamente', 'success')
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}

function showSnack (text, color) {
  snack.text = text
  snack.color = color
  snack.show = true
}

onMounted(loadData)
</script>
