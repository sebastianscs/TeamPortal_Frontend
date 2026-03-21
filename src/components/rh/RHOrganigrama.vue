<template>
  <div>
    <!-- Barra superior -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
      <div class="d-flex gap-2 align-center flex-wrap">
        <v-chip color="primary" variant="tonal">
          <v-icon start size="14">mdi-account-tie</v-icon>
          {{ data.lideres.length }} líderes
        </v-chip>
        <v-chip color="warning" variant="tonal">
          <v-icon start size="14">mdi-account-question</v-icon>
          {{ data.sinLider.length }} sin asignar
        </v-chip>
        <v-chip color="success" variant="tonal">
          <v-icon start size="14">mdi-account-group</v-icon>
          {{ totalAsignados }} asignados
        </v-chip>
      </div>
      <v-btn
        variant="tonal"
        prepend-icon="mdi-refresh"
        size="small"
        :loading="loading"
        @click="cargar"
      >
        Actualizar
      </v-btn>
    </div>

    <v-skeleton-loader v-if="loading" type="card, card, card" />

    <template v-else>
      <!-- ── EQUIPOS POR LÍDER ─────────────────────────────── -->
      <div v-if="data.lideres.length" class="mb-6">
        <div class="text-subtitle-2 text-medium-emphasis text-uppercase mb-3 d-flex align-center gap-2">
          <v-icon size="16">mdi-account-tie</v-icon> Equipos
        </div>

        <v-row>
          <v-col
            v-for="lider in data.lideres"
            :key="lider.username"
            cols="12" md="6" lg="4"
          >
            <v-card variant="outlined" rounded="lg">
              <!-- Header del lider -->
              <div class="pa-4 pb-2 d-flex align-center gap-3">
                <v-avatar color="warning" size="42" variant="tonal">
                  <span class="text-body-2 font-weight-bold">{{ iniciales(lider.nombreCompleto) }}</span>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="font-weight-bold text-body-1">{{ lider.nombreCompleto }}</div>
                  <div class="text-caption text-medium-emphasis">{{ lider.puesto || 'Líder' }}</div>
                </div>
                <v-chip color="warning" size="x-small" variant="flat">LÍDER</v-chip>
              </div>

              <v-divider class="mx-4" />

              <!-- Equipo -->
              <v-list density="compact" class="py-1">
                <template v-if="lider.equipo.length">
                  <v-list-item
                    v-for="emp in lider.equipo"
                    :key="emp.username"
                    :subtitle="emp.puesto || emp.departamento || emp.username"
                    class="px-4"
                  >
                    <template #prepend>
                      <v-avatar color="primary" size="28" variant="tonal" class="mr-2">
                        <span style="font-size:10px; font-weight:700">{{ iniciales(emp.nombreCompleto) }}</span>
                      </v-avatar>
                    </template>
                    <template #title>
                      <span class="text-body-2">{{ emp.nombreCompleto }}</span>
                    </template>
                    <template #append>
                      <v-tooltip text="Reasignar" location="start">
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon="mdi-account-switch"
                            size="x-small"
                            variant="text"
                            color="secondary"
                            @click="abrirAsignar(emp, lider.username)"
                          />
                        </template>
                      </v-tooltip>
                    </template>
                  </v-list-item>
                </template>
                <v-list-item v-else class="px-4">
                  <template #title>
                    <span class="text-caption text-medium-emphasis">Sin empleados asignados</span>
                  </template>
                </v-list-item>
              </v-list>

              <!-- Footer -->
              <div class="pa-3 pt-1 d-flex justify-end">
                <v-chip size="x-small" variant="tonal" color="surface-variant">
                  {{ lider.equipo.length }} {{ lider.equipo.length === 1 ? 'persona' : 'personas' }}
                </v-chip>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- ── SIN ASIGNAR ───────────────────────────────────── -->
      <div v-if="data.sinLider.length">
        <div class="text-subtitle-2 text-medium-emphasis text-uppercase mb-3 d-flex align-center gap-2">
          <v-icon size="16" color="warning">mdi-account-question</v-icon>
          Sin líder asignado ({{ data.sinLider.length }})
        </div>

        <v-card variant="tonal" rounded="lg">
          <v-list density="compact">
            <v-list-item
              v-for="emp in data.sinLider"
              :key="emp.username"
              class="px-4"
            >
              <template #prepend>
                <v-avatar color="surface-variant" size="32" class="mr-3">
                  <span class="text-caption font-weight-bold">{{ iniciales(emp.nombreCompleto) }}</span>
                </v-avatar>
              </template>
              <template #title>
                <span class="text-body-2 font-weight-medium">{{ emp.nombreCompleto }}</span>
              </template>
              <template #subtitle>
                <span class="text-caption">{{ emp.puesto || emp.username }}</span>
              </template>
              <template #append>
                <v-btn
                  color="primary"
                  size="small"
                  variant="tonal"
                  prepend-icon="mdi-account-plus"
                  @click="abrirAsignar(emp, null)"
                >
                  Asignar
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </div>

      <!-- Estado vacío -->
      <v-card v-if="!data.lideres.length && !data.sinLider.length" variant="tonal" class="pa-8 text-center">
        <v-icon size="48" color="surface-variant" class="mb-3">mdi-account-group-outline</v-icon>
        <div class="text-body-1 text-medium-emphasis">No hay personal registrado</div>
      </v-card>
    </template>

    <!-- ── DIALOG ASIGNAR LÍDER ──────────────────────────── -->
    <v-dialog v-model="dialog" max-width="420">
      <v-card>
        <v-card-title class="pa-4 pb-2">
          {{ asignarTarget?.liderActual ? 'Reasignar líder' : 'Asignar líder' }}
        </v-card-title>
        <v-card-text>
          <div class="d-flex align-center gap-3 mb-4 pa-3 rounded" style="background: rgba(255,255,255,.05)">
            <v-avatar color="primary" size="36" variant="tonal">
              <span class="text-caption font-weight-bold">{{ iniciales(asignarTarget?.nombreCompleto || '') }}</span>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">{{ asignarTarget?.nombreCompleto }}</div>
              <div class="text-caption text-medium-emphasis">{{ asignarTarget?.puesto || asignarTarget?.username }}</div>
            </div>
          </div>

          <v-select
            v-model="liderSeleccionado"
            :items="opcionesLider"
            item-title="label"
            item-value="value"
            label="Líder directo"
            variant="outlined"
            density="compact"
            clearable
            placeholder="Sin líder asignado"
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end gap-2">
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="submitAsignar">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom end">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRHStore } from '@/stores/rh'

const store = useRHStore()

const loading          = ref(false)
const dialog           = ref(false)
const saving           = ref(false)
const liderSeleccionado = ref(null)
const asignarTarget    = ref(null)
const snack            = reactive({ show: false, text: '', color: 'success' })

const data = reactive({ lideres: [], sinLider: [] })

const totalAsignados = computed(() =>
  data.lideres.reduce((sum, l) => sum + l.equipo.length, 0)
)

const opcionesLider = computed(() =>
  data.lideres.map(l => ({
    label: `${l.nombreCompleto}${l.puesto ? ' — ' + l.puesto : ''}`,
    value: l.username,
  }))
)

function iniciales(nombre) {
  return nombre?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'
}

function showSnack(text, color = 'success') {
  snack.text = text; snack.color = color; snack.show = true
}

async function cargar() {
  loading.value = true
  try {
    const res = await store.fetchOrganigrama()
    data.lideres  = res.lideres
    data.sinLider = res.sinLider
  } catch {
    showSnack('Error al cargar el organigrama', 'error')
  } finally {
    loading.value = false
  }
}

function abrirAsignar(emp, liderActual) {
  asignarTarget.value   = { ...emp, liderActual }
  liderSeleccionado.value = liderActual || null
  dialog.value = true
}

async function submitAsignar() {
  if (!asignarTarget.value) return
  saving.value = true
  try {
    await store.asignarLider(asignarTarget.value.username, liderSeleccionado.value || null)
    dialog.value = false
    showSnack('Asignación guardada correctamente')
    await cargar()
  } catch (err) {
    showSnack(err.response?.data?.message || 'Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(cargar)
</script>
