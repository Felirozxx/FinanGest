# Plataforma de Gestión de Anuncios con IA

## Descripción General
Plataforma personal para gestionar campañas publicitarias de clientes con generación de contenido mediante IA y publicación automática en múltiples redes sociales.

## Funcionalidades Principales

### 1. Generación de Contenido con IA (Gratis)
- **Generación de imágenes profesionales** usando APIs gratuitas:
  - Stable Diffusion (Hugging Face - Gratis)
  - DALL-E via OpenAI (con créditos gratuitos iniciales)
  - Midjourney API alternativas gratuitas
- **Generación de textos publicitarios**:
  - GPT-3.5 Turbo (OpenAI - económico)
  - Claude API (Anthropic - con tier gratuito)
  - Llama 2 via Hugging Face (Gratis)
- **Optimización de contenido** según plataforma

### 2. Gestión de Clientes
- Base de datos de clientes
- Historial de campañas por cliente
- Presupuestos y facturación

### 3. Publicación Multi-Plataforma
- **Facebook Ads** (Meta Business API)
- **Instagram Ads** (Meta Business API)
- **Google Ads** (Google Ads API)
- **TikTok Ads** (TikTok Marketing API)
- **Twitter/X Ads** (Twitter Ads API)
- **LinkedIn Ads** (LinkedIn Marketing API)

### 4. Segmentación Avanzada
- Selección de países/regiones/estados
- Targeting por intereses y comportamiento
- Audiencias personalizadas
- Lookalike audiences

### 5. Panel de Control
- Vista previa de anuncios
- Edición antes de publicar
- Programación de publicaciones
- Estadísticas y métricas en tiempo real

## Stack Tecnológico Propuesto

### Backend
- **Node.js + Express** (igual que FinanGest)
- **MongoDB** para almacenar clientes, campañas, historial
- **Vercel** para deployment

### Frontend
- **HTML/CSS/JavaScript** (PWA como FinanGest)
- **React** (opcional, para interfaz más dinámica)

### APIs de IA (100% GRATIS)
1. **Hugging Face Inference API** (Gratis ilimitado):
   - Stable Diffusion XL para imágenes profesionales
   - Llama 2 / Mistral para textos publicitarios
   - Flux para imágenes realistas
2. **Pollinations.ai** (Gratis sin límites):
   - Generación de imágenes sin API key
   - Múltiples modelos disponibles
3. **Together.ai** (Tier gratuito generoso):
   - $25 gratis al registrarte
   - Llama 3, Mixtral, etc.

### APIs de Redes Sociales
1. **Meta Business Suite API** (Facebook + Instagram)
2. **Google Ads API**
3. **TikTok Marketing API**
4. **Twitter Ads API**
5. **LinkedIn Marketing API**

## Estructura del Proyecto

```
anuncios-ia/
├── api/
│   ├── index.js              # Router principal
│   ├── clientes.js           # Gestión de clientes
│   ├── campanas.js           # Gestión de campañas
│   ├── ia-service.js         # Integración con APIs de IA
│   ├── meta-ads.js           # Facebook + Instagram
│   ├── google-ads.js         # Google Ads
│   ├── tiktok-ads.js         # TikTok Ads
│   ├── twitter-ads.js        # Twitter/X Ads
│   ├── linkedin-ads.js       # LinkedIn Ads
│   └── _db.js                # Conexión MongoDB
├── public/
│   ├── index.html            # Dashboard principal
│   ├── crear-anuncio.html    # Formulario de creación
│   ├── clientes.html         # Gestión de clientes
│   ├── estadisticas.html     # Métricas y reportes
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
├── .env                      # Variables de entorno
├── package.json
└── vercel.json
```

## Flujo de Trabajo

1. **Crear campaña**:
   - Seleccionar cliente
   - Describir producto/servicio
   - Elegir objetivo (ventas, tráfico, engagement)

2. **Generar contenido con IA**:
   - IA genera múltiples opciones de texto
   - IA genera imágenes profesionales
   - Vista previa y edición

3. **Configurar targeting**:
   - Seleccionar plataformas
   - Elegir regiones/estados
   - Definir audiencia (edad, intereses, etc.)
   - Establecer presupuesto

4. **Publicar**:
   - Un solo botón publica en todas las plataformas
   - Confirmación de publicación
   - Tracking automático

5. **Monitorear**:
   - Dashboard con métricas en tiempo real
   - Alcance, impresiones, clics, conversiones
   - ROI por plataforma

## APIs 100% GRATUITAS

### Para Imágenes (Sin costo, sin límites)
1. **Pollinations.ai** (Gratis, sin API key):
   ```
   https://image.pollinations.ai/prompt/{tu_prompt}
   ```
   - No requiere registro
   - Sin límites de uso
   - Múltiples modelos

2. **Hugging Face Inference API** (Gratis con token):
   ```
   https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0
   ```
   - Registro gratuito
   - Token API gratis
   - Modelos ilimitados

### Para Textos (Gratis)
1. **Hugging Face** (Gratis):
   ```
   https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2
   ```
   - Mistral 7B (excelente para marketing)
   - Llama 2 70B
   - Mixtral 8x7B

2. **Together.ai** (Tier gratuito):
   ```
   https://api.together.xyz/v1/chat/completions
   ```
   - $25 gratis al registrarte
   - Llama 3, Mixtral, etc.

### Para Publicación
1. **Meta Business API** (Gratis, solo pagas los anuncios):
   ```
   https://developers.facebook.com/docs/marketing-apis
   ```

## Costos Estimados

### Desarrollo: $0 (tú lo haces)

### Hosting:
- Vercel: $0 (tier hobby - gratis)
- MongoDB Atlas: $0 (512MB gratis)

### APIs de IA:
- Hugging Face: $0 (gratis ilimitado)
- Pollinations.ai: $0 (gratis sin límites)
- Together.ai: $0 (tier gratuito)

### APIs de Redes Sociales:
- Todas $0 (solo pagas el presupuesto de los anuncios de tus clientes)

**Total mensual: $0 - TODO GRATIS** ✅

## Próximos Pasos

1. ✅ Crear estructura del proyecto
2. ⬜ Configurar MongoDB y variables de entorno
3. ⬜ Implementar gestión de clientes
4. ⬜ Integrar API de IA para textos (Hugging Face/OpenAI)
5. ⬜ Integrar API de IA para imágenes (Stable Diffusion)
6. ⬜ Crear interfaz de generación de anuncios
7. ⬜ Integrar Meta Business API (Facebook + Instagram)
8. ⬜ Integrar otras plataformas publicitarias
9. ⬜ Implementar sistema de segmentación geográfica
10. ⬜ Crear dashboard de estadísticas

## Notas Importantes

- **Cuentas necesarias**:
  - Meta Business Manager (Facebook/Instagram)
  - Google Ads Manager
  - TikTok Business Center
  - Twitter Ads Account
  - LinkedIn Campaign Manager
  - Hugging Face Account (gratis)
  - OpenAI Account (opcional)

- **Verificaciones requeridas**:
  - Verificación de dominio para Meta
  - Verificación de negocio para algunas plataformas
  - Métodos de pago configurados en cada plataforma

- **Límites y restricciones**:
  - Cada plataforma tiene políticas de anuncios
  - Algunas industrias están restringidas
  - Necesitas aprobar contenido según políticas
