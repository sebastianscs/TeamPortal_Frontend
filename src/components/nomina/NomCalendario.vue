<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-2">
      <div class="text-body-1 font-weight-bold">Calendario de pagos</div>
      <div class="d-flex align-center gap-2">
        <v-btn icon size="small" variant="tonal" @click="mesAnterior"><v-icon>mdi-chevron-left</v-icon></v-btn>
        <span class="text-body-1 font-weight-medium text-capitalize" style="min-width: 160px; text-align: center">{{ mesLabel }}</span>
        <v-btn icon size="small" variant="tonal" @click="mesSiguiente"><v-icon>mdi-chevron-right</v-icon></v-btn>
      </div>
    </div>

    <!-- Leyenda -->
    <div class="d-flex flex-wrap gap-3 mb-4">
      <div v-for="s in leyenda" :key="s.estado" class="d-flex align-center gap-1">
        <v-icon :color="s.color" size="14">mdi-circle</v-icon>
        <span class="text-caption">{{ s.label }}</span>
      </div>
    </div>

    <!-- Grilla de días -->
    <v-card variant="tonal" class="pa-4">
      <!-- Cabecera días de semana -->
      <v-row dense class="mb-2">
        <v-col v-for="dia in DIAS" :key="dia" cols="auto" style="flex: 1; text-align: center">
          <span class="text-caption text-medium-emphasis font-weight-bold text-uppercase">{{ dia }}</span>
        </v-col>
      </v-row>
      <!-- Semanas -->
      <v-row v-for="(semana, si) in semanas" :key="si" dense>
        <v-col v-for="(celda, ci) in semana" :key="ci" cols="auto" style="flex: 1; min-height: 90px">
          <div v-if="celda" class="calendar-cell rounded pa-1" style="height: 100%; min-height: 90px; background: rgba(255,255,255,0.03)">
            <div class="text-caption font-weight-bold mb-1" :class="celda.esHoy ? 'text-primary' : 'text-medium-emphasis'">{{ celda.dia }}</div>
            <template v-if="celda.periodos.length">
              <v-tooltip v-for="p in celda.periodos" :key="p.id" :text="`${p.nombre} — ${p.estado}`" location="top">
                <template #activator="{ props }">
                  <v-chip v-bind="props" :color="estadoColor(p.estado)" class="mb-1" size="x-small" variant="flat" style="width: 100%; cursor: pointer; justify-content: start"
                    @click="$emit('ver-periodo', p.id)">
                    {{ p.nombre.slice(0, 14) }}
                  </v-chip>
                </template>
              </v-tooltip>
            </template>
          </div>
          <div v-else style="min-height: 90px" />
        </v-col>
      </v-row>
    </v-card>

    <!-- Lista del mes -->
    <div class="mt-4">
      <div class="text-body-2 font-weight-bold mb-2">Períodos en {{ mesLabel }}</div>
      <v-card v-if="periodosDelMes.length === 0" variant="tonal" class="pa-4 text-center text-medium-emphasis text-body-2">
        Sin períodos registrados este mes
      </v-card>
      <v-list v-else lines="two" variant="tonal" rounded="lg">
        <v-list-item
          v-for="p in periodosDelMes"
          :key="p.id"
          :prepend-icon="estadoIcon(p.estado)"
          :title="p.nombre"
          :subtitle="`${fmtFecha(p.fechaInicio)} — ${fmtFecha(p.fechaFin)} · ${p.frecuencia} · ${p.totalNominas ?? 0} nóminas`"
          @click="$emit('ver-periodo', p.id)"
        >
          <template #append>
            <v-chip :color="estadoColor(p.estado)" size="x-small" variant="tonal">{{ p.estado }}</v-chip>
          </template>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useNominaStore } from '@/stores/nomina'

defineEmits(['ver-periodo'])

const store = useNominaStore()
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const now = new Date()
const año = ref(now.getFullYear())
const mes = ref(now.getMonth())   // 0-indexed

const mesLabel = computed(() =>
  new Date(año.value, mes.value, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
)

function mesAnterior () { if (mes.value === 0) { mes.value = 11; año.value-- } else mes.value-- }
function mesSiguiente () { if (mes.value === 11) { mes.value = 0; año.value++ } else mes.value++ }

const periodosDelMes = computed(() => store.periodos.filter(p => {
  const ini = new Date(p.fechaInicio)
  const fin = new Date(p.fechaFin)
  const primerDia = new Date(año.value, mes.value, 1)
  const ultimoDia = new Date(año.value, mes.value + 1, 0)
  return ini <= ultimoDia && fin >= primerDia
}))

const semanas = computed(() => {
  const primero = new Date(año.value, mes.value, 1)
  const ultimo  = new Date(año.value, mes.value + 1, 0)
  const hoy = new Date()
  const semanas = []
  let semana = Array(primero.getDay()).fill(null)

  for (let d = 1; d <= ultimo.getDate(); d++) {
    const fecha = new Date(año.value, mes.value, d)
    const periodosDia = store.periodos.filter(p => {
      const ini = new Date(p.fechaInicio)
      const fin = new Date(p.fechaFin)
      return fecha >= ini && fecha <= fin
    })
    semana.push({
      dia: d,
      esHoy: hoy.getFullYear() === año.value && hoy.getMonth() === mes.value && hoy.getDate() === d,
      periodos: periodosDia,
    })
    if (semana.length === 7) { semanas.push(semana); semana = [] }
  }
  if (semana.length) {
    while (semana.length < 7) semana.push(null)
    semanas.push(semana)
  }
  return semanas
})

const leyenda = [
  { estado: 'ABIERTO',  label: 'Abierto',  color: 'info' },
  { estado: 'CERRADO',  label: 'Cerrado',  color: 'warning' },
  { estado: 'PAGADO',   label: 'Pagado',   color: 'success' },
]

function estadoColor (e) { return { ABIERTO: 'info', CERRADO: 'warning', PAGADO: 'success' }[e] ?? 'default' }
function estadoIcon  (e) { return { ABIERTO: 'mdi-lock-open-outline', CERRADO: 'mdi-lock-outline', PAGADO: 'mdi-check-circle-outline' }[e] ?? 'mdi-circle-outline' }
function fmtFecha (d) {
  return d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', timeZone: 'UTC' }) : '—'
}
</script>

<style scoped>
.calendar-cell { transition: background 0.15s; }
.calendar-cell:hover { background: rgba(255,255,255,0.06) !important; }
</style>
