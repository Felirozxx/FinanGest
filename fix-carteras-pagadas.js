const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://Felirozxx:Pipe16137356@cluster0.luvtqa7.mongodb.net/finangest?retryWrites=true&w=majority';

async function fixCarterasPagadas() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');
        
        const db = client.db('finangest');
        
        // Obtener todos los usuarios
        const users = await db.collection('users').find({}).toArray();
        
        console.log('🔧 Sincronizando carterasPagadas con carteras existentes...\n');
        
        for (const user of users) {
            // Contar carteras activas del usuario
            const carterasActivas = await db.collection('carteras').countDocuments({
                creadoPor: user._id.toString(),
                eliminada: false
            });
            
            const carterasPagadas = user.carterasPagadas || 0;
            
            console.log(`👤 Usuario: ${user.nombre} (${user.email})`);
            console.log(`   Carteras activas: ${carterasActivas}`);
            console.log(`   Carteras pagadas: ${carterasPagadas}`);
            
            // Si tiene más carteras activas que pagadas, actualizar
            if (carterasActivas > carterasPagadas) {
                console.log(`   🔧 Actualizando carterasPagadas de ${carterasPagadas} a ${carterasActivas}`);
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { $set: { carterasPagadas: carterasActivas } }
                );
                console.log(`   ✅ Actualizado`);
            } else {
                console.log(`   ✅ Ya está sincronizado`);
            }
            console.log('');
        }
        
        console.log('✅ Proceso completado');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

fixCarterasPagadas();
