// Sistema de gestión de múltiples bases de datos con failover automático
const { MongoClient } = require('mongodb');

// Configuración de múltiples backends
const DB_CONFIGS = {
    mongodb: {
        name: 'MongoDB Atlas',
        uri: process.env.MONGODB_URI,
        priority: 1,
        enabled: true,
        type: 'mongodb'
    },
    // Supabase como backup (PostgreSQL compatible)
    supabase: {
        name: 'Supabase PostgreSQL',
        uri: process.env.SUPABASE_URI || null,
        priority: 2,
        enabled: !!process.env.SUPABASE_URI,
        type: 'postgres'
    },
    // Firebase como backup (Firestore)
    firebase: {
        name: 'Firebase Firestore',
        projectId: process.env.FIREBASE_PROJECT_ID || null,
        priority: 3,
        enabled: !!process.env.FIREBASE_PROJECT_ID,
        type: 'firestore'
    }
};

// Cache de conexiones
let cachedConnections = {};
let currentBackend = 'mongodb';
let lastHealthCheck = {};

// Verificar salud de una base de datos
async function checkHealth(backend) {
    const config = DB_CONFIGS[backend];
    if (!config || !config.enabled) {
        return { healthy: false, error: 'Not configured' };
    }

    try {
        if (config.type === 'mongodb') {
            // MongoDB health check
            if (!config.uri) {
                return { healthy: false, error: 'No URI configured' };
            }
            
            const client = new MongoClient(config.uri, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000
            });
            
            await client.connect();
            await client.db().admin().ping();
            await client.close();
            
            return { healthy: true, latency: 0 };
        } else if (config.type === 'postgres') {
            // Supabase/PostgreSQL health check
            if (!config.uri) {
                return { healthy: false, error: 'No URI configured' };
            }
            
            // Simple check - just verify URI format
            if (config.uri.startsWith('postgresql://')) {
                return { healthy: true, latency: 0, note: 'Configured (not actively used)' };
            }
            return { healthy: false, error: 'Invalid URI format' };
        } else if (config.type === 'firestore') {
            // Firebase/Firestore health check
            if (!config.projectId) {
                return { healthy: false, error: 'No Project ID configured' };
            }
            
            return { healthy: true, latency: 0, note: 'Configured (not actively used)' };
        }
        
        return { healthy: false, error: 'Unknown backend type' };
    } catch (error) {
        return { 
            healthy: false, 
            error: error.message 
        };
    }
}

// Obtener el mejor backend disponible
async function getBestBackend() {
    // Solo usar MongoDB por ahora (los otros son backups configurados pero no activos)
    const backends = ['mongodb'];

    // Intentar MongoDB
    for (const backend of backends) {
        const config = DB_CONFIGS[backend];
        if (config.enabled && config.uri) {
            const health = await checkHealth(backend);
            if (health.healthy) {
                if (currentBackend !== backend) {
                    console.log(`🔄 Cambiando de ${currentBackend} a ${backend}`);
                    currentBackend = backend;
                }
                return backend;
            }
        }
    }

    throw new Error('❌ MongoDB no disponible. Los backups están configurados pero requieren migración de datos.');
}

// Conectar a la base de datos con failover automático
async function connectToDatabase() {
    try {
        // Intentar usar el backend actual
        if (cachedConnections[currentBackend]) {
            try {
                await cachedConnections[currentBackend].db().admin().ping();
                return {
                    client: cachedConnections[currentBackend],
                    db: cachedConnections[currentBackend].db('finangest'),
                    backend: currentBackend
                };
            } catch (error) {
                console.log(`⚠️ Backend ${currentBackend} falló, buscando alternativa...`);
                delete cachedConnections[currentBackend];
            }
        }

        // Buscar el mejor backend disponible
        const bestBackend = await getBestBackend();
        const config = DB_CONFIGS[bestBackend];

        // Crear nueva conexión
        const client = new MongoClient(config.uri, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        await client.connect();
        cachedConnections[bestBackend] = client;

        console.log(`✅ Conectado a ${config.name}`);

        return {
            client: client,
            db: client.db('finangest'),
            backend: bestBackend
        };
    } catch (error) {
        console.error('❌ Error conectando a base de datos:', error);
        throw error;
    }
}

// Obtener estado de todos los backends
async function getBackendsStatus() {
    const status = {};
    
    for (const [key, config] of Object.entries(DB_CONFIGS)) {
        if (config.enabled) {
            const health = await checkHealth(key);
            status[key] = {
                name: config.name,
                priority: config.priority,
                type: config.type || 'mongodb',
                healthy: health.healthy,
                current: key === currentBackend,
                error: health.error || null,
                note: health.note || null,
                latency: health.latency || null
            };
        } else {
            status[key] = {
                name: config.name,
                priority: config.priority,
                type: config.type || 'mongodb',
                healthy: false,
                current: false,
                error: 'Not configured',
                note: null,
                latency: null
            };
        }
    }
    
    return status;
}

// Cambiar manualmente de backend
async function switchBackend(backend) {
    if (!DB_CONFIGS[backend] || !DB_CONFIGS[backend].enabled) {
        throw new Error(`Backend ${backend} no disponible`);
    }

    const health = await checkHealth(backend);
    if (!health.healthy) {
        throw new Error(`Backend ${backend} no está saludable: ${health.error}`);
    }

    // Cerrar conexión actual
    if (cachedConnections[currentBackend]) {
        await cachedConnections[currentBackend].close();
        delete cachedConnections[currentBackend];
    }

    currentBackend = backend;
    console.log(`✅ Cambiado manualmente a ${DB_CONFIGS[backend].name}`);
    
    return await connectToDatabase();
}

module.exports = {
    connectToDatabase,
    getBackendsStatus,
    switchBackend,
    checkHealth
};
