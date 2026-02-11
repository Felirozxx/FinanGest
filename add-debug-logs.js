// Agregar logs de debug al frontend
const fs = require('fs');

console.log('📝 Agregando logs de debug...');
let content = fs.readFileSync('public/index.html', 'utf8');

// Agregar log después de verificar código
content = content.replace(
    /pendingUser = \{ \.\.\.data\.user, id: data\.userId \|\| \(data\.user && data\.user\.id\), email, recoveryEmail, timezone \};/,
    `pendingUser = { ...data.user, id: data.userId || (data.user && data.user.id), email, recoveryEmail, timezone };
                    console.log('✅ Código verificado. pendingUser:', pendingUser);
                    console.log('   data.userId:', data.userId);
                    console.log('   data.user:', data.user);`
);

// Agregar log antes de generar pago
content = content.replace(
    /\/\/ Generar PIX con userId\s*if \(pendingUser && pendingUser\.id\) \{/,
    `// Generar PIX con userId
                    console.log('💳 Generando pago con userId:', pendingUser?.id);
                    if (pendingUser && pendingUser.id) {`
);

fs.writeFileSync('public/index.html', content, 'utf8');
console.log('✅ Logs agregados');
