# 🚀 SUBIR VECTORA MARKETING A VERCEL - GUÍA RÁPIDA

## ✅ TODO ESTÁ LISTO

Ya preparé todos los archivos necesarios para subir Vectora Marketing a Vercel.

---

## 📋 OPCIÓN 1: MÉTODO RÁPIDO (Recomendado)

### Paso 1: Abrir PowerShell

1. Presiona `Windows + X`
2. Selecciona "Windows PowerShell" o "Terminal"

### Paso 2: Ir a la carpeta

```powershell
cd C:\Users\Felipe\Desktop\FinanGest-Deploy\anuncios-ia
```

### Paso 3: Ejecutar el script

```powershell
.\deploy-vercel.bat
```

El script hará todo automáticamente:
- ✅ Verificará si tienes Vercel CLI
- ✅ Lo instalará si no lo tienes
- ✅ Desplegará tu app
- ✅ Te dará la URL

---

## 📋 OPCIÓN 2: MÉTODO MANUAL

### Paso 1: Instalar Vercel CLI

```powershell
npm install -g vercel
```

Espera 1-2 minutos.

### Paso 2: Iniciar sesión

```powershell
vercel login
```

Te pedirá verificar tu email. Revisa tu correo y haz clic en el enlace.

### Paso 3: Ir a la carpeta

```powershell
cd C:\Users\Felipe\Desktop\FinanGest-Deploy\anuncios-ia
```

### Paso 4: Desplegar

```powershell
vercel
```

**Responde:**
- Set up and deploy? → `Y`
- Which scope? → Selecciona tu cuenta
- Link to existing project? → `N`
- What's your project's name? → `vectora-marketing`
- In which directory is your code located? → `.` (punto)
- Want to override the settings? → `N`

Espera 2-3 minutos mientras sube.

### Paso 5: Desplegar en producción

```powershell
vercel --prod
```

---

## 🔑 CONFIGURAR VARIABLES DE ENTORNO

Después del primer despliegue, configura las variables:

```powershell
vercel env add META_ACCESS_TOKEN
```

Cuando te pida el valor, escribe: `demo_token_temporal` (por ahora)

Repite para cada variable:

```powershell
vercel env add META_AD_ACCOUNT_ID
# Valor: act_demo_123456

vercel env add META_PAGE_ID
# Valor: demo_page_123456

vercel env add MODO_PRUEBA
# Valor: true

vercel env add NODE_ENV
# Valor: production

vercel env add PORT
# Valor: 3000
```

### Redesplegar con variables

```powershell
vercel --prod
```

---

## 🌐 ACCEDER A TU APP

Vercel te dará una URL como:

```
https://vectora-marketing.vercel.app
```

**Abre tu app:**
```
https://vectora-marketing.vercel.app/ultra.html
```

---

## 📱 USAR DESDE CUALQUIER LUGAR

Una vez desplegado:

✅ **Desde tu PC:** Abre la URL en Chrome
✅ **Desde tu celular:** Abre la URL en el navegador
✅ **Desde otro PC:** Abre la URL en cualquier navegador
✅ **Desde cualquier lugar:** Solo necesitas internet

---

## 🔄 ACTUALIZAR TU APP

Cuando hagas cambios en el código:

```powershell
cd C:\Users\Felipe\Desktop\FinanGest-Deploy\anuncios-ia
vercel --prod
```

---

## 🔐 CUANDO OBTENGAS CREDENCIALES REALES

Después de las 48 horas, cuando Facebook apruebe tu cuenta:

### Opción A: Desde la terminal

```powershell
vercel env rm META_ACCESS_TOKEN
vercel env add META_ACCESS_TOKEN
# Pega tu token real

vercel env rm META_AD_ACCOUNT_ID
vercel env add META_AD_ACCOUNT_ID
# Pega tu Ad Account ID real

vercel env rm META_PAGE_ID
vercel env add META_PAGE_ID
# Pega tu Page ID real

vercel env rm MODO_PRUEBA
vercel env add MODO_PRUEBA
# Valor: false

vercel --prod
```

### Opción B: Desde el dashboard

1. Ve a: https://vercel.com/dashboard
2. Selecciona "vectora-marketing"
3. Ve a "Settings" → "Environment Variables"
4. Edita cada variable con los valores reales
5. Guarda
6. Ve a "Deployments" → "Redeploy"

---

## 💾 RESPALDO AUTOMÁTICO

Con Vercel, tu código está respaldado automáticamente:

✅ **Si tu PC se daña:** Tu app sigue funcionando en Vercel
✅ **Si borras archivos:** Puedes descargar desde Vercel
✅ **Si necesitas versión anterior:** Vercel guarda todas las versiones

---

## 📊 MONITOREAR TU APP

### Ver logs

```powershell
vercel logs
```

### Ver estadísticas

1. Ve a: https://vercel.com/dashboard
2. Selecciona "vectora-marketing"
3. Ve a "Analytics"

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "vercel: command not found"

```powershell
npm install -g vercel
```

### Error: "Not logged in"

```powershell
vercel login
```

### Error: "Build failed"

Verifica que `package.json` esté correcto:
```powershell
npm install
```

### La app no carga

Verifica los logs:
```powershell
vercel logs
```

---

## ✅ CHECKLIST

- [ ] Vercel CLI instalado
- [ ] Sesión iniciada (`vercel login`)
- [ ] App desplegada (`vercel`)
- [ ] Variables configuradas
- [ ] Desplegado en producción (`vercel --prod`)
- [ ] URL funcionando
- [ ] Probado desde navegador
- [ ] Guardada la URL

---

## 🎯 PRÓXIMOS PASOS

1. **Ahora:** Despliega en Vercel
2. **En 48 horas:** Actualiza con credenciales reales de Facebook
3. **Después:** Empieza a crear anuncios para clientes

---

## 📞 URLs IMPORTANTES

**Tu app:** https://vectora-marketing.vercel.app/ultra.html
**Dashboard Vercel:** https://vercel.com/dashboard
**Documentación:** Lee `anuncios-ia/DEPLOY-VERCEL.md`

---

## 🎉 ¡LISTO!

Ejecuta el script o sigue los pasos manuales. En 5 minutos tu app estará en la nube.

```powershell
cd C:\Users\Felipe\Desktop\FinanGest-Deploy\anuncios-ia
.\deploy-vercel.bat
```

¡Éxito! 🚀
