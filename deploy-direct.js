const https = require('https');
const fs = require('fs');

const token = 'NsuVJoslQ8Br2vwdL4Uy7ZJr';

// Leer el archivo index.html
const indexContent = fs.readFileSync('public/index.html', 'utf8');

console.log('Creando despliegue en Vercel...');
console.log('Tamaño del archivo:', indexContent.length);

const files = [
    {
        file: 'index.html',
        data: Buffer.from(indexContent).toString('base64')
    }
];

const deploymentData = JSON.stringify({
    name: 'finangest',
    files: files,
    projectSettings: {
        framework: null
    },
    target: 'production'
});

const options = {
    hostname: 'api.vercel.com',
    port: 443,
    path: '/v13/deployments',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': deploymentData.length
    }
};

const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        
        try {
            const response = JSON.parse(data);
            if (response.url) {
                console.log('\n✓ Despliegue exitoso!');
                console.log('URL:', response.url);
            } else if (response.error) {
                console.log('\n✗ Error:', response.error.message);
            }
        } catch (e) {
            console.log('Error parseando respuesta:', e.message);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(deploymentData);
req.end();
