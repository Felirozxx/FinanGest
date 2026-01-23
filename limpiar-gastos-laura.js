const { MongoClient } = require('mongodb');
require('dotenv').config();

async function limpiarGastosLaura() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        
        const db = client.db('finangest');
        
        // Buscar la cartera "laura"
        const carteraLaura = await db.collection('carteras').findOne({ nombre: 'laura' });
        
        if (!carteraLaura) {
            console.log('❌ No se encontró la cartera "laura"');
            return;
        }
        
        console.log('📁 Cartera encontrada:', carteraLaura.nombre, 'ID:', carteraLaura._id);
        
        // Eliminar todos los gastos de la cartera laura
        const resultGastos = await db.collection('gastos').deleteMany({ 
            carteraId: carteraLaura._id.toString() 
        });
        
        console.log(`🗑️  Gastos eliminados: ${resultGastos.deletedCount}`);
        
        // También eliminar gastos sin carteraId del usuario admin
        const user = await db.collection('users').findOne({ email: 'fzuluaga548@gmail.com' });
        if (user) {
            const resultGastosSinCartera = await db.collection('gastos').deleteMany({ 
                userId: user._id.toString(),
                carteraId: { $exists: false }
            });
            console.log(`🗑️  Gastos sin cartera eliminados: ${resultGastosSinCartera.deletedCount}`);
        }
        
        console.log('✅ Limpieza completada');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

limpiarGastosLaura();
