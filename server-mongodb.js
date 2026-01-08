require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============ CONEXIÓN MONGODB ============
const MONGODB_URI = process.env.MONGODB_URI;
let db;
let usersCollection;
let clientesCollection;
let gastosCollection;
let backupsCollection;

async function connectDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db('finangest');
        
        usersCollection = db.collection('users');
        clientesCollection = db.collection('clientes');
        gastosCollection = db.collection('gastos');
        backupsCollection = db.collection('backups');
        
        // Crear índices para mejor rendimiento
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        await usersCollection.createIndex({ username: 1 });
        await clientesCollection.createIndex({ creadoPor: 1 });
        await clientesCollection.createIndex({ fechaCreacion: -1 });
        await gastosCollection.createIndex({ creadoPor: 1 });
        await gastosCollection.createIndex({ fecha: -1 });
        await backupsCollection.createIndex({ odUserId: 1, fecha: -1 });
        
        console.log('✅ Conectado a MongoDB Atlas');
        return true;
    } catch (e) {
        console.error('❌ Error conectando a MongoDB:', e.message);
        return false;
    }
}

// ============ MIGRAR DATOS EXISTENTES ============
async function migrarDatosExistentes() {
    const fs = require('fs');
    const dataFile = 'finangest-data.json';
    
    if (!fs.existsSync(dataFile)) {
        console.log('📁 No hay datos para migrar');
        return;
    }
    
    try {
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        
        // Verificar si ya hay datos en MongoDB
        const usersCount = await usersCollection.countDocuments();
        if (usersCount > 0) {
            console.log('📁 Ya hay datos en MongoDB, no se migra');
            return;
        }
        
        // Migrar usuarios
        if (data.users && data.users.length > 0) {
            for (const user of data.users) {
                user._id = user.id;
                delete user.id;
                await usersCollection.insertOne(user);
            }
            console.log(`✅ Migrados ${data.users.length} usuarios`);
        }
        
        // Migrar clientes
        if (data.clientes && data.clientes.length > 0) {
            for (const cliente of data.clientes) {
                cliente._id = cliente.id;
                delete cliente.id;
                await clientesCollection.insertOne(cliente);
            }
            console.log(`✅ Migrados ${data.clientes.length} clientes`);
        }
        
        // Migrar gastos
        if (data.gastos && data.gastos.length > 0) {
            for (const gasto of data.gastos) {
                gasto._id = gasto.id;
                delete gasto.id;
                await gastosCollection.insertOne(gasto);
            }
            console.log(`✅ Migrados ${data.gastos.length} gastos`);
        }
        
        // Renombrar archivo original
        fs.renameSync(dataFile, dataFile + '.migrated');
        console.log('✅ Migración completada');
        
    } catch (e) {
        console.error('Error migrando datos:', e.message);
    }
}

// ============ EMAIL ============
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

let verificationCodes = {};

// ============ RUTAS DE AUTENTICACIÓN ============

// Enviar código de verificación
app.post('/api/send-code', async (req, res) => {
    const { email, nombre } = req.body;
    
    // Verificar si email ya existe
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
        return res.json({ success: false, error: 'Este email ya está registrado' });
    }
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = { code, nombre, expires: Date.now() + 600000 };
    
    try {
        await transporter.sendMail({
            from: `"FinanGest" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Código de Verificación - FinanGest',
            html: `
                <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #00d4ff;">¡Hola ${nombre}!</h2>
                    <p>Tu código de verificación es:</p>
                    <div style="background: #1a1a2e; color: #00d4ff; font-size: 32px; padding: 20px; text-align: center; border-radius: 10px; letter-spacing: 5px;">
                        ${code}
                    </div>
                    <p style="color: #666; margin-top: 20px;">Este código expira en 10 minutos.</p>
                </div>
            `
        });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: 'Error enviando email' });
    }
});

// Verificar código
app.post('/api/verify-code', async (req, res) => {
    const { email, code, password } = req.body;
    const stored = verificationCodes[email];
    
    if (!stored || stored.code !== code || Date.now() > stored.expires) {
        return res.json({ success: false, error: 'Código inválido o expirado' });
    }
    
    const newUser = {
        _id: Date.now().toString(),
        nombre: stored.nombre,
        email,
        password,
        fechaRegistro: new Date().toISOString(),
        activo: false,
        pagado: false,
        isAdmin: false
    };
    
    try {
        await usersCollection.insertOne(newUser);
        delete verificationCodes[email];
        res.json({ success: true, user: { id: newUser._id, nombre: newUser.nombre, email: newUser.email } });
    } catch (e) {
        res.json({ success: false, error: 'Error creando usuario' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Admin hardcodeado
    if ((email === 'Felirozxx' || email === 'admin') && password === 'Pipe16137356') {
        return res.json({
            success: true,
            user: { id: 'admin', nombre: 'Administrador', email: 'admin@finangest.com', isAdmin: true }
        });
    }
    
    const user = await usersCollection.findOne({
        $or: [{ email }, { username: email }]
    });
    
    if (!user) {
        return res.json({ success: false, error: 'Usuario no encontrado' });
    }
    
    if (user.password !== password) {
        return res.json({ success: false, error: 'Contraseña incorrecta' });
    }
    
    if (user.bloqueado) {
        return res.json({ success: false, error: 'Tu cuenta está bloqueada. Contacta al administrador.' });
    }
    
    if (!user.pagado) {
        return res.json({ 
            success: false, 
            needsPayment: true, 
            userId: user._id, 
            nombre: user.nombre, 
            email: user.email 
        });
    }
    
    res.json({
        success: true,
        user: { id: user._id, nombre: user.nombre, email: user.email, isAdmin: false }
    });
});

// ============ RUTAS DE USUARIOS ============
app.get('/api/users', async (req, res) => {
    const users = await usersCollection.find({ isAdmin: { $ne: true } }).toArray();
    res.json(users.map(u => ({ ...u, id: u._id })));
});

app.post('/api/users/:id/toggle-block', async (req, res) => {
    const { id } = req.params;
    const user = await usersCollection.findOne({ _id: id });
    if (!user) return res.json({ success: false, error: 'Usuario no encontrado' });
    
    await usersCollection.updateOne({ _id: id }, { $set: { bloqueado: !user.bloqueado } });
    res.json({ success: true, message: user.bloqueado ? 'Usuario desbloqueado' : 'Usuario bloqueado' });
});

app.post('/api/users/:id/activate', async (req, res) => {
    const { id } = req.params;
    await usersCollection.updateOne({ _id: id }, { $set: { pagado: true, activo: true } });
    res.json({ success: true });
});

// Eliminar usuario (rechazar)
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await usersCollection.deleteOne({ _id: id });
        // También eliminar sus clientes y gastos
        await clientesCollection.deleteMany({ creadoPor: id });
        await gastosCollection.deleteMany({ creadoPor: id });
        await backupsCollection.deleteMany({ odUserId: id });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: 'Error eliminando usuario' });
    }
});

// ============ RUTAS DE CLIENTES ============
app.post('/api/clientes', async (req, res) => {
    const { userId, cliente } = req.body;
    cliente._id = cliente.id || Date.now().toString();
    cliente.creadoPor = userId;
    cliente.fechaCreacion = new Date().toISOString();
    delete cliente.id;
    
    await clientesCollection.insertOne(cliente);
    
    // Crear backup automático del trabajador
    await crearBackupTrabajador(userId);
    
    res.json({ success: true, cliente: { ...cliente, id: cliente._id } });
});

app.get('/api/clientes', async (req, res) => {
    const { userId } = req.query;
    let clientes;
    
    if (userId === 'admin') {
        clientes = await clientesCollection.find({}).toArray();
    } else {
        clientes = await clientesCollection.find({ creadoPor: userId }).toArray();
    }
    
    res.json(clientes.map(c => ({ ...c, id: c._id })));
});

app.put('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id;
    delete updates.id;
    
    await clientesCollection.updateOne({ _id: id }, { $set: updates });
    const cliente = await clientesCollection.findOne({ _id: id });
    
    // Crear backup automático del trabajador
    if (cliente) await crearBackupTrabajador(cliente.creadoPor);
    
    res.json({ success: true, cliente: { ...cliente, id: cliente._id } });
});

app.delete('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const cliente = await clientesCollection.findOne({ _id: id });
    
    await clientesCollection.deleteOne({ _id: id });
    
    // Crear backup automático del trabajador
    if (cliente) await crearBackupTrabajador(cliente.creadoPor);
    
    res.json({ success: true });
});


// ============ RUTAS DE GASTOS ============
app.post('/api/gastos', async (req, res) => {
    const { userId, gasto } = req.body;
    gasto._id = gasto.id || Date.now().toString();
    gasto.creadoPor = userId;
    delete gasto.id;
    
    await gastosCollection.insertOne(gasto);
    res.json({ success: true, gasto: { ...gasto, id: gasto._id } });
});

app.get('/api/gastos', async (req, res) => {
    const { userId } = req.query;
    let gastos;
    
    if (userId === 'admin') {
        gastos = await gastosCollection.find({}).toArray();
    } else {
        gastos = await gastosCollection.find({ creadoPor: userId }).toArray();
    }
    
    res.json(gastos.map(g => ({ ...g, id: g._id })));
});

app.get('/api/gastos/:userId', async (req, res) => {
    const { userId } = req.params;
    const gastos = await gastosCollection.find({ creadoPor: userId }).toArray();
    res.json(gastos.map(g => ({ ...g, id: g._id })));
});

app.delete('/api/gastos/:id', async (req, res) => {
    const { id } = req.params;
    await gastosCollection.deleteOne({ _id: id });
    res.json({ success: true });
});

// ============ RUTAS ADMIN EDITAR/ELIMINAR ============

// Admin editar cliente de cualquier trabajador
app.put('/api/admin/cliente/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id;
    delete updates.id;
    
    try {
        await clientesCollection.updateOne({ _id: id }, { $set: updates });
        const cliente = await clientesCollection.findOne({ _id: id });
        
        // Crear backup automático del trabajador
        if (cliente) await crearBackupTrabajador(cliente.creadoPor);
        
        res.json({ success: true, cliente: { ...cliente, id: cliente._id } });
    } catch (e) {
        res.json({ success: false, error: 'Error actualizando cliente' });
    }
});

// Admin eliminar cliente de cualquier trabajador
app.delete('/api/admin/cliente/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const cliente = await clientesCollection.findOne({ _id: id });
        await clientesCollection.deleteOne({ _id: id });
        
        // Crear backup automático del trabajador
        if (cliente) await crearBackupTrabajador(cliente.creadoPor);
        
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: 'Error eliminando cliente' });
    }
});

// Admin editar gasto de cualquier trabajador
app.put('/api/admin/gasto/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id;
    delete updates.id;
    
    try {
        await gastosCollection.updateOne({ _id: id }, { $set: updates });
        const gasto = await gastosCollection.findOne({ _id: id });
        
        // Crear backup automático del trabajador
        if (gasto) await crearBackupTrabajador(gasto.creadoPor);
        
        res.json({ success: true, gasto: { ...gasto, id: gasto._id } });
    } catch (e) {
        res.json({ success: false, error: 'Error actualizando gasto' });
    }
});

// Admin eliminar gasto de cualquier trabajador
app.delete('/api/admin/gasto/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const gasto = await gastosCollection.findOne({ _id: id });
        await gastosCollection.deleteOne({ _id: id });
        
        // Crear backup automático del trabajador
        if (gasto) await crearBackupTrabajador(gasto.creadoPor);
        
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: 'Error eliminando gasto' });
    }
});

// ============ SISTEMA DE BACKUPS ============
async function crearBackupTrabajador(userId) {
    try {
        const clientes = await clientesCollection.find({ creadoPor: userId }).toArray();
        const gastos = await gastosCollection.find({ creadoPor: userId }).toArray();
        const user = await usersCollection.findOne({ _id: userId });
        
        const backup = {
            odUserId: userId,
            fecha: new Date(),
            usuario: user ? { nombre: user.nombre, email: user.email } : null,
            clientes: clientes.length,
            gastos: gastos.length,
            data: { clientes, gastos }
        };
        
        await backupsCollection.insertOne(backup);
        
        // Mantener solo últimos 48 backups por trabajador
        const count = await backupsCollection.countDocuments({ odUserId: userId });
        if (count > 48) {
            const oldBackups = await backupsCollection.find({ odUserId: userId })
                .sort({ fecha: 1 })
                .limit(count - 48)
                .toArray();
            
            for (const b of oldBackups) {
                await backupsCollection.deleteOne({ _id: b._id });
            }
        }
        
        return true;
    } catch (e) {
        console.error('Error creando backup:', e.message);
        return false;
    }
}

// Obtener backups de un trabajador
app.get('/api/admin/backups-trabajador/:userId', async (req, res) => {
    const { userId } = req.params;
    const backups = await backupsCollection.find({ odUserId: userId })
        .sort({ fecha: -1 })
        .toArray();
    
    res.json(backups.map(b => ({
        id: b._id.toString(),
        nombre: `backup-${b.fecha.toISOString().replace(/[:.]/g, '-').slice(0, 19)}`,
        fecha: b.fecha,
        clientes: b.clientes,
        gastos: b.gastos
    })));
});

// Crear backup manual de trabajador
app.post('/api/admin/backup-trabajador/:userId', async (req, res) => {
    const { userId } = req.params;
    const result = await crearBackupTrabajador(userId);
    if (result) {
        res.json({ success: true, archivo: 'Backup creado en MongoDB' });
    } else {
        res.json({ success: false, error: 'Error creando backup' });
    }
});

// Restaurar backup de trabajador
app.post('/api/admin/restore-trabajador/:backupId', async (req, res) => {
    const { backupId } = req.params;
    
    try {
        const backup = await backupsCollection.findOne({ _id: new ObjectId(backupId) });
        if (!backup) {
            return res.status(404).json({ error: 'Backup no encontrado' });
        }
        
        const userId = backup.odUserId;
        
        // Eliminar datos actuales del trabajador
        await clientesCollection.deleteMany({ creadoPor: userId });
        await gastosCollection.deleteMany({ creadoPor: userId });
        
        // Restaurar datos del backup
        if (backup.data.clientes && backup.data.clientes.length > 0) {
            await clientesCollection.insertMany(backup.data.clientes);
        }
        if (backup.data.gastos && backup.data.gastos.length > 0) {
            await gastosCollection.insertMany(backup.data.gastos);
        }
        
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error restaurando backup' });
    }
});

// Eliminar backup de trabajador
app.delete('/api/admin/delete-backup-trabajador/:backupId', async (req, res) => {
    const { backupId } = req.params;
    try {
        await backupsCollection.deleteOne({ _id: new ObjectId(backupId) });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error eliminando backup' });
    }
});

// Backups generales del sistema
app.get('/api/admin/backups', async (req, res) => {
    try {
        // Obtener los últimos 20 backups de todos los trabajadores
        const backups = await backupsCollection.find({})
            .sort({ fecha: -1 })
            .limit(20)
            .toArray();
        
        // Obtener nombres de usuarios
        const userIds = [...new Set(backups.map(b => b.odUserId))];
        const users = await usersCollection.find({ _id: { $in: userIds } }).toArray();
        const userMap = {};
        users.forEach(u => userMap[u._id] = u.nombre);
        
        const result = backups.map(b => ({
            id: b._id.toString(),
            nombre: `backup-${userMap[b.odUserId] || 'usuario'}-${b.fecha.toISOString().replace(/[:.]/g, '-').slice(0, 19)}`,
            fecha: b.fecha,
            tamaño: `${b.clientes} clientes, ${b.gastos} gastos`,
            usuario: userMap[b.odUserId] || 'Desconocido',
            odUserId: b.odUserId
        }));
        
        res.json(result);
    } catch (e) {
        console.error('Error obteniendo backups:', e);
        res.json([]);
    }
});

app.post('/api/admin/backup', async (req, res) => {
    // Crear backup de todos los trabajadores
    const users = await usersCollection.find({ isAdmin: { $ne: true } }).toArray();
    for (const user of users) {
        await crearBackupTrabajador(user._id);
    }
    res.json({ success: true, archivo: 'Backups creados para todos los trabajadores' });
});

// Restaurar backup general
app.post('/api/admin/restore/:backupId', async (req, res) => {
    const { backupId } = req.params;
    
    try {
        const backup = await backupsCollection.findOne({ _id: new ObjectId(backupId) });
        if (!backup) {
            return res.status(404).json({ error: 'Backup no encontrado' });
        }
        
        const userId = backup.odUserId;
        
        // Eliminar datos actuales del trabajador
        await clientesCollection.deleteMany({ creadoPor: userId });
        await gastosCollection.deleteMany({ creadoPor: userId });
        
        // Restaurar datos del backup
        if (backup.data.clientes && backup.data.clientes.length > 0) {
            await clientesCollection.insertMany(backup.data.clientes);
        }
        if (backup.data.gastos && backup.data.gastos.length > 0) {
            await gastosCollection.insertMany(backup.data.gastos);
        }
        
        res.json({ success: true });
    } catch (e) {
        console.error('Error restaurando backup:', e);
        res.status(500).json({ error: 'Error restaurando backup' });
    }
});


// ============ RUTAS DE PAGO PIX ============
app.post('/api/crear-pago-pix', async (req, res) => {
    const { userId, nombre, email } = req.body;
    
    // Intentar crear cobro con Asaas
    try {
        const asaasResponse = await fetch(`${process.env.ASAAS_URL}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': process.env.ASAAS_API_KEY
            },
            body: JSON.stringify({
                name: nombre,
                email: email,
                notificationDisabled: true
            })
        });
        
        const customer = await asaasResponse.json();
        
        if (customer.id) {
            // Crear cobrança PIX
            const paymentResponse = await fetch(`${process.env.ASAAS_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': process.env.ASAAS_API_KEY
                },
                body: JSON.stringify({
                    customer: customer.id,
                    billingType: 'PIX',
                    value: 99.00,
                    dueDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
                    description: 'FinanGest Software - Mensalidade'
                })
            });
            
            const payment = await paymentResponse.json();
            
            if (payment.id) {
                // Obtener QR Code
                const qrResponse = await fetch(`${process.env.ASAAS_URL}/payments/${payment.id}/pixQrCode`, {
                    headers: { 'access_token': process.env.ASAAS_API_KEY }
                });
                const qrData = await qrResponse.json();
                
                if (qrData.encodedImage) {
                    return res.json({
                        success: true,
                        paymentId: payment.id,
                        qrCode: qrData.encodedImage,
                        qrCodeText: qrData.payload
                    });
                }
            }
        }
    } catch (e) {
        console.log('Asaas no disponible, usando PIX manual');
    }
    
    // Fallback: PIX manual
    res.json({
        success: true,
        manual: true,
        pixKey: '86992035517',
        pixKeyType: 'phone'
    });
});

app.post('/api/verificar-pago', async (req, res) => {
    const { paymentId, userId } = req.body;
    
    // Obtener datos del usuario para la notificación
    const user = await usersCollection.findOne({ _id: userId });
    
    if (paymentId) {
        try {
            const response = await fetch(`${process.env.ASAAS_URL}/payments/${paymentId}`, {
                headers: { 'access_token': process.env.ASAAS_API_KEY }
            });
            const payment = await response.json();
            
            if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
                await usersCollection.updateOne({ _id: userId }, { $set: { pagado: true, activo: true } });
                return res.json({ success: true, paid: true });
            }
        } catch (e) {
            console.error('Error verificando pago:', e);
        }
    }
    
    // Enviar notificación al admin de que alguien hizo clic en "Ya pagué"
    if (user) {
        try {
            await transporter.sendMail({
                from: `"FinanGest" <${process.env.EMAIL_USER}>`,
                to: 'fzuluaga548@gmail.com',
                subject: '💰 Nuevo pago pendiente de verificar - FinanGest',
                html: `
                    <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #fff; border-radius: 10px;">
                        <h2 style="color: #00d4ff;">💰 Nuevo Pago Pendiente</h2>
                        <p>Un usuario ha indicado que realizó el pago:</p>
                        <div style="background: #12121a; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p><strong>👤 Nombre:</strong> ${user.nombre}</p>
                            <p><strong>📧 Email:</strong> ${user.email}</p>
                            <p><strong>📅 Fecha registro:</strong> ${new Date(user.fechaRegistro).toLocaleString('es-BR')}</p>
                        </div>
                        <p style="color: #ffd700;">⚠️ Verifica el comprobante de pago y activa al usuario desde el panel de administración.</p>
                        <p style="color: #8892b0; font-size: 0.9rem; margin-top: 20px;">Este email fue enviado automáticamente por FinanGest.</p>
                    </div>
                `
            });
            console.log('📧 Notificación de pago enviada al admin');
        } catch (e) {
            console.log('Error enviando notificación:', e.message);
        }
    }
    
    res.json({ success: true, paid: false });
});

app.post('/api/confirmar-pago-manual', async (req, res) => {
    const { userId } = req.body;
    await usersCollection.updateOne({ _id: userId }, { $set: { pagado: true, activo: true } });
    res.json({ success: true });
});

// ============ BACKUP AUTOMÁTICO CADA 30 MINUTOS ============
async function backupAutomatico() {
    console.log('🔄 Ejecutando backup automático...');
    const users = await usersCollection.find({ isAdmin: { $ne: true } }).toArray();
    for (const user of users) {
        await crearBackupTrabajador(user._id);
    }
    console.log(`✅ Backups creados para ${users.length} trabajadores`);
}

// ============ INICIAR SERVIDOR ============
const PORT = process.env.PORT || 3000;

async function startServer() {
    const connected = await connectDB();
    if (!connected) {
        console.error('No se pudo conectar a MongoDB. Saliendo...');
        process.exit(1);
    }
    
    // Migrar datos existentes
    await migrarDatosExistentes();
    
    // Backup automático cada 30 minutos
    setInterval(backupAutomatico, 30 * 60 * 1000);
    
    app.listen(PORT, () => {
        console.log(`
    ╔═══════════════════════════════════════╗
    ║     FinanGest Software v2.0           ║
    ║     🚀 MongoDB Atlas Edition          ║
    ║     Servidor corriendo en:            ║
    ║     http://localhost:${PORT}              ║
    ╚═══════════════════════════════════════╝
        `);
    });
}

startServer();
