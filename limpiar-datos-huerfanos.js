// Limpiar todos los datos huérfanos (carteras, gastos, backups sin usuarios)
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function limpiarDatosHuerfanos() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('finangest');
        
        console.log('🧹 LIMPIANDO DATOS HUÉRFANOS\n');
        console.log('='.repeat(80));
        
        // Obtener IDs de usuarios válidos
        const users = await db.collection('users').find({}).toArray();
        const validUserIds = users.map(u => u._id.toString());
        
        console.log(`\n✅ Usuarios válidos: ${validUserIds.length}`);
        validUserIds.forEach(id => console.log(`   - ${id}`));
        
        // 1. Eliminar carteras huérfanas
        console.log('\n\n🗑️  Eliminando carteras huérfanas...');
        const carterasHuerfanas = await db.collection('carteras').find({
            creadoPor: { $nin: validUserIds }
        }).toArray();
        
        console.log(`   Encontradas: ${carterasHuerfanas.length}`);
        carterasHuerfanas.forEach(c => console.log(`   - ${c.nombre} (creadoPor: ${c.creadoPor})`));
        
        if (carterasHuerfanas.length > 0) {
            const result = await db.collection('carteras').deleteMany({
                creadoPor: { $nin: validUserIds }
            });
            console.log(`   ✅ Eliminadas: ${result.deletedCount}`);
        }
        
        // 2. Eliminar gastos huérfanos
        console.log('\n\n🗑️  Eliminando gastos huérfanos...');
        const gastosHuerfanos = await db.collection('gastos').find({
            userId: { $nin: validUserIds }
        }).toArray();
        
        console.log(`   Encontrados: ${gastosHuerfanos.length}`);
        gastosHuerfanos.forEach(g => console.log(`   - ${g.descripcion} (userId: ${g.userId})`));
        
        if (gastosHuerfanos.length > 0) {
            const result = await db.collection('gastos').deleteMany({
                userId: { $nin: validUserIds }
            });
            console.log(`   ✅ Eliminados: ${result.deletedCount}`);
        }
        
        // 3. Eliminar backups viejos (mantener solo los últimos 7 días)
        console.log('\n\n🗑️  Eliminando backups viejos (más de 7 días)...');
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const backupsViejos = await db.collection('backups').countDocuments({
            fecha: { $lt: sevenDaysAgo }
        });
        
        console.log(`   Encontrados: ${backupsViejos}`);
        
        if (backupsViejos > 0) {
            const result = await db.collection('backups').deleteMany({
                fecha: { $lt: sevenDaysAgo }
            });
            console.log(`   ✅ Eliminados: ${result.deletedCount}`);
        }
        
        // 4. Verificar estado final
        console.log('\n\n' + '='.repeat(80));
        console.log('📊 ESTADO FINAL:\n');
        
        const finalCounts = {
            users: await db.collection('users').countDocuments(),
            clientes: await db.collection('clientes').countDocuments(),
            carteras: await db.collection('carteras').countDocuments(),
            gastos: await db.collection('gastos').countDocuments(),
            backups: await db.collection('backups').countDocuments()
        };
        
        Object.entries(finalCounts).forEach(([name, count]) => {
            console.log(`   ${name}: ${count}`);
        });
        
        const stats = await db.stats();
        const sizeMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
        console.log(`\n💾 Tamaño total: ${sizeMB} MB`);
        
        console.log('\n✅ Limpieza completada');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

limpiarDatosHuerfanos();
