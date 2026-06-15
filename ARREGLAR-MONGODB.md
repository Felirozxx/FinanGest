# ❌ Error: No se puede conectar a MongoDB Atlas

## Problema
Tu computadora no puede conectarse a MongoDB Atlas. Sale "Error de servidor" al hacer login.

## Causas
1. Tu IP no está en la whitelist de MongoDB Atlas
2. DNS bloqueado
3. Firewall/Antivirus bloqueando la conexión

## Soluciones

### ✅ OPCIÓN 1: Usar la app en Vercel (RECOMENDADO)
La app ya funciona en: **https://finangest.vercel.app**

**Credenciales admin:**
- Email: `felirozxx@gmail.com`
- Password: `tu_contraseña`

### ✅ OPCIÓN 2: Arreglar MongoDB Atlas

#### Paso 1: Agregar tu IP a MongoDB Atlas
1. Ve a: https://cloud.mongodb.com/
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto "FinanGest"
4. Ve a "Network Access" (en el menú izquierdo)
5. Click en "Add IP Address"
6. Selecciona "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)
7. Click "Confirm"
8. Espera 2-3 minutos para que se aplique

#### Paso 2: Probar conexión
Ejecuta en la terminal:
```cmd
node check-admin-users.js
```

Si sale:
- ✅ "User found" → Funcionó!
- ❌ "Error: querySrv ENOTFOUND" → Sigue al Paso 3

#### Paso 3: Cambiar DNS (si sigue sin funcionar)
1. Ve a "Panel de Control" → "Redes e Internet" → "Centro de redes"
2. Click en tu conexión WiFi/Ethernet
3. Click en "Propiedades"
4. Selecciona "Protocolo de Internet versión 4 (TCP/IPv4)"
5. Click en "Propiedades"
6. Selecciona "Usar las siguientes direcciones de servidor DNS"
7. DNS preferido: `8.8.8.8` (Google DNS)
8. DNS alternativo: `8.8.4.4`
9. Click "Aceptar"
10. Reinicia tu navegador

### ✅ OPCIÓN 3: Desactivar temporalmente el antivirus
Algunos antivirus bloquean conexiones a MongoDB. Desactiva temporalmente tu antivirus y prueba de nuevo.

## ¿Qué opción elijo?
- **Si necesitas usar la app YA**: Usa Vercel (Opción 1)
- **Si quieres usar localhost**: Sigue la Opción 2

## Verificar que funciona
Una vez que elijas una opción, prueba:
1. Ir a la app
2. Iniciar sesión con: `felirozxx@gmail.com`
3. Debería entrar al panel de admin
