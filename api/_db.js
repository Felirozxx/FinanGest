// Conexión a base de datos con soporte de failover opcional
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Felirozxx:Pipe16137356@cluster0.luvtqa7.mongodb.net/finangest?retryWrites=true&w=majority';
const USE_FAILOVER = process.env.USE_FAILOVER === 'true';

let cachedClient = null;
let cachedDb = null;
let failoverModule = null;

async function connectToDatabase() {
    // Si el failover está activado, usar ese sistema
    if (USE_FAILOVER) {
        if (!failoverModule) {
            failoverModule = require('./_db-failover-v2');
        }
        return await failoverModule.getConnection();
    }

    // Modo simple: solo MongoDB
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb, backend: 'mongodb' };
    }

    // Crear nueva conexión (sin opciones obsoletas)
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db('finangest');

    // Cachear para reutilizar
    cachedClient = client;
    cachedDb = db;

    return { client, db, backend: 'mongodb' };
}

// Obtener estado del sistema
async function getSystemStatus() {
    if (USE_FAILOVER && failoverModule) {
        return failoverModule.getHealthStatus();
    }
    
    // Modo simple
    try {
        const { db } = await connectToDatabase();
        await db.command({ ping: 1 });
        return {
            current: 'mongodb',
            backends: {
                mongodb: { healthy: true, lastCheck: new Date(), error: null }
            },
            failoverEnabled: false
        };
    } catch (error) {
        return {
            current: 'mongodb',
            backends: {
                mongodb: { healthy: false, lastCheck: new Date(), error: error.message }
            },
            failoverEnabled: false
        };
    }
}

module.exports = { connectToDatabase, getSystemStatus };
