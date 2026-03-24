import { defineStore } from 'pinia'
import api from '@/api'

export const useChecadorStore = defineStore('checador', {
  state: () => ({
    checadores: [],
    mapeo: [],
    syncLog: [],
    pendientes: [],
    asistenciaRH: [],
    loading: false,
  }),
  actions: {
    async fetchChecadores() {
      this.loading = true
      try { const r = await api.get('/checador'); this.checadores = r.data.data }
      finally { this.loading = false }
    },
    async createChecador(data) {
      const r = await api.post('/checador', data); await this.fetchChecadores(); return r.data
    },
    async updateChecador(id, data) {
      await api.put(`/checador/${id}`, data); await this.fetchChecadores()
    },
    async testConexion(id) {
      const r = await api.post(`/checador/${id}/test`); return r.data
    },
    async sincronizar(id) {
      const r = await api.post(`/checador/${id}/sincronizar`); return r.data
    },
    async fetchMapeo(id) {
      const r = await api.get(`/checador/${id}/mapeo`); this.mapeo = r.data.data
    },
    async saveMapeo(id, data) {
      await api.post(`/checador/${id}/mapeo`, data); await this.fetchMapeo(id)
    },
    async deleteMapeo(mapeoId, checadorId) {
      await api.delete(`/checador/mapeo/${mapeoId}`); await this.fetchMapeo(checadorId)
    },
    async fetchSyncLog(id) {
      const r = await api.get(`/checador/${id}/sync-log`); this.syncLog = r.data.data
    },
    async fetchPendientes(fecha) {
      const params = fecha ? { fecha } : {}
      const r = await api.get('/checador/pendientes', { params }); this.pendientes = r.data.data
    },
    async aprobarAsistencia(data) {
      await api.post('/checador/aprobar', data)
    },
    async fetchAsistenciaRH(params = {}) {
      this.loading = true
      try { const r = await api.get('/rh/asistencia', { params }); this.asistenciaRH = r.data.data }
      finally { this.loading = false }
    },
  },
})
