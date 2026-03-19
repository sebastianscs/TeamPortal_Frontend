<template>
  <v-dialog
    :model-value="modelValue"
    max-width="580"
    persistent
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card color="surface-variant" rounded="lg">

      <!-- Header -->
      <div class="d-flex align-center justify-space-between px-4 pt-4 pb-3">
        <div>
          <div class="text-h6 font-weight-bold">Recibo de Nómina</div>
          <div v-if="nomina" class="text-body-2 font-weight-medium mt-1">
            {{ nomina.nombreCompleto }}
          </div>
          <div v-if="nomina" class="text-caption text-medium-emphasis">
            {{ nomina.periodoNombre }}
          </div>
        </div>
        <v-btn icon size="small" variant="text" @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <v-card-text class="pa-4" style="max-height: 70vh;">

        <!-- Skeleton -->
        <template v-if="loading">
          <v-skeleton-loader class="mb-3" type="list-item-two-line" />
          <v-skeleton-loader class="mb-3" type="list-item-two-line" />
          <v-skeleton-loader type="list-item-two-line" />
        </template>

        <template v-else-if="nomina">

          <!-- Resumen rápido -->
          <div class="d-flex gap-3 mb-4">
            <v-card class="flex-1-1" color="surface" rounded="lg" variant="flat">
              <div class="pa-3 text-center">
                <div class="text-caption text-medium-emphasis mb-1">Días hábiles</div>
                <div class="text-h5 font-weight-bold">{{ nomina.diasLaborados }}</div>
              </div>
            </v-card>
            <v-card class="flex-1-1" color="surface" rounded="lg" variant="flat">
              <div class="pa-3 text-center">
                <div class="text-caption text-medium-emphasis mb-1">Sueldo diario</div>
                <div class="text-h6 font-weight-bold">{{ formatMXN(sueldoDiario) }}</div>
              </div>
            </v-card>
            <v-card class="flex-1-1" color="surface" rounded="lg" variant="flat">
              <div class="pa-3 text-center">
                <div class="text-caption text-medium-emphasis mb-1">Estado</div>
                <v-chip :color="estadoColor" density="compact" size="small" variant="tonal">
                  {{ nomina.estado }}
                </v-chip>
              </div>
            </v-card>
          </div>

          <!-- Percepciones -->
          <v-card class="mb-3" color="success" rounded="lg" variant="tonal">
            <div class="px-4 pt-3 pb-2">
              <div class="text-caption text-uppercase font-weight-bold mb-3 text-success">
                Percepciones
              </div>

              <!-- Sueldo base con desglose -->
              <div class="d-flex justify-space-between align-start py-1">
                <div>
                  <div class="text-body-2">Sueldo base</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ nomina.diasLaborados }} días × {{ formatMXN(sueldoDiario) }}/día
                  </div>
                </div>
                <span class="text-body-2 font-weight-medium">{{ formatMXN(nomina.sueldoBase) }}</span>
              </div>

              <div class="d-flex justify-space-between align-start py-1">
                <div>
                  <div class="text-body-2">Horas extras</div>
                  <div class="text-caption text-medium-emphasis">{{ nomina.horasExtras ?? 0 }} hrs registradas</div>
                </div>
                <span class="text-body-2 font-weight-medium">{{ formatMXN(nomina.montoHorasExtras) }}</span>
              </div>

              <div class="d-flex justify-space-between align-center py-1">
                <span class="text-body-2">Bono</span>
                <span class="text-body-2 font-weight-medium">{{ formatMXN(nomina.montoBono) }}</span>
              </div>

              <v-divider class="my-2" />
              <div class="d-flex justify-space-between align-center py-1">
                <span class="text-body-2 font-weight-bold">Total percepciones</span>
                <span class="text-body-2 font-weight-bold">{{ formatMXN(nomina.totalPercepciones) }}</span>
              </div>
            </div>
          </v-card>

          <!-- Deducciones -->
          <v-card class="mb-3" color="error" rounded="lg" variant="tonal">
            <div class="px-4 pt-3 pb-2">
              <div class="text-caption text-uppercase font-weight-bold mb-3 text-error">
                Deducciones
              </div>

              <div
                v-for="d in deduccionesDetalle"
                :key="d.label"
                class="d-flex justify-space-between align-start py-1"
              >
                <div>
                  <div class="text-body-2">{{ d.label }}</div>
                  <div v-if="d.pct !== null" class="text-caption text-medium-emphasis">
                    {{ d.pct }}% sobre percepciones
                  </div>
                </div>
                <span class="text-body-2 font-weight-medium">{{ formatMXN(d.monto) }}</span>
              </div>

              <v-divider class="my-2" />
              <div class="d-flex justify-space-between align-center py-1">
                <span class="text-body-2 font-weight-bold">Total deducciones</span>
                <span class="text-body-2 font-weight-bold text-error">{{ formatMXN(nomina.totalDeducciones) }}</span>
              </div>

              <!-- Barra de deducción -->
              <div class="mt-3 mb-1">
                <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-1">
                  <span>% deducido del total</span>
                  <span>{{ pctDeduccion }}%</span>
                </div>
                <v-progress-linear
                  :model-value="pctDeduccion"
                  color="error"
                  bg-color="rgba(255,255,255,0.15)"
                  height="6"
                  rounded
                />
              </div>
            </div>
          </v-card>

          <!-- Neto a pagar -->
          <div class="text-center pa-3">
            <div class="text-caption text-uppercase text-medium-emphasis mb-1">Neto a pagar</div>
            <div class="text-h3 font-weight-bold text-primary">
              {{ formatMXN(nomina.netoAPagar) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ formatMXN(nomina.totalPercepciones) }} − {{ formatMXN(nomina.totalDeducciones) }}
            </div>
          </div>

        </template>

        <!-- No data -->
        <div v-else class="text-center pa-4 text-medium-emphasis">
          No se pudo cargar el detalle.
        </div>

      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cerrar</v-btn>
        <v-btn
          color="primary"
          :disabled="!nomina || downloading"
          :loading="downloading"
          prepend-icon="mdi-download"
          variant="tonal"
          @click="handleDescargar"
        >
          Descargar recibo
        </v-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { useNominaStore } from '@/stores/nomina'

  const props = defineProps({
    modelValue: { type: Boolean, default: false },
    nominaId:   { type: Number,  default: null  },
  })

  defineEmits(['update:modelValue'])

  const nominaStore = useNominaStore()
  const nomina      = ref(null)
  const loading     = ref(false)
  const downloading = ref(false)

  function formatMXN (n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
  }

  function pct (monto, base) {
    if (!base) return null
    return (Number(monto) / Number(base) * 100).toFixed(2)
  }

  const sueldoDiario = computed(() => {
    if (!nomina.value || !nomina.value.diasLaborados) return 0
    return Number(nomina.value.sueldoBase) / Number(nomina.value.diasLaborados)
  })

  const deduccionesDetalle = computed(() => {
    if (!nomina.value) return []
    const base = nomina.value.totalPercepciones
    return [
      { label: 'IMSS',              monto: nomina.value.montoIMSS,       pct: pct(nomina.value.montoIMSS,      base) },
      { label: 'ISR',               monto: nomina.value.montoISR,        pct: pct(nomina.value.montoISR,       base) },
      { label: 'INFONAVIT',         monto: nomina.value.montoINFONAVIT,  pct: pct(nomina.value.montoINFONAVIT, base) },
      { label: 'Otras deducciones', monto: nomina.value.otrasDeduciones, pct: null },
    ]
  })

  const pctDeduccion = computed(() => {
    if (!nomina.value || !nomina.value.totalPercepciones) return 0
    return Number(pct(nomina.value.totalDeducciones, nomina.value.totalPercepciones))
  })

  const estadoColor = computed(() => {
    const map = { APROBADA: 'success', PAGADA: 'info', RECHAZADA: 'error', BORRADOR: 'warning' }
    return map[nomina.value?.estado] ?? 'secondary'
  })

  async function fetchDetalle () {
    if (!props.nominaId) return
    loading.value = true
    nomina.value = null
    try {
      nomina.value = await nominaStore.getNominaById(props.nominaId)
    } catch (err) {
      console.error('[NominaDetalle] Error:', err?.response?.data ?? err)
      nomina.value = null
    } finally {
      loading.value = false
    }
  }

  watch(
    () => [props.modelValue, props.nominaId],
    ([open, id]) => { if (open && id) fetchDetalle() },
    { immediate: true },
  )

  async function handleDescargar () {
    if (!props.nominaId) return
    downloading.value = true
    try {
      await nominaStore.descargarRecibo(props.nominaId)
    } finally {
      downloading.value = false
    }
  }
</script>
