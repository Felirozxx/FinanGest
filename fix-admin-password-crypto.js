const { connectToDatabase } = require('./api/_db');
const { hashPassword, verifyPassword } = require('./api/_crypto-hash');

async function fixAdminPassword() {
    try {
        console.log('🔵 Conectando a MongoDB...');
        const { db } = await connectToDatabase();
        
        // Buscar el admin
        const admin = await db.collection('users').findOne({ email: 'fzuluaga548@gmail.com' });
        
        if (!admin) {
            console.log('❌ Admin no encontrado');
            return;
        }
        
        console.log('✅ Admin encontrado:', admin.email);
        console.log('  - Password actual:', admin.password.substring(0, 30) + '...');
        
        // Generar hash correcto con crypto (no bcrypt)
        const correctPassword = 'Pipe16137356';
        const newHash = hashPassword(correctPassword);
        
        console.log('\n🔵 Generando hash con crypto.pbkdf2Sync...');
        console.log('  - Nuevo hash:', newHash.substring(0, 50) + '...');
        
        // Verificar que funciona
        const isValid = verifyPassword(correctPassword, newHash);
        console.log('  - Verificación:', isValid ? '✅ CORRECTO' : '❌ ERROR');
        
        if (!isValid) {
            console.log('❌ El hash generado no es válido');
            return;
        }
        
        // Actualizar en la base de datos
        console.log('\n🔵 Actualizando contraseña en la base de datos...');
        await db.collection('users').updateOne(
            { _id: admin._id },
            { $set: { password: newHash } }
        );
        
        console.log('✅ Contraseña actualizada correctamente');
        console.log('\n✅ Ahora puedes hacer login con:');
        console.log('   Email:', admin.email);
        console.log('   Password: Pipe16137356');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixAdminPassword();
