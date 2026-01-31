const fs = require('fs');

let content = fs.readFileSync('public/index.html', 'utf8');

// Fix 1: Eliminar cartera
content = content.replace(
    /fetch\(API_URL \+ '\/api\/carteras\/' \+ carteraAEliminar \+ '\/eliminar'/g,
    "fetch(API_URL + '/api/carteras?action=eliminar&id=' + carteraAEliminar"
);

// Fix 2: Carteras eliminadas
content = content.replace(
    /fetch\(API_URL \+ '\/api\/carteras-eliminadas\?userId='/g,
    "fetch(API_URL + '/api/carteras?action=eliminadas&userId="
);

// Fix 3: Restablecer cartera
content = content.replace(
    /fetch\(API_URL \+ '\/api\/carteras\/' \+ carteraId \+ '\/restablecer'/g,
    "fetch(API_URL + '/api/carteras?action=restablecer&id=' + carteraId"
);

fs.writeFileSync('public/index.html', content, 'utf8');
console.log('✅ Rutas de carteras arregladas');
