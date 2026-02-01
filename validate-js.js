const fs = require('fs');

const content = fs.readFileSync('public/index.html', 'utf8');

// Extract all script content
const scriptMatches = content.match(/<script>([\s\S]*?)<\/script>/g);

if (scriptMatches) {
    scriptMatches.forEach((script, index) => {
        const jsCode = script.replace(/<\/?script>/g, '');
        const tempFile = `temp-script-${index}.js`;
        
        fs.writeFileSync(tempFile, jsCode, 'utf8');
        
        try {
            require('child_process').execSync(`node -c ${tempFile}`, { stdio: 'pipe' });
            console.log(`✅ Script ${index} is valid`);
        } catch (error) {
            console.log(`❌ Script ${index} has syntax error:`);
            console.log(error.stderr.toString());
        }
        
        fs.unlinkSync(tempFile);
    });
}
