const fs = require('fs');

// Leer el index.html y extraer todos los fetch calls
const html = fs.readFileSync('public/index.html', 'utf8');

// Regex para encontrar todos los fetch calls
const fetchRegex = /fetch\(API_URL \+ '(\/api\/[^']+)'/g;
const endpoints = new Set();

let match;
while ((match = fetchRegex.exec(html)) !== null) {
    endpoints.add(match[1]);
}

console.log('📋 ENDPOINTS ENCONTRADOS EN EL FRONTEND:\n');
console.log('Total:', endpoints.size);
console.log('\n');

// Agrupar por categoría
const categorized = {
    '/api/admin': [],
    '/api/carteras': [],
    '/api/clientes': [],
    '/api/gastos': [],
    '/api/users': [],
    '/api/sessions': [],
    '/api/login': [],
    'otros': []
};

endpoints.forEach(endpoint => {
    let added = false;
    for (const category in categorized) {
        if (category !== 'otros' && endpoint.startsWith(category)) {
            categorized[category].push(endpoint);
            added = true;
            break;
        }
    }
    if (!added) {
        categorized.otros.push(endpoint);
    }
});

// Mostrar por categoría
for (const [category, items] of Object.entries(categorized)) {
    if (items.length > 0) {
        console.log(`\n${category}:`);
        items.sort().forEach(item => console.log(`  - ${item}`));
    }
}

// Verificar qué archivos API existen
console.log('\n\n📁 ARCHIVOS API EXISTENTES:\n');
const apiFiles = fs.readdirSync('api').filter(f => f.endsWith('.js') && !f.startsWith('_'));
apiFiles.forEach(file => console.log(`  ✓ api/${file}`));

console.log('\n\n⚠️  ENDPOINTS QUE PUEDEN NECESITAR REVISIÓN:\n');

// Endpoints que probablemente no existen
const potentiallyMissing = [
    '/api/heartbeat',
    '/api/server-time',
    '/api/push-token',
    '/api/forgot-password',
    '/api/reset-password',
    '/api/send-code',
    '/api/verify-code',
    '/api/crear-pago-pix',
    '/api/verificar-pago',
    '/api/renovar-carteras',
    '/api/solicitar-acceso-admin',
    '/api/reset-datos-usuario'
];

potentiallyMissing.forEach(endpoint => {
    if (Array.from(endpoints).some(e => e.includes(endpoint))) {
        console.log(`  ⚠️  ${endpoint} - Verificar si existe`);
    }
});
