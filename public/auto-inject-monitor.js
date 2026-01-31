// Script que se ejecuta automáticamente al cargar la página
(function() {
    console.log('🔧 Inyectando monitor de servidores...');
    
    // Esperar a que el DOM esté listo
    function init() {
        const menu = document.querySelector('.nav-menu');
        if (!menu) {
            setTimeout(init, 100);
            return;
        }
        
        // Verificar si ya existe
        if (document.querySelector('[data-section="adminServidores"]')) {
            console.log('✓ Monitor ya existe');
            return;
        }
        
        // Crear ítem de menú
        const servidoresItem = document.createElement('div');
        servidoresItem.className = 'nav-item';
        servidoresItem.setAttribute('data-section', 'adminServidores');
        servidoresItem.innerHTML = '<i class="fas fa-server"></i><span>Servidores</span>';
        servidoresItem.onclick = function() {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            
            let monitorSection = document.getElementById('adminServidores');
            if (!monitorSection) {
                monitorSection = document.createElement('div');
                monitorSection.id = 'adminServidores';
                monitorSection.className = 'section';
                monitorSection.innerHTML = `
                    <h5 class="mb-4"><i class="fas fa-server me-2" style="color: var(--accent-cyan);"></i>Monitor de Servidores</h5>
                    <iframe src="/server-monitor.html" style="width: 100%; height: calc(100vh - 150px); border: none; border-radius: 12px; background: var(--bg-card);"></iframe>
                `;
                document.querySelector('.main-content').appendChild(monitorSection);
            }
            monitorSection.classList.add('active');
            servidoresItem.classList.add('active');
            localStorage.setItem('finangest_section', 'adminServidores');
        };
        
        // Insertar después de Backups
        const backupsItem = Array.from(menu.querySelectorAll('.nav-item')).find(item => 
            item.textContent.includes('Backups') || item.textContent.includes('backups')
        );
        
        if (backupsItem) {
            backupsItem.after(servidoresItem);
            console.log('✓ Menú "Servidores" agregado exitosamente');
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
