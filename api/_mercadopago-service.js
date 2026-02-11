// Servicio de Mercado Pago para pagos PIX
const fetch = require('node-fetch');

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_API_URL = 'https://api.mercadopago.com/v1';

/**
 * Crear preferencia de pago con PIX
 * @param {Object} data - Datos del pago
 * @param {string} data.email - Email del usuario
 * @param {string} data.nombre - Nombre del usuario
 * @param {number} data.amount - Monto en reales (ej: 51.41)
 * @param {string} data.description - Descripción del pago
 * @param {string} data.userId - ID del usuario (para referencia)
 * @returns {Object} - Datos del pago creado
 */
async function crearPagoPix(data) {
    const { email, nombre, amount, description, userId } = data;
    
    if (!MP_ACCESS_TOKEN) {
        throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');
    }
    
    try {
        // Crear preferencia de pago
        const preference = {
            items: [
                {
                    title: description || 'Suscripción FinanGest',
                    quantity: 1,
                    unit_price: parseFloat(amount),
                    currency_id: 'BRL'
                }
            ],
            payer: {
                email: email,
                name: nombre
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
                success: process.env.APP_URL || 'https://finangest.vercel.app',
                failure: process.env.APP_URL || 'https://finangest.vercel.app',
                pending: process.env.APP_URL || 'https://finangest.vercel.app'
            },
            auto_return: 'approved',
            external_reference: userId,
            notification_url: `${process.env.APP_URL || 'https://finangest.vercel.app'}/api/mercadopago-webhook`,
            statement_descriptor: 'FINANGEST',
            expires: true,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
        };
        
        console.log('📝 Creando preferencia de pago:', JSON.stringify(preference, null, 2));
        
        const response = await fetch(`${MP_API_URL}/checkout/preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
            },
            body: JSON.stringify(preference)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            console.error('❌ Error de Mercado Pago:', responseData);
            throw new Error(responseData.message || 'Error al crear preferencia de pago');
        }
        
        console.log('✅ Preferencia creada:', responseData.id);
        
        return {
            success: true,
            preferenceId: responseData.id,
            initPoint: responseData.init_point,
            sandboxInitPoint: responseData.sandbox_init_point,
            qrCode: responseData.qr_code,
            qrCodeBase64: responseData.qr_code_base64
        };
        
    } catch (error) {
        console.error('❌ Error en crearPagoPix:', error);
        throw error;
    }
}

/**
 * Verificar estado de un pago
 * @param {string} paymentId - ID del pago de Mercado Pago
 * @returns {Object} - Estado del pago
 */
async function verificarPago(paymentId) {
    if (!MP_ACCESS_TOKEN) {
        throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');
    }
    
    try {
        const response = await fetch(`${MP_API_URL}/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
            }
        });
        
        const payment = await response.json();
        
        if (!response.ok) {
            console.error('❌ Error al verificar pago:', payment);
            throw new Error(payment.message || 'Error al verificar pago');
        }
        
        console.log('🔍 Estado del pago:', payment.status);
        
        return {
            success: true,
            status: payment.status, // approved, pending, rejected, cancelled, refunded, charged_back
            statusDetail: payment.status_detail,
            amount: payment.transaction_amount,
            currency: payment.currency_id,
            paymentMethod: payment.payment_method_id,
            externalReference: payment.external_reference,
            dateCreated: payment.date_created,
            dateApproved: payment.date_approved,
            paid: payment.status === 'approved'
        };
        
    } catch (error) {
        console.error('❌ Error en verificarPago:', error);
        throw error;
    }
}

/**
 * Obtener información de un pago por external_reference (userId)
 * @param {string} externalReference - ID del usuario
 * @returns {Object} - Información del pago
 */
async function buscarPagoPorReferencia(externalReference) {
    if (!MP_ACCESS_TOKEN) {
        throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');
    }
    
    try {
        const response = await fetch(
            `${MP_API_URL}/payments/search?external_reference=${externalReference}&sort=date_created&criteria=desc&range=date_created&begin_date=NOW-30DAYS&end_date=NOW`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
                }
            }
        );
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('❌ Error al buscar pago:', data);
            throw new Error(data.message || 'Error al buscar pago');
        }
        
        if (data.results && data.results.length > 0) {
            const payment = data.results[0]; // Más reciente
            return {
                success: true,
                found: true,
                paymentId: payment.id,
                status: payment.status,
                paid: payment.status === 'approved'
            };
        }
        
        return {
            success: true,
            found: false,
            paid: false
        };
        
    } catch (error) {
        console.error('❌ Error en buscarPagoPorReferencia:', error);
        throw error;
    }
}

module.exports = {
    crearPagoPix,
    verificarPago,
    buscarPagoPorReferencia
};
