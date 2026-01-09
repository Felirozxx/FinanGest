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
const resetCodes = {};

// Enviar código de verificación para registro
app.post('/api/send-code', async (req, res) => {
    await connectDB();
    const { email, nombre, username } = req.body;
    
    // Verificar si username ya existe
    const existingUser = await db.collection('users').findOne({ username: username.toLowerCase() });
    if (existingUser) return res.json({ success: false, error: 'Nombre de usuario ya existe' });
    
    // Verificar si email ya existe
    const existingEmail = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.json({ success: false, error: 'Email ya registrado' });
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    codes[email] = { code, nombre, username, expires: Date.now() + 600000 };
    try {
        await getTransporter().sendMail({ 
            from: process.env.EMAIL_USER, 
            to: email, 
            subject: 'Código de Verificación - FinanGest',
            html: `<div style="font-family:Arial;padding:20px;background:#1a1a2e;color:#fff;border-radius:10px;">
                <h2 style="color:#00d4ff;">FinanGest</h2>
                <p>Hola ${nombre},</p>
                <p>Tu código de verificación es:</p>
                <h1 style="color:#00ff88;font-size:40px;letter-spacing:5px;">${code}</h1>
                <p>Este código expira en 10 minutos.</p>
            </div>` 
        });
        res.json({ success: true });
    } catch (e) { res.json({ success: false, error: 'Error enviando email' }); }
});

// Verificar código y crear usuario
app.post('/api/verify-code', async (req, res) => {
    await connectDB();
    const { email, code, password } = req.body;
    const s = codes[email];
    if (!s || s.code !== code || Date.now() > s.expires) return res.json({ success: false, error: 'Código inválido o expirado' });
    
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({ 
        nombre: s.nombre, 
        username: s.username.toLowerCase(),
        email: email.toLowerCase(), 
        password: hashed, 
        role: 'worker', 
        activo: false, 
        fechaRegistro: new Date() 
    });
    delete codes[email];
    res.json({ success: true, userId: result.insertedId, nombre: s.nombre, email });
});

// Login - solo email y contraseña (excepto admin Felirozxx)
app.post('/api/login', async (req, res) => {
    await connectDB();
    const { email, password } = req.body;
    
    let user;
    // Permitir login con "Felirozxx" para el admin
    if (email.toLowerCase() === 'felirozxx') {
        user = await db.collection('users').findOne({ username: 'felirozxx' });
    } else {
        user = await db.collection('users').findOne({ email: email.toLowerCase() });
    }
    
    if (!user) return res.json({ success: false, error: 'Usuario no encontrado' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ success: false, error: 'Contraseña incorrecta' });
    if (!user.activo && user.role !== 'admin') return res.json({ success: false, error: 'Cuenta pendiente de activación', pendingActivation: true, userId: user._id, nombre: user.nombre, email: user.email });
    res.json({ success: true, user: { id: user._id, nombre: user.nombre, username: user.username, email: user.email, role: user.role } });
});

// Enviar código para recuperar contraseña
app.post('/api/forgot-password', async (req, res) => {
    await connectDB();
    const { email } = req.body;
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ success: false, error: 'Email no registrado' });
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodes[email] = { code, odId: user._id, expires: Date.now() + 600000 };
    
    try {
        await getTransporter().sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperar Contraseña - FinanGest',
            html: `<div style="font-family:Arial;padding:20px;background:#1a1a2e;color:#fff;border-radius:10px;">
                <h2 style="color:#00d4ff;">FinanGest</h2>
                <p>Hola ${user.nombre},</p>
                <p>Tu código para recuperar contraseña es:</p>
                <h1 style="color:#ff4757;font-size:40px;letter-spacing:5px;">${code}</h1>
                <p>Este código expira en 10 minutos.</p>
                <p style="color:#888;">Si no solicitaste esto, ignora este mensaje.</p>
            </div>`
        });
        res.json({ success: true });
    } catch (e) { res.json({ success: false, error: 'Error enviando email' }); }
});

// Verificar código y cambiar contraseña
app.post('/api/reset-password', async (req, res) => {
    await connectDB();
    const { email, code, newPassword } = req.body;
    const s = resetCodes[email];
    if (!s || s.code !== code || Date.now() > s.expires) return res.json({ success: false, error: 'Código inválido o expirado' });
    
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.collection('users').updateOne({ email: email.toLowerCase() }, { $set: { password: hashed } });
    delete resetCodes[email];
    res.json({ success: true });
});

app.post('/api/notify-payment', async (req, res) => {
    const { userId, userName, userEmail } = req.body;
    try { await getTransporter().sendMail({ from: process.env.EMAIL_USER, to: process.env.EMAIL_USER, subject: 'Nuevo Pago - FinanGest', html: `<p><b>${userName}</b> (${userEmail}) indica que pagó. ID: ${userId}</p>` }); res.json({ success: true }); } catch (e) { res.json({ success: false }); }
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

app.get('/api/make-admin/:name', async (req, res) => { await connectDB(); await db.collection('users').updateOne({ nombre: req.params.name }, { $set: { role: 'admin', activo: true } }); await db.collection('users').updateOne({ username: req.params.name.toLowerCase() }, { $set: { role: 'admin', activo: true } }); res.json({ success: true }); });

module.exports = app;
