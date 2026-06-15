const { connectToDatabase } = require('./_db');
const { hashPassword } = require('./_crypto-hash');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { secretKey } = req.body;
        
        // Clave secreta para crear admin (solo tú la conoces)
        if (secretKey !== 'CREATE_ADMIN_2026_FINANGEST') {
            return res.status(403).json({ error: 'Clave secreta incorrecta' });
        }

        const { db } = await connectToDatabase();
        
        // Verificar si ya existe admin
        const existingAdmin = await db.collection('users').findOne({ 
            email: 'admin@finangest.com' 
        });
        
        if (existingAdmin) {
            // Actualizar contraseña
            await db.collection('users').updateOne(
                { email: 'admin@finangest.com' },
                { 
                    $set: { 
                        password: hashPassword('admin123'),
                        activo: true
                    } 
                }
            );
            
            return res.json({ 
                success: true, 
                message: 'Admin actualizado',
                credentials: {
                    email: 'admin@finangest.com',
                    password: 'admin123'
                }
            });
        }
        
        // Crear nuevo admin
        const adminUser = {
            nombre: 'Administrador',
            email: 'admin@finangest.com',
            password: hashPassword('admin123'),
            role: 'admin',
            activo: true,
            fechaRegistro: new Date()
        };
        
        await db.collection('users').insertOne(adminUser);
        
        res.json({ 
            success: true,
            message: 'Admin creado exitosamente',
            credentials: {
                email: 'admin@finangest.com',
                password: 'admin123'
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error de servidor: ' + error.message 
        });
    }
};
