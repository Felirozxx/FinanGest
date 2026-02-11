// Test de verificación de código en producción
const fetch = require('node-fetch');

const API_URL = 'https://finangest.vercel.app';
const TEST_EMAIL = 'fzuluaga548@gmail.com';

async function testVerify() {
    const codigo = process.argv[2];
    
    if (!codigo) {
        console.log('❌ Por favor proporciona el código:');
        console.log('   node test-verify-code.js <CODIGO>');
        process.exit(1);
    }
    
    console.log('🔍 Verificando código en producción\n');
    console.log('Email:', TEST_EMAIL);
    console.log('Código:', codigo);
    console.log('='.repeat(50));
    
    try {
        const verifyRes = await fetch(`${API_URL}/api/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: TEST_EMAIL, 
                code: codigo 
            })
        });
        
        const verifyData = await verifyRes.json();
        
        console.log('\n📥 Response:');
        console.log('   Status:', verifyRes.status);
        console.log('   Data:', JSON.stringify(verifyData, null, 2));
        
        if (verifyData.success) {
            console.log('\n✅ CÓDIGO VERIFICADO CORRECTAMENTE');
        } else {
            console.log('\n❌ ERROR:', verifyData.error);
        }
        
        console.log('\n' + '='.repeat(50));
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
    }
}

testVerify();
