/**
 * Normaliza un string eliminando acentos y pasando a minúsculas.
 */
function normalize (str) {
  return String(str ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Filtro personalizado para v-autocomplete / v-combobox de Vuetify.
 * - Sin acentos: "garcia" encuentra "García"
 * - Orden de palabras libre: "flores roberto" encuentra "Roberto Flores Jiménez"
 *
 * Uso: :custom-filter="searchFilter"
 */
export function searchFilter (value, query) {
  if (!query) return true
  const haystack = normalize(value)
  const words    = normalize(query).split(/\s+/).filter(Boolean)
  return words.every(w => haystack.includes(w))
}
