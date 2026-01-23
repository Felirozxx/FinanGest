// Sistema de verificación y gestión de actualizaciones de seguridad
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

        // GET - Obtener estado de actualizaciones
        if (req.method === 'GET') {
            const { action } = req.query;

            if (action === 'check') {
                // Verificar actualizaciones disponibles
                const updates = await verificarActualizaciones();
                return res.json({
                    success: true,
                    updates,
                    lastCheck: new Date(),
                    hasUpdates: updates.length > 0,
                    criticalUpdates: updates.filter(u => u.severity === 'critical').length
                });
            }

            if (action === 'history') {
                // Obtener historial de actualizaciones
                const history = await db.collection('security_updates')
                    .find({})
                    .sort({ timestamp: -1 })
                    .limit(50)
                    .toArray();

                return res.json({
                    success: true,
                    history: history.map(h => ({
                        id: h._id,
                        timestamp: h.timestamp,
                        type: h.type,
                        status: h.status,
                        packages: h.packages,
                        message: h.message
                    }))
                });
            }

            if (action === 'status') {
                // Estado general del sistema de actualizaciones
                const lastUpdate = await db.collection('security_updates')
                    .findOne({}, { sort: { timestamp: -1 } });

                const config = await db.collection('system_config')
                    .findOne({ key: 'auto_updates' });

                return res.json({
                    success: true,
                    autoUpdatesEnabled: config?.enabled || false,
                    lastUpdate: lastUpdate?.timestamp || null,
                    lastStatus: lastUpdate?.status || 'unknown',
                    nextCheck: calcularProximaVerificacion()
                });
            }

            return res.status(400).json({ error: 'Acción no válida' });
        }

        // POST - Gestionar actualizaciones
        if (req.method === 'POST') {
            const { action, config } = req.body;

            if (action === 'enable') {
                // Habilitar actualizaciones automáticas
                await db.collection('system_config').updateOne(
                    { key: 'auto_updates' },
                    { 
                        $set: { 
                            enabled: true,
                            updatedAt: new Date(),
                            config: config || {
                                checkFrequency: 'weekly',
                                autoApply: 'security-only',
                                backupBeforeUpdate: true,
                                notifyAdmin: true
                            }
                        } 
                    },
                    { upsert: true }
                );

                return res.json({
                    success: true,
                    message: 'Actualizaciones automáticas habilitadas'
                });
            }

            if (action === 'disable') {
                // Deshabilitar actualizaciones automáticas
                await db.collection('system_config').updateOne(
                    { key: 'auto_updates' },
                    { $set: { enabled: false, updatedAt: new Date() } },
                    { upsert: true }
                );

                return res.json({
                    success: true,
                    message: 'Actualizaciones automáticas deshabilitadas'
                });
            }

            if (action === 'apply') {
                // Aplicar actualizaciones manualmente
                const { updateIds } = req.body;
                
                // Crear backup antes de actualizar
                const backupId = await crearBackupPreActualizacion(db);

                // Registrar intento de actualización
                const updateRecord = {
                    timestamp: new Date(),
                    type: 'manual',
                    status: 'in_progress',
                    backupId,
                    packages: updateIds || [],
                    initiatedBy: 'admin'
                };

                const result = await db.collection('security_updates').insertOne(updateRecord);

                return res.json({
                    success: true,
                    message: 'Actualización iniciada',
                    updateId: result.insertedId,
                    backupId,
                    note: 'Las actualizaciones se aplicarán en el próximo despliegue'
                });
            }

            return res.status(400).json({ error: 'Acción no válida' });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error en security-updates:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error gestionando actualizaciones de seguridad' 
        });
    }
};

// Verificar actualizaciones disponibles
async function verificarActualizaciones() {
    // En producción, esto consultaría npm audit o GitHub Security Advisories
    // Por ahora, retornamos un ejemplo de estructura
    return [
        {
            package: 'mongodb',
            currentVersion: '6.3.0',
            latestVersion: '6.5.0',
            severity: 'moderate',
            description: 'Actualización de seguridad recomendada',
            cve: null
        }
    ];
}

// Crear backup antes de actualizar
async function crearBackupPreActualizacion(db) {
    const collections = ['users', 'clientes', 'carteras', 'gastos', 'cajas'];
    const backupData = {};

    for (const collectionName of collections) {
        const data = await db.collection(collectionName).find({}).toArray();
        backupData[collectionName] = data;
    }

    const backup = {
        timestamp: new Date(),
        type: 'pre_update',
        collections: Object.keys(backupData),
        size: JSON.stringify(backupData).length,
        data: backupData
    };

    const result = await db.collection('system_backups').insertOne(backup);
    return result.insertedId;
}

// Calcular próxima verificación
function calcularProximaVerificacion() {
    const ahora = new Date();
    const proximaSemana = new Date(ahora);
    proximaSemana.setDate(ahora.getDate() + 7);
    return proximaSemana;
}
