$file = "public/index.html"
$content = Get-Content $file -Raw -Encoding UTF8
$lines = $content -split "`n"

# Encontrar la línea después de la función descargarBackup (línea 14009)
$insertLine = 14008

# Crear la nueva función
$newFunction = @"

        async function limpiarBackupsViejos() {
            if (!confirm('¿Eliminar todos los backups con más de 30 días?\n\nEsto liberará espacio en la base de datos.')) return;
            
            const btn = document.getElementById('btnLimpiarBackups');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Limpiando...';
            
            try {
                const res = await fetch(API_URL + '/api/admin/limpiar-backups-viejos', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                
                if (data.success) {
                    alert(`✅ Limpieza completada\n\nBackups eliminados: ${data.eliminados}\nFecha límite: ${new Date(data.fechaLimite).toLocaleDateString()}`);
                    // Recargar estadísticas
                    if (typeof cargarEstadisticasSistema === 'function') {
                        cargarEstadisticasSistema();
                    }
                } else {
                    alert('Error: ' + (data.error || 'No se pudo limpiar'));
                }
            } catch (e) {
                alert('Error de conexión: ' + e.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-trash-alt me-2"></i>Limpiar Backups Viejos';
            }
        }
"@

# Insertar la nueva función
$newLines = @()
for($i=0; $i -lt $lines.Count; $i++) {
    $newLines += $lines[$i]
    if($i -eq $insertLine) {
        $newLines += $newFunction
    }
}

# Guardar
$content = $newLines -join "`n"
Set-Content $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "Funcion de limpieza agregada"
