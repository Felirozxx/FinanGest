const { connectToDatabase } = require('./_db');
const { ObjectId } = require('mongodb');

// Endpoint consolidado para todas las operaciones de carteras
module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { db } = await connectToDatabase();
        const { action, userId, id } = req.query;
        
        // Parsear el body si es string
        let body = req.body || {};
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        // GET - Obtener carteras por usuario (path parameter: /api/carteras/:userId)
        if (req.method === 'GET' && !action && !id && req.url) {
            // Extraer userId del path: /api/carteras/USER_ID
            const match = req.url.match(/\/api\/carteras\/([^?]+)/);
            if (match && match[1]) {
                const userIdFromPath = match[1];
                console.log('🔵 Buscando carteras para userId:', userIdFromPath);
                
                const carteras = await db.collection('carteras')
                    .find({ creadoPor: userIdFromPath, eliminada: false })
                    .toArray();
                
                console.log('📊 Carteras encontradas:', carteras.length);
                
                const carterasConId = carteras.map(c => ({
                    ...c,
                    id: c._id.toString(),
                    _id: c._id
                }));
                
                return res.json({ success: true, carteras: carterasConId });
            }
        }

        // GET - Obtener carteras por usuario (query parameter)
        if (req.method === 'GET' && action === 'por-usuario' && userId) {
            const carteras = await db.collection('carteras')
                .find({ creadoPor: userId, eliminada: false })
                .toArray();
            
            // Convertir _id a id para compatibilidad con frontend
            const carterasConId = carteras.map(c => ({
                ...c,
                id: c._id.toString(),
                _id: undefined
            }));
            
            return res.json({ success: true, carteras: carterasConId });
        }

        // GET - Obtener carteras eliminadas
        if (req.method === 'GET' && action === 'eliminadas' && userId) {
            const carteras = await db.collection('carteras')
                .find({ creadoPor: userId, eliminada: true })
                .toArray();
            
            // Convertir _id a id para compatibilidad con frontend
            const carterasConId = carteras.map(c => ({
                ...c,
                id: c._id.toString(),
                _id: undefined
            }));
            
            return res.json({ success: true, carteras: carterasConId });
        }

        // POST - Crear nueva cartera (sin action o con action=crear, y sin id)
        if (req.method === 'POST' && (!action || action === 'crear') && !id) {
            const userId = body.userId || body.creadoPor;
            
            // VERIFICAR PAGO: Obtener usuario y contar carteras existentes
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Usuario no encontrado' 
                });
            }
            
            // Contar TODAS las carteras activas del usuario (no eliminadas)
            const carterasActuales = await db.collection('carteras').countDocuments({ 
                creadoPor: userId, 
                eliminada: false
            });
            
            // Verificar si tiene carteras pagadas disponibles
            const carterasPagadas = user.carterasPagadas || 0; // Por defecto 0 - TODAS requieren pago
            
            console.log('🔵 Verificación de pago:', { 
                userId, 
                userName: user.nombre,
                carterasActuales, 
                carterasPagadas,
                intentandoCrear: body.nombre
            });
            
            // RECHAZAR si ya alcanzó el límite de carteras pagadas
            if (carterasActuales >= carterasPagadas) {
                console.log('❌ RECHAZADO: Usuario ya tiene', carterasActuales, 'carteras pero solo pagó por', carterasPagadas);
                
                // Generar clave PIX aleatoria (simulada - deberías usar tu API de pago real)
                const pixKey = `pix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const amount = 51.41;
                
                // Crear cartera pendiente de pago
                const carteraPendiente = { 
                    ...body,
                    creadoPor: userId,
                    fechaCreacion: new Date(),
                    eliminada: false,
                    activa: false,
                    pendientePago: true,
                    pixKey: pixKey,
                    montoPago: amount
                };
                
                const result = await db.collection('carteras').insertOne(carteraPendiente);
                
                return res.status(200).json({ 
                    success: false,
                    needsPayment: true,
                    carteraId: result.insertedId.toString(),
                    paymentInfo: {
                        pixKey: pixKey,
                        amount: amount,
                        currency: 'BRL',
                        description: `Pago por cartera: ${body.nombre}`
                    },
                    message: 'Cartera creada. Completa el pago para activarla.'
                });
            }
            
            // Crear cartera (siempre activa si pasó la verificación)
            const cartera = { 
                ...body,
                creadoPor: userId,
                fechaCreacion: new Date(),
                eliminada: false,
                activa: true,
                pendientePago: false
            };
            
            console.log('✅ APROBADO: Creando cartera:', cartera.nombre);
            const result = await db.collection('carteras').insertOne(cartera);
            console.log('✅ Cartera creada con ID:', result.insertedId);
            
            return res.json({ 
                success: true, 
                id: result.insertedId.toString(), 
                cartera: { ...cartera, id: result.insertedId.toString() } 
            });
        }

        // PUT - Actualizar cartera
        if (req.method === 'PUT' && action === 'actualizar' && id) {
            const updateData = { ...body };
            delete updateData._id;
            delete updateData.id;
            
            const result = await db.collection('carteras').updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
            
            return res.json({ 
                success: result.modifiedCount > 0,
                message: result.modifiedCount > 0 ? 'Cartera actualizada' : 'No se encontró la cartera'
            });
        }

        // DELETE - Eliminar cartera (soft delete)
        if ((req.method === 'DELETE' || req.method === 'POST') && action === 'eliminar' && id) {
            const result = await db.collection('carteras').updateOne(
                { _id: new ObjectId(id) },
                { $set: { eliminada: true, fechaEliminacion: new Date() } }
            );
            
            return res.json({ 
                success: result.modifiedCount > 0,
                message: result.modifiedCount > 0 ? 'Cartera eliminada' : 'No se encontró la cartera'
            });
        }

        // POST - Restablecer cartera eliminada
        if (req.method === 'POST' && action === 'restablecer' && id) {
            const result = await db.collection('carteras').updateOne(
                { _id: new ObjectId(id) },
                { $set: { eliminada: false }, $unset: { fechaEliminacion: "" } }
            );
            
            return res.json({ 
                success: result.modifiedCount > 0,
                message: result.modifiedCount > 0 ? 'Cartera restablecida' : 'No se encontró la cartera'
            });
        }

        // POST - Confirmar pago de cartera
        if (req.method === 'POST' && action === 'confirmar-pago' && id) {
            const result = await db.collection('carteras').updateOne(
                { _id: new ObjectId(id), pendientePago: true },
                { 
                    $set: { 
                        activa: true, 
                        pendientePago: false,
                        fechaPago: new Date()
                    } 
                }
            );
            
            if (result.modifiedCount > 0) {
                // Incrementar contador de carteras pagadas del usuario
                const cartera = await db.collection('carteras').findOne({ _id: new ObjectId(id) });
                await db.collection('users').updateOne(
                    { _id: new ObjectId(cartera.creadoPor) },
                    { $inc: { carterasPagadas: 1 } }
                );
            }
            
            return res.json({ 
                success: result.modifiedCount > 0,
                message: result.modifiedCount > 0 ? 'Pago confirmado. Cartera activada.' : 'No se encontró la cartera o ya fue pagada'
            });
        }

        return res.status(400).json({ 
            success: false, 
            error: 'Invalid request - missing action or parameters' 
        });

    } catch (error) {
        console.error('Error en /api/carteras:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
