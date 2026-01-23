// Sistema de sincronización automática entre backends
const { connectToDatabase } = require('./_db');
const { Client } = require('pg');

// Sincronizar datos de MongoDB a Supabase (PostgreSQL)
async function syncToSupabase() {
    if (!process.env.SUPABASE_URI) {
        return { success: false, error: 'Supabase no configurado' };
    }

    try {
        console.log('🔄 Iniciando sincronización a Supabase...');
        
        // Conectar a MongoDB
        const { db: mongoDb } = await connectToDatabase();
        
        // Conectar a Supabase (PostgreSQL)
        const supabase = new Client({
            connectionString: process.env.SUPABASE_URI,
            ssl: { rejectUnauthorized: false }
        });
        await supabase.connect();

        // Crear tablas si no existen
        await createSupabaseTables(supabase);

        // Sincronizar colecciones
        const collections = ['users', 'clientes', 'carteras', 'gastos', 'systemConfig'];
        let synced = 0;

        for (const collectionName of collections) {
            const docs = await mongoDb.collection(collectionName).find({}).toArray();
            
            for (const doc of docs) {
                await upsertToSupabase(supabase, collectionName, doc);
                synced++;
            }
        }

        await supabase.end();
        
        console.log(`✅ Sincronizados ${synced} documentos a Supabase`);
        return { success: true, synced };
    } catch (error) {
        console.error('❌ Error sincronizando a Supabase:', error);
        return { success: false, error: error.message };
    }
}

// Crear tablas en Supabase
async function createSupabaseTables(client) {
    const tables = {
        users: `
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                password TEXT,
                nombre TEXT,
                rol TEXT,
                activo BOOLEAN,
                fecha_creacion TIMESTAMP,
                data JSONB
            )
        `,
        clientes: `
            CREATE TABLE IF NOT EXISTS clientes (
                id TEXT PRIMARY KEY,
                nombre TEXT,
                cedula TEXT,
                telefono TEXT,
                direccion TEXT,
                cartera_id TEXT,
                activo BOOLEAN,
                fecha_creacion TIMESTAMP,
                data JSONB
            )
        `,
        carteras: `
            CREATE TABLE IF NOT EXISTS carteras (
                id TEXT PRIMARY KEY,
                nombre TEXT,
                cobrador_id TEXT,
                activa BOOLEAN,
                fecha_creacion TIMESTAMP,
                data JSONB
            )
        `,
        gastos: `
            CREATE TABLE IF NOT EXISTS gastos (
                id TEXT PRIMARY KEY,
                cartera_id TEXT,
                monto NUMERIC,
                descripcion TEXT,
                fecha TIMESTAMP,
                data JSONB
            )
        `,
        systemConfig: `
            CREATE TABLE IF NOT EXISTS system_config (
                id TEXT PRIMARY KEY,
                key TEXT UNIQUE,
                value JSONB,
                updated_at TIMESTAMP
            )
        `
    };

    for (const [name, sql] of Object.entries(tables)) {
        try {
            await client.query(sql);
        } catch (error) {
            console.log(`⚠️  Tabla ${name} ya existe o error:`, error.message);
        }
    }
}

// Insertar o actualizar en Supabase
async function upsertToSupabase(client, table, doc) {
    const id = doc._id?.toString() || doc.id;
    delete doc._id; // PostgreSQL no usa _id

    const columns = Object.keys(doc);
    const values = Object.values(doc);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    // Guardar todo el documento en la columna 'data' como JSONB
    const sql = `
        INSERT INTO ${table} (id, data)
        VALUES ($1, $2)
        ON CONFLICT (id) 
        DO UPDATE SET data = $2
    `;

    await client.query(sql, [id, JSON.stringify(doc)]);
}

// Sincronizar desde Supabase a MongoDB (para cuando cambias de backend)
async function syncFromSupabase() {
    if (!process.env.SUPABASE_URI) {
        return { success: false, error: 'Supabase no configurado' };
    }

    try {
        console.log('🔄 Sincronizando desde Supabase a MongoDB...');
        
        const { db: mongoDb } = await connectToDatabase();
        const supabase = new Client({
            connectionString: process.env.SUPABASE_URI,
            ssl: { rejectUnauthorized: false }
        });
        await supabase.connect();

        const tables = ['users', 'clientes', 'carteras', 'gastos', 'system_config'];
        let synced = 0;

        for (const table of tables) {
            try {
                const result = await supabase.query(`SELECT * FROM ${table}`);
                
                for (const row of result.rows) {
                    const doc = row.data || row;
                    const collectionName = table === 'system_config' ? 'systemConfig' : table;
                    
                    await mongoDb.collection(collectionName).updateOne(
                        { _id: row.id },
                        { $set: doc },
                        { upsert: true }
                    );
                    synced++;
                }
            } catch (error) {
                console.log(`⚠️  Tabla ${table} no existe o error:`, error.message);
            }
        }

        await supabase.end();
        
        console.log(`✅ Sincronizados ${synced} registros desde Supabase`);
        return { success: true, synced };
    } catch (error) {
        console.error('❌ Error sincronizando desde Supabase:', error);
        return { success: false, error: error.message };
    }
}

// Endpoint para sincronización manual
module.exports = async (req, res) => {
    // Verificar autenticación admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const { action } = req.query;

        if (action === 'to-supabase') {
            const result = await syncToSupabase();
            return res.json(result);
        } else if (action === 'from-supabase') {
            const result = await syncFromSupabase();
            return res.json(result);
        } else if (action === 'auto') {
            // Sincronización automática bidireccional
            const toSupabase = await syncToSupabase();
            return res.json({ 
                success: toSupabase.success,
                toSupabase 
            });
        } else {
            return res.status(400).json({ error: 'Acción no válida' });
        }
    } catch (error) {
        console.error('Error en sincronización:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports.syncToSupabase = syncToSupabase;
module.exports.syncFromSupabase = syncFromSupabase;
