const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;
const email = 'fzuluaga548@gmail.com';
const newPassword = 'Pipe16137356';

async function updatePassword() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        
        const db = client.db('finangest');
        
        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Actualizar contraseña
        const result = await db.collection('users').updateOne(
            { email: email },
            { $set: { password: hashedPassword } }
        );
        
        if (result.matchedCount > 0) {
            console.log('✅ Contraseña actualizada correctamente');
            console.log(`Email: ${email}`);
            console.log(`Nueva contraseña: ${newPassword}`);
        } else {
            console.log('❌ Usuario no encontrado');
        }
        
        await client.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

updatePassword();
