const { connectToDatabase } = require('./_db');
const { hashPassword, verifyPassword } = require('./_crypto-hash');

// Endpoint consolidado para contraseña de caja
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
        const { action, userId } = req.query;
        
        // Parsear el body si es string
        let body = req.body || {};
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        // GET - Verificar si tiene contraseña configurada
        if (req.method === 'GET' && action === 'tiene-password') {
            const user = await db.collection('users').findOne({ 
                _id: require('mongodb').ObjectId(userId) 
            });
            
            return res.json({ 
                success: true, 
                hasPassword: !!(user && user.passwordCaja) 
            });
        }

        // POST - Configurar nueva contraseña
        if (req.method === 'POST' && action === 'configurar') {
            const { password } = body;
            const userIdFromBody = body.userId || userId;
            
            if (!password || password.length < 4) {
                return res.json({ 
                    success: false, 
                    error: 'La contraseña debe tener al menos 4 caracteres' 
                });
            }
            
            const hashedPassword = hashPassword(password);
            
            const result = await db.collection('users').updateOne(
                { _id: require('mongodb').ObjectId(userIdFromBody) },
                { $set: { passwordCaja: hashedPassword } }
            );
            
            return res.json({ 
                success: result.modifiedCount > 0 || result.matchedCount > 0,
                message: 'Contraseña de caja configurada'
            });
        }

        // POST - Verificar contraseña
        if (req.method === 'POST' && action === 'verificar') {
            const { password } = body;
            const userIdFromBody = body.userId || userId;
            
            const user = await db.collection('users').findOne({ 
                _id: require('mongodb').ObjectId(userIdFromBody) 
            });
            
            if (!user || !user.passwordCaja) {
                return res.json({ 
                    success: false, 
                    valid: false,
                    error: 'No hay contraseña configurada' 
                });
            }
            
            const valid = verifyPassword(password, user.passwordCaja);
            
            return res.json({ 
                success: true, 
                valid: valid 
            });
        }

        // POST - Cambiar contraseña con contraseña actual
        if (req.method === 'POST' && action === 'cambiar') {
            const { currentPassword, newPassword } = body;
            const userIdFromBody = body.userId || userId;
            
            if (!newPassword || newPassword.length < 4) {
                return res.json({ 
                    success: false, 
                    error: 'La nueva contraseña debe tener al menos 4 caracteres' 
                });
            }
            
            const user = await db.collection('users').findOne({ 
                _id: require('mongodb').ObjectId(userIdFromBody) 
            });
            
            if (!user || !user.passwordCaja) {
                return res.json({ 
                    success: false, 
                    error: 'No hay contraseña configurada' 
                });
            }
            
            const valid = verifyPassword(currentPassword, user.passwordCaja);
            
            if (!valid) {
                return res.json({ 
                    success: false, 
                    error: 'Contraseña actual incorrecta' 
                });
            }
            
            const hashedPassword = hashPassword(newPassword);
            
            const result = await db.collection('users').updateOne(
                { _id: require('mongodb').ObjectId(userIdFromBody) },
                { $set: { passwordCaja: hashedPassword } }
            );
            
            return res.json({ 
                success: result.modifiedCount > 0,
                message: 'Contraseña actualizada'
            });
        }

        // DELETE - Eliminar contraseña
        if (req.method === 'DELETE' || (req.method === 'POST' && action === 'eliminar')) {
            const { password } = body;
            const userIdFromBody = body.userId || userId;
            
            const user = await db.collection('users').findOne({ 
                _id: require('mongodb').ObjectId(userIdFromBody) 
            });
            
            if (!user || !user.passwordCaja) {
                return res.json({ 
                    success: false, 
                    error: 'No hay contraseña configurada' 
                });
            }
            
            const valid = verifyPassword(password, user.passwordCaja);
            
            if (!valid) {
                return res.json({ 
                    success: false, 
                    error: 'Contraseña incorrecta' 
                });
            }
            
            const result = await db.collection('users').updateOne(
                { _id: require('mongodb').ObjectId(userIdFromBody) },
                { $unset: { passwordCaja: "" } }
            );
            
            return res.json({ 
                success: result.modifiedCount > 0,
                message: 'Contraseña eliminada'
            });
        }

        return res.status(400).json({ 
            success: false, 
            error: 'Invalid request - missing action or parameters' 
        });

    } catch (error) {
        console.error('Error en /api/password-caja:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
