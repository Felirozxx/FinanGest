const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;
const newPassword = 'Pipe16137356';

async function resetAllPasswords() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        
        const db = client.db('finangest');
        
        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Obtener todos los usuarios
        const users = await db.collection('users').find({}).toArray();
        console.log(`\n📋 Encontrados ${users.length} usuarios\n`);
        
        // Actualizar contraseña de todos
        for (const user of users) {
            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { password: hashedPassword } }
            );
            console.log(`✅ ${user.email || user.username} - Contraseña actualizada`);
        }
        
        console.log(`\n✅ Todas las contraseñas actualizadas a: ${newPassword}\n`);
        
        await client.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

resetAllPasswords();
