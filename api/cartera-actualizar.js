const { connectToDatabase } = require('./_db');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'PUT') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { db } = await connectToDatabase();
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, error: 'ID requerido' });
        }

        // Parsear el body si es string
        let body = req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        const updateData = { ...body };
        delete updateData._id;
        delete updateData.id;
        
        await db.collection('carteras').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        
        return res.json({ success: true });

    } catch (error) {
        console.error('Error actualizando cartera:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
