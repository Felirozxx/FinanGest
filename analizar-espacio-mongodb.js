// Analizar en detalle qué ocupa espacio en MongoDB
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function analizarEspacio() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('finangest');
        
        console.log('📊 ANÁLISIS DETALLADO DEL ESPACIO EN MONGODB\n');
        console.log('='.repeat(80));
        
        // Contar documentos y calcular tamaño aproximado
        const collections = ['users', 'clientes', 'carteras', 'gastos', 'backups', 'sessions'];
        
        let totalSize = 0;
        const collectionData = [];
        
        for (const collName of collections) {
            try {
                const docs = await db.collection(collName).find({}).toArray();
                const count = docs.length;
                const jsonSize = JSON.stringify(docs).length;
                const sizeMB = jsonSize / (1024 * 1024);
                
                collectionData.push({
                    name: collName,
                    count: count,
                    size: sizeMB
                });
                
                totalSize += sizeMB;
            } catch (e) {
                // Colección no existe
            }
        }
        
        // Ordenar por tamaño
        collectionData.sort((a, b) => b.size - a.size);
        
        console.log('\n📁 COLECCIONES (ordenadas por tamaño):\n');
        
        collectionData.forEach(stat => {
            const percentage = ((stat.size / totalSize) * 100).toFixed(1);
            console.log(`   ${stat.name.padEnd(20)} ${stat.count.toString().padStart(6)} docs   ${stat.size.toFixed(4)} MB (${percentage}%)`);
        });
        
        console.log('\n' + '='.repeat(80));
        console.log(`\n💾 TOTAL APROXIMADO: ${totalSize.toFixed(4)} MB`);
        
        // Desglose de backups
        console.log('\n\n📦 DESGLOSE DE BACKUPS:\n');
        
        const backups = await db.collection('backups').find({}).sort({ fecha: -1 }).toArray();
        
        console.log(`   Total backups: ${backups.length}`);
        
        if (backups.length > 0) {
            // Calcular tamaño de cada backup
            const backupSizes = backups.map(b => {
                const jsonSize = JSON.stringify(b).length;
                const sizeMB = jsonSize / (1024 * 1024);
                return {
                    fecha: new Date(b.fecha).toLocaleString('es-ES'),
                    tipo: b.tipo || 'sistema',
                    userId: b.userId || 'sistema',
                    size: sizeMB
                };
            });
            
            console.log('\n   Últimos 10 backups:');
            backupSizes.slice(0, 10).forEach((b, i) => {
                console.log(`   ${(i+1).toString().padStart(2)}. ${b.fecha.padEnd(20)} ${b.tipo.padEnd(15)} ${b.size.toFixed(4)} MB`);
            });
            
            const totalBackupSize = backupSizes.reduce((sum, b) => sum + b.size, 0);
            console.log(`\n   📊 Tamaño total de backups: ${totalBackupSize.toFixed(4)} MB (${((totalBackupSize/totalSize)*100).toFixed(1)}% del total)`);
            
            // Agrupar por tipo
            const porTipo = {};
            backupSizes.forEach(b => {
                if (!porTipo[b.tipo]) porTipo[b.tipo] = { count: 0, size: 0 };
                porTipo[b.tipo].count++;
                porTipo[b.tipo].size += b.size;
            });
            
            console.log('\n   Por tipo:');
            Object.entries(porTipo).forEach(([tipo, data]) => {
                console.log(`      ${tipo.padEnd(15)} ${data.count.toString().padStart(3)} backups   ${data.size.toFixed(4)} MB`);
            });
        }
        
        // Usuario admin
        console.log('\n\n👤 USUARIO ADMIN:\n');
        const admin = await db.collection('users').findOne({ role: 'admin' });
        if (admin) {
            const adminSize = JSON.stringify(admin).length / 1024;
            console.log(`   Nombre: ${admin.nombre}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Tamaño: ${adminSize.toFixed(2)} KB`);
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('\n💡 RESUMEN:');
        console.log(`   - El 1.29 MB está compuesto principalmente por:`);
        console.log(`     • Backups: ~${((collectionData.find(c => c.name === 'backups')?.size || 0)).toFixed(2)} MB`);
        console.log(`     • Usuario admin: ~${(JSON.stringify(admin).length / (1024 * 1024)).toFixed(4)} MB`);
        console.log(`     • Índices y metadata de MongoDB: resto`);
        console.log(`\n   - Los backups contienen copias de todos los datos del sistema`);
        console.log(`   - Cada backup guarda: usuarios, clientes, carteras, gastos`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

analizarEspacio();
