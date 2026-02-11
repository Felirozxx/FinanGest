// Simular lo que hace el admin cuando ve la lista de usuarios
const API_URL = 'https://finangest.vercel.app';

async function testAdminView() {
    console.log('🧪 Simulando vista de admin...\n');
    
    try {
        // 1. Obtener todos los usuarios
        console.log('1️⃣ Obteniendo usuarios...');
        const usersRes = await fetch(`${API_URL}/api/users`);
        const users = await usersRes.json();
        
        const workers = users.filter(u => u.role !== 'admin' && !u.isAdmin);
        console.log(`   ✅ ${workers.length} trabajadores encontrados\n`);
        
        // 2. Para cada trabajador, cargar sus carteras (como hace toggleUserClients)
        for (const worker of workers) {
            const userId = worker.id || worker._id?.toString();
            console.log(`👤 ${worker.nombre} (${worker.email})`);
            console.log(`   ID: ${userId}`);
            
            // Cargar carteras
            console.log(`   📡 Llamando: ${API_URL}/api/carteras/${userId}`);
            const carterasRes = await fetch(`${API_URL}/api/carteras/${userId}`);
            const carterasData = await carterasRes.json();
            
            console.log(`   📦 Response:`, JSON.stringify(carterasData, null, 2));
            
            const carteras = carterasData.success && Array.isArray(carterasData.carteras) 
                ? carterasData.carteras 
                : [];
            
            console.log(`   📁 Carteras procesadas: ${carteras.length}`);
            
            if (carteras.length === 0) {
                console.log(`   ⚠️  MOSTRARÁ: "Sin carteras"`);
            } else {
                console.log(`   ✅ MOSTRARÁ: ${carteras.length} carteras`);
                carteras.forEach(c => {
                    console.log(`      - ${c.nombre} (${c.id})`);
                });
            }
            
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAdminView();
