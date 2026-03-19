<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="4" sm="8">
        <v-card rounded="md" style="background-color: #424242;">
          <v-card-text class="d-flex flex-column align-center pa-6">
            <v-icon size="x-large">mdi-account-circle</v-icon>
            <h1 class="display-1 text-center mt-2">Bienvenido</h1>
            <p class="subtitle-1 mb-4">Por favor inicia sesión para continuar.</p>
            <v-form ref="form" class="w-75 my-2 d-flex flex-column align-center">
              <v-text-field
                v-model="usuario"
                class="w-75 my-2"
                density="compact"
                label="Usuario"
                :rules="usuarioRules"
                type="text"
                variant="outlined"
              />
              <v-text-field
                v-model="password"
                class="w-75 my-1"
                density="compact"
                label="Contraseña"
                :rules="passwordRules"
                type="password"
                variant="outlined"
              />
              <v-alert
                v-if="errorMsg"
                class="w-75 mt-2"
                density="compact"
                type="error"
                variant="tonal"
              >
                {{ errorMsg }}
              </v-alert>
            </v-form>
            <v-btn
              class="mt-2 w-50"
              color="primary"
              :loading="loading"
              @click="login"
            >
              Iniciar Sesión
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const router = useRouter()

  const form = ref(null)
  const password = ref('')
  const usuario = ref('')
  const loading = ref(false)
  const errorMsg = ref('')

  const usuarioRules = [
    v => !!v || 'El usuario es requerido.',
  ]
  const passwordRules = [
    v => !!v || 'La contraseña es requerida.',
  ]

  async function login () {
    errorMsg.value = ''
    const { valid } = await form.value.validate()
    if (!valid) return

    loading.value = true
    try {
      await authStore.login(usuario.value, password.value)
      router.push('/home')
    } catch (error) {
      errorMsg.value = error.message || 'Credenciales incorrectas.'
    } finally {
      loading.value = false
    }
  }
</script>
