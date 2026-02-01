const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Add version timestamp at the top of the script
const timestamp = new Date().toISOString();
const versionLog = `console.log('🔵 FinanGest Version:', '${timestamp}', 'Commit: 65bd30f');`;

// Find the first <script> tag and add version log
content = content.replace(
    /<script>/,
    `<script>\n        ${versionLog}\n`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Added version timestamp:', timestamp);
