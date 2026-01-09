const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://felirozxx:Pipe16137356@cluster0.luvtqa7.mongodb.net/finangest?retryWrites=true&w=majority';
const EMAIL_USER = process.env.EMAIL_USER || 'fzuluaga548@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

let db;
let verificationCodes = {};
let resetCodes = {};

async function connectDB() {
    if (db) return db;
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('finangest');
    return db;
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
        
        // Buscar por email O por username si es Felirozxx (admin)
        let user = await users.findOne({ email: email });
        if (!user && email === 'Felirozxx') {
            user = await users.findOne({ username: 'Felirozxx' });
        }
        if (!user && email === 'Felirozxx') {
            user = await users.findOne({ nombre: 'Felirozxx' });
        }
        
        if (!user) return res.json({ success: false, error: 'Usuario no encontrado' });
        if (user.password !== password) return res.json({ success: false, error: 'Contraseña incorrecta' });
        if (!user.paid && user.role !== 'admin') {
            return res.json({ success: false, needsPayment: true, userId: user._id, nombre: user.nombre, email: user.email });
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
        
        // Verificar email único
        const existingEmail = await users.findOne({ email });
        if (existingEmail) return res.json({ success: false, error: 'Este email ya está registrado' });
        
        // Verificar username único
        if (username) {
            const existingUsername = await users.findOne({ username });
            if (existingUsername) return res.json({ success: false, error: 'Este nombre de usuario ya existe' });
        }
        
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodes[email] = { code, nombre, username, expires: Date.now() + 600000 };
        
        if (EMAIL_PASS) {
            await transporter.sendMail({
                from: EMAIL_USER,
                to: email,
                subject: 'Código de Verificación - FinanGest',
                html: `<h2>Bienvenido a FinanGest</h2><p>Tu código de verificación es: <strong style="font-size:24px">${code}</strong></p><p>Este código expira en 10 minutos.</p>`
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
        const stored = verificationCodes[email];
        
        if (!stored || stored.expires < Date.now()) {
            return res.json({ success: false, error: 'Código expirado' });
        }
        if (stored.code !== code) {
            return res.json({ success: false, error: 'Código incorrecto' });
        }
        
        const database = await connectDB();
        const users = database.collection('users');
        
        const result = await users.insertOne({
            nombre: stored.nombre,
            username: username || stored.username,
            email,
            password,
            role: 'client',
            paid: false,
            createdAt: new Date()
        });
        
        delete verificationCodes[email];
        
        res.json({ success: true, user: { id: result.insertedId, nombre: stored.nombre, email } });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Forgot password - enviar código
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const database = await connectDB();
        const users = database.collection('users');
        
        const user = await users.findOne({ email });
        if (!user) return res.json({ success: false, error: 'Email no encontrado' });
        
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        resetCodes[email] = { code, expires: Date.now() + 600000 };
        
        if (EMAIL_PASS) {
            await transporter.sendMail({
                from: EMAIL_USER,
                to: email,
                subject: 'Recuperar Contraseña - FinanGest',
                html: `<h2>Recuperar Contraseña</h2><p>Tu código para cambiar la contraseña es: <strong style="font-size:24px">${code}</strong></p><p>Este código expira en 10 minutos.</p><p>Si no solicitaste este cambio, ignora este mensaje.</p>`
            });
        }
        
        res.json({ success: true, message: 'Código enviado', devCode: !EMAIL_PASS ? code : undefined });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Reset password - cambiar contraseña
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const stored = resetCodes[email];
        
        if (!stored || stored.expires < Date.now()) {
            return res.json({ success: false, error: 'Código expirado' });
        }
        if (stored.code !== code) {
            return res.json({ success: false, error: 'Código incorrecto' });
        }
        
        const database = await connectDB();
        const users = database.collection('users');
        
        await users.updateOne({ email }, { $set: { password: newPassword } });
        delete resetCodes[email];
        
        res.json({ success: true, message: 'Contraseña actualizada' });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Make admin
app.get('/api/make-admin/:name', async (req, res) => {
    try {
        const database = await connectDB();
        const users = database.collection('users');
        const result = await users.updateOne(
            { $or: [{ nombre: req.params.name }, { username: req.params.name }] },
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
        res.json(users);
    } catch (e) {
        res.json({ error: e.message });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    try {
        const database = await connectDB();
        const result = await database.collection('users').insertOne(req.body);
        res.json({ success: true, id: result.insertedId });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
    try {
        const database = await connectDB();
        await database.collection('users').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const database = await connectDB();
        await database.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Get clients
app.get('/api/clients', async (req, res) => {
    try {
        const database = await connectDB();
        const clients = await database.collection('clients').find({}).toArray();
        res.json(clients);
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

// Update client
app.put('/api/clients/:id', async (req, res) => {
    try {
        const database = await connectDB();
        await database.collection('clients').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Delete client
app.delete('/api/clients/:id', async (req, res) => {
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

// PIX Payment (manual fallback)
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

module.exports = app;
