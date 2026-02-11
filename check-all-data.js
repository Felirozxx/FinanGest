// Check all users, carteras, and clients
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkAllData() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('finangest');
        
        console.log('📊 CHECKING ALL DATA\n');
        console.log('='.repeat(80));
        
        // Get all users
        const users = await db.collection('users').find({}).toArray();
        console.log('\n👥 USERS:');
        users.forEach(u => {
            const role = u.role || (u.isAdmin ? 'admin' : 'worker');
            console.log(`   ${role === 'admin' ? '👑' : '👤'} ${u.nombre} (${u.email})`);
            console.log(`      ID: ${u._id}`);
            console.log(`      Role: ${role}`);
        });
        
        // Get all carteras
        const carteras = await db.collection('carteras').find({ eliminada: false }).toArray();
        console.log('\n\n📁 CARTERAS (active):');
        carteras.forEach(c => {
            console.log(`   📁 ${c.nombre}`);
            console.log(`      ID: ${c._id}`);
            console.log(`      creadoPor: ${c.creadoPor}`);
            console.log(`      userId: ${c.userId || 'N/A'}`);
            console.log(`      activa: ${c.activa}`);
            console.log(`      pendientePago: ${c.pendientePago}`);
        });
        
        // Get all clients
        const clientes = await db.collection('clientes').find({}).toArray();
        console.log('\n\n👨‍👩‍👧‍👦 CLIENTES:');
        clientes.forEach(c => {
            console.log(`   👤 ${c.nombre}`);
            console.log(`      ID: ${c._id}`);
            console.log(`      creadoPor: ${c.creadoPor || 'N/A'}`);
            console.log(`      userId: ${c.userId || 'N/A'}`);
            console.log(`      carteraId: ${c.carteraId || 'N/A'}`);
            console.log(`      montoTotal: R$ ${(c.montoTotal || 0).toFixed(2)}`);
        });
        
        // Summary
        console.log('\n\n' + '='.repeat(80));
        console.log('📈 SUMMARY:');
        console.log(`   Total users: ${users.length}`);
        console.log(`   Total workers: ${users.filter(u => u.role !== 'admin' && !u.isAdmin).length}`);
        console.log(`   Total carteras: ${carteras.length}`);
        console.log(`   Total clients: ${clientes.length}`);
        
        // Match clients to workers
        console.log('\n\n📊 CLIENTS PER WORKER:');
        const workers = users.filter(u => u.role !== 'admin' && !u.isAdmin);
        workers.forEach(w => {
            const workerId = w._id.toString();
            const workerClients = clientes.filter(c => 
                c.creadoPor === workerId || 
                c.creadoPor?.toString() === workerId ||
                c.userId === workerId ||
                c.userId?.toString() === workerId
            );
            const workerCarteras = carteras.filter(c => c.creadoPor === workerId);
            
            console.log(`\n   👤 ${w.nombre}:`);
            console.log(`      Carteras: ${workerCarteras.length}`);
            workerCarteras.forEach(cart => {
                const carteraClients = workerClients.filter(cl => 
                    cl.carteraId === cart._id.toString() || 
                    cl.carteraId === cart.id
                );
                console.log(`         📁 ${cart.nombre}: ${carteraClients.length} clients`);
            });
            console.log(`      Total clients: ${workerClients.length}`);
        });
        
        // Orphan clients
        const orphanClients = clientes.filter(c => {
            const hasWorker = workers.some(w => {
                const workerId = w._id.toString();
                return c.creadoPor === workerId || 
                       c.creadoPor?.toString() === workerId ||
                       c.userId === workerId ||
                       c.userId?.toString() === workerId;
            });
            return !hasWorker;
        });
        
        if (orphanClients.length > 0) {
            console.log('\n\n⚠️  ORPHAN CLIENTS (no matching worker):');
            orphanClients.forEach(c => {
                console.log(`   👤 ${c.nombre}`);
                console.log(`      creadoPor: ${c.creadoPor || 'N/A'}`);
                console.log(`      userId: ${c.userId || 'N/A'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkAllData();
