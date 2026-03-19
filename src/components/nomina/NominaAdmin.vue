<template>
  <v-container class="pa-4" fluid>

    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-2">
      <span class="text-h6 font-weight-bold">Administración de Nóminas</span>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="tab" class="mb-4" color="primary">
      <v-tab value="periodos">
        <v-icon class="mr-2" size="18">mdi-calendar-range</v-icon>
        Periodos
      </v-tab>
      <v-tab value="salarios">
        <v-icon class="mr-2" size="18">mdi-currency-usd</v-icon>
        Salarios
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">

      <!-- ── PERIODOS TAB ── -->
      <v-window-item value="periodos">

        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-body-1 font-weight-medium">Periodos de nómina</span>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            size="small"
            variant="tonal"
            @click="openPeriodoDialog()"
          >
            Nuevo periodo
          </v-btn>
        </div>

        <v-card color="surface-variant" rounded="lg">
          <v-data-table
            :headers="periodoHeaders"
            :items="nominaStore.periodos"
            :loading="nominaStore.loading"
            bg-color="transparent"
            density="comfortable"
            hide-default-footer
            :items-per-page="-1"
            no-data-text="Sin periodos registrados"
          >
            <template #item.nombre="{ item }">
              <span class="text-body-2 font-weight-medium">{{ item.nombre }}</span>
            </template>
            <template #item.frecuencia="{ item }">
              <span class="text-body-2">{{ item.frecuencia }}</span>
            </template>
            <template #item.fechaInicio="{ item }">
              <span class="text-body-2">{{ formatDate(item.fechaInicio) }}</span>
            </template>
            <template #item.fechaFin="{ item }">
              <span class="text-body-2">{{ formatDate(item.fechaFin) }}</span>
            </template>
            <template #item.estado="{ item }">
              <v-chip :color="periodoEstadoColor(item.estado)" size="x-small" variant="tonal">
                {{ item.estado }}
              </v-chip>
            </template>
            <template #item.totalNominas="{ item }">
              <span class="text-body-2">{{ item.totalNominas ?? 0 }}</span>
            </template>
            <template #item.acciones="{ item }">
              <div class="d-flex align-center gap-1">
                <v-btn
                  color="primary"
                  size="x-small"
                  variant="text"
                  @click="router.push(`/admin/nomina/${item.id}`)"
                >
                  Ver detalle
                </v-btn>
                <v-btn
                  color="success"
                  :loading="generandoPeriodoId === item.id"
                  size="x-small"
                  variant="tonal"
                  @click="handleGenerarNomina(item.id)"
                >
                  Generar
                </v-btn>
                <v-menu>
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      icon
                      size="x-small"
                      v-bind="menuProps"
                      variant="text"
                    >
                      <v-icon size="16">mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      v-for="estado in ['ABIERTO', 'CERRADO', 'PAGADO']"
                      :key="estado"
                      :title="estado"
                      @click="handleCambiarEstadoPeriodo(item.id, estado)"
                    />
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-data-table>
        </v-card>

      </v-window-item>

      <!-- ── SALARIOS TAB ── -->
      <v-window-item value="salarios">

        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-body-1 font-weight-medium">Salarios de empleados</span>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            size="small"
            variant="tonal"
            @click="openSalarioDialog(null)"
          >
            Nuevo salario
          </v-btn>
        </div>

        <v-card color="surface-variant" rounded="lg">
          <v-data-table
            :headers="salarioHeaders"
            :items="nominaStore.salarios"
            :loading="nominaStore.loading"
            bg-color="transparent"
            density="comfortable"
            hide-default-footer
            :items-per-page="-1"
            no-data-text="Sin salarios registrados"
          >
            <template #item.nombreCompleto="{ item }">
              <div>
                <div class="text-body-2 font-weight-medium">{{ item.nombreCompleto }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.username }}</div>
              </div>
            </template>
            <template #item.sueldoDiario="{ item }">
              <span class="text-body-2">{{ formatMXN(item.sueldoDiario) }}</span>
            </template>
            <template #item.frecuencia="{ item }">
              <span class="text-body-2">{{ item.frecuencia }}</span>
            </template>
            <template #item.acciones="{ item }">
              <v-btn
                color="primary"
                size="x-small"
                variant="tonal"
                @click="openSalarioDialog(item)"
              >
                Editar
              </v-btn>
            </template>
          </v-data-table>
        </v-card>

      </v-window-item>

    </v-window>

    <!-- ── CONCEPTOS SECTION ── -->
    <div class="mt-6">
      <div class="d-flex align-center justify-space-between mb-3">
        <span class="text-body-1 font-weight-medium">Conceptos y tasas</span>
        <v-btn
          size="x-small"
          variant="text"
          @click="conceptosExpanded = !conceptosExpanded"
        >
          {{ conceptosExpanded ? 'Ocultar' : 'Ver conceptos' }}
        </v-btn>
      </div>

      <v-expand-transition>
        <div v-if="conceptosExpanded">
          <v-card color="surface-variant" rounded="lg">
            <v-data-table
              :headers="conceptoHeaders"
              :items="nominaStore.conceptos"
              :loading="nominaStore.loading"
              bg-color="transparent"
              density="comfortable"
              hide-default-footer
              :items-per-page="-1"
              no-data-text="Sin conceptos registrados"
            >
              <template #item.valor="{ item }">
                <span class="text-body-2">{{ item.valor }}%</span>
              </template>
              <template #item.acciones="{ item }">
                <v-btn
                  color="primary"
                  size="x-small"
                  variant="tonal"
                  @click="openConceptoDialog(item)"
                >
                  Editar
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </div>
      </v-expand-transition>
    </div>

    <!-- ── DIALOGS ── -->

    <!-- Periodo form dialog -->
    <v-dialog v-model="periodoDialog" max-width="480" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">Nuevo periodo</span>
          <v-btn icon size="small" variant="text" @click="closePeriodoDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider />
        <v-form ref="periodoForm" @submit.prevent="submitPeriodo">
          <v-card-text class="pa-4 d-flex flex-column gap-3">

            <v-text-field
              v-model="periodoData.nombre"
              density="comfortable"
              label="Nombre del periodo"
              :rules="[v => !!v?.trim() || 'El nombre es requerido']"
              variant="outlined"
            />

            <v-select
              v-model="periodoData.frecuencia"
              density="comfortable"
              :items="['SEMANAL', 'QUINCENAL']"
              label="Frecuencia"
              :rules="[v => !!v || 'La frecuencia es requerida']"
              variant="outlined"
            />

            <v-text-field
              v-model="periodoData.fechaInicio"
              density="comfortable"
              label="Fecha inicio"
              :rules="[v => !!v || 'La fecha de inicio es requerida']"
              type="date"
              variant="outlined"
            />

            <v-text-field
              v-model="periodoData.fechaFin"
              density="comfortable"
              label="Fecha fin"
              :rules="[v => !!v || 'La fecha de fin es requerida']"
              type="date"
              variant="outlined"
            />

            <v-alert
              v-if="periodoError"
              :text="periodoError"
              color="error"
              density="compact"
              type="error"
              variant="tonal"
            />

          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="closePeriodoDialog">Cancelar</v-btn>
            <v-btn
              color="primary"
              :loading="submitting"
              type="submit"
              variant="tonal"
            >
              Crear periodo
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Salario form dialog -->
    <v-dialog v-model="salarioDialog" max-width="480" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">{{ salarioEditando ? 'Editar salario' : 'Nuevo salario' }}</span>
          <v-btn icon size="small" variant="text" @click="closeSalarioDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider />
        <v-form ref="salarioForm" @submit.prevent="submitSalario">
          <v-card-text class="pa-4 d-flex flex-column gap-3">

            <!-- Editar: muestra nombre completo de solo lectura -->
            <v-text-field
              v-if="salarioEditando"
              :model-value="salarioData.nombreCompleto"
              density="comfortable"
              label="Empleado"
              readonly
              variant="outlined"
            />
            <!-- Nuevo: autocomplete que muestra nombre pero usa username -->
            <v-autocomplete
              v-else
              v-model="salarioData.username"
              density="comfortable"
              :item-title="u => u.nombreCompleto"
              item-value="username"
              :items="nominaStore.salarios"
              label="Empleado"
              :rules="[v => !!v || 'El empleado es requerido']"
              variant="outlined"
            />

            <v-text-field
              v-model="salarioData.sueldoDiario"
              density="comfortable"
              label="Sueldo diario (MXN)"
              min="0"
              :rules="[v => !!v || 'El sueldo es requerido', v => Number(v) > 0 || 'Debe ser mayor a 0']"
              step="0.01"
              type="number"
              variant="outlined"
            />

            <v-select
              v-model="salarioData.frecuencia"
              density="comfortable"
              :items="['SEMANAL', 'QUINCENAL']"
              label="Frecuencia"
              :rules="[v => !!v || 'La frecuencia es requerida']"
              variant="outlined"
            />

            <v-alert
              v-if="salarioError"
              :text="salarioError"
              color="error"
              density="compact"
              type="error"
              variant="tonal"
            />

          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="closeSalarioDialog">Cancelar</v-btn>
            <v-btn
              color="primary"
              :loading="submitting"
              type="submit"
              variant="tonal"
            >
              Guardar
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Concepto edit dialog -->
    <v-dialog v-model="conceptoDialog" max-width="400" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">Editar concepto</span>
          <v-btn icon size="small" variant="text" @click="conceptoDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider />
        <v-form ref="conceptoForm" @submit.prevent="submitConcepto">
          <v-card-text class="pa-4 d-flex flex-column gap-3">

            <v-text-field
              :model-value="conceptoEditando?.nombre"
              density="comfortable"
              label="Concepto"
              readonly
              variant="outlined"
            />

            <v-text-field
              v-model="conceptoValor"
              density="comfortable"
              label="Porcentaje (%)"
              min="0"
              :rules="[v => !!v || 'El valor es requerido', v => Number(v) >= 0 || 'Debe ser >= 0']"
              step="0.01"
              suffix="%"
              type="number"
              variant="outlined"
            />

            <v-alert
              v-if="conceptoError"
              :text="conceptoError"
              color="error"
              density="compact"
              type="error"
              variant="tonal"
            />

          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="conceptoDialog = false">Cancelar</v-btn>
            <v-btn
              color="primary"
              :loading="submitting"
              type="submit"
              variant="tonal"
            >
              Guardar
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>

  </v-container>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useNominaStore } from '@/stores/nomina'

  const router = useRouter()

  const nominaStore = useNominaStore()

  const tab = ref('periodos')
  const submitting = ref(false)
  const generandoPeriodoId = ref(null)
  const conceptosExpanded = ref(false)
  const snackbar = ref({ show: false, text: '', color: 'success' })

  // ── Periodo ─────────────────────────────────────────────────────────────────
  const periodoDialog = ref(false)
  const periodoForm = ref(null)
  const periodoError = ref('')
  const periodoData = ref({ nombre: '', frecuencia: '', fechaInicio: '', fechaFin: '' })

  const periodoHeaders = [
    { title: 'Nombre', key: 'nombre', sortable: false },
    { title: 'Frecuencia', key: 'frecuencia', sortable: false },
    { title: 'Inicio', key: 'fechaInicio', sortable: false },
    { title: 'Fin', key: 'fechaFin', sortable: false },
    { title: 'Estado', key: 'estado', sortable: false },
    { title: 'Nóminas', key: 'totalNominas', sortable: false },
    { title: 'Acciones', key: 'acciones', sortable: false },
  ]

  function openPeriodoDialog () {
    periodoData.value = { nombre: '', frecuencia: '', fechaInicio: '', fechaFin: '' }
    periodoError.value = ''
    periodoDialog.value = true
  }

  function closePeriodoDialog () {
    periodoDialog.value = false
    periodoError.value = ''
    periodoForm.value?.reset()
  }

  async function submitPeriodo () {
    const { valid } = await periodoForm.value.validate()
    if (!valid) return
    submitting.value = true
    periodoError.value = ''
    try {
      await nominaStore.crearPeriodo(periodoData.value)
      closePeriodoDialog()
      snackbar.value = { show: true, text: 'Periodo creado correctamente', color: 'success' }
      await nominaStore.fetchPeriodos()
    } catch (err) {
      periodoError.value = err.response?.data?.message || 'Error al crear el periodo'
    } finally {
      submitting.value = false
    }
  }

  async function handleGenerarNomina (periodoId) {
    generandoPeriodoId.value = periodoId
    try {
      const result = await nominaStore.generarNomina(periodoId)
      const count = result?.nominasGeneradas ?? result?.count ?? ''
      snackbar.value = {
        show: true,
        text: `Nóminas generadas correctamente${count ? ': ' + count : ''}`,
        color: 'success',
      }
      await nominaStore.fetchPeriodos()
    } catch (err) {
      snackbar.value = {
        show: true,
        text: err.response?.data?.message || 'Error al generar nóminas',
        color: 'error',
      }
    } finally {
      generandoPeriodoId.value = null
    }
  }

  async function handleCambiarEstadoPeriodo (id, estado) {
    try {
      await nominaStore.updateEstadoPeriodo(id, estado)
      snackbar.value = { show: true, text: `Estado actualizado a ${estado}`, color: 'success' }
      await nominaStore.fetchPeriodos()
    } catch (err) {
      snackbar.value = {
        show: true,
        text: err.response?.data?.message || 'Error al actualizar estado',
        color: 'error',
      }
    }
  }

  // ── Salarios ────────────────────────────────────────────────────────────────
  const salarioDialog = ref(false)
  const salarioForm = ref(null)
  const salarioError = ref('')
  const salarioEditando = ref(null)
  const salarioData = ref({ username: '', nombreCompleto: '', sueldoDiario: '', frecuencia: '' })

  const salarioHeaders = [
    { title: 'Empleado', key: 'nombreCompleto', sortable: false },
    { title: 'Sueldo diario', key: 'sueldoDiario', sortable: false },
    { title: 'Frecuencia', key: 'frecuencia', sortable: false },
    { title: 'Acciones', key: 'acciones', sortable: false },
  ]

  function openSalarioDialog (item) {
    salarioEditando.value = item
    salarioError.value = ''
    if (item) {
      salarioData.value = {
        username: item.username,
        nombreCompleto: item.nombreCompleto,
        sueldoDiario: item.sueldoDiario,
        frecuencia: item.frecuencia,
      }
    } else {
      salarioData.value = { username: '', nombreCompleto: '', sueldoDiario: '', frecuencia: '' }
    }
    salarioDialog.value = true
  }

  function closeSalarioDialog () {
    salarioDialog.value = false
    salarioError.value = ''
    salarioEditando.value = null
    salarioForm.value?.reset()
  }

  async function submitSalario () {
    const { valid } = await salarioForm.value.validate()
    if (!valid) return
    submitting.value = true
    salarioError.value = ''
    try {
      await nominaStore.upsertSalario({
        usuarioId: salarioData.value.username,
        sueldoDiario: salarioData.value.sueldoDiario,
        frecuencia: salarioData.value.frecuencia,
      })
      closeSalarioDialog()
      snackbar.value = { show: true, text: 'Salario guardado correctamente', color: 'success' }
      await nominaStore.fetchSalarios()
    } catch (err) {
      salarioError.value = err.response?.data?.message || 'Error al guardar el salario'
    } finally {
      submitting.value = false
    }
  }

  // ── Conceptos ───────────────────────────────────────────────────────────────
  const conceptoDialog = ref(false)
  const conceptoForm = ref(null)
  const conceptoError = ref('')
  const conceptoEditando = ref(null)
  const conceptoValor = ref('')

  const conceptoHeaders = [
    { title: 'Concepto', key: 'nombre', sortable: false },
    { title: 'Tipo', key: 'tipo', sortable: false },
    { title: 'Valor', key: 'valor', sortable: false },
    { title: 'Acciones', key: 'acciones', sortable: false },
  ]

  function openConceptoDialog (item) {
    conceptoEditando.value = item
    conceptoValor.value = item.valor
    conceptoError.value = ''
    conceptoDialog.value = true
  }

  async function submitConcepto () {
    const { valid } = await conceptoForm.value.validate()
    if (!valid) return
    submitting.value = true
    conceptoError.value = ''
    try {
      await nominaStore.updateConcepto(conceptoEditando.value.id, { valor: Number(conceptoValor.value) })
      conceptoDialog.value = false
      snackbar.value = { show: true, text: 'Concepto actualizado correctamente', color: 'success' }
      await nominaStore.fetchConceptos()
    } catch (err) {
      conceptoError.value = err.response?.data?.message || 'Error al actualizar el concepto'
    } finally {
      submitting.value = false
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function formatMXN (n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
  }

  function formatDate (d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
  }

  function periodoEstadoColor (estado) {
    const map = { ABIERTO: 'info', CERRADO: 'warning', PAGADO: 'success' }
    return map[estado] ?? 'secondary'
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  onMounted(async () => {
    try {
      await Promise.all([
        nominaStore.fetchPeriodos(),
        nominaStore.fetchSalarios(),
        nominaStore.fetchConceptos(),
      ])
    } catch {
      snackbar.value = { show: true, text: 'Error al cargar datos', color: 'error' }
    }
  })
</script>
