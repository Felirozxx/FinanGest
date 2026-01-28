// Script para probar el sistema de failover ANTES de activarlo
require('dotenv').config();

async function testFailover() {
    console.log('🧪 Probando Sistema de Failover...\n');
    
    try {
        // Test 1: Verificar MongoDB
        console.log('1️⃣ Probando conexión a MongoDB...');
        const { MongoClient } = require('mongodb');
        const mongoClient = new MongoClient(process.env.MONGODB_URI);
        await mongoClient.connect();
        await mongoClient.db('finangest').command({ ping: 1 });
        console.log('   ✅ MongoDB funcionando correctamente\n');
        await mongoClient.close();
        
        // Test 2: Verificar Supabase
        console.log('2️⃣ Probando conexión a Supabase...');
        if (!process.env.SUPABASE_KEY) {
            console.log('   ⚠️  SUPABASE_KEY no configurada');
            console.log('   Ejecuta: node setup-failover-system.js\n');
            return;
        }
        
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            'https://tqbddnjzgaifeoidtswt.supabase.co',
            process.env.SUPABASE_KEY
        );
        
        const { error } = await supabase.from('users').select('count').limit(1);
        if (error) {
            console.log('   ❌ Error en Supabase:', error.message);
            console.log('   Verifica que las tablas estén creadas\n');
            return;
        }
        console.log('   ✅ Supabase funcionando correctamente\n');
        
        // Test 3: Probar failover
        console.log('3️⃣ Probando sistema de failover...');
        const { getConnection } = require('./api/_db-simple-failover');
        const connection = await getConnection();
        console.log(`   ✅ Backend activo: ${connection.type}\n`);
        
        console.log('✅ TODOS LOS TESTS PASARON!\n');
        console.log('📝 Para activar el failover en producción:');
        console.log('   1. Ve a Vercel > Settings > Environment Variables');
        console.log('   2. Cambia USE_FAILOVER = true');
        console.log('   3. Redeploy la aplicación\n');
        
    } catch (error) {
        console.log('\n❌ Error en las pruebas:', error.message);
        console.log('   No actives el failover hasta resolver este error\n');
    }
}

testFailover();
