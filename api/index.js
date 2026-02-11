const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { generarCodigo, enviarCodigoVerificacion } = require('./_email-service');

// Almacén temporal de códigos (en producción usar Redis o MongoDB)
const codigosVerificacion = new Map(); // { email: { codigo, expira, tipo } }

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('finangest');
    cachedDb = db;
    return db;
}

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    
    try {
        // Test endpoint
        if (pathname === '/api' || pathname === '/api/') {
            return res.json({ 
                success: true, 
                message: 'FinanGest API funcionando',
                mongoUri: process.env.MONGODB_URI ? 'Configurada' : 'NO configurada'
            });
        }

        // ============ HEARTBEAT ============
        if (pathname === '/api/heartbeat') {
            return res.json({ 
                success: true, 
                timestamp: new Date().toISOString(),
                status: 'alive'
            });
        }

        // ============ SERVER TIME ============
        if (pathname === '/api/server-time') {
            const { timezone } = req.query;
            return res.json({ 
                success: true, 
                serverTime: new Date().toISOString(),
                timestamp: Date.now(),
                timezone: timezone || 'UTC'
            });
        }

        // ============ PUSH TOKEN ============
        if (pathname === '/api/push-token' && req.method === 'POST') {
            // Placeholder para notificaciones push
            return res.json({ 
                success: true, 
                message: 'Push token registrado (funcionalidad en desarrollo)'
            });
        }

        // ============ FORGOT PASSWORD ============
        if (pathname === '/api/forgot-password' && req.method === 'POST') {
            // Placeholder para recuperación de contraseña
            return res.json({ 
                success: true, 
                message: 'Código de recuperación enviado (funcionalidad en desarrollo)'
            });
        }

        // ============ RESET PASSWORD ============
        if (pathname === '/api/reset-password' && req.method === 'POST') {
            // Placeholder para reset de contraseña
            return res.json({ 
                success: true, 
                message: 'Contraseña restablecida (funcionalidad en desarrollo)'
            });
        }

        // ============ SEND CODE ============
        if (pathname === '/api/send-code' && req.method === 'POST') {
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({ success: false, error: 'Email requerido' });
            }
            
            // Generar código de 6 dígitos
            const codigo = generarCodigo();
            const expira = Date.now() + 10 * 60 * 1000; // 10 minutos
            
            // Guardar código temporalmente
            codigosVerificacion.set(email, { codigo, expira, tipo: 'registro' });
            
            // Enviar email
            const resultado = await enviarCodigoVerificacion(email, codigo, 'registro');
            
            if (resultado.success) {
                return res.json({ 
                    success: true, 
                    message: 'Código enviado a tu email'
                });
            } else {
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error enviando email: ' + resultado.error
                });
            }
        }

        // ============ SEND RECOVERY CODE ============
        if (pathname === '/api/send-recovery-code' && req.method === 'POST') {
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({ success: false, error: 'Email requerido' });
            }
            
            // Verificar que el usuario existe
            const db = await connectToDatabase();
            const user = await db.collection('users').findOne({ email });
            
            if (!user) {
                return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
            }
            
            // Generar código de 6 dígitos
            const codigo = generarCodigo();
            const expira = Date.now() + 10 * 60 * 1000; // 10 minutos
            
            // Guardar código temporalmente
            codigosVerificacion.set(email, { codigo, expira, tipo: 'recuperacion' });
            
            // Enviar email
            const resultado = await enviarCodigoVerificacion(email, codigo, 'recuperacion');
            
            if (resultado.success) {
                return res.json({ 
                    success: true, 
                    message: 'Código de recuperación enviado a tu email'
                });
            } else {
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error enviando email: ' + resultado.error
                });
            }
        }

        // ============ VERIFY CODE ============
        if (pathname === '/api/verify-code' && req.method === 'POST') {
            const { email, codigo } = req.body;
            
            if (!email || !codigo) {
                return res.status(400).json({ success: false, error: 'Email y código requeridos' });
            }
            
            // Verificar código
            const codigoGuardado = codigosVerificacion.get(email);
            
            if (!codigoGuardado) {
                return res.status(400).json({ success: false, error: 'Código no encontrado o expirado' });
            }
            
            // Verificar expiración
            if (Date.now() > codigoGuardado.expira) {
                codigosVerificacion.delete(email);
                return res.status(400).json({ success: false, error: 'Código expirado' });
            }
            
            // Verificar código
            if (codigoGuardado.codigo !== codigo) {
                return res.status(400).json({ success: false, error: 'Código incorrecto' });
            }
            
            // Código válido - eliminar
            codigosVerificacion.delete(email);
            
            return res.json({ 
                success: true, 
                message: 'Código verificado correctamente',
                tipo: codigoGuardado.tipo
            });
        }

        // ============ CREAR PAGO PIX ============
        if (pathname === '/api/crear-pago-pix' && req.method === 'POST') {
            // Placeholder para crear pago PIX
            return res.json({ 
                success: true, 
                pixKey: 'placeholder@pix.com',
                qrCode: 'data:image/png;base64,placeholder',
                amount: req.body.amount || 0,
                message: 'Pago PIX creado (funcionalidad en desarrollo)'
            });
        }

        // ============ VERIFICAR PAGO ============
        if (pathname === '/api/verificar-pago' && req.method === 'POST') {
            // Placeholder para verificar pago
            return res.json({ 
                success: true, 
                paid: false,
                message: 'Verificación de pago (funcionalidad en desarrollo)'
            });
        }

        const db = await connectToDatabase();

        // ============ CARTERAS ============
        if (pathname.startsWith('/api/carteras')) {
            const { userId, id } = req.query;

            // GET carteras
            if (req.method === 'GET' && userId) {
                const carteras = await db.collection('carteras').find({ 
                    creadoPor: userId,
                    eliminada: { $ne: true }
                }).toArray();
                
                return res.json({ 
                    success: true, 
                    carteras: carteras.map(c => ({ ...c, id: c._id }))
                });
            }

            // POST crear cartera
            if (req.method === 'POST') {
                const cartera = { 
                    ...req.body, 
                    fechaCreacion: new Date(),
                    eliminada: false,
                    activa: true
                };
                
                console.log('Creando cartera:', cartera);
                const result = await db.collection('carteras').insertOne(cartera);
                console.log('Cartera creada:', result.insertedId);
                
                return res.json({ 
                    success: true, 
                    id: result.insertedId, 
                    cartera: { ...cartera, id: result.insertedId } 
                });
            }

            // PUT actualizar cartera
            if (req.method === 'PUT' && id) {
                const updateData = { ...req.body };
                delete updateData._id;
                delete updateData.id;
                
                await db.collection('carteras').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );
                
                return res.json({ success: true });
            }

            // DELETE cartera
            if (req.method === 'DELETE' && id) {
                await db.collection('carteras').updateOne(
                    { _id: new ObjectId(id) },
                    { 
                        $set: { 
                            eliminada: true, 
                            fechaEliminacion: new Date() 
                        } 
                    }
                );
                
                return res.json({ success: true });
            }
        }

        // ============ LOGIN ============
        if (pathname === '/api/login' && req.method === 'POST') {
            const { email, password } = req.body;
            
            const user = await db.collection('users').findOne({ 
                $or: [
                    { email: email.toLowerCase() }, 
                    { username: email }
                ] 
            });
            
            if (!user) {
                return res.json({ success: false, error: 'Usuario no encontrado' });
            }
            
            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return res.json({ success: false, error: 'Contraseña incorrecta' });
            }
            
            if (!user.activo && user.role !== 'admin') {
                return res.json({ 
                    success: false, 
                    error: 'Cuenta pendiente de activación', 
                    pendingActivation: true 
                });
            }
            
            return res.json({ 
                success: true, 
                user: { 
                    id: user._id, 
                    nombre: user.nombre, 
                    email: user.email, 
                    role: user.role 
                }
            });
        }

        return res.status(404).json({ error: 'Endpoint not found' });

    } catch (error) {
        console.error('Error en API:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
