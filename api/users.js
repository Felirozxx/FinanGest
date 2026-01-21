const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { db } = await connectToDatabase();

        // GET - Obtener usuarios
        if (req.method === 'GET') {
            const users = await db.collection('users').find({}).toArray();
            return res.json(users.map(u => ({ ...u, id: u._id })));
        }

        // PUT - Activar/Bloquear usuario
        if (req.method === 'PUT') {
            const { id, action } = req.query;
            
            if (action === 'activate') {
                await db.collection('users').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { activo: true } }
                );
            } else if (action === 'block') {
                const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
                await db.collection('users').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { bloqueado: !user.bloqueado } }
                );
            }
            return res.json({ success: true });
        }

        // DELETE - Eliminar usuario
        if (req.method === 'DELETE') {
            const { id } = req.query;
            await db.collection('users').deleteOne({ _id: new ObjectId(id) });
            return res.json({ success: true });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error en users:', error);
        res.status(500).json({ error: 'Error en operación de usuarios' });
    }
};
