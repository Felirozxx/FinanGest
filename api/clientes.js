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
            const query = userId ? { creadoPor: userId } : {};
            const clientes = await db.collection('clientes').find(query).toArray();
            return res.json(clientes.map(c => ({ ...c, id: c._id })));
        }

        // POST - Crear cliente
        if (req.method === 'POST') {
            const cliente = { ...req.body, fechaCreacion: new Date() };
            const result = await db.collection('clientes').insertOne(cliente);
            return res.json({ 
                success: true, 
                id: result.insertedId, 
                cliente: { ...cliente, id: result.insertedId } 
            });
        }

        // PUT - Actualizar cliente
        if (req.method === 'PUT') {
            const { id } = req.query;
            const updateData = { ...req.body };
            delete updateData._id;
            delete updateData.id;
            
            await db.collection('clientes').updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            return res.json({ success: true });
        }

        // DELETE - Eliminar cliente
        if (req.method === 'DELETE') {
            const { id } = req.query;
            await db.collection('clientes').deleteOne({ _id: new ObjectId(id) });
            return res.json({ success: true });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error en clientes:', error);
        res.status(500).json({ error: 'Error en operación de clientes' });
    }
};
