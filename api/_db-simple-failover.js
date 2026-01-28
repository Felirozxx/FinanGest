// Sistema de failover automático SIMPLE entre MongoDB y Supabase
const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

const MONGODB_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tqbddnjzgaifeoidtswt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let mongoClient = null;
let supabaseClient = null;
let currentBackend = 'mongodb'; // 'mongodb' o 'supabase'
let lastHealthCheck = Date.now();

// Inicializar clientes
function initClients() {
    if (!mongoClient && MONGODB_URI) {
        mongoClient = new MongoClient(MONGODB_URI);
    }
    if (!supabaseClient && SUPABASE_KEY) {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    }
}

// Verificar salud de MongoDB
async function checkMongoHealth() {
    try {
        if (!mongoClient) return false;
        await mongoClient.connect();
        await mongoClient.db('finangest').command({ ping: 1 });
        return true;
    } catch (error) {
        console.error('MongoDB health check failed:', error.message);
        return false;
    }
}

// Verificar salud de Supabase
async function checkSupabaseHealth() {
    try {
        if (!supabaseClient) return false;
        const { error } = await supabaseClient.from('users').select('count').limit(1);
        return !error;
    } catch (error) {
        console.error('Supabase health check failed:', error.message);
        return false;
    }
}

// Determinar backend activo
async function determineActiveBackend() {
    // Solo verificar cada 30 segundos
    if (Date.now() - lastHealthCheck < 30000) {
        return currentBackend;
    }

    lastHealthCheck = Date.now();
    
    // Intentar MongoDB primero
    const mongoHealthy = await checkMongoHealth();
    if (mongoHealthy) {
        if (currentBackend !== 'mongodb') {
            console.log('✅ Switching back to MongoDB');
        }
        currentBackend = 'mongodb';
        return 'mongodb';
    }
    
    // Si MongoDB falla, usar Supabase
    const supabaseHealthy = await checkSupabaseHealth();
    if (supabaseHealthy) {
        if (currentBackend !== 'supabase') {
            console.log('⚠️ MongoDB down, switching to Supabase');
        }
        currentBackend = 'supabase';
        return 'supabase';
    }
    
    // Si ambos fallan, intentar MongoDB de todos modos
    console.error('❌ Both backends down, trying MongoDB anyway');
    return 'mongodb';
}

// Obtener conexión activa
async function getConnection() {
    initClients();
    const backend = await determineActiveBackend();
    
    if (backend === 'mongodb') {
        await mongoClient.connect();
        return { type: 'mongodb', db: mongoClient.db('finangest') };
    } else {
        return { type: 'supabase', client: supabaseClient };
    }
}

module.exports = { getConnection, currentBackend };
