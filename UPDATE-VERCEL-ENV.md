# Actualizar Variables de Entorno en Vercel

Para que los emails funcionen en producción, necesitas actualizar las variables de entorno en Vercel:

## Pasos:

1. Ve a https://vercel.com/felirozxxs-projects/finangest/settings/environment-variables

2. Busca o agrega estas variables:

   - `EMAIL_USER` = `finangestsoftware@gmail.com`
   - `EMAIL_PASS` = `crvjdhgwdsgycskw`

3. Asegúrate de seleccionar todos los entornos:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Haz clic en "Save"

5. **IMPORTANTE**: Después de guardar, debes hacer un nuevo deploy para que tome las variables:
   - Ve a la pestaña "Deployments"
   - Haz clic en los 3 puntos del último deployment
   - Selecciona "Redeploy"

## Verificar que funciona:

1. Ve a https://finangest.vercel.app/
2. Intenta crear una cuenta nueva
3. Deberías recibir el código en el email

---

**Nota**: Las variables de entorno en Vercel son independientes del archivo `.env` local.
