/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

const TABLE_DEFAULTS = {
  itemsPerPageText: 'Registros por página',
  itemsPerPageOptions: [
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
    { value: 100, title: '100' },
    { value: -1, title: 'Todos' },
  ],
}

export default createVuetify({
  defaults: {
    VDataTable: TABLE_DEFAULTS,
    VDataTableServer: TABLE_DEFAULTS,
    VDataTableVirtual: TABLE_DEFAULTS,
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          'primary': '#8DC63F',
          'secondary': '#B5CA72',
          'background': '#111111',
          'surface': '#1E1E1E',
          'surface-variant': '#2C2C2C',
          'on-background': '#F0F0F0',
          'on-surface': '#F0F0F0',
          'on-surface-variant': '#F0F0F0',
          'error': '#F28B82',
          'info': '#7ECEE8',
          'success': '#81C784',
          'warning': '#FFD54F',
        },
      },
      light: {
        dark: false,
        colors: {
          'primary': '#5A8A1A',
          'secondary': '#7BAA35',
          'background': '#F5F5F5',
          'surface': '#FFFFFF',
          'surface-variant': '#EEEEEE',
          'on-background': '#1A1A1A',
          'on-surface': '#1A1A1A',
          'on-surface-variant': '#1A1A1A',
          'error': '#C62828',
          'info': '#0277BD',
          'success': '#2E7D32',
          'warning': '#E65100',
        },
      },
    },
  },
})
