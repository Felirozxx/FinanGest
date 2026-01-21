const { MongoClient, ObjectId } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('finangest');
    cachedDb = db;
    return db;
}

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const db = await connectToDatabase();

        // GET /api/carteras/:userId
        if (req.method === 'GET') {
            const userId = req.query.userId || req.url.split('/').pop();
            
            const carteras = await db.collection('carteras').find({ 
                creadoPor: userId,
                eliminada: { $ne: true }
            }).toArray();
            
            return res.json({ 
                success: true, 
                carteras: carteras.map(c => ({ ...c, id: c._id }))
            });
        }

        // POST /api/carteras
        if (req.method === 'POST') {
            const cartera = { 
                ...req.body, 
                fechaCreacion: new Date(),
                eliminada: false,
                activa: true
            };
            
            const result = await db.collection('carteras').insertOne(cartera);
            
            return res.json({ 
                success: true, 
                id: result.insertedId, 
                cartera: { ...cartera, id: result.insertedId } 
            });
        }

        // PUT /api/carteras/:id
        if (req.method === 'PUT') {
            const id = req.query.id || req.url.split('/').pop();
            const updateData = { ...req.body };
            delete updateData._id;
            delete updateData.id;
            
            await db.collection('carteras').updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            
            return res.json({ success: true });
        }

        // DELETE /api/carteras/:id
        if (req.method === 'DELETE') {
            const id = req.query.id || req.url.split('/').pop();
            
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

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Error en /api/carteras:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
