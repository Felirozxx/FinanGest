const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Remove orphan html += '</div>'; line after Firebase removal
content = content.replace(
    /\/\/ Firebase removed - MongoDB only\s+html \+= '<\/div>';/g,
    '// Firebase removed - MongoDB only'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed orphan code line');
