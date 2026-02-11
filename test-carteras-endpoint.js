// Test script to verify carteras endpoint
const API_URL = 'https://finangest.vercel.app';

async function testCarterasEndpoint() {
    console.log('🧪 Testing carteras endpoint...\n');
    
    // First, get all users to find worker IDs
    try {
        console.log('1️⃣ Getting all users...');
        const usersRes = await fetch(`${API_URL}/api/users`);
        const users = await usersRes.json();
        
        const workers = users.filter(u => u.role !== 'admin' && !u.isAdmin);
        console.log(`   Found ${workers.length} workers:\n`);
        
        for (const worker of workers) {
            console.log(`   👤 ${worker.nombre} (${worker.email})`);
            console.log(`      ID: ${worker.id || worker._id}`);
            
            // Test carteras endpoint for this worker
            const workerId = worker.id || worker._id?.toString();
            console.log(`\n2️⃣ Testing /api/carteras/${workerId}...`);
            
            const carterasRes = await fetch(`${API_URL}/api/carteras/${workerId}`);
            const carterasData = await carterasRes.json();
            
            console.log(`   Response:`, JSON.stringify(carterasData, null, 2));
            
            if (carterasData.success && carterasData.carteras) {
                console.log(`   ✅ Found ${carterasData.carteras.length} carteras`);
                carterasData.carteras.forEach(c => {
                    console.log(`      📁 ${c.nombre} (creadoPor: ${c.creadoPor})`);
                });
            } else {
                console.log(`   ❌ No carteras found or error`);
            }
            console.log('\n' + '='.repeat(60) + '\n');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testCarterasEndpoint();
