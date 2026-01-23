// Sistema de gestión de múltiples bases de datos con failover automático
const { MongoClient } = require('mongodb');

// Configuración de múltiples backends
const DB_CONFIGS = {
    mongodb: {
        name: 'MongoDB Atlas',
        uri: process.env.MONGODB_URI,
        priority: 1,
        enabled: true
    },
    // Supabase se agregará cuando se configure
    supabase: {
        name: 'Supabase',
        uri: process.env.SUPABASE_URI || null,
        priority: 2,
        enabled: false
    },
    // Firebase se agregará cuando se configure
    firebase: {
        name: 'Firebase',
        uri: process.env.FIREBASE_URI || null,
        priority: 3,
        enabled: false
    }
};

// Cache de conexiones
let cachedConnections = {};
let currentBackend = 'mongodb';
let lastHealthCheck = {};

// Verificar salud de una base de datos
async function checkHealth(backend) {
    const config = DB_CONFIGS[backend];
    if (!config || !config.enabled || !config.uri) {
        return { healthy: false, error: 'Not configured' };
    }

    try {
        const client = new MongoClient(config.uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        
        await client.connect();
        await client.db().admin().ping();
        await client.close();
        
        return { 
            healthy: true, 
            latency: Date.now() - lastHealthCheck[backend]?.timestamp || 0 
        };
    } catch (error) {
        return { 
            healthy: false, 
            error: error.message 
        };
    }
}

// Obtener el mejor backend disponible
async function getBestBackend() {
    // Ordenar por prioridad
    const backends = Object.keys(DB_CONFIGS)
        .filter(key => DB_CONFIGS[key].enabled && DB_CONFIGS[key].uri)
        .sort((a, b) => DB_CONFIGS[a].priority - DB_CONFIGS[b].priority);

    // Intentar cada backend en orden de prioridad
    for (const backend of backends) {
        const health = await checkHealth(backend);
        if (health.healthy) {
            if (currentBackend !== backend) {
                console.log(`🔄 Cambiando de ${currentBackend} a ${backend}`);
                currentBackend = backend;
            }
            return backend;
        }
    }

    throw new Error('❌ Ningún backend disponible');
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
        if (config.enabled && config.uri) {
            const health = await checkHealth(key);
            status[key] = {
                name: config.name,
                priority: config.priority,
                healthy: health.healthy,
                current: key === currentBackend,
                error: health.error || null,
                latency: health.latency || null
            };
        } else {
            status[key] = {
                name: config.name,
                priority: config.priority,
                healthy: false,
                current: false,
                error: 'Not configured',
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
