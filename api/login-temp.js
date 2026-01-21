const { connectToDatabase } = require('./_db');

// TEMPORAL: Login sin bcrypt para testing
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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
        
        // TEMPORAL: Aceptar contraseña "Pipe16137356" sin verificar hash
        if (password !== 'Pipe16137356') {
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
