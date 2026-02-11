// Script para agregar backup automático al iniciar sesión como admin
const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Buscar línea por línea
const lines = content.split('\n');
const newLines = [];
let found = false;

for (let i = 0; i < lines.length; i++) {
    newLines.push(lines[i]);
    
    if (lines[i].includes('renderAdminUsuarios();') && 
        lines[i+1] && lines[i+1].includes("loader.style.display = 'none'")) {
        
        found = true;
        console.log('✅ Encontrado en línea', i+1);
        
        // Agregar después de loader.style.display = 'none';
        newLines.push(lines[i+1]); // loader.style.display = 'none';
        newLines.push('                ');
        newLines.push('                // Crear backup automático del sistema al iniciar sesión');
        newLines.push('                console.log(\'🔄 Creando backup automático del sistema...\');');
        newLines.push('                crearBackupAutomatico();');
        
        i++; // Saltar la línea que ya agregamos
    }
}

if (found) {
    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Backup automático agregado al login del admin');
} else {
    console.log('❌ No se encontró el patrón');
}
