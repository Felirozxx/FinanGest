// Sistema de failover automático: MongoDB -> Supabase -> Firebase
const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');

const MONGODB_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tqbddnjzgaifeoidtswt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'finangest-2';

let mongoClient = null;
let supabaseClient = null;
let firebaseInitialized = false;
let currentBackend = 'mongodb'; // 'mongodb', 'supabase', o 'firebase'
let lastHealthCheck = Date.now();

// Inicializar clientes
function initClients() {
    if (!mongoClient && MONGODB_URI) {
        mongoClient = new MongoClient(MONGODB_URI);
    }
    if (!supabaseClient && SUPABASE_KEY) {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    if (!firebaseInitialized && FIREBASE_PROJECT_ID) {
        try {
            admin.initializeApp({
                projectId: FIREBASE_PROJECT_ID
            });
            firebaseInitialized = true;
        } catch (error) {
            // Ya inicializado
        }
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

// Verificar salud de Firebase
async function checkFirebaseHealth() {
    try {
        if (!firebaseInitialized || !FIREBASE_PROJECT_ID) return false;
        const db = admin.firestore();
        await db.collection('users').limit(1).get();
        return true;
    } catch (error) {
        // Firebase es opcional, no mostrar error si no está configurado
        return false;
    }
}

// Determinar backend activo - usa el que esté mejor
async function determineActiveBackend() {
    // Solo verificar cada 30 segundos
    if (Date.now() - lastHealthCheck < 30000) {
        return currentBackend;
    }
    
    lastHealthCheck = Date.now();
    
    // Verificar todos en paralelo para encontrar el más rápido
    const [mongoHealthy, supabaseHealthy, firebaseHealthy] = await Promise.all([
        checkMongoHealth(),
        checkSupabaseHealth(),
        checkFirebaseHealth()
    ]);
    
    // Prioridad: MongoDB > Supabase > Firebase (pero solo si están funcionando)
    if (mongoHealthy) {
        if (currentBackend !== 'mongodb') {
            console.log('✅ Using MongoDB (primary)');
        }
        currentBackend = 'mongodb';
        return 'mongodb';
    }
    
    if (supabaseHealthy) {
        if (currentBackend !== 'supabase') {
            console.log('⚠️ MongoDB down, using Supabase');
        }
        currentBackend = 'supabase';
        return 'supabase';
    }
    
    if (firebaseHealthy) {
        if (currentBackend !== 'firebase') {
            console.log('🔥 MongoDB & Supabase down, using Firebase');
        }
        currentBackend = 'firebase';
        return 'firebase';
    }
    
    // Si todos fallan, intentar MongoDB de todos modos
    console.error('❌ All backends down, trying MongoDB anyway');
    currentBackend = 'mongodb';
    return 'mongodb';
}

// Obtener conexión activa
async function getConnection() {
    initClients();
    const backend = await determineActiveBackend();
    
    if (backend === 'mongodb') {
        await mongoClient.connect();
        return { type: 'mongodb', db: mongoClient.db('finangest') };
    } else if (backend === 'supabase') {
        return { type: 'supabase', client: supabaseClient };
    } else {
        return { type: 'firebase', db: admin.firestore() };
    }
}

module.exports = { getConnection, currentBackend };
