// Test del endpoint verify-code
require('dotenv').config();
const fetch = require('node-fetch');

const API_URL = 'https://finangest.vercel.app';
const TEST_EMAIL = 'test' + Date.now() + '@example.com';

async function testVerifyEndpoint() {
    console.log('🧪 Testing verify-code endpoint\n');
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
        console.log('   Response:', JSON.stringify(sendData, null, 2));
        
        if (!sendData.success) {
            throw new Error('Failed to send code');
        }
        
        // PASO 2: Obtener código de MongoDB
        console.log('\n🔍 PASO 2: Obtener código de MongoDB...');
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db('finangest');
        
        const codigoDoc = await db.collection('verification_codes').findOne({ email: TEST_EMAIL });
        console.log('   Código en DB:', codigoDoc?.codigo);
        
        if (!codigoDoc || !codigoDoc.codigo) {
            throw new Error('Código no encontrado en DB');
        }
        
        // PASO 3: Verificar código
        console.log('\n✅ PASO 3: Verificar código...');
        const verifyRes = await fetch(`${API_URL}/api/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: TEST_EMAIL,
                code: codigoDoc.codigo,
                password: 'Test123456',
                username: 'testuser',
                recoveryEmail: TEST_EMAIL,
                timezone: 'America/Sao_Paulo'
            })
        });
        
        const verifyData = await verifyRes.json();
        console.log('   Status:', verifyRes.status);
        console.log('   Response:', JSON.stringify(verifyData, null, 2));
        
        if (verifyData.success && verifyData.userId) {
            console.log('\n✅ SUCCESS: userId devuelto:', verifyData.userId);
            
            // Limpiar usuario de prueba
            await db.collection('users').deleteOne({ email: TEST_EMAIL });
            console.log('   Usuario de prueba eliminado');
        } else {
            console.log('\n❌ FAILED: No userId en respuesta');
        }
        
        await client.close();
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
    }
}

testVerifyEndpoint();
