import { defineStore } from 'pinia'
import api from '@/api'

export const useLiderStore = defineStore('lider', {
  state: () => ({
    equipo:      [],
    asistencia:  [],
    incidencias: [],
    loading:     false,
  }),

  actions: {
    async fetchEquipo () {
      const res = await api.get('/lider/equipo')
      this.equipo = res.data.data ?? []
    },

    async fetchAsistencia (fecha) {
      this.loading = true
      try {
        const res = await api.get('/lider/asistencia', { params: { fecha } })
        this.asistencia = res.data.data ?? []
      } finally {
        this.loading = false
      }
    },

    async fetchIncidencias (estatus = 'PENDIENTE') {
      const res = await api.get('/lider/incidencias', { params: { estatus } })
      this.incidencias = res.data.data ?? []
    },

    async resolverIncidencia (id, estatus, motivoRechazo = '') {
      const res = await api.put(`/lider/incidencias/${id}`, { estatus, motivoRechazo })
      return res.data
    },

    async confirmarAsistencia (data) {
      const res = await api.post('/lider/asistencia/confirmar', data)
      return res.data
    },
  },
})
