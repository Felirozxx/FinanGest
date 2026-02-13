# 🔑 Cómo Obtener el Access Token de Mercado Pago desde el Celular

## ⚠️ PROBLEMA ACTUAL
El Access Token que tienes es **INVÁLIDO** o **EXPIRADO**. Necesitas obtener uno nuevo.

---

## 📱 PASOS DESDE EL CELULAR

### 1️⃣ Abrir el Panel de Desarrolladores
Abre este link en tu celular:
```
https://www.mercadopago.com.br/developers/panel/app
```

### 2️⃣ Iniciar Sesión
- Inicia sesión con tu cuenta de Mercado Pago
- Usa la misma cuenta donde recibirás los pagos

### 3️⃣ Ver tus Aplicaciones
- Deberías ver una lista de aplicaciones
- Si no tienes ninguna, toca en **"Criar aplicação"** o **"Nueva aplicación"**

### 4️⃣ Crear o Seleccionar Aplicación
Si necesitas crear una nueva:
- Nombre: **FinanGest**
- Producto: Selecciona **"Checkout Pro"** o **"Pagamentos online"**
- Toca **"Criar"** o **"Crear"**

Si ya tienes una aplicación:
- Toca sobre ella para abrirla

### 5️⃣ Activar para Producción
**MUY IMPORTANTE:**
- Busca un botón o switch que diga **"Modo Produção"** o **"Producción"**
- Asegúrate de que esté **ACTIVADO** (verde)
- Si dice "Modo Teste" o "Test", cámbialo a Producción

### 6️⃣ Obtener las Credenciales de PRODUCCIÓN
- Busca la sección **"Credenciais de produção"** o **"Credenciales de producción"**
- **NO uses** "Credenciais de teste" (test)
- Deberías ver:
  - **Public Key** (comienza con `APP_USR-...`)
  - **Access Token** (comienza con `APP_USR-...` y es MÁS LARGO)

### 7️⃣ Copiar el Access Token
- Toca sobre el **Access Token** para copiarlo
- Es el más largo (tiene muchos números y letras)
- Ejemplo: `APP_USR-1234567890123456-123456-abc123def456ghi789jkl012mno345-123456789`

### 8️⃣ Enviarme el Token
Envíame el Access Token completo aquí en el chat.

---

## 🔍 CÓMO IDENTIFICAR EL TOKEN CORRECTO

### ✅ Access Token de PRODUCCIÓN (correcto):
```
APP_USR-[números]-[números]-[letras y números largos]-[números]
Ejemplo: APP_USR-1234567890123456-123456-abc123def456ghi789jkl012mno345-123456789
```

### ❌ Public Key (NO es el que necesitamos):
```
APP_USR-[letras cortas]-[números]-[letras]-[números]
Ejemplo: APP_USR-034ae1e7-1f09-473f5-aefae-75617baf18e
```

---

## 📋 CHECKLIST

Antes de enviarme el token, verifica:

- [ ] Estás en el panel de **Desarrolladores** (developers)
- [ ] La aplicación está en **Modo Producción** (NO test)
- [ ] Estás copiando el **Access Token** (NO la Public Key)
- [ ] El token es LARGO (más de 80 caracteres)
- [ ] El token comienza con `APP_USR-`

---

## 🆘 SI TIENES PROBLEMAS

### Problema: No veo "Credenciais de produção"
**Solución:** Tu aplicación está en modo test. Busca un botón para activar producción.

### Problema: Me pide verificar mi cuenta
**Solución:** Mercado Pago requiere que verifiques tu identidad para usar producción. Sigue los pasos que te indique.

### Problema: No puedo crear aplicación
**Solución:** Verifica que tu cuenta de Mercado Pago esté completa y verificada.

### Problema: El token que copié no funciona
**Solución:** Asegúrate de copiar el **Access Token** completo, no la Public Key.

---

## 🎯 PRÓXIMOS PASOS

Una vez que me envíes el token correcto:
1. Lo configuraré en Vercel
2. Probaremos el sistema de pagos
3. Tu app estará lista para recibir pagos automáticos con PIX

---

## 📞 LINK DIRECTO

Copia y pega este link en tu navegador del celular:
```
https://www.mercadopago.com.br/developers/panel/app
```

O busca en Google: **"mercado pago developers panel"**
