// Script para precargar las carteras de todos los usuarios en renderAdminUsuarios
const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Buscar la línea específica
const searchText = '                adminAllClients = allClients;';

if (content.includes(searchText)) {
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        newLines.push(lines[i]);
        
        if (lines[i].trim() === 'adminAllClients = allClients;') {
            // Insertar después de esta línea
            newLines.push('                ');
            newLines.push('                // Precargar carteras de todos los trabajadores para evitar demoras');
            newLines.push('                const workers = allUsers.filter(u => u.role !== \'admin\' && !u.isAdmin);');
            newLines.push('                const carterasPromises = workers.map(w => ');
            newLines.push('                    fetch(API_URL + \'/api/carteras/\' + (w.id || w._id))');
            newLines.push('                        .then(res => res.json())');
            newLines.push('                        .then(data => ({ userId: w.id || w._id, carteras: data.success ? data.carteras : [] }))');
            newLines.push('                        .catch(() => ({ userId: w.id || w._id, carteras: [] }))');
            newLines.push('                );');
            newLines.push('                const carterasResults = await Promise.all(carterasPromises);');
            newLines.push('                ');
            newLines.push('                // Guardar en un objeto global para acceso rápido');
            newLines.push('                window.adminCarterasCache = {};');
            newLines.push('                carterasResults.forEach(result => {');
            newLines.push('                    window.adminCarterasCache[result.userId] = result.carteras;');
            newLines.push('                });');
            newLines.push('                console.log(\'📁 Carteras precargadas:\', Object.keys(window.adminCarterasCache).length, \'usuarios\');');
        }
    }
    
    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Archivo actualizado - carteras se precargarán al inicio');
} else {
    console.log('❌ No se encontró el texto de búsqueda');
}
