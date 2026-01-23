// Sistema de backup automático entre múltiples backends
const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId requerido' });
        }

        // GET - Obtener backups disponibles
        if (req.method === 'GET') {
            const { db } = await connectToDatabase();
            
            const backups = await db.collection('backups_auto')
                .find({ userId })
                .sort({ timestamp: -1 })
                .limit(10)
                .toArray();

            return res.json({
                success: true,
                backups: backups.map(b => ({
                    id: b._id,
                    timestamp: b.timestamp,
                    backend: b.backend,
                    collections: b.collections,
                    size: b.size
                }))
            });
        }

        // POST - Crear backup automático
        if (req.method === 'POST') {
            const { db, backend } = await connectToDatabase();
            
            // Colecciones a respaldar
            const collections = ['clientes', 'carteras', 'gastos', 'cajas', 'users'];
            const backupData = {};
            let totalSize = 0;

            // Exportar cada colección
            for (const collectionName of collections) {
                const data = await db.collection(collectionName)
                    .find({ 
                        $or: [
                            { userId },
                            { creadoPor: userId },
                            { _id: userId }
                        ]
                    })
                    .toArray();
                
                backupData[collectionName] = data;
                totalSize += JSON.stringify(data).length;
            }

            // Guardar backup
            const backup = {
                userId,
                timestamp: new Date(),
                backend,
                collections: Object.keys(backupData),
                size: totalSize,
                data: backupData,
                automatic: true
            };

            const result = await db.collection('backups_auto').insertOne(backup);

            // Limpiar backups antiguos (mantener solo los últimos 10)
            const allBackups = await db.collection('backups_auto')
                .find({ userId })
                .sort({ timestamp: -1 })
                .toArray();

            if (allBackups.length > 10) {
                const toDelete = allBackups.slice(10).map(b => b._id);
                await db.collection('backups_auto').deleteMany({
                    _id: { $in: toDelete }
                });
            }

            return res.json({
                success: true,
                backupId: result.insertedId,
                timestamp: backup.timestamp,
                size: totalSize,
                collections: collections.length
            });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error en auto-backup:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error creando backup automático' 
        });
    }
};
