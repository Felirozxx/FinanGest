const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let db;
const mongoUri = process.env.MONGODB_URI;

async function connectDB() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        db = client.db('finangest');
        console.log('Conectado a MongoDB Atlas');
    } catch (e) {
        console.error('Error conectando a MongoDB:', e.message);
    }
}
connectDB();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const verificationCodes = {};

app.post('/api/send-code', async (req, res) => {
    const { email, nombre } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = { code, nombre, expires: Date.now() + 600000 };
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER, to: email,
            subject: 'Código de Verificación - FinanGest',
            html: `<div style="font-family:Arial;padding:20px;background:#1a1a2e;color:#fff;"><h2 style="color:#00d4ff;">FinanGest</h2><p>Hola ${nombre},</p><p>Tu código:</p><h1 style="color:#00ff88;">${code}</h1><p>Expira en 10 minutos.</p></div>`
        });
        res.json({ success: true });
    } catch (e) { res.json({ success: false, error: 'Error enviando email' }); }
});

app.post('/api/verify-code', async (req, res) => {
    const { email, code, password } = req.body;
    const stored = verificationCodes[email];
    if (!stored || stored.code !== code || Date.now() > stored.expires) return res.json({ success: false, error: 'Código inválido o expirado' });
    try {
        const existing = await db.collection('users').findOne({ email });
        if (existing) return res.json({ success: false, error: 'Email ya registrado' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.collection('users').insertOne({ nombre: stored.nombre, email, password: hashedPassword, role: 'worker', activo: false, fechaRegistro: new Date() });
        delete verificationCodes[email];
        res.json({ success: true, userId: result.insertedId, nombre: stored.nombre, email });
    } catch (e) { res.json({ success: false, error: 'Error creando usuario' }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.collection('users').findOne({ $or: [{ email }, { username: email }] });
        if (!user) return res.json({ success: false, error: 'Usuario no encontrado' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.json({ success: false, error: 'Contraseña incorrecta' });
        if (!user.activo && user.role !== 'admin') return res.json({ success: false, error: 'Cuenta pendiente de activación', pendingActivation: true, userId: user._id, nombre: user.nombre, email: user.email });
        res.json({ success: true, user: { id: user._id, nombre: user.nombre, email: user.email, role: user.role } });
    } catch (e) { res.json({ success: false, error: 'Error de servidor' }); }
});

app.post('/api/notify-payment', async (req, res) => {
    const { userId, userName, userEmail } = req.body;
    try {
        await transporter.sendMail({ from: process.env.EMAIL_USER, to: process.env.EMAIL_USER, subject: 'Nuevo Pago - FinanGest', html: `<p>Usuario: ${userName} (${userEmail}) - ID: ${userId}</p>` });
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

app.get('/api/users', async (req, res) => { try { const users = await db.collection('users').find({}).toArray(); res.json(users.map(u => ({ ...u, id: u._id }))); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.put('/api/users/:id/activate', async (req, res) => { try { await db.collection('users').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { activo: true } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.put('/api/users/:id/block', async (req, res) => { try { const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) }); await db.collection('users').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { bloqueado: !user.bloqueado } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.delete('/api/users/:id', async (req, res) => { try { await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });

app.get('/api/clientes', async (req, res) => { const { userId } = req.query; try { const query = userId ? { creadoPor: userId } : {}; const clientes = await db.collection('clientes').find(query).toArray(); res.json(clientes.map(c => ({ ...c, id: c._id }))); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.post('/api/clientes', async (req, res) => { try { const cliente = { ...req.body, fechaCreacion: new Date() }; const result = await db.collection('clientes').insertOne(cliente); res.json({ success: true, id: result.insertedId, cliente: { ...cliente, id: result.insertedId } }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.put('/api/clientes/:id', async (req, res) => { try { const updateData = { ...req.body }; delete updateData._id; delete updateData.id; await db.collection('clientes').updateOne({ _id: new ObjectId(req.params.id) }, { $set: updateData }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.delete('/api/clientes/:id', async (req, res) => { try { await db.collection('clientes').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });

app.put('/api/admin/cliente/:id', async (req, res) => { try { const updateData = { ...req.body }; delete updateData._id; delete updateData.id; await db.collection('clientes').updateOne({ _id: new ObjectId(req.params.id) }, { $set: updateData }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.delete('/api/admin/cliente/:id', async (req, res) => { try { await db.collection('clientes').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });

app.get('/api/gastos', async (req, res) => { const { userId } = req.query; try { const query = userId ? { creadoPor: userId } : {}; const gastos = await db.collection('gastos').find(query).toArray(); res.json(gastos.map(g => ({ ...g, id: g._id }))); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.post('/api/gastos', async (req, res) => { try { const gasto = { ...req.body, fechaCreacion: new Date() }; const result = await db.collection('gastos').insertOne(gasto); res.json({ success: true, id: result.insertedId }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.delete('/api/gastos/:id', async (req, res) => { try { await db.collection('gastos').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.put('/api/admin/gasto/:id', async (req, res) => { try { const updateData = { ...req.body }; delete updateData._id; delete updateData.id; await db.collection('gastos').updateOne({ _id: new ObjectId(req.params.id) }, { $set: updateData }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.delete('/api/admin/gasto/:id', async (req, res) => { try { await db.collection('gastos').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });

app.get('/api/backups', async (req, res) => { try { const users = await db.collection('users').find({}).toArray(); const clientes = await db.collection('clientes').find({}).toArray(); const gastos = await db.collection('gastos').find({}).toArray(); res.json([{ id: 'current', fecha: new Date().toISOString(), tipo: 'actual', usuarios: users.length, clientes: clientes.length, gastos: gastos.length }]); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.get('/api/backup/download', async (req, res) => { try { const users = await db.collection('users').find({}).toArray(); const clientes = await db.collection('clientes').find({}).toArray(); const gastos = await db.collection('gastos').find({}).toArray(); res.setHeader('Content-Type', 'application/json'); res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`); res.json({ fecha: new Date().toISOString(), users, clientes, gastos }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.post('/api/backup/restore', async (req, res) => { try { const { clientes, gastos } = req.body; if (clientes?.length) { await db.collection('clientes').deleteMany({}); await db.collection('clientes').insertMany(clientes.map(c => { const { _id, id, ...r } = c; return r; })); } if (gastos?.length) { await db.collection('gastos').deleteMany({}); await db.collection('gastos').insertMany(gastos.map(g => { const { _id, id, ...r } = g; return r; })); } res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'finangest.html')));
app.get('/finangest.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'finangest.html')));
app.get('/politicas.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'politicas.html')));

module.exports = app;
