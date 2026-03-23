<template>
  <v-container fluid class="pa-6">

    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
      <div>
        <div class="text-h5 font-weight-bold">Recursos Humanos</div>
        <div class="text-body-2 text-medium-emphasis mt-1">Gestión de personal y asistencia</div>
      </div>
      <v-btn v-if="tab === 'personal'" color="primary" prepend-icon="mdi-account-plus" @click="openCreate">
        Nuevo empleado
      </v-btn>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="tab" color="primary" class="mb-5">
      <v-tab value="personal" prepend-icon="mdi-account-group">Personal</v-tab>
      <v-tab value="asistencia" prepend-icon="mdi-calendar-check">Asistencia</v-tab>
      <v-tab value="organigrama" prepend-icon="mdi-sitemap">Organigrama</v-tab>
      <v-tab value="turnos" prepend-icon="mdi-clock-outline">Turnos</v-tab>
      <v-tab value="catalogos" prepend-icon="mdi-tag-multiple-outline">Catálogos</v-tab>
    </v-tabs>

    <v-window v-model="tab">

      <!-- ── TAB PERSONAL ─────────────────────────────────────────────────── -->
      <v-window-item value="personal">

    <!-- Filtros -->
    <v-card variant="tonal" class="mb-4 pa-4">
      <v-row dense align="center">
        <v-col cols="12" sm="5">
          <v-text-field
            v-model="search"
            clearable
            density="compact"
            hide-details
            label="Buscar por nombre, username o email"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            @update:model-value="debouncedFetch"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select
            v-model="filtroRol"
            :items="['EMPLEADO','ADMIN','RH']"
            clearable
            density="compact"
            hide-details
            label="Rol"
            variant="outlined"
            @update:model-value="fetchPersonal"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-select
            v-model="filtroActivo"
            :items="[{ title: 'Activo', value: true }, { title: 'Inactivo', value: false }]"
            clearable
            density="compact"
            hide-details
            label="Estado"
            variant="outlined"
            @update:model-value="fetchPersonal"
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Tabla -->
    <v-card variant="tonal">
      <v-data-table
        :headers="headers"
        :items="personalFiltrado"
        :loading="store.loading"
        hover
        item-value="username"
      >
        <template #item.nombreCompleto="{ item }">
          <div class="d-flex align-center gap-3 py-1">
            <v-avatar color="primary" size="38" class="text-caption font-weight-bold flex-shrink-0">
              {{ iniciales(item) }}
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.nombreCompleto }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.username }}</div>
            </div>
          </div>
        </template>
        <template #item.puesto="{ item }">
          <div v-if="item.puesto">
            <div class="text-body-2">{{ item.puesto }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.departamento }}</div>
          </div>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.rol="{ item }">
          <v-chip :color="rolColor(item.rol)" size="small" variant="tonal">{{ item.rol }}</v-chip>
        </template>
        <template #item.activo="{ item }">
          <v-chip :color="item.activo ? 'success' : 'error'" size="small" variant="tonal">
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>
        <template #item.fechaIngreso="{ item }">
          <span class="text-body-2">{{ formatDate(item.fechaIngreso) }}</span>
        </template>
        <template #item.acciones="{ item }">
          <v-btn color="primary" icon="mdi-eye" size="small" variant="text" @click="openDetalle(item)" />
          <v-btn color="secondary" icon="mdi-pencil" size="small" variant="text" @click="openEdit(item)" />
        </template>
      </v-data-table>
    </v-card>

      </v-window-item>

      <!-- ── TAB ASISTENCIA ──────────────────────────────────────────────── -->
      <v-window-item value="asistencia">
        <RHAsistencia />
      </v-window-item>

      <!-- ── TAB ORGANIGRAMA ─────────────────────────────────────────────── -->
      <v-window-item value="organigrama">
        <RHOrganigrama />
      </v-window-item>

      <!-- ── TAB TURNOS ──────────────────────────────────────────────────── -->
      <v-window-item value="turnos">
        <RHTurnos />
      </v-window-item>

      <!-- ── TAB CATÁLOGOS ──────────────────────────────────────────────────── -->
      <v-window-item value="catalogos">
        <RHCatalogos />
      </v-window-item>

    </v-window>

    <!-- ── DETALLE ───────────────────────────────────────────────────────── -->
    <v-dialog v-model="detalleDialog" max-width="560" scrollable>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">Ficha del empleado</span>
          <v-btn icon size="small" variant="text" @click="detalleDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider />
        <v-card-text v-if="detalleEmpleado" style="max-height: 72vh;">
          <!-- Encabezado -->
          <div class="d-flex align-center gap-4 py-3">
            <v-avatar color="primary" size="64" class="text-h6 font-weight-bold">
              {{ iniciales(detalleEmpleado) }}
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ detalleEmpleado.nombreCompleto }}</div>
              <div class="text-caption text-medium-emphasis">@{{ detalleEmpleado.username }}</div>
              <div class="d-flex gap-2 mt-1">
                <v-chip :color="rolColor(detalleEmpleado.rol)" density="compact" size="x-small" variant="tonal">{{ detalleEmpleado.rol }}</v-chip>
                <v-chip :color="detalleEmpleado.activo ? 'success' : 'error'" density="compact" size="x-small" variant="tonal">{{ detalleEmpleado.activo ? 'Activo' : 'Inactivo' }}</v-chip>
              </div>
            </div>
          </div>
          <v-divider class="mb-3" />

          <!-- Secciones de detalle -->
          <template v-for="seccion in seccionesDetalle" :key="seccion.titulo">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2 mt-3">
              {{ seccion.titulo }}
            </div>
            <v-row dense>
              <v-col
                v-for="campo in seccion.campos"
                :key="campo.label"
                :cols="campo.cols ?? 6"
              >
                <div class="text-caption text-medium-emphasis">{{ campo.label }}</div>
                <div class="text-body-2 font-weight-medium mb-1">
                  {{ campo.format ? campo.format(detalleEmpleado[campo.key]) : (detalleEmpleado[campo.key] || '—') }}
                </div>
              </v-col>
            </v-row>
            <v-divider class="mt-2" />
          </template>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="detalleDialog = false">Cerrar</v-btn>
          <v-btn color="primary" variant="tonal" @click="detalleDialog = false; openEdit(detalleEmpleado)">
            Editar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── FORMULARIO CREAR / EDITAR ─────────────────────────────────────── -->
    <v-dialog v-model="formDialog" max-width="700" persistent scrollable>
      <v-card color="surface-variant" rounded="lg">
        <div class="d-flex align-center justify-space-between px-5 pt-4 pb-2">
          <span class="text-h6 font-weight-bold">
            {{ editTarget ? 'Editar empleado' : 'Nuevo empleado' }}
          </span>
          <div class="d-flex align-center gap-2">
            <input ref="pdfInput" type="file" accept=".pdf" style="display:none" @change="handleOcrFile" />
            <v-btn
              variant="tonal"
              size="small"
              prepend-icon="mdi-file-pdf-box"
              :loading="ocrLoading"
              @click="pdfInput.click()"
            >
              Importar PDF
            </v-btn>
            <v-btn icon size="small" variant="text" @click="formDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
        <v-divider />

        <v-card-text style="max-height: 75vh;" class="pa-0">
          <v-form ref="formRef" @submit.prevent="submitForm">
            <div class="pa-5 d-flex flex-column gap-4">

              <!-- ── Datos personales ── -->
              <FormSeccion titulo="Datos personales">
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.nombre" label="Nombre(s) *" variant="outlined" density="comfortable" :rules="[required]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.apellidoPaterno" label="Apellido paterno *" variant="outlined" density="comfortable" :rules="[required]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.apellidoMaterno" label="Apellido materno" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.fechaNacimiento" label="Fecha de nacimiento *" type="date" variant="outlined" density="comfortable" :rules="[required]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select v-model="form.sexo" :items="opcionesSexo" label="Sexo *" variant="outlined" density="comfortable" :rules="[required]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select v-model="form.estadoCivil" :items="opcionesEstadoCivil" label="Estado civil" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.nacionalidad" label="Nacionalidad *" variant="outlined" density="comfortable" :rules="[required]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.telefono" label="Teléfono celular *" variant="outlined" density="comfortable" :rules="[required]" />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="form.email" label="Correo electrónico *" type="email" variant="outlined" density="comfortable" :rules="[required]" />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="form.domicilio" label="Domicilio (calle, número, colonia)" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.ciudad" label="Ciudad / Municipio" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.estadoResidencia" label="Estado" variant="outlined" density="comfortable" />
                  </v-col>
                </v-row>
              </FormSeccion>

              <!-- ── Datos fiscales ── -->
              <FormSeccion titulo="Datos fiscales y seguridad social">
                <v-row dense>
                  <v-col cols="12" sm="4">
                    <v-text-field v-model="form.curp" label="CURP *" variant="outlined" density="comfortable" maxlength="18" :rules="[required]" />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-text-field v-model="form.rfc" label="RFC *" variant="outlined" density="comfortable" maxlength="13" :rules="[required]" />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-text-field v-model="form.nss" label="NSS (IMSS)" variant="outlined" density="comfortable" maxlength="11" />
                  </v-col>
                  <v-col cols="12">
                    <v-select v-model="form.regimenFiscal" :items="opcionesRegimenFiscal" label="Régimen fiscal" variant="outlined" density="comfortable" />
                  </v-col>
                </v-row>
              </FormSeccion>

              <!-- ── Datos laborales ── -->
              <FormSeccion titulo="Datos laborales">
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-combobox
                      v-model="form.puesto"
                      :items="store.puestos.filter(p => p.activo).map(p => p.nombre)"
                      label="Puesto / Cargo *"
                      variant="outlined"
                      density="comfortable"
                      :rules="[required]"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-combobox
                      v-model="form.departamento"
                      :items="store.departamentos.filter(d => d.activo).map(d => d.nombre)"
                      label="Departamento / Área *"
                      variant="outlined"
                      density="comfortable"
                      :rules="[required]"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.fechaIngreso" label="Fecha de ingreso *" type="date" variant="outlined" density="comfortable" :rules="[required]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select v-model="form.tipoContrato" :items="opcionesTipoContrato" label="Tipo de contrato" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select v-model="form.jornadaLaboral" :items="opcionesJornada" label="Jornada laboral" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model.number="form.salarioDiario" label="Salario diario *" type="number" prefix="$" variant="outlined" density="comfortable" :rules="[required]" />
                  </v-col>
                </v-row>
              </FormSeccion>

              <!-- ── Datos bancarios ── -->
              <FormSeccion titulo="Datos bancarios" subtitulo="Para nómina">
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-select v-model="form.banco" :items="opcionesBancos" label="Banco *" variant="outlined" density="comfortable" :rules="[required]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.numeroCuenta" label="Número de cuenta" variant="outlined" density="comfortable" maxlength="20" />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="form.clabe" label="CLABE interbancaria *" variant="outlined" density="comfortable" maxlength="18" :rules="[required, clabeLen]" />
                  </v-col>
                </v-row>
              </FormSeccion>

              <!-- ── Escolaridad ── -->
              <FormSeccion titulo="Escolaridad y observaciones">
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-select v-model="form.nivelEstudios" :items="opcionesNivelEstudios" label="Último nivel de estudios" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.carrera" label="Carrera / Especialidad" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea v-model="form.observaciones" label="Observaciones" variant="outlined" density="comfortable" rows="3" auto-grow />
                  </v-col>
                </v-row>
              </FormSeccion>

              <!-- ── Acceso al sistema (solo creación) ── -->
              <template v-if="!editTarget">
                <FormSeccion titulo="Acceso al sistema">
                  <v-row dense>
                    <v-col cols="12">
                      <v-text-field
                        v-model="form.username"
                        :hint="usernameEditado ? 'Editado manualmente' : 'Generado automáticamente'"
                        label="Username *"
                        persistent-hint
                        variant="outlined"
                        density="comfortable"
                        :rules="[required]"
                        @input="usernameEditado = true"
                      >
                        <template #append-inner>
                          <v-chip v-if="!usernameEditado" color="primary" density="compact" size="x-small" variant="tonal">auto</v-chip>
                          <v-tooltip v-else text="Restaurar automático">
                            <template #activator="{ props }">
                              <v-icon v-bind="props" color="medium-emphasis" size="small" style="cursor:pointer"
                                @click="usernameEditado = false; form.username = generarUsername(form.nombre, form.apellidoPaterno, form.apellidoMaterno)">
                                mdi-refresh
                              </v-icon>
                            </template>
                          </v-tooltip>
                        </template>
                      </v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field v-model="form.password" label="Contraseña *" type="password" variant="outlined" density="comfortable" :rules="[required, minLen]" />
                    </v-col>
                  </v-row>
                </FormSeccion>
              </template>

              <v-alert v-if="formError" :text="formError" color="error" density="compact" type="error" variant="tonal" />
            </div>
          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="formDialog = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" variant="tonal" @click="submitForm">
            {{ editTarget ? 'Guardar cambios' : 'Crear empleado' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" location="bottom end" :timeout="3000">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { computed, reactive, ref, watch, onMounted } from 'vue'
  import { useRHStore } from '@/stores/rh'
  import FormSeccion from '@/components/rh/FormSeccion.vue'
  import RHAsistencia from '@/components/rh/RHAsistencia.vue'
  import RHOrganigrama from '@/components/rh/RHOrganigrama.vue'
  import RHTurnos from '@/components/rh/RHTurnos.vue'
  import RHCatalogos from '@/components/rh/RHCatalogos.vue'

  const store = useRHStore()
  const tab   = ref('personal')

  // ── Catálogos ──────────────────────────────────────────────────────
  const opcionesSexo            = ['Masculino', 'Femenino', 'Otro']
  const opcionesEstadoCivil     = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre']
  const opcionesRegimenFiscal   = ['Sueldos y salarios', 'Honorarios', 'Actividad empresarial', 'Incorporación fiscal', 'Otro']
  const opcionesTipoContrato    = ['Indefinido', 'Determinado', 'Por obra', 'Honorarios', 'Prácticas']
  const opcionesJornada         = ['Completa', 'Medio tiempo', 'Por horas', 'Nocturna', 'Mixta']
  const opcionesNivelEstudios   = ['Primaria', 'Secundaria', 'Preparatoria/Bachillerato', 'Técnico', 'Licenciatura', 'Especialidad', 'Maestría', 'Doctorado']
  const opcionesBancos          = ['BBVA', 'Banamex', 'Santander', 'Banorte', 'HSBC', 'Scotiabank', 'Inbursa', 'Afirme', 'BanBajío', 'Otro']

  // ── Filtros ────────────────────────────────────────────────────────
  const search       = ref('')
  const filtroRol    = ref(null)
  const filtroActivo = ref(null)

  let debounce = null
  function debouncedFetch () { clearTimeout(debounce); debounce = setTimeout(fetchPersonal, 350) }
  async function fetchPersonal () { await store.fetchPersonal(search.value || '') }

  const personalFiltrado = computed(() => {
    let list = store.personal
    if (filtroRol.value != null) list = list.filter(e => e.rol === filtroRol.value)
    if (filtroActivo.value != null) list = list.filter(e => Boolean(e.activo) === filtroActivo.value)
    return list
  })

  // ── Tabla ──────────────────────────────────────────────────────────
  const headers = [
    { title: 'Empleado',   key: 'nombreCompleto', sortable: true },
    { title: 'Puesto',     key: 'puesto',         sortable: false },
    { title: 'Email',      key: 'email',          sortable: false },
    { title: 'Rol',        key: 'rol',            sortable: true, align: 'center' },
    { title: 'Estado',     key: 'activo',         sortable: true, align: 'center' },
    { title: 'F. Ingreso', key: 'fechaIngreso',   sortable: true },
    { title: '',           key: 'acciones',       sortable: false, align: 'end' },
  ]

  // ── Detalle ────────────────────────────────────────────────────────
  const detalleDialog   = ref(false)
  const detalleEmpleado = ref(null)

  const seccionesDetalle = computed(() => {
    if (!detalleEmpleado.value) return []
    return [
      {
        titulo: 'Datos personales',
        campos: [
          { label: 'Email',            key: 'email',           cols: 12 },
          { label: 'Teléfono',         key: 'telefono' },
          { label: 'Fecha nacimiento', key: 'fechaNacimiento', format: formatDate },
          { label: 'Sexo',             key: 'sexo' },
          { label: 'Estado civil',     key: 'estadoCivil' },
          { label: 'Nacionalidad',     key: 'nacionalidad' },
          { label: 'Domicilio',        key: 'domicilio',       cols: 12 },
          { label: 'Ciudad',           key: 'ciudad' },
          { label: 'Estado',           key: 'estadoResidencia' },
        ],
      },
      {
        titulo: 'Fiscal y seguridad social',
        campos: [
          { label: 'CURP',           key: 'curp' },
          { label: 'RFC',            key: 'rfc' },
          { label: 'NSS (IMSS)',     key: 'nss' },
          { label: 'Régimen fiscal', key: 'regimenFiscal', cols: 12 },
        ],
      },
      {
        titulo: 'Datos laborales',
        campos: [
          { label: 'Puesto',          key: 'puesto' },
          { label: 'Departamento',    key: 'departamento' },
          { label: 'Fecha ingreso',   key: 'fechaIngreso',   format: formatDate },
          { label: 'Tipo contrato',   key: 'tipoContrato' },
          { label: 'Jornada',         key: 'jornadaLaboral' },
          { label: 'Salario diario',   key: 'salarioDiario', format: formatMXN },
        ],
      },
      {
        titulo: 'Datos bancarios',
        campos: [
          { label: 'Banco',   key: 'banco' },
          { label: 'Cuenta',  key: 'numeroCuenta' },
          { label: 'CLABE',   key: 'clabe', cols: 12 },
        ],
      },
      {
        titulo: 'Escolaridad',
        campos: [
          { label: 'Nivel de estudios', key: 'nivelEstudios' },
          { label: 'Carrera',           key: 'carrera' },
          { label: 'Observaciones',     key: 'observaciones', cols: 12 },
        ],
      },
    ]
  })

  function openDetalle (item) { detalleEmpleado.value = item; detalleDialog.value = true }

  // ── Formulario ────────────────────────────────────────────────────
  const formDialog      = ref(false)
  const formRef         = ref(null)
  const editTarget      = ref(null)
  const saving          = ref(false)
  const formError       = ref('')
  const usernameEditado = ref(false)
  const ocrLoading      = ref(false)
  const pdfInput        = ref(null)

  const FORM_DEFAULTS = {
    nombre: '', apellidoPaterno: '', apellidoMaterno: '',
    email: '', username: '', password: '',
    fechaNacimiento: '', sexo: null, estadoCivil: null, nacionalidad: 'Mexicana',
    telefono: '', domicilio: '', ciudad: '', estadoResidencia: '',
    curp: '', rfc: '', nss: '', regimenFiscal: null,
    puesto: '', departamento: '', fechaIngreso: '', tipoContrato: null,
    jornadaLaboral: null, salarioDiario: null,
    banco: null, numeroCuenta: '', clabe: '',
    nivelEstudios: null, carrera: '', observaciones: '',
  }
  const form = reactive({ ...FORM_DEFAULTS })

  function normalizarStr (s) {
    return (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toLowerCase()
  }
  function generarUsername (nombre, ap, am) {
    const n = normalizarStr(nombre); const a = normalizarStr(ap); const m = normalizarStr(am)
    if (!n || !a) return ''
    return n[0] + a + (m ? m[0] : '') + n[n.length - 1]
  }

  watch(() => [form.nombre, form.apellidoPaterno, form.apellidoMaterno], ([n, ap, am]) => {
    if (!editTarget.value && !usernameEditado.value) form.username = generarUsername(n, ap, am)
  })

  function toDateInput (d) {
    if (!d) return ''
    return new Date(d).toISOString().split('T')[0]
  }

  function openCreate () {
    editTarget.value = null; usernameEditado.value = false; formError.value = ''
    Object.assign(form, { ...FORM_DEFAULTS })
    formDialog.value = true
  }

  function openEdit (item) {
    editTarget.value = item; usernameEditado.value = false; formError.value = ''
    Object.assign(form, {
      nombre: item.nombre, apellidoPaterno: item.apellidoPaterno,
      apellidoMaterno: item.apellidoMaterno ?? '',
      email: item.email,
      fechaNacimiento: toDateInput(item.fechaNacimiento),
      sexo: item.sexo ?? null, estadoCivil: item.estadoCivil ?? null,
      nacionalidad: item.nacionalidad ?? 'Mexicana', telefono: item.telefono ?? '',
      domicilio: item.domicilio ?? '', ciudad: item.ciudad ?? '',
      estadoResidencia: item.estadoResidencia ?? '',
      curp: item.curp ?? '', rfc: item.rfc ?? '', nss: item.nss ?? '',
      regimenFiscal: item.regimenFiscal ?? null,
      puesto: item.puesto ?? '', departamento: item.departamento ?? '',
      fechaIngreso: toDateInput(item.fechaIngreso),
      tipoContrato: item.tipoContrato ?? null, jornadaLaboral: item.jornadaLaboral ?? null,
      salarioDiario: item.salarioDiario ?? null,
      banco: item.banco ?? null, numeroCuenta: item.numeroCuenta ?? '', clabe: item.clabe ?? '',
      nivelEstudios: item.nivelEstudios ?? null, carrera: item.carrera ?? '',
      observaciones: item.observaciones ?? '',
    })
    formDialog.value = true
  }

  async function handleOcrFile (e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''  // reset para poder re-subir el mismo archivo

    ocrLoading.value = true
    try {
      const datos = await store.uploadOcr(file)
      let rellenos = 0
      for (const [key, val] of Object.entries(datos)) {
        if (val !== null && (form[key] == null || form[key] === '')) {
          form[key] = val
          rellenos++
        }
      }
      showSnack(
        rellenos > 0
          ? `Se pre-llenaron ${rellenos} campos. Revisa y completa los faltantes.`
          : 'No se encontraron datos estructurados en el PDF (¿es un documento escaneado?).',
        rellenos > 0 ? 'info' : 'warning'
      )
    } catch {
      showSnack('Error al procesar el PDF.', 'error')
    } finally {
      ocrLoading.value = false
    }
  }

  async function submitForm () {
    const { valid } = await formRef.value.validate()
    if (!valid) return
    saving.value = true; formError.value = ''
    try {
      const payload = { ...form }
      if (editTarget.value) {
        await store.updateEmpleado(editTarget.value.username, payload)
        showSnack('Empleado actualizado correctamente', 'success')
      } else {
        await store.createEmpleado(payload)
        showSnack('Empleado creado correctamente', 'success')
      }
      formDialog.value = false
      await fetchPersonal()
    } catch (err) {
      formError.value = err.response?.data?.message || 'Error al guardar'
    } finally {
      saving.value = false
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────
  const required  = v => !!v || 'Campo requerido'
  const minLen    = v => (v && v.length >= 6) || 'Mínimo 6 caracteres'
  const clabeLen  = v => (!v || v.length === 18) || 'La CLABE debe tener 18 dígitos'

  function iniciales (item) { return `${item.nombre?.[0] ?? ''}${item.apellidoPaterno?.[0] ?? ''}`.toUpperCase() }
  function rolColor  (rol)  { return { ADMIN: 'primary', RH: 'info', EMPLEADO: 'secondary' }[rol] ?? 'secondary' }
  function formatMXN (n)    { return n ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n)) : '—' }
  function formatDate (d)   { return d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—' }

  const snack = reactive({ show: false, text: '', color: 'success' })
  function showSnack (text, color = 'success') { Object.assign(snack, { show: true, text, color }) }

  onMounted(async () => {
    await Promise.all([fetchPersonal(), store.fetchDepartamentos(), store.fetchPuestos()])
  })
</script>
