const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Credenciales desde variables de entorno (configurar en Vercel)
const MONGODB_URI = process.env.MONGODB_URI;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'finangest-admin-2026';

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
        
        // Verificar contraseña (soporta encriptada y sin encriptar)
        if (!verifyPassword(password, user.password)) {
            return res.json({ success: false, error: 'Contraseña incorrecta' });
        }
        
        if (!user.paid && user.role !== 'admin') {
            return res.json({ success: false, needsPayment: true, userId: user._id, nombre: user.nombre, email: user.email });
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
        // Mapear _id a id
        const safeClients = clients.map(c => ({ ...c, id: c._id.toString() }));
        res.json(safeClients);
    } catch (e) {
        res.json({ error: e.message });
    }
});

// Get clientes (alias en español)
app.get('/api/clientes', async (req, res) => {
    try {
        const database = await connectDB();
        const clients = await database.collection('clients').find({}).toArray();
        // Mapear _id a id
        const safeClients = clients.map(c => ({ ...c, id: c._id.toString() }));
        res.json(safeClients);
    } catch (e) {
        res.json({ error: e.message });
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
        
        // Buscar por múltiples campos posibles
        let result = await database.collection('clients').updateOne(
            { $or: [{ id: searchId }, { id: parseInt(searchId) }] },
            { $set: req.body }
        );
        
        if (result.matchedCount === 0) {
            try {
                result = await database.collection('clients').updateOne(
                    { _id: new ObjectId(searchId) },
                    { $set: req.body }
                );
            } catch (e) {}
        }
        
        res.json({ success: result.matchedCount > 0 });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Update cliente (alias en español)
app.put('/api/clientes/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const searchId = req.params.id;
        
        // Buscar por múltiples campos posibles
        let result = await database.collection('clients').updateOne(
            { $or: [{ id: searchId }, { id: parseInt(searchId) }] },
            { $set: req.body }
        );
        
        if (result.matchedCount === 0) {
            try {
                result = await database.collection('clients').updateOne(
                    { _id: new ObjectId(searchId) },
                    { $set: req.body }
                );
            } catch (e) {}
        }
        
        res.json({ success: result.matchedCount > 0 });
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

// PIX Payment (manual)
app.post('/api/crear-pago-pix', async (req, res) => {
    try {
        res.json({ 
            success: true, 
            manual: true,
            pixKey: '86992035517',
            pixName: 'FinanGestPay',
            amount: 99.00
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Verify payment
app.post('/api/verificar-pago', async (req, res) => {
    try {
        const { userId } = req.body;
        const database = await connectDB();
        await database.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { paid: true, paidAt: new Date() } }
        );
        res.json({ success: true, paid: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
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
        const backups = await database.collection('backups').find({}).sort({ fecha: -1 }).toArray();
        res.json(backups);
    } catch (e) {
        res.json([]);
    }
});

// Admin backups - crear backup
app.post('/api/admin/backup', async (req, res) => {
    try {
        const database = await connectDB();
        const users = await database.collection('users').find({}).toArray();
        const clients = await database.collection('clients').find({}).toArray();
        
        const backup = {
            id: Date.now().toString(),
            fecha: new Date(),
            usuarios: users.length,
            clientes: clients.length,
            data: { users, clients }
        };
        
        await database.collection('backups').insertOne(backup);
        res.json({ success: true, archivo: `Backup creado: ${users.length} usuarios, ${clients.length} clientes` });
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
