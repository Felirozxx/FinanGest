# Script para eliminar boton Mejorar y funcion modal
$file = "public/index.html"
$content = Get-Content $file -Raw -Encoding UTF8

# 1. Eliminar boton Mejorar del header
$content = $content -replace '\$\{s\.planActual !== ''enterprise'' \? ''<button onclick="mostrarModalUpgradePlan\(\)" class="btn btn-sm" style="background: var\(--accent-purple\); color: #fff;"><i class="fas fa-rocket me-1"></i>Mejorar</button>'' : ''''\}', ''

# 2. Eliminar boton grande Mejorar Plan - Aumentar Limites
$content = $content -replace '<button onclick="mostrarModalUpgradePlan\(\)"[^>]*>[\s\S]*?Mejorar Plan - Aumentar Límites[\s\S]*?</button>', ''

# 3. Cambiar texto de Netlify a Vercel
$content = $content -replace 'Netlify</a> y <a href="https://cloud\.mongodb\.com"', 'Vercel</a> (<a href="https://vercel.com/dashboard" target="_blank" style="color: var(--accent-cyan);">Dashboard</a>) y <a href="https://cloud.mongodb.com"'

# 4. Eliminar toda la funcion mostrarModalUpgradePlan y relacionadas
$content = $content -replace '(?s)// Modal para mejorar plan cuando se acercan a los límites.*?function contactarParaUpgrade\(plan\) \{[\s\S]*?\n        \}', ''

# Guardar
Set-Content $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "Boton Mejorar eliminado correctamente"
