const { connectToDatabase } = require('./api/_db');

async function checkRealStorage() {
    try {
        console.log('🔵 Conectando a MongoDB...');
        const { db } = await connectToDatabase();
        
        // Contar documentos reales
        const collections = ['users', 'clientes', 'carteras', 'gastos', 'sessions', 'backups'];
        let totalDocs = 0;
        
        console.log('\n📊 Documentos por colección:\n');
        
        for (const collName of collections) {
            const count = await db.collection(collName).countDocuments();
            console.log(`  ${collName.padEnd(15)}: ${count.toString().padStart(5)} documentos`);
            totalDocs += count;
        }
        
        console.log(`  ${'─'.repeat(15)}   ${'─'.repeat(5)}`);
        console.log(`  ${'TOTAL'.padEnd(15)}: ${totalDocs.toString().padStart(5)} documentos`);
        
        // Obtener estadísticas reales de MongoDB
        const stats = await db.stats();
        
        console.log('\n💾 Estadísticas reales de MongoDB:\n');
        console.log(`  Tamaño de datos:     ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Tamaño de storage:   ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Tamaño de índices:   ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Tamaño total:        ${((stats.dataSize + stats.indexSize) / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Número de colecciones: ${stats.collections}`);
        
        // Calcular promedio por documento
        const avgDocSize = totalDocs > 0 ? (stats.dataSize / totalDocs / 1024).toFixed(2) : 0;
        console.log(`  Tamaño promedio/doc: ${avgDocSize} KB`);
        
        // Calcular porcentaje usado (límite 512 MB)
        const limitMB = 512;
        const usedMB = (stats.dataSize + stats.indexSize) / 1024 / 1024;
        const percentUsed = ((usedMB / limitMB) * 100).toFixed(2);
        
        console.log(`\n📈 Uso del plan FREE (512 MB):\n`);
        console.log(`  Usado:      ${usedMB.toFixed(2)} MB`);
        console.log(`  Disponible: ${(limitMB - usedMB).toFixed(2)} MB`);
        console.log(`  Porcentaje: ${percentUsed}%`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkRealStorage();
