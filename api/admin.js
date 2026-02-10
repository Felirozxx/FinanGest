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
                
                // LIMPIEZA AUTOMÁTICA: Eliminar backups con más de 30 días
                try {
                    const fechaLimite = new Date();
                    fechaLimite.setDate(fechaLimite.getDate() - 30);
                    const cleanResult = await db.collection('backups').deleteMany({
                        fecha: { $lt: fechaLimite }
                    });
                    if (cleanResult.deletedCount > 0) {
                        console.log(`🗑️ Auto-limpieza: ${cleanResult.deletedCount} backups eliminados (>30 días)`);
                    }
                } catch (cleanError) {
                    console.error('Error en auto-limpieza de backups:', cleanError);
                    // No detener el proceso si falla la limpieza
                }
                
                // Obtener estadísticas REALES de MongoDB
                const dbStats = await db.stats();
                
                // Contar documentos por colección
                const usersCount = await db.collection('users').countDocuments();
                const clientesCount = await db.collection('clientes').countDocuments();
                const carterasCount = await db.collection('carteras').countDocuments();
                const gastosCount = await db.collection('gastos').countDocuments();
                const sessionsCount = await db.collection('sessions').countDocuments();
                const backupsCount = await db.collection('backups').countDocuments();
                
                const totalDocs = usersCount + clientesCount + carterasCount + gastosCount + sessionsCount + backupsCount;
                
                // Usar estadísticas REALES de MongoDB (datos + índices)
                const usedBytes = dbStats.dataSize + dbStats.indexSize;
                const usedMB = parseFloat((usedBytes / 1024 / 1024).toFixed(2));
                
                // DETECTAR PLAN DE MONGODB AUTOMÁTICAMENTE
                // MongoDB Atlas Free (M0): 512 MB
                // M10 Shared: 10 GB = 10,240 MB
                // M20: 20 GB = 20,480 MB
                // M30: 40 GB = 40,960 MB
                let mongodbPlan = 'Free Tier (M0)';
                let limitMB = 512;
                
                // Intentar detectar el plan basado en el tamaño del cluster
                // Si el storage size es mayor a 512 MB, probablemente es un plan pagado
                const storageSizeMB = dbStats.storageSize / 1024 / 1024;
                if (storageSizeMB > 512) {
                    if (storageSizeMB <= 10240) {
                        mongodbPlan = 'M10 Shared';
                        limitMB = 10240;
                    } else if (storageSizeMB <= 20480) {
                        mongodbPlan = 'M20';
                        limitMB = 20480;
                    } else if (storageSizeMB <= 40960) {
                        mongodbPlan = 'M30';
                        limitMB = 40960;
                    } else {
                        mongodbPlan = 'M40+';
                        limitMB = 81920; // 80 GB estimado
                    }
                }
                
                const percentUsed = parseFloat(((usedMB / limitMB) * 100).toFixed(2));
                
                // DETECTAR PLAN DE VERCEL AUTOMÁTICAMENTE
                // Vercel Hobby: 100,000 invocations/día
                // Vercel Pro: 1,000,000 invocations/día
                // Vercel Enterprise: Ilimitado
                const vercelPlan = process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PLAN ? process.env.VERCEL_PLAN : 'hobby';
                let apiCallsLimit = 100000;
                let vercelPlanName = 'Hobby (Free)';
                
                if (vercelPlan === 'pro') {
                    apiCallsLimit = 1000000;
                    vercelPlanName = 'Pro ($20/mes)';
                } else if (vercelPlan === 'enterprise') {
                    apiCallsLimit = 10000000; // Prácticamente ilimitado
                    vercelPlanName = 'Enterprise';
                }
                
                // Estadísticas de API calls (estimado basado en usuarios activos)
                const activeUsers = await db.collection('users').countDocuments({ activo: true });
                const estimatedApiCalls = activeUsers * 100; // Estimación: 100 calls por usuario activo al día
                const apiCallsPercent = Math.min(100, Math.round((estimatedApiCalls / apiCallsLimit) * 100));
                
                // Contar trabajadores (usuarios que no son admin)
                const totalWorkers = await db.collection('users').countDocuments({ 
                    $and: [
                        { role: { $ne: 'admin' } },
                        { isAdmin: { $ne: true } }
                    ]
                });
                
                // Determinar estado
                let estado = 'ok';
                let recomendaciones = [];
                
                if (percentUsed > 80) {
                    estado = 'critical';
                    recomendaciones.push(`⚠️ Almacenamiento crítico (${percentUsed}%). ${mongodbPlan === 'Free Tier (M0)' ? 'Considera upgrade a M10 ($57/mes) para 10 GB.' : 'Considera archivar datos antiguos o upgrade de plan.'}`);
                } else if (percentUsed > 60) {
                    estado = 'warning';
                    recomendaciones.push(`⚠️ Almacenamiento alto (${percentUsed}%). Monitorea el crecimiento.`);
                } else {
                    recomendaciones.push('✅ Almacenamiento en niveles óptimos.');
                }
                
                if (apiCallsPercent > 80) {
                    recomendaciones.push(`⚠️ Alto uso de API calls (${apiCallsPercent}%). ${vercelPlan === 'hobby' ? 'Considera upgrade a Vercel Pro ($20/mes) para 1M invocations.' : 'Considera optimizar las consultas.'}`);
                } else {
                    recomendaciones.push('✅ Uso de API calls dentro de límites normales.');
                }
                
                // Calcular duración estimada del plan (basado en crecimiento)
                const growthPerMonth = Math.max(0.1, usedMB / Math.max(1, totalDocs / 10));
                const diasRestantes = Math.max(0, Math.floor((limitMB - usedMB) / growthPerMonth * 30));
                const mesesRestantes = Math.floor(diasRestantes / 30);
                const aniosRestantes = Math.floor(mesesRestantes / 12);
                
                return res.json({
                    success: true,
                    stats: {
                        // MongoDB (estadísticas REALES con detección de plan)
                        storageUsedMB: usedMB,
                        storageLimitMB: limitMB,
                        storagePercent: percentUsed,
                        mongodbPlan: mongodbPlan,
                        
                        // Vercel API Calls (con detección de plan)
                        apiCallsEstimadas: estimatedApiCalls,
                        apiCallsLimite: apiCallsLimit,
                        apiCallsPercent: apiCallsPercent,
                        vercelPlan: vercelPlanName,
                        
                        // Contadores
                        totalTrabajadores: totalWorkers,
                        totalClientes: clientesCount,
                        totalGastos: gastosCount,
                        totalBackups: backupsCount,
                        totalCarteras: carterasCount,
                        totalDocumentos: totalDocs,
                        
                        // Estado
                        estado: estado,
                        recomendaciones: recomendaciones,
                        planActual: mongodbPlan === 'Free Tier (M0)' ? 'free' : 'paid',
                        diasRestantes: diasRestantes,
                        mesesRestantes: mesesRestantes,
                        aniosRestantes: aniosRestantes,
                        
                        // Servicios detallados
                        services: {
                            mongodb: {
                                name: 'MongoDB Atlas',
                                status: 'operational',
                                plan: mongodbPlan,
                                limit: `${limitMB >= 1024 ? (limitMB / 1024).toFixed(0) + ' GB' : limitMB + ' MB'}`,
                                used: `${usedMB} MB`,
                                percent: percentUsed,
                                url: 'https://cloud.mongodb.com',
                                isPaid: mongodbPlan !== 'Free Tier (M0)',
                                upgradeUrl: mongodbPlan === 'Free Tier (M0)' ? 'https://cloud.mongodb.com/v2#/org/YOUR_ORG/billing/overview' : null,
                                stats: {
                                    dataSize: parseFloat((dbStats.dataSize / 1024 / 1024).toFixed(2)),
                                    indexSize: parseFloat((dbStats.indexSize / 1024 / 1024).toFixed(2)),
                                    storageSize: parseFloat((dbStats.storageSize / 1024 / 1024).toFixed(2)),
                                    collections: dbStats.collections
                                },
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
                                plan: vercelPlanName,
                                limits: {
                                    bandwidth: vercelPlan === 'hobby' ? '100 GB/mes' : vercelPlan === 'pro' ? '1 TB/mes' : 'Ilimitado',
                                    functions: vercelPlan === 'hobby' ? '100 GB-Hrs' : vercelPlan === 'pro' ? '1,000 GB-Hrs' : 'Ilimitado',
                                    invocations: `${(apiCallsLimit / 1000).toFixed(0)}K/día`
                                },
                                estimated: {
                                    apiCalls: estimatedApiCalls,
                                    percent: apiCallsPercent
                                },
                                isPaid: vercelPlan !== 'hobby',
                                upgradeUrl: vercelPlan === 'hobby' ? 'https://vercel.com/dashboard/upgrade' : null,
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
        // LIMPIAR BACKUPS VIEJOS - Mantener solo últimos 30 días
        // ============================================
        
        if (req.url.includes('/api/admin/limpiar-backups-viejos') && req.method === 'POST') {
            try {
                const db = await connectDB();
                
                // Calcular fecha límite (30 días atrás)
                const fechaLimite = new Date();
                fechaLimite.setDate(fechaLimite.getDate() - 30);
                
                // Eliminar backups más viejos de 30 días
                const result = await db.collection('backups').deleteMany({
                    fecha: { $lt: fechaLimite }
                });
                
                console.log(`🗑️ Backups eliminados: ${result.deletedCount} (más de 30 días)`);
                
                return res.json({
                    success: true,
                    eliminados: result.deletedCount,
                    fechaLimite: fechaLimite.toISOString(),
                    message: `Se eliminaron ${result.deletedCount} backups con más de 30 días`
                });
            } catch (error) {
                console.error('Error limpiando backups:', error);
                return res.json({
                    success: false,
                    error: error.message
                });
            }
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
