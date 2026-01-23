// Endpoint para verificar el estado del sistema y backends
const { getBackendsStatus, switchBackend } = require('./_db');

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
        // GET - Obtener estado de todos los backends
        if (req.method === 'GET') {
            const status = await getBackendsStatus();
            
            return res.json({
                success: true,
                timestamp: new Date().toISOString(),
                backends: status,
                systemStatus: Object.values(status).some(b => b.healthy) ? 'operational' : 'degraded'
            });
        }

        // POST - Cambiar manualmente de backend
        if (req.method === 'POST') {
            const { backend, action } = req.body;

            if (action === 'switch' && backend) {
                try {
                    await switchBackend(backend);
                    return res.json({
                        success: true,
                        message: `Cambiado a ${backend}`,
                        backend: backend
                    });
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        error: error.message
                    });
                }
            }

            return res.status(400).json({
                success: false,
                error: 'Acción no válida'
            });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error en system-health:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error verificando estado del sistema' 
        });
    }
};
