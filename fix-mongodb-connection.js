const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixConnection() {
    console.log('🔵 Intentando conectar a MongoDB...');
    console.log('📝 URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');
    
    const client = new MongoClient(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
    });
    
    try {
        await client.connect();
        console.log('✅ Conexión exitosa!');
        
        const db = client.db('finangest');
        
        // Buscar usuarios admin
        console.log('\n🔍 Buscando usuarios admin...');
        const admins = await db.collection('users').find({ role: 'admin' }).toArray();
        
        if (admins.length === 0) {
            console.log('❌ NO hay usuarios admin en la base de datos!');
            console.log('\n📝 Creando usuario admin...');
            
            const { hashPassword } = require('./api/_crypto-hash');
            
            const adminUser = {
                nombre: 'Admin',
                email: 'admin@finangest.com',
                password: hashPassword('admin123'),
                role: 'admin',
                activo: true,
                fechaRegistro: new Date()
            };
            
            await db.collection('users').insertOne(adminUser);
            console.log('✅ Usuario admin creado!');
            console.log('\n📋 CREDENCIALES:');
            console.log('Email: admin@finangest.com');
            console.log('Password: admin123');
        } else {
            console.log(`✅ Encontrados ${admins.length} admin(s):\n`);
            admins.forEach((admin, i) => {
                console.log(`${i + 1}. Email: ${admin.email}`);
                console.log(`   Nombre: ${admin.nombre}`);
                console.log(`   Activo: ${admin.activo}`);
                console.log('');
            });
            
            console.log('\n📋 Para resetear contraseña de un admin, usa:');
            console.log('node reset-admin-password-vercel.js');
        }
        
        await client.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR DE CONEXIÓN:', error.message);
        console.log('\n🔧 SOLUCIONES:');
        console.log('1. Ve a: https://cloud.mongodb.com/');
        console.log('2. Network Access → Add IP Address');
        console.log('3. Selecciona "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)');
        console.log('4. Espera 2-3 minutos');
        console.log('5. Vuelve a ejecutar este script');
        process.exit(1);
    }
}

fixConnection();
