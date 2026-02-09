const { connectToDatabase } = require('./api/_db');
const bcrypt = require('bcryptjs');

async function testAdminDelete() {
    try {
        console.log('🔵 Conectando a MongoDB...');
        const { db } = await connectToDatabase();
        
        // Buscar el admin
        const admin = await db.collection('users').findOne({ email: 'fzuluaga548@gmail.com' });
        
        if (!admin) {
            console.log('❌ Admin no encontrado');
            return;
        }
        
        console.log('✅ Admin encontrado:');
        console.log('  - ID:', admin._id);
        console.log('  - Email:', admin.email);
        console.log('  - Role:', admin.role);
        console.log('  - Password (primeros 30 chars):', admin.password ? admin.password.substring(0, 30) + '...' : 'NO PASSWORD');
        console.log('  - Password length:', admin.password ? admin.password.length : 0);
        
        // Verificar si es bcrypt hash (empieza con $2a$, $2b$ o $2y$)
        const isBcryptHash = admin.password && /^\$2[aby]\$/.test(admin.password);
        console.log('  - Es hash bcrypt?:', isBcryptHash);
        
        // Probar contraseña
        const testPassword = 'Pipe16137356';
        console.log('\n🔵 Probando contraseña:', testPassword);
        
        if (isBcryptHash) {
            const isValid = await bcrypt.compare(testPassword, admin.password);
            console.log('  - Resultado bcrypt.compare:', isValid);
        } else {
            const isValid = (testPassword === admin.password);
            console.log('  - Resultado comparación directa:', isValid);
            
            if (!isValid) {
                console.log('\n⚠️ La contraseña no coincide y no está hasheada con bcrypt');
                console.log('💡 Generando hash bcrypt para la contraseña correcta...');
                const hash = await bcrypt.hash(testPassword, 10);
                console.log('  - Hash generado:', hash);
                console.log('\n💡 Actualizando contraseña en la base de datos...');
                await db.collection('users').updateOne(
                    { _id: admin._id },
                    { $set: { password: hash } }
                );
                console.log('✅ Contraseña actualizada con hash bcrypt');
            }
        }
        
        // Buscar un trabajador para probar
        console.log('\n🔵 Buscando trabajadores...');
        const trabajadores = await db.collection('users')
            .find({ role: { $ne: 'admin' } })
            .limit(5)
            .toArray();
        
        console.log(`\n📋 Trabajadores disponibles (${trabajadores.length}):`);
        trabajadores.forEach(t => {
            console.log(`  - ${t.nombre} (${t.email}) - ID: ${t._id}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testAdminDelete();
