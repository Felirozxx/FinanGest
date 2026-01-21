const { connectToDatabase } = require('../_db');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { db } = await connectToDatabase();
        
        const cartera = { 
            ...req.body, 
            fechaCreacion: new Date(),
            eliminada: false,
            activa: true
        };
        
        console.log('📝 Creando cartera:', cartera.nombre);
        const result = await db.collection('carteras').insertOne(cartera);
        console.log('✅ Cartera creada con ID:', result.insertedId);
        
        res.json({ 
            success: true, 
            id: result.insertedId, 
            cartera: { ...cartera, id: result.insertedId } 
        });
    } catch (error) {
        console.error('❌ Error creando cartera:', error.message);
        res.status(500).json({ 
            success: false, 
            error: `Error creando cartera: ${error.message}` 
        });
    }
};
