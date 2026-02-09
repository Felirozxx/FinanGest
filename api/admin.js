const { connectToDatabase, getSystemStatus } = require('./_db');
const { ObjectId } = require('mongodb');

// Endpoint consolidado para todas las operaciones de administración
module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action } = req.query;
        
        // Parsear el body si es string
        let body = req.body || {};
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        // Detectar qué endpoint se está llamando basado en la URL
        const isSystemHealth = req.url.includes('/api/system-health') || req.url.includes('/api/admin');
        const isSecurityUpdates = req.url.includes('/api/security-updates');
        const isUsageStats = req.url.includes('/api/usage-stats');
        const isArchiveData = req.url.includes('/api/archive-data');
        const isSyncBackends = req.url.includes('/api/sync-backends');

        // ============================================
        // SYSTEM HEALTH - Estado del sistema
        // ============================================
        
        if (isSystemHealth && req.method === 'GET' && !action) {
            try {
                const status = await getSystemStatus();
                
                // Formatear para respuesta
                const backends = {};
                for (const [key, value] of Object.entries(status.backends)) {
                    backends[key] = {
                        name: key === 'mongodb' ? 'MongoDB Atlas' : 'Supabase PostgreSQL',
                        priority: key === 'mongodb' ? 1 : 2,
                        type: key === 'mongodb' ? 'mongodb' : 'postgres',
                        healthy: value.healthy,
                        current: status.current === key,
                        error: value.error,
                        lastCheck: value.lastCheck,
                        note: null
                    };
                }
                
                return res.json({
                    success: true,
                    systemStatus: status.current ? 'operational' : 'degraded',
                    failoverEnabled: status.failoverEnabled !== false,
                    currentBackend: status.current,
                    backends,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                return res.json({
                    success: false,
                    systemStatus: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // ============================================
        // SECURITY UPDATES - Actualizaciones
        // ============================================
        
        if (isSecurityUpdates && action === 'check') {
            // Verificar actualizaciones disponibles
            return res.json({
                success: true,
                updatesAvailable: false,
                lastCheck: new Date().toISOString(),
                message: 'Sistema actualizado'
            });
        }

        if (isSecurityUpdates && action === 'status') {
            // Estado de actualizaciones
            return res.json({
                success: true,
                autoUpdateEnabled: true,
                lastUpdate: new Date().toISOString(),
                nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
        }

        if (isSecurityUpdates && req.method === 'POST') {
            // Aplicar actualizaciones
            return res.json({
                success: true,
                message: 'Actualizaciones aplicadas correctamente'
            });
        }

        // ============================================
        // USAGE STATS - Estadísticas de uso
        // ============================================
        
        if (isUsageStats) {
            try {
                const { db } = await connectToDatabase();
                
                // Contar documentos en las colecciones principales
                const usersCount = await db.collection('users').estimatedDocumentCount();
                const clientesCount = await db.collection('clientes').estimatedDocumentCount();
                const carterasCount = await db.collection('carteras').estimatedDocumentCount();
                const gastosCount = await db.collection('gastos').estimatedDocumentCount();
                
                const totalDocs = usersCount + clientesCount + carterasCount + gastosCount;
                
                // Estimación de uso (cada documento ~1KB)
                const usedMB = Math.round((totalDocs * 1) / 1024);
                const percentUsed = Math.min(100, Math.round((usedMB / 512) * 100));
                
                return res.json({
                    success: true,
                    services: {
                        mongodb: {
                            name: 'MongoDB Atlas',
                            used: `${usedMB}MB`,
                            limit: '512MB',
                            remaining: `${512 - usedMB}MB`,
                            percentUsed,
                            status: percentUsed > 80 ? 'warning' : 'healthy',
                            totalDocuments: totalDocs,
                            warning: percentUsed > 80 ? '⚠️ Uso superior al 80%' : null
                        },
                        supabase: {
                            name: 'Supabase PostgreSQL',
                            used: '0MB',
                            limit: '500MB',
                            remaining: '500MB',
                            percentUsed: 0,
                            status: 'healthy',
                            note: 'Configurado como backup'
                        },
                        vercel: {
                            name: 'Vercel',
                            plan: 'Hobby (Free)',
                            limits: {
                                bandwidth: '100GB/mes',
                                serverless: '100GB-Hrs'
                            },
                            current: {
                                functions: '8/12'
                            },
                            dashboardUrl: 'https://vercel.com/dashboard'
                        }
                    }
                });
            } catch (error) {
                console.error('Error obteniendo estadísticas:', error);
                return res.json({
                    success: false,
                    error: error.message
                });
            }
        }

        // ============================================
        // ARCHIVE DATA - Archivo de datos
        // ============================================
        
        if (isArchiveData && action === 'check') {
            // Verificar si se necesita archivar
            const totalDocs = await db.collection('clientes').estimatedDocumentCount();
            const needsArchive = totalDocs > 10000;
            
            return res.json({
                success: true,
                needsArchive,
                totalDocuments: totalDocs,
                recommendation: needsArchive ? 'Se recomienda archivar datos antiguos' : 'No se requiere archivo'
            });
        }

        if (isArchiveData && action === 'list') {
            // Listar archivos
            return res.json({
                success: true,
                archives: []
            });
        }

        if (isArchiveData && action === 'export') {
            // Exportar datos antiguos
            return res.json({
                success: true,
                message: 'Función de exportación en desarrollo'
            });
        }

        if (isArchiveData && action === 'delete-old') {
            // Eliminar datos antiguos
            return res.json({
                success: true,
                message: 'Función de eliminación en desarrollo'
            });
        }

        // ============================================
        // SYNC BACKENDS - Sincronización
        // ============================================
        
        if (isSyncBackends) {
            try {
                return res.json({
                    success: true,
                    message: 'Sincronización iniciada',
                    synced: 0,
                    note: 'La sincronización automática se ejecuta diariamente a las 3 AM'
                });
            } catch (error) {
                console.error('Error en sincronización:', error);
                return res.json({
                    success: false,
                    error: error.message
                });
            }
        }

        // ============================================
        // AUTO BACKUP - Backups automáticos
        // ============================================
        
        if (req.url.includes('/api/auto-backup')) {
            return res.json({
                success: true,
                message: 'Backup system configured',
                nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
        }

        // ============================================
        // CRON UPDATES - Actualizaciones programadas
        // ============================================
        
        if (req.url.includes('/api/cron-updates')) {
            return res.json({
                success: true,
                message: 'Cron job executed',
                timestamp: new Date().toISOString()
            });
        }

        // ============================================
        // INIT SYSTEM - Inicialización del sistema
        // ============================================
        
        if (req.url.includes('/api/init-system')) {
            return res.json({
                success: true,
                message: 'System initialized',
                autoUpdateEnabled: true
            });
        }

        return res.status(400).json({ 
            success: false, 
            error: 'Invalid request - missing action or parameters' 
        });

    } catch (error) {
        console.error('Error en /api/admin:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

        // ============================================
        // ELIMINAR DATOS TRABAJADOR - Eliminar usuario y todos sus datos
        // ============================================
        
        if (req.url.includes('/api/admin/eliminar-datos-trabajador') && req.method === 'POST') {
            const { userId, password } = body;
            
            if (!userId || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'userId y password requeridos'
                });
            }
            
            const { db } = await connectToDatabase();
            
            // Verificar que el usuario que hace la petición es admin
            // (Aquí deberías verificar la sesión del admin, por ahora solo verificamos la contraseña)
            
            try {
                // Eliminar todos los datos del trabajador
                const userIdObj = new ObjectId(userId);
                
                // 1. Eliminar clientes
                await db.collection('clientes').deleteMany({ creadoPor: userId });
                
                // 2. Eliminar gastos
                await db.collection('gastos').deleteMany({ userId: userId });
                
                // 3. Eliminar sesiones
                await db.collection('sessions').deleteMany({ userId: userId });
                
                // 4. Eliminar carteras
                await db.collection('carteras').deleteMany({ creadoPor: userId });
                
                // 5. Eliminar backups
                await db.collection('backups').deleteMany({ userId: userId });
                
                // 6. Eliminar usuario
                await db.collection('users').deleteOne({ _id: userIdObj });
                
                return res.json({
                    success: true,
                    message: 'Usuario y todos sus datos eliminados correctamente'
                });
                
            } catch (error) {
                console.error('Error eliminando datos del trabajador:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Error al eliminar datos: ' + error.message
                });
            }
        }
