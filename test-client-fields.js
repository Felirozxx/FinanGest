const { connectToDatabase } = require('./api/_db-manager');

async function testClientFields() {
    try {
        const { db } = await connectToDatabase();
        
        // Obtener un cliente de ejemplo
        const sampleClient = await db.collection('clientes').findOne();
        
        console.log('Sample client fields:');
        console.log(JSON.stringify(sampleClient, null, 2));
        
        // Contar clientes por campo
        const allClients = await db.collection('clientes').find().toArray();
        console.log(`\nTotal clients: ${allClients.length}`);
        
        // Ver qué campos tienen para identificar al creador
        const fieldsUsed = {};
        allClients.forEach(c => {
            if (c.creadoPor) fieldsUsed.creadoPor = (fieldsUsed.creadoPor || 0) + 1;
            if (c.userId) fieldsUsed.userId = (fieldsUsed.userId || 0) + 1;
            if (c.createdBy) fieldsUsed.createdBy = (fieldsUsed.createdBy || 0) + 1;
        });
        
        console.log('\nFields used to identify creator:');
        console.log(fieldsUsed);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testClientFields();
