$file = "public/index.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Buscar y reemplazar el div de clients con contenido estático por uno vacío
$pattern = '<div id="clients-\$\{u\.id\}" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid var\(--border-color\);">[\s\S]*?`\}\)\.join\(''''\)\}[\s\S]*?</div>'
$replacement = '<div id="clients-${u.id}" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);"></div>'

$content = $content -replace $pattern, $replacement

Set-Content $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "Contenido de clientes reemplazado por carga dinamica"
