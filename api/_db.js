// Sistema de base de datos con failover automático
const dbManager = require('./_db-manager');

// Exportar la función de conexión con failover
async function connectToDatabase() {
    return await dbManager.connectToDatabase();
}

module.exports = { 
    connectToDatabase,
    getBackendsStatus: dbManager.getBackendsStatus,
    switchBackend: dbManager.switchBackend,
    checkHealth: dbManager.checkHealth
};
