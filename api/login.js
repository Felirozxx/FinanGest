const { connectToDatabase } = require('./_db');
const { verifyPassword } = require('./_crypto-hash');

// Buscar usuario en cualquier backend
async function findUser(connection, email) {
    const { db, client, type, backend } = connection;

    if (backend === 'mongodb') {
        return await db.collection('users').findOne({
            $or: [{ email }, { username: email }]
        });
    }

    if (backend === 'supabase') {
        const { data, error } = await client
            .from('users')
            .select('*')
            .or(`email.eq.${email},username.eq.${email}`)
            .single();
        if (error) return null;
        return data;
    }

    if (backend === 'firebase') {
        // Firebase Firestore
        const snapshot = await db.collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { _id: doc.id, ...doc.data() };
    }

    return null;
}

// Login endpoint v2 - Multi-backend
module.exports = async (req, res) => {
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

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
        }

        console.log('🔐 Login attempt:', email);

        const connection = await connectToDatabase();
        console.log('✅ DB connected, backend:', connection.backend);

        const user = await findUser(connection, email);

        if (!user) {
            console.log('❌ User not found:', email);
            return res.json({ success: false, error: 'Usuario no encontrado' });
        }

        console.log('✅ User found:', user.email, 'Role:', user.role);

        const valid = verifyPassword(password, user.password);
        console.log('🔐 Password valid:', valid);

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
        res.status(500).json({ success: false, error: 'Error de servidor: ' + error.message });
    }
};
