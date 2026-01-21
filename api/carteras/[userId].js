const { connectToDatabase } = require('../_db');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;
        const { db } = await connectToDatabase();

        const carteras = await db.collection('carteras').find({ 
            creadoPor: userId,
            eliminada: { $ne: true }
        }).toArray();

        res.json({ 
            success: true, 
            carteras: carteras.map(c => ({ ...c, id: c._id }))
        });
    } catch (error) {
        console.error('Error obteniendo carteras:', error);
        res.status(500).json({ success: false, error: 'Error obteniendo carteras' });
    }
};
