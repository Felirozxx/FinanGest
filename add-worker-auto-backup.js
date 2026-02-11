// Script para agregar backup automático individual para trabajadores
const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Buscar línea por línea
const lines = content.split('\n');
const newLines = [];
let found = false;

for (let i = 0; i < lines.length; i++) {
    newLines.push(lines[i]);
    
    // Buscar donde se inicializa el sistema de notificaciones para trabajadores
    if (lines[i].includes('initNotificationSystem();') && 
        lines[i+1] && lines[i+1].includes('// Iniciar sistema de cierre nocturno')) {
        
        found = true;
        console.log('✅ Encontrado en línea', i+1);
        
        // Agregar después de initNotificationSystem()
        newLines.push('                                // Crear backup automático individual del trabajador');
        newLines.push('                                console.log(\'🔄 Creando backup automático individual...\');');
        newLines.push('                                crearBackupTrabajadorAutomatico();');
    }
}

if (found) {
    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Backup automático agregado para trabajadores');
} else {
    console.log('❌ No se encontró el patrón');
}
