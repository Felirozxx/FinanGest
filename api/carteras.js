const { connectToDatabase } = require('./_db');
const { ObjectId } = require('mongodb');

// Endpoint consolidado para todas las operaciones de carteras
module.exports = async (req, res) => {
    console.log('🟢 Carteras API called:', {
        method: req.method,
        url: req.url,
        hasBody: !!req.body,
        bodyType: typeof req.body
    });
    
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
        
        // Extraer ID de la URL si está en formato /api/carteras/ID
        const urlParts = req.url.split('?')[0].split('/');
        const idFromUrl = urlParts[urlParts.length - 1];
        const carteraId = id || (idFromUrl !== 'carteras' && idFromUrl !== '' ? idFromUrl : null);
        
        console.log('🔵 API Carteras:', {
            method: req.method,
            url: req.url,
            action,
            userId,
            id,
            carteraId,
            hasBody: !!req.body
        });
        
        // Parsear el body si es string
        let body = req.body || {};
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        // GET - Obtener carteras por usuario
        if (req.method === 'GET' && (action === 'por-usuario' || userId)) {
            const targetUserId = userId || req.query.userId;
            const carteras = await db.collection('carteras')
                .find({ creadoPor: targetUserId, eliminada: false })
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

        // POST - Crear nueva cartera (con o sin action=crear)
        if (req.method === 'POST') {
            console.log('🟡 POST detectado, verificando body:', { 
                hasUserId: !!body.userId, 
                hasCreadoPor: !!body.creadoPor,
                action 
            });
            
            const userId = body.userId || body.creadoPor;
            
            if (!userId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'userId requerido' 
                });
            }
            
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
            const carterasPagadas = user.carterasPagadas || 1; // Por defecto 1 cartera gratis
            
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
                return res.status(403).json({ 
                    success: false, 
                    error: 'Debes pagar R$ 51,41 para crear una cartera adicional',
                    needsPayment: true,
                    carterasDisponibles: carterasPagadas,
                    carterasCreadas: carterasActuales
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
        if (req.method === 'PUT' && (action === 'actualizar' || carteraId)) {
            const targetId = carteraId || id || req.query.id;
            
            if (!targetId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'ID de cartera requerido' 
                });
            }
            
            const updateData = { ...body };
            delete updateData._id;
            delete updateData.id;
            
            const result = await db.collection('carteras').updateOne(
                { _id: new ObjectId(targetId) },
                { $set: updateData }
            );
            
            return res.json({ 
                success: result.modifiedCount > 0,
                message: result.modifiedCount > 0 ? 'Cartera actualizada' : 'No se encontró la cartera'
            });
        }

        // DELETE - Eliminar cartera (soft delete)
        if ((req.method === 'DELETE' || req.method === 'POST') && (action === 'eliminar' || carteraId)) {
            const targetId = carteraId || id || req.query.id;
            
            if (!targetId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'ID de cartera requerido' 
                });
            }
            
            const result = await db.collection('carteras').updateOne(
                { _id: new ObjectId(targetId) },
                { $set: { eliminada: true, fechaEliminacion: new Date() } }
            );
            
            return res.json({ 
                success: result.modifiedCount > 0,
                message: result.modifiedCount > 0 ? 'Cartera eliminada' : 'No se encontró la cartera'
            });
        }

        // POST - Restablecer cartera eliminada
        if (req.method === 'POST' && action === 'restablecer' && (carteraId || id)) {
            const targetId = carteraId || id;
            const result = await db.collection('carteras').updateOne(
                { _id: new ObjectId(targetId) },
                { $set: { eliminada: false }, $unset: { fechaEliminacion: "" } }
            );
            
            return res.json({ 
                success: result.modifiedCount > 0,
                message: result.modifiedCount > 0 ? 'Cartera restablecida' : 'No se encontró la cartera'
            });
        }

        console.log('❌ Operación no válida:', {
            method: req.method,
            action,
            carteraId,
            url: req.url
        });
        
        return res.status(400).json({ 
            success: false, 
            error: 'Operación no válida. Método: ' + req.method + ', Action: ' + (action || 'ninguna') + ', URL: ' + req.url
        });

    } catch (error) {
        console.error('Error en /api/carteras:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
