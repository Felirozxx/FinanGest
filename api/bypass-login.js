// ENDPOINT DE EMERGENCIA - Login sin MongoDB
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    // Credenciales de emergencia
    const EMERGENCY_ADMIN = {
        email: 'admin@finangest.com',
        password: 'admin123',
        user: {
            id: 'emergency-admin',
            nombre: 'Administrador',
            email: 'admin@finangest.com',
            role: 'admin'
        }
    };

    if (email === EMERGENCY_ADMIN.email && password === EMERGENCY_ADMIN.password) {
        return res.json({
            success: true,
            user: EMERGENCY_ADMIN.user,
            message: 'Login de emergencia exitoso'
        });
    }

    return res.json({
        success: false,
        error: 'Credenciales incorrectas. Use: admin@finangest.com / admin123'
    });
};
