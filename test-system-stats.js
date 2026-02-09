const fetch = require('node-fetch');

async function testSystemStats() {
    try {
        console.log('🔵 Probando endpoint de estadísticas del sistema...\n');
        
        const API_URL = 'https://finangest.vercel.app';
        
        console.log('📤 Enviando request a:', API_URL + '/api/admin/system-stats');
        
        const response = await fetch(API_URL + '/api/admin/system-stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📥 Status:', response.status, response.statusText);
        console.log('');
        
        const text = await response.text();
        console.log('📥 Response (raw):', text.substring(0, 500));
        console.log('');
        
        try {
            const data = JSON.parse(text);
            console.log('📥 Response (parsed):', JSON.stringify(data, null, 2));
            
            if (data.success) {
                console.log('\n✅ ÉXITO - Estadísticas obtenidas');
                console.log('\n📊 Resumen:');
                console.log('  - MongoDB usado:', data.stats.storageUsedMB, 'MB de', data.stats.storageLimitMB, 'MB');
                console.log('  - Porcentaje:', data.stats.storagePercent + '%');
                console.log('  - Trabajadores:', data.stats.totalTrabajadores);
                console.log('  - Clientes:', data.stats.totalClientes);
                console.log('  - Estado:', data.stats.estado);
            } else {
                console.log('\n❌ ERROR:', data.error);
            }
        } catch (e) {
            console.log('⚠️ No se pudo parsear como JSON:', e.message);
        }
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
}

testSystemStats();
