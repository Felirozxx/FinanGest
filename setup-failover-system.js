// Script para configurar el sistema de failover automático
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔧 Configuración del Sistema de Failover Automático\n');
console.log('Este sistema cambiará automáticamente a Supabase si MongoDB falla.\n');

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setup() {
    console.log('📋 Necesito las credenciales de Supabase:\n');
    console.log('1. Ve a: https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a Settings > API');
    console.log('4. Copia la "anon/public" key\n');
    
    const supabaseKey = await question('Ingresa tu Supabase API Key: ');
    
    if (!supabaseKey || supabaseKey.length < 20) {
        console.log('\n❌ API Key inválida. Intenta de nuevo.');
        rl.close();
        return;
    }
    
    console.log('\n✅ Configuración guardada!');
    console.log('\n📝 Ahora debes agregar estas variables en Vercel:');
    console.log('   1. Ve a: https://vercel.com/felirozxx/finangest/settings/environment-variables');
    console.log('   2. Agrega:');
    console.log(`      SUPABASE_KEY = ${supabaseKey}`);
    console.log(`      USE_FAILOVER = false  (cambiar a true cuando esté listo)`);
    console.log('\n🧪 Después ejecuta: node test-failover.js');
    
    rl.close();
}

setup();
