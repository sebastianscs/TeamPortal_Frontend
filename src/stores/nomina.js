import { defineStore } from 'pinia'
import api from '@/api'

export const useNominaStore = defineStore('nomina', {
  state: () => ({
    periodos: [],
    nominasEmpleado: [],
    salarios: [],
    conceptos: [],
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
  },
})
