const https = require('https');

async function testLogin() {
    const credentials = [
        { email: 'felirozxx@gmail.com', password: 'admin123' },
        { email: 'felirozxx@gmail.com', password: 'Admin123' },
        { email: 'felirozxx@gmail.com', password: 'admin' },
        { email: 'felirozxx@gmail.com', password: 'Pipe16137356' },
        { email: 'felirozxx343@gmail.com', password: 'admin123' },
        { email: 'felirozxx343@gmail.com', password: 'Admin123' },
        { email: 'admin@finangest.com', password: 'admin123' }
    ];

    console.log('🔍 Probando credenciales en Vercel...\n');

    for (const cred of credentials) {
        try {
            console.log(`Probando: ${cred.email} / ${cred.password}`);
            
            const response = await fetch('https://finangest.vercel.app/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cred)
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ ¡ENCONTRADO!');
                console.log('Email:', cred.email);
                console.log('Password:', cred.password);
                console.log('Usuario:', data.user);
                return;
            } else {
                console.log('❌', data.error || 'Error desconocido');
            }
        } catch (error) {
            console.log('❌ Error de red:', error.message);
        }
        console.log('');
    }
    
    console.log('⚠️ No se encontró ninguna combinación válida');
    console.log('\n💡 Solución: Necesitamos resetear la contraseña del admin');
}

testLogin();
