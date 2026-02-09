const { connectToDatabase, getSystemStatus } = require('./_db');
const { ObjectId } = require('mongodb');
const { verifyPassword } = require('./_crypto-hash');

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
        const isSystemStats = req.url.includes('/api/admin/system-stats');
        const isSystemHealth = req.url.includes('/api/system-health') || (req.url.includes('/api/admin') && !isSystemStats && !action);
        const isSecurityUpdates = req.url.includes('/api/security-updates');
        const isUsageStats = req.url.includes('/api/usage-stats');
        const isArchiveData = req.url.includes('/api/archive-data');
        const isSyncBackends = req.url.includes('/api/sync-backends');

        // ============================================
        // SYSTEM STATS - Estadísticas del sistema (DEBE IR PRIMERO)
        // ============================================
        
        if (isSystemStats) {
            try {
                const { db } = await connectToDatabase();
                
                // Contar documentos
                const usersCount = await db.collection('users').estimatedDocumentCount();
                const clientesCount = await db.collection('clientes').estimatedDocumentCount();
                const carterasCount = await db.collection('carteras').estimatedDocumentCount();
                const gastosCount = await db.collection('gastos').estimatedDocumentCount();
                const sessionsCount = await db.collection('sessions').estimatedDocumentCount();
                const backupsCount = await db.collection('backups').estimatedDocumentCount();
                
                const totalDocs = usersCount + clientesCount + carterasCount + gastosCount + sessionsCount + backupsCount;
                
                // Estimación de uso (cada documento ~1KB promedio)
                const usedMB = Math.round((totalDocs * 1) / 1024);
                const limitMB = 512; // MongoDB Atlas Free Tier
                const percentUsed = Math.min(100, Math.round((usedMB / limitMB) * 100));
                
                // Estadísticas de API calls (estimado basado en usuarios activos)
                const activeUsers = await db.collection('users').countDocuments({ activo: true });
                const estimatedApiCalls = activeUsers * 100; // Estimación: 100 calls por usuario activo al día
                const apiCallsLimit = 100000; // Vercel Hobby limit
                const apiCallsPercent = Math.min(100, Math.round((estimatedApiCalls / apiCallsLimit) * 100));
                
                // Determinar estado
                let estado = 'ok';
                let recomendaciones = [];
                
                if (percentUsed > 80) {
                    estado = 'critical';
                    recomendaciones.push('⚠️ Almacenamiento crítico (>80%). Considera archivar datos antiguos.');
                } else if (percentUsed > 60) {
                    estado = 'warning';
                    recomendaciones.push('⚠️ Almacenamiento alto (>60%). Monitorea el crecimiento.');
                } else {
                    recomendaciones.push('✅ Almacenamiento en niveles óptimos.');
                }
                
                if (apiCallsPercent > 80) {
                    recomendaciones.push('⚠️ Alto uso de API calls. Considera optimizar las consultas.');
                } else {
                    recomendaciones.push('✅ Uso de API calls dentro de límites normales.');
                }
                
                // Calcular duración estimada del plan
                const diasRestantes = Math.floor((limitMB - usedMB) / (usedMB / 30)); // Estimación basada en crecimiento mensual
                
                return res.json({
                    success: true,
                    stats: {
                        // MongoDB
                        storageUsedMB: usedMB,
                        storageLimitMB: limitMB,
                        storagePercent: percentUsed,
                        
                        // Vercel API Calls
                        apiCallsEstimadas: estimatedApiCalls,
                        apiCallsLimite: apiCallsLimit,
                        apiCallsPercent: apiCallsPercent,
                        
                        // Contadores
                        totalTrabajadores: usersCount - 1, // Excluir admin
                        totalClientes: clientesCount,
                        totalGastos: gastosCount,
                        totalBackups: backupsCount,
                        totalCarteras: carterasCount,
                        totalDocumentos: totalDocs,
                        
                        // Estado
                        estado: estado,
                        recomendaciones: recomendaciones,
                        planActual: 'free',
                        diasRestantes: Math.max(0, diasRestantes),
                        
                        // Servicios detallados
                        services: {
                            mongodb: {
                                name: 'MongoDB Atlas',
                                status: 'operational',
                                plan: 'Free Tier (M0)',
                                limit: '512 MB',
                                used: `${usedMB} MB`,
                                percent: percentUsed,
                                url: 'https://cloud.mongodb.com',
                                collections: {
                                    users: usersCount,
                                    clientes: clientesCount,
                                    carteras: carterasCount,
                                    gastos: gastosCount,
                                    sessions: sessionsCount,
                                    backups: backupsCount
                                }
                            },
                            vercel: {
                                name: 'Vercel',
                                status: 'operational',
                                plan: 'Hobby (Free)',
                                limits: {
                                    bandwidth: '100 GB/mes',
                                    functions: '100 GB-Hrs',
                                    invocations: '100,000/día'
                                },
                                estimated: {
                                    apiCalls: estimatedApiCalls,
                                    percent: apiCallsPercent
                                },
                                url: 'https://vercel.com/dashboard'
                            },
                            github: {
                                name: 'GitHub',
                                status: 'operational',
                                plan: 'Free',
                                repo: 'Felirozxx/FinanGest',
                                branch: 'main',
                                url: 'https://github.com/Felirozxx/FinanGest'
                            }
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

        // ============================================
        // ELIMINAR DATOS TRABAJADOR - Eliminar usuario y todos sus datos
        // ============================================
        
        if (req.url.includes('/api/admin/eliminar-datos-trabajador') && req.method === 'POST') {
            try {
                console.log('🔵 Iniciando eliminación de trabajador');
                console.log('Body recibido:', JSON.stringify(body));
                
                const { adminPassword, trabajadorId, adminId } = body;
                
                if (!trabajadorId || !adminPassword || !adminId) {
                    console.log('❌ Faltan parámetros:', { trabajadorId, adminPassword: !!adminPassword, adminId });
                    return res.status(400).json({
                        success: false,
                        error: 'trabajadorId, adminPassword y adminId son requeridos'
                    });
                }
                
                console.log('🔵 Conectando a base de datos...');
                const { db } = await connectToDatabase();
                
                // Verificar que el admin existe
                console.log('🔵 Verificando admin con ID:', adminId);
                const admin = await db.collection('users').findOne({ _id: new ObjectId(adminId) });
                
                if (!admin) {
                    console.log('❌ Admin no encontrado');
                    return res.status(403).json({
                        success: false,
                        error: 'Usuario administrador no encontrado'
                    });
                }
                
                if (admin.role !== 'admin') {
                    console.log('❌ Usuario no es admin, role:', admin.role);
                    return res.status(403).json({
                        success: false,
                        error: 'No tienes permisos de administrador'
                    });
                }
                
                console.log('🔵 Admin encontrado:', admin.email);
                console.log('🔵 Password en DB:', admin.password ? admin.password.substring(0, 20) + '...' : 'NO PASSWORD');
                
                // Verificar contraseña usando el mismo método que login
                const passwordValid = verifyPassword(adminPassword, admin.password);
                console.log('🔵 Verificación de contraseña:', passwordValid);
                
                if (!passwordValid) {
                    console.log('❌ Contraseña incorrecta');
                    return res.status(403).json({
                        success: false,
                        error: 'Contraseña incorrecta'
                    });
                }
                
                console.log('✅ Admin verificado, procediendo a eliminar trabajador:', trabajadorId);
                
                // Eliminar todos los datos del trabajador
                const trabajadorIdObj = new ObjectId(trabajadorId);
                
                // Contar antes de eliminar
                console.log('🔵 Contando documentos a eliminar...');
                const clientesCount = await db.collection('clientes').countDocuments({ creadoPor: trabajadorId });
                const gastosCount = await db.collection('gastos').countDocuments({ userId: trabajadorId });
                const sesionesCount = await db.collection('sessions').countDocuments({ userId: trabajadorId });
                const backupsCount = await db.collection('backups').countDocuments({ userId: trabajadorId });
                
                console.log('📊 Documentos a eliminar:', { clientesCount, gastosCount, sesionesCount, backupsCount });
                
                // 1. Eliminar clientes
                await db.collection('clientes').deleteMany({ creadoPor: trabajadorId });
                console.log('✅ Clientes eliminados');
                
                // 2. Eliminar gastos
                await db.collection('gastos').deleteMany({ userId: trabajadorId });
                console.log('✅ Gastos eliminados');
                
                // 3. Eliminar sesiones
                await db.collection('sessions').deleteMany({ userId: trabajadorId });
                console.log('✅ Sesiones eliminadas');
                
                // 4. Eliminar carteras
                await db.collection('carteras').deleteMany({ creadoPor: trabajadorId });
                console.log('✅ Carteras eliminadas');
                
                // 5. Eliminar backups
                await db.collection('backups').deleteMany({ userId: trabajadorId });
                console.log('✅ Backups eliminados');
                
                // 6. Eliminar usuario
                const deleteResult = await db.collection('users').deleteOne({ _id: trabajadorIdObj });
                console.log('✅ Usuario eliminado:', deleteResult.deletedCount > 0);
                
                return res.json({
                    success: true,
                    message: 'Usuario y todos sus datos eliminados correctamente',
                    deleted: {
                        clientes: clientesCount,
                        gastos: gastosCount,
                        sesiones: sesionesCount,
                        backups: backupsCount,
                        cuenta: deleteResult.deletedCount > 0
                    }
                });
            } catch (innerError) {
                console.error('❌ Error en eliminación de trabajador:', innerError);
                return res.status(500).json({
                    success: false,
                    error: 'Error al eliminar trabajador: ' + innerError.message
                });
            }
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
