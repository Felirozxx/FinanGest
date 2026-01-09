const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

let db, isConnected = false;

async function connectDB() {
    if (isConnected) return;
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('finangest');
    isConnected = true;
}

const getTransporter = () => nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
const codes = {};

app.post('/api/send-code', async (req, res) => {
    const { email, nombre } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    codes[email] = { code, nombre, expires: Date.now() + 600000 };
    try {
        await getTransporter().sendMail({ from: process.env.EMAIL_USER, to: email, subject: 'Código - FinanGest', html: `<h1>${code}</h1>` });
        res.json({ success: true });
    } catch (e) { res.json({ success: false }); }
});

app.post('/api/verify-code', async (req, res) => {
    await connectDB();
    const { email, code, password } = req.body;
    const s = codes[email];
    if (!s || s.code !== code) return res.json({ success: false, error: 'Código inválido' });
    const existing = await db.collection('users').findOne({ email });
    if (existing) return res.json({ success: false, error: 'Email ya registrado' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({ nombre: s.nombre, email, password: hashed, role: 'worker', activo: false, fechaRegistro: new Date() });
    delete codes[email];
    res.json({ success: true, userId: result.insertedId, nombre: s.nombre, email });
});

app.post('/api/login', async (req, res) => {
    await connectDB();
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ $or: [{ email }, { username: email }, { nombre: email }] });
    if (!user) return res.json({ success: false, error: 'Usuario no encontrado' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ success: false, error: 'Contraseña incorrecta' });
    if (!user.activo && user.role !== 'admin') return res.json({ success: false, error: 'Cuenta pendiente', pendingActivation: true, userId: user._id, nombre: user.nombre, email: user.email });
    res.json({ success: true, user: { id: user._id, nombre: user.nombre, email: user.email, role: user.role } });
});

app.post('/api/notify-payment', async (req, res) => {
    const { userId, userName, userEmail } = req.body;
    try { await getTransporter().sendMail({ from: process.env.EMAIL_USER, to: process.env.EMAIL_USER, subject: 'Pago', html: `<p>${userName}</p>` }); res.json({ success: true }); } catch (e) { res.json({ success: false }); }
});

app.get('/api/users', async (req, res) => { await connectDB(); const users = await db.collection('users').find({}).toArray(); res.json(users.map(u => ({ ...u, id: u._id }))); });
app.put('/api/users/:id/activate', async (req, res) => { await connectDB(); await db.collection('users').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { activo: true } }); res.json({ success: true }); });
app.put('/api/users/:id/block', async (req, res) => { await connectDB(); const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) }); await db.collection('users').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { bloqueado: !user.bloqueado } }); res.json({ success: true }); });
app.delete('/api/users/:id', async (req, res) => { await connectDB(); await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); });

app.get('/api/clientes', async (req, res) => { await connectDB(); const q = req.query.userId ? { creadoPor: req.query.userId } : {}; const clientes = await db.collection('clientes').find(q).toArray(); res.json(clientes.map(c => ({ ...c, id: c._id }))); });
app.post('/api/clientes', async (req, res) => { await connectDB(); const cliente = { ...req.body, fechaCreacion: new Date() }; const result = await db.collection('clientes').insertOne(cliente); res.json({ success: true, id: result.insertedId, cliente: { ...cliente, id: result.insertedId } }); });
app.put('/api/clientes/:id', async (req, res) => { await connectDB(); const d = { ...req.body }; delete d._id; delete d.id; await db.collection('clientes').updateOne({ _id: new ObjectId(req.params.id) }, { $set: d }); res.json({ success: true }); });
app.delete('/api/clientes/:id', async (req, res) => { await connectDB(); await db.collection('clientes').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); });
app.put('/api/admin/cliente/:id', async (req, res) => { await connectDB(); const d = { ...req.body }; delete d._id; delete d.id; await db.collection('clientes').updateOne({ _id: new ObjectId(req.params.id) }, { $set: d }); res.json({ success: true }); });
app.delete('/api/admin/cliente/:id', async (req, res) => { await connectDB(); await db.collection('clientes').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); });

app.get('/api/gastos', async (req, res) => { await connectDB(); const q = req.query.userId ? { creadoPor: req.query.userId } : {}; const gastos = await db.collection('gastos').find(q).toArray(); res.json(gastos.map(g => ({ ...g, id: g._id }))); });
app.post('/api/gastos', async (req, res) => { await connectDB(); const gasto = { ...req.body, fechaCreacion: new Date() }; const result = await db.collection('gastos').insertOne(gasto); res.json({ success: true, id: result.insertedId }); });
app.delete('/api/gastos/:id', async (req, res) => { await connectDB(); await db.collection('gastos').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); });
app.put('/api/admin/gasto/:id', async (req, res) => { await connectDB(); const d = { ...req.body }; delete d._id; delete d.id; await db.collection('gastos').updateOne({ _id: new ObjectId(req.params.id) }, { $set: d }); res.json({ success: true }); });
app.delete('/api/admin/gasto/:id', async (req, res) => { await connectDB(); await db.collection('gastos').deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ success: true }); });

app.get('/api/backups', async (req, res) => { await connectDB(); const u = await db.collection('users').find({}).toArray(); const c = await db.collection('clientes').find({}).toArray(); const g = await db.collection('gastos').find({}).toArray(); res.json([{ id: 'current', fecha: new Date().toISOString(), usuarios: u.length, clientes: c.length, gastos: g.length }]); });
app.get('/api/backup/download', async (req, res) => { await connectDB(); const users = await db.collection('users').find({}).toArray(); const clientes = await db.collection('clientes').find({}).toArray(); const gastos = await db.collection('gastos').find({}).toArray(); res.json({ fecha: new Date().toISOString(), users, clientes, gastos }); });
app.post('/api/backup/restore', async (req, res) => { await connectDB(); const { clientes, gastos } = req.body; if (clientes?.length) { await db.collection('clientes').deleteMany({}); await db.collection('clientes').insertMany(clientes.map(c => { const { _id, id, ...r } = c; return r; })); } if (gastos?.length) { await db.collection('gastos').deleteMany({}); await db.collection('gastos').insertMany(gastos.map(g => { const { _id, id, ...r } = g; return r; })); } res.json({ success: true }); });

app.get('/api/make-admin/:name', async (req, res) => { await connectDB(); await db.collection('users').updateOne({ nombre: req.params.name }, { $set: { role: 'admin', activo: true } }); res.json({ success: true }); });

module.exports = app;
