import { defineStore } from 'pinia'
import api from '@/api'
import router from '@/router'

let _warningTimer = null
let _expireTimer = null

function parseUser () {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return localStorage.getItem('user')
  }
}

function clearTimers () {
  clearTimeout(_warningTimer)
  clearTimeout(_expireTimer)
  _warningTimer = null
  _expireTimer = null
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: parseUser() || null,
    token: localStorage.getItem('token') || null,
    email: localStorage.getItem('email') || null,
    avatar: localStorage.getItem('avatar') || null,
    rol: localStorage.getItem('rol') || 'EMPLEADO',
    modulos: JSON.parse(localStorage.getItem('modulos') || '[]'),
    sessionWarning: false,
  }),

  getters: {
    isLoggedIn: state => !!state.token,
  },

  actions: {
    async login (usuario, passwordd) {
      const payload = { username: usuario, password: passwordd }
      const response = await api.post('/users/login', payload)

      if (response.data.status === 'ERROR') {
        throw new Error(response.data.message)
      }
      const data = response.data.data
      this.token = data.token
      this.user = data.username || null
      this.email = data.email || null
      this.avatar = data.avatar || null
      this.name = data.name || null
      this.motivation = data.motivationalMessage || null
      this.rol = data.rol || 'EMPLEADO'
      localStorage.setItem('token', this.token)
      if (this.user) {
        localStorage.setItem('user', JSON.stringify(this.user))
      }
      if (this.email) {
        localStorage.setItem('email', this.email)
      }
      if (this.avatar) {
        localStorage.setItem('avatar', this.avatar)
      }
      if (this.name) {
        localStorage.setItem('name', this.name)
      }
      if (this.motivation) {
        localStorage.setItem('motivation', this.motivation)
      }
      localStorage.setItem('rol', this.rol)
      await this.fetchModulos()
      this.setupSessionTimers()
      router.push('/home')
    },

    logout () {
      clearTimers()
      this.sessionWarning = false
      this.token = null
      this.user = null
      this.email = null
      this.avatar = null
      this.rol = 'EMPLEADO'
      this.modulos = []
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('email')
      localStorage.removeItem('avatar')
      localStorage.removeItem('motivation')
      localStorage.removeItem('rol')
      localStorage.removeItem('modulos')
      router.push('/login')
    },

    async refreshSession () {
      try {
        // El interceptor de request agrega el token actual en Authorization
        const response = await api.post('/users/login')

        if (response.data.status === 'ERROR') {
          throw new Error(response.data.message)
        }

        const data = response.data.data
        this.token = data.token
        localStorage.setItem('token', this.token)
        this.sessionWarning = false
        this.setupSessionTimers()
      } catch {
        this.logout()
      }
    },

    async fetchModulos () {
      try {
        const res = await api.get('/users/mis-modulos')
        this.modulos = res.data.data ?? []
        localStorage.setItem('modulos', JSON.stringify(this.modulos))
      } catch {
        // mantener los módulos existentes
      }
    },

    setupSessionTimers () {
      clearTimers()
      if (!this.token) {
        return
      }

      try {
        const { exp } = JSON.parse(atob(this.token.split('.')[1]))
        const expiresIn = exp * 1000 - Date.now()

        if (expiresIn <= 0) {
          this.logout()
          return
        }

        const WARNING_MS = 5 * 60 * 1000 // avisar 5 minutos antes

        if (expiresIn > WARNING_MS) {
          _warningTimer = setTimeout(() => {
            this.sessionWarning = true
          }, expiresIn - WARNING_MS)
        } else {
          this.sessionWarning = true
        }

        _expireTimer = setTimeout(() => {
          this.logout()
        }, expiresIn)
      } catch {
        // Token no es JWT válido, no se configuran timers
      }
    },
  },
})
