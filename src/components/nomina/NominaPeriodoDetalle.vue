<template>
  <v-container class="pa-4" fluid>

    <!-- Back button -->
    <div class="mb-4">
      <v-btn
        prepend-icon="mdi-arrow-left"
        size="small"
        to="/admin/nomina"
        variant="text"
      >
        Periodos
      </v-btn>
    </div>

    <!-- Header skeleton -->
    <template v-if="loadingPeriodo">
      <v-skeleton-loader class="mb-4" type="heading" />
    </template>

    <!-- Header -->
    <div v-else-if="periodo" class="d-flex align-center justify-space-between mb-4 flex-wrap gap-2">
      <div>
        <div class="d-flex align-center gap-2">
          <span class="text-h6 font-weight-bold">{{ periodo.nombre }}</span>
          <v-chip :color="periodoEstadoColor(periodo.estado)" size="small" variant="tonal">
            {{ periodo.estado }}
          </v-chip>
        </div>
        <div class="text-caption text-medium-emphasis mt-1">
          {{ formatDate(periodo.fechaInicio) }} — {{ formatDate(periodo.fechaFin) }}
        </div>
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn
          color="success"
          :loading="aprobandoTodas"
          prepend-icon="mdi-check-all"
          size="small"
          variant="tonal"
          @click="handleAprobarTodas"
        >
          Aprobar todas
        </v-btn>
        <v-btn color="success" prepend-icon="mdi-microsoft-excel" size="small" variant="tonal" @click="descargarExcel">
          Exportar Excel
        </v-btn>
      </div>
    </div>

    <!-- Nominas table -->
    <v-card color="surface-variant" rounded="lg">
      <v-data-table
        :headers="headers"
        :items="nominas"
        :loading="loadingNominas"
        bg-color="transparent"
        density="comfortable"
        hide-default-footer
        :items-per-page="-1"
        no-data-text="Sin nóminas para este periodo"
      >
        <template #item.nombreCompleto="{ item }">
          <div>
            <div class="text-body-2 font-weight-medium">{{ item.nombreCompleto }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.usuarioId }}</div>
          </div>
        </template>
        <template #item.diasLaborados="{ item }">
          <span class="text-body-2">{{ item.diasLaborados ?? '—' }}</span>
        </template>
        <template #item.horasExtras="{ item }">
          <span class="text-body-2">{{ item.horasExtras ?? 0 }}</span>
        </template>
        <template #item.totalPercepciones="{ item }">
          <span class="text-body-2">{{ formatMXN(item.totalPercepciones) }}</span>
        </template>
        <template #item.totalDeducciones="{ item }">
          <span class="text-body-2 text-error">{{ formatMXN(item.totalDeducciones) }}</span>
        </template>
        <template #item.netoAPagar="{ item }">
          <span class="text-body-2 font-weight-bold text-primary">{{ formatMXN(item.netoAPagar) }}</span>
        </template>
        <template #item.estado="{ item }">
          <v-chip :color="nominaEstadoColor(item.estado)" size="x-small" variant="tonal">
            {{ item.estado }}
          </v-chip>
        </template>
        <template #item.acciones="{ item }">
          <div class="d-flex align-center gap-1">
            <v-btn
              color="primary"
              size="x-small"
              variant="text"
              @click="openDetalle(item.id)"
            >
              Ver
            </v-btn>
            <v-btn
              color="secondary"
              size="x-small"
              variant="text"
              @click="openAjuste(item)"
            >
              Ajustar
            </v-btn>
            <v-btn
              v-if="item.estado === 'BORRADOR'"
              color="success"
              :loading="aprobandoId === item.id"
              size="x-small"
              variant="tonal"
              @click="handleAprobar(item.id)"
            >
              Aprobar
            </v-btn>
            <v-btn
              v-if="item.estado === 'BORRADOR'"
              color="error"
              size="x-small"
              variant="tonal"
              @click="openRechazar(item)"
            >
              Rechazar
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Detalle dialog -->
    <v-dialog v-model="detalleDialog" max-width="560" persistent>
      <NominaDetalleDialog
        :model-value="detalleDialog"
        :nomina-id="selectedNominaId"
        @update:model-value="detalleDialog = $event"
      />
    </v-dialog>

    <!-- Rechazar dialog -->
    <v-dialog v-model="rechazarDialog" max-width="420" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">Rechazar nómina</span>
          <v-btn icon size="small" variant="text" @click="rechazarDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider />
        <v-form ref="rechazarForm" @submit.prevent="submitRechazar">
          <v-card-text class="pa-4 d-flex flex-column gap-3">
            <div class="text-body-2 text-medium-emphasis">
              Indica el motivo del rechazo para la nómina de
              <strong>{{ rechazandoNomina?.nombreCompleto ?? rechazandoNomina?.usuarioId }}</strong>.
            </div>
            <v-textarea
              v-model="observacionesRechazo"
              auto-grow
              counter
              density="comfortable"
              label="Observaciones *"
              maxlength="500"
              rows="3"
              :rules="[v => !!v?.trim() || 'Las observaciones son requeridas', v => (v?.trim().length ?? 0) >= 5 || 'Mínimo 5 caracteres']"
              variant="outlined"
            />
            <v-alert
              v-if="rechazarError"
              :text="rechazarError"
              color="error"
              density="compact"
              type="error"
              variant="tonal"
            />
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="rechazarDialog = false">Cancelar</v-btn>
            <v-btn
              color="error"
              :loading="rechazando"
              type="submit"
              variant="tonal"
            >
              Rechazar
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Ajuste dialog -->
    <v-dialog v-model="ajusteDialog" max-width="440" persistent>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <div>
            <div class="text-h6 font-weight-bold">Ajustar nómina</div>
            <div class="text-caption text-medium-emphasis">{{ ajusteNomina?.nombreCompleto }}</div>
          </div>
          <v-btn icon size="small" variant="text" @click="ajusteDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider />
        <v-form ref="ajusteForm" @submit.prevent="submitAjuste">
          <v-card-text class="pa-4 d-flex flex-column gap-4">

            <!-- Días trabajados -->
            <div>
              <div class="text-body-2 font-weight-medium mb-1">Días trabajados</div>
              <div class="text-caption text-medium-emphasis mb-2">
                Días hábiles del periodo: <strong>{{ ajusteNomina?.diasLaborados ?? '—' }}</strong>.
                Deja en blanco para usar el total del periodo.
              </div>
              <v-text-field
                v-model.number="ajusteData.diasTrabajados"
                clearable
                density="comfortable"
                hide-details
                label="Días reales asistidos"
                :max="ajusteNomina?.diasLaborados"
                min="0"
                placeholder="Sin especificar (usa días del periodo)"
                suffix="días"
                type="number"
                variant="outlined"
              />
            </div>

            <!-- Horas extras -->
            <div>
              <div class="text-body-2 font-weight-medium mb-1">Horas extras</div>
              <div class="text-caption text-medium-emphasis mb-2">
                Se pagan al doble de la tarifa hora (sueldo diario ÷ 8 × 2)
              </div>
              <v-text-field
                v-model.number="ajusteData.horasExtras"
                density="comfortable"
                hide-details
                label="Horas"
                min="0"
                step="0.5"
                suffix="hrs"
                type="number"
                variant="outlined"
              />
            </div>

            <!-- Bono -->
            <div>
              <div class="text-body-2 font-weight-medium mb-1">Bono</div>
              <v-text-field
                v-model.number="ajusteData.montoBono"
                density="comfortable"
                hide-details="auto"
                label="Monto"
                min="0"
                prefix="$"
                type="number"
                variant="outlined"
              />
              <v-text-field
                v-model="ajusteData.conceptoBono"
                class="mt-2"
                density="comfortable"
                hide-details
                label="Concepto (opcional)"
                maxlength="200"
                variant="outlined"
              />
            </div>

            <!-- Info: recalculo automático -->
            <v-alert
              density="compact"
              icon="mdi-information-outline"
              text="Si la nómina ya fue generada, se recalculará automáticamente al guardar."
              type="info"
              variant="tonal"
            />

            <v-alert
              v-if="ajusteError"
              :text="ajusteError"
              color="error"
              density="compact"
              type="error"
              variant="tonal"
            />
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="ajusteDialog = false">Cancelar</v-btn>
            <v-btn color="primary" :loading="guardandoAjuste" type="submit" variant="tonal">
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
  import { useRoute } from 'vue-router'
  import { useNominaStore } from '@/stores/nomina'
  import NominaDetalleDialog from '@/components/nomina/NominaDetalleDialog.vue'

  const route = useRoute()
  const nominaStore = useNominaStore()

  const periodoId = Number(route.params.id)

  const periodo = ref(null)
  const nominas = ref([])
  const loadingPeriodo = ref(false)
  const loadingNominas = ref(false)
  const aprobandoTodas = ref(false)
  const aprobandoId = ref(null)
  const snackbar = ref({ show: false, text: '', color: 'success' })

  // Detalle dialog
  const detalleDialog = ref(false)
  const selectedNominaId = ref(null)

  // Ajuste dialog
  const ajusteDialog      = ref(false)
  const ajusteForm        = ref(null)
  const ajusteNomina      = ref(null)
  const ajusteData        = ref({ diasTrabajados: null, horasExtras: 0, montoBono: 0, conceptoBono: '' })
  const ajusteError       = ref('')
  const guardandoAjuste   = ref(false)

  function openAjuste (nomina) {
    ajusteNomina.value = nomina
    ajusteData.value   = {
      diasTrabajados: null,
      horasExtras:    Number(nomina.horasExtras ?? 0),
      montoBono:      Number(nomina.montoBono   ?? 0),
      conceptoBono:   '',
    }
    ajusteError.value  = ''
    ajusteDialog.value = true
  }

  async function submitAjuste () {
    guardandoAjuste.value = true
    ajusteError.value     = ''
    try {
      const result = await nominaStore.upsertAjuste(periodoId, ajusteNomina.value.usuarioId, {
        diasTrabajados: ajusteData.value.diasTrabajados != null ? Number(ajusteData.value.diasTrabajados) : null,
        horasExtras:    ajusteData.value.horasExtras  || 0,
        montoBono:      ajusteData.value.montoBono    || 0,
        conceptoBono:   ajusteData.value.conceptoBono || null,
      })
      ajusteDialog.value = false
      snackbar.value = {
        show:  true,
        text:  result.recalculada ? 'Ajuste guardado y nómina recalculada' : 'Ajuste guardado (se aplicará al generar)',
        color: 'success',
      }
      await fetchNominas()
    } catch (err) {
      ajusteError.value = err.response?.data?.message || 'Error al guardar el ajuste'
    } finally {
      guardandoAjuste.value = false
    }
  }

  // Rechazar dialog
  const rechazarDialog = ref(false)
  const rechazarForm = ref(null)
  const rechazandoNomina = ref(null)
  const observacionesRechazo = ref('')
  const rechazarError = ref('')
  const rechazando = ref(false)

  const headers = [
    { title: 'Empleado', key: 'nombreCompleto', sortable: false },
    { title: 'Días', key: 'diasLaborados', sortable: false },
    { title: 'Horas extra', key: 'horasExtras', sortable: false },
    { title: 'Percepciones', key: 'totalPercepciones', sortable: false },
    { title: 'Deducciones', key: 'totalDeducciones', sortable: false },
    { title: 'Neto', key: 'netoAPagar', sortable: false },
    { title: 'Estado', key: 'estado', sortable: false },
    { title: 'Acciones', key: 'acciones', sortable: false },
  ]

  function periodoEstadoColor (estado) {
    const map = { ABIERTO: 'info', CERRADO: 'warning', PAGADO: 'success' }
    return map[estado] ?? 'secondary'
  }

  function nominaEstadoColor (estado) {
    const map = { APROBADA: 'success', PAGADA: 'info', RECHAZADA: 'error', BORRADOR: 'warning' }
    return map[estado] ?? 'secondary'
  }

  function formatMXN (n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
  }

  function formatDate (d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
  }

  function openDetalle (id) {
    selectedNominaId.value = id
    detalleDialog.value = true
  }

  function openRechazar (nomina) {
    rechazandoNomina.value = nomina
    observacionesRechazo.value = ''
    rechazarError.value = ''
    rechazarDialog.value = true
  }

  async function handleAprobar (id) {
    aprobandoId.value = id
    try {
      await nominaStore.updateEstadoNomina(id, 'APROBADA', '')
      snackbar.value = { show: true, text: 'Nómina aprobada correctamente', color: 'success' }
      await fetchNominas()
    } catch (err) {
      snackbar.value = {
        show: true,
        text: err.response?.data?.message || 'Error al aprobar la nómina',
        color: 'error',
      }
    } finally {
      aprobandoId.value = null
    }
  }

  async function submitRechazar () {
    const { valid } = await rechazarForm.value.validate()
    if (!valid) return
    rechazando.value = true
    rechazarError.value = ''
    try {
      await nominaStore.updateEstadoNomina(rechazandoNomina.value.id, 'RECHAZADA', observacionesRechazo.value.trim())
      rechazarDialog.value = false
      snackbar.value = { show: true, text: 'Nómina rechazada', color: 'warning' }
      await fetchNominas()
    } catch (err) {
      rechazarError.value = err.response?.data?.message || 'Error al rechazar la nómina'
    } finally {
      rechazando.value = false
    }
  }

  async function handleAprobarTodas () {
    aprobandoTodas.value = true
    try {
      await nominaStore.aprobarTodas(periodoId)
      snackbar.value = { show: true, text: 'Todas las nóminas aprobadas', color: 'success' }
      await fetchNominas()
    } catch (err) {
      snackbar.value = {
        show: true,
        text: err.response?.data?.message || 'Error al aprobar todas las nóminas',
        color: 'error',
      }
    } finally {
      aprobandoTodas.value = false
    }
  }

  async function fetchNominas () {
    loadingNominas.value = true
    try {
      const res = await import('@/api').then(m => m.default.get(`/nomina/periodos/${periodoId}/nominas`))
      nominas.value = res.data.data ?? res.data ?? []
    } catch {
      nominas.value = []
    } finally {
      loadingNominas.value = false
    }
  }

  async function descargarExcel () {
    await nominaStore.exportarExcel(periodoId, periodo.value?.nombre || periodoId)
  }

  async function fetchPeriodo () {
    loadingPeriodo.value = true
    try {
      const res = await import('@/api').then(m => m.default.get(`/nomina/periodos/${periodoId}`))
      periodo.value = res.data.data ?? res.data
    } catch {
      periodo.value = null
    } finally {
      loadingPeriodo.value = false
    }
  }

  onMounted(async () => {
    await Promise.all([fetchPeriodo(), fetchNominas()])
  })
</script>
