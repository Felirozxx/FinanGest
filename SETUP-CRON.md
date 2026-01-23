# 🚀 Configuración Automática de Actualizaciones

Este script configura automáticamente el sistema de actualizaciones de seguridad en Vercel.

## 📋 Requisitos

- Node.js instalado
- Acceso a tu cuenta de Vercel

## 🎯 Pasos para Configurar

### 1. Obtener Token de Vercel

1. Ve a: https://vercel.com/account/tokens
2. Click en **"Create Token"**
3. Dale un nombre: `FinanGest Setup`
4. Copia el token (lo necesitarás en el siguiente paso)

### 2. Ejecutar el Script

Abre la terminal en esta carpeta y ejecuta:

```bash
node setup-vercel-cron.js
```

### 3. Seguir las Instrucciones

El script te pedirá:
- Tu token de Vercel (pégalo cuando te lo pida)
- El resto es automático

### 4. Verificar

Después de 2-3 minutos:

1. Ve a: https://vercel.com/felirozxxs-projects/finangest
2. Click en **"Cron Jobs"**
3. Deberías ver:
   - Path: `/api/cron-updates`
   - Schedule: `0 2 * * 1` (Cada lunes 2 AM)
   - Status: **Active** ✅

## ✅ ¿Qué hace el script?

1. ✅ Conecta con tu proyecto en Vercel
2. ✅ Crea la variable `CRON_SECRET` automáticamente
3. ✅ Configura el Cron Job
4. ✅ Hace redeploy para activar todo

## 🔧 Configuración Manual (si prefieres)

Si el script no funciona, puedes configurar manualmente:

1. Ve a: https://vercel.com/felirozxxs-projects/finangest/settings/environment-variables
2. Click en **"Add New"**
3. Agrega:
   - **Name**: `CRON_SECRET`
   - **Value**: `finangest_cron_2024_secure_key`
   - **Environments**: Marca todas (Production, Preview, Development)
4. Click en **"Save"**
5. Ve a **"Deployments"** y haz **"Redeploy"**

## 📅 Frecuencia de Actualizaciones

Una vez configurado:
- **Verificación**: Cada lunes a las 2 AM (automático)
- **Backup**: Antes de cada actualización (automático)
- **Notificaciones**: Si hay actualizaciones críticas (automático)

## 🎯 Verificar que Funciona

1. Entra como admin: https://finangest.vercel.app/finangest.html
2. Ve a **"Seguridad"** en el menú
3. Busca **"Actualizaciones de Seguridad"**
4. El switch debe estar **ACTIVADO** (verde)
5. Click en **"Verificar Ahora"** para probar

## ❓ Problemas Comunes

### "Token inválido"
- Asegúrate de copiar el token completo de Vercel
- No debe tener espacios al inicio o final

### "Proyecto no encontrado"
- Verifica que el proyecto se llame "finangest" en Vercel
- Si tiene otro nombre, el script lo mostrará

### "Error de permisos"
- Asegúrate de que el token tenga permisos de escritura
- Crea un nuevo token con todos los permisos

## 💡 Soporte

Si tienes problemas, revisa:
1. Que Node.js esté instalado: `node --version`
2. Que estés en la carpeta correcta
3. Que tengas conexión a internet

---

**¡Listo!** Una vez configurado, tu sistema se actualizará automáticamente cada semana sin que tengas que hacer nada.
