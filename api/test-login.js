const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { email } = req.body || req.query;
        const { db } = await connectToDatabase();

        const user = await db.collection('users').findOne({ 
            $or: [{ email }, { username: email }] 
        });
        
        if (!user) {
            return res.json({ 
                success: false, 
                error: 'Usuario no encontrado',
                email: email 
            });
        }
        
        // Devolver info del usuario SIN verificar contraseña
        res.json({ 
            success: true,
            message: 'Usuario encontrado (sin verificar contraseña)',
            user: {
                email: user.email,
                nombre: user.nombre,
                role: user.role,
                activo: user.activo,
                passwordHash: user.password.substring(0, 30) + '...',
                passwordLength: user.password.length
            }
        });
    } catch (error) {
        console.error('Test login error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
