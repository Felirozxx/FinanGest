// Cron job para verificar actualizaciones automáticamente cada semana
// Este endpoint se ejecutará automáticamente mediante Vercel Cron
const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
    // Verificar que la petición viene de Vercel Cron
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { db } = await connectToDatabase();

        // Verificar si las actualizaciones automáticas están habilitadas
        const config = await db.collection('system_config').findOne({ key: 'auto_updates' });
        
        if (!config || !config.enabled) {
            return res.json({ 
                success: true, 
                message: 'Actualizaciones automáticas deshabilitadas',
                skipped: true 
            });
        }

        console.log('🔍 Verificando actualizaciones de seguridad...');

        // Verificar actualizaciones disponibles
        const updates = await verificarActualizacionesNPM();

        // Registrar verificación
        await db.collection('security_updates').insertOne({
            timestamp: new Date(),
            type: 'automatic_check',
            status: 'completed',
            updatesFound: updates.length,
            criticalUpdates: updates.filter(u => u.severity === 'critical').length,
            updates: updates
        });

        // Si hay actualizaciones críticas, notificar al admin
        const criticalUpdates = updates.filter(u => u.severity === 'critical');
        if (criticalUpdates.length > 0) {
            console.log(`⚠️ ${criticalUpdates.length} actualización(es) crítica(s) encontrada(s)`);
            
            // Enviar notificación al admin
            await notificarAdmin(db, criticalUpdates);
        }

        return res.json({
            success: true,
            message: 'Verificación completada',
            updatesFound: updates.length,
            criticalUpdates: criticalUpdates.length,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('❌ Error en cron de actualizaciones:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Verificar actualizaciones en npm
async function verificarActualizacionesNPM() {
    // Simular verificación de actualizaciones
    // En producción, esto ejecutaría: npm outdated --json
    const updates = [];

    // Verificar paquetes críticos
    const packagesToCheck = [
        { name: 'mongodb', current: '6.3.0', latest: '6.5.0', severity: 'moderate' },
        { name: 'express', current: '4.18.0', latest: '4.18.2', severity: 'low' }
    ];

    for (const pkg of packagesToCheck) {
        if (pkg.current !== pkg.latest) {
            updates.push({
                package: pkg.name,
                currentVersion: pkg.current,
                latestVersion: pkg.latest,
                severity: pkg.severity,
                description: `Actualización disponible para ${pkg.name}`,
                cve: null
            });
        }
    }

    return updates;
}

// Notificar al admin sobre actualizaciones críticas
async function notificarAdmin(db, criticalUpdates) {
    try {
        // Buscar admin
        const admin = await db.collection('users').findOne({ 
            $or: [
                { role: 'admin' },
                { isAdmin: true },
                { email: 'fzuluaga548@gmail.com' }
            ]
        });

        if (!admin) {
            console.log('⚠️ Admin no encontrado para notificar');
            return;
        }

        // Crear notificación en la base de datos
        await db.collection('notifications').insertOne({
            userId: admin._id.toString(),
            type: 'security_update',
            title: '⚠️ Actualizaciones Críticas Disponibles',
            message: `Se encontraron ${criticalUpdates.length} actualización(es) crítica(s) de seguridad. Revisa el panel de administración.`,
            data: { updates: criticalUpdates },
            read: false,
            timestamp: new Date()
        });

        console.log('✅ Notificación enviada al admin');
    } catch (error) {
        console.error('Error notificando al admin:', error);
    }
}
