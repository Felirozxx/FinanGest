// Sistema de Failover v2 - MongoDB -> Supabase -> Firebase (3 niveles)
const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

const MONGODB_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

let mongoClient = null;
let supabaseClient = null;
let firebaseAdmin = null;
let firebaseDb = null;
let currentBackend = 'mongodb';
let lastCheck = 0;
let healthStatus = {
    mongodb: { healthy: false, lastCheck: null, error: null },
    supabase: { healthy: false, lastCheck: null, error: null },
    firebase: { healthy: false, lastCheck: null, error: null }
};
const CHECK_INTERVAL = 30000; // 30 segundos

// Inicializar clientes
function init() {
    if (!mongoClient && MONGODB_URI) {
        mongoClient = new MongoClient(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
    }
    if (!supabaseClient && SUPABASE_KEY && SUPABASE_URL) {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    if (!firebaseAdmin && FIREBASE_PROJECT_ID) {
        try {
            // Inicializar Firebase Admin solo si está configurado
            firebaseAdmin = require('firebase-admin');
            if (!firebaseAdmin.apps.length) {
                firebaseAdmin.initializeApp({
                    projectId: FIREBASE_PROJECT_ID
                });
            }
            firebaseDb = firebaseAdmin.firestore();
        } catch (error) {
            console.error('Firebase init failed:', error.message);
            firebaseAdmin = null;
        }
    }
}

// Verificar MongoDB
async function checkMongo() {
    if (!mongoClient) {
        healthStatus.mongodb = { healthy: false, lastCheck: new Date(), error: 'Not configured' };
        return false;
    }
    try {
        await mongoClient.connect();
        await mongoClient.db('finangest').command({ ping: 1 });
        healthStatus.mongodb = { healthy: true, lastCheck: new Date(), error: null };
        return true;
    } catch (error) {
        console.error('MongoDB check failed:', error.message);
        healthStatus.mongodb = { healthy: false, lastCheck: new Date(), error: error.message };
        return false;
    }
}

// Verificar Supabase
async function checkSupabase() {
    if (!supabaseClient) {
        healthStatus.supabase = { healthy: false, lastCheck: new Date(), error: 'Not configured' };
        return false;
    }
    try {
        const { error } = await supabaseClient.from('users').select('count').limit(1);
        if (error) throw error;
        healthStatus.supabase = { healthy: true, lastCheck: new Date(), error: null };
        return true;
    } catch (error) {
        console.error('Supabase check failed:', error.message);
        healthStatus.supabase = { healthy: false, lastCheck: new Date(), error: error.message };
        return false;
    }
}

// Verificar Firebase
async function checkFirebase() {
    if (!firebaseDb) {
        healthStatus.firebase = { healthy: false, lastCheck: new Date(), error: 'Not configured' };
        return false;
    }
    try {
        // Intentar leer una colección
        await firebaseDb.collection('users').limit(1).get();
        healthStatus.firebase = { healthy: true, lastCheck: new Date(), error: null };
        return true;
    } catch (error) {
        console.error('Firebase check failed:', error.message);
        healthStatus.firebase = { healthy: false, lastCheck: new Date(), error: error.message };
        return false;
    }
}

// Determinar backend activo
async function getActiveBackend() {
    const now = Date.now();
    
    // Solo verificar cada 30 segundos
    if (now - lastCheck < CHECK_INTERVAL) {
        return currentBackend;
    }
    
    lastCheck = now;
    init();
    
    // Verificar todos en paralelo
    const [mongoOk, supabaseOk, firebaseOk] = await Promise.all([
        checkMongo(),
        checkSupabase(),
        checkFirebase()
    ]);
    
    // Prioridad: MongoDB > Supabase > Firebase
    if (mongoOk) {
        if (currentBackend !== 'mongodb') {
            console.log('✅ Switched to MongoDB');
        }
        currentBackend = 'mongodb';
        return 'mongodb';
    }
    
    if (supabaseOk) {
        if (currentBackend !== 'supabase') {
            console.log('⚠️ MongoDB down, using Supabase');
        }
        currentBackend = 'supabase';
        return 'supabase';
    }
    
    if (firebaseOk) {
        if (currentBackend !== 'firebase') {
            console.log('🔥 MongoDB & Supabase down, using Firebase');
        }
        currentBackend = 'firebase';
        return 'firebase';
    }
    
    // Si todos fallan, intentar MongoDB de todos modos
    console.error('❌ All backends down');
    return 'mongodb';
}

// Obtener conexión
async function getConnection() {
    const backend = await getActiveBackend();
    
    if (backend === 'mongodb') {
        await mongoClient.connect();
        return {
            type: 'mongodb',
            db: mongoClient.db('finangest'),
            backend: 'mongodb'
        };
    } else if (backend === 'supabase') {
        return {
            type: 'supabase',
            client: supabaseClient,
            backend: 'supabase'
        };
    } else {
        return {
            type: 'firebase',
            db: firebaseDb,
            backend: 'firebase'
        };
    }
}

// Obtener estado de salud
function getHealthStatus() {
    return {
        current: currentBackend,
        backends: healthStatus,
        lastCheck: new Date(lastCheck)
    };
}

// Forzar verificación inmediata
async function forceCheck() {
    lastCheck = 0;
    return await getActiveBackend();
}

module.exports = { 
    getConnection, 
    getActiveBackend, 
    getHealthStatus,
    forceCheck
};
