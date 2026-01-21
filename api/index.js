const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

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

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    
    try {
        // Test endpoint
        if (pathname === '/api' || pathname === '/api/') {
            return res.json({ 
                success: true, 
                message: 'FinanGest API funcionando',
                mongoUri: process.env.MONGODB_URI ? 'Configurada' : 'NO configurada'
            });
        }

        const db = await connectToDatabase();

        // ============ CARTERAS ============
        if (pathname.startsWith('/api/carteras')) {
            const { userId, id } = req.query;

            // GET carteras
            if (req.method === 'GET' && userId) {
                const carteras = await db.collection('carteras').find({ 
                    creadoPor: userId,
                    eliminada: { $ne: true }
                }).toArray();
                
                return res.json({ 
                    success: true, 
                    carteras: carteras.map(c => ({ ...c, id: c._id }))
                });
            }

            // POST crear cartera
            if (req.method === 'POST') {
                const cartera = { 
                    ...req.body, 
                    fechaCreacion: new Date(),
                    eliminada: false,
                    activa: true
                };
                
                console.log('Creando cartera:', cartera);
                const result = await db.collection('carteras').insertOne(cartera);
                console.log('Cartera creada:', result.insertedId);
                
                return res.json({ 
                    success: true, 
                    id: result.insertedId, 
                    cartera: { ...cartera, id: result.insertedId } 
                });
            }

            // PUT actualizar cartera
            if (req.method === 'PUT' && id) {
                const updateData = { ...req.body };
                delete updateData._id;
                delete updateData.id;
                
                await db.collection('carteras').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );
                
                return res.json({ success: true });
            }

            // DELETE cartera
            if (req.method === 'DELETE' && id) {
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
        }

        // ============ LOGIN ============
        if (pathname === '/api/login' && req.method === 'POST') {
            const { email, password } = req.body;
            
            const user = await db.collection('users').findOne({ 
                $or: [
                    { email: email.toLowerCase() }, 
                    { username: email }
                ] 
            });
            
            if (!user) {
                return res.json({ success: false, error: 'Usuario no encontrado' });
            }
            
            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return res.json({ success: false, error: 'Contraseña incorrecta' });
            }
            
            if (!user.activo && user.role !== 'admin') {
                return res.json({ 
                    success: false, 
                    error: 'Cuenta pendiente de activación', 
                    pendingActivation: true 
                });
            }
            
            return res.json({ 
                success: true, 
                user: { 
                    id: user._id, 
                    nombre: user.nombre, 
                    email: user.email, 
                    role: user.role 
                }
            });
        }

        return res.status(404).json({ error: 'Endpoint not found' });

    } catch (error) {
        console.error('Error en API:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
