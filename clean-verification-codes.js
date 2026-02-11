// Limpiar códigos de verificación con undefined
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function cleanCodes() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('finangest');
        
        console.log('🧹 Limpiando códigos con undefined...\n');
        
        // Eliminar todos los códigos con codigo undefined
        const result = await db.collection('verification_codes').deleteMany({
            $or: [
                { codigo: { $exists: false } },
                { codigo: undefined },
                { codigo: null }
            ]
        });
        
        console.log(`✅ Eliminados ${result.deletedCount} códigos inválidos`);
        
        // Mostrar códigos restantes
        const remaining = await db.collection('verification_codes').find({}).toArray();
        console.log(`\n📊 Códigos restantes: ${remaining.length}`);
        
        if (remaining.length > 0) {
            remaining.forEach(c => {
                console.log(`   📧 ${c.email} - Código: ${c.codigo}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

cleanCodes();
