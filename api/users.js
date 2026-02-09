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
        
        // Parsear body si es necesario
        let body = req.body || {};
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        // POST - Rechazar usuario pendiente
        if (req.method === 'POST' && req.url.includes('/api/rechazar-usuario-pendiente')) {
            const { email } = body;
            
            if (!email) {
                return res.status(400).json({ success: false, error: 'Email requerido' });
            }
            
            // Eliminar el usuario pendiente
            const result = await db.collection('users').deleteOne({ 
                email: email.toLowerCase(),
                activo: false
            });
            
            if (result.deletedCount > 0) {
                return res.json({ success: true, message: 'Usuario rechazado y eliminado' });
            } else {
                return res.json({ success: false, error: 'Usuario no encontrado o ya activo' });
            }
        }

        // POST - Solicitar acceso admin
        if (req.method === 'POST' && req.url.includes('/api/solicitar-acceso-admin')) {
            const { userId } = body;
            
            if (!userId) {
                return res.status(400).json({ success: false, error: 'userId requerido' });
            }
            
            // Marcar solicitud de acceso admin
            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { $set: { solicitaAccesoAdmin: true, fechaSolicitud: new Date() } }
            );
            
            return res.json({ success: true, message: 'Solicitud enviada' });
        }

        // POST - Reset datos usuario
        if (req.method === 'POST' && req.url.includes('/api/reset-datos-usuario')) {
            const { userId } = body;
            
            if (!userId) {
                return res.status(400).json({ success: false, error: 'userId requerido' });
            }
            
            // Eliminar todos los datos del usuario
            await db.collection('clientes').deleteMany({ creadoPor: userId });
            await db.collection('gastos').deleteMany({ userId });
            await db.collection('carteras').deleteMany({ creadoPor: userId });
            
            return res.json({ success: true, message: 'Datos reseteados' });
        }

        // POST - Reset todo (admin only)
        if (req.method === 'POST' && req.url.includes('/api/reset-todo')) {
            // Solo admin puede hacer esto
            const { adminId } = body;
            
            if (!adminId) {
                return res.status(403).json({ success: false, error: 'No autorizado' });
            }
            
            const admin = await db.collection('users').findOne({ _id: new ObjectId(adminId) });
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'No autorizado' });
            }
            
            // Eliminar todos los datos excepto el admin
            await db.collection('clientes').deleteMany({});
            await db.collection('gastos').deleteMany({});
            await db.collection('carteras').deleteMany({});
            await db.collection('users').deleteMany({ role: { $ne: 'admin' } });
            
            return res.json({ success: true, message: 'Sistema reseteado' });
        }

        // GET - Usuarios pendientes
        if (req.method === 'GET' && req.url.includes('/api/pending-users')) {
            const pendingUsers = await db.collection('users')
                .find({ activo: false })
                .toArray();
            
            return res.json({ 
                success: true, 
                users: pendingUsers.map(u => ({ ...u, id: u._id }))
            });
        }

        // POST - Toggle edit key
        if (req.method === 'POST' && req.url.includes('/toggle-edit-key')) {
            const userId = req.url.split('/')[3]; // Extraer ID de la URL
            
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            const newStatus = !user?.editKeyEnabled;
            
            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { $set: { editKeyEnabled: newStatus } }
            );
            
            const message = newStatus 
                ? '✅ Acceso de llave ACTIVADO - El usuario puede editar préstamos e información de clientes'
                : '🔒 Acceso de llave DESACTIVADO - El usuario NO puede editar préstamos ni información de clientes';
            
            return res.json({ 
                success: true, 
                editKeyEnabled: newStatus,
                message: message
            });
        }

        // GET - Sessions
        if (req.method === 'GET' && req.url.includes('/api/sessions/')) {
            const userId = req.url.split('/api/sessions/')[1]?.split('?')[0];
            
            if (userId && userId !== 'admin') {
                const sessions = await db.collection('sessions')
                    .find({ userId })
                    .toArray();
                
                return res.json({ 
                    success: true, 
                    sessions: sessions.map(s => ({ ...s, id: s._id }))
                });
            }
            
            // Admin - todas las sesiones
            if (req.url.includes('/api/sessions/admin')) {
                const sessions = await db.collection('sessions')
                    .find({})
                    .toArray();
                
                return res.json({ 
                    success: true, 
                    sessions: sessions.map(s => ({ ...s, id: s._id }))
                });
            }
        }

        // POST - Close all user sessions (admin)
        if (req.method === 'POST' && req.url.includes('/api/sessions/admin/close-all-users')) {
            await db.collection('sessions').deleteMany({ role: { $ne: 'admin' } });
            return res.json({ success: true, message: 'Sesiones cerradas' });
        }

        // DELETE - Close user session
        if (req.method === 'DELETE' && req.url.includes('/api/sessions/')) {
            const sessionId = req.url.split('/api/sessions/')[1];
            await db.collection('sessions').deleteOne({ _id: new ObjectId(sessionId) });
            return res.json({ success: true });
        }

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
