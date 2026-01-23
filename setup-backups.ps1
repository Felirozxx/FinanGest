# Script para configurar Supabase y Firebase como backups
# FinanGest - Sistema de Alta Disponibilidad

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🛡️  Configuración de Backups en la Nube                ║" -ForegroundColor Cyan
Write-Host "║   Supabase + Firebase para FinanGest                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Este script te guiará para configurar backups en Supabase y Firebase.`n" -ForegroundColor White

# ========== PASO 1: SUPABASE ==========
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  PASO 1: Configurar Supabase" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Write-Host "1. Abriendo Supabase en tu navegador..." -ForegroundColor Green
Start-Process "https://supabase.com/dashboard/sign-in"
Start-Sleep -Seconds 2

Write-Host "`n📋 Instrucciones para Supabase:" -ForegroundColor Cyan
Write-Host "   1. Inicia sesión con GitHub o tu email" -ForegroundColor White
Write-Host "   2. Click en 'New Project'" -ForegroundColor White
Write-Host "   3. Llena los datos:" -ForegroundColor White
Write-Host "      - Name: FinanGest" -ForegroundColor Gray
Write-Host "      - Database Password: Pipe16137356" -ForegroundColor Gray
Write-Host "      - Region: South America (São Paulo)" -ForegroundColor Gray
Write-Host "   4. Click en 'Create new project'" -ForegroundColor White
Write-Host "   5. Espera 2-3 minutos a que se cree`n" -ForegroundColor White

$supabaseReady = Read-Host "¿Ya se creó el proyecto? (s/n)"

if ($supabaseReady -eq "s") {
    Write-Host "`n📝 Ahora necesitamos la URI de conexión:" -ForegroundColor Cyan
    Write-Host "   1. En Supabase, click en 'Project Settings' (⚙️ abajo)" -ForegroundColor White
    Write-Host "   2. Click en 'Database'" -ForegroundColor White
    Write-Host "   3. Busca 'Connection string' → 'URI'" -ForegroundColor White
    Write-Host "   4. Copia la URI completa`n" -ForegroundColor White
    
    $supabaseUri = Read-Host "Pega aquí la URI de Supabase"
    
    if ($supabaseUri) {
        Write-Host "✅ URI de Supabase guardada`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No se proporcionó URI. Continuando...`n" -ForegroundColor Yellow
        $supabaseUri = ""
    }
} else {
    Write-Host "⚠️  Saltando Supabase por ahora`n" -ForegroundColor Yellow
    $supabaseUri = ""
}

# ========== PASO 2: FIREBASE ==========
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  PASO 2: Configurar Firebase" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Write-Host "2. Abriendo Firebase en tu navegador..." -ForegroundColor Green
Start-Process "https://console.firebase.google.com"
Start-Sleep -Seconds 2

Write-Host "`n📋 Instrucciones para Firebase:" -ForegroundColor Cyan
Write-Host "   1. Inicia sesión con tu cuenta de Google" -ForegroundColor White
Write-Host "   2. Click en 'Add project' (Agregar proyecto)" -ForegroundColor White
Write-Host "   3. Nombre del proyecto: FinanGest" -ForegroundColor White
Write-Host "   4. Desactiva Google Analytics (no es necesario)" -ForegroundColor White
Write-Host "   5. Click en 'Create project'" -ForegroundColor White
Write-Host "   6. Espera 1-2 minutos`n" -ForegroundColor White

$firebaseReady = Read-Host "¿Ya se creó el proyecto? (s/n)"

if ($firebaseReady -eq "s") {
    Write-Host "`n📝 Ahora configuramos Firestore:" -ForegroundColor Cyan
    Write-Host "   1. En el menú lateral, click en 'Firestore Database'" -ForegroundColor White
    Write-Host "   2. Click en 'Create database'" -ForegroundColor White
    Write-Host "   3. Selecciona 'Start in production mode'" -ForegroundColor White
    Write-Host "   4. Location: southamerica-east1 (São Paulo)" -ForegroundColor White
    Write-Host "   5. Click en 'Enable'`n" -ForegroundColor White
    
    $firestoreReady = Read-Host "¿Ya se creó Firestore? (s/n)"
    
    if ($firestoreReady -eq "s") {
        Write-Host "`n📝 Obtener credenciales de Firebase:" -ForegroundColor Cyan
        Write-Host "   1. Click en el ícono de configuración (⚙️) → 'Project settings'" -ForegroundColor White
        Write-Host "   2. En la pestaña 'General', busca 'Your apps'" -ForegroundColor White
        Write-Host "   3. Click en '</>' (Web app)" -ForegroundColor White
        Write-Host "   4. App nickname: FinanGest" -ForegroundColor White
        Write-Host "   5. Click en 'Register app'" -ForegroundColor White
        Write-Host "   6. Copia el 'Project ID' (aparece en la configuración)`n" -ForegroundColor White
        
        $firebaseProjectId = Read-Host "Pega aquí el Project ID de Firebase"
        
        if ($firebaseProjectId) {
            Write-Host "✅ Project ID de Firebase guardado`n" -ForegroundColor Green
        } else {
            Write-Host "⚠️  No se proporcionó Project ID. Continuando...`n" -ForegroundColor Yellow
            $firebaseProjectId = ""
        }
    } else {
        Write-Host "⚠️  Saltando Firebase por ahora`n" -ForegroundColor Yellow
        $firebaseProjectId = ""
    }
} else {
    Write-Host "⚠️  Saltando Firebase por ahora`n" -ForegroundColor Yellow
    $firebaseProjectId = ""
}

# ========== PASO 3: CONFIGURAR EN VERCEL ==========
if ($supabaseUri -or $firebaseProjectId) {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "  PASO 3: Configurar en Vercel" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Yellow
    
    Write-Host "Abriendo configuración de Vercel..." -ForegroundColor Green
    Start-Process "https://vercel.com/felirozxxs-projects/finangest/settings/environment-variables"
    Start-Sleep -Seconds 2
    
    Write-Host "`n📝 Agrega estas variables en Vercel:`n" -ForegroundColor Cyan
    
    if ($supabaseUri) {
        Write-Host "Variable 1:" -ForegroundColor White
        Write-Host "  Name: SUPABASE_URI" -ForegroundColor Gray
        Write-Host "  Value: $supabaseUri" -ForegroundColor Gray
        Write-Host "  Environments: Production, Preview, Development`n" -ForegroundColor Gray
    }
    
    if ($firebaseProjectId) {
        Write-Host "Variable 2:" -ForegroundColor White
        Write-Host "  Name: FIREBASE_PROJECT_ID" -ForegroundColor Gray
        Write-Host "  Value: $firebaseProjectId" -ForegroundColor Gray
        Write-Host "  Environments: Production, Preview, Development`n" -ForegroundColor Gray
    }
    
    Write-Host "Después de agregar las variables:" -ForegroundColor Cyan
    Write-Host "  1. Click en 'Save' en cada variable" -ForegroundColor White
    Write-Host "  2. Ve a 'Deployments'" -ForegroundColor White
    Write-Host "  3. Click en 'Redeploy' en el último deployment`n" -ForegroundColor White
    
    $vercelConfigured = Read-Host "¿Ya agregaste las variables y redesplegaste? (s/n)"
    
    if ($vercelConfigured -eq "s") {
        Write-Host "`n✅ ¡Configuración completada!`n" -ForegroundColor Green
    }
}

# ========== RESUMEN FINAL ==========
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ✅ CONFIGURACIÓN COMPLETADA                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "📊 Resumen de Backups Configurados:`n" -ForegroundColor White

Write-Host "  🟢 MongoDB Atlas: Activo (Principal)" -ForegroundColor Green

if ($supabaseUri) {
    Write-Host "  🟢 Supabase: Configurado (Backup 1)" -ForegroundColor Green
} else {
    Write-Host "  🔴 Supabase: No configurado" -ForegroundColor Red
}

if ($firebaseProjectId) {
    Write-Host "  🟢 Firebase: Configurado (Backup 2)" -ForegroundColor Green
} else {
    Write-Host "  🔴 Firebase: No configurado" -ForegroundColor Red
}

Write-Host "`n🎯 Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Espera 2-3 minutos a que termine el deploy en Vercel" -ForegroundColor White
Write-Host "  2. Entra a tu app como admin" -ForegroundColor White
Write-Host "  3. Ve a 'Estado del Sistema'" -ForegroundColor White
Write-Host "  4. Verifica que los backends estén activos`n" -ForegroundColor White

Write-Host "✨ Tu sistema ahora tiene múltiples backups en la nube!`n" -ForegroundColor Green

Read-Host "Presiona Enter para salir"
