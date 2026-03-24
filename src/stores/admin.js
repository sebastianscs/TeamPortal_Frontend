import { defineStore } from 'pinia'
import api from '@/api'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    audit: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchUsers (filters = {}) {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/admin/users', { params: filters })
        this.users = res.data.data ?? []
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar usuarios'
      } finally {
        this.loading = false
      }
    },

    async createUser (data) {
      const res = await api.post('/admin/users', data)
      return res.data
    },

    async updateUser (id, data) {
      const res = await api.put(`/admin/users/${id}`, data)
      return res.data
    },

    async toggleStatus (id, activo) {
      const res = await api.patch(`/admin/users/${id}/status`, { activo })
      return res.data
    },

    async changePassword (id, password) {
      const res = await api.patch(`/admin/users/${id}/password`, { password })
      return res.data
    },

    async changeRol (id, rol) {
      const res = await api.patch(`/admin/users/${id}/rol`, { rol })
      return res.data
    },

    async fetchModulos () {
      const res = await api.get('/admin/modulos')
      return res.data.data ?? []
    },

    async fetchPermisos () {
      const res = await api.get('/admin/permisos')
      return res.data.data ?? {}
    },

    async updatePermisos (rol, modulos) {
      const res = await api.put(`/admin/permisos/${rol}`, { modulos })
      return res.data
    },

    async fetchAudit (filters = {}) {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('/admin/audit', { params: filters })
        this.audit = res.data.data ?? []
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar auditoría'
      } finally {
        this.loading = false
      }
    },

    async fetchStats () {
      const res = await api.get('/admin/stats')
      return res.data.data
    },

    async resetPassword (id) {
      const res = await api.post(`/admin/users/${id}/reset-password`)
      return res.data
    },

    async fetchSesiones (id) {
      const res = await api.get(`/admin/users/${id}/sesiones`)
      return res.data.data
    },

    async importUsers (file) {
      const formData = new FormData()
      formData.append('excel', file)
      const res = await api.post('/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.data  // { creados: N, errores: [...] }
    },
  },
})
