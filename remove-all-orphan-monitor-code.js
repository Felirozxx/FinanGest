const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Remove all the orphan server monitor code after Firebase removal
// This includes the html += template literal and the catch block
content = content.replace(
    /\/\/ Firebase removed - MongoDB only\s+html \+= `[\s\S]*?container\.innerHTML = html;\s+\} catch \(error\) \{[\s\S]*?<\/div>[\s\S]*?`;[\s\S]*?\}/g,
    '// Firebase removed - MongoDB only\n        // Server monitor code removed'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Removed all orphan server monitor code');
