/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const PUBLIC_ROUTES = new Set(['/login'])

function isTokenExpired (token) {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}

function clearSession () {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('email')
  localStorage.removeItem('avatar')
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})

router.beforeEach(to => {
  const token = localStorage.getItem('token')
  const isPublic = PUBLIC_ROUTES.has(to.path)

  if (!token && !isPublic) {
    return '/login'
  }

  if (token && isTokenExpired(token)) {
    clearSession()
    if (!isPublic) {
      return '/login'
    }
  }

  if (token && to.path === '/login') {
    return '/home'
  }

  // Guard de módulos: verificar acceso según permisos del perfil
  if (token && !isPublic && to.path !== '/home') {
    const modulos = JSON.parse(localStorage.getItem('modulos') || '[]')
    const rutas = modulos.map(m => m.ruta)
    // Solo bloquear si la ruta no está en los módulos permitidos
    if (rutas.length > 0 && !rutas.some(r => to.path === r || to.path.startsWith(r + '/'))) {
      return '/home'
    }
  }
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
