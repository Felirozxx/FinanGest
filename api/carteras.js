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

        // GET - Obtener carteras por usuario
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

        // POST - Crear nueva cartera
        if (req.method === 'POST' && action === 'crear') {
            const cartera = { 
                ...body,
                creadoPor: body.userId || body.creadoPor,
                fechaCreacion: new Date(),
                eliminada: false,
                activa: true
            };
            
            console.log('Creando cartera:', cartera);
            const result = await db.collection('carteras').insertOne(cartera);
            console.log('Cartera creada con ID:', result.insertedId);
            
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
