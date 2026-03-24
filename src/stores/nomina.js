import { defineStore } from 'pinia'
import api from '@/api'

export const useNominaStore = defineStore('nomina', {
  state: () => ({
    periodos: [],
    nominasEmpleado: [],
    salarios: [],
    conceptos: [],
    prestamos: [],
    tablaISR:  [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchMisNominas () {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/nomina/mis-nominas')
        this.nominasEmpleado = res.data.data ?? res.data ?? []
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar nóminas'
      } finally {
        this.loading = false
      }
    },

    async fetchPeriodos () {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/nomina/periodos')
        this.periodos = res.data.data ?? res.data ?? []
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar periodos'
      } finally {
        this.loading = false
      }
    },

    async fetchSalarios () {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/nomina/salarios')
        this.salarios = res.data.data ?? res.data ?? []
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar salarios'
      } finally {
        this.loading = false
      }
    },

    async fetchConceptos () {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/nomina/conceptos')
        this.conceptos = res.data.data ?? res.data ?? []
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar conceptos'
      } finally {
        this.loading = false
      }
    },

    async getNominaById (id) {
      const res = await api.get(`/nomina/nominas/${id}`)
      return res.data.data ?? res.data
    },

    async crearPeriodo (data) {
      const res = await api.post('/nomina/periodos', data)
      return res.data.data ?? res.data
    },

    async upsertSalario (data) {
      const res = await api.post('/nomina/salarios', data)
      return res.data.data ?? res.data
    },

    async generarNomina (periodoId) {
      const res = await api.post(`/nomina/periodos/${periodoId}/generar`)
      return res.data.data ?? res.data
    },

    async updateEstadoNomina (id, estado, observaciones) {
      const res = await api.patch(`/nomina/nominas/${id}/estado`, { estado, observaciones })
      return res.data.data ?? res.data
    },

    async aprobarTodas (periodoId) {
      const res = await api.patch(`/nomina/periodos/${periodoId}/aprobar-todas`)
      return res.data.data ?? res.data
    },

    async updateEstadoPeriodo (id, estado) {
      const res = await api.patch(`/nomina/periodos/${id}/estado`, { estado })
      return res.data.data ?? res.data
    },

    async updateConcepto (id, data) {
      const res = await api.patch(`/nomina/conceptos/${id}`, data)
      return res.data.data ?? res.data
    },

    async getAjustes (periodoId) {
      const res = await api.get(`/nomina/periodos/${periodoId}/ajustes`)
      return res.data.data ?? []
    },

    async upsertAjuste (periodoId, usuarioId, data) {
      const res = await api.put(`/nomina/periodos/${periodoId}/ajustes/${usuarioId}`, data)
      return res.data.data ?? res.data
    },

    async descargarRecibo (nominaId) {
      const res = await api.get(`/nomina/nominas/${nominaId}/recibo`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `recibo-nomina-${nominaId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    },

    async fetchPrestamos () {
      const res = await api.get('/nomina/prestamos')
      this.prestamos = res.data.data ?? []
    },
    async createPrestamo (data) {
      const res = await api.post('/nomina/prestamos', data)
      return res.data
    },
    async updatePrestamo (id, data) {
      const res = await api.put(`/nomina/prestamos/${id}`, data)
      return res.data
    },
    async fetchTablaISR () {
      const res = await api.get('/nomina/config/isr')
      this.tablaISR = res.data.data ?? []
    },
    async upsertTablaISR (data) {
      const res = await api.post('/nomina/config/isr', data)
      return res.data
    },
    async exportarExcel (periodoId, nombre) {
      const res = await api.get(`/nomina/periodos/${periodoId}/exportar`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `nomina-${nombre}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    },
    async getSalarioHistorial (username) {
      const res = await api.get(`/nomina/salarios/${username}`)
      return res.data.data ?? []
    },
  },
})
