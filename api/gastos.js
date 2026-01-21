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

        // GET - Obtener gastos
        if (req.method === 'GET') {
            const { userId } = req.query;
            const query = userId ? { creadoPor: userId } : {};
            const gastos = await db.collection('gastos').find(query).toArray();
            return res.json(gastos.map(g => ({ ...g, id: g._id })));
        }

        // POST - Crear gasto
        if (req.method === 'POST') {
            const gasto = { ...req.body, fechaCreacion: new Date() };
            const result = await db.collection('gastos').insertOne(gasto);
            return res.json({ success: true, id: result.insertedId });
        }

        // PUT - Actualizar gasto
        if (req.method === 'PUT') {
            const { id } = req.query;
            const updateData = { ...req.body };
            delete updateData._id;
            delete updateData.id;
            
            await db.collection('gastos').updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            return res.json({ success: true });
        }

        // DELETE - Eliminar gasto
        if (req.method === 'DELETE') {
            const { id } = req.query;
            await db.collection('gastos').deleteOne({ _id: new ObjectId(id) });
            return res.json({ success: true });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error en gastos:', error);
        res.status(500).json({ error: 'Error en operación de gastos' });
    }
};
