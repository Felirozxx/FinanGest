// Verificar códigos de verificación en MongoDB
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkCodes() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('finangest');
        
        console.log('🔍 Códigos de verificación en MongoDB:\n');
        
        const codes = await db.collection('verification_codes').find({}).toArray();
        
        if (codes.length === 0) {
            console.log('   No hay códigos guardados');
        } else {
            codes.forEach(c => {
                const expiraEn = Math.floor((c.expira - Date.now()) / 1000 / 60);
                const estado = expiraEn > 0 ? `✅ Válido (expira en ${expiraEn} min)` : '❌ Expirado';
                
                console.log(`📧 Email: ${c.email}`);
                console.log(`   Código: ${c.codigo}`);
                console.log(`   Tipo: ${c.tipo}`);
                console.log(`   Estado: ${estado}`);
                console.log(`   Fecha: ${new Date(c.fecha).toLocaleString()}`);
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkCodes();
