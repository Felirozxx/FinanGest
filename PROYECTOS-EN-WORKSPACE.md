# 📂 PROYECTOS EN ESTE WORKSPACE

Este workspace contiene 2 proyectos completamente independientes:

---

## 1️⃣ FinanGest - Sistema de Gestión de Préstamos

### 📍 Ubicación: Carpeta raíz (`/api`, `/public`)

### 🎯 Propósito:
Sistema de gestión de préstamos "gota a gota" con:
- Gestión de clientes
- Carteras de préstamos
- Control de pagos
- Sistema de usuarios (admin/worker)
- Verificación por email
- Integración con MercadoPago

### 🔧 Tecnología:
- Backend: Node.js + Express
- Base de datos: MongoDB Atlas
- Frontend: Flutter Web (PWA)
- Hosting: Vercel

### 📱 Archivos principales:
- `/api/` - Backend
- `/public/` - Frontend Flutter compilado
- `server-mongodb.js` - Servidor principal

### 🚀 Estado: Funcional y en producción

---

## 2️⃣ Vectora Marketing - Plataforma de Publicidad con IA

### 📍 Ubicación: Carpeta `/anuncios-ia`

### 🎯 Propósito:
Plataforma de publicidad automatizada para:
- Generar imágenes con IA (gratis)
- Crear anuncios profesionales
- Publicar en Facebook, Instagram, TikTok, WhatsApp
- Targeting geográfico automático
- Validación anti-ban

### 🔧 Tecnología:
- Backend: Node.js + Express
- Frontend: HTML/CSS/JavaScript
- IA: Pollinations.ai (gratis)
- APIs: Meta, TikTok
- Hosting: Vercel

### 📱 Archivos principales:
- `/anuncios-ia/ultra.html` - Interfaz principal
- `/anuncios-ia/server.js` - Backend
- `/anuncios-ia/services/` - Servicios de publicación

### 🚀 Estado: 100% completo y listo para usar

### ⚡ Inicio rápido:
```bash
cd anuncios-ia
```
Luego abre: `LEEME-PRIMERO.txt` o `INICIO-RAPIDO.md`

---

## 📊 Comparación

| Característica | FinanGest | Vectora Marketing |
|---------------|-----------|-------------------|
| **Propósito** | Gestión de préstamos | Publicidad automatizada |
| **Usuarios** | Admin + Workers | Solo tú |
| **Base de datos** | MongoDB (clientes, préstamos) | MongoDB (campañas) |
| **Frontend** | Flutter Web | HTML/CSS/JS |
| **Estado** | En producción | Listo para usar |
| **Carpeta** | Raíz (`/api`, `/public`) | `/anuncios-ia` |

---

## 🎯 Cómo Trabajar con Ambos

### Para FinanGest:
```bash
# Desde la raíz del workspace
npm start
# o
node server-mongodb.js
```

### Para Vectora Marketing:
```bash
cd anuncios-ia
npm install
npm start
# Luego abre ultra.html
```

---

## 📝 Notas Importantes

1. **Son proyectos independientes** - No se afectan entre sí
2. **Diferentes puertos** - FinanGest usa un puerto, Vectora otro
3. **Diferentes bases de datos** - Cada uno tiene su propia BD
4. **Diferentes propósitos** - Uno es préstamos, otro publicidad

---

## 🚀 Próximos Pasos

### Si quieres trabajar con FinanGest:
- Ya está funcionando
- Continúa con las mejoras que necesites

### Si quieres trabajar con Vectora Marketing:
1. `cd anuncios-ia`
2. Abre `LEEME-PRIMERO.txt`
3. Sigue las instrucciones

---

## 📞 Documentación

### FinanGest:
- `RESUMEN-SESION-2026-02-10.md`
- `SISTEMA-VERIFICACION-COMPLETO.md`
- `API-ENDPOINTS-COMPLETO.md`

### Vectora Marketing:
- `anuncios-ia/LEEME-PRIMERO.txt`
- `anuncios-ia/INICIO-RAPIDO.md`
- `anuncios-ia/RESUMEN-FINAL.md`
- `VECTORA-MARKETING-COMPLETO.md` (en raíz)

---

**Ambos proyectos están completos y listos para usar.** 🎉
