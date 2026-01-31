const fs = require('fs');

console.log('Agregando menú de Servidores al panel de admin...');

// Leer archivo limpio
const content = fs.readFileSync('public/index-8eda253.html', 'utf8').replace(/^\uFEFF/, '');
const lines = content.split('\n');

let output = [];
let menuAdded = false;
let sectionAdded = false;
let arrayUpdated = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 1. Agregar ítem de menú después de Backups
    if (!menuAdded && line.includes("showSection('adminBackups')") && line.includes('nav-item')) {
        output.push(line);
        output.push('                    <div class="nav-item" onclick="showSection(\'adminServidores\')"><i class="fas fa-server"></i><span data-translate="servidores">Servidores</span></div>');
        menuAdded = true;
        console.log('✓ Menú agregado');
        continue;
    }
    
    // 2. Agregar sección adminServidores después de adminBackups
    if (!sectionAdded && line.includes('<!-- Admin: Configuración -->')) {
        // Insertar la nueva sección ANTES de Configuración
        output.push('            <!-- Admin: Servidores -->');
        output.push('            <div id="adminServidores" class="section">');
        output.push('                <h5 class="mb-4"><i class="fas fa-server me-2" style="color: var(--accent-cyan);"></i>Monitor de Servidores</h5>');
        output.push('                ');
        output.push('                <div id="serversStatusContainer">');
        output.push('                    <div class="text-center py-4">');
        output.push('                        <i class="fas fa-spinner fa-spin fa-2x mb-3" style="color: var(--accent-cyan);"></i>');
        output.push('                        <p class="text-secondary">Cargando estado de servidores...</p>');
        output.push('                    </div>');
        output.push('                </div>');
        output.push('            </div>');
        output.push('            ');
        sectionAdded = true;
        console.log('✓ Sección agregada');
    }
    
    // 3. Actualizar array de secciones de admin
    if (!arrayUpdated && line.includes("const adminSections = ['adminUsuarios'")) {
        output.push("                const adminSections = ['adminUsuarios', 'adminCalendario', 'adminBackups', 'adminServidores', 'adminConfig', 'adminSeguridad'];");
        arrayUpdated = true;
        console.log('✓ Array actualizado');
        continue;
    }
    
    output.push(line);
}

// Ahora agregar la función JavaScript para cargar el estado de servidores
const jsInsertPoint = output.findIndex(l => l.includes('// ============ FUNCIONES DE BACKUP ============'));
if (jsInsertPoint !== -1) {
    const jsFunction = `
        // ============ MONITOR DE SERVIDORES ============
        async function loadServersStatus() {
            const container = document.getElementById('serversStatusContainer');
            if (!container) return;
            
            container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x mb-3" style="color: var(--accent-cyan);"></i><p class="text-secondary">Actualizando...</p></div>';
            
            try {
                const res = await fetch(API_URL + '/api/system-health');
                const data = await res.json();
                
                if (!data.success) throw new Error(data.error || 'Error al obtener estado');
                
                const backends = data.backends || {};
                const currentBackend = data.currentBackend || 'mongodb';
                
                let html = '<div class="row g-3">';
                
                // MongoDB
                const mongo = backends.mongodb || {};
                const mongoColor = mongo.healthy ? 'var(--accent-green)' : 'var(--accent-red)';
                const mongoIcon = mongo.healthy ? 'fa-check-circle' : 'fa-times-circle';
                const mongoCurrent = currentBackend === 'mongodb' ? '<span class="badge" style="background: var(--accent-cyan); color: #000; margin-left: 8px;">ACTIVO</span>' : '';
                
                html += \`<div class="col-md-4"><div class="card-dark" style="border-left: 4px solid \${mongoColor};"><div class="d-flex justify-content-between align-items-start mb-2"><div><h6 class="mb-1">MongoDB Atlas \${mongoCurrent}</h6><small class="text-secondary">Prioridad 1 - Principal</small></div><i class="fas \${mongoIcon} fa-2x" style="color: \${mongoColor};"></i></div><div class="mt-2"><span class="badge" style="background: \${mongo.healthy ? 'rgba(46,204,113,0.15)' : 'rgba(255,71,87,0.15)'}; color: \${mongoColor}; padding: 6px 12px;">\${mongo.healthy ? '✓ Operativo' : '✗ Fuera de línea'}</span></div>\${mongo.error ? \`<div class="mt-2"><small class="text-secondary">\${mongo.error}</small></div>\` : ''}</div></div>\`;
                
                // Supabase
                const supabase = backends.supabase || {};
                const supabaseColor = supabase.healthy ? 'var(--accent-green)' : 'var(--accent-red)';
                const supabaseIcon = supabase.healthy ? 'fa-check-circle' : 'fa-times-circle';
                const supabaseCurrent = currentBackend === 'supabase' ? '<span class="badge" style="background: var(--accent-cyan); color: #000; margin-left: 8px;">ACTIVO</span>' : '';
                
                html += \`<div class="col-md-4"><div class="card-dark" style="border-left: 4px solid \${supabaseColor};"><div class="d-flex justify-content-between align-items-start mb-2"><div><h6 class="mb-1">Supabase \${supabaseCurrent}</h6><small class="text-secondary">Prioridad 2 - Backup</small></div><i class="fas \${supabaseIcon} fa-2x" style="color: \${supabaseColor};"></i></div><div class="mt-2"><span class="badge" style="background: \${supabase.healthy ? 'rgba(46,204,113,0.15)' : 'rgba(255,71,87,0.15)'}; color: \${supabaseColor}; padding: 6px 12px;">\${supabase.healthy ? '✓ Operativo' : '✗ Fuera de línea'}</span></div>\${supabase.error ? \`<div class="mt-2"><small class="text-secondary">\${supabase.error}</small></div>\` : ''}</div></div>\`;
                
                // Firebase
                const firebase = backends.firebase || {};
                const firebaseColor = firebase.healthy ? 'var(--accent-green)' : 'var(--accent-red)';
                const firebaseIcon = firebase.healthy ? 'fa-check-circle' : 'fa-times-circle';
                const firebaseCurrent = currentBackend === 'firebase' ? '<span class="badge" style="background: var(--accent-cyan); color: #000; margin-left: 8px;">ACTIVO</span>' : '';
                
                html += \`<div class="col-md-4"><div class="card-dark" style="border-left: 4px solid \${firebaseColor};"><div class="d-flex justify-content-between align-items-start mb-2"><div><h6 class="mb-1">Firebase \${firebaseCurrent}</h6><small class="text-secondary">Prioridad 3 - Seguridad</small></div><i class="fas \${firebaseIcon} fa-2x" style="color: \${firebaseColor};"></i></div><div class="mt-2"><span class="badge" style="background: \${firebase.healthy ? 'rgba(46,204,113,0.15)' : 'rgba(255,71,87,0.15)'}; color: \${firebaseColor}; padding: 6px 12px;">\${firebase.healthy ? '✓ Operativo' : '✗ Fuera de línea'}</span></div>\${firebase.error ? \`<div class="mt-2"><small class="text-secondary">\${firebase.error}</small></div>\` : ''}</div></div>\`;
                
                html += '</div>';
                
                const allHealthy = mongo.healthy && supabase.healthy && firebase.healthy;
                const systemStatus = allHealthy ? 'Todos los servidores operativos' : 
                                    mongo.healthy ? 'Sistema operativo (servidor principal activo)' :
                                    supabase.healthy ? 'Sistema operativo (usando servidor de respaldo)' :
                                    firebase.healthy ? 'Sistema operativo (usando servidor de seguridad)' :
                                    'Sistema degradado';
                const systemColor = allHealthy ? 'var(--accent-green)' : 
                                   (mongo.healthy || supabase.healthy || firebase.healthy) ? 'var(--accent-yellow)' : 
                                   'var(--accent-red)';
                
                html += \`<div class="mt-3 p-3" style="background: var(--bg-hover); border-radius: 8px; border-left: 4px solid \${systemColor};"><div class="d-flex align-items-center gap-2"><i class="fas fa-info-circle" style="color: \${systemColor};"></i><strong style="color: \${systemColor};">\${systemStatus}</strong></div><small class="text-secondary d-block mt-1">Última verificación: \${new Date().toLocaleString('es-ES')}</small></div>\`;
                
                container.innerHTML = html;
                
            } catch (error) {
                console.error('Error al cargar estado de servidores:', error);
                container.innerHTML = \`<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Error al verificar estado de servidores: \${error.message}</div>\`;
            }
        }
`;
    
    output.splice(jsInsertPoint, 0, jsFunction);
    console.log('✓ Función JS agregada');
}

// Agregar llamada automática cuando se abre la sección
const showSectionIdx = output.findIndex(l => l.includes("if (id === 'adminBackups')"));
if (showSectionIdx !== -1) {
    // Buscar el cierre de ese if
    for (let i = showSectionIdx; i < showSectionIdx + 10; i++) {
        if (output[i].includes('}')) {
            output.splice(i + 1, 0, '            if (id === \'adminServidores\') {');
            output.splice(i + 2, 0, '                loadServersStatus();');
            output.splice(i + 3, 0, '            }');
            console.log('✓ Llamada automática agregada');
            break;
        }
    }
}

// Guardar
fs.writeFileSync('public/index.html', output.join('\n'), 'utf8');
fs.writeFileSync('public/app.html', output.join('\n'), 'utf8');

console.log('\n✓✓✓ COMPLETADO - Menú de Servidores agregado al panel de admin');
