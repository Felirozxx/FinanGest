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

// MongoDB Connection
let db;
const mongoUri = process.env.MONGODB_URI;

async function connectDB() {
    try {
        const client = new MongoClient(mongoUri);
        await client.connect();
        db = client.db('finangest');
        console.log('✅ Conectado a MongoDB Atlas');
    } catch (e) {
        console.error('❌ Error conectando a MongoDB:', e.message);
    }
}
connectDB();

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Códigos de verificación temporales
const verificationCodes = {};

// ============ AUTH ROUTES ============

// Enviar código de verificación
app.post('/api/send-code', async (req, res) => {
    const { email, nombre } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = { code, nombre, expires: Date.now() + 600000 };
    
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: '🔐 Código de Verificación - FinanGest',
            html: `<div style="font-family: Arial; padding: 20px; background: #1a1a2e; color: #fff;">
                <h2 style="color: #00d4ff;">FinanGest Software</h2>
                <p>Hola ${nombre},</p>
                <p>Tu código de verificación es:</p>
                <h1 style="color: #00ff88; font-size: 40px; letter-spacing: 10px;">${code}</h1>
                <p>Este código expira en 10 minutos.</p>
            </div>`
        });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: 'Error enviando email' });
    }
});

// Verificar código y crear usuario
app.post('/api/verify-code', async (req, res) => {
    const { email, code, password } = req.body;
    const stored = verificationCodes[email];
    
    if (!stored || stored.code !== code || Date.now() > stored.expires) {
        return res.json({ success: false, error: 'Código inválido o expirado' });
    }
    
    try {
        const existing = await db.collection('users').findOne({ email });
        if (existing) return res.json({ success: false, error: 'Email ya registrado' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.collection('users').insertOne({
            nombre: stored.nombre,
            email,
            password: hashedPassword,
            role: 'worker',
            activo: false,
            fechaRegistro: new Date()
        });
        
        delete verificationCodes[email];
        res.json({ success: true, userId: result.insertedId, nombre: stored.nombre, email });
    } catch (e) {
        res.json({ success: false, error: 'Error creando usuario' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.collection('users').findOne({ 
            $or: [{ email }, { username: email }] 
        });
        
        if (!user) return res.json({ success: false, error: 'Usuario no encontrado' });
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.json({ success: false, error: 'Contraseña incorrecta' });
        
        if (!user.activo && user.role !== 'admin') {
            return res.json({ success: false, error: 'Cuenta pendiente de activación', pendingActivation: true, userId: user._id, nombre: user.nombre, email: user.email });
        }
        
        res.json({ 
            success: true, 
            user: { id: user._id, nombre: user.nombre, email: user.email, role: user.role }
        });
    } catch (e) {
        res.json({ success: false, error: 'Error de servidor' });
    }
});

// Notificar pago al admin
app.post('/api/notify-payment', async (req, res) => {
    const { userId, userName, userEmail } = req.body;
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: '💰 Nuevo Pago Pendiente - FinanGest',
            html: `<div style="font-family: Arial; padding: 20px;">
                <h2>Nuevo usuario pendiente de activación</h2>
                <p><strong>Nombre:</strong> ${userName}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>ID:</strong> ${userId}</p>
                <p>El usuario indica que ya realizó el pago. Verifica y activa su cuenta.</p>
            </div>`
        });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false });
    }
});

// ============ USERS ROUTES ============

app.get('/api/users', async (req, res) => {
    try {
        const users = await db.collection('users').find({}).toArray();
        res.json(users.map(u => ({ ...u, id: u._id })));
    } catch (e) {
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
});

app.put('/api/users/:id/activate', async (req, res) => {
    try {
        await db.collection('users').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { activo: true } }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error activando usuario' });
    }
});

app.put('/api/users/:id/block', async (req, res) => {
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
        await db.collection('users').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { bloqueado: !user.bloqueado } }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error bloqueando usuario' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error eliminando usuario' });
    }
});

// ============ CLIENTES ROUTES ============

app.get('/api/clientes', async (req, res) => {
    const { userId } = req.query;
    try {
        const query = userId ? { creadoPor: userId } : {};
        const clientes = await db.collection('clientes').find(query).toArray();
        res.json(clientes.map(c => ({ ...c, id: c._id })));
    } catch (e) {
        res.status(500).json({ error: 'Error obteniendo clientes' });
    }
});

app.post('/api/clientes', async (req, res) => {
    try {
        const cliente = { ...req.body, fechaCreacion: new Date() };
        const result = await db.collection('clientes').insertOne(cliente);
        res.json({ success: true, id: result.insertedId, cliente: { ...cliente, id: result.insertedId } });
    } catch (e) {
        res.status(500).json({ error: 'Error creando cliente' });
    }
});

app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.id;
        
        await db.collection('clientes').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error actualizando cliente' });
    }
});

app.delete('/api/clientes/:id', async (req, res) => {
    try {
        await db.collection('clientes').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error eliminando cliente' });
    }
});

// ============ ADMIN CLIENTES ROUTES ============

app.put('/api/admin/cliente/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.id;
        
        // Crear backup antes de editar
        const cliente = await db.collection('clientes').findOne({ _id: new ObjectId(id) });
        if (cliente) {
            await db.collection('backups').insertOne({
                tipo: 'edit_cliente',
                clienteId: id,
                datosAnteriores: cliente,
                fecha: new Date()
            });
        }
        
        await db.collection('clientes').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error actualizando cliente' });
    }
});

app.delete('/api/admin/cliente/:id', async (req, res) => {
    try {
        const cliente = await db.collection('clientes').findOne({ _id: new ObjectId(req.params.id) });
        if (cliente) {
            await db.collection('backups').insertOne({
                tipo: 'delete_cliente',
                clienteId: req.params.id,
                datosEliminados: cliente,
                fecha: new Date()
            });
        }
        
        await db.collection('clientes').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error eliminando cliente' });
    }
});

// ============ GASTOS ROUTES ============

app.get('/api/gastos', async (req, res) => {
    const { userId } = req.query;
    try {
        const query = userId ? { creadoPor: userId } : {};
        const gastos = await db.collection('gastos').find(query).toArray();
        res.json(gastos.map(g => ({ ...g, id: g._id })));
    } catch (e) {
        res.status(500).json({ error: 'Error obteniendo gastos' });
    }
});

app.post('/api/gastos', async (req, res) => {
    try {
        const gasto = { ...req.body, fechaCreacion: new Date() };
        const result = await db.collection('gastos').insertOne(gasto);
        res.json({ success: true, id: result.insertedId });
    } catch (e) {
        res.status(500).json({ error: 'Error creando gasto' });
    }
});

app.delete('/api/gastos/:id', async (req, res) => {
    try {
        await db.collection('gastos').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error eliminando gasto' });
    }
});

app.put('/api/admin/gasto/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.id;
        
        await db.collection('gastos').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error actualizando gasto' });
    }
});

app.delete('/api/admin/gasto/:id', async (req, res) => {
    try {
        await db.collection('gastos').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error eliminando gasto' });
    }
});

// ============ BACKUPS ROUTES ============

app.get('/api/backups', async (req, res) => {
    try {
        const users = await db.collection('users').find({}).toArray();
        const clientes = await db.collection('clientes').find({}).toArray();
        const gastos = await db.collection('gastos').find({}).toArray();
        
        const backups = [{
            id: 'current',
            fecha: new Date().toISOString(),
            tipo: 'actual',
            usuarios: users.length,
            clientes: clientes.length,
            gastos: gastos.length
        }];
        
        res.json(backups);
    } catch (e) {
        res.status(500).json({ error: 'Error obteniendo backups' });
    }
});

app.get('/api/backup/download', async (req, res) => {
    try {
        const users = await db.collection('users').find({}).toArray();
        const clientes = await db.collection('clientes').find({}).toArray();
        const gastos = await db.collection('gastos').find({}).toArray();
        
        const backup = {
            fecha: new Date().toISOString(),
            users: users.map(u => ({ ...u, id: u._id })),
            clientes: clientes.map(c => ({ ...c, id: c._id })),
            gastos: gastos.map(g => ({ ...g, id: g._id }))
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`);
        res.json(backup);
    } catch (e) {
        res.status(500).json({ error: 'Error descargando backup' });
    }
});

app.post('/api/backup/restore', async (req, res) => {
    try {
        const { users, clientes, gastos } = req.body;
        
        if (clientes && clientes.length > 0) {
            await db.collection('clientes').deleteMany({});
            const clientesLimpios = clientes.map(c => {
                const { _id, id, ...resto } = c;
                return resto;
            });
            await db.collection('clientes').insertMany(clientesLimpios);
        }
        
        if (gastos && gastos.length > 0) {
            await db.collection('gastos').deleteMany({});
            const gastosLimpios = gastos.map(g => {
                const { _id, id, ...resto } = g;
                return resto;
            });
            await db.collection('gastos').insertMany(gastosLimpios);
        }
        
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error restaurando backup' });
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.redirect('/finangest.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 FinanGest Server corriendo en puerto ${PORT}`);
});

module.exports = app;
