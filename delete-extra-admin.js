const { connectToDatabase } = require('./api/_db');
const { ObjectId } = require('mongodb');

async function deleteExtraAdmin() {
    try {
        console.log('🔵 Conectando a MongoDB...');
        const { db } = await connectToDatabase();
        
        // Eliminar la cuenta admin@finangest.com
        const result = await db.collection('users').deleteOne({ 
            email: 'admin@finangest.com'
        });
        
        if (result.deletedCount > 0) {
            console.log('✅ Cuenta admin@finangest.com eliminada correctamente');
        } else {
            console.log('⚠️ No se encontró la cuenta admin@finangest.com');
        }
        
        // Verificar que solo quede un admin
        const admins = await db.collection('users').find({ role: 'admin' }).toArray();
        console.log(`\n📋 Admins restantes: ${admins.length}`);
        admins.forEach(admin => {
            console.log(`   - ${admin.nombre} (${admin.email})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

deleteExtraAdmin();
