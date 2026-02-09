# Endpoints Faltantes o que Necesitan Verificación

## ✅ FUNCIONANDO (Confirmados)
- `/api/login` - ✓ Existe en api/login.js
- `/api/users` - ✓ Existe en api/users.js
- `/api/carteras` - ✓ Existe en api/carteras.js
- `/api/clientes` - ✓ Existe en api/clientes.js
- `/api/gastos` - ✓ Existe en api/gastos.js
- `/api/admin/eliminar-datos-trabajador` - ✓ RECIÉN ARREGLADO

## ⚠️ NECESITAN VERIFICACIÓN (Probablemente en api/index.js)
- `/api/heartbeat` - Usado para mantener sesión activa
- `/api/server-time` - Obtener hora del servidor
- `/api/push-token` - Tokens de notificaciones push
- `/api/caja` - Gestión de caja diaria
- `/api/caja-inicial` - Caja inicial del día
- `/api/password-caja` - ✓ Existe en api/password-caja.js
- `/api/sessions/*` - Gestión de sesiones

## ❌ PROBABLEMENTE FALTAN (Funcionalidades de pago)
- `/api/crear-pago-pix` - Crear pago PIX
- `/api/verificar-pago` - Verificar estado de pago
- `/api/renovar-carteras` - Renovar carteras pagadas
- `/api/confirmar-pago-manual` - Confirmar pago manualmente

## 📧 AUTENTICACIÓN/RECUPERACIÓN
- `/api/forgot-password` - Recuperar contraseña
- `/api/reset-password` - Resetear contraseña
- `/api/send-code` - Enviar código de verificación
- `/api/verify-code` - Verificar código
- `/api/send-recovery-code` - Código de recuperación

## 🔧 ADMIN
- `/api/admin/backup` - Backup del sistema
- `/api/admin/backup-trabajador` - Backup de trabajador
- `/api/admin/system-stats` - Estadísticas del sistema
- `/api/admin/recuperar-cuenta` - Recuperar cuenta
- `/api/solicitar-acceso-admin` - Solicitar acceso admin
- `/api/pending-users` - Usuarios pendientes de aprobación

## 🗑️ LIMPIEZA
- `/api/reset-datos-usuario` - Resetear datos de usuario
- `/api/reset-todo` - Resetear todo el sistema
- `/api/limpiar-cajas-anteriores` - Limpiar cajas antiguas

---

## PRIORIDAD ALTA (Críticos para funcionamiento básico)
1. ✅ `/api/admin/eliminar-datos-trabajador` - ARREGLADO
2. `/api/heartbeat` - Mantener sesión
3. `/api/server-time` - Sincronización de tiempo
4. `/api/sessions/*` - Gestión de sesiones

## PRIORIDAD MEDIA (Funcionalidades importantes)
1. `/api/crear-pago-pix` - Sistema de pagos
2. `/api/verificar-pago` - Verificación de pagos
3. `/api/forgot-password` - Recuperación de contraseña
4. `/api/send-code` / `/api/verify-code` - Verificación por código

## PRIORIDAD BAJA (Pueden esperar)
1. `/api/push-token` - Notificaciones push
2. `/api/admin/backup` - Backups
3. `/api/reset-todo` - Funciones de limpieza
