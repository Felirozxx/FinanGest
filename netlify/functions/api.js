const { MongoClient, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Variables de entorno (configurar en Netlify)
const MONGODB_URI = process.env.MONGODB_URI;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'finangest-admin-2026';
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

let cachedDb = null;

async function connectDB() {
    if (cachedDb) return cachedDb;
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedDb = client.db('finangest');
    return cachedDb;
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    if (!stored || !stored.includes(':')) return password === stored;
    const [salt, hash] = stored.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// Response helper
const respond = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(body)
});

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return respond(200, {});
    }

    const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');
    const method = event.httpMethod;
    let body = {};
    
    try {
        if (event.body) body = JSON.parse(event.body);
    } catch (e) {}

    try {
        const db = await connectDB();

        // Health check
        if (path === '/health' || path === '') {
            return respond(200, { status: 'ok', timestamp: new Date().toISOString() });
        }
        
        // CONFIGURACIÓN GLOBAL (GET)
        if (path === '/config' && method === 'GET') {
            const config = await db.collection('config').findOne({ type: 'global' });
            return respond(200, { success: true, config: config || { precioSuscripcion: 79.50, nombreEmpresa: 'FinanGest', moneda: 'BRL' } });
        }
        
        // CONFIGURACIÓN GLOBAL (POST - solo admin)
        if (path === '/config' && method === 'POST') {
            const { config } = body;
            await db.collection('config').updateOne(
                { type: 'global' },
                { $set: { ...config, type: 'global', updatedAt: new Date() } },
                { upsert: true }
            );
            return respond(200, { success: true });
        }

        // LOGIN
        if (path === '/login' && method === 'POST') {
            const { email, password, deviceInfo } = body;
            const users = db.collection('users');
            const sessions = db.collection('sessions');
            
            let user = await users.findOne({ email });
            if (!user && email === 'Felirozxx') {
                user = await users.findOne({ username: 'Felirozxx' });
            }
            
            if (!user) return respond(200, { success: false, error: 'Usuario no encontrado' });
            if (user.blocked && user.role !== 'admin') {
                return respond(200, { success: false, error: 'Tu cuenta ha sido bloqueada.' });
            }
            if (!verifyPassword(password, user.password)) {
                return respond(200, { success: false, error: 'Contraseña incorrecta' });
            }
            
            // Verificar suscripción
            if (user.role !== 'admin') {
                if (!user.paid) {
                    return respond(200, { success: false, needsPayment: true, userId: user._id, nombre: user.nombre, email: user.email });
                }
                if (user.subscriptionExpires && new Date(user.subscriptionExpires) < new Date()) {
                    await users.updateOne({ _id: user._id }, { $set: { paid: false } });
                    return respond(200, { success: false, needsPayment: true, expired: true, userId: user._id, nombre: user.nombre, email: user.email });
                }
            }
            
            // Actualizar contraseña si no está encriptada
            if (!user.password.includes(':')) {
                await users.updateOne({ _id: user._id }, { $set: { password: hashPassword(password) } });
            }
            
            // Crear sesión con info del dispositivo
            const sessionId = crypto.randomBytes(32).toString('hex');
            const sessionData = {
                sessionId,
                odId: user._id.toString(),
                deviceName: deviceInfo?.deviceName || 'Dispositivo desconocido',
                deviceType: deviceInfo?.deviceType || 'desktop',
                browser: deviceInfo?.browser || 'Navegador',
                os: deviceInfo?.os || 'Sistema',
                ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'IP desconocida',
                createdAt: new Date(),
                lastActivity: new Date(),
                active: true
            };
            await sessions.insertOne(sessionData);
            
            return respond(200, { success: true, sessionId, user: {
                id: user._id.toString(), nombre: user.nombre, username: user.username,
                email: user.email, role: user.role || 'client', isAdmin: user.role === 'admin' || user.isAdmin
            }});
        }
        
        // OBTENER SESIONES DEL USUARIO
        if (path.match(/^\/sessions\/[^/]+$/) && method === 'GET') {
            const odId = path.split('/')[2];
            const sessions = db.collection('sessions');
            const userSessions = await sessions.find({ odId, active: true }).sort({ lastActivity: -1 }).toArray();
            return respond(200, { success: true, sessions: userSessions });
        }
        
        // CERRAR UNA SESIÓN ESPECÍFICA
        if (path.match(/^\/sessions\/[^/]+\/close$/) && method === 'POST') {
            const sessionId = path.split('/')[2];
            const sessions = db.collection('sessions');
            await sessions.updateOne({ sessionId }, { $set: { active: false, closedAt: new Date() } });
            return respond(200, { success: true });
        }
        
        // CERRAR TODAS LAS SESIONES EXCEPTO LA ACTUAL
        if (path.match(/^\/sessions\/[^/]+\/close-all$/) && method === 'POST') {
            const odId = path.split('/')[2];
            const { currentSessionId } = body;
            const sessions = db.collection('sessions');
            await sessions.updateMany(
                { odId, active: true, sessionId: { $ne: currentSessionId } },
                { $set: { active: false, closedAt: new Date() } }
            );
            return respond(200, { success: true });
        }
        
        // ACTUALIZAR ACTIVIDAD DE SESIÓN
        if (path.match(/^\/sessions\/[^/]+\/activity$/) && method === 'POST') {
            const sessionId = path.split('/')[2];
            const sessions = db.collection('sessions');
            await sessions.updateOne({ sessionId }, { $set: { lastActivity: new Date() } });
            return respond(200, { success: true });
        }

        // SEND CODE (registro)
        if (path === '/send-code' && method === 'POST') {
            const { email, nombre, username } = body;
            const users = db.collection('users');
            const codes = db.collection('verification_codes');
            
            const existingEmail = await users.findOne({ email });
            if (existingEmail) return respond(200, { success: false, error: 'Este email ya está registrado' });
            
            if (username) {
                const existingUsername = await users.findOne({ username });
                if (existingUsername) return respond(200, { success: false, error: 'Este nombre de usuario ya existe' });
            }
            
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await codes.updateOne({ email }, { $set: { code, nombre, username, expires: new Date(Date.now() + 600000) } }, { upsert: true });
            
            if (EMAIL_PASS) {
                await transporter.sendMail({
                    from: EMAIL_USER, to: email,
                    subject: 'Código de Verificación - FinanGest',
                    html: `<h2>Bienvenido a FinanGest</h2><p>Tu código: <strong style="font-size:24px">${code}</strong></p>`
                });
            }
            
            return respond(200, { success: true, message: 'Código enviado', devCode: !EMAIL_PASS ? code : undefined });
        }

        // VERIFY CODE
        if (path === '/verify-code' && method === 'POST') {
            const { email, code, password, username } = body;
            const users = db.collection('users');
            const codes = db.collection('verification_codes');
            
            const stored = await codes.findOne({ email });
            if (!stored || new Date(stored.expires) < new Date()) return respond(200, { success: false, error: 'Código expirado' });
            if (stored.code !== code) return respond(200, { success: false, error: 'Código incorrecto' });
            
            const result = await users.insertOne({
                nombre: stored.nombre, username: username || stored.username, email,
                password: hashPassword(password), role: 'client', paid: false, createdAt: new Date()
            });
            
            await codes.deleteOne({ email });
            return respond(200, { success: true, user: { id: result.insertedId, nombre: stored.nombre, email } });
        }

        // FORGOT PASSWORD
        if (path === '/forgot-password' && method === 'POST') {
            const { email } = body;
            const users = db.collection('users');
            const codes = db.collection('reset_codes');
            
            const user = await users.findOne({ email });
            if (!user) return respond(200, { success: false, error: 'Email no encontrado' });
            
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await codes.updateOne({ email }, { $set: { code, expires: new Date(Date.now() + 600000) } }, { upsert: true });
            
            if (EMAIL_PASS) {
                await transporter.sendMail({
                    from: EMAIL_USER, to: email,
                    subject: 'Recuperar Contraseña - FinanGest',
                    html: `<h2>Recuperar Contraseña</h2><p>Tu código: <strong style="font-size:24px">${code}</strong></p>`
                });
            }
            
            return respond(200, { success: true, message: 'Código enviado', devCode: !EMAIL_PASS ? code : undefined });
        }

        // RESET PASSWORD
        if (path === '/reset-password' && method === 'POST') {
            const { email, code, newPassword } = body;
            const users = db.collection('users');
            const codes = db.collection('reset_codes');
            
            const stored = await codes.findOne({ email });
            if (!stored || new Date(stored.expires) < new Date()) return respond(200, { success: false, error: 'Código expirado' });
            if (stored.code !== code) return respond(200, { success: false, error: 'Código incorrecto' });
            
            await users.updateOne({ email }, { $set: { password: hashPassword(newPassword) } });
            await codes.deleteOne({ email });
            return respond(200, { success: true, message: 'Contraseña actualizada' });
        }

        // GET USERS
        if (path === '/users' && method === 'GET') {
            const users = await db.collection('users').find({}).toArray();
            const safeUsers = users.map(u => ({ ...u, id: u._id.toString(), password: undefined }));
            return respond(200, safeUsers);
        }

        // CREATE USER
        if (path === '/users' && method === 'POST') {
            const userData = { ...body };
            if (userData.password) userData.password = hashPassword(userData.password);
            const result = await db.collection('users').insertOne(userData);
            return respond(200, { success: true, id: result.insertedId });
        }

        // UPDATE USER
        if (path.match(/^\/users\/[^/]+$/) && method === 'PUT') {
            const userId = path.split('/')[2];
            const updateData = { ...body };
            if (updateData.password) updateData.password = hashPassword(updateData.password);
            
            let result;
            try {
                result = await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
            } catch (e) {
                result = await db.collection('users').updateOne({ id: userId }, { $set: updateData });
            }
            return respond(200, { success: result.matchedCount > 0 });
        }

        // DELETE USER
        if (path.match(/^\/users\/[^/]+$/) && method === 'DELETE') {
            const userId = path.split('/')[2];
            let result;
            try {
                result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
            } catch (e) {
                result = await db.collection('users').deleteOne({ id: userId });
            }
            return respond(200, { success: result.deletedCount > 0 });
        }

        // TOGGLE EDIT KEY
        if (path.match(/^\/users\/[^/]+\/toggle-edit-key$/) && method === 'POST') {
            const userId = path.split('/')[2];
            let user;
            try {
                user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            } catch (e) {
                user = await db.collection('users').findOne({ id: userId });
            }
            
            if (!user) return respond(200, { success: false, error: 'Usuario no encontrado' });
            
            const newStatus = !user.editKeyEnabled;
            try {
                await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { editKeyEnabled: newStatus } });
            } catch (e) {
                await db.collection('users').updateOne({ id: userId }, { $set: { editKeyEnabled: newStatus } });
            }
            return respond(200, { success: true, editKeyEnabled: newStatus });
        }

        // TOGGLE BLOCK
        if (path.match(/^\/users\/[^/]+\/toggle-block$/) && method === 'POST') {
            const userId = path.split('/')[2];
            let user;
            try {
                user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            } catch (e) {
                user = await db.collection('users').findOne({ id: userId });
            }
            
            if (!user) return respond(200, { success: false, error: 'Usuario no encontrado' });
            
            const newStatus = !user.blocked;
            try {
                await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { blocked: newStatus } });
            } catch (e) {
                await db.collection('users').updateOne({ id: userId }, { $set: { blocked: newStatus } });
            }
            return respond(200, { success: true, blocked: newStatus });
        }

        // DEBUG - Ver cliente raw
        if (path.match(/^\/debug-cliente\/[^/]+$/) && method === 'GET') {
            const clientId = path.split('/')[2];
            try {
                const doc = await db.collection('clients').findOne({ _id: new ObjectId(clientId) });
                return respond(200, { raw: doc, id: clientId });
            } catch (e) {
                return respond(200, { error: e.message });
            }
        }

        // GET CLIENTES
        if ((path === '/clientes' || path === '/clients') && method === 'GET') {
            const userId = event.queryStringParameters?.userId;
            let query = {};
            if (userId && userId !== 'admin') {
                query = { $or: [{ creadoPor: userId }, { 'cliente.creadoPor': userId }, { userId: userId }] };
            }
            const clients = await db.collection('clients').find(query).toArray();
            const safeClients = clients.map(c => {
                // Obtener creadoPor de cualquier ubicación posible
                const creadoPor = c.creadoPor || c.userId || (c.cliente && c.cliente.creadoPor) || (c.cliente && c.cliente.userId);
                if (c.cliente) {
                    return { ...c.cliente, id: c._id.toString(), _id: c._id.toString(), creadoPor: creadoPor, userId: creadoPor };
                }
                return { ...c, id: c._id.toString(), creadoPor: creadoPor, userId: creadoPor };
            });
            return respond(200, safeClients);
        }

        // CREATE CLIENTE
        if ((path === '/clientes' || path === '/clients') && method === 'POST') {
            // Si viene con estructura { userId, cliente }, extraer el cliente
            let clienteData = body;
            if (body.cliente) {
                clienteData = { ...body.cliente, creadoPor: body.userId || body.cliente.creadoPor };
            }
            const result = await db.collection('clients').insertOne(clienteData);
            return respond(200, { success: true, id: result.insertedId });
        }

        // UPDATE CLIENTE
        if ((path.match(/^\/clientes\/[^/]+$/) || path.match(/^\/clients\/[^/]+$/)) && method === 'PUT') {
            const clientId = path.split('/')[2];
            if (!clientId) {
                return respond(200, { success: false, error: 'ID de cliente no proporcionado' });
            }
            
            // Extraer creadoPor del body antes de removerlo
            const { _id, id, creadoPor: bodyCreadoPor, ...updateData } = body;
            
            let result;
            try {
                const doc = await db.collection('clients').findOne({ _id: new ObjectId(clientId) });
                if (!doc) {
                    return respond(200, { success: false, error: 'Cliente no encontrado' });
                }
                
                // Prioridad: 1) creadoPor del body (enviado desde frontend), 2) del documento original
                let finalCreadoPor = bodyCreadoPor || doc.creadoPor || doc.userId || (doc.cliente && doc.cliente.creadoPor) || (doc.cliente && doc.cliente.userId);
                
                if (doc.cliente) {
                    // Documento con estructura anidada
                    const mergedData = { 
                        ...doc.cliente, 
                        ...updateData,
                        creadoPor: finalCreadoPor
                    };
                    result = await db.collection('clients').updateOne(
                        { _id: new ObjectId(clientId) }, 
                        { $set: { cliente: mergedData, creadoPor: finalCreadoPor, userId: finalCreadoPor } }
                    );
                } else {
                    // Documento plano - guardar creadoPor y userId
                    result = await db.collection('clients').updateOne(
                        { _id: new ObjectId(clientId) }, 
                        { $set: { ...updateData, creadoPor: finalCreadoPor, userId: finalCreadoPor } }
                    );
                }
            } catch (e) {
                // Intentar con id string
                try {
                    const doc = await db.collection('clients').findOne({ id: clientId });
                    if (doc) {
                        let finalCreadoPor = bodyCreadoPor || doc.creadoPor || doc.userId;
                        result = await db.collection('clients').updateOne(
                            { id: clientId }, 
                            { $set: { ...updateData, creadoPor: finalCreadoPor, userId: finalCreadoPor } }
                        );
                    }
                } catch (e2) {
                    return respond(200, { success: false, error: 'Error al actualizar: ' + e2.message });
                }
            }
            return respond(200, { success: result && result.matchedCount > 0 });
        }

        // DELETE CLIENTE
        if ((path.match(/^\/clientes\/[^/]+$/) || path.match(/^\/clients\/[^/]+$/)) && method === 'DELETE') {
            const clientId = path.split('/')[2];
            let result;
            try {
                result = await db.collection('clients').deleteOne({ _id: new ObjectId(clientId) });
            } catch (e) {
                result = await db.collection('clients').deleteOne({ id: clientId });
            }
            return respond(200, { success: result.deletedCount > 0 });
        }

        // GET GASTOS
        if (path === '/gastos' && method === 'GET') {
            const userId = event.queryStringParameters?.userId;
            let query = {};
            if (userId && userId !== 'admin') {
                query = { $or: [{ creadoPor: userId }, { userId: userId }] };
            }
            const gastos = await db.collection('gastos').find(query).toArray();
            return respond(200, gastos.map(g => ({ ...g, id: g._id.toString() })));
        }

        // CREATE GASTO
        if (path === '/gastos' && method === 'POST') {
            const result = await db.collection('gastos').insertOne(body);
            return respond(200, { success: true, id: result.insertedId });
        }

        // UPDATE GASTO
        if (path.match(/^\/gastos\/[^/]+$/) && method === 'PUT') {
            const gastoId = path.split('/')[2];
            let result;
            try {
                result = await db.collection('gastos').updateOne({ _id: new ObjectId(gastoId) }, { $set: body });
            } catch (e) {
                result = await db.collection('gastos').updateOne({ id: gastoId }, { $set: body });
            }
            return respond(200, { success: result.matchedCount > 0 });
        }

        // DELETE GASTO
        if (path.match(/^\/gastos\/[^/]+$/) && method === 'DELETE') {
            const gastoId = path.split('/')[2];
            let result;
            try {
                result = await db.collection('gastos').deleteOne({ _id: new ObjectId(gastoId) });
            } catch (e) {
                result = await db.collection('gastos').deleteOne({ id: gastoId });
            }
            return respond(200, { success: result.deletedCount > 0 });
        }

        // CLIENTES ELIMINADOS
        if (path === '/clientes-eliminados' && method === 'GET') {
            const userId = event.queryStringParameters?.userId;
            let query = {};
            if (userId && userId !== 'admin') query = { creadoPor: userId };
            const eliminados = await db.collection('clientes_eliminados').find(query).sort({ fechaEliminacion: -1 }).toArray();
            return respond(200, eliminados.map(c => ({ ...c, id: c._id.toString() })));
        }

        if (path === '/clientes-eliminados' && method === 'POST') {
            const result = await db.collection('clientes_eliminados').insertOne(body);
            return respond(200, { success: true, id: result.insertedId });
        }

        if (path.match(/^\/clientes-eliminados\/[^/]+$/) && method === 'DELETE') {
            const id = path.split('/')[2];
            let result;
            try {
                result = await db.collection('clientes_eliminados').deleteOne({ _id: new ObjectId(id) });
            } catch (e) {
                result = await db.collection('clientes_eliminados').deleteOne({ id: id });
            }
            return respond(200, { success: result.deletedCount > 0 });
        }

        // RESET ALL CLIENTS (Admin only)
        if (path === '/admin/reset-clientes' && method === 'POST') {
            const result1 = await db.collection('clients').deleteMany({});
            const result2 = await db.collection('clientes_eliminados').deleteMany({});
            return respond(200, { 
                success: true, 
                deleted: {
                    clientes: result1.deletedCount,
                    eliminados: result2.deletedCount
                }
            });
        }

        // RESET ALL USERS (Admin only) - Borra todos excepto admins
        if (path === '/admin/reset-users' && method === 'POST') {
            const result1 = await db.collection('users').deleteMany({ role: { $ne: 'admin' } });
            const result2 = await db.collection('verification_codes').deleteMany({});
            const result3 = await db.collection('reset_codes').deleteMany({});
            const result4 = await db.collection('sessions').deleteMany({});
            return respond(200, { 
                success: true, 
                deleted: {
                    users: result1.deletedCount,
                    codes: result2.deletedCount + result3.deletedCount,
                    sessions: result4.deletedCount
                }
            });
        }

        // HEARTBEAT
        if (path === '/heartbeat' && method === 'POST') {
            const { userId } = body;
            if (userId) {
                try {
                    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { lastSeen: new Date() } });
                } catch (e) {
                    await db.collection('users').updateOne({ id: userId }, { $set: { lastSeen: new Date() } });
                }
            }
            return respond(200, { success: true });
        }

        // PIX PAYMENT
        if (path === '/crear-pago-pix' && method === 'POST') {
            const { userId, nombre, email } = body;
            
            // Obtener precio de la configuración global
            const config = await db.collection('config').findOne({ type: 'global' });
            const precio = parseFloat(config?.precioSuscripcion) || 79.50;
            
            if (!MP_ACCESS_TOKEN) {
                return respond(200, { 
                    success: true, manual: true,
                    pixKey: 'e6203cd0-c840-4753-ab74-993b722f49b1',
                    pixName: 'FinanGestPay', amount: precio
                });
            }
            
            const paymentData = {
                transaction_amount: precio,
                description: `FINANGEST-${email || userId}`,
                payment_method_id: 'pix',
                payer: {
                    email: email || 'cliente@finangest.app',
                    first_name: nombre || 'Cliente',
                    identification: { type: 'CPF', number: '00000000000' }
                }
            };
            
            const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                    'X-Idempotency-Key': `${userId}-${Date.now()}`
                },
                body: JSON.stringify(paymentData)
            });
            
            const mpData = await mpResponse.json();
            
            if (mpData.id && mpData.point_of_interaction?.transaction_data) {
                const txData = mpData.point_of_interaction.transaction_data;
                await db.collection('pending_payments').updateOne(
                    { oderId: mpData.id },
                    { $set: { oderId: mpData.id, oderId: mpData.id, oderId: oderId, oderId: oderId, userId, email, amount: precio, status: 'pending', createdAt: new Date(), qr_code: txData.qr_code, qr_code_base64: txData.qr_code_base64 } },
                    { upsert: true }
                );
                return respond(200, { success: true, paymentId: mpData.id, qrCode: txData.qr_code, qrCodeBase64: txData.qr_code_base64, amount: precio });
            }
            
            return respond(200, { success: false, error: mpData.message || 'Error al crear pago' });
        }

        // VERIFICAR PAGO
        if (path === '/verificar-pago' && method === 'POST') {
            const { oderId, oderId: paymentId, userId } = body;
            const id = oderId || paymentId;
            
            if (!MP_ACCESS_TOKEN || !id) {
                return respond(200, { success: false, error: 'No se puede verificar' });
            }
            
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
            });
            const mpData = await mpResponse.json();
            
            if (mpData.status === 'approved') {
                // Calcular fecha de expiración: mismo día del próximo mes
                const subscriptionExpires = new Date();
                subscriptionExpires.setMonth(subscriptionExpires.getMonth() + 1);
                
                await db.collection('users').updateOne(
                    { $or: [{ _id: new ObjectId(userId) }, { id: userId }] },
                    { $set: { paid: true, subscriptionExpires, subscriptionType: 'monthly', lastPayment: new Date() } }
                );
                await db.collection('pending_payments').updateOne({ oderId: id }, { $set: { status: 'approved' } });
                return respond(200, { success: true, paid: true });
            }
            
            return respond(200, { success: true, paid: false, status: mpData.status });
        }

        // MAKE ADMIN
        if (path === '/make-admin' && method === 'POST') {
            const { name, secret } = body;
            if (secret !== ADMIN_SECRET) return respond(200, { success: false, error: 'No autorizado' });
            
            const result = await db.collection('users').updateOne(
                { $or: [{ nombre: name }, { username: name }] },
                { $set: { role: 'admin', isAdmin: true, paid: true } }
            );
            return respond(200, { success: result.modifiedCount > 0 });
        }

        // ============ ADMIN GASTOS ============
        
        // UPDATE GASTO (Admin)
        if (path.match(/^\/admin\/gasto\/[^/]+$/) && method === 'PUT') {
            const gastoId = path.split('/').pop();
            const { _id, ...updateData } = body;
            let result;
            try {
                result = await db.collection('gastos').updateOne({ _id: new ObjectId(gastoId) }, { $set: updateData });
            } catch (e) {
                result = await db.collection('gastos').updateOne({ id: gastoId }, { $set: updateData });
            }
            return respond(200, { success: result.matchedCount > 0 });
        }
        
        // DELETE GASTO (Admin)
        if (path.match(/^\/admin\/gasto\/[^/]+$/) && method === 'DELETE') {
            const gastoId = path.split('/').pop();
            let result;
            try {
                result = await db.collection('gastos').deleteOne({ _id: new ObjectId(gastoId) });
            } catch (e) {
                result = await db.collection('gastos').deleteOne({ id: gastoId });
            }
            return respond(200, { success: result.deletedCount > 0 });
        }

        // ============ BACKUPS DE TRABAJADOR ============
        
        // GET backups de un trabajador
        if (path.match(/^\/admin\/backups-trabajador\/(.+)$/) && method === 'GET') {
            const userId = path.split('/').pop();
            const backups = await db.collection('backups')
                .find({ creadoPor: userId })
                .sort({ fecha: -1 })
                .limit(20)
                .toArray();
            return respond(200, backups.map(b => ({
                id: b._id.toString(),
                fecha: b.fecha,
                clientes: b.clientes?.length || 0,
                gastos: b.gastos?.length || 0,
                auto: b.auto || false
            })));
        }
        
        // POST crear backup de trabajador
        if (path.match(/^\/admin\/backup-trabajador\/(.+)$/) && method === 'POST') {
            const userId = path.split('/').pop();
            
            // Obtener datos del trabajador (usar 'clients' que es la colección correcta)
            const clientesData = await db.collection('clients').find({ 
                $or: [{ creadoPor: userId }, { 'cliente.creadoPor': userId }, { userId: userId }] 
            }).toArray();
            const gastosData = await db.collection('gastos').find({ 
                $or: [{ creadoPor: userId }, { userId: userId }] 
            }).toArray();
            
            const backup = {
                creadoPor: userId,
                fecha: new Date().toISOString(),
                clientes: clientesData,
                gastos: gastosData,
                auto: body.auto || false
            };
            
            const result = await db.collection('backups').insertOne(backup);
            
            // Mantener solo los últimos 7 días de backups (limpiar antiguos)
            const hace7Dias = new Date();
            hace7Dias.setDate(hace7Dias.getDate() - 7);
            await db.collection('backups').deleteMany({
                creadoPor: userId,
                fecha: { $lt: hace7Dias.toISOString() }
            });
            
            return respond(200, { success: true, backupId: result.insertedId.toString() });
        }
        
        // POST restaurar backup de trabajador
        if (path.match(/^\/admin\/restore-trabajador\/(.+)$/) && method === 'POST') {
            const backupId = path.split('/').pop();
            
            let backup;
            try {
                backup = await db.collection('backups').findOne({ _id: new ObjectId(backupId) });
            } catch (e) {
                return respond(400, { success: false, error: 'ID de backup inválido' });
            }
            
            if (!backup) {
                return respond(404, { success: false, error: 'Backup no encontrado' });
            }
            
            const userId = backup.creadoPor;
            
            // Eliminar datos actuales del trabajador (usar 'clients')
            await db.collection('clients').deleteMany({ 
                $or: [{ creadoPor: userId }, { 'cliente.creadoPor': userId }, { userId: userId }] 
            });
            await db.collection('gastos').deleteMany({ 
                $or: [{ creadoPor: userId }, { userId: userId }] 
            });
            
            // Restaurar datos del backup
            if (backup.clientes && backup.clientes.length > 0) {
                // Remover _id para evitar duplicados
                const clientesSinId = backup.clientes.map(c => {
                    const { _id, ...rest } = c;
                    return { ...rest, id: c.id || _id?.toString() || crypto.randomUUID() };
                });
                await db.collection('clients').insertMany(clientesSinId);
            }
            
            if (backup.gastos && backup.gastos.length > 0) {
                const gastosSinId = backup.gastos.map(g => {
                    const { _id, ...rest } = g;
                    return { ...rest, id: g.id || _id?.toString() || crypto.randomUUID() };
                });
                await db.collection('gastos').insertMany(gastosSinId);
            }
            
            return respond(200, { 
                success: true, 
                restored: { 
                    clientes: backup.clientes?.length || 0, 
                    gastos: backup.gastos?.length || 0 
                } 
            });
        }

        // ============ BACKUPS DEL SISTEMA (ADMIN) ============
        
        // GET todos los backups del sistema
        if (path === '/admin/backups' && method === 'GET') {
            const backups = await db.collection('system-backups')
                .find({})
                .sort({ fecha: -1 })
                .limit(20)
                .toArray();
            return respond(200, backups.map(b => ({
                id: b._id.toString(),
                fecha: b.fecha,
                usuarios: b.usuarios?.length || 0,
                clientes: b.clientes?.length || 0,
                gastos: b.gastos?.length || 0,
                auto: b.auto || false
            })));
        }
        
        // POST crear backup del sistema (admin)
        if (path === '/admin/backup' && method === 'POST') {
            try {
                // Obtener todos los datos del sistema (usar 'clients')
                const usuariosData = await db.collection('users').find({}).toArray();
                const clientesData = await db.collection('clients').find({}).toArray();
                const gastosData = await db.collection('gastos').find({}).toArray();
                
                const backup = {
                    tipo: 'sistema',
                    fecha: new Date().toISOString(),
                    usuarios: usuariosData,
                    clientes: clientesData,
                    gastos: gastosData,
                    auto: body.auto || false
                };
                
                const result = await db.collection('system-backups').insertOne(backup);
                
                // Mantener solo los últimos 7 días de backups
                const hace7Dias = new Date();
                hace7Dias.setDate(hace7Dias.getDate() - 7);
                await db.collection('system-backups').deleteMany({
                    fecha: { $lt: hace7Dias.toISOString() }
                });
                
                return respond(200, { 
                    success: true, 
                    archivo: `Backup creado: ${usuariosData.length} usuarios, ${clientesData.length} clientes, ${gastosData.length} gastos`,
                    backupId: result.insertedId.toString() 
                });
            } catch (err) {
                console.error('Error creando backup sistema:', err);
                return respond(500, { success: false, error: err.message });
            }
        }
        
        // POST restaurar backup del sistema
        if (path.match(/^\/admin\/restore-sistema\/(.+)$/) && method === 'POST') {
            const backupId = path.split('/').pop();
            
            let backup;
            try {
                backup = await db.collection('system-backups').findOne({ _id: new ObjectId(backupId) });
            } catch (e) {
                return respond(400, { success: false, error: 'ID de backup inválido' });
            }
            
            if (!backup) {
                return respond(404, { success: false, error: 'Backup no encontrado' });
            }
            
            // Restaurar usuarios (excepto el admin principal)
            if (backup.usuarios && backup.usuarios.length > 0) {
                // No eliminar todos los usuarios, solo actualizar
                for (const u of backup.usuarios) {
                    const { _id, ...userData } = u;
                    await db.collection('users').updateOne(
                        { $or: [{ email: u.email }, { username: u.username }] },
                        { $set: userData },
                        { upsert: true }
                    );
                }
            }
            
            // Restaurar clientes (usar 'clients')
            await db.collection('clients').deleteMany({});
            if (backup.clientes && backup.clientes.length > 0) {
                const clientesSinId = backup.clientes.map(c => {
                    const { _id, ...rest } = c;
                    return { ...rest, id: c.id || _id?.toString() || crypto.randomUUID() };
                });
                await db.collection('clients').insertMany(clientesSinId);
            }
            
            // Restaurar gastos
            await db.collection('gastos').deleteMany({});
            if (backup.gastos && backup.gastos.length > 0) {
                const gastosSinId = backup.gastos.map(g => {
                    const { _id, ...rest } = g;
                    return { ...rest, id: g.id || _id?.toString() || crypto.randomUUID() };
                });
                await db.collection('gastos').insertMany(gastosSinId);
            }
            
            return respond(200, { 
                success: true, 
                restored: { 
                    usuarios: backup.usuarios?.length || 0,
                    clientes: backup.clientes?.length || 0, 
                    gastos: backup.gastos?.length || 0 
                } 
            });
        }

        // Not found
        return respond(404, { error: 'Endpoint no encontrado', path });

    } catch (error) {
        console.error('Error:', error);
        return respond(500, { error: error.message });
    }
};
