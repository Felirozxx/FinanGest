const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb+srv://Felirozxx:Pipe16137356@cluster0.luvtqa7.mongodb.net/finangest?retryWrites=true&w=majority';

async function testConnection() {
    console.log('🔍 Probando conexión a MongoDB...');
    console.log('URI:', mongoUri.replace(/:[^:@]+@/, ':****@'));
    
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ Conexión exitosa a MongoDB Atlas');
        
        const db = client.db('finangest');
        
        // Listar colecciones
        const collections = await db.listCollections().toArray();
        console.log('\n📁 Colecciones disponibles:');
        collections.forEach(col => console.log(`  - ${col.name}`));
        
        // Probar crear una cartera de prueba
        console.log('\n🧪 Probando crear cartera...');
        const testCartera = {
            nombre: 'Test Cartera',
            descripcion: 'Prueba de conexión',
            color: '#00d4ff',
            creadoPor: 'test-user-id',
            fechaCreacion: new Date(),
            eliminada: false,
            activa: true
        };
        
        const result = await db.collection('carteras').insertOne(testCartera);
        console.log('✅ Cartera de prueba creada:', result.insertedId);
        
        // Eliminar la cartera de prueba
        await db.collection('carteras').deleteOne({ _id: result.insertedId });
        console.log('✅ Cartera de prueba eliminada');
        
        await client.close();
        console.log('\n✅ Todo funciona correctamente');
        
    } catch (error) {
        console.error('\n❌ Error de conexión:');
        console.error('Tipo:', error.name);
        console.error('Mensaje:', error.message);
        
        if (error.message.includes('authentication')) {
            console.error('\n💡 Problema: Usuario o contraseña incorrectos en MongoDB Atlas');
        } else if (error.message.includes('network')) {
            console.error('\n💡 Problema: No se puede conectar a MongoDB Atlas (verifica IP whitelist)');
        }
    }
}

testConnection();
