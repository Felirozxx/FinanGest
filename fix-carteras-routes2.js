const fs = require('fs');

let content = fs.readFileSync('public/index.html', 'utf8');

// Fix: Falta comilla en carteras eliminadas
content = content.replace(
    /carteras\?action=eliminadas&userId= \+ currentUser\.id/g,
    "carteras?action=eliminadas&userId=' + currentUser.id"
);

fs.writeFileSync('public/index.html', content, 'utf8');
console.log('✅ Comilla arreglada en carteras eliminadas');
