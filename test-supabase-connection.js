// Test rápido de conexión a Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
    console.log('🧪 Probando conexión a Supabase...\n');
    
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );
    
    try {
        // Intentar hacer una consulta simple
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.log('❌ Error:', error.message);
            console.log('\n⚠️  Las tablas aún no existen.');
            console.log('Ve a: https://supabase.com/dashboard/project/tqbddnjzgaifeoidtswt/sql/new');
            console.log('Y ejecuta el contenido de: create-supabase-tables.sql\n');
            return false;
        }
        
        console.log('✅ Conexión exitosa a Supabase!');
        console.log('✅ Tablas creadas correctamente\n');
        return true;
        
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
        return false;
    }
}

testConnection();
