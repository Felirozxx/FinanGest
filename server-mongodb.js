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

let db;
async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        db = client.db('finangest');
        console.log('Conectado a MongoDB');
    } catch (e) { console.error('Error MongoDB:', e.message); }
}
connectDB();

const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
const verificationCodes = {};

app.post('/api/send-code', async (req, res) => {
    const { email, nombre } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = { code, nombre, expires: Date.now() + 600000 };
    try {
        await transporter.sendMail({ from: process.env.EMAIL_USER, to: email, subject: 'Código - FinanGest', html: `<div style="font-family:Arial;padding:20px;background:#1a1a2e;color:#fff;"><h2 style="color:#00d4ff;">FinanGest</h2><p>Hola ${nombre},</p><h1 style="color:#00ff88;">${code}</h1></div>` });
        res.json({ success: true });
    } catch (e) { res.json({ success: false, error: 'Error email' }); }
});

app.post('/api/verify-code', async (req, res) => {
    const { email, code, password } = req.body;
    const stored = verificationCodes[email];
    if (!stored || stored.code !== code || Date.now() > stored.expires) return res.json({ success: false, error: 'Código inválido' });
    try {
        const existing = await db.collection('users').findOne({ email });
        if (existing) return res.json({ success: false, error: 'Email ya registrado' });
        const hashed = await bcrypt.hash(password, 10);
        const result = await db.collection('users').insertOne({ nombre: stored.nombre, email, password: hashed, role: 'worker', activo: false, fechaRegistro: new Date() });
        delete verificationCodes[email];
        res.json({ success: true, userId: result.insertedId, nombre: stored.nombre, email });
    } catch (e) { res.json({ success: false, error: 'Error' }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.collection('users').findOne({ $or: [{ email }, { username: email }] });
        if (!user) return res.json({ success: false, error: 'Usuario no encontrado' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.json({ success: false, error: 'Contraseña incorrecta' });
        if (!user.activo && user.role !== 'admin') return res.json({ success: false, error: 'Cuenta pendiente', pendingActivation: true, userId: user._id, nombre: user.nombre, email: user.email });
        res.json({ success: true, user: { id: user._id, nombre: user.nombre, email: user.email, role: user.role } });
    } catch (e) { res.json({ success: false, error: 'Error' }); }
});

app.post('/api/notify-payment', async (req, res) => {
    const { userId, userName, userEmail } = req.body;
    try { await transporter.sendMail({ from: process.env.EMAIL_USER, to: process.env.EMAIL_USER, subject: 'Pago FinanGest', html: `<p>${userName} (${userEmail}) ID:${userId}</p>` }); res.json({ success: true }); } catch (e) { res.json({ success: false }); }
});

app.get('/api/users', async (req, res) => { try { const users = await db.collection('users').find({}).toArray(); res.json(users.map(u => ({ ...u, id: u._id }))); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.put('/api/users/:id/activate', async (req, res) => { try { await db.collection('users').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { activo: true } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.put('/api/users/:id/block', async (req, res) => { try { const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) }); await db.collection('users').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { bloqueado: !user.bloqueado } }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.delete('/api/users/:id', async (req, res) => { try { await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });

app.get('/api/clientes', async (req, res) => { const { userId } = req.query; try { const q = userId ? { creadoPor: userId } : {}; const clientes = await db.collection('clientes').find(q).toArray(); res.json(clientes.map(c => ({ ...c, id: c._id }))); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.post('/api/clientes', async (req, res) => { try { const cliente = { ...req.body, fechaCreacion: new Date() }; const result = await db.collection('clientes').insertOne(cliente); res.json({ success: true, id: result.insertedId, cliente: { ...cliente, id: result.insertedId } }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.put('/api/clientes/:id', async (req, res) => { try { const d = { ...req.body }; delete d._id; delete d.id; await db.collection('clientes').updateOne({ _id: new ObjectId(req.params.id) }, { $set: d }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.delete('/api/clientes/:id', async (req, res) => { try { await db.collection('clientes').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.put('/api/admin/cliente/:id', async (req, res) => { try { const d = { ...req.body }; delete d._id; delete d.id; await db.collection('clientes').updateOne({ _id: new ObjectId(req.params.id) }, { $set: d }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.delete('/api/admin/cliente/:id', async (req, res) => { try { await db.collection('clientes').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });

app.get('/api/gastos', async (req, res) => { const { userId } = req.query; try { const q = userId ? { creadoPor: userId } : {}; const gastos = await db.collection('gastos').find(q).toArray(); res.json(gastos.map(g => ({ ...g, id: g._id }))); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.post('/api/gastos', async (req, res) => { try { const gasto = { ...req.body, fechaCreacion: new Date() }; const result = await db.collection('gastos').insertOne(gasto); res.json({ success: true, id: result.insertedId }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.delete('/api/gastos/:id', async (req, res) => { try { await db.collection('gastos').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.put('/api/admin/gasto/:id', async (req, res) => { try { const d = { ...req.body }; delete d._id; delete d.id; await db.collection('gastos').updateOne({ _id: new ObjectId(req.params.id) }, { $set: d }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.delete('/api/admin/gasto/:id', async (req, res) => { try { await db.collection('gastos').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });

app.get('/api/backups', async (req, res) => { try { const u = await db.collection('users').find({}).toArray(); const c = await db.collection('clientes').find({}).toArray(); const g = await db.collection('gastos').find({}).toArray(); res.json([{ id: 'current', fecha: new Date().toISOString(), usuarios: u.length, clientes: c.length, gastos: g.length }]); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.get('/api/backup/download', async (req, res) => { try { const users = await db.collection('users').find({}).toArray(); const clientes = await db.collection('clientes').find({}).toArray(); const gastos = await db.collection('gastos').find({}).toArray(); res.json({ fecha: new Date().toISOString(), users, clientes, gastos }); } catch (e) { res.status(500).json({ error: 'Error' }); } });
app.post('/api/backup/restore', async (req, res) => { try { const { clientes, gastos } = req.body; if (clientes?.length) { await db.collection('clientes').deleteMany({}); await db.collection('clientes').insertMany(clientes.map(c => { const { _id, id, ...r } = c; return r; })); } if (gastos?.length) { await db.collection('gastos').deleteMany({}); await db.collection('gastos').insertMany(gastos.map(g => { const { _id, id, ...r } = g; return r; })); } res.json({ success: true }); } catch (e) { res.status(500).json({ error: 'Error' }); } });

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'finangest.html')));
app.get('/finangest.html', (req, res) => res.sendFile(path.join(__dirname, 'finangest.html')));
app.get('/politicas.html', (req, res) => res.sendFile(path.join(__dirname, 'politicas.html')));

module.exports = app;
