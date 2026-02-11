$file = "public/index.html"
$content = Get-Content $file -Raw -Encoding UTF8
$lines = $content -split "`n"

# Eliminar líneas 7257-7260 (botón grande)
$newLines = @()
for($i=0; $i -lt $lines.Count; $i++) {
    if($i -ge 7256 -and $i -le 7259) {
        # Skip estas líneas
        continue
    }
    $newLines += $lines[$i]
}

# Unir líneas
$content = $newLines -join "`n"

# Ahora eliminar toda la función modal (desde línea 7278 hasta encontrar el final)
$lines = $content -split "`n"
$newLines = @()
$skipMode = $false
$skipCount = 0

for($i=0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Detectar inicio de la función modal
    if($line -match '// Modal para mejorar plan cuando se acercan') {
        $skipMode = $true
        continue
    }
    
    # Si estamos en skip mode, contar funciones
    if($skipMode) {
        if($line -match 'function contactarParaUpgrade') {
            # Encontrar el cierre de esta función
            $braceCount = 0
            $foundStart = $false
            for($j=$i; $j -lt $lines.Count; $j++) {
                if($lines[$j] -match '\{') { $braceCount++; $foundStart = $true }
                if($lines[$j] -match '\}') { $braceCount-- }
                if($foundStart -and $braceCount -eq 0) {
                    $i = $j
                    $skipMode = $false
                    break
                }
            }
            continue
        }
        continue
    }
    
    $newLines += $line
}

# Guardar
$content = $newLines -join "`n"
Set-Content $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "Limpieza completada"
