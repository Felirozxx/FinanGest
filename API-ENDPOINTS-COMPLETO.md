# FinanGest - Documentación Completa de API Endpoints

## Estado: En revisión
Fecha: 2026-02-01

---

## 1. /api/login
**Archivo**: `api/login.js`

### POST /api/login
- **Body**: `{ email, password }`
- **Respuesta**: `{ success, user, token }`

---

## 2. /api/users
**Archivo**: `api/users.js`

Revisando...

---

## 3. /api/carteras
**Archivo**: `api/carteras.js`

### GET /api/carteras?userId=X
- Obtener carteras de un usuario
- **Respuesta**: `{ success, carteras }`

### POST /api/carteras (sin action)
- Crear nueva cartera
- **Body**: `{ nombre, descripcion, color, userId, creadoPor }`
- **Respuesta**: `{ success, id, cartera }` o `{ needsPayment, paymentInfo }`

### POST /api/carteras?action=confirmar-pago&id=X
- Confirmar pago de cartera
- **Respuesta**: `{ success, message }`

---

## 4. /api/admin
**Archivo**: `api/admin.js`

### POST /api/admin/eliminar-datos-trabajador
- **Body**: `{ adminPassword, trabajadorId, adminId }`
- **Respuesta**: `{ success, deleted: { clientes, gastos, sesiones, backups, cuenta } }`

---

Continuando revisión de todos los endpoints...
