const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Remove broken Service Worker registration around line 16098-16104
content = content.replace(
    /\/\/ Registrar nuevo Service Worker\s+\/\/ Service Worker DISABLED\s+\.then\(reg => \{\s+reg\.update\(\);\s+console\.log\('Service Worker actualizado'\);\s+\}\)\s+\.catch\(err => console\.log\('Error SW:', err\)\);/gs,
    '// Service Worker DISABLED - No registration needed'
);

// Fix 2: Ensure the Service Worker section is clean
content = content.replace(
    /\/\/ Limpiar Service Worker viejo y forzar actualización\s+if \('serviceWorker' in navigator\) \{\s+navigator\.serviceWorker\.getRegistrations\(\)\.then\(registrations => \{\s+registrations\.forEach\(reg => reg\.unregister\(\)\);\s+\}\);\s+\/\/ Registrar nuevo Service Worker\s+\/\/ Service Worker DISABLED\s+\.then\(reg => \{\s+reg\.update\(\);\s+console\.log\('Service Worker actualizado'\);\s+\}\)\s+\.catch\(err => console\.log\('Error SW:', err\)\);\s+\}/gs,
    `// Service Worker DISABLED - Clean up old registrations only
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(reg => reg.unregister());
                    console.log('Service Workers unregistered');
                });
            }`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed Service Worker code');
