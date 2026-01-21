const { connectToDatabase } = require('../../_db');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
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

        // PUT /api/carteras/[id] - Actualizar cartera
        if (req.method === 'PUT') {
            const updateData = { ...req.body };
            delete updateData._id;
            delete updateData.id;
            
            await db.collection('carteras').updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            
            return res.json({ success: true });
        }

        // DELETE /api/carteras/[id] - Eliminar cartera (soft delete)
        if (req.method === 'DELETE') {
            await db.collection('carteras').updateOne(
                { _id: new ObjectId(id) },
                { 
                    $set: { 
                        eliminada: true, 
                        fechaEliminacion: new Date() 
                    } 
                }
            );
            
            return res.json({ success: true });
        }

        return res.status(400).json({ 
            success: false, 
            error: 'Invalid request' 
        });

    } catch (error) {
        console.error('Error en /api/carteras/[id]:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
