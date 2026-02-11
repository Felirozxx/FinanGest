# 🔐 Guía Paso a Paso: Obtener Credenciales de Mercado Pago

## Paso 1: Acceder al Panel de Desarrolladores

1. Abre tu navegador
2. Ve a: **https://www.mercadopago.com.br/developers/panel/app**
3. Inicia sesión con tu cuenta de Mercado Pago (si no has iniciado sesión)

---

## Paso 2: Crear o Seleccionar una Aplicación

### Si ya tienes una aplicación:
- Verás una lista de aplicaciones
- Haz clic en el nombre de tu aplicación (ej: "FinanGest", "Mi App", etc.)

### Si NO tienes ninguna aplicación:
1. Haz clic en el botón **"Crear aplicación"** o **"Create application"**
2. Completa el formulario:
   - **Nombre de la aplicación**: `FinanGest`
   - **Modelo de negocio**: Selecciona `Marketplace` o `Gateway de pagos`
   - **Producto**: Selecciona `Checkout Pro` (para pagos con PIX)
3. Haz clic en **"Crear aplicación"**

---

## Paso 3: Ir a Credenciales

1. Una vez dentro de tu aplicación, busca en el menú lateral izquierdo
2. Haz clic en **"Credenciales"** o **"Credentials"**
3. Verás dos pestañas:
   - **Credenciales de prueba** (Testing)
   - **Credenciales de producción** (Production)

---

## Paso 4: Copiar el Access Token de Producción

1. Haz clic en la pestaña **"Credenciales de producción"** o **"Production credentials"**
2. Busca el campo que dice **"Access Token"**
3. Verás un token largo que empieza con `APP_USR-`
4. Haz clic en el botón **"Copiar"** o selecciona todo el texto y cópialo

El token se ve así (ejemplo):
```
APP_USR-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789
```

---

## Paso 5: Pegar el Token Aquí

Una vez que tengas el token copiado, pégalo en el chat y yo lo configuraré automáticamente.

---

## 📝 Notas Importantes

### ¿Qué es el Access Token?
Es la clave que permite a tu aplicación crear pagos y verificar su estado en Mercado Pago.

### ¿Es seguro compartirlo?
- **NO** lo compartas públicamente
- Solo compártelo conmigo en este chat privado
- Lo guardaré de forma segura en las variables de entorno

### ¿Necesito activar algo más?
Sí, después de obtener el token, necesitas:
1. Activar **Checkout Pro** en tu aplicación
2. Activar **PIX** como método de pago
3. Esto se hace en la misma página de tu aplicación en Mercado Pago

---

## 🆘 ¿Problemas?

### No veo el botón "Crear aplicación"
- Verifica que tu cuenta de Mercado Pago esté completamente verificada
- Puede que necesites completar tu perfil de vendedor

### No veo las credenciales de producción
- Primero debes activar tu aplicación en modo producción
- Ve a "Configuración" → "Activar credenciales de producción"

### El token no aparece
- Haz clic en "Generar nuevas credenciales"
- Espera unos segundos y recarga la página

---

## ✅ Siguiente Paso

Una vez que me des el Access Token, yo:
1. Lo guardaré en el archivo `.env`
2. Lo configuraré en Vercel
3. Implementaré los endpoints de pago
4. Probaré que todo funcione

**¡Pégame el token cuando lo tengas!** 🚀

