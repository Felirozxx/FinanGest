const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;
        const { db } = await connectToDatabase();

        const user = await db.collection('users').findOne({ 
            $or: [{ email }, { username: email }] 
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
                pendingActivation: true, 
                userId: user._id, 
                nombre: user.nombre, 
                email: user.email 
            });
        }
        
        res.json({ 
            success: true, 
            user: { 
                id: user._id, 
                nombre: user.nombre, 
                email: user.email, 
                role: user.role 
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Error de servidor' });
    }
};
