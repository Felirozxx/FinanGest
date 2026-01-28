// Conexión con failover automático a Supabase si MongoDB falla
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Felirozxx:Pipe16137356@cluster0.luvtqa7.mongodb.net/finangest?retryWrites=true&w=majority';
const USE_FAILOVER = process.env.USE_FAILOVER === 'true'; // Activar solo cuando esté listo

let cachedClient = null;
let cachedDb = null;
let failoverActive = false;

async function connectToDatabase() {
    // Si el failover está activado, intentar usarlo
    if (USE_FAILOVER) {
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
            console.error('Failover system error, using MongoDB directly:', error.message);
            // Si falla el failover, continuar con MongoDB simple
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
