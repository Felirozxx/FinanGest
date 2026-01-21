const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;
const testEmail = 'fzuluaga548@gmail.com';
const testPassword = 'Pipe16137356';

async function checkPassword() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');
        
        const db = client.db('finangest');
        
        // Buscar usuario
        const user = await db.collection('users').findOne({ email: testEmail });
        
        if (!user) {
            console.log('❌ Usuario no encontrado');
            return;
        }
        
        console.log('📋 Usuario encontrado:');
        console.log('   Email:', user.email);
        console.log('   Nombre:', user.nombre);
        console.log('   Role:', user.role);
        console.log('   Activo:', user.activo);
        console.log('   Password hash:', user.password.substring(0, 20) + '...');
        
        // Probar contraseña
        console.log('\n🔐 Probando contraseña:', testPassword);
        const isValid = await bcrypt.compare(testPassword, user.password);
        
        if (isValid) {
            console.log('✅ ¡Contraseña CORRECTA!');
        } else {
            console.log('❌ Contraseña INCORRECTA');
            
            // Crear nuevo hash y comparar
            console.log('\n🔧 Creando nuevo hash...');
            const newHash = await bcrypt.hash(testPassword, 10);
            console.log('   Nuevo hash:', newHash.substring(0, 20) + '...');
            
            const testNew = await bcrypt.compare(testPassword, newHash);
            console.log('   Test con nuevo hash:', testNew ? '✅ Funciona' : '❌ No funciona');
        }
        
        await client.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkPassword();
