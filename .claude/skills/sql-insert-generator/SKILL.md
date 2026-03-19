---
name: sql-insert-generator
description: Genera scripts SQL de inserción (INSERT INTO) a partir de una definición de tabla y datos del usuario. Usa este skill siempre que el usuario proporcione una tabla SQL y quiera insertar un registro, especialmente para tablas de usuarios con lógica de username automático, hash de contraseña con bcrypt, y campos como fechaIngreso, fechaActualiza, usuarioActualiza. También aplica cuando el usuario diga "genera un insert", "script de inserción", "inserta este usuario", o proporcione un CREATE TABLE junto con datos.
---

# SQL Insert Generator

Genera scripts de inserción SQL limpios, comentados y listos para ejecutar, siguiendo las convenciones del proyecto.

---

## Convenciones del proyecto

### Username
La lógica estándar para generar el `username` es:
```
primera_letra_nombre + apellidoPaterno + primera_letra_apellidoMaterno + ultima_letra_nombre
```

**Ejemplo:**
- Nombre: `José Sebastián` → primera letra: `j`, última letra: `n`
- apellidoPaterno: `Soto` → `soto`
- apellidoMaterno: `Castillo` → primera letra: `c`
- **Username resultante:** `jsotocn`

**Reglas:**
- Todo en **minúsculas**
- Ignorar acentos y caracteres especiales (José → j, no j con acento)
- Si el nombre tiene dos palabras, tomar la primera letra del **primer nombre**
- La última letra también es del **primer nombre** (José → j...n, no Sebastián)
- Si hay colisión de username, agregar un número al final: `jsotocn2`

### Password
El campo `password` almacena un **hash bcrypt**, nunca texto plano.

- La contraseña base del proyecto es: `kuramaruto`
- Salt rounds: `10`
- Comando para generar el hash:
  ```javascript
  bcrypt.hash('kuramaruto', 10)
  ```
- El hash resultante tiene el formato: `$2b$10$...`

**En el script SQL**, incluir siempre:
1. El hash generado (o un placeholder claro si no se puede generar en el momento)
2. Un comentario indicando la contraseña original y el comando usado

### Campos de auditoría
| Campo             | Valor por defecto | Notas |
|-------------------|------------------|-------|
| `fechaIngreso`    | `GETDATE()`      | Fecha de creación del registro |
| `fechaActualiza`  | `NULL`           | Se actualiza cuando se modifica el registro |
| `usuarioActualiza`| `NULL` o ID      | ID del usuario que corre el script |
| `email`           | `username@example.com` | Email imaginario si es de prueba |

---

## Proceso de generación

### Paso 1 — Analizar la tabla
Leer el `CREATE TABLE` para identificar:
- Nombres exactos de columnas (respetar mayúsculas/minúsculas y corchetes `[dbo]`)
- Tipos de dato y restricciones (`NOT NULL`, `NULL`, `varchar`, etc.)
- Columnas con valor por defecto o que se pueden omitir

### Paso 2 — Procesar los datos del usuario
- Extraer nombre, apellidos y demás campos
- Aplicar la lógica de username automáticamente
- Si el usuario proporciona una contraseña diferente a la default, usar esa; si no, usar `kuramaruto`
- Completar campos faltantes con los valores por defecto del proyecto

### Paso 3 — Generar el script
Producir un `INSERT INTO` con:
- Nombres de columnas explícitos (nunca `INSERT INTO tabla VALUES (...)` sin columnas)
- Comentarios inline explicando campos calculados o especiales
- Sección de notas al final si hay algo que el usuario deba hacer manualmente (ej: generar el hash)

---

## Plantilla de output

```sql
-- =============================================
-- INSERT: [tabla] — [nombre completo del usuario]
-- Username: [username]
-- =============================================

INSERT INTO [dbo].[tabla] (
    [col1],
    [col2],
    -- ...
)
VALUES (
    'valor1',           -- descripción si aplica
    'valor2',
    -- ...
)
GO
```

---

## Manejo del hash bcrypt

Si el entorno **permite ejecutar Node.js**, generar el hash real y usarlo directamente.

Si **no hay acceso a Node.js**, incluir un placeholder y dar instrucciones claras:

```sql
    -- PENDIENTE: Reemplazar con el hash real antes de ejecutar
    -- Comando: node -e "const bcrypt = require('bcrypt'); bcrypt.hash('kuramaruto', 10).then(h => console.log(h));"
    '$2b$10$<REEMPLAZA_CON_HASH_BCRYPT>',
```

---

## Ejemplo completo

**Input del usuario:**
```
Tabla: dbo.usuarios
nombre: José Sebastián
apellidoPaterno: Soto
apellidoMaterno: Castillo
```

**Output esperado:**
```sql
-- =============================================
-- INSERT: usuarios — José Sebastián Soto Castillo
-- Username: jsotocn
-- =============================================

INSERT INTO [dbo].[usuarios] (
    [nombre],
    [apellidoPaterno],
    [apellidoMaterno],
    [username],
    [password],
    [fechaIngreso],
    [fechaActualiza],
    [usuarioActualiza],
    [email]
)
VALUES (
    'José Sebastián',
    'Soto',
    'Castillo',
    'jsotocn',              -- j(José) + soto + c(Castillo) + n(José)
    '$2b$10$<HASH>',        -- bcrypt.hash('kuramaruto', 10)
    GETDATE(),
    NULL,
    NULL,                   -- Reemplazar con ID del usuario ejecutor si aplica
    'jsoto@example.com'
)
GO
```

---

## Casos especiales

- **Nombre compuesto con dos apellidos maternos:** usar solo el primero
- **Nombre con una sola palabra:** primera y última letra son del mismo nombre
- **usuarioActualiza no es NULL:** el usuario indicará el ID; incluirlo como número entero sin comillas
- **Múltiples inserts:** generar uno por registro, separados por `GO`
- **Tabla diferente a usuarios:** aplicar la misma plantilla pero omitir la lógica de username/password si no aplica
