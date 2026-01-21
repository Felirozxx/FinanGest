const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

async function createWorker() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        
        const db = client.db('finangest');
        
        // Datos del trabajador
        const email = 'trabajador@finangest.com';
        const password = 'Pipe16137356';
        const nombre = 'Trabajador Test';
        
        // Verificar si ya existe
        const existing = await db.collection('users').findOne({ email });
        if (existing) {
            console.log('⚠️ El usuario ya existe');
            await client.close();
            return;
        }
        
        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Crear trabajador
        const result = await db.collection('users').insertOne({
            nombre: nombre,
            email: email,
            password: hashedPassword,
            role: 'worker',
            activo: true,
            fechaRegistro: new Date()
        });
        
        console.log('✅ Trabajador creado correctamente');
        console.log(`Email: ${email}`);
        console.log(`Contraseña: ${password}`);
        console.log(`ID: ${result.insertedId}`);
        
        await client.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createWorker();
