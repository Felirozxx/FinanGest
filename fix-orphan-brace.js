const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Remove the orphan closing brace
content = content.replace(
    /\/\/ Firebase removed - MongoDB only\s+\/\/ Server monitor code removed\s+\}/g,
    '// Firebase removed - MongoDB only\n        // Server monitor code removed'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Removed orphan closing brace');
