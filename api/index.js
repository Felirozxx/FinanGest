const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { enviarCodigoVerificacion } = require('./_email-service');

// Generar código de 6 dígitos
function generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

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
            
            console.log('📧 Send code request for email:', email);
            
            if (!email) {
                return res.status(400).json({ success: false, error: 'Email requerido' });
            }
            
            try {
                // Generar código de 6 dígitos
                const codigo = generarCodigo();
                const expira = Date.now() + 10 * 60 * 1000; // 10 minutos
                
                console.log('🔢 Código generado:', codigo, 'tipo:', typeof codigo);
                console.log('⏰ Expira en:', new Date(expira).toLocaleString());
                
                // Guardar código en MongoDB
                const db = await connectToDatabase();
                
                // Primero eliminar cualquier código anterior
                await db.collection('verification_codes').deleteOne({ email });
                console.log('🧹 Código anterior eliminado (si existía)');
                
                // Insertar nuevo código
                const result = await db.collection('verification_codes').insertOne({
                    email,
                    codigo,
                    expira,
                    tipo: 'registro',
                    fecha: new Date()
                });
                
                console.log('💾 Código insertado con ID:', result.insertedId);
                
                // Verificar que se guardó correctamente
                const verificar = await db.collection('verification_codes').findOne({ email });
                console.log('✅ Verificación guardado:', JSON.stringify(verificar));
                
                if (!verificar || !verificar.codigo) {
                    throw new Error('El código no se guardó correctamente en MongoDB');
                }
                
                // Enviar email
                const resultado = await enviarCodigoVerificacion(email, codigo, 'registro');
                
                if (resultado.success) {
                    console.log('📨 Email enviado exitosamente');
                    return res.json({ 
                        success: true, 
                        message: 'Código enviado a tu email'
                    });
                } else {
                    console.error('❌ Error enviando email:', resultado.error);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Error enviando email: ' + resultado.error
                    });
                }
            } catch (error) {
                console.error('❌ Error en send-code:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error generando código: ' + error.message
                });
            }
        }

        // ============ SEND RECOVERY CODE ============
        if (pathname === '/api/send-recovery-code' && req.method === 'POST') {
            const { email } = req.body;
            
            console.log('🔑 Recovery code request for email:', email);
            
            if (!email) {
                return res.status(400).json({ success: false, error: 'Email requerido' });
            }
            
            try {
                // Verificar que el usuario existe
                const db = await connectToDatabase();
                const user = await db.collection('users').findOne({ email });
                
                if (!user) {
                    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
                }
                
                // Generar código de 6 dígitos
                const codigo = generarCodigo();
                const expira = Date.now() + 10 * 60 * 1000; // 10 minutos
                
                console.log('🔢 Código generado:', codigo, 'tipo:', typeof codigo);
                
                // Eliminar código anterior
                await db.collection('verification_codes').deleteOne({ email });
                
                // Insertar nuevo código
                const result = await db.collection('verification_codes').insertOne({
                    email,
                    codigo,
                    expira,
                    tipo: 'recuperacion',
                    fecha: new Date()
                });
                
                console.log('💾 Código insertado con ID:', result.insertedId);
                
                // Verificar guardado
                const verificar = await db.collection('verification_codes').findOne({ email });
                if (!verificar || !verificar.codigo) {
                    throw new Error('El código no se guardó correctamente en MongoDB');
                }
                
                // Enviar email
                const resultado = await enviarCodigoVerificacion(email, codigo, 'recuperacion');
                
                if (resultado.success) {
                    console.log('📨 Email de recuperación enviado');
                    return res.json({ 
                        success: true, 
                        message: 'Código de recuperación enviado a tu email'
                    });
                } else {
                    console.error('❌ Error enviando email:', resultado.error);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Error enviando email: ' + resultado.error
                    });
                }
            } catch (error) {
                console.error('❌ Error en send-recovery-code:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error generando código: ' + error.message
                });
            }
        }

        // ============ VERIFY CODE ============
        if (pathname === '/api/verify-code' && req.method === 'POST') {
            console.log('📥 Verify code request body:', JSON.stringify(req.body));
            
            const { email, codigo, code } = req.body;
            const codigoIngresado = codigo || code;
            
            console.log('📧 Email:', email);
            console.log('🔢 Código ingresado:', codigoIngresado);
            
            if (!email || !codigoIngresado) {
                console.log('❌ Faltan datos - email:', !!email, 'codigo:', !!codigoIngresado);
                return res.status(400).json({ success: false, error: 'Email y código requeridos' });
            }
            
            // Buscar código en MongoDB
            const db = await connectToDatabase();
            const codigoGuardado = await db.collection('verification_codes').findOne({ email });
            
            console.log('🔍 Código guardado en DB:', JSON.stringify(codigoGuardado));
            
            if (!codigoGuardado || !codigoGuardado.codigo) {
                console.log('❌ Código no encontrado en DB');
                return res.status(400).json({ success: false, error: 'Código no encontrado. Por favor solicita un nuevo código.' });
            }
            
            // Verificar expiración
            if (Date.now() > codigoGuardado.expira) {
                console.log('❌ Código expirado');
                await db.collection('verification_codes').deleteOne({ email });
                return res.status(400).json({ success: false, error: 'Código expirado. Por favor solicita un nuevo código.' });
            }
            
            // Verificar código
            if (codigoGuardado.codigo !== codigoIngresado) {
                console.log('❌ Código incorrecto - esperado:', codigoGuardado.codigo, 'recibido:', codigoIngresado);
                return res.status(400).json({ success: false, error: 'Código incorrecto' });
            }
            
            // Código válido - eliminar
            await db.collection('verification_codes').deleteOne({ email });
            console.log('✅ Código verificado correctamente');
            
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
