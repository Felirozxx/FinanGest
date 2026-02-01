const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: carteras-v2-eliminadas typo
content = content.replace(
    "const res = await fetch(API_URL + '/api/carteras-v2-eliminadas?userId=' + currentUser.id);",
    "const res = await fetch(API_URL + '/api/carteras-v2?action=eliminadas&userId=' + currentUser.id);"
);

// Fix 2: eliminar path to query params
content = content.replace(
    "const res = await fetch(API_URL + '/api/carteras-v2/' + carteraAEliminar + '/eliminar', {",
    "const res = await fetch(API_URL + '/api/carteras-v2?action=eliminar&id=' + carteraAEliminar, {"
);

// Fix 3: restablecer path to query params
content = content.replace(
    "const res = await fetch(API_URL + '/api/carteras-v2/' + carteraId + '/restablecer', {",
    "const res = await fetch(API_URL + '/api/carteras-v2?action=restablecer&id=' + carteraId, {"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed 3 API route issues in index.html');
