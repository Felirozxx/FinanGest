// Conexión simple a MongoDB Atlas
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Felirozxx:Pipe16137356@cluster0.luvtqa7.mongodb.net/finangest?retryWrites=true&w=majority';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    // Si ya hay conexión, reutilizarla
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    // Crear nueva conexión
    const client = await MongoClient.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const db = client.db('finangest');

    // Cachear para reutilizar
    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

module.exports = { connectToDatabase };
