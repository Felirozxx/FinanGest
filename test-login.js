const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

async function testLogin() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        
        const db = client.db('finangest');
        
        const email = 'fzuluaga548@gmail.com';
        const password = 'Pipe16137356';
        
        const user = await db.collection('users').findOne({ 
            email: email.toLowerCase()
        });
        
        if (!user) {
            console.log('❌ Usuario no encontrado');
            await client.close();
            return;
        }
        
        console.log('\n📋 Usuario encontrado:');
        console.log('Email:', user.email);
        console.log('Nombre:', user.nombre);
        console.log('Role:', user.role);
        console.log('Activo:', user.activo);
        
        const valid = await bcrypt.compare(password, user.password);
        
        if (valid) {
            console.log('\n✅ Contraseña CORRECTA');
            console.log('Login exitoso con:', password);
        } else {
            console.log('\n❌ Contraseña INCORRECTA');
        }
        
        await client.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testLogin();
