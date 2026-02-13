// Script para verificar el Access Token de Mercado Pago
require('dotenv').config();
const fetch = require('node-fetch');

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

async function verificarToken() {
    console.log('🔍 Verificando Access Token de Mercado Pago...\n');
    console.log('Token:', ACCESS_TOKEN ? ACCESS_TOKEN.substring(0, 20) + '...' : 'NO CONFIGURADO');
    
    if (!ACCESS_TOKEN) {
        console.error('❌ MERCADOPAGO_ACCESS_TOKEN no está configurado en .env');
        return;
    }
    
    try {
        // 1. Verificar información del usuario/aplicación
        console.log('\n📋 Verificando información de la aplicación...');
        const userResponse = await fetch('https://api.mercadopago.com/users/me', {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        
        const userData = await userResponse.json();
        
        if (userResponse.ok) {
            console.log('✅ Token válido!');
            console.log('   User ID:', userData.id);
            console.log('   Email:', userData.email);
            console.log('   Nickname:', userData.nickname);
            console.log('   Site ID:', userData.site_id);
            console.log('   Country:', userData.country_id);
        } else {
            console.error('❌ Token inválido o expirado');
            console.error('   Error:', userData.message);
            console.error('   Detalles:', JSON.stringify(userData, null, 2));
            return;
        }
        
        // 2. Intentar crear una preferencia de prueba
        console.log('\n💳 Intentando crear una preferencia de pago de prueba...');
        const preference = {
            items: [
                {
                    title: 'Test FinanGest',
                    quantity: 1,
                    unit_price: 51.41,
                    currency_id: 'BRL'
                }
            ],
            payer: {
                email: 'test@test.com',
                name: 'Test User'
            },
            payment_methods: {
                excluded_payment_types: [
                    { id: 'credit_card' },
                    { id: 'debit_card' },
                    { id: 'ticket' }
                ],
                installments: 1
            },
            back_urls: {
                success: 'https://finangest.vercel.app',
                failure: 'https://finangest.vercel.app',
                pending: 'https://finangest.vercel.app'
            },
            auto_return: 'approved',
            external_reference: 'test_123',
            statement_descriptor: 'FINANGEST'
        };
        
        const prefResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify(preference)
        });
        
        const prefData = await prefResponse.json();
        
        if (prefResponse.ok) {
            console.log('✅ Preferencia creada exitosamente!');
            console.log('   Preference ID:', prefData.id);
            console.log('   Init Point:', prefData.init_point);
            console.log('   Sandbox Init Point:', prefData.sandbox_init_point);
            console.log('\n🎉 El token está funcionando correctamente!');
            console.log('   Puedes usar este token en producción.');
        } else {
            console.error('❌ Error al crear preferencia');
            console.error('   Status:', prefResponse.status);
            console.error('   Error:', prefData.message);
            console.error('   Causa:', prefData.cause);
            console.error('   Detalles completos:', JSON.stringify(prefData, null, 2));
            
            if (prefData.message && prefData.message.includes('recursos de la API')) {
                console.log('\n💡 SOLUCIÓN:');
                console.log('   1. Ve a https://www.mercadopago.com.br/developers/panel/app');
                console.log('   2. Verifica que tu aplicación esté ACTIVADA para producción');
                console.log('   3. Verifica que "Checkout Pro" esté habilitado');
                console.log('   4. Si es necesario, regenera las credenciales de PRODUCCIÓN');
                console.log('   5. Asegúrate de NO estar usando credenciales de TEST');
            }
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

verificarToken();
