const fetch = require('node-fetch');

async function testDeleteEndpoint() {
    try {
        console.log('🔵 Probando endpoint de eliminación...\n');
        
        const API_URL = 'https://finangest.vercel.app';
        
        // Datos de prueba (usando el ID del admin y un trabajador)
        const payload = {
            adminPassword: 'Pipe16137356',
            trabajadorId: '696b5f1fc242804ad77287e6', // ID de Pipe (trabajador)
            adminId: '69695eb7f606fe297bd06999' // ID del admin
        };
        
        console.log('📤 Enviando request a:', API_URL + '/api/admin/eliminar-datos-trabajador');
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));
        console.log('');
        
        const response = await fetch(API_URL + '/api/admin/eliminar-datos-trabajador', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('📥 Status:', response.status, response.statusText);
        console.log('📥 Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        console.log('');
        
        const text = await response.text();
        console.log('📥 Response (raw):', text);
        console.log('');
        
        try {
            const data = JSON.parse(text);
            console.log('📥 Response (parsed):', JSON.stringify(data, null, 2));
            
            if (data.success) {
                console.log('\n✅ ÉXITO - Usuario eliminado');
            } else {
                console.log('\n❌ ERROR:', data.error);
            }
        } catch (e) {
            console.log('⚠️ No se pudo parsear como JSON');
        }
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        console.error(error);
    }
}

testDeleteEndpoint();
