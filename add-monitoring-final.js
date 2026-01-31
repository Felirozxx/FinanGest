const fs = require('fs');

const lines = fs.readFileSync('public/index-clean.html', 'utf8').split('\n');
console.log(`Total líneas: ${lines.length}`);

let output = [];
let added = false;
let jsAdded = false;
let callAdded = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    output.push(line);
    
    if (!added && line.includes('Crear Backup') && line.includes('</span>')) {
        if (i + 2 < lines.length && lines[i+1].trim().includes('</button>') && lines[i+2].trim().includes('</div>')) {
            output.push(lines[++i]);
            output.push(lines[++i]);
            
            output.push('                ');
            output.push('                <!-- Estado de Servidores de Respaldo -->');
            output.push('                <div class="card-dark mb-4">');
            output.push('                    <div class="d-flex justify-content-between align-items-center mb-3">');
            output.push('                        <h6 class="mb-0"><i class="fas fa-server me-2" style="color: var(--accent-cyan);"></i><span data-translate="estadoServidores">Estado de Servidores de Respaldo</span></h6>');
            output.push('                        <button class="btn btn-sm" style="background: var(--accent-cyan); color: #000;" onclick="refreshBackupStatus()">');
            output.push('                            <i class="fas fa-sync-alt me-1"></i><span data-translate="actualizar">Actualizar</span>');
            output.push('                        </button>');
            output.push('                    </div>');
            output.push('                    <div id="backupServersStatus">');
            output.push('                        <div class="text-center py-4">');
            output.push('                            <i class="fas fa-spinner fa-spin fa-2x mb-3" style="color: var(--accent-cyan);"></i>');
            output.push('                            <p class="text-secondary"><span data-translate="verificandoServidores">Verificando estado de servidores...</span></p>');
            output.push('                        </div>');
            output.push('                    </div>');
            output.push('                </div>');
            
            added = true;
            console.log(`✓ Sección HTML agregada en línea ${i}`);
        }
    }
    
    if (!jsAdded && line.includes('FUNCIONES DE BACKUP')) {
        output.pop();
        const jsFunc = fs.readFileSync('monitoring-function.js', 'utf8');
        output.push(jsFunc);
        output.push('');
        output.push(line);
        jsAdded = true;
        console.log(`✓ Función JS agregada en línea ${i}`);
    }
    
    if (!callAdded && line.includes('cargarBackups();')) {
        output.push('                refreshBackupStatus();');
        callAdded = true;
        console.log(`✓ Llamada automática agregada en línea ${i}`);
    }
}

if (added && jsAdded && callAdded) {
    fs.writeFileSync('public/index.html', output.join('\n'), 'utf8');
    fs.writeFileSync('public/app.html', output.join('\n'), 'utf8');
    console.log(`\n✓✓✓ COMPLETADO`);
} else {
    console.log(`\n✗ Falló`);
}
