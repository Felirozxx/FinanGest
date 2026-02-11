// Servicio de envío de emails con nodemailer
const nodemailer = require('nodemailer');

// Configurar transporter de Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generar código de 6 dígitos
function generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Enviar código de verificación
async function enviarCodigoVerificacion(email, codigo, tipo = 'registro') {
    const asuntos = {
        registro: '🔐 Código de Verificación - FinanGest',
        recuperacion: '🔑 Código de Recuperación - FinanGest'
    };
    
    const mensajes = {
        registro: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                <div style="background-color: #1a1a2e; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: #00d4ff; margin: 0;">FinanGest</h1>
                    <p style="color: #ffffff; margin-top: 10px;">Sistema de Gestión Financiera</p>
                </div>
                
                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; margin-top: 20px;">
                    <h2 style="color: #1a1a2e; margin-top: 0;">Código de Verificación</h2>
                    <p style="color: #666; font-size: 16px;">Usa este código para completar tu registro:</p>
                    
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                        <span style="font-size: 36px; font-weight: bold; color: #00d4ff; letter-spacing: 8px;">${codigo}</span>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">Este código expira en 10 minutos.</p>
                    <p style="color: #666; font-size: 14px;">Si no solicitaste este código, ignora este mensaje.</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2026 FinanGest. Todos los derechos reservados.</p>
                </div>
            </div>
        `,
        recuperacion: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                <div style="background-color: #1a1a2e; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: #00d4ff; margin: 0;">FinanGest</h1>
                    <p style="color: #ffffff; margin-top: 10px;">Recuperación de Cuenta</p>
                </div>
                
                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; margin-top: 20px;">
                    <h2 style="color: #1a1a2e; margin-top: 0;">Código de Recuperación</h2>
                    <p style="color: #666; font-size: 16px;">Usa este código para recuperar tu cuenta:</p>
                    
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                        <span style="font-size: 36px; font-weight: bold; color: #00d4ff; letter-spacing: 8px;">${codigo}</span>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">Este código expira en 10 minutos.</p>
                    <p style="color: #ff4757; font-size: 14px; font-weight: bold;">⚠️ Si no solicitaste recuperar tu cuenta, contacta al administrador inmediatamente.</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>© 2026 FinanGest. Todos los derechos reservados.</p>
                </div>
            </div>
        `
    };
    
    const mailOptions = {
        from: `"FinanGest" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: asuntos[tipo],
        html: mensajes[tipo]
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email enviado a:', email);
        return { success: true };
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    generarCodigo,
    enviarCodigoVerificacion
};
