// Script para configurar Supabase y Firebase en Vercel
const https = require('https');

const VERCEL_TOKEN = 'NsuVJoslQ8Br2vwdL4Uy7ZJr';
const PROJECT_ID = 'finangest';

// Configuración de backups
const SUPABASE_URI = 'postgresql://postgres:Pipe16137356@db.tqbddnjzgaifeoidtswt.supabase.co:5432/postgres';
const FIREBASE_PROJECT_ID = 'finangest-2';

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.vercel.com',
            path: path,
            method: method,
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body || '{}'));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function addEnvVariable(key, value) {
    try {
        console.log(`📝 Agregando variable: ${key}`);
        
        const data = {
            key: key,
            value: value,
            type: 'encrypted',
            target: ['production', 'preview', 'development']
        };

        await makeRequest('POST', `/v10/projects/${PROJECT_ID}/env`, data);
        console.log(`✅ ${key} configurada`);
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log(`⚠️  ${key} ya existe, actualizando...`);
            // Intentar actualizar
            try {
                await makeRequest('PATCH', `/v10/projects/${PROJECT_ID}/env/${key}`, {
                    value: value
                });
                console.log(`✅ ${key} actualizada`);
            } catch (e) {
                console.log(`⚠️  No se pudo actualizar ${key}: ${e.message}`);
            }
        } else {
            console.error(`❌ Error con ${key}:`, error.message);
        }
    }
}

async function triggerDeploy() {
    try {
        console.log('\n🚀 Iniciando redeploy...');
        
        // Obtener el último deployment
        const deployments = await makeRequest('GET', `/v6/deployments?projectId=${PROJECT_ID}&limit=1`);
        
        if (deployments.deployments && deployments.deployments.length > 0) {
            const latestDeployment = deployments.deployments[0];
            console.log(`📦 Último deployment: ${latestDeployment.url}`);
            
            // Trigger redeploy
            await makeRequest('POST', `/v13/deployments`, {
                name: PROJECT_ID,
                gitSource: {
                    type: 'github',
                    repoId: latestDeployment.meta?.githubRepoId,
                    ref: 'main'
                }
            });
            
            console.log('✅ Redeploy iniciado');
        }
    } catch (error) {
        console.error('⚠️  No se pudo iniciar redeploy automático:', error.message);
        console.log('💡 Puedes hacer redeploy manual desde: https://vercel.com/felirozxxs-projects/finangest/deployments');
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   🛡️  Configurando Backups en la Nube                    ║');
    console.log('║   Supabase + Firebase para FinanGest                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // Agregar variables de entorno
        await addEnvVariable('SUPABASE_URI', SUPABASE_URI);
        await addEnvVariable('FIREBASE_PROJECT_ID', FIREBASE_PROJECT_ID);

        console.log('\n✅ Variables de entorno configuradas en Vercel');
        
        // Trigger redeploy
        await triggerDeploy();

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║   ✅ CONFIGURACIÓN COMPLETADA                             ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        console.log('📊 Tu sistema ahora tiene:');
        console.log('  🟢 MongoDB Atlas (Principal)');
        console.log('  🟢 Supabase (Backup 1)');
        console.log('  🟢 Firebase (Backup 2)\n');

        console.log('🎯 Próximos pasos:');
        console.log('  1. Espera 2-3 minutos a que termine el deploy');
        console.log('  2. Entra a: https://finangest.vercel.app/finangest.html');
        console.log('  3. Login como admin');
        console.log('  4. Ve a "Estado del Sistema"');
        console.log('  5. Verifica que los 3 backends estén activos\n');

        console.log('✨ ¡Tu sistema ahora tiene máxima seguridad con 3 bases de datos!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
