// Script para agregar la función crearBackupAutomatico
const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Buscar línea por línea
const lines = content.split('\n');
const newLines = [];
let found = false;

for (let i = 0; i < lines.length; i++) {
    newLines.push(lines[i]);
    
    if (lines[i].includes('async function restaurarBackupGeneral(backupId)')) {
        found = true;
        console.log('✅ Encontrado en línea', i+1);
        
        // Insertar la nueva función ANTES de restaurarBackupGeneral
        newLines.pop(); // Quitar la línea que acabamos de agregar
        newLines.push('');
        newLines.push('        async function crearBackupAutomatico() {');
        newLines.push('            // Crear backup silencioso al iniciar sesión (sin confirmación)');
        newLines.push('            try {');
        newLines.push('                const res = await fetch(API_URL + \'/api/admin/backup\', {');
        newLines.push('                    method: \'POST\',');
        newLines.push('                    headers: { \'Content-Type\': \'application/json\' },');
        newLines.push('                    body: JSON.stringify({ tipo: \'auto-login\' })');
        newLines.push('                });');
        newLines.push('                const data = await res.json();');
        newLines.push('                if (data.success) {');
        newLines.push('                    console.log(\'✅ Backup automático del sistema creado\');');
        newLines.push('                } else {');
        newLines.push('                    console.warn(\'⚠️ Error creando backup automático:\', data.error);');
        newLines.push('                }');
        newLines.push('            } catch (e) {');
        newLines.push('                console.error(\'❌ Error en backup automático:\', e);');
        newLines.push('            }');
        newLines.push('        }');
        newLines.push('');
        newLines.push(lines[i]); // Agregar la línea de restaurarBackupGeneral
    }
}

if (found) {
    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Función crearBackupAutomatico agregada');
} else {
    console.log('❌ No se encontró el patrón');
}
