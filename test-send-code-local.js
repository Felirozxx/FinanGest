// Test send-code endpoint locally
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testSendCode() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('finangest');
        
        const email = 'test@example.com';
        
        // Generar código
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        const expira = Date.now() + 10 * 60 * 1000;
        
        console.log('📧 Email:', email);
        console.log('🔢 Código generado:', codigo);
        console.log('📅 Tipo de código:', typeof codigo);
        console.log('⏰ Expira:', new Date(expira).toLocaleString());
        
        // Guardar en MongoDB
        const result = await db.collection('verification_codes').updateOne(
            { email },
            { $set: { codigo, expira, tipo: 'registro', fecha: new Date() } },
            { upsert: true }
        );
        
        console.log('\n💾 Resultado guardado:', result.upsertedCount > 0 ? 'nuevo' : 'actualizado');
        
        // Verificar
        const verificar = await db.collection('verification_codes').findOne({ email });
        console.log('\n✅ Verificación en DB:');
        console.log('   Email:', verificar.email);
        console.log('   Código:', verificar.codigo);
        console.log('   Tipo código:', typeof verificar.codigo);
        console.log('   Tipo:', verificar.tipo);
        console.log('   Expira:', new Date(verificar.expira).toLocaleString());
        
        // Limpiar
        await db.collection('verification_codes').deleteOne({ email });
        console.log('\n🧹 Test limpiado');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

testSendCode();
