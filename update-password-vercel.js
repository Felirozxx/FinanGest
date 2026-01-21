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
        console.log('✅ Conectado a MongoDB\n');
        
        const db = client.db('finangest');
        
        // Generar hash con salt rounds explícito
        console.log('🔧 Generando nuevo hash con bcryptjs...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        console.log('Hash generado:', hashedPassword.substring(0, 30) + '...');
        
        // Verificar que el hash funciona
        const testVerify = await bcrypt.compare(newPassword, hashedPassword);
        console.log('Test de verificación:', testVerify ? '✅ OK' : '❌ FAIL');
        
        if (!testVerify) {
            console.log('❌ El hash no funciona, abortando');
            return;
        }
        
        // Actualizar en MongoDB
        const result = await db.collection('users').updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );
        
        console.log('\n✅ Contraseña actualizada para:', email);
        console.log('   Documentos modificados:', result.modifiedCount);
        
        // Verificar que se guardó correctamente
        const user = await db.collection('users').findOne({ email });
        const finalTest = await bcrypt.compare(newPassword, user.password);
        console.log('   Verificación final:', finalTest ? '✅ OK' : '❌ FAIL');
        
        await client.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

updatePassword();
