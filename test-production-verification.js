// Test del endpoint de verificación en producción
const fetch = require('node-fetch');

const API_URL = 'https://finangest.vercel.app';
const TEST_EMAIL = 'fzuluaga548@gmail.com';

async function testProduction() {
    console.log('🌐 Testing production verification system\n');
    console.log('API URL:', API_URL);
    console.log('Test email:', TEST_EMAIL);
    console.log('='.repeat(50));
    
    try {
        // PASO 1: Enviar código
        console.log('\n📧 PASO 1: Enviar código...');
        const sendRes = await fetch(`${API_URL}/api/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL })
        });
        
        const sendData = await sendRes.json();
        console.log('   Status:', sendRes.status);
        console.log('   Response:', JSON.stringify(sendData, null, 2));
        
        if (!sendData.success) {
            throw new Error('Failed to send code: ' + sendData.error);
        }
        
        console.log('   ✓ Código enviado exitosamente');
        console.log('\n⏳ Esperando 5 segundos para que llegue el email...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // PASO 2: Pedir al usuario que ingrese el código
        console.log('\n🔢 PASO 2: Verificar código');
        console.log('   Por favor revisa tu email y copia el código de 6 dígitos');
        console.log('   Luego ejecuta este comando con el código:');
        console.log(`   node test-verify-code.js <CODIGO>`);
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ Envío completado. Revisa tu email.\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
    }
}

testProduction();
