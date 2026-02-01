const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Remove all orphan backend health check code that's not inside a function
content = content.replace(
    /\/\/ Firebase removed - MongoDB only\s+\/\/ Estado general del sistema\s+const allHealthy = mongo\.healthy;\s+const systemStatus = mongo\.healthy \? 'MongoDB operativo' : 'MongoDB fuera de línea';\s+const systemColor = mongo\.healthy \? 'var\(--accent-green\)' : 'var\(--accent-red\)';/g,
    '// Firebase removed - MongoDB only'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Removed orphan backend code');
