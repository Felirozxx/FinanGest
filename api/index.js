const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();

// CORS configurado para permitir Netlify y otros orígenes
app.use(cors({
    origin: ['https://venerable-moonbeam-96c059.netlify.app', 'https://finan-gest.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// También manejar preflight requests
app.options('*', cors());

app.use(express.json());

// Credenciales desde variables de entorno (configurar en Vercel)
const MONGODB_URI = process.env.MONGODB_URI;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'finangest-admin-2026';
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

let db;

// Funciones de encriptación de contraseñas
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    if (!stored || !stored.includes(':')) {
        // Contraseña antigua sin encriptar - comparar directo
        return password === stored;
    }
    const [salt, hash] = stored.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}

async function connectDB() {
    if (db) return db;
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('finangest');
    return db;
}

// Limpiar códigos expirados (más de 1 hora)
async function cleanExpiredCodes() {
    try {
        const database = await connectDB();
        const oneHourAgo = new Date(Date.now() - 3600000);
        await database.collection('verification_codes').deleteMany({ expires: { $lt: oneHourAgo } });
        await database.collection('reset_codes').deleteMany({ expires: { $lt: oneHourAgo } });
    } catch (e) {
        console.log('Error limpiando códigos:', e.message);
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login - Solo email (excepto admin Felirozxx)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const database = await connectDB();
        const users = database.collection('users');
        
        let user = await users.findOne({ email: email });
        if (!user && email === 'Felirozxx') {
            user = await users.findOne({ username: 'Felirozxx' });
        }
        if (!user && email === 'Felirozxx') {
            user = await users.findOne({ nombre: 'Felirozxx' });
        }
        
        if (!user) return res.json({ success: false, error: 'Usuario no encontrado' });
        
        // Verificar si el usuario está bloqueado
        if (user.blocked && user.role !== 'admin') {
            return res.json({ success: false, error: 'Tu cuenta ha sido bloqueada. Contacta al administrador.' });
        }
        
        // Verificar contraseña (soporta encriptada y sin encriptar)
        if (!verifyPassword(password, user.password)) {
            return res.json({ success: false, error: 'Contraseña incorrecta' });
        }
        
        // Verificar suscripción
        if (user.role !== 'admin') {
            if (!user.paid) {
                return res.json({ success: false, needsPayment: true, userId: user._id, nombre: user.nombre, email: user.email });
            }
            // Verificar si la suscripción expiró (30 días)
            if (user.subscriptionExpires && new Date(user.subscriptionExpires) < new Date()) {
                // Suscripción expirada - marcar como no pagado
                await users.updateOne({ _id: user._id }, { $set: { paid: false } });
                return res.json({ 
                    success: false, 
                    needsPayment: true, 
                    expired: true,
                    userId: user._id, 
                    nombre: user.nombre, 
                    email: user.email,
                    message: 'Tu suscripción ha expirado. Renueva para continuar.'
                });
            }
        }
        
        // Si la contraseña estaba sin encriptar, actualizarla
        if (!user.password.includes(':')) {
            await users.updateOne({ _id: user._id }, { $set: { password: hashPassword(password) } });
        }
        
        res.json({ success: true, user: {
            id: user._id,
            nombre: user.nombre,
            username: user.username,
            email: user.email,
            role: user.role || 'client',
            isAdmin: user.role === 'admin' || user.isAdmin
        }});
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Send verification code (registro)
app.post('/api/send-code', async (req, res) => {
    try {
        const { email, nombre, username } = req.body;
        const database = await connectDB();
        const users = database.collection('users');
        const codes = database.collection('verification_codes');
        
        // Limpiar códigos viejos
        cleanExpiredCodes();
        
        const existingEmail = await users.findOne({ email });
        if (existingEmail) return res.json({ success: false, error: 'Este email ya está registrado' });
        
        if (username) {
            const existingUsername = await users.findOne({ username });
            if (existingUsername) return res.json({ success: false, error: 'Este nombre de usuario ya existe' });
        }
        
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar código en MongoDB
        await codes.updateOne(
            { email },
            { $set: { code, nombre, username, expires: new Date(Date.now() + 600000) } },
            { upsert: true }
        );
        
        if (EMAIL_PASS) {
            await transporter.sendMail({
                from: EMAIL_USER,
                to: email,
                subject: 'Código de Verificación - FinanGest',
                html: `<h2>Bienvenido a FinanGest</h2><p>Tu código: <strong style="font-size:24px">${code}</strong></p><p>Expira en 10 minutos.</p>`
            });
        }
        
        res.json({ success: true, message: 'Código enviado', devCode: !EMAIL_PASS ? code : undefined });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Verify code and create user
app.post('/api/verify-code', async (req, res) => {
    try {
        const { email, code, password, username } = req.body;
        const database = await connectDB();
        const users = database.collection('users');
        const codes = database.collection('verification_codes');
        
        const stored = await codes.findOne({ email });
        
        if (!stored || new Date(stored.expires) < new Date()) {
            return res.json({ success: false, error: 'Código expirado' });
        }
        if (stored.code !== code) {
            return res.json({ success: false, error: 'Código incorrecto' });
        }
        
        // Guardar contraseña encriptada
        const result = await users.insertOne({
            nombre: stored.nombre,
            username: username || stored.username,
            email,
            password: hashPassword(password),
            role: 'client',
            paid: false,
            createdAt: new Date()
        });
        
        await codes.deleteOne({ email });
        
        res.json({ success: true, user: { id: result.insertedId, nombre: stored.nombre, email } });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Forgot password
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const database = await connectDB();
        const users = database.collection('users');
        const codes = database.collection('reset_codes');
        
        const user = await users.findOne({ email });
        if (!user) return res.json({ success: false, error: 'Email no encontrado' });
        
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar código en MongoDB
        await codes.updateOne(
            { email },
            { $set: { code, expires: new Date(Date.now() + 600000) } },
            { upsert: true }
        );
        
        if (EMAIL_PASS) {
            await transporter.sendMail({
                from: EMAIL_USER,
                to: email,
                subject: 'Recuperar Contraseña - FinanGest',
                html: `<h2>Recuperar Contraseña</h2><p>Tu código: <strong style="font-size:24px">${code}</strong></p><p>Expira en 10 minutos.</p>`
            });
        }
        
        res.json({ success: true, message: 'Código enviado', devCode: !EMAIL_PASS ? code : undefined });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const database = await connectDB();
        const users = database.collection('users');
        const codes = database.collection('reset_codes');
        
        const stored = await codes.findOne({ email });
        
        if (!stored || new Date(stored.expires) < new Date()) {
            return res.json({ success: false, error: 'Código expirado' });
        }
        if (stored.code !== code) {
            return res.json({ success: false, error: 'Código incorrecto' });
        }
        
        // Guardar contraseña encriptada
        await users.updateOne({ email }, { $set: { password: hashPassword(newPassword) } });
        await codes.deleteOne({ email });
        
        res.json({ success: true, message: 'Contraseña actualizada' });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Make admin - PROTEGIDO con secreto
app.post('/api/make-admin', async (req, res) => {
    try {
        const { name, secret } = req.body;
        
        // Verificar secreto
        if (secret !== ADMIN_SECRET) {
            return res.json({ success: false, error: 'No autorizado' });
        }
        
        const database = await connectDB();
        const users = database.collection('users');
        const result = await users.updateOne(
            { $or: [{ nombre: name }, { username: name }] },
            { $set: { role: 'admin', isAdmin: true, paid: true } }
        );
        res.json({ success: result.modifiedCount > 0, modified: result.modifiedCount });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const database = await connectDB();
        const users = await database.collection('users').find({}).toArray();
        // No enviar contraseñas y mapear _id a id
        const safeUsers = users.map(u => ({ 
            ...u, 
            id: u._id.toString(),
            password: undefined 
        }));
        res.json(safeUsers);
    } catch (e) {
        res.json({ error: e.message });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    try {
        const database = await connectDB();
        const userData = { ...req.body };
        if (userData.password) {
            userData.password = hashPassword(userData.password);
        }
        const result = await database.collection('users').insertOne(userData);
        res.json({ success: true, id: result.insertedId });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const updateData = { ...req.body };
        if (updateData.password) {
            updateData.password = hashPassword(updateData.password);
        }
        
        const searchId = req.params.id;
        
        // Buscar por múltiples campos posibles
        const result = await database.collection('users').updateOne(
            { 
                $or: [
                    { id: searchId },
                    { id: parseInt(searchId) },
                    { id: searchId.toString() }
                ]
            },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            // Intentar con ObjectId si es válido
            try {
                const objResult = await database.collection('users').updateOne(
                    { _id: new ObjectId(searchId) },
                    { $set: updateData }
                );
                res.json({ success: objResult.matchedCount > 0 });
            } catch (e) {
                res.json({ success: false, error: 'Usuario no encontrado' });
            }
        } else {
            res.json({ success: true });
        }
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        
        // Buscar por múltiples campos posibles
        const result = await database.collection('users').deleteOne(
            { 
                $or: [
                    { id: searchId },
                    { id: parseInt(searchId) },
                    { id: searchId.toString() }
                ]
            }
        );
        
        if (result.deletedCount === 0) {
            // Intentar con ObjectId si es válido
            try {
                const objResult = await database.collection('users').deleteOne(
                    { _id: new ObjectId(searchId) }
                );
                res.json({ success: objResult.deletedCount > 0 });
            } catch (e) {
                res.json({ success: false, error: 'Usuario no encontrado' });
            }
        } else {
            res.json({ success: true });
        }
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Delete user by email
app.delete('/api/users/email/:email', async (req, res) => {
    try {
        const database = await connectDB();
        const result = await database.collection('users').deleteOne({ email: req.params.email });
        res.json({ success: result.deletedCount > 0, deleted: result.deletedCount });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Get clients
app.get('/api/clients', async (req, res) => {
    try {
        const database = await connectDB();
        const clients = await database.collection('clients').find({}).toArray();
        // Mapear _id a id y aplanar estructura si está anidada
        const safeClients = clients.map(c => {
            if (c.cliente) {
                // Estructura anidada - aplanar
                return { ...c.cliente, id: c._id.toString(), _id: c._id.toString() };
            }
            return { ...c, id: c._id.toString() };
        });
        res.json(safeClients);
    } catch (e) {
        res.json({ error: e.message });
    }
});

// Get clientes (alias en español)
app.get('/api/clientes', async (req, res) => {
    try {
        const database = await connectDB();
        const { userId } = req.query;
        let query = {};
        if (userId && userId !== 'admin') {
            query = { 
                $or: [
                    { creadoPor: userId }, 
                    { 'cliente.creadoPor': userId },
                    { userId: userId }
                ] 
            };
        }
        const clients = await database.collection('clients').find(query).toArray();
        // Mapear _id a id y aplanar estructura si está anidada
        const safeClients = clients.map(c => {
            if (c.cliente) {
                // Estructura anidada - aplanar
                return { ...c.cliente, id: c._id.toString(), _id: c._id.toString() };
            }
            return { ...c, id: c._id.toString() };
        });
        res.json(safeClients);
    } catch (e) {
        res.json({ error: e.message });
    }
});

// ============ GASTOS ============
// Get gastos
app.get('/api/gastos', async (req, res) => {
    try {
        const database = await connectDB();
        const { userId } = req.query;
        let query = {};
        if (userId && userId !== 'admin') {
            query = { $or: [{ creadoPor: userId }, { userId: userId }] };
        }
        const gastos = await database.collection('gastos').find(query).toArray();
        const safeGastos = gastos.map(g => ({ ...g, id: g._id.toString() }));
        res.json(safeGastos);
    } catch (e) {
        res.json([]);
    }
});

// Create gasto
app.post('/api/gastos', async (req, res) => {
    try {
        const database = await connectDB();
        const result = await database.collection('gastos').insertOne(req.body);
        res.json({ success: true, id: result.insertedId });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Update gasto
app.put('/api/gastos/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        let result;
        try {
            result = await database.collection('gastos').updateOne(
                { _id: new ObjectId(searchId) },
                { $set: req.body }
            );
        } catch (e) {
            result = await database.collection('gastos').updateOne(
                { id: searchId },
                { $set: req.body }
            );
        }
        res.json({ success: result.matchedCount > 0 });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Delete gasto
app.delete('/api/gastos/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        let result;
        try {
            result = await database.collection('gastos').deleteOne(
                { _id: new ObjectId(searchId) }
            );
        } catch (e) {
            result = await database.collection('gastos').deleteOne(
                { id: searchId }
            );
        }
        res.json({ success: result.deletedCount > 0 });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ============ CLIENTES ELIMINADOS ============
// Get clientes eliminados
app.get('/api/clientes-eliminados', async (req, res) => {
    try {
        const database = await connectDB();
        const { userId } = req.query;
        let query = {};
        if (userId && userId !== 'admin') {
            query = { creadoPor: userId };
        }
        const eliminados = await database.collection('clientes_eliminados').find(query).sort({ fechaEliminacion: -1 }).toArray();
        const safeEliminados = eliminados.map(c => ({ ...c, id: c._id.toString() }));
        res.json(safeEliminados);
    } catch (e) {
        res.json([]);
    }
});

// Create cliente eliminado
app.post('/api/clientes-eliminados', async (req, res) => {
    try {
        const database = await connectDB();
        const result = await database.collection('clientes_eliminados').insertOne(req.body);
        res.json({ success: true, id: result.insertedId });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Delete cliente eliminado (al restablecer)
app.delete('/api/clientes-eliminados/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        let result = { deletedCount: 0 };
        
        // Primero intentar con ObjectId
        try {
            result = await database.collection('clientes_eliminados').deleteOne(
                { _id: new ObjectId(searchId) }
            );
        } catch (e) {
            // Si falla ObjectId, continuar con otras búsquedas
        }
        
        // Si no se eliminó, buscar por campo id
        if (result.deletedCount === 0) {
            result = await database.collection('clientes_eliminados').deleteOne(
                { id: searchId }
            );
        }
        
        // Si aún no se eliminó, buscar por id como número
        if (result.deletedCount === 0) {
            result = await database.collection('clientes_eliminados').deleteOne(
                { id: parseInt(searchId) }
            );
        }
        
        console.log('Delete clientes-eliminados result:', searchId, result.deletedCount);
        res.json({ success: result.deletedCount > 0 });
    } catch (e) {
        console.log('Delete clientes-eliminados error:', e.message);
        res.json({ success: false, error: e.message });
    }
});

// Create client
app.post('/api/clients', async (req, res) => {
    try {
        const database = await connectDB();
        const result = await database.collection('clients').insertOne(req.body);
        res.json({ success: true, id: result.insertedId });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Create cliente (alias en español)
app.post('/api/clientes', async (req, res) => {
    try {
        const database = await connectDB();
        const result = await database.collection('clients').insertOne(req.body);
        res.json({ success: true, id: result.insertedId });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Update client
app.put('/api/clients/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        const updateData = req.body;
        
        // Primero intentar con ObjectId (estructura nueva)
        let result;
        try {
            const objectId = new ObjectId(searchId);
            // Verificar si el documento tiene estructura anidada
            const doc = await database.collection('clients').findOne({ _id: objectId });
            if (doc && doc.cliente) {
                // Estructura anidada - actualizar dentro de cliente
                result = await database.collection('clients').updateOne(
                    { _id: objectId },
                    { $set: { cliente: updateData } }
                );
            } else {
                // Estructura plana
                result = await database.collection('clients').updateOne(
                    { _id: objectId },
                    { $set: updateData }
                );
            }
        } catch (e) {
            // Si no es ObjectId válido, buscar por campo id
            result = await database.collection('clients').updateOne(
                { $or: [{ id: searchId }, { 'cliente.id': searchId }] },
                { $set: { cliente: updateData } }
            );
        }
        
        res.json({ success: result && result.matchedCount > 0 });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Update cliente (alias en español)
app.put('/api/clientes/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        const updateData = req.body;
        
        // Primero intentar con ObjectId (estructura nueva)
        let result;
        try {
            const objectId = new ObjectId(searchId);
            // Verificar si el documento tiene estructura anidada
            const doc = await database.collection('clients').findOne({ _id: objectId });
            if (doc && doc.cliente) {
                // Estructura anidada - actualizar dentro de cliente
                result = await database.collection('clients').updateOne(
                    { _id: objectId },
                    { $set: { cliente: updateData } }
                );
            } else {
                // Estructura plana
                result = await database.collection('clients').updateOne(
                    { _id: objectId },
                    { $set: updateData }
                );
            }
        } catch (e) {
            // Si no es ObjectId válido, buscar por campo id
            result = await database.collection('clients').updateOne(
                { $or: [{ id: searchId }, { 'cliente.id': searchId }] },
                { $set: { cliente: updateData } }
            );
        }
        
        res.json({ success: result && result.matchedCount > 0 });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Delete client
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        
        let result = await database.collection('clients').deleteOne(
            { $or: [{ id: searchId }, { id: parseInt(searchId) }] }
        );
        
        if (result.deletedCount === 0) {
            try {
                result = await database.collection('clients').deleteOne(
                    { _id: new ObjectId(searchId) }
                );
            } catch (e) {}
        }
        
        res.json({ success: result.deletedCount > 0 });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Delete cliente (alias en español)
app.delete('/api/clientes/:id', async (req, res) => {
    try {
        const database = await connectDB();
        await database.collection('clients').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Get payments
app.get('/api/payments', async (req, res) => {
    try {
        const database = await connectDB();
        const payments = await database.collection('payments').find({}).toArray();
        res.json(payments);
    } catch (e) {
        res.json({ error: e.message });
    }
});

// Create payment
app.post('/api/payments', async (req, res) => {
    try {
        const database = await connectDB();
        const result = await database.collection('payments').insertOne(req.body);
        res.json({ success: true, id: result.insertedId });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Get expenses
app.get('/api/expenses', async (req, res) => {
    try {
        const database = await connectDB();
        const expenses = await database.collection('expenses').find({}).toArray();
        res.json(expenses);
    } catch (e) {
        res.json({ error: e.message });
    }
});

// Create expense
app.post('/api/expenses', async (req, res) => {
    try {
        const database = await connectDB();
        const result = await database.collection('expenses').insertOne(req.body);
        res.json({ success: true, id: result.insertedId });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// PIX Payment con Mercado Pago
app.post('/api/crear-pago-pix', async (req, res) => {
    try {
        const { userId, nombre, email } = req.body;
        
        if (!MP_ACCESS_TOKEN) {
            // Fallback manual si no hay token
            return res.json({ 
                success: true, 
                manual: true,
                pixKey: 'e6203cd0-c840-4753-ab74-993b722f49b1',
                pixName: 'FinanGestPay',
                amount: 79.50
            });
        }
        
        // Crear pago PIX con Mercado Pago
        const paymentData = {
            transaction_amount: 79.50,
            description: `FINANGEST-${email || userId}`,
            payment_method_id: 'pix',
            payer: {
                email: email || 'cliente@finangest.app',
                first_name: nombre || 'Cliente',
                identification: {
                    type: 'CPF',
                    number: '00000000000'
                }
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
            
            // Guardar el pago pendiente en la base de datos
            const database = await connectDB();
            await database.collection('pending_payments').updateOne(
                { oderId: mpData.id },
                { 
                    $set: {
                        oderId: mpData.id,
                        userId: userId,
                        email: email,
                        amount: 79.50,
                        status: 'pending',
                        createdAt: new Date(),
                        qrCode: txData.qr_code,
                        qrCodeBase64: txData.qr_code_base64
                    }
                },
                { upsert: true }
            );
            
            res.json({
                success: true,
                paymentId: mpData.id,
                qrCode: txData.qr_code,
                qrCodeBase64: txData.qr_code_base64,
                ticketUrl: txData.ticket_url
            });
        } else {
            console.log('MP Error:', mpData);
            // Fallback manual
            res.json({ 
                success: true, 
                manual: true,
                pixKey: 'e6203cd0-c840-4753-ab74-993b722f49b1',
                pixName: 'FinanGestPay',
                amount: 79.50,
                error: mpData.message || 'Error al generar PIX'
            });
        }
    } catch (e) {
        console.log('Error PIX:', e.message);
        res.json({ 
            success: true, 
            manual: true,
            pixKey: 'e6203cd0-c840-4753-ab74-993b722f49b1',
            pixName: 'FinanGestPay',
            amount: 79.50
        });
    }
});

// Verificar pago en Mercado Pago
app.post('/api/verificar-pago', async (req, res) => {
    try {
        const { userId, paymentId } = req.body;
        const database = await connectDB();
        
        if (paymentId && MP_ACCESS_TOKEN) {
            // Verificar en Mercado Pago
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
                }
            });
            
            const mpData = await mpResponse.json();
            
            if (mpData.status === 'approved') {
                // Pago aprobado - activar usuario con fecha de expiración (30 días)
                const subscriptionExpires = new Date();
                subscriptionExpires.setDate(subscriptionExpires.getDate() + 30);
                
                await database.collection('users').updateOne(
                    { _id: new ObjectId(userId) },
                    { $set: { 
                        paid: true, 
                        paidAt: new Date(), 
                        paymentId: paymentId,
                        subscriptionExpires: subscriptionExpires,
                        subscriptionType: 'monthly'
                    }}
                );
                
                // Eliminar pago pendiente
                await database.collection('pending_payments').deleteOne({ oderId: parseInt(paymentId) });
                
                return res.json({ success: true, paid: true, status: 'approved', subscriptionExpires: subscriptionExpires });
            } else {
                return res.json({ success: true, paid: false, status: mpData.status });
            }
        }
        
        // Fallback: activar manualmente (para pagos manuales) con fecha de expiración
        const subscriptionExpires = new Date();
        subscriptionExpires.setDate(subscriptionExpires.getDate() + 30);
        
        await database.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { 
                paid: true, 
                paidAt: new Date(),
                subscriptionExpires: subscriptionExpires,
                subscriptionType: 'monthly'
            }}
        );
        res.json({ success: true, paid: true, subscriptionExpires: subscriptionExpires });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Webhook de Mercado Pago para notificaciones de pago
app.post('/api/mp-webhook', async (req, res) => {
    try {
        const { type, data } = req.body;
        
        if (type === 'payment' && data?.id) {
            const paymentId = data.id;
            
            // Verificar el pago en MP
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
                }
            });
            
            const mpData = await mpResponse.json();
            
            if (mpData.status === 'approved') {
                const database = await connectDB();
                
                // Buscar el pago pendiente
                const pendingPayment = await database.collection('pending_payments').findOne({ oderId: paymentId });
                
                if (pendingPayment) {
                    // Activar el usuario con fecha de expiración (30 días)
                    const subscriptionExpires = new Date();
                    subscriptionExpires.setDate(subscriptionExpires.getDate() + 30);
                    
                    await database.collection('users').updateOne(
                        { _id: new ObjectId(pendingPayment.userId) },
                        { $set: { 
                            paid: true, 
                            paidAt: new Date(), 
                            paymentId: paymentId,
                            subscriptionExpires: subscriptionExpires,
                            subscriptionType: 'monthly'
                        }}
                    );
                    
                    // Eliminar pago pendiente
                    await database.collection('pending_payments').deleteOne({ oderId: paymentId });
                    
                    console.log('Usuario activado por webhook:', pendingPayment.email);
                }
            }
        }
        
        res.status(200).send('OK');
    } catch (e) {
        console.log('Webhook error:', e.message);
        res.status(200).send('OK');
    }
});

// Heartbeat - registrar actividad del usuario
app.post('/api/heartbeat', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.json({ success: false });
        const database = await connectDB();
        await database.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { lastSeen: new Date() } }
        );
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false });
    }
});

// Heartbeat - actualizar último visto
app.post('/api/heartbeat', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.json({ success: false });
        const database = await connectDB();
        await database.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { lastSeen: new Date() } }
        );
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Obtener usuarios con estado online/offline
app.get('/api/users-status', async (req, res) => {
    try {
        const database = await connectDB();
        const users = await database.collection('users').find({}).toArray();
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        let online = 0;
        let offline = 0;
        
        const usersWithStatus = users.map(u => {
            const isOnline = u.lastSeen && new Date(u.lastSeen) > fiveMinutesAgo;
            if (u.role !== 'admin') {
                if (isOnline) online++;
                else offline++;
            }
            return {
                ...u,
                password: undefined,
                isOnline
            };
        });
        
        res.json({ users: usersWithStatus, online, offline });
    } catch (e) {
        res.json({ error: e.message });
    }
});

// Admin backups - listar backups
app.get('/api/admin/backups', async (req, res) => {
    try {
        const database = await connectDB();
        const backups = await database.collection('backups').find({}).sort({ fecha: -1 }).limit(30).toArray();
        res.json(backups);
    } catch (e) {
        res.json([]);
    }
});

// Admin backups - crear backup automático cada hora
app.post('/api/admin/backup-auto', async (req, res) => {
    try {
        const database = await connectDB();
        
        // Verificar si ya hay backup en la última hora
        const hace1Hora = new Date(Date.now() - 60 * 60 * 1000);
        
        const backupReciente = await database.collection('backups').findOne({
            fecha: { $gte: hace1Hora }
        });
        
        if (backupReciente) {
            return res.json({ success: true, message: 'Ya existe backup reciente', skipped: true });
        }
        
        // Crear backup
        const users = await database.collection('users').find({}).toArray();
        const clients = await database.collection('clients').find({}).toArray();
        const gastos = await database.collection('gastos').find({}).toArray();
        
        const backup = {
            id: Date.now().toString(),
            fecha: new Date(),
            usuarios: users.length,
            clientes: clients.length,
            gastos: gastos.length,
            data: { users, clients, gastos },
            auto: true
        };
        
        await database.collection('backups').insertOne(backup);
        
        // Eliminar backups antiguos (mantener solo 168 = 7 días x 24 horas)
        const totalBackups = await database.collection('backups').countDocuments();
        if (totalBackups > 168) {
            const backupsAntiguos = await database.collection('backups')
                .find({})
                .sort({ fecha: 1 })
                .limit(totalBackups - 168)
                .toArray();
            
            for (const b of backupsAntiguos) {
                await database.collection('backups').deleteOne({ _id: b._id });
            }
        }
        
        res.json({ success: true, message: 'Backup automático creado' });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Admin backups - crear backup manual
app.post('/api/admin/backup', async (req, res) => {
    try {
        const database = await connectDB();
        const users = await database.collection('users').find({}).toArray();
        const clients = await database.collection('clients').find({}).toArray();
        const gastos = await database.collection('gastos').find({}).toArray();
        
        const backup = {
            id: Date.now().toString(),
            fecha: new Date(),
            usuarios: users.length,
            clientes: clients.length,
            gastos: gastos.length,
            data: { users, clients, gastos },
            manual: true
        };
        
        await database.collection('backups').insertOne(backup);
        
        // Eliminar backups antiguos (mantener solo 168 = 7 días x 24 horas)
        const totalBackups = await database.collection('backups').countDocuments();
        if (totalBackups > 168) {
            const backupsAntiguos = await database.collection('backups')
                .find({})
                .sort({ fecha: 1 })
                .limit(totalBackups - 30)
                .toArray();
            
            for (const b of backupsAntiguos) {
                await database.collection('backups').deleteOne({ _id: b._id });
            }
        }
        
        res.json({ success: true, archivo: `Backup creado: ${users.length} usuarios, ${clients.length} clientes, ${gastos.length} gastos` });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Admin - restaurar backup
app.post('/api/admin/restore/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        
        // Buscar por id o _id
        let backup = await database.collection('backups').findOne({ id: searchId });
        if (!backup) {
            try {
                backup = await database.collection('backups').findOne({ _id: new ObjectId(searchId) });
            } catch (e) {}
        }
        
        if (!backup || !backup.data) {
            return res.json({ success: false, error: 'Backup no encontrado' });
        }
        
        // Restaurar datos - reemplazar colecciones
        const { users, clients, gastos } = backup.data;
        
        if (users && users.length > 0) {
            await database.collection('users').deleteMany({});
            await database.collection('users').insertMany(users);
        }
        
        if (clients && clients.length > 0) {
            await database.collection('clients').deleteMany({});
            await database.collection('clients').insertMany(clients);
        }
        
        if (gastos && gastos.length > 0) {
            await database.collection('gastos').deleteMany({});
            await database.collection('gastos').insertMany(gastos);
        }
        
        res.json({ success: true, message: 'Backup restaurado correctamente' });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Admin - editar cliente
app.put('/api/admin/cliente/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        let result;
        try {
            result = await database.collection('clients').updateOne(
                { _id: new ObjectId(searchId) },
                { $set: req.body }
            );
        } catch (e) {
            result = await database.collection('clients').updateOne(
                { id: searchId },
                { $set: req.body }
            );
        }
        res.json({ success: result.matchedCount > 0 });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Admin - eliminar cliente
app.delete('/api/admin/cliente/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        let result;
        try {
            result = await database.collection('clients').deleteOne(
                { _id: new ObjectId(searchId) }
            );
        } catch (e) {
            result = await database.collection('clients').deleteOne(
                { id: searchId }
            );
        }
        res.json({ success: result.deletedCount > 0 });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Admin - editar gasto
app.put('/api/admin/gasto/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        let result;
        try {
            result = await database.collection('gastos').updateOne(
                { _id: new ObjectId(searchId) },
                { $set: req.body }
            );
        } catch (e) {
            result = await database.collection('gastos').updateOne(
                { id: searchId },
                { $set: req.body }
            );
        }
        res.json({ success: result.matchedCount > 0 });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Admin - eliminar gasto
app.delete('/api/admin/gasto/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        let result;
        try {
            result = await database.collection('gastos').deleteOne(
                { _id: new ObjectId(searchId) }
            );
        } catch (e) {
            result = await database.collection('gastos').deleteOne(
                { id: searchId }
            );
        }
        res.json({ success: result.deletedCount > 0 });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Admin - backups por trabajador
app.get('/api/admin/backups-trabajador/:userId', async (req, res) => {
    try {
        const database = await connectDB();
        const backups = await database.collection('backups_trabajador').find({ userId: req.params.userId }).sort({ fecha: -1 }).limit(168).toArray();
        res.json(backups);
    } catch (e) {
        res.json([]);
    }
});

// Backup automático de trabajador (cada hora al iniciar sesión)
app.post('/api/backup-trabajador-auto/:userId', async (req, res) => {
    try {
        const database = await connectDB();
        const userId = req.params.userId;
        
        // Verificar si ya hay backup en la última hora
        const hace1Hora = new Date(Date.now() - 60 * 60 * 1000);
        const backupReciente = await database.collection('backups_trabajador').findOne({
            userId: userId,
            fecha: { $gte: hace1Hora }
        });
        
        if (backupReciente) {
            return res.json({ success: true, message: 'Ya existe backup reciente', skipped: true });
        }
        
        // Obtener nombre del usuario
        let userName = 'Trabajador';
        try {
            const user = await database.collection('users').findOne({ _id: new ObjectId(userId) });
            if (user) userName = user.nombre || user.username || 'Trabajador';
        } catch (e) {
            const user = await database.collection('users').findOne({ id: userId });
            if (user) userName = user.nombre || user.username || 'Trabajador';
        }
        
        // Buscar clientes y gastos del trabajador
        const clients = await database.collection('clients').find({ 
            $or: [{ creadoPor: userId }, { creadoPor: userId.toString() }]
        }).toArray();
        const gastos = await database.collection('gastos').find({ 
            $or: [{ creadoPor: userId }, { creadoPor: userId.toString() }]
        }).toArray();
        
        const fechaStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        
        const backup = {
            id: Date.now().toString(),
            fecha: new Date(),
            nombre: `Backup ${userName} - ${fechaStr}`,
            userId: userId,
            clientes: clients.length,
            gastos: gastos.length,
            data: { clients, gastos },
            auto: true
        };
        
        await database.collection('backups_trabajador').insertOne(backup);
        
        // Eliminar backups antiguos (mantener solo 168 = 7 días x 24 horas)
        const totalBackups = await database.collection('backups_trabajador').countDocuments({ userId: userId });
        if (totalBackups > 168) {
            const backupsAntiguos = await database.collection('backups_trabajador')
                .find({ userId: userId })
                .sort({ fecha: 1 })
                .limit(totalBackups - 168)
                .toArray();
            
            for (const b of backupsAntiguos) {
                await database.collection('backups_trabajador').deleteOne({ _id: b._id });
            }
        }
        
        res.json({ success: true, message: 'Backup automático creado' });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Admin - crear backup de trabajador
app.post('/api/admin/backup-trabajador/:userId', async (req, res) => {
    try {
        const database = await connectDB();
        const userId = req.params.userId;
        
        // Obtener nombre del usuario
        let userName = 'Trabajador';
        try {
            const user = await database.collection('users').findOne({ _id: new ObjectId(userId) });
            if (user) userName = user.nombre || user.username || 'Trabajador';
        } catch (e) {
            const user = await database.collection('users').findOne({ id: userId });
            if (user) userName = user.nombre || user.username || 'Trabajador';
        }
        
        // Buscar clientes por múltiples campos
        const clients = await database.collection('clients').find({ 
            $or: [
                { creadoPor: userId },
                { creadoPor: userId.toString() },
                { userId: userId }
            ]
        }).toArray();
        const gastos = await database.collection('gastos').find({ 
            $or: [
                { creadoPor: userId },
                { creadoPor: userId.toString() },
                { userId: userId }
            ]
        }).toArray();
        
        const fechaStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        
        const backup = {
            id: Date.now().toString(),
            fecha: new Date(),
            nombre: `Backup ${userName} - ${fechaStr}`,
            userId: userId,
            clientes: clients.length,
            gastos: gastos.length,
            data: { clients, gastos }
        };
        
        await database.collection('backups_trabajador').insertOne(backup);
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Admin - restaurar backup de trabajador
app.post('/api/admin/restore-trabajador/:backupId', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.backupId;
        
        // Buscar backup
        let backup = await database.collection('backups_trabajador').findOne({ id: searchId });
        if (!backup) {
            try {
                backup = await database.collection('backups_trabajador').findOne({ _id: new ObjectId(searchId) });
            } catch (e) {}
        }
        
        if (!backup || !backup.data) {
            return res.json({ success: false, error: 'Backup no encontrado' });
        }
        
        const userId = backup.userId;
        const { clients, gastos } = backup.data;
        
        // Eliminar datos actuales del trabajador
        await database.collection('clients').deleteMany({ 
            $or: [{ creadoPor: userId }, { creadoPor: userId.toString() }] 
        });
        await database.collection('gastos').deleteMany({ 
            $or: [{ creadoPor: userId }, { creadoPor: userId.toString() }] 
        });
        
        // Restaurar datos del backup
        if (clients && clients.length > 0) {
            // Limpiar _id para evitar duplicados
            const cleanClients = clients.map(c => {
                const { _id, ...rest } = c;
                return rest;
            });
            await database.collection('clients').insertMany(cleanClients);
        }
        
        if (gastos && gastos.length > 0) {
            const cleanGastos = gastos.map(g => {
                const { _id, ...rest } = g;
                return rest;
            });
            await database.collection('gastos').insertMany(cleanGastos);
        }
        
        res.json({ success: true, message: 'Backup restaurado' });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Admin - eliminar backup de trabajador
app.delete('/api/admin/delete-backup-trabajador/:backupId', async (req, res) => {
    try {
        const database = await connectDB();
        await database.collection('backups_trabajador').deleteOne({ id: req.params.backupId });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Toggle block/unblock user
app.post('/api/users/:id/toggle-block', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        let user;
        
        // Buscar usuario
        try {
            user = await database.collection('users').findOne({ _id: new ObjectId(searchId) });
        } catch (e) {
            user = await database.collection('users').findOne({ id: searchId });
        }
        
        if (!user) {
            return res.json({ success: false, error: 'Usuario no encontrado' });
        }
        
        const newBlockedStatus = !user.blocked;
        
        try {
            await database.collection('users').updateOne(
                { _id: new ObjectId(searchId) },
                { $set: { blocked: newBlockedStatus } }
            );
        } catch (e) {
            await database.collection('users').updateOne(
                { id: searchId },
                { $set: { blocked: newBlockedStatus } }
            );
        }
        
        res.json({ 
            success: true, 
            message: newBlockedStatus ? 'Usuario bloqueado' : 'Usuario desbloqueado',
            blocked: newBlockedStatus
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Toggle edit key (llave de edición) for user
app.post('/api/users/:id/toggle-edit-key', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        let user;
        
        // Buscar usuario
        try {
            user = await database.collection('users').findOne({ _id: new ObjectId(searchId) });
        } catch (e) {
            user = await database.collection('users').findOne({ id: searchId });
        }
        
        if (!user) {
            return res.json({ success: false, error: 'Usuario no encontrado' });
        }
        
        const newEditKeyStatus = !user.editKeyEnabled;
        
        try {
            await database.collection('users').updateOne(
                { _id: new ObjectId(searchId) },
                { $set: { editKeyEnabled: newEditKeyStatus, editKeyChangedAt: new Date() } }
            );
        } catch (e) {
            await database.collection('users').updateOne(
                { id: searchId },
                { $set: { editKeyEnabled: newEditKeyStatus, editKeyChangedAt: new Date() } }
            );
        }
        
        res.json({ 
            success: true, 
            message: newEditKeyStatus ? 'Llave de edición ACTIVADA' : 'Llave de edición DESACTIVADA',
            editKeyEnabled: newEditKeyStatus
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Toggle block/unblock backups for user
app.post('/api/users/:id/toggle-backup-block', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        let user;
        
        // Buscar usuario
        try {
            user = await database.collection('users').findOne({ _id: new ObjectId(searchId) });
        } catch (e) {
            user = await database.collection('users').findOne({ id: searchId });
        }
        
        if (!user) {
            return res.json({ success: false, error: 'Usuario no encontrado' });
        }
        
        const newBackupBlockedStatus = !user.backupBlocked;
        
        try {
            await database.collection('users').updateOne(
                { _id: new ObjectId(searchId) },
                { $set: { backupBlocked: newBackupBlockedStatus } }
            );
        } catch (e) {
            await database.collection('users').updateOne(
                { id: searchId },
                { $set: { backupBlocked: newBackupBlockedStatus } }
            );
        }
        
        res.json({ 
            success: true, 
            message: newBackupBlockedStatus ? 'Backups bloqueados' : 'Backups desbloqueados',
            backupBlocked: newBackupBlockedStatus
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Servir archivos HTML
app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    if (fs.existsSync(htmlPath)) {
        res.setHeader('Content-Type', 'text/html');
        res.send(fs.readFileSync(htmlPath, 'utf8'));
    } else {
        res.status(404).send('index.html not found');
    }
});

app.get('/politicas.html', (req, res) => {
    const htmlPath = path.join(__dirname, '..', 'politicas.html');
    if (fs.existsSync(htmlPath)) {
        res.setHeader('Content-Type', 'text/html');
        res.send(fs.readFileSync(htmlPath, 'utf8'));
    } else {
        res.status(404).send('politicas.html not found');
    }
});

module.exports = app;
