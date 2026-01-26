const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://Felirozxx:Pipe16137356@cluster0.luvtqa7.mongodb.net/finangest?retryWrites=true&w=majority';

async function verificarBugRoberto() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');
        
        const db = client.db('finangest');
        
        // Buscar todas las carteras
        const carteras = await db.collection('carteras').find({ eliminada: false }).toArray();
        console.log(`📊 Total de carteras activas: ${carteras.length}\n`);
        
        if (carteras.length > 0) {
            console.log('📋 Todas las carteras activas:');
            for (const c of carteras) {
                console.log(`\n   Cartera: ${c.nombre}`);
                console.log(`   ID: ${c._id}`);
                console.log(`   Creado por: ${c.creadoPor}`);
                console.log(`   Activa: ${c.activa}`);
                console.log(`   Pendiente pago: ${c.pendientePago || false}`);
                console.log(`   Fecha creación: ${c.fechaCreacion}`);
                
                // Buscar el usuario
                const user = await db.collection('users').findOne({ _id: new ObjectId(c.creadoPor) });
                if (user) {
                    console.log(`   Usuario: ${user.nombre} (${user.email})`);
                    console.log(`   Carteras pagadas: ${user.carterasPagadas || 0}`);
                }
            }
        }
        
        console.log('\n\n');
        
        // Buscar cartera "roberto"
        const roberto = carteras.find(c => c.nombre.toLowerCase().includes('roberto'));
        if (roberto) {
            console.log('🔍 Cartera "roberto" encontrada:');
            console.log('   ID:', roberto._id);
            console.log('   Nombre:', roberto.nombre);
            console.log('   Creado por:', roberto.creadoPor);
            console.log('   Activa:', roberto.activa);
            console.log('   Pendiente pago:', roberto.pendientePago);
            console.log('   Fecha creación:', roberto.fechaCreacion);
            
            // Buscar el usuario
            const user = await db.collection('users').findOne({ _id: new ObjectId(roberto.creadoPor) });
            if (user) {
                console.log('\n👤 Usuario que creó "roberto":');
                console.log('   Nombre:', user.nombre);
                console.log('   Email:', user.email);
                console.log('   Carteras pagadas:', user.carterasPagadas || 0);
                
                // Contar carteras del usuario
                const carterasUsuario = carteras.filter(c => c.creadoPor === roberto.creadoPor);
                console.log('   Carteras creadas:', carterasUsuario.length);
                console.log('\n📋 Lista de carteras del usuario:');
                carterasUsuario.forEach((c, i) => {
                    console.log(`   ${i + 1}. ${c.nombre} (Activa: ${c.activa}, Pendiente: ${c.pendientePago || false})`);
                });
                
                // Verificar si debería poder crear
                const carterasPagadas = user.carterasPagadas || 0;
                const carterasActuales = carterasUsuario.length;
                console.log('\n🔍 Análisis:');
                console.log(`   Carteras pagadas: ${carterasPagadas}`);
                console.log(`   Carteras creadas: ${carterasActuales}`);
                if (carterasActuales > carterasPagadas) {
                    console.log(`   ❌ PROBLEMA: Usuario tiene ${carterasActuales - carterasPagadas} cartera(s) sin pagar`);
                    console.log(`   🗑️  Debería eliminar: ${carterasUsuario.slice(carterasPagadas).map(c => c.nombre).join(', ')}`);
                } else {
                    console.log(`   ✅ Todo correcto`);
                }
            }
        } else {
            console.log('✅ No se encontró cartera "roberto"');
        }
        
        // Buscar cartera "laura"
        const laura = carteras.find(c => c.nombre.toLowerCase().includes('laura'));
        if (laura) {
            console.log('\n\n🔍 Cartera "laura" encontrada:');
            console.log('   ID:', laura._id);
            console.log('   Nombre:', laura.nombre);
            console.log('   Creado por:', laura.creadoPor);
            console.log('   Activa:', laura.activa);
            console.log('   Pendiente pago:', laura.pendientePago);
            console.log('   Fecha creación:', laura.fechaCreacion);
        }
        
        // Buscar pagos pendientes
        const pagosPendientes = await db.collection('pagos_pendientes').find({}).toArray();
        if (pagosPendientes.length > 0) {
            console.log('\n\n💳 Pagos pendientes:');
            pagosPendientes.forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.nombreCartera || 'Sin nombre'} - Estado: ${p.estado} - Monto: R$ ${p.monto}`);
                console.log(`      PaymentId: ${p.paymentId}`);
                console.log(`      Fecha: ${p.fechaCreacion}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

verificarBugRoberto();
