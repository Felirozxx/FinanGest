// Script para agregar la función crearBackupTrabajadorAutomatico
const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Buscar línea por línea
const lines = content.split('\n');
const newLines = [];
let found = false;

for (let i = 0; i < lines.length; i++) {
    newLines.push(lines[i]);
    
    if (lines[i].includes('async function crearMiBackup()')) {
        found = true;
        console.log('✅ Encontrado en línea', i+1);
        
        // Insertar la nueva función ANTES de crearMiBackup
        newLines.pop(); // Quitar la línea que acabamos de agregar
        newLines.push('');
        newLines.push('        async function crearBackupTrabajadorAutomatico() {');
        newLines.push('            // Crear backup silencioso individual al iniciar sesión (sin confirmación)');
        newLines.push('            try {');
        newLines.push('                // Verificar si backups están bloqueados');
        newLines.push('                const usersRes = await fetch(API_URL + \'/api/users\');');
        newLines.push('                const allUsers = await usersRes.json();');
        newLines.push('                const myUser = allUsers.find(u => u.id === currentUser.id || u._id === currentUser.id);');
        newLines.push('                ');
        newLines.push('                if (myUser?.backupBlocked) {');
        newLines.push('                    console.log(\'🔒 Backups bloqueados por admin\');');
        newLines.push('                    return;');
        newLines.push('                }');
        newLines.push('                ');
        newLines.push('                // Crear backup individual');
        newLines.push('                const userId = currentUser.id || currentUser._id;');
        newLines.push('                const res = await fetch(API_URL + \'/api/admin/backup-trabajador/\' + userId, { method: \'POST\' });');
        newLines.push('                const data = await res.json();');
        newLines.push('                ');
        newLines.push('                if (data.success) {');
        newLines.push('                    console.log(\'✅ Backup automático individual creado\');');
        newLines.push('                } else {');
        newLines.push('                    console.warn(\'⚠️ Error creando backup individual:\', data.error);');
        newLines.push('                }');
        newLines.push('            } catch (e) {');
        newLines.push('                console.error(\'❌ Error en backup automático individual:\', e);');
        newLines.push('            }');
        newLines.push('        }');
        newLines.push('');
        newLines.push(lines[i]); // Agregar la línea de crearMiBackup
    }
}

if (found) {
    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Función crearBackupTrabajadorAutomatico agregada');
} else {
    console.log('❌ No se encontró el patrón');
}
