// Script para ocultar el selector de carteras para el admin
const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Buscar el comentario específico
const searchText = '// Restaurar sección guardada o ir a Usuarios por defecto';

if (content.includes(searchText)) {
    // Insertar antes de ese comentario
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(searchText)) {
            // Insertar las nuevas líneas antes
            newLines.push('                // Ocultar selector de carteras para admin');
            newLines.push("                const carteraBtn = document.getElementById('carteraBtn');");
            newLines.push('                if (carteraBtn) carteraBtn.style.display = \'none\';');
        }
        newLines.push(lines[i]);
    }
    
    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Archivo actualizado correctamente');
} else {
    console.log('❌ No se encontró el texto de búsqueda');
}
