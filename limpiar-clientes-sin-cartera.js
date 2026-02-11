// Limpiar clientes sin carteraId o con nombre undefined
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function limpiarClientesMalos() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('finangest');
        
        console.log('🔍 Buscando clientes con problemas...\n');
        
        // Buscar clientes sin carteraId o con nombre undefined
        const clientesMalos = await db.collection('clientes').find({
            $or: [
                { nombre: { $in: [null, undefined, 'undefined'] } },
                { carteraId: { $exists: false } },
                { carteraId: null }
            ]
        }).toArray();
        
        console.log(`📊 Encontrados ${clientesMalos.length} clientes con problemas:\n`);
        
        clientesMalos.forEach(c => {
            console.log(`   ❌ ${c.nombre || 'undefined'}`);
            console.log(`      ID: ${c._id}`);
            console.log(`      creadoPor: ${c.creadoPor || 'N/A'}`);
            console.log(`      userId: ${c.userId || 'N/A'}`);
            console.log(`      carteraId: ${c.carteraId || 'N/A'}`);
            console.log('');
        });
        
        if (clientesMalos.length > 0) {
            console.log('🗑️  ¿Eliminar estos clientes? (son datos de prueba incompletos)');
            console.log('   Ejecutando eliminación...\n');
            
            const result = await db.collection('clientes').deleteMany({
                $or: [
                    { nombre: { $in: [null, undefined, 'undefined'] } },
                    { carteraId: { $exists: false } },
                    { carteraId: null }
                ]
            });
            
            console.log(`✅ Eliminados ${result.deletedCount} clientes`);
        } else {
            console.log('✅ No hay clientes con problemas');
        }
        
        // Verificar clientes restantes
        const clientesRestantes = await db.collection('clientes').countDocuments();
        console.log(`\n📊 Clientes restantes en la base de datos: ${clientesRestantes}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

limpiarClientesMalos();
