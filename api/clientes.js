const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { db } = await connectToDatabase();

        // GET - Obtener clientes
        if (req.method === 'GET') {
            const { userId } = req.query;
            // Si userId es 'admin', devolver todos los clientes
            const query = (userId && userId !== 'admin') ? { creadoPor: userId } : {};
            const clientes = await db.collection('clientes').find(query).toArray();
            return res.json(clientes.map(c => ({ ...c, id: c._id.toString() })));
        }

        // POST - Crear cliente
        if (req.method === 'POST') {
            const cliente = { ...req.body, fechaCreacion: new Date() };
            const result = await db.collection('clientes').insertOne(cliente);
            return res.json({ 
                success: true, 
                id: result.insertedId.toString(), 
                cliente: { ...cliente, id: result.insertedId.toString() } 
            });
        }

        // PUT - Actualizar cliente
        if (req.method === 'PUT') {
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'ID de cliente requerido' 
                });
            }
            
            console.log('Actualizando cliente:', id);
            
            const updateData = { ...req.body };
            delete updateData._id;
            delete updateData.id;
            
            const result = await db.collection('clientes').updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            
            console.log('Resultado actualización:', result);
            
            return res.json({ 
                success: result.modifiedCount > 0 || result.matchedCount > 0,
                message: result.modifiedCount > 0 ? 'Cliente actualizado' : 'Cliente no encontrado o sin cambios'
            });
        }

        // DELETE - Eliminar cliente
        if (req.method === 'DELETE') {
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'ID de cliente requerido' 
                });
            }
            
            await db.collection('clientes').deleteOne({ _id: new ObjectId(id) });
            return res.json({ success: true });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error en clientes:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Error en operación de clientes',
            details: error.message 
        });
    }
};
