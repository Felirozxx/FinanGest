const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://Felirozxx:Pipe16137356@cluster0.luvtqa7.mongodb.net/finangest?retryWrites=true&w=majority';
const API_URL = 'https://finangest.vercel.app';

async function testPagoCartera() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB\n');
        
        const db = client.db('finangest');
        
        // Buscar usuario Pipe
        const user = await db.collection('users').findOne({ email: 'felirozxx@gmail.com' });
        if (!user) {
            console.log('❌ Usuario no encontrado');
            return;
        }
        
        console.log('👤 Usuario: ' + user.nombre);
        console.log('   Email: ' + user.email);
        console.log('   ID: ' + user._id);
        console.log('   Carteras pagadas: ' + (user.carterasPagadas || 0));
        
        // Contar carteras actuales
        const carterasActuales = await db.collection('carteras').countDocuments({
            creadoPor: user._id.toString(),
            eliminada: false
        });
        console.log('   Carteras activas: ' + carterasActuales);
        
        // Simular intento de crear cartera "roberto"
        console.log('\n🧪 Simulando creación de cartera "roberto"...');
        console.log('   Verificación: carterasActuales (' + carterasActuales + ') >= carterasPagadas (' + (user.carterasPagadas || 0) + ')');
        
        if (carterasActuales >= (user.carterasPagadas || 0)) {
            console.log('   ❌ RECHAZADO: Requiere pago');
            console.log('   ✅ El backend debería retornar 403 y mostrar modal de pago');
        } else {
            console.log('   ✅ APROBADO: Puede crear cartera sin pagar');
            console.log('   ⚠️  PROBLEMA: No debería poder crear sin pagar!');
        }
        
        // Verificar que no existe cartera "roberto"
        const roberto = await db.collection('carteras').findOne({
            nombre: /roberto/i,
            eliminada: false
        });
        
        if (roberto) {
            console.log('\n❌ PROBLEMA: Cartera "roberto" existe en la base de datos!');
            console.log('   ID: ' + roberto._id);
            console.log('   Creado por: ' + roberto.creadoPor);
            console.log('   Fecha: ' + roberto.fechaCreacion);
        } else {
            console.log('\n✅ Correcto: Cartera "roberto" NO existe en la base de datos');
        }
        
        // Mostrar resumen
        console.log('\n📊 RESUMEN:');
        console.log('   Usuario tiene ' + carterasActuales + ' cartera(s) activa(s)');
        console.log('   Usuario pagó por ' + (user.carterasPagadas || 0) + ' cartera(s)');
        console.log('   Puede crear ' + Math.max(0, (user.carterasPagadas || 0) - carterasActuales) + ' cartera(s) más sin pagar');
        
        if (carterasActuales > (user.carterasPagadas || 0)) {
            console.log('\n⚠️  ALERTA: Usuario tiene más carteras de las que pagó!');
        } else if (carterasActuales === (user.carterasPagadas || 0)) {
            console.log('\n✅ Sistema funcionando correctamente');
            console.log('   Próximo intento de crear cartera requerirá pago');
        } else {
            console.log('\n✅ Usuario tiene carteras disponibles sin usar');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

testPagoCartera();
