// Script para configurar automáticamente Vercel Cron y variables de entorno
const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   🚀 Configuración Automática de Vercel Cron              ║');
console.log('║   FinanGest - Sistema de Actualizaciones Automáticas      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Función para hacer peticiones a la API de Vercel
function vercelRequest(path, method, data, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.vercel.com',
            path: path,
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Función principal
async function setup() {
    try {
        // Paso 1: Obtener token de Vercel
        console.log('📝 Paso 1: Necesitamos tu token de Vercel\n');
        console.log('   Para obtenerlo:');
        console.log('   1. Ve a: https://vercel.com/account/tokens');
        console.log('   2. Click en "Create Token"');
        console.log('   3. Dale un nombre (ej: "FinanGest Setup")');
        console.log('   4. Copia el token\n');

        const token = await new Promise(resolve => {
            rl.question('   Pega tu token aquí: ', resolve);
        });

        if (!token || token.trim().length < 20) {
            console.log('\n❌ Token inválido. Por favor intenta de nuevo.');
            process.exit(1);
        }

        console.log('\n✅ Token recibido\n');

        // Paso 2: Obtener ID del proyecto
        console.log('📦 Paso 2: Buscando proyecto FinanGest...\n');

        const projects = await vercelRequest('/v9/projects', 'GET', null, token);
        
        if (!projects.projects) {
            console.log('❌ Error obteniendo proyectos:', projects);
            process.exit(1);
        }

        const project = projects.projects.find(p => 
            p.name.toLowerCase().includes('finangest')
        );

        if (!project) {
            console.log('❌ No se encontró el proyecto FinanGest');
            console.log('   Proyectos disponibles:', projects.projects.map(p => p.name).join(', '));
            process.exit(1);
        }

        console.log(`✅ Proyecto encontrado: ${project.name} (ID: ${project.id})\n`);

        // Paso 3: Generar CRON_SECRET
        const cronSecret = 'finangest_cron_' + Math.random().toString(36).substring(2, 15);
        console.log('🔐 Paso 3: Generando CRON_SECRET...\n');
        console.log(`   Secret generado: ${cronSecret}\n`);

        // Paso 4: Agregar variable de entorno
        console.log('⚙️  Paso 4: Configurando variable de entorno...\n');

        const envResult = await vercelRequest(
            `/v10/projects/${project.id}/env`,
            'POST',
            {
                key: 'CRON_SECRET',
                value: cronSecret,
                type: 'encrypted',
                target: ['production', 'preview', 'development']
            },
            token
        );

        if (envResult.error) {
            if (envResult.error.code === 'ENV_ALREADY_EXISTS') {
                console.log('⚠️  CRON_SECRET ya existe. Actualizando...\n');
                
                // Obtener el ID de la variable existente
                const envs = await vercelRequest(
                    `/v9/projects/${project.id}/env`,
                    'GET',
                    null,
                    token
                );
                
                const existingEnv = envs.envs?.find(e => e.key === 'CRON_SECRET');
                
                if (existingEnv) {
                    // Eliminar la variable existente
                    await vercelRequest(
                        `/v9/projects/${project.id}/env/${existingEnv.id}`,
                        'DELETE',
                        null,
                        token
                    );
                    
                    // Crear nueva
                    await vercelRequest(
                        `/v10/projects/${project.id}/env`,
                        'POST',
                        {
                            key: 'CRON_SECRET',
                            value: cronSecret,
                            type: 'encrypted',
                            target: ['production', 'preview', 'development']
                        },
                        token
                    );
                    
                    console.log('✅ CRON_SECRET actualizado\n');
                }
            } else {
                console.log('❌ Error configurando variable:', envResult.error);
                process.exit(1);
            }
        } else {
            console.log('✅ Variable de entorno configurada\n');
        }

        // Paso 5: Trigger redeploy
        console.log('🚀 Paso 5: Iniciando redeploy para activar Cron...\n');

        const deployResult = await vercelRequest(
            `/v13/deployments`,
            'POST',
            {
                name: project.name,
                project: project.id,
                target: 'production',
                gitSource: {
                    type: 'github',
                    ref: 'main',
                    repoId: project.link?.repoId
                }
            },
            token
        );

        if (deployResult.error) {
            console.log('⚠️  No se pudo iniciar redeploy automático');
            console.log('   Por favor, ve a Vercel y haz redeploy manualmente\n');
        } else {
            console.log('✅ Redeploy iniciado\n');
        }

        // Resumen final
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║   ✅ CONFIGURACIÓN COMPLETADA                             ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        console.log('📋 Resumen:\n');
        console.log(`   • Proyecto: ${project.name}`);
        console.log(`   • CRON_SECRET: Configurado ✅`);
        console.log(`   • Cron Schedule: Cada lunes a las 2 AM`);
        console.log(`   • Endpoint: /api/cron-updates`);
        console.log(`   • Redeploy: ${deployResult.error ? 'Manual requerido' : 'Iniciado ✅'}\n`);
        console.log('🎯 Próximos pasos:\n');
        console.log('   1. Espera 2-3 minutos a que termine el deploy');
        console.log('   2. Ve a: https://vercel.com/felirozxxs-projects/finangest');
        console.log('   3. Click en "Cron Jobs" para verificar que esté activo');
        console.log('   4. Entra a tu app como admin y ve a "Seguridad"');
        console.log('   5. Verifica que las actualizaciones automáticas estén activas\n');
        console.log('✨ ¡Todo listo! Tu sistema ahora se actualiza automáticamente.\n');

    } catch (error) {
        console.log('\n❌ Error durante la configuración:', error.message);
        console.log('\n💡 Si el error persiste, puedes configurar manualmente:');
        console.log('   1. Ve a: https://vercel.com/felirozxxs-projects/finangest/settings/environment-variables');
        console.log('   2. Agrega: CRON_SECRET = finangest_cron_2024_secure');
        console.log('   3. Haz redeploy del proyecto\n');
    } finally {
        rl.close();
    }
}

// Ejecutar
setup();
