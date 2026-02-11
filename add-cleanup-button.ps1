$file = "public/index.html"
$content = Get-Content $file -Raw -Encoding UTF8
$lines = $content -split "`n"

# Encontrar la línea después de la configuración de backups (línea 2332)
$insertLine = 2332

# Crear el nuevo contenido
$newContent = @"

                <!-- Limpieza de Backups Viejos -->
                <div class="card-dark mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h6 class="mb-1"><i class="fas fa-broom me-2" style="color: var(--accent-yellow);"></i>Limpieza de Backups</h6>
                            <small class="text-secondary">Elimina backups con más de 30 días para liberar espacio</small>
                        </div>
                        <button class="btn btn-warning" onclick="limpiarBackupsViejos()" id="btnLimpiarBackups">
                            <i class="fas fa-trash-alt me-2"></i>Limpiar Backups Viejos
                        </button>
                    </div>
                    <div class="alert" style="background: rgba(230,167,0,0.1); border: 1px solid var(--accent-yellow); border-radius: 8px; padding: 12px; margin: 0;">
                        <i class="fas fa-info-circle me-2" style="color: var(--accent-yellow);"></i>
                        <small>Los backups se limpian automáticamente cada vez que consultas las estadísticas del sistema. Este botón te permite hacerlo manualmente.</small>
                    </div>
                </div>
"@

# Insertar el nuevo contenido
$newLines = @()
for($i=0; $i -lt $lines.Count; $i++) {
    $newLines += $lines[$i]
    if($i -eq $insertLine) {
        $newLines += $newContent
    }
}

# Guardar
$content = $newLines -join "`n"
Set-Content $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "Boton de limpieza agregado"
