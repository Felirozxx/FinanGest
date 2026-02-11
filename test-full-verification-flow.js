// Test completo del flujo de verificación
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { enviarCodigoVerificacion } = require('./api/_email-service');

// Función generarCodigo (igual que en api/index.js)
function generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function testFullFlow() {
    const client = new MongoClient(process.env.MONGODB_URI);
    const testEmail = 'fzuluaga548@gmail.com'; // Email del admin para testing
    
    try {
        await client.connect();
        const db = client.db('finangest');
        
        console.log('🧪 TEST COMPLETO DE VERIFICACIÓN\n');
        console.log('=' .repeat(50));
        
        // PASO 1: Generar código
        console.log('\n📝 PASO 1: Generar código');
        const codigo = generarCodigo();
        const expira = Date.now() + 10 * 60 * 1000;
        
        console.log('   Código:', codigo);
        console.log('   Tipo:', typeof codigo);
        console.log('   Expira:', new Date(expira).toLocaleString());
        
        // PASO 2: Guardar en MongoDB
        console.log('\n💾 PASO 2: Guardar en MongoDB');
        
        // Eliminar código anterior
        await db.collection('verification_codes').deleteOne({ email: testEmail });
        console.log('   ✓ Código anterior eliminado');
        
        // Insertar nuevo
        const result = await db.collection('verification_codes').insertOne({
            email: testEmail,
            codigo,
            expira,
            tipo: 'registro',
            fecha: new Date()
        });
        
        console.log('   ✓ Código insertado con ID:', result.insertedId);
        
        // PASO 3: Verificar guardado
        console.log('\n🔍 PASO 3: Verificar guardado');
        const verificar = await db.collection('verification_codes').findOne({ email: testEmail });
        
        console.log('   Email:', verificar.email);
        console.log('   Código:', verificar.codigo);
        console.log('   Tipo código:', typeof verificar.codigo);
        console.log('   Tipo:', verificar.tipo);
        console.log('   Expira:', new Date(verificar.expira).toLocaleString());
        
        if (!verificar.codigo) {
            throw new Error('❌ El código no se guardó correctamente');
        }
        
        console.log('   ✓ Código guardado correctamente');
        
        // PASO 4: Enviar email
        console.log('\n📧 PASO 4: Enviar email');
        const resultado = await enviarCodigoVerificacion(testEmail, codigo, 'registro');
        
        if (resultado.success) {
            console.log('   ✓ Email enviado exitosamente');
        } else {
            console.log('   ❌ Error:', resultado.error);
        }
        
        // PASO 5: Simular verificación
        console.log('\n✅ PASO 5: Simular verificación');
        const codigoIngresado = codigo; // Simular que el usuario ingresó el código correcto
        
        const codigoGuardado = await db.collection('verification_codes').findOne({ email: testEmail });
        
        if (!codigoGuardado) {
            console.log('   ❌ Código no encontrado');
        } else if (Date.now() > codigoGuardado.expira) {
            console.log('   ❌ Código expirado');
        } else if (codigoGuardado.codigo !== codigoIngresado) {
            console.log('   ❌ Código incorrecto');
        } else {
            console.log('   ✓ Código verificado correctamente');
            await db.collection('verification_codes').deleteOne({ email: testEmail });
            console.log('   ✓ Código eliminado después de verificación');
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ TEST COMPLETADO EXITOSAMENTE\n');
        
    } catch (error) {
        console.error('\n❌ ERROR EN TEST:', error.message);
        console.error(error);
    } finally {
        await client.close();
    }
}

testFullFlow();
