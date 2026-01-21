module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return res.json({ 
        success: true, 
        message: 'API funcionando correctamente',
        mongoUri: process.env.MONGODB_URI ? 'Configurada' : 'NO configurada',
        timestamp: new Date().toISOString()
    });
};
