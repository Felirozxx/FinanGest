const { MongoClient } = require('mongodb');
const crypto = require('crypto');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;
const newPassword = 'Pipe16137356';

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

async function updateAllPasswords() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');
        
        const db = client.db('finangest');
        
        // Generar hash con crypto
        console.log('🔧 Generando hash con crypto (Node.js nativo)...');
        const hashedPassword = hashPassword(newPassword);
        console.log('Hash generado:', hashedPassword.substring(0, 40) + '...\n');
        
        // Obtener todos los usuarios
        const users = await db.collection('users').find({}).toArray();
        console.log(`📋 Encontrados ${users.length} usuarios\n`);
        
        // Actualizar contraseña de todos
        for (const user of users) {
            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { password: hashedPassword } }
            );
            console.log(`✅ ${user.email || user.username} - Contraseña actualizada`);
        }
        
        console.log(`\n✅ Todas las contraseñas actualizadas a: ${newPassword}`);
        console.log('🔐 Sistema: crypto (Node.js nativo)\n');
        
        await client.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

updateAllPasswords();
