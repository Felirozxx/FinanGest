// Verificar el campo carterasPagadas de los usuarios
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function checkCarterasPagadas() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('finangest');
        
        console.log('🔍 Verificando carteras pagadas...\n');
        
        // Obtener usuario Pipe
        const pipe = await db.collection('users').findOne({ 
            email: 'felirozxx@gmail.com' 
        });
        
        console.log('👤 Usuario Pipe:');
        console.log(`   ID: ${pipe._id}`);
        console.log(`   Nombre: ${pipe.nombre}`);
        console.log(`   carterasPagadas: ${pipe.carterasPagadas || 0}`);
        
        // Contar carteras activas reales
        const carterasActivas = await db.collection('carteras').countDocuments({
            creadoPor: pipe._id.toString(),
            eliminada: false
        });
        
        console.log(`   Carteras activas en DB: ${carterasActivas}`);
        
        // Listar las carteras
        const carteras = await db.collection('carteras').find({
            creadoPor: pipe._id.toString(),
            eliminada: false
        }).toArray();
        
        console.log('\n📁 Carteras:');
        carteras.forEach(c => {
            console.log(`   - ${c.nombre}`);
            console.log(`     activa: ${c.activa}`);
            console.log(`     pendientePago: ${c.pendientePago}`);
        });
        
        // Actualizar el campo carterasPagadas
        if (pipe.carterasPagadas !== carterasActivas) {
            console.log(`\n🔧 Actualizando carterasPagadas de ${pipe.carterasPagadas || 0} a ${carterasActivas}...`);
            
            await db.collection('users').updateOne(
                { _id: pipe._id },
                { $set: { carterasPagadas: carterasActivas } }
            );
            
            console.log('✅ Campo actualizado');
        } else {
            console.log('\n✅ El campo carterasPagadas ya está correcto');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkCarterasPagadas();
