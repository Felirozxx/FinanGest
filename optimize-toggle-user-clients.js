// Script para usar el caché de carteras en toggleUserClients
const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Buscar línea por línea
const lines = content.split('\n');
const newLines = [];
let found = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// Cargar carteras del usuario') && 
        lines[i+1] && lines[i+1].includes('const carterasRes = await fetch(API_URL')) {
        
        found = true;
        console.log('✅ Encontrado en línea', i+1);
        
        // Reemplazar las siguientes 3 líneas
        newLines.push(lines[i].replace('// Cargar carteras del usuario', '// Usar caché si está disponible, sino cargar desde API'));
        newLines.push(lines[i].replace(/.*/, '                        let carteras = [];'));
        newLines.push(lines[i].replace(/.*/, '                        if (window.adminCarterasCache && window.adminCarterasCache[userId]) {'));
        newLines.push(lines[i].replace(/.*/, '                            console.log(\'📦 Usando carteras del caché para\', userId);'));
        newLines.push(lines[i].replace(/.*/, '                            carteras = window.adminCarterasCache[userId];'));
        newLines.push(lines[i].replace(/.*/, '                        } else {'));
        newLines.push(lines[i].replace(/.*/, '                            console.log(\'📡 Cargando carteras desde API para\', userId);'));
        newLines.push(lines[i+1]); // const carterasRes = ...
        newLines.push(lines[i+2]); // const carterasData = ...
        newLines.push(lines[i+3].replace('const carteras =', '                            carteras ='));
        newLines.push(lines[i].replace(/.*/, '                        }'));
        
        // Saltar las líneas originales
        i += 3;
    } else {
        newLines.push(lines[i]);
    }
}

if (found) {
    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Archivo actualizado - toggleUserClients usará el caché');
} else {
    console.log('❌ No se encontró el patrón');
}
