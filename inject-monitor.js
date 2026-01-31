// Script para inyectar el monitor en la consola del navegador
console.log('Inyectando monitor de servidores...');

// Crear nueva sección en el menú
const menu = document.querySelector('.nav-menu');
if (menu) {
    const servidoresItem = document.createElement('div');
    servidoresItem.className = 'nav-item';
    servidoresItem.innerHTML = '<i class="fas fa-server"></i><span>Servidores</span>';
    servidoresItem.onclick = () => {
        // Ocultar todas las secciones
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        // Mostrar iframe con el monitor
        let monitorSection = document.getElementById('monitorServidores');
        if (!monitorSection) {
            monitorSection = document.createElement('div');
            monitorSection.id = 'monitorServidores';
            monitorSection.className = 'section';
            monitorSection.innerHTML = '<iframe src="/server-monitor.html" style="width: 100%; height: calc(100vh - 100px); border: none; border-radius: 12px;"></iframe>';
            document.querySelector('.main-content').appendChild(monitorSection);
        }
        monitorSection.classList.add('active');
        servidoresItem.classList.add('active');
    };
    
    // Insertar después de Backups
    const backupsItem = Array.from(menu.querySelectorAll('.nav-item')).find(item => item.textContent.includes('Backups'));
    if (backupsItem) {
        backupsItem.after(servidoresItem);
        console.log('✓ Menú "Servidores" agregado');
    }
}
