// Test de envío de email local
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('🧪 Probando envío de email...\n');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NO CONFIGURADO');
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    
    try {
        // Verificar conexión
        console.log('\n📡 Verificando conexión con Gmail...');
        await transporter.verify();
        console.log('✅ Conexión exitosa con Gmail\n');
        
        // Enviar email de prueba
        console.log('📧 Enviando email de prueba...');
        const info = await transporter.sendMail({
            from: `"FinanGest Test" <${process.env.EMAIL_USER}>`,
            to: 'felirozxx@gmail.com', // Cambia esto a tu email
            subject: '🧪 Test de Email - FinanGest',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>✅ Email funcionando correctamente</h2>
                    <p>Este es un email de prueba desde FinanGest.</p>
                    <p>Código de prueba: <strong>123456</strong></p>
                </div>
            `
        });
        
        console.log('✅ Email enviado exitosamente');
        console.log('Message ID:', info.messageId);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'EAUTH') {
            console.error('\n⚠️  Error de autenticación. Verifica:');
            console.error('   1. EMAIL_USER está correcto');
            console.error('   2. EMAIL_PASS es la contraseña de aplicación de Gmail');
            console.error('   3. La verificación en 2 pasos está activada en Gmail');
        }
    }
}

testEmail();
