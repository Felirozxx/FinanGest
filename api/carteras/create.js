const { connectToDatabase } = require('../_db');

// Endpoint para crear carteras
module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const { db } = await connectToDatabase();

        // Parsear el body si es string
        let body = req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        const cartera = { 
            ...body,
            creadoPor: body.userId || body.creadoPor,
            fechaCreacion: new Date(),
            eliminada: false,
            activa: true
        };
        
        console.log('Creando cartera:', cartera);
        const result = await db.collection('carteras').insertOne(cartera);
        console.log('Cartera creada con ID:', result.insertedId);
        
        return res.json({ 
            success: true, 
            id: result.insertedId, 
            cartera: { ...cartera, id: result.insertedId } 
        });

    } catch (error) {
        console.error('Error en /api/carteras/create:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
