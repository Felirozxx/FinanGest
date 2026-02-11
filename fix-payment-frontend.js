// Script para arreglar el frontend del sistema de pagos
const fs = require('fs');

console.log('📝 Leyendo public/index.html...');
let content = fs.readFileSync('public/index.html', 'utf8');

console.log('🔧 Aplicando fixes...');

// Fix 1: Guardar userId en pendingUser después de verificar código
content = content.replace(
    /pendingUser = \{ \.\.\.data\.user, email, recoveryEmail, timezone \};/g,
    'pendingUser = { ...data.user, id: data.userId || (data.user && data.user.id), email, recoveryEmail, timezone };'
);

// Fix 2: Usar pendingUser.id en generarPagoPix (primera ocurrencia - después de verificar)
content = content.replace(
    /\/\/ Generar PIX \(sin userId porque la cuenta no existe aún\)\s*generarPagoPix\(null, nombre, email\);/,
    '// Generar PIX con userId\n                    if (pendingUser && pendingUser.id) {\n                        generarPagoPix(pendingUser.id, nombre, email);\n                    } else {\n                        console.error("No userId available after verification");\n                        alert("Error: No se pudo obtener el ID de usuario");\n                    }'
);

// Fix 3: Usar pendingUser.id en regenerar PIX (cuando cambia cantidad de carteras)
content = content.replace(
    /generarPagoPix\(null, pendingUser\.nombre, pendingUser\.email\);/g,
    'generarPagoPix(pendingUser.id, pendingUser.nombre, pendingUser.email);'
);

console.log('💾 Guardando cambios...');
fs.writeFileSync('public/index.html', content, 'utf8');

console.log('✅ Fixes aplicados correctamente');
console.log('\nCambios realizados:');
console.log('1. pendingUser ahora guarda el userId');
console.log('2. generarPagoPix usa pendingUser.id en lugar de null');
console.log('3. Agregado manejo de errores si no hay userId');
