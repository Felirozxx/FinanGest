// Eliminar carteras creadas por el admin
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function eliminarCarteraAdmin() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('finangest');
        
        console.log('🔍 Buscando carteras del admin...\n');
        
        // Obtener admin
        const admin = await db.collection('users').findOne({ 
            email: 'fzuluaga548@gmail.com' 
        });
        
        if (!admin) {
            console.log('❌ Admin no encontrado');
            return;
        }
        
        console.log('👑 Admin encontrado:');
        console.log(`   ID: ${admin._id}`);
        console.log(`   Nombre: ${admin.nombre}`);
        
        // Buscar carteras del admin
        const carterasAdmin = await db.collection('carteras').find({
            creadoPor: admin._id.toString()
        }).toArray();
        
        console.log(`\n📁 Carteras del admin: ${carterasAdmin.length}`);
        
        if (carterasAdmin.length > 0) {
            carterasAdmin.forEach(c => {
                console.log(`   - ${c.nombre} (${c._id})`);
                console.log(`     eliminada: ${c.eliminada}`);
            });
            
            console.log('\n🗑️  Eliminando carteras del admin...');
            
            const result = await db.collection('carteras').deleteMany({
                creadoPor: admin._id.toString()
            });
            
            console.log(`✅ Eliminadas ${result.deletedCount} carteras`);
        } else {
            console.log('✅ El admin no tiene carteras');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

eliminarCarteraAdmin();
