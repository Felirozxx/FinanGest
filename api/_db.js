// Conexión con failover automático a Supabase si MongoDB falla
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Felirozxx:Pipe16137356@cluster0.luvtqa7.mongodb.net/finangest?retryWrites=true&w=majority';
const USE_FAILOVER = process.env.USE_FAILOVER === 'true';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    // TEMPORALMENTE DESACTIVADO - Sistema de failover causa errores
    // TODO: Arreglar y reactivar
    const FAILOVER_DISABLED = true;
    
    // Si el failover está activado Y no está desactivado manualmente
    if (USE_FAILOVER && !FAILOVER_DISABLED) {
        try {
            const { getConnection } = require('./_db-simple-failover');
            const UniversalAdapter = require('./_universal-adapter');
            
            const connection = await getConnection();
            const adapter = new UniversalAdapter(connection);
            
            return { 
                client: cachedClient, 
                db: adapter,
                isFailover: connection.type === 'supabase'
            };
        } catch (error) {
            console.error('Failover error, using MongoDB:', error.message);
        }
    }

    // Sistema simple de MongoDB (por defecto)
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb, isFailover: false };
    }

    const client = await MongoClient.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const db = client.db('finangest');
    cachedClient = client;
    cachedDb = db;

    return { client, db, isFailover: false };
}

module.exports = { connectToDatabase };
