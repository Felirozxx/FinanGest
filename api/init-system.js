// Endpoint para inicializar configuración del sistema
// Se ejecuta una vez para configurar valores por defecto
const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { db } = await connectToDatabase();

        // Verificar si ya está inicializado
        const existingConfig = await db.collection('system_config').findOne({ key: 'system_initialized' });
        
        if (existingConfig && existingConfig.value === true) {
            return res.json({
                success: true,
                message: 'Sistema ya inicializado',
                alreadyInitialized: true
            });
        }

        console.log('🚀 Inicializando configuración del sistema...');

        // Configurar actualizaciones automáticas (HABILITADAS por defecto)
        await db.collection('system_config').updateOne(
            { key: 'auto_updates' },
            { 
                $set: { 
                    enabled: true,
                    config: {
                        checkFrequency: 'weekly',
                        autoApply: 'security-only',
                        backupBeforeUpdate: true,
                        notifyAdmin: true
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                } 
            },
            { upsert: true }
        );

        // Configurar políticas de seguridad por defecto
        await db.collection('system_config').updateOne(
            { key: 'security_policies' },
            {
                $set: {
                    passwordMinLength: 6,
                    passwordExpiration: 0,
                    maxLoginAttempts: 5,
                    sessionTimeout: 30,
                    maxSessions: 3,
                    requireUppercase: false,
                    requireNumber: false,
                    requireSpecial: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        // Marcar sistema como inicializado
        await db.collection('system_config').updateOne(
            { key: 'system_initialized' },
            { 
                $set: { 
                    value: true,
                    timestamp: new Date()
                } 
            },
            { upsert: true }
        );

        console.log('✅ Sistema inicializado correctamente');

        return res.json({
            success: true,
            message: 'Sistema inicializado correctamente',
            config: {
                autoUpdates: true,
                securityPolicies: true
            }
        });

    } catch (error) {
        console.error('❌ Error inicializando sistema:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
