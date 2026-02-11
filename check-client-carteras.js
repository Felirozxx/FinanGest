require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('finangest');
    
    const clientes = await db.collection('clientes').find({ userId: '696b5f1fc242804ad77287e6' }).toArray();
    
    console.log('Clients for Pipe:');
    clientes.forEach(c => {
        console.log(`  ${c.nombre || 'undefined'}: carteraId=${c.carteraId || 'N/A'}`);
    });
    
    await client.close();
})();
