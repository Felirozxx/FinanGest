// Test del sistema de failover v2
require('dotenv').config();

const { getConnection, getActiveBackend, getHealthStatus, forceCheck } = require('./api/_db-failover-v2');

async function testFailover() {
    console.log('🧪 Iniciando pruebas del sistema de failover v2\n');
    
    try {
        // Test 1: Verificar backend activo
        console.log('Test 1: Verificar backend activo');
        const backend = await getActiveBackend();
        console.log(`✓ Backend activo: ${backend}\n`);
        
        // Test 2: Obtener estado de salud
        console.log('Test 2: Estado de salud de backends');
        const health = getHealthStatus();
        console.log('Estado:', JSON.stringify(health, null, 2));
        console.log('');
        
        // Test 3: Obtener conexión
        console.log('Test 3: Obtener conexión');
        const connection = await getConnection();
        console.log(`✓ Conexión obtenida: tipo=${connection.type}, backend=${connection.backend}\n`);
        
        // Test 4: Verificar que funciona la conexión
        console.log('Test 4: Verificar funcionalidad');
        if (connection.type === 'mongodb') {
            const result = await connection.db.command({ ping: 1 });
            console.log('✓ MongoDB ping exitoso:', result);
            
            // Contar usuarios
            const count = await connection.db.collection('users').countDocuments();
            console.log(`✓ Usuarios en base de datos: ${count}\n`);
        } else if (connection.type === 'supabase') {
            const { data, error } = await connection.client.from('users').select('count');
            if (error) throw error;
            console.log('✓ Supabase query exitosa');
            console.log(`✓ Usuarios en base de datos: ${data ? data.length : 0}\n`);
        }
        
        // Test 5: Forzar nueva verificación
        console.log('Test 5: Forzar nueva verificación');
        await forceCheck();
        const newHealth = getHealthStatus();
        console.log('Estado actualizado:', JSON.stringify(newHealth, null, 2));
        console.log('');
        
        console.log('✅ Todas las pruebas completadas exitosamente');
        
        // Resumen
        console.log('\n📊 RESUMEN:');
        console.log(`- Backend activo: ${newHealth.current}`);
        console.log(`- MongoDB: ${newHealth.backends.mongodb.healthy ? '✓ Saludable' : '✗ No disponible'}`);
        console.log(`- Supabase: ${newHealth.backends.supabase.healthy ? '✓ Saludable' : '✗ No disponible'}`);
        console.log(`- Firebase: ${newHealth.backends.firebase.healthy ? '✓ Saludable' : '✗ No disponible'}`);
        
        const healthyCount = [
            newHealth.backends.mongodb.healthy,
            newHealth.backends.supabase.healthy,
            newHealth.backends.firebase.healthy
        ].filter(Boolean).length;
        
        if (healthyCount === 3) {
            console.log('\n🎉 Sistema de failover completamente funcional (3 niveles)');
        } else if (healthyCount >= 1) {
            console.log(`\n⚠️ ${healthyCount} de 3 backends disponibles`);
        } else {
            console.log('\n❌ Ningún backend disponible');
        }
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

// Ejecutar pruebas
testFailover();
