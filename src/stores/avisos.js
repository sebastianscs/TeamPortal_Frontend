import { defineStore } from 'pinia'
import api from '@/api'

export const useAvisosStore = defineStore('avisos', {
  state: () => ({
    avisos:    [],
    historico: [],
    loading:   false,
  }),
  actions: {
    async fetchAvisos () {
      const res = await api.get('/avisos')
      this.avisos = res.data.data ?? []
    },
    async fetchHistorico () {
      this.loading = true
      try {
        const res = await api.get('/avisos/historico')
        this.historico = res.data.data ?? []
      } finally {
        this.loading = false
      }
    },
    async createAviso (data) {
      const res = await api.post('/avisos', data)
      return res.data
    },
    async updateAviso (id, data) {
      const res = await api.put(`/avisos/${id}`, data)
      return res.data
    },
  },
})
