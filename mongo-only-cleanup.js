const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Remove Supabase card from server monitor (lines ~14069-14094)
content = content.replace(
    /\/\/ Supabase[\s\S]*?const supabase = backends\.supabase \|\| \{\};[\s\S]*?const supabaseActive = currentBackend === 'supabase';[\s\S]*?html \+= `[\s\S]*?<div class="col-md-4 mb-3">[\s\S]*?<h5 class="mb-1">Supabase PostgreSQL<\/h5>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?`;/g,
    '// Supabase removed - MongoDB only'
);

// Remove Firebase card from server monitor (lines ~14114-14138)
content = content.replace(
    /\/\/ Firebase[\s\S]*?const firebase = backends\.firebase \|\| \{\};[\s\S]*?const firebaseActive = currentBackend === 'firebase';[\s\S]*?html \+= `[\s\S]*?<div class="col-md-4 mb-3">[\s\S]*?<h5 class="mb-1">Firebase Firestore<\/h5>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?`;/g,
    '// Firebase removed - MongoDB only'
);

// Simplify system health check to only check MongoDB
content = content.replace(
    /const allHealthy = mongo\.healthy && supabase\.healthy && firebase\.healthy;/g,
    'const allHealthy = mongo.healthy;'
);

content = content.replace(
    /const systemStatus = allHealthy \? 'Todos los servidores operativos' :[\s\S]*?mongo\.healthy \? 'Sistema operativo \(servidor principal activo\)' :[\s\S]*?supabase\.healthy \? 'Sistema operativo \(usando servidor de respaldo\)' :[\s\S]*?firebase\.healthy \? 'Sistema operativo \(usando servidor de seguridad\)' :[\s\S]*?'Sistema degradado - Todos los servidores fuera de línea';/g,
    "const systemStatus = mongo.healthy ? 'MongoDB operativo' : 'MongoDB fuera de línea';"
);

content = content.replace(
    /const systemColor = allHealthy \? 'var\(--accent-green\)' :[\s\S]*?\(mongo\.healthy \|\| supabase\.healthy \|\| firebase\.healthy\) \? 'var\(--accent-yellow\)' :[\s\S]*?'var\(--accent-red\)';/g,
    "const systemColor = mongo.healthy ? 'var(--accent-green)' : 'var(--accent-red)';"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Removed Supabase and Firebase - MongoDB ONLY');
