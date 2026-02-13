const fetch = require('node-fetch');

const token = "APP_USR-2538548389422105-010920-fbf44cea36e8b750f9cb48f4a378a5-220580674";

async function testToken() {
    try {
        console.log('🔍 Probando token MercadoPago...');
        
        const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (response.ok) {
            console.log('✅ Token válido');
        } else {
            console.log('❌ Token inválido o expirado');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testToken();
