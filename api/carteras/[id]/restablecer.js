const { connectToDatabase } = require('../../_db');
const { ObjectId } = require('mongodb');

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
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ 
                success: false, 
                error: 'ID requerido' 
            });
        }

        // Restablecer cartera - quitar marca de eliminada
        await db.collection('carteras').updateOne(
            { _id: new ObjectId(id) },
            { 
                $set: { 
                    eliminada: false 
                },
                $unset: {
                    fechaEliminacion: ""
                }
            }
        );
        
        return res.json({ success: true });

    } catch (error) {
        console.error('Error restableciendo cartera:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
