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

        // ============ SERVER TIME ============
        if (pathname === '/api/server-time') {
            const { timezone } = req.query;
            const serverTime = new Date();
            
            return res.json({
                success: true,
                serverTime: serverTime.toISOString(),
                timestamp: serverTime.getTime(),
                timezone: timezone || 'UTC'
            });
        }

        // ============ HEARTBEAT ============
        if (pathname === '/api/heartbeat' && req.method === 'POST') {
            return res.json({
                success: true,
                timestamp: new Date().toISOString(),
                message: 'Heartbeat received'
            });
        }

        // ============ USERS ============
        if (pathname === '/api/users') {
            if (req.method === 'GET') {
                const users = await db.collection('users').find({}).toArray();
                return res.json(users.map(u => ({
                    ...u,
                    id: u._id.toString(),
                    password: undefined // No enviar contraseñas
                })));
            }
        }

        if (pathname.startsWith('/api/users/')) {
            const userId = pathname.split('/').pop();
            
            if (req.method === 'PUT') {
                const updateData = { ...req.body };
                delete updateData._id;
                delete updateData.id;

                const result = await db.collection('users').updateOne(
                    { _id: new ObjectId(userId) },
                    { $set: updateData }
                );

                return res.json({ 
                    success: result.modifiedCount > 0,
                    message: result.modifiedCount > 0 ? 'Usuario actualizado' : 'Usuario no encontrado'
                });
            }
        }

        // ============ SESSIONS ============
        if (pathname.startsWith('/api/sessions')) {
            const pathParts = pathname.split('/').filter(p => p);

            // GET /api/sessions/{userId}
            if (req.method === 'GET' && pathParts.length >= 2) {
                const userId = pathParts[1];
                const sessions = await db.collection('sessions').find({ userId }).toArray();
                return res.json({ success: true, sessions });
            }

            // POST /api/sessions/{sessionId}/close
            if (req.method === 'POST' && pathParts.includes('close')) {
                const sessionId = pathParts[1];
                if (sessionId && sessionId !== 'admin') {
                    await db.collection('sessions').updateOne(
                        { _id: new ObjectId(sessionId) },
                        { $set: { active: false, closedAt: new Date() } }
                    );
                }
                return res.json({ success: true, message: 'Sesión cerrada' });
            }

            // POST /api/sessions/{userId}/close-all
            if (req.method === 'POST' && pathParts.includes('close-all')) {
                const userId = pathParts[1];
                if (userId && userId !== 'admin') {
                    await db.collection('sessions').updateMany(
                        { userId },
                        { $set: { active: false, closedAt: new Date() } }
                    );
                }
                return res.json({ success: true, message: 'Todas las sesiones cerradas' });
            }

            // POST /api/sessions/admin/close-all-users
            if (req.method === 'POST' && pathParts.includes('admin') && pathParts.includes('close-all-users')) {
                await db.collection('sessions').updateMany(
                    {},
                    { $set: { active: false, closedAt: new Date() } }
                );
                return res.json({ success: true, message: 'Todas las sesiones de usuarios cerradas' });
            }

            return res.json({ success: true, message: 'Operación de sesión completada' });
        }

        // ============ PAYMENT ENDPOINTS ============
        if (pathname === '/api/crear-pago-pix' && req.method === 'POST') {
            const { userId, nombre, email, valor } = req.body;
            
            const paymentId = 'pix_' + Date.now() + '_' + Math.random().toString(36).substring(7);
            const qrCode = `00020126580014BR.GOV.BCB.PIX0136${paymentId}5204000053039865802BR5925${nombre || 'FinanGest'}6009SAO PAULO62070503***6304`;
            const qrCodeBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            
            return res.json({
                success: true,
                paymentId,
                qrCode,
                qrCodeBase64,
                valor: valor || 51.41,
                message: 'PIX gerado com sucesso'
            });
        }

        if (pathname === '/api/verificar-pago' && req.method === 'POST') {
            const { paymentId, userId } = req.body;
            
            // Simulación - en producción verificarías con el gateway real
            const paid = false;
            
            if (paid) {
                await db.collection('users').updateOne(
                    { _id: new ObjectId(userId) },
                    { 
                        $set: { 
                            activo: true,
                            fechaPago: new Date(),
                            paymentId: paymentId
                        }
                    }
                );
            }
            
            return res.json({
                success: true,
                paid,
                message: paid ? 'Pago confirmado' : 'Pago pendiente'
            });
        }

        // ============ VERIFICATION ENDPOINTS ============
        if (pathname === '/api/send-code' && req.method === 'POST') {
            const { email } = req.body;
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            console.log(`Código de verificación para ${email}: ${code}`);
            
            return res.json({
                success: true,
                message: 'Código enviado',
                code: process.env.NODE_ENV === 'development' ? code : undefined
            });
        }

        if (pathname === '/api/verify-code' && req.method === 'POST') {
            const { email, code, nombre, username, password, recoveryEmail } = req.body;
            
            // Código de prueba
            const validCode = '123456';
            
            if (code !== validCode) {
                return res.json({
                    success: false,
                    error: 'Código inválido'
                });
            }
            
            // Verificar si el usuario ya existe
            const existingUser = await db.collection('users').findOne({
                $or: [
                    { email: email.toLowerCase() },
                    { username: username }
                ]
            });
            
            if (existingUser) {
                return res.json({
                    success: false,
                    error: 'Usuario o email ya existe'
                });
            }
            
            // Hash de la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Crear usuario
            const newUser = {
                nombre,
                username,
                email: email.toLowerCase(),
                recoveryEmail: recoveryEmail?.toLowerCase(),
                password: hashedPassword,
                role: 'user',
                activo: false,
                carterasPagadas: 0,
                fechaCreacion: new Date()
            };
            
            const result = await db.collection('users').insertOne(newUser);
            
            return res.json({
                success: true,
                userId: result.insertedId.toString(),
                message: 'Usuario creado exitosamente'
            });
        }

        // ============ ADMIN ENDPOINTS ============
        if (pathname === '/api/solicitar-acceso-admin' && req.method === 'POST') {
            const { userId, email, nombre } = req.body;
            
            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { 
                    $set: { 
                        solicitudAccesoAdmin: true,
                        fechaSolicitudAdmin: new Date()
                    }
                }
            );
            
            console.log(`Usuario ${nombre} (${email}) solicitó acceso admin`);
            
            return res.json({
                success: true,
                message: 'Solicitud enviada al administrador'
            });
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
                    role: user.role,
                    carterasPagadas: user.carterasPagadas || 0
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
