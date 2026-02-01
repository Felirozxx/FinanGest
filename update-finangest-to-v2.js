const fs = require('fs');

const filePath = 'public/finangest.html';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all /api/carteras with /api/carteras-v2
content = content.replace(/\/api\/carteras(?!-)/g, '/api/carteras-v2');

// Fix the specific problematic routes
content = content.replace(
    "const res = await fetch(API_URL + '/api/carteras-v2-eliminadas?userId=' + currentUser.id);",
    "const res = await fetch(API_URL + '/api/carteras-v2?action=eliminadas&userId=' + currentUser.id);"
);

content = content.replace(
    "const res = await fetch(API_URL + '/api/carteras-v2/' + carteraAEliminar + '/eliminar', {",
    "const res = await fetch(API_URL + '/api/carteras-v2?action=eliminar&id=' + carteraAEliminar, {"
);

content = content.replace(
    "const res = await fetch(API_URL + '/api/carteras-v2/' + carteraId + '/restablecer', {",
    "const res = await fetch(API_URL + '/api/carteras-v2?action=restablecer&id=' + carteraId, {"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated finangest.html to use carteras-v2 API');
