# Sistema de Failover Automático

## ¿Qué hace?

Si MongoDB se cae, el sistema cambia **automáticamente** a Supabase en segundos, sin que tus clientes noten nada.

## Ventajas

✅ **100% Automático** - No necesitas hacer nada si MongoDB falla
✅ **Sin interrupciones** - Tus clientes siguen usando la app normalmente  
✅ **Seguro** - Se prueba antes de activar en producción
✅ **Reversible** - Si algo falla, vuelve a MongoDB simple

## Instalación (Paso a Paso)

### 1. Instalar dependencias

```bash
npm install @supabase/supabase-js
```

### 2. Configurar Supabase

```bash
node setup-failover-system.js
```

Sigue las instrucciones para obtener tu API Key de Supabase.

### 3. Crear tablas en Supabase

Ve a Supabase Dashboard > SQL Editor y ejecuta:

```sql
-- Tabla de usuarios
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    nombre TEXT,
    email TEXT UNIQUE,
    password TEXT,
    rol TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de carteras
CREATE TABLE carteras (
    id TEXT PRIMARY KEY,
    cliente_id TEXT,
    monto_prestado NUMERIC,
    monto_cobrado NUMERIC,
    estado TEXT,
    fecha_inicio DATE,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de gastos
CREATE TABLE gastos (
    id TEXT PRIMARY KEY,
    descripcion TEXT,
    monto NUMERIC,
    fecha DATE,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Probar el sistema

```bash
node test-failover.js
```

Si todos los tests pasan ✅, continúa al paso 5.

### 5. Activar en Vercel

1. Ve a: https://vercel.com/felirozxx/finangest/settings/environment-variables
2. Agrega las variables:
   - `SUPABASE_KEY` = (tu API key)
   - `USE_FAILOVER` = `false` (por ahora)
3. Guarda y redeploy

### 6. Activar failover (cuando estés listo)

1. Cambia `USE_FAILOVER` = `true` en Vercel
2. Redeploy
3. ¡Listo! Ya tienes protección automática

## ¿Cómo funciona?

1. **Cada 30 segundos** verifica si MongoDB está funcionando
2. **Si MongoDB falla**, cambia automáticamente a Supabase
3. **Cuando MongoDB se recupera**, vuelve a usarlo automáticamente
4. **Todo es transparente** para tus usuarios

## Monitoreo

El sistema registra en los logs cuando cambia de backend:

- `✅ Switching back to MongoDB` - Volvió a MongoDB
- `⚠️ MongoDB down, switching to Supabase` - Cambió a Supabase por falla

## Desactivar

Si quieres desactivar el failover:

1. Cambia `USE_FAILOVER` = `false` en Vercel
2. Redeploy
3. Volverá a usar solo MongoDB

## Soporte

Si tienes problemas, revisa los logs en Vercel > Deployment > Runtime Logs
