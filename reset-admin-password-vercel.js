const { connectToDatabase } = require('./api/_db');
const { hashPassword } = require('./api/_crypto-hash');

async function resetAdminPassword() {
    try {
        console.log('🔵 Conectando a MongoDB...');
        const { db } = await connectToDatabase();
        
        console.log('🔍 Buscando usuario admin...');
        const admin = await db.collection('users').findOne({ 
            email: 'felirozxx@gmail.com' 
        });
        
        if (!admin) {
            console.log('❌ Admin no encontrado');
            return;
        }
        
        console.log('✅ Admin encontrado:', admin.email);
        console.log('📝 Nombre:', admin.nombre);
        console.log('👤 Role:', admin.role);
        
        // Nueva contraseña
        const newPassword = 'admin123';
        const hashedPassword = hashPassword(newPassword);
        
        console.log('\n🔄 Actualizando contraseña...');
        const result = await db.collection('users').updateOne(
            { email: 'felirozxx@gmail.com' },
            { 
                $set: { 
                    password: hashedPassword,
                    activo: true
                } 
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log('✅ Contraseña actualizada!');
            console.log('\n📋 NUEVA CONTRASEÑA:');
            console.log('Email: felirozxx@gmail.com');
            console.log('Password: admin123');
            console.log('\n🔗 Prueba en: https://finangest.vercel.app');
        } else {
            console.log('⚠️ No se modificó nada');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetAdminPassword();
