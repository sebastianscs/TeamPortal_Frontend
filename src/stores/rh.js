import { defineStore } from 'pinia'
import api from '@/api'

export const useRHStore = defineStore('rh', {
  state: () => ({
    personal: [],
    loading:  false,
    error:    null,
    departamentos: [],
    puestos: [],
  }),

  actions: {
    async fetchPersonal (search = '') {
      this.loading = true
      this.error   = null
      try {
        const params = search ? { search } : {}
        const res    = await api.get('/rh/personal', { params })
        this.personal = res.data.data ?? []
        return this.personal
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar personal'
        return []
      } finally {
        this.loading = false
      }
    },

    async getEmpleado (username) {
      const res = await api.get(`/rh/personal/${username}`)
      return res.data.data
    },

    async createEmpleado (data) {
      const res = await api.post('/rh/personal', data)
      return res.data
    },

    async updateEmpleado (username, data) {
      const res = await api.put(`/rh/personal/${username}`, data)
      return res.data
    },

    async getAsistenciaPeriodo (periodoId) {
      const res = await api.get(`/rh/asistencia/periodo/${periodoId}`)
      return res.data.data
    },

    async registrarAsistencias (registros) {
      const res = await api.post('/rh/asistencia/registrar', { registros })
      return res.data
    },

    async fetchOrganigrama () {
      const res = await api.get('/rh/organigrama')
      return res.data.data
    },

    async asignarLider (username, liderUsername) {
      const res = await api.put(`/rh/personal/${username}/lider`, { liderUsername })
      return res.data
    },

    async uploadOcr (file) {
      const formData = new FormData()
      formData.append('pdf', file)
      const res = await api.post('/rh/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.data
    },

    // ── Turnos ────────────────────────────────────────────────────────────────
    async fetchTurnos () {
      const res = await api.get('/rh/turnos')
      return res.data.data
    },

    async createTurno (data) {
      const res = await api.post('/rh/turnos', data)
      return res.data
    },

    async updateTurno (id, data) {
      const res = await api.put(`/rh/turnos/${id}`, data)
      return res.data
    },

    async getTurnoEmpleado (username) {
      const res = await api.get(`/rh/personal/${username}/turno`)
      return res.data.data
    },

    async asignarTurno (username, data) {
      const res = await api.put(`/rh/personal/${username}/turno`, data)
      return res.data
    },

    async fetchDepartamentos () {
      const res = await api.get('/rh/catalogos/departamentos')
      this.departamentos = res.data.data ?? []
      return this.departamentos
    },
    async createDepartamento (data) {
      const res = await api.post('/rh/catalogos/departamentos', data)
      return res.data
    },
    async updateDepartamento (id, data) {
      const res = await api.put(`/rh/catalogos/departamentos/${id}`, data)
      return res.data
    },
    async fetchPuestos () {
      const res = await api.get('/rh/catalogos/puestos')
      this.puestos = res.data.data ?? []
      return this.puestos
    },
    async createPuesto (data) {
      const res = await api.post('/rh/catalogos/puestos', data)
      return res.data
    },
    async updatePuesto (id, data) {
      const res = await api.put(`/rh/catalogos/puestos/${id}`, data)
      return res.data
    },

    // Expediente
    async getDocumentos (username) {
      const res = await api.get(`/expediente/${username}`)
      return res.data.data
    },
    async uploadDocumento (username, formData) {
      const res = await api.post(`/expediente/${username}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    async deleteDocumento (id) {
      const res = await api.delete(`/expediente/${id}`)
      return res.data
    },

    // Vacaciones
    async getVacacionesDisponibles (username) {
      const res = await api.get(`/vacaciones/disponibles/${username}`)
      return res.data.data
    },
    async getSolicitudesVacaciones (params = {}) {
      const res = await api.get('/vacaciones/solicitudes', { params })
      return res.data.data
    },
    async createSolicitudVacaciones (data) {
      const res = await api.post('/vacaciones/solicitudes', data)
      return res.data
    },
    async resolverVacaciones (id, data) {
      const res = await api.patch(`/vacaciones/solicitudes/${id}`, data)
      return res.data
    },

    // Onboarding
    async getPlantillaOnboarding () {
      const res = await api.get('/onboarding/plantilla')
      return res.data.data
    },
    async createTareaOnboarding (data) {
      const res = await api.post('/onboarding/plantilla', data)
      return res.data
    },
    async updateTareaOnboarding (id, data) {
      const res = await api.put(`/onboarding/plantilla/${id}`, data)
      return res.data
    },
    async getTareasEmpleado (username) {
      const res = await api.get(`/onboarding/${username}`)
      return res.data.data
    },
    async asignarOnboarding (username) {
      const res = await api.post(`/onboarding/${username}/asignar`)
      return res.data
    },
    async completarTareaOnboarding (username, tareaId, completada) {
      const res = await api.patch(`/onboarding/${username}/${tareaId}`, { completada })
      return res.data
    },

    // Rotación
    async registrarBaja (data) {
      const res = await api.post('/rh/bajas', data)
      return res.data
    },
    async getBajas (params = {}) {
      const res = await api.get('/rh/bajas', { params })
      return res.data.data
    },
    async getRotacionStats () {
      const res = await api.get('/rh/rotacion/stats')
      return res.data.data
    },
  },
})
