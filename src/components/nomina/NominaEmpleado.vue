<template>
  <v-container class="pa-4" fluid>

    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-2">
      <span class="text-h6 font-weight-bold">Mi Nómina</span>
      <span v-if="lastNomina" class="text-caption text-medium-emphasis">
        Último pago: {{ formatDate(lastNomina.fechaFin) }}
      </span>
    </div>

    <!-- Summary cards -->
    <v-row class="mb-4" dense>
      <v-col cols="12" md="6">
        <v-card color="surface-variant" rounded="lg">
          <div class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption text-medium-emphasis text-uppercase font-weight-medium">
                Último neto recibido
              </span>
              <v-chip
                v-if="lastNomina"
                :color="estadoColor(lastNomina.estado)"
                size="x-small"
                variant="tonal"
              >
                {{ lastNomina.estado }}
              </v-chip>
            </div>
            <div class="text-h4 font-weight-bold text-primary">
              {{ lastNomina ? formatMXN(lastNomina.netoAPagar) : '—' }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ lastNomina?.nombrePeriodo ?? 'Sin nóminas registradas' }}
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card color="surface-variant" rounded="lg">
          <div class="pa-4">
            <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2">
              Total acumulado
            </div>
            <div class="text-h4 font-weight-bold">
              {{ formatMXN(totalAcumulado) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ nominaStore.nominasEmpleado.length }} periodo(s)
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Table -->
    <v-card color="surface-variant" rounded="lg">
      <v-data-table
        :headers="headers"
        :items="nominaStore.nominasEmpleado"
        :loading="nominaStore.loading"
        bg-color="transparent"
        density="comfortable"
        hide-default-footer
        :items-per-page="-1"
        no-data-text="Sin nóminas registradas"
      >
        <template #item.nombrePeriodo="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.nombrePeriodo }}</span>
        </template>
        <template #item.frecuencia="{ item }">
          <span class="text-body-2">{{ item.frecuencia }}</span>
        </template>
        <template #item.fechas="{ item }">
          <span class="text-body-2">{{ formatDate(item.fechaInicio) }} — {{ formatDate(item.fechaFin) }}</span>
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
          <v-chip :color="estadoColor(item.estado)" size="x-small" variant="tonal">
            {{ item.estado }}
          </v-chip>
        </template>
        <template #item.acciones="{ item }">
          <v-btn
            color="primary"
            size="x-small"
            variant="tonal"
            @click="openDetalle(item.id)"
          >
            Ver detalle
          </v-btn>
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

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>

  </v-container>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useNominaStore } from '@/stores/nomina'
  import NominaDetalleDialog from '@/components/nomina/NominaDetalleDialog.vue'

  const nominaStore = useNominaStore()
  const detalleDialog = ref(false)
  const selectedNominaId = ref(null)
  const snackbar = ref({ show: false, text: '', color: 'success' })

  const headers = [
    { title: 'Periodo', key: 'nombrePeriodo', sortable: false },
    { title: 'Frecuencia', key: 'frecuencia', sortable: false },
    { title: 'Fechas', key: 'fechas', sortable: false },
    { title: 'Percepciones', key: 'totalPercepciones', sortable: false },
    { title: 'Deducciones', key: 'totalDeducciones', sortable: false },
    { title: 'Neto', key: 'netoAPagar', sortable: false },
    { title: 'Estado', key: 'estado', sortable: false },
    { title: 'Acciones', key: 'acciones', sortable: false },
  ]

  const lastNomina = computed(() => {
    if (!nominaStore.nominasEmpleado.length) return null
    const aprobadas = nominaStore.nominasEmpleado.filter(n =>
      n.estado === 'APROBADA' || n.estado === 'PAGADA',
    )
    if (aprobadas.length) return aprobadas[0]
    return nominaStore.nominasEmpleado[0]
  })

  const totalAcumulado = computed(() =>
    nominaStore.nominasEmpleado.reduce((sum, n) => sum + (Number(n.netoAPagar) || 0), 0),
  )

  function formatMXN (n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
  }

  function formatDate (d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
  }

  function estadoColor (estado) {
    const map = { APROBADA: 'success', PAGADA: 'info', RECHAZADA: 'error', BORRADOR: 'warning' }
    return map[estado] ?? 'secondary'
  }

  function openDetalle (id) {
    selectedNominaId.value = id
    detalleDialog.value = true
  }

  onMounted(async () => {
    try {
      await nominaStore.fetchMisNominas()
    } catch {
      snackbar.value = { show: true, text: 'Error al cargar las nóminas', color: 'error' }
    }
  })
</script>
