const { connectToDatabase } = require('./api/_db');

async function checkAdminUsers() {
    try {
        console.log('🔵 Conectando a MongoDB...');
        const { db } = await connectToDatabase();
        
        // Buscar todos los usuarios con role admin
        const admins = await db.collection('users').find({ role: 'admin' }).toArray();
        
        console.log(`\n📋 Usuarios con role='admin': ${admins.length}\n`);
        
        admins.forEach((admin, index) => {
            console.log(`${index + 1}. ${admin.nombre || 'Sin nombre'}`);
            console.log(`   - ID: ${admin._id}`);
            console.log(`   - Email: ${admin.email}`);
            console.log(`   - Username: ${admin.username || 'N/A'}`);
            console.log(`   - Activo: ${admin.activo}`);
            console.log(`   - Bloqueado: ${admin.bloqueado || false}`);
            console.log(`   - Fecha creación: ${admin.fechaRegistro || 'N/A'}`);
            console.log('');
        });
        
        // Buscar todos los usuarios
        const allUsers = await db.collection('users').find({}).toArray();
        console.log(`📊 Total de usuarios en la base de datos: ${allUsers.length}\n`);
        
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.nombre || 'Sin nombre'} (${user.email})`);
            console.log(`   - Role: ${user.role}`);
            console.log(`   - Activo: ${user.activo}`);
            console.log(`   - ID: ${user._id}`);
            console.log('');
        });
        
        // Verificar si hay duplicados
        const emailCounts = {};
        allUsers.forEach(u => {
            emailCounts[u.email] = (emailCounts[u.email] || 0) + 1;
        });
        
        const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1);
        if (duplicates.length > 0) {
            console.log('⚠️ EMAILS DUPLICADOS:');
            duplicates.forEach(([email, count]) => {
                console.log(`   - ${email}: ${count} veces`);
            });
        } else {
            console.log('✅ No hay emails duplicados');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAdminUsers();
