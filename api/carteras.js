const { connectToDatabase } = require('./_db');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { db } = await connectToDatabase();
        
        // Parsear el body si es string
        let body = req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        // POST /api/carteras - Crear nueva cartera
        if (req.method === 'POST') {
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
        }

        return res.status(400).json({ 
            success: false, 
            error: 'Invalid request' 
        });

    } catch (error) {
        console.error('Error en /api/carteras:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
