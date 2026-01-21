const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const { db } = await connectToDatabase();
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'userId requerido' 
            });
        }

        // Obtener carteras eliminadas del usuario
        const carteras = await db.collection('carteras').find({ 
            creadoPor: userId,
            eliminada: true
        }).toArray();
        
        return res.json({ 
            success: true, 
            carteras: carteras.map(c => ({ ...c, id: c._id }))
        });

    } catch (error) {
        console.error('Error obteniendo carteras eliminadas:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
