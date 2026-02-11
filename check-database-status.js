// Verificar el estado actual de la base de datos
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkDatabase() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('finangest');
        
        console.log('📊 ESTADO ACTUAL DE LA BASE DE DATOS\n');
        console.log('='.repeat(80));
        
        // Contar documentos en cada colección
        const collections = ['users', 'clientes', 'carteras', 'gastos', 'backups'];
        
        for (const collName of collections) {
            const count = await db.collection(collName).countDocuments();
            console.log(`\n📁 ${collName}: ${count} documentos`);
            
            if (count > 0 && count < 10) {
                const docs = await db.collection(collName).find({}).limit(5).toArray();
                docs.forEach(doc => {
                    if (collName === 'users') {
                        console.log(`   - ${doc.nombre || doc.email} (${doc.role || 'worker'})`);
                    } else if (collName === 'backups') {
                        console.log(`   - ${doc.tipo || 'backup'} - ${new Date(doc.fecha).toLocaleString()}`);
                    } else if (collName === 'gastos') {
                        console.log(`   - ${doc.descripcion || 'Sin descripción'} - R$ ${doc.monto || 0}`);
                    } else {
                        console.log(`   - ${doc.nombre || doc._id}`);
                    }
                });
            }
        }
        
        // Calcular tamaño total
        const stats = await db.stats();
        const sizeMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
        
        console.log('\n\n' + '='.repeat(80));
        console.log(`💾 Tamaño total: ${sizeMB} MB`);
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkDatabase();
