import { defineStore } from 'pinia'
import api from '@/api'

export const useRHStore = defineStore('rh', {
  state: () => ({
    personal: [],
    loading:  false,
    error:    null,
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
  },
})
