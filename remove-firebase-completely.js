const fs = require('fs');

const filePath = 'public/index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Remove Firebase initialization code
content = content.replace(
    /\/\/ Firebase DISABLED\s+let firebaseApp = null;\s+let firebaseMessaging = null;/g,
    '// Firebase completely removed - MongoDB only'
);

// Remove Firebase subscription function
content = content.replace(
    /\/\/ Función para suscribirse a notificaciones push\s+async function subscribeToPushNotifications\(\) \{[\s\S]*?return null;\s+\}/g,
    '// Push notifications disabled - MongoDB only\n        async function subscribeToPushNotifications() {\n            console.log("Push notifications disabled");\n            return null;\n        }'
);

// Remove Firebase message handler
content = content.replace(
    /\/\/ Manejar mensajes en primer plano\s+if \(firebaseMessaging\) \{[\s\S]*?\}\);?\s+\}/g,
    '// Firebase messaging removed'
);

// Remove Firebase subscription call
content = content.replace(
    /\/\/ Suscribirse a notificaciones push de Firebase\s+setTimeout\(async \(\) => \{\s+try \{[\s\S]*?\}, 2000\);/g,
    '// Push notifications disabled'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Removed all Firebase code - MongoDB only');
