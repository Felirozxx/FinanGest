    <script>
        // VERSION: 2024-02-24-v3.9.0-AUTO-OPEN-MAP
        console.log('VERSION: 2024-02-24-v3.9.0-AUTO-OPEN-MAP');
        console.log('Timestamp:', Date.now());
        
        let currentStep = 1;
        let selectedImage = null;
        let generatedImages = [];
        let campaignData = {};

        // Funciones del sidebar (globales desde el inicio)
        window.showCampaigns = function(event) {
            console.log('showCampaigns ejecutada');
            
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            // Remover active de todos los nav-items
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            if (event) {
                event.target.closest('.nav-item').classList.add('active');
            }
            
            // Ocultar todas las secciones
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });
            
            // Mostrar secciÃ³n de campaÃ±as
            const campaignsSection = document.getElementById('campaignsSection');
            if (campaignsSection) {
                campaignsSection.classList.add('active');
                campaignsSection.style.display = 'block';
            }
        };

        window.openFacebookAds = function(event) {
            console.log('ðŸ“± Abriendo Facebook Ads Manager...');
            
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            // Abrir Facebook Ads Manager en nueva pestaÃ±a
            window.open('https://business.facebook.com/adsmanager', '_blank');
            
            // Mostrar mensaje de confirmaciÃ³n
            setTimeout(() => {
                alert('âœ… Facebook Ads Manager abierto!\n\nðŸ“± Se abriÃ³ en una nueva pestaÃ±a.\n\nðŸ’¡ Tip: Puedes crear y gestionar tus anuncios directamente desde ahÃ­.');
            }, 500);
        };

        window.openImageEditor = function(event) {
            console.log('ðŸŽ¨ openImageEditor ejecutada - VERSION v5.0.0-SYNTAX-FIX');
            
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            // Remover active de todos los nav-items
            const navItems = document.querySelectorAll('.nav-item');
            console.log('ðŸ“‹ Nav items encontrados:', navItems.length);
            navItems.forEach(item => {
                item.classList.remove('active');
            });
            
            // Agregar active al nav-item clickeado
            if (event) {
                const navItem = event.target.closest('.nav-item');
                if (navItem) {
                    navItem.classList.add('active');
                    console.log('âœ… Nav item activado');
                }
            }
            
            // Ocultar todas las secciones
            const allSections = document.querySelectorAll('.content-section');
            console.log('ðŸ“„ Secciones encontradas:', allSections.length);
            allSections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
                console.log('ðŸ”’ SecciÃ³n ocultada:', section.id);
            });
            
            // Mostrar secciÃ³n de editor
            const editorSection = document.getElementById('imageEditorSection');
            console.log('ðŸ” Editor section encontrado:', editorSection);
            console.log('ðŸ” Editor section ID:', editorSection ? editorSection.id : 'NO ENCONTRADO');
            
            if (editorSection) {
                editorSection.classList.add('active');
                editorSection.style.display = 'block';
                console.log('âœ… Editor section mostrado con display:', editorSection.style.display);
                console.log('âœ… Editor section tiene clase active:', editorSection.classList.contains('active'));
                
                // Inicializar canvas si no estÃ¡ inicializado
                if (!window.editorInitialized) {
                    console.log('ðŸŽ¬ Inicializando editor...');
                    setTimeout(() => {
                        initializeEditor();
                    }, 100);
                } else {
                    console.log('âœ… Editor ya inicializado');
                }
            } else {
                console.error('âŒ ERROR: No se encontrÃ³ imageEditorSection');
            }
        };
        
        // FunciÃ³n para abrir Facebook Ads Manager
        window.openFacebookAds = function(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            // Abrir Facebook Ads Manager en nueva pestaÃ±a
            window.open('https://business.facebook.com/adsmanager', '_blank');
            
            console.log('âœ… Abriendo Facebook Ads Manager...');
        };
        
        // Verificar que las funciones estÃ©n definidas
        console.log('openImageEditor definida:', typeof window.openImageEditor);
        console.log('showCampaigns definida:', typeof window.showCampaigns);
        console.log('openFacebookAds definida:', typeof window.openFacebookAds);

        // Editor de ImÃ¡genes IA
        let editorCanvas, editorCtx, editorLayers = [], editorCurrentImage = null;
        let editorHistory = [], editorHistoryIndex = -1;
        let editorImageLayers = []; // Array para mÃºltiples capas de imÃ¡genes
        let editorLayerCounter = 0; // Contador para nombrar capas
        let editorCurrentRotation = 0;
        let editorCurrentFilters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            filter: 'none'
        };
        // Variables de transformaciÃ³n
        let editorTransform = {
            zoom: 100,
            posX: 0,
            posY: 0,
            rotation: 0
        };
        // Variables para control con mouse
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let lastPosX = 0;
        let lastPosY = 0;
        // Variables para handles visuales
        let imageRect = { x: 0, y: 0, width: 0, height: 0 };
        let selectedHandle = null;
        let handles = [];
        let showHandles = false;
        window.editorInitialized = false;

        function initializeEditor() {
            editorCanvas = document.getElementById('editorCanvas');
            if (!editorCanvas) {
                console.error('ERROR: No se encontrÃ³ editorCanvas');
                return;
            }
            
            editorCtx = editorCanvas.getContext('2d');
            editorCtx.fillStyle = '#2a2a2a'; // Gris oscuro
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            
            // Agregar controles de mouse para mover y hacer zoom
            // Usar funciones anÃ³nimas que llaman a las funciones definidas mÃ¡s abajo
            editorCanvas.addEventListener('mousedown', function(e) {
                if (typeof handleMouseDown === 'function') handleMouseDown(e);
            });
            editorCanvas.addEventListener('mousemove', function(e) {
                if (typeof handleMouseMove === 'function') handleMouseMove(e);
            });
            editorCanvas.addEventListener('mouseup', function(e) {
                if (typeof handleMouseUp === 'function') handleMouseUp(e);
            });
            editorCanvas.addEventListener('mouseleave', function(e) {
                if (typeof handleMouseUp === 'function') handleMouseUp(e);
            });
            editorCanvas.addEventListener('wheel', function(e) {
                if (typeof handleMouseWheel === 'function') handleMouseWheel(e);
            }, { passive: false });
            
            window.editorInitialized = true;
            console.log('Editor inicializado correctamente');
        }

        function switchEditorTab(tab, event) {
            document.querySelectorAll('.tab-btn').forEach(t => {
                t.classList.remove('active');
                t.style.borderBottomColor = 'transparent';
                t.style.color = '#6b7280';
            });
            document.querySelectorAll('.editor-tab-content').forEach(t => t.style.display = 'none');
            
            // Activar el botÃ³n correcto
            if (event && event.target) {
                event.target.classList.add('active');
                event.target.style.borderBottomColor = '#667eea';
                event.target.style.color = '#667eea';
            } else {
                // Si no hay evento, buscar el botÃ³n por el tab
                const tabButtons = document.querySelectorAll('.tab-btn');
                tabButtons.forEach(btn => {
                    if (btn.textContent.toLowerCase().includes(tab === 'edit' ? 'editar' : tab)) {
                        btn.classList.add('active');
                        btn.style.borderBottomColor = '#667eea';
                        btn.style.color = '#667eea';
                    }
                });
            }
            
            document.getElementById(tab + 'EditorTab').style.display = 'block';
            
            // Cargar plantillas/stickers cuando se abre la pestaÃ±a
            if (tab === 'templates' && !window.templatesLoaded) {
                loadTemplates();
                window.templatesLoaded = true;
            }
            if (tab === 'stickers' && !window.stickersLoaded) {
                loadStickers();
                window.stickersLoaded = true;
            }
        }

        // PLANTILLAS: CategorÃ­as con palabras clave
        const templateCategories = {
            dinero: ['money', 'cash', 'dollar', 'currency', 'coins', 'bills', 'finance', 'wealth'],
            prestamos: ['loan', 'credit', 'lending', 'finance', 'money', 'cash', 'bank'],
            ofertas: ['sale', 'discount', 'offer', 'deal', 'promotion', 'special'],
            negocios: ['business', 'office', 'professional', 'corporate', 'meeting', 'work'],
            tecnologia: ['technology', 'computer', 'phone', 'digital', 'tech', 'device'],
            comida: ['food', 'restaurant', 'meal', 'cooking', 'cuisine', 'dish'],
            viajes: ['travel', 'vacation', 'tourism', 'destination', 'trip', 'journey'],
            salud: ['health', 'medical', 'fitness', 'wellness', 'doctor', 'hospital'],
            educacion: ['education', 'school', 'learning', 'study', 'student', 'teacher'],
            moda: ['fashion', 'clothing', 'style', 'apparel', 'outfit', 'wear']
        };

        let allTemplates = [];
        let allStickers = [];

        async function loadTemplates() {
            const gallery = document.getElementById('templateGallery');
            gallery.innerHTML = '<div style="text-align: center; padding: 20px; color: #8b949e;">ðŸ”„ Cargando plantillas...</div>';
            
            // Plantillas predefinidas con URLs directas de Unsplash (gratis, sin API key)
            allTemplates = [
                // DINERO
                { url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1080&h=1080&fit=crop', category: 'dinero', tags: 'dinero billetes efectivo' },
                { url: 'https://images.unsplash.com/photo-1621981386829-9b458a2cddde?w=1080&h=1080&fit=crop', category: 'dinero', tags: 'monedas oro riqueza' },
                { url: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=1080&h=1080&fit=crop', category: 'dinero', tags: 'dinero efectivo billetes' },
                { url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=1080&h=1080&fit=crop', category: 'dinero', tags: 'dinero monedas ahorro' },
                
                // PRÃ‰STAMOS Y FINANZAS
                { url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1080&h=1080&fit=crop', category: 'prestamos', tags: 'prestamo credito financiero' },
                { url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=1080&h=1080&fit=crop', category: 'finanzas', tags: 'calculadora finanzas prestamo' },
                { url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1080&h=1080&fit=crop', category: 'credito', tags: 'tarjeta credito banco' },
                { url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&h=1080&fit=crop', category: 'inversion', tags: 'inversion grafico crecimiento' },
                
                // OFERTAS
                { url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1080&h=1080&fit=crop', category: 'ofertas', tags: 'oferta descuento promocion' },
                { url: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1080&h=1080&fit=crop', category: 'ofertas', tags: 'descuento oferta venta' },
                { url: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1080&h=1080&fit=crop', category: 'ventas', tags: 'compras ventas carrito' },
                
                // NEGOCIOS
                { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&h=1080&fit=crop', category: 'negocios', tags: 'oficina profesional trabajo' },
                { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1080&h=1080&fit=crop', category: 'equipo', tags: 'equipo trabajo colaboracion' },
                { url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1080&h=1080&fit=crop', category: 'negocios', tags: 'negocios acuerdo contrato' },
                { url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1080&h=1080&fit=crop', category: 'negocios', tags: 'reunion negocios profesional' },
                
                // FONDOS
                { url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1080&h=1080&fit=crop', category: 'fondos', tags: 'fondo azul degradado' },
                { url: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1080&h=1080&fit=crop', category: 'fondos', tags: 'fondo verde moderno' },
                { url: 'https://images.unsplash.com/photo-1557682268-e3955ed5d83f?w=1080&h=1080&fit=crop', category: 'fondos', tags: 'fondo naranja vibrante' },
                { url: 'https://images.unsplash.com/photo-1557682260-96773eb01377?w=1080&h=1080&fit=crop', category: 'fondos', tags: 'fondo morado elegante' }
            ];
            
            displayTemplates(allTemplates);
        }

        function displayTemplates(templates) {
            const gallery = document.getElementById('templateGallery');
            
            if (templates.length === 0) {
                gallery.innerHTML = '<div style="text-align: center; padding: 20px; color: #8b949e;">No se encontraron plantillas</div>';
                return;
            }
            
            gallery.innerHTML = templates.map(template => `
                <div style="position: relative; cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid #2d3748; transition: all 0.2s; background: #1a2332;" 
                     onclick="useTemplate('${template.url}')"
                     onmouseover="this.style.borderColor='#667eea'; this.style.transform='scale(1.05)'"
                     onmouseout="this.style.borderColor='#2d3748'; this.style.transform='scale(1)'">
                    <img src="${template.url}" style="width: 100%; height: 120px; object-fit: cover;">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.9)); padding: 8px 6px; font-size: 10px; color: #e6edf3; font-weight: 600;">
                        ${template.category.toUpperCase()}
                    </div>
                </div>
            `).join('');
        }

        function filterTemplates(query) {
            if (!query.trim()) {
                displayTemplates(allTemplates);
                return;
            }
            
            const filtered = allTemplates.filter(t => 
                t.category.toLowerCase().includes(query.toLowerCase()) ||
                t.tags.toLowerCase().includes(query.toLowerCase())
            );
            displayTemplates(filtered);
        }

        function useTemplate(url) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                // Contar cuÃ¡ntas plantillas ya existen
                const templateCount = editorLayers.filter(l => l.name && l.name.startsWith('Plantilla')).length;
                
                // Crear nueva capa con transformaciÃ³n inicial
                const newLayer = {
                    type: 'image',
                    name: `Plantilla ${templateCount + 1}`,
                    imageData: img,
                    transform: {
                        zoom: 100,
                        posX: 0,
                        posY: 0,
                        rotation: 0
                    },
                    selected: true
                };
                
                // Deseleccionar otras capas
                editorLayers.forEach(layer => layer.selected = false);
                
                // Agregar nueva capa AL INICIO (para que aparezca encima)
                editorLayers.unshift(newLayer);
                
                // Establecer como imagen actual
                editorCurrentImage = img;
                editorOriginalImage = img;
                editorTransform = newLayer.transform;
                
                // ACTIVAR HANDLES VISUALES
                showHandles = true;
                
                // Cambiar cursor a move
                editorCanvas.style.cursor = 'move';
                
                // Guardar estado inicial
                editorSaveState();
                
                // Actualizar lista de capas
                editorUpdateLayers();
                
                // Redibujar TODAS las capas en orden
                editorRedrawCanvas();
                
                console.log('âœ… Plantilla cargada como capa (encima de todo)');
                
                // Mostrar controles rÃ¡pidos de transformaciÃ³n
                document.getElementById('quickTransformControls').style.display = 'block';
            };
            img.onerror = function() {
                alert('Error cargando plantilla. Intenta con otra.');
            };
            img.src = url;
        }

        // STICKERS: Elementos individuales
        async function loadStickers() {
            const gallery = document.getElementById('stickerGallery');
            gallery.innerHTML = '<div style="text-align: center; padding: 20px; color: #8b949e;">ðŸ”„ Cargando stickers...</div>';
            
            // Stickers predefinidos con URLs directas de Flaticon (gratis)
            allStickers = [
                // DINERO
                { url: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png', tags: 'dinero billete dolar efectivo' },
                { url: 'https://cdn-icons-png.flaticon.com/512/3135/3135706.png', tags: 'dinero moneda oro coin' },
                { url: 'https://cdn-icons-png.flaticon.com/512/2936/2936886.png', tags: 'dinero bolsa saco efectivo' },
                { url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', tags: 'ahorro alcancia dinero guardar' },
                
                // FINANZAS
                { url: 'https://cdn-icons-png.flaticon.com/512/2936/2936760.png', tags: 'grafico subida crecimiento exito' },
                { url: 'https://cdn-icons-png.flaticon.com/512/942/942748.png', tags: 'calculadora finanzas calculo' },
                { url: 'https://cdn-icons-png.flaticon.com/512/2695/2695971.png', tags: 'tarjeta credito banco pago' },
                { url: 'https://cdn-icons-png.flaticon.com/512/2936/2936685.png', tags: 'porcentaje descuento oferta' },
                
                // FLECHAS
                { url: 'https://cdn-icons-png.flaticon.com/512/271/271228.png', tags: 'flecha derecha direccion siguiente' },
                { url: 'https://cdn-icons-png.flaticon.com/512/271/271210.png', tags: 'flecha abajo direccion bajar' },
                
                // ICONOS
                { url: 'https://cdn-icons-png.flaticon.com/512/190/190411.png', tags: 'check verde aprobado correcto' },
                { url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png', tags: 'estrella oro premio calidad' },
                { url: 'https://cdn-icons-png.flaticon.com/512/742/742751.png', tags: 'emoji feliz sonrisa contento' },
                { url: 'https://cdn-icons-png.flaticon.com/512/126/126473.png', tags: 'pulgar arriba like aprobado' },
                
                // CONTACTO
                { url: 'https://cdn-icons-png.flaticon.com/512/724/724664.png', tags: 'telefono llamar contacto' },
                { url: 'https://cdn-icons-png.flaticon.com/512/733/733585.png', tags: 'whatsapp mensaje chat contacto' },
                { url: 'https://cdn-icons-png.flaticon.com/512/732/732200.png', tags: 'email correo mensaje contacto' },
                
                // BADGES
                { url: 'https://cdn-icons-png.flaticon.com/512/3524/3524388.png', tags: 'nuevo new badge etiqueta' },
                { url: 'https://cdn-icons-png.flaticon.com/512/2956/2956769.png', tags: 'oferta sale descuento badge' },
                { url: 'https://cdn-icons-png.flaticon.com/512/3524/3524344.png', tags: 'gratis free badge etiqueta' },
                
                // TIEMPO
                { url: 'https://cdn-icons-png.flaticon.com/512/2838/2838779.png', tags: 'reloj tiempo urgente rapido' },
                { url: 'https://cdn-icons-png.flaticon.com/512/747/747310.png', tags: 'calendario fecha dia evento' }
            ];
            
            displayStickers(allStickers);
        }

        function displayStickers(stickers) {
            const gallery = document.getElementById('stickerGallery');
            
            if (stickers.length === 0) {
                gallery.innerHTML = '<div style="text-align: center; padding: 20px; color: #8b949e;">No se encontraron stickers</div>';
                return;
            }
            
            gallery.innerHTML = stickers.map(sticker => `
                <div style="position: relative; cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid #2d3748; background: rgba(255,255,255,0.05); padding: 12px; transition: all 0.2s;" 
                     onclick="addSticker('${sticker.url}')"
                     onmouseover="this.style.borderColor='#667eea'; this.style.transform='scale(1.1)'; this.style.background='rgba(102, 126, 234, 0.1)'"
                     onmouseout="this.style.borderColor='#2d3748'; this.style.transform='scale(1)'; this.style.background='rgba(255,255,255,0.05)'">
                    <img src="${sticker.url}" style="width: 100%; height: 60px; object-fit: contain;">
                </div>
            `).join('');
        }

        function filterStickers(query) {
            if (!query.trim()) {
                displayStickers(allStickers);
                return;
            }
            
            const filtered = allStickers.filter(s => 
                s.tags.toLowerCase().includes(query.toLowerCase())
            );
            displayStickers(filtered);
        }

        // ============================================
        // FUNCIONES DE BORDES
        // ============================================
        
        let editorCurrentBorder = null; // Almacena el borde actual aplicado

        function addBorder(style) {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen base');
                return;
            }
            
            editorSaveState();
            
            // Guardar el estilo de borde seleccionado
            editorCurrentBorder = {
                style: style,
                visible: true
            };
            
            // Redibujar canvas con el borde
            editorRedrawCanvas();
            
            console.log('Borde aplicado:', style);
        }

        function removeBorder() {
            if (!editorCurrentBorder) {
                return;
            }
            
            editorSaveState();
            editorCurrentBorder = null;
            editorRedrawCanvas();
            
            console.log('Borde eliminado');
        }

        function drawBorder(ctx, width, height, style) {
            ctx.save();
            
            switch(style) {
                case 'solid-thin':
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 8;
                    ctx.strokeRect(4, 4, width - 8, height - 8);
                    break;
                    
                case 'solid-medium':
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 16;
                    ctx.strokeRect(8, 8, width - 16, height - 16);
                    break;
                    
                case 'solid-thick':
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 30;
                    ctx.strokeRect(15, 15, width - 30, height - 30);
                    break;
                    
                case 'double-line':
                    // LÃ­nea exterior
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 6;
                    ctx.strokeRect(3, 3, width - 6, height - 6);
                    // LÃ­nea interior
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 6;
                    ctx.strokeRect(18, 18, width - 36, height - 36);
                    break;
                    
                case 'gradient-gold':
                    // Crear gradiente dorado
                    const goldGradient = ctx.createLinearGradient(0, 0, width, height);
                    goldGradient.addColorStop(0, '#f7971e');
                    goldGradient.addColorStop(0.5, '#ffd200');
                    goldGradient.addColorStop(1, '#f7971e');
                    ctx.strokeStyle = goldGradient;
                    ctx.lineWidth = 24;
                    ctx.strokeRect(12, 12, width - 24, height - 24);
                    break;
                    
                case 'gradient-silver':
                    // Crear gradiente plateado
                    const silverGradient = ctx.createLinearGradient(0, 0, width, height);
                    silverGradient.addColorStop(0, '#bdc3c7');
                    silverGradient.addColorStop(0.5, '#ecf0f1');
                    silverGradient.addColorStop(1, '#2c3e50');
                    ctx.strokeStyle = silverGradient;
                    ctx.lineWidth = 24;
                    ctx.strokeRect(12, 12, width - 24, height - 24);
                    break;
                    
                case 'rounded-white':
                    // Fondo blanco con esquinas redondeadas
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    // Recortar imagen con esquinas redondeadas
                    ctx.globalCompositeOperation = 'destination-in';
                    ctx.beginPath();
                    const radius1 = 40;
                    ctx.moveTo(20 + radius1, 20);
                    ctx.lineTo(width - 20 - radius1, 20);
                    ctx.quadraticCurveTo(width - 20, 20, width - 20, 20 + radius1);
                    ctx.lineTo(width - 20, height - 20 - radius1);
                    ctx.quadraticCurveTo(width - 20, height - 20, width - 20 - radius1, height - 20);
                    ctx.lineTo(20 + radius1, height - 20);
                    ctx.quadraticCurveTo(20, height - 20, 20, height - 20 - radius1);
                    ctx.lineTo(20, 20 + radius1);
                    ctx.quadraticCurveTo(20, 20, 20 + radius1, 20);
                    ctx.closePath();
                    ctx.fill();
                    ctx.globalCompositeOperation = 'source-over';
                    break;
                    
                case 'rounded-black':
                    // Borde negro con esquinas redondeadas
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 20;
                    ctx.lineJoin = 'round';
                    ctx.lineCap = 'round';
                    const radius2 = 40;
                    ctx.beginPath();
                    ctx.moveTo(20 + radius2, 20);
                    ctx.lineTo(width - 20 - radius2, 20);
                    ctx.quadraticCurveTo(width - 20, 20, width - 20, 20 + radius2);
                    ctx.lineTo(width - 20, height - 20 - radius2);
                    ctx.quadraticCurveTo(width - 20, height - 20, width - 20 - radius2, height - 20);
                    ctx.lineTo(20 + radius2, height - 20);
                    ctx.quadraticCurveTo(20, height - 20, 20, height - 20 - radius2);
                    ctx.lineTo(20, 20 + radius2);
                    ctx.quadraticCurveTo(20, 20, 20 + radius2, 20);
                    ctx.closePath();
                    ctx.stroke();
                    break;
                    
                case 'shadow-frame':
                    // Borde blanco con sombra
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    ctx.shadowBlur = 30;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 10;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 16;
                    ctx.strokeRect(8, 8, width - 16, height - 16);
                    ctx.shadowColor = 'transparent';
                    break;
                    
                case 'inset-frame':
                    // Marco con efecto hundido
                    // Borde exterior claro
                    ctx.strokeStyle = '#f5f5f5';
                    ctx.lineWidth = 24;
                    ctx.strokeRect(12, 12, width - 24, height - 24);
                    // Sombra interior
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(20, 20, width - 40, height - 40);
                    break;
                    
                case 'premium-gold':
                    // Borde dorado premium con brillo
                    ctx.strokeStyle = '#d4af37';
                    ctx.lineWidth = 30;
                    ctx.strokeRect(15, 15, width - 30, height - 30);
                    // LÃ­nea interior oscura
                    ctx.strokeStyle = '#8b7500';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(28, 28, width - 56, height - 56);
                    // Brillo exterior
                    ctx.shadowColor = 'rgba(212, 175, 55, 0.6)';
                    ctx.shadowBlur = 20;
                    ctx.strokeStyle = '#ffd700';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(15, 15, width - 30, height - 30);
                    ctx.shadowColor = 'transparent';
                    break;
                    
                case 'neon-glow':
                    // Borde neÃ³n con brillo
                    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
                    ctx.shadowBlur = 40;
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 12;
                    ctx.strokeRect(6, 6, width - 12, height - 12);
                    // Segundo brillo mÃ¡s intenso
                    ctx.shadowBlur = 20;
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 6;
                    ctx.strokeRect(6, 6, width - 12, height - 12);
                    ctx.shadowColor = 'transparent';
                    break;
            }
            
            ctx.restore();
        }



        function addSticker(url) {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen base');
                return;
            }
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                editorSaveState();
                
                // Deseleccionar todos los stickers existentes
                editorLayers.forEach(l => {
                    l.selected = false;
                    if (l.type === 'sticker' && l.data) {
                        l.data.selected = false;
                    }
                });
                
                // Agregar sticker como capa movible
                const size = 200;
                const x = (editorCanvas.width - size) / 2;
                const y = (editorCanvas.height - size) / 2;
                
                // Crear objeto sticker movible
                const sticker = {
                    type: 'sticker',
                    image: img,
                    x: x,
                    y: y,
                    width: size,
                    height: size,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    selected: false  // NO seleccionar automÃ¡ticamente
                };
                
                // Agregar a array de capas
                if (!window.editorStickers) {
                    window.editorStickers = [];
                }
                window.editorStickers.unshift(sticker); // unshift = agregar al inicio
                
                // Agregar a sistema de capas AL INICIO (para que aparezca encima)
                editorLayers.unshift({
                    type: 'sticker',
                    name: `Sticker ${editorLayers.filter(l => l.type === 'sticker').length + 1}`,
                    visible: true,
                    selected: false,  // NO seleccionar automÃ¡ticamente
                    data: sticker
                });
                
                // Redibujar canvas con el sticker
                editorRedrawCanvas();
                editorUpdateLayers();
                
                console.log('âœ… Sticker agregado (NO seleccionado)');
            };
            img.onerror = function() {
                alert('Error cargando sticker. Intenta con otro.');
            };
            img.src = url;
        }

        function editorSelectTool(tool, event) {
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.style.borderColor = '#e5e7eb';
                btn.style.background = '#f9fafb';
            });
            if (event && event.target) {
                event.target.closest('.tool-btn').style.borderColor = '#667eea';
                event.target.closest('.tool-btn').style.background = 'rgba(102, 126, 234, 0.1)';
            }

            document.getElementById('editorTransformTools').style.display = tool === 'transform' ? 'block' : 'none';
            document.getElementById('editorTextTools').style.display = tool === 'text' ? 'block' : 'none';
            document.getElementById('editorShapeTools').style.display = tool === 'shape' ? 'block' : 'none';
            document.getElementById('editorCropTools').style.display = tool === 'crop' ? 'block' : 'none';
            document.getElementById('editorFiltersTools').style.display = tool === 'filters' ? 'block' : 'none';
            document.getElementById('editorAdjustTools').style.display = tool === 'adjust' ? 'block' : 'none';
            
            if (tool === 'crop') {
                editorStartCropMode();
            } else {
                editorEndCropMode();
            }
        }

        // Variables para el recorte interactivo
        let editorOriginalImage = null;
        let editorCropMode = false;
        let editorCropRect = { x: 50, y: 50, width: 980, height: 980 };
        let editorDragging = null;
        let editorDragStart = { x: 0, y: 0 };

        function editorStartCropMode() {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen');
                return;
            }
            
            editorCropMode = true;
            editorOriginalImage = editorCurrentImage;
            
            // Inicializar rectÃ¡ngulo de recorte (dejar margen de 50px)
            editorCropRect = { x: 50, y: 50, width: 980, height: 980 };
            
            // Redibujar con overlay de recorte
            editorRedrawWithCrop();
            
            // Agregar event listeners
            editorCanvas.addEventListener('mousedown', editorCropMouseDown);
            editorCanvas.addEventListener('mousemove', editorCropMouseMove);
            editorCanvas.addEventListener('mouseup', editorCropMouseUp);
        }

        function editorEndCropMode() {
            editorCropMode = false;
            editorCanvas.removeEventListener('mousedown', editorCropMouseDown);
            editorCanvas.removeEventListener('mousemove', editorCropMouseMove);
            editorCanvas.removeEventListener('mouseup', editorCropMouseUp);
            editorCanvas.style.cursor = 'default';
        }

        function editorRedrawWithCrop() {
            // Limpiar canvas
            editorCtx.fillStyle = '#2a2a2a';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            
            // Dibujar imagen original
            if (editorOriginalImage) {
                const canvasRatio = editorCanvas.width / editorCanvas.height;
                const imgRatio = editorOriginalImage.width / editorOriginalImage.height;
                
                let drawWidth, drawHeight, offsetX, offsetY;
                
                if (imgRatio > canvasRatio) {
                    drawWidth = editorCanvas.width;
                    drawHeight = editorOriginalImage.height * (editorCanvas.width / editorOriginalImage.width);
                    offsetX = 0;
                    offsetY = (editorCanvas.height - drawHeight) / 2;
                } else {
                    drawHeight = editorCanvas.height;
                    drawWidth = editorOriginalImage.width * (editorCanvas.height / editorOriginalImage.height);
                    offsetX = (editorCanvas.width - drawWidth) / 2;
                    offsetY = 0;
                }
                
                editorCtx.drawImage(editorOriginalImage, offsetX, offsetY, drawWidth, drawHeight);
            }
            
            if (!editorCropMode) return;
            
            // Dibujar overlay oscuro
            editorCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            
            // Limpiar Ã¡rea de recorte
            editorCtx.clearRect(editorCropRect.x, editorCropRect.y, editorCropRect.width, editorCropRect.height);
            
            // Redibujar imagen en Ã¡rea de recorte
            if (editorOriginalImage) {
                editorCtx.save();
                editorCtx.beginPath();
                editorCtx.rect(editorCropRect.x, editorCropRect.y, editorCropRect.width, editorCropRect.height);
                editorCtx.clip();
                
                const canvasRatio = editorCanvas.width / editorCanvas.height;
                const imgRatio = editorOriginalImage.width / editorOriginalImage.height;
                
                let drawWidth, drawHeight, offsetX, offsetY;
                
                if (imgRatio > canvasRatio) {
                    drawWidth = editorCanvas.width;
                    drawHeight = editorOriginalImage.height * (editorCanvas.width / editorOriginalImage.width);
                    offsetX = 0;
                    offsetY = (editorCanvas.height - drawHeight) / 2;
                } else {
                    drawHeight = editorCanvas.height;
                    drawWidth = editorOriginalImage.width * (editorCanvas.height / editorOriginalImage.height);
                    offsetX = (editorCanvas.width - drawWidth) / 2;
                    offsetY = 0;
                }
                
                editorCtx.drawImage(editorOriginalImage, offsetX, offsetY, drawWidth, drawHeight);
                editorCtx.restore();
            }
            
            // Dibujar borde del rectÃ¡ngulo
            editorCtx.strokeStyle = '#667eea';
            editorCtx.lineWidth = 3;
            editorCtx.strokeRect(editorCropRect.x, editorCropRect.y, editorCropRect.width, editorCropRect.height);
            
            // Dibujar puntos de control (esquinas y bordes)
            const handleSize = 12;
            const handles = [
                { x: editorCropRect.x, y: editorCropRect.y, cursor: 'nw-resize', type: 'tl' },
                { x: editorCropRect.x + editorCropRect.width, y: editorCropRect.y, cursor: 'ne-resize', type: 'tr' },
                { x: editorCropRect.x, y: editorCropRect.y + editorCropRect.height, cursor: 'sw-resize', type: 'bl' },
                { x: editorCropRect.x + editorCropRect.width, y: editorCropRect.y + editorCropRect.height, cursor: 'se-resize', type: 'br' },
                { x: editorCropRect.x + editorCropRect.width / 2, y: editorCropRect.y, cursor: 'n-resize', type: 't' },
                { x: editorCropRect.x + editorCropRect.width / 2, y: editorCropRect.y + editorCropRect.height, cursor: 's-resize', type: 'b' },
                { x: editorCropRect.x, y: editorCropRect.y + editorCropRect.height / 2, cursor: 'w-resize', type: 'l' },
                { x: editorCropRect.x + editorCropRect.width, y: editorCropRect.y + editorCropRect.height / 2, cursor: 'e-resize', type: 'r' }
            ];
            
            handles.forEach(handle => {
                editorCtx.fillStyle = '#667eea';
                editorCtx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
                editorCtx.strokeStyle = 'white';
                editorCtx.lineWidth = 2;
                editorCtx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
            });
        }

        function editorGetHandle(x, y) {
            const handleSize = 12;
            const handles = [
                { x: editorCropRect.x, y: editorCropRect.y, cursor: 'nw-resize', type: 'tl' },
                { x: editorCropRect.x + editorCropRect.width, y: editorCropRect.y, cursor: 'ne-resize', type: 'tr' },
                { x: editorCropRect.x, y: editorCropRect.y + editorCropRect.height, cursor: 'sw-resize', type: 'bl' },
                { x: editorCropRect.x + editorCropRect.width, y: editorCropRect.y + editorCropRect.height, cursor: 'se-resize', type: 'br' },
                { x: editorCropRect.x + editorCropRect.width / 2, y: editorCropRect.y, cursor: 'n-resize', type: 't' },
                { x: editorCropRect.x + editorCropRect.width / 2, y: editorCropRect.y + editorCropRect.height, cursor: 's-resize', type: 'b' },
                { x: editorCropRect.x, y: editorCropRect.y + editorCropRect.height / 2, cursor: 'w-resize', type: 'l' },
                { x: editorCropRect.x + editorCropRect.width, y: editorCropRect.y + editorCropRect.height / 2, cursor: 'e-resize', type: 'r' }
            ];
            
            for (let handle of handles) {
                if (Math.abs(x - handle.x) < handleSize && Math.abs(y - handle.y) < handleSize) {
                    return handle;
                }
            }
            
            // Check if inside rect for moving
            if (x > editorCropRect.x && x < editorCropRect.x + editorCropRect.width &&
                y > editorCropRect.y && y < editorCropRect.y + editorCropRect.height) {
                return { cursor: 'move', type: 'move' };
            }
            
            return null;
        }

        function editorCropMouseDown(e) {
            if (!editorCropMode) return;
            
            const rect = editorCanvas.getBoundingClientRect();
            const scaleX = editorCanvas.width / rect.width;
            const scaleY = editorCanvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            const handle = editorGetHandle(x, y);
            if (handle) {
                editorDragging = handle;
                editorDragStart = { x, y };
                editorCanvas.style.cursor = handle.cursor;
            }
        }

        function editorCropMouseMove(e) {
            if (!editorCropMode) return;
            
            const rect = editorCanvas.getBoundingClientRect();
            const scaleX = editorCanvas.width / rect.width;
            const scaleY = editorCanvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            if (editorDragging) {
                const dx = x - editorDragStart.x;
                const dy = y - editorDragStart.y;
                
                const minSize = 100;
                
                switch (editorDragging.type) {
                    case 'tl':
                        if (editorCropRect.width - dx >= minSize && editorCropRect.height - dy >= minSize) {
                            editorCropRect.x += dx;
                            editorCropRect.y += dy;
                            editorCropRect.width -= dx;
                            editorCropRect.height -= dy;
                        }
                        break;
                    case 'tr':
                        if (editorCropRect.width + dx >= minSize && editorCropRect.height - dy >= minSize) {
                            editorCropRect.y += dy;
                            editorCropRect.width += dx;
                            editorCropRect.height -= dy;
                        }
                        break;
                    case 'bl':
                        if (editorCropRect.width - dx >= minSize && editorCropRect.height + dy >= minSize) {
                            editorCropRect.x += dx;
                            editorCropRect.width -= dx;
                            editorCropRect.height += dy;
                        }
                        break;
                    case 'br':
                        if (editorCropRect.width + dx >= minSize && editorCropRect.height + dy >= minSize) {
                            editorCropRect.width += dx;
                            editorCropRect.height += dy;
                        }
                        break;
                    case 't':
                        if (editorCropRect.height - dy >= minSize) {
                            editorCropRect.y += dy;
                            editorCropRect.height -= dy;
                        }
                        break;
                    case 'b':
                        if (editorCropRect.height + dy >= minSize) {
                            editorCropRect.height += dy;
                        }
                        break;
                    case 'l':
                        if (editorCropRect.width - dx >= minSize) {
                            editorCropRect.x += dx;
                            editorCropRect.width -= dx;
                        }
                        break;
                    case 'r':
                        if (editorCropRect.width + dx >= minSize) {
                            editorCropRect.width += dx;
                        }
                        break;
                    case 'move':
                        editorCropRect.x += dx;
                        editorCropRect.y += dy;
                        break;
                }
                
                // Limitar a los bordes del canvas
                editorCropRect.x = Math.max(0, Math.min(editorCropRect.x, editorCanvas.width - editorCropRect.width));
                editorCropRect.y = Math.max(0, Math.min(editorCropRect.y, editorCanvas.height - editorCropRect.height));
                
                editorDragStart = { x, y };
                editorRedrawWithCrop();
            } else {
                const handle = editorGetHandle(x, y);
                editorCanvas.style.cursor = handle ? handle.cursor : 'default';
            }
        }

        function editorCropMouseUp() {
            editorDragging = null;
        }

        function editorApplyCrop() {
            if (!editorOriginalImage || !editorCropMode) {
                alert('No hay imagen para recortar');
                return;
            }
            
            // Crear canvas temporal para recortar
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCanvas.width = editorCropRect.width;
            tempCanvas.height = editorCropRect.height;
            
            // Calcular posiciÃ³n de la imagen original en el canvas
            const canvasRatio = editorCanvas.width / editorCanvas.height;
            const imgRatio = editorOriginalImage.width / editorOriginalImage.height;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (imgRatio > canvasRatio) {
                drawWidth = editorCanvas.width;
                drawHeight = editorOriginalImage.height * (editorCanvas.width / editorOriginalImage.width);
                offsetX = 0;
                offsetY = (editorCanvas.height - drawHeight) / 2;
            } else {
                drawHeight = editorCanvas.height;
                drawWidth = editorOriginalImage.width * (editorCanvas.height / editorOriginalImage.height);
                offsetX = (editorCanvas.width - drawWidth) / 2;
                offsetY = 0;
            }
            
            // Calcular quÃ© parte de la imagen original corresponde al Ã¡rea de recorte
            const scaleX = editorOriginalImage.width / drawWidth;
            const scaleY = editorOriginalImage.height / drawHeight;
            
            const srcX = (editorCropRect.x - offsetX) * scaleX;
            const srcY = (editorCropRect.y - offsetY) * scaleY;
            const srcWidth = editorCropRect.width * scaleX;
            const srcHeight = editorCropRect.height * scaleY;
            
            // Dibujar la parte recortada
            tempCtx.drawImage(
                editorOriginalImage,
                srcX, srcY, srcWidth, srcHeight,
                0, 0, editorCropRect.width, editorCropRect.height
            );
            
            // Crear nueva imagen con el recorte
            const croppedImg = new Image();
            croppedImg.onload = function() {
                editorOriginalImage = croppedImg;
                editorCurrentImage = croppedImg;
                
                // IMPORTANTE: Actualizar la imagen en la capa seleccionada
                const selectedLayer = editorLayers.find(l => l.selected);
                if (selectedLayer && selectedLayer.type === 'image') {
                    selectedLayer.imageData = croppedImg;
                }
                
                editorEndCropMode();
                
                // Redibujar imagen recortada
                editorCtx.fillStyle = '#2a2a2a';
                editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
                
                const canvasRatio = editorCanvas.width / editorCanvas.height;
                const imgRatio = croppedImg.width / croppedImg.height;
                
                let drawWidth, drawHeight, offsetX, offsetY;
                
                if (imgRatio > canvasRatio) {
                    drawWidth = editorCanvas.width;
                    drawHeight = croppedImg.height * (editorCanvas.width / croppedImg.width);
                    offsetX = 0;
                    offsetY = (editorCanvas.height - drawHeight) / 2;
                } else {
                    drawHeight = editorCanvas.height;
                    drawWidth = croppedImg.width * (editorCanvas.height / croppedImg.height);
                    offsetX = (editorCanvas.width - drawWidth) / 2;
                    offsetY = 0;
                }
                
                editorCtx.drawImage(croppedImg, offsetX, offsetY, drawWidth, drawHeight);
                
                // Ocultar herramientas de recorte
                document.getElementById('editorCropTools').style.display = 'none';
            };
            croppedImg.src = tempCanvas.toDataURL();
        }

        function editorCancelCrop() {
            editorEndCropMode();
            editorRedrawWithCrop();
            document.getElementById('editorCropTools').style.display = 'none';
        }

        function editorFitToCanvas() {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen');
                return;
            }

            // Limpiar canvas con fondo gris oscuro
            editorCtx.fillStyle = '#2a2a2a';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            
            // Calcular dimensiones para mostrar toda la imagen (contain)
            const canvasRatio = editorCanvas.width / editorCanvas.height;
            const imgRatio = editorCurrentImage.width / editorCurrentImage.height;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (imgRatio > canvasRatio) {
                drawWidth = editorCanvas.width;
                drawHeight = editorCurrentImage.height * (editorCanvas.width / editorCurrentImage.width);
                offsetX = 0;
                offsetY = (editorCanvas.height - drawHeight) / 2;
            } else {
                drawHeight = editorCanvas.height;
                drawWidth = editorCurrentImage.width * (editorCanvas.height / editorCurrentImage.height);
                offsetX = (editorCanvas.width - drawWidth) / 2;
                offsetY = 0;
            }
            
            editorCtx.drawImage(editorCurrentImage, offsetX, offsetY, drawWidth, drawHeight);
        }

        async function editorGenerateWithAI() {
            const prompt = document.getElementById('editorAiPrompt').value.trim();
            const style = document.getElementById('editorAiStyle').value;

            if (!prompt) {
                alert('Por favor describe quÃ© quieres adicionar a la imagen');
                return;
            }

            document.getElementById('editorLoading').style.display = 'flex';
            
            // NUEVO: Detectar si hay imagen cargada (ADICIONAR elementos)
            const hasBaseImage = editorCurrentImage !== null;
            
            if (hasBaseImage) {
                console.log('ðŸŽ¨ Modo ADICIONAR elementos a imagen existente');
                document.querySelector('#editorLoading .spinner').nextElementSibling.textContent = 'Adicionando elementos con IA...';
                
                // NUEVO: ADICIONAR elementos basados en el prompt
                // Esto funciona 100% sin APIs externas
                try {
                    editorSaveState();
                    
                    // Analizar el prompt para detectar quÃ© adicionar
                    const promptLower = prompt.toLowerCase();
                    
                    console.log('ðŸŽ¨ Analizando quÃ© adicionar:', prompt);
                    
                    let elementosAdicionados = [];
                    
                    // DETECTAR: Marco/Borde de anuncio
                    if (promptLower.includes('marco') || promptLower.includes('borde') || 
                        promptLower.includes('anuncio al rededor') || promptLower.includes('alrededor')) {
                        console.log('ðŸ–¼ï¸ Adicionando marco de anuncio');
                        
                        // Dibujar marco decorativo
                        editorCtx.strokeStyle = '#3b82f6';
                        editorCtx.lineWidth = 20;
                        editorCtx.strokeRect(10, 10, editorCanvas.width - 20, editorCanvas.height - 20);
                        
                        // Marco interno
                        editorCtx.strokeStyle = '#1e40af';
                        editorCtx.lineWidth = 5;
                        editorCtx.strokeRect(30, 30, editorCanvas.width - 60, editorCanvas.height - 60);
                        
                        elementosAdicionados.push('Marco decorativo azul');
                    }
                    
                    // DETECTAR: Texto de prÃ©stamos/financiamiento
                    if (promptLower.includes('prÃ©stamo') || promptLower.includes('prestamo') || 
                        promptLower.includes('financiamiento') || promptLower.includes('crÃ©dito') ||
                        promptLower.includes('credito') || promptLower.includes('dinero')) {
                        console.log('ðŸ’° Adicionando texto de prÃ©stamos');
                        
                        // Fondo semi-transparente para el texto
                        editorCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                        editorCtx.fillRect(0, editorCanvas.height - 150, editorCanvas.width, 150);
                        
                        // Texto principal
                        editorCtx.font = 'bold 48px Inter, Arial';
                        editorCtx.fillStyle = '#00d95f';
                        editorCtx.textAlign = 'center';
                        editorCtx.fillText('ðŸ’° PRÃ‰STAMOS RÃPIDOS', editorCanvas.width / 2, editorCanvas.height - 90);
                        
                        // Texto secundario
                        editorCtx.font = 'bold 32px Inter, Arial';
                        editorCtx.fillStyle = '#ffffff';
                        editorCtx.fillText('AprobaciÃ³n en 24 horas', editorCanvas.width / 2, editorCanvas.height - 40);
                        
                        elementosAdicionados.push('Texto de prÃ©stamos rÃ¡pidos');
                    }
                    
                    // DETECTAR: Texto de oferta/descuento
                    if (promptLower.includes('oferta') || promptLower.includes('descuento') || 
                        promptLower.includes('promociÃ³n') || promptLower.includes('promocion') ||
                        promptLower.includes('%') || promptLower.includes('rebaja')) {
                        console.log('ðŸŽ‰ Adicionando texto de oferta');
                        
                        // Badge de oferta en esquina superior derecha
                        editorCtx.fillStyle = '#ef4444';
                        editorCtx.beginPath();
                        editorCtx.arc(editorCanvas.width - 100, 100, 80, 0, Math.PI * 2);
                        editorCtx.fill();
                        
                        // Borde del badge
                        editorCtx.strokeStyle = '#ffffff';
                        editorCtx.lineWidth = 5;
                        editorCtx.stroke();
                        
                        // Texto del badge
                        editorCtx.font = 'bold 36px Inter, Arial';
                        editorCtx.fillStyle = '#ffffff';
                        editorCtx.textAlign = 'center';
                        editorCtx.fillText('50%', editorCanvas.width - 100, 95);
                        editorCtx.font = 'bold 24px Inter, Arial';
                        editorCtx.fillText('OFF', editorCanvas.width - 100, 125);
                        
                        elementosAdicionados.push('Badge de oferta 50% OFF');
                    }
                    
                    // DETECTAR: Logo o marca
                    if (promptLower.includes('logo') || promptLower.includes('marca')) {
                        console.log('ðŸ·ï¸ Adicionando espacio para logo');
                        
                        // CÃ­rculo para logo en esquina superior izquierda
                        editorCtx.fillStyle = '#ffffff';
                        editorCtx.beginPath();
                        editorCtx.arc(100, 100, 70, 0, Math.PI * 2);
                        editorCtx.fill();
                        
                        // Borde
                        editorCtx.strokeStyle = '#3b82f6';
                        editorCtx.lineWidth = 5;
                        editorCtx.stroke();
                        
                        // Texto placeholder
                        editorCtx.font = 'bold 28px Inter, Arial';
                        editorCtx.fillStyle = '#3b82f6';
                        editorCtx.textAlign = 'center';
                        editorCtx.fillText('LOGO', 100, 110);
                        
                        elementosAdicionados.push('Espacio para logo');
                    }
                    
                    // DETECTAR: Llamado a la acciÃ³n (CTA)
                    if (promptLower.includes('llamado') || promptLower.includes('acciÃ³n') || 
                        promptLower.includes('accion') || promptLower.includes('cta') ||
                        promptLower.includes('botÃ³n') || promptLower.includes('boton') ||
                        promptLower.includes('contacto') || promptLower.includes('whatsapp')) {
                        console.log('ðŸ“ž Adicionando llamado a la acciÃ³n');
                        
                        // BotÃ³n CTA en la parte inferior
                        const btnWidth = 400;
                        const btnHeight = 80;
                        const btnX = (editorCanvas.width - btnWidth) / 2;
                        const btnY = editorCanvas.height - 120;
                        
                        // Sombra del botÃ³n
                        editorCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                        editorCtx.fillRect(btnX + 5, btnY + 5, btnWidth, btnHeight);
                        
                        // BotÃ³n
                        editorCtx.fillStyle = '#00d95f';
                        editorCtx.fillRect(btnX, btnY, btnWidth, btnHeight);
                        
                        // Texto del botÃ³n
                        editorCtx.font = 'bold 36px Inter, Arial';
                        editorCtx.fillStyle = '#ffffff';
                        editorCtx.textAlign = 'center';
                        editorCtx.fillText('ðŸ“ž CONTÃCTANOS', editorCanvas.width / 2, btnY + 52);
                        
                        elementosAdicionados.push('BotÃ³n de llamado a la acciÃ³n');
                    }
                    
                    // DETECTAR: Texto personalizado genÃ©rico
                    if (promptLower.includes('texto') || promptLower.includes('escribe') || 
                        promptLower.includes('pon') || promptLower.includes('agrega')) {
                        // Si no se detectÃ³ ningÃºn tipo especÃ­fico, agregar texto genÃ©rico
                        if (elementosAdicionados.length === 0) {
                            console.log('ðŸ“ Adicionando texto personalizado');
                            
                            // Fondo para texto
                            editorCtx.fillStyle = 'rgba(59, 130, 246, 0.9)';
                            editorCtx.fillRect(50, editorCanvas.height / 2 - 60, editorCanvas.width - 100, 120);
                            
                            // Texto
                            editorCtx.font = 'bold 42px Inter, Arial';
                            editorCtx.fillStyle = '#ffffff';
                            editorCtx.textAlign = 'center';
                            editorCtx.fillText(prompt.substring(0, 30), editorCanvas.width / 2, editorCanvas.height / 2 + 15);
                            
                            elementosAdicionados.push('Texto personalizado');
                        }
                    }
                    
                    // Si no se detectÃ³ nada especÃ­fico, agregar banner genÃ©rico
                    if (elementosAdicionados.length === 0) {
                        console.log('ðŸŽ¨ Adicionando banner genÃ©rico');
                        
                        // Banner superior
                        editorCtx.fillStyle = 'rgba(59, 130, 246, 0.85)';
                        editorCtx.fillRect(0, 0, editorCanvas.width, 100);
                        
                        // Texto del banner
                        editorCtx.font = 'bold 48px Inter, Arial';
                        editorCtx.fillStyle = '#ffffff';
                        editorCtx.textAlign = 'center';
                        editorCtx.fillText('âœ¨ ' + prompt.substring(0, 25), editorCanvas.width / 2, 65);
                        
                        elementosAdicionados.push('Banner superior con texto');
                    }
                    
                    // Actualizar imagen actual
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = editorCanvas.width;
                    tempCanvas.height = editorCanvas.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(editorCanvas, 0, 0);
                    
                    const modifiedImg = new Image();
                    modifiedImg.onload = function() {
                        editorCurrentImage = modifiedImg;
                        document.getElementById('editorLoading').style.display = 'none';
                        
                        const mensaje = 'âœ… Â¡Elementos adicionados con IA!\n\n' +
                                      'ðŸŽ¨ Elementos agregados:\n' +
                                      elementosAdicionados.map(e => 'â€¢ ' + e).join('\n') +
                                      '\n\nðŸ’¡ Tip: Prueba comandos como:\n' +
                                      'â€¢ "pon marco al rededor"\n' +
                                      'â€¢ "agrega texto de prÃ©stamos"\n' +
                                      'â€¢ "pon logo"\n' +
                                      'â€¢ "agrega botÃ³n de contacto"';
                        
                        alert(mensaje);
                    };
                    modifiedImg.src = tempCanvas.toDataURL('image/png', 1.0);
                    
                    return;
                    
                } catch (error) {
                    console.error('âŒ Error adicionando elementos:', error);
                    document.getElementById('editorLoading').style.display = 'none';
                    alert('âŒ Error al adicionar elementos: ' + error.message);
                    return;
                }
            }

            // Si NO hay imagen cargada, mostrar mensaje
            document.getElementById('editorLoading').style.display = 'none';
            alert('âš ï¸ Primero carga una imagen\n\nðŸ“¸ Usa "Subir Imagen" para cargar tu foto\n\nðŸ’¡ Luego usa "Generar con IA" para adicionar:\nâ€¢ Marcos y bordes\nâ€¢ Texto de anuncios\nâ€¢ Logos y marcas\nâ€¢ Botones de contacto\nâ€¢ Y mucho mÃ¡s segÃºn lo que escribas');
            return;
        }

        function editorDrawImage(img, transform = null, mode = null) {
            if (!transform) {
                transform = { zoom: 100, posX: 0, posY: 0, rotation: 0 };
            }
            
            if (!mode) {
                mode = document.getElementById('editorFitMode') ? document.getElementById('editorFitMode').value : 'contain';
            }
            
            const scale = transform.zoom / 100;
            const canvasRatio = editorCanvas.width / editorCanvas.height;
            const imgRatio = img.width / img.height;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (mode === 'contain') {
                // Mostrar toda la imagen
                if (imgRatio > canvasRatio) {
                    drawWidth = editorCanvas.width * scale;
                    drawHeight = img.height * (editorCanvas.width / img.width) * scale;
                    offsetX = (editorCanvas.width - drawWidth) / 2;
                    offsetY = (editorCanvas.height - drawHeight) / 2;
                } else {
                    drawHeight = editorCanvas.height * scale;
                    drawWidth = img.width * (editorCanvas.height / img.height) * scale;
                    offsetX = (editorCanvas.width - drawWidth) / 2;
                    offsetY = (editorCanvas.height - drawHeight) / 2;
                }
            } else if (mode === 'cover') {
                // Llenar todo el canvas
                if (imgRatio > canvasRatio) {
                    drawHeight = editorCanvas.height * scale;
                    drawWidth = img.width * (editorCanvas.height / img.height) * scale;
                    offsetX = (editorCanvas.width - drawWidth) / 2;
                    offsetY = 0;
                } else {
                    drawWidth = editorCanvas.width * scale;
                    drawHeight = img.height * (editorCanvas.width / img.width) * scale;
                    offsetX = 0;
                    offsetY = (editorCanvas.height - drawHeight) / 2;
                }
            } else if (mode === 'stretch') {
                // Estirar para llenar
                drawWidth = editorCanvas.width * scale;
                drawHeight = editorCanvas.height * scale;
                offsetX = (editorCanvas.width - drawWidth) / 2;
                offsetY = (editorCanvas.height - drawHeight) / 2;
            }
            
            // Aplicar posiciÃ³n personalizada
            offsetX += transform.posX;
            offsetY += transform.posY;
            
            // Aplicar rotaciÃ³n si existe
            if (transform.rotation !== 0) {
                editorCtx.save();
                editorCtx.translate(editorCanvas.width / 2, editorCanvas.height / 2);
                editorCtx.rotate((transform.rotation * Math.PI) / 180);
                editorCtx.drawImage(img, 
                    -drawWidth / 2 + (offsetX - editorCanvas.width / 2), 
                    -drawHeight / 2 + (offsetY - editorCanvas.height / 2), 
                    drawWidth, 
                    drawHeight);
                editorCtx.restore();
            } else {
                editorCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            }
            
            // GUARDAR rectÃ¡ngulo de la imagen para los handles (solo si es la imagen actual)
            if (img === editorCurrentImage) {
                imageRect = { x: offsetX, y: offsetY, width: drawWidth, height: drawHeight };
            }
        }

        function editorChangeFitMode() {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen');
                return;
            }
            
            // Limpiar canvas
            editorCtx.fillStyle = '#2a2a2a';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            
            // Redibujar con nuevo modo
            editorDrawImage(editorCurrentImage);
        }

        function editorLoadImage(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Guardar imagen original
                    editorOriginalImage = img;
                    
                    // Crear nueva capa con transformaciÃ³n inicial
                    const newLayer = {
                        type: 'image',
                        name: `Imagen ${editorLayers.filter(l => l.type === 'image').length + 1}`,
                        imageData: img,
                        transform: {
                            zoom: 100,
                            posX: 0,
                            posY: 0,
                            rotation: 0
                        },
                        selected: true
                    };
                    
                    // Deseleccionar otras capas
                    editorLayers.forEach(layer => layer.selected = false);
                    
                    // Agregar nueva capa AL INICIO (para que aparezca encima)
                    editorLayers.unshift(newLayer);
                    
                    // Establecer como imagen actual
                    editorCurrentImage = img;
                    editorTransform = newLayer.transform;
                    
                    // ACTIVAR HANDLES VISUALES
                    showHandles = true;
                    
                    // Cambiar cursor a grab
                    editorCanvas.style.cursor = 'move';
                    
                    // Guardar estado inicial
                    editorSaveState();
                    
                    // Actualizar lista de capas
                    editorUpdateLayers();
                    
                    // Redibujar TODAS las capas en orden
                    editorRedrawCanvas();
                    
                    console.log('âœ… Imagen cargada como capa (encima de todo)');
                    
                    // Mostrar controles rÃ¡pidos de transformaciÃ³n
                    document.getElementById('quickTransformControls').style.display = 'block';
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function editorAddText() {
            const text = document.getElementById('editorTextInput').value;
            const fontSize = document.getElementById('editorFontSize').value;
            const color = document.getElementById('editorTextColor').value;

            if (!text) {
                alert('Escribe un texto');
                return;
            }

            editorSaveState();
            editorCtx.font = `bold ${fontSize}px Inter`;
            editorCtx.fillStyle = color;
            editorCtx.textAlign = 'center';
            editorCtx.fillText(text, editorCanvas.width / 2, editorCanvas.height / 2);

            editorLayers.unshift({
                type: 'text',
                name: `Texto: ${text.substring(0, 20)}`
            });
            editorUpdateLayers();
        }

        function editorAddShape() {
            const type = document.getElementById('editorShapeType').value;
            const color = document.getElementById('editorShapeColor').value;

            editorSaveState();
            editorCtx.fillStyle = color;
            
            const x = editorCanvas.width / 2 - 150;
            const y = editorCanvas.height / 2 - 150;
            const size = 300;

            if (type === 'rectangle') {
                editorCtx.fillRect(x, y, size, size);
            } else if (type === 'circle') {
                editorCtx.beginPath();
                editorCtx.arc(editorCanvas.width / 2, editorCanvas.height / 2, size / 2, 0, Math.PI * 2);
                editorCtx.fill();
            }

            editorLayers.unshift({
                type: 'shape',
                name: `Forma: ${type}`
            });
            editorUpdateLayers();
        }

        function editorUpdateLayers() {
            const list = document.getElementById('editorLayersList');
            list.innerHTML = editorLayers.map((layer, i) => `
                <div class="layer-item ${layer.selected ? 'selected' : ''}" 
                     draggable="true" 
                     data-index="${i}"
                     onclick="editorSelectLayer(${i})"
                     ondragstart="editorLayerDragStart(event, ${i})"
                     ondragover="editorLayerDragOver(event)"
                     ondrop="editorLayerDrop(event, ${i})"
                     ondragend="editorLayerDragEnd(event)"
                     style="padding: 12px; background: ${layer.selected ? '#dbeafe' : '#f9fafb'}; border: 2px solid ${layer.selected ? '#3b82f6' : '#e5e7eb'}; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; cursor: move; transition: all 0.2s;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px; color: ${layer.selected ? '#1e40af' : '#9ca3af'};">â˜°</span>
                        <span style="font-size: 14px; font-weight: 700; color: ${layer.selected ? '#1e3a8a' : '#374151'};">${layer.name}</span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button onclick="event.stopPropagation(); editorDeleteLayer(${i})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">ðŸ—‘ï¸</button>
                    </div>
                </div>
            `).join('');
        }

        let editorDraggedLayerIndex = null;

        function editorLayerDragStart(event, index) {
            editorDraggedLayerIndex = index;
            event.dataTransfer.effectAllowed = 'move';
            event.target.style.opacity = '0.5';
        }

        function editorLayerDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        }

        function editorLayerDrop(event, targetIndex) {
            event.preventDefault();
            if (editorDraggedLayerIndex !== null && editorDraggedLayerIndex !== targetIndex) {
                const draggedLayer = editorLayers[editorDraggedLayerIndex];
                editorLayers.splice(editorDraggedLayerIndex, 1);
                editorLayers.splice(targetIndex, 0, draggedLayer);
                editorUpdateLayers();
                editorRedrawCanvas();
            }
        }

        function editorLayerDragEnd(event) {
            event.target.style.opacity = '1';
            editorDraggedLayerIndex = null;
        }

        function editorSelectLayer(index) {
            // Deseleccionar todas las capas
            editorLayers.forEach((layer, i) => {
                layer.selected = (i === index);
                // Deseleccionar stickers
                if (layer.type === 'sticker' && layer.data) {
                    layer.data.selected = (i === index);
                }
            });
            
            // Establecer la capa seleccionada
            const selectedLayer = editorLayers[index];
            
            if (selectedLayer.type === 'image' && selectedLayer.imageData) {
                // Seleccionar imagen
                editorCurrentImage = selectedLayer.imageData;
                editorTransform = selectedLayer.transform;
                showHandles = true;
            } else if (selectedLayer.type === 'sticker' && selectedLayer.data) {
                // Seleccionar sticker - OCULTAR handles de imagen
                showHandles = false;
                selectedLayer.data.selected = true;
            }
            
            // Actualizar UI
            editorUpdateLayers();
            
            // Redibujar canvas para mostrar handles en la capa seleccionada
            editorRedrawCanvas();
            
            console.log('Capa seleccionada:', selectedLayer.name, 'Tipo:', selectedLayer.type);
        }

        function editorRedrawCanvas() {
            // Resetear cualquier transformaciÃ³n o clipping del contexto
            editorCtx.setTransform(1, 0, 0, 1, 0, 0);
            editorCtx.globalCompositeOperation = 'source-over';
            
            // Limpiar canvas completamente
            editorCtx.fillStyle = '#2a2a2a';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            
            // Redibujar todas las capas en orden INVERSO (Ãºltima capa primero = abajo, primera capa Ãºltima = arriba)
            // Esto hace que la primera capa de la lista aparezca ENCIMA de todas las demÃ¡s
            for (let i = editorLayers.length - 1; i >= 0; i--) {
                const layer = editorLayers[i];
                if (layer.type === 'image' && layer.imageData) {
                    // Dibujar la imagen de la capa con su transformaciÃ³n
                    editorDrawImage(layer.imageData, layer.transform);
                } else if (layer.type === 'sticker' && layer.data && layer.visible) {
                    // Dibujar sticker
                    const sticker = layer.data;
                    editorCtx.save();
                    editorCtx.globalAlpha = sticker.opacity || 1;
                    
                    // Aplicar rotaciÃ³n si existe
                    if (sticker.rotation) {
                        editorCtx.translate(sticker.x + sticker.width / 2, sticker.y + sticker.height / 2);
                        editorCtx.rotate(sticker.rotation * Math.PI / 180);
                        editorCtx.drawImage(sticker.image, -sticker.width / 2, -sticker.height / 2, sticker.width, sticker.height);
                    } else {
                        editorCtx.drawImage(sticker.image, sticker.x, sticker.y, sticker.width, sticker.height);
                    }
                    
                    // Dibujar borde si estÃ¡ seleccionado
                    if (sticker.selected) {
                        editorCtx.strokeStyle = '#3b82f6';
                        editorCtx.lineWidth = 3;
                        editorCtx.strokeRect(sticker.x, sticker.y, sticker.width, sticker.height);
                        
                        // Dibujar handles de redimensionamiento
                        const handleSize = 12;
                        editorCtx.fillStyle = '#ffffff';
                        editorCtx.strokeStyle = '#3b82f6';
                        editorCtx.lineWidth = 2;
                        
                        // Esquinas
                        const corners = [
                            { x: sticker.x, y: sticker.y }, // top-left
                            { x: sticker.x + sticker.width, y: sticker.y }, // top-right
                            { x: sticker.x, y: sticker.y + sticker.height }, // bottom-left
                            { x: sticker.x + sticker.width, y: sticker.y + sticker.height } // bottom-right
                        ];
                        
                        corners.forEach(corner => {
                            editorCtx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
                            editorCtx.strokeRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
                        });
                    }
                    
                    editorCtx.restore();
                }
            }
            
            // Dibujar handles solo para la capa seleccionada
            if (showHandles && editorCurrentImage) {
                drawImageHandles();
            }
            
            // Dibujar borde si estÃ¡ activo (SIEMPRE AL FINAL, encima de todo)
            if (editorCurrentBorder && editorCurrentBorder.visible) {
                drawBorder(editorCtx, editorCanvas.width, editorCanvas.height, editorCurrentBorder.style);
            }
        }

        function editorDeleteLayer(index) {
            editorLayers.splice(index, 1);
            editorCtx.fillStyle = '#2a2a2a'; // Gris oscuro
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            if (editorCurrentImage) {
                editorCtx.drawImage(editorCurrentImage, 0, 0, editorCanvas.width, editorCanvas.height);
            }
            editorUpdateLayers();
        }

        function editorClearCanvas() {
            if (confirm('Â¿Limpiar todo el canvas?')) {
                editorCtx.fillStyle = '#2a2a2a'; // Gris oscuro
                editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
                editorLayers = [];
                editorCurrentImage = null;
                editorUpdateLayers();
            }
        }

        function editorDownloadImage() {
            const link = document.createElement('a');
            link.download = `vectora-${Date.now()}.png`;
            link.href = editorCanvas.toDataURL();
            link.click();
        }

        function editorSendToWhatsApp() {
            if (!editorCurrentImage) {
                alert('âš ï¸ Primero carga o genera una imagen');
                return;
            }

            // Pedir nÃºmero de WhatsApp
            const phoneNumber = prompt('ðŸ“± Ingresa el nÃºmero de WhatsApp (con cÃ³digo de paÃ­s):\n\nEjemplo: 5511999999999\n(Brasil: 55, MÃ©xico: 52, Colombia: 57)');
            
            if (!phoneNumber) {
                return; // Usuario cancelÃ³
            }

            // Limpiar el nÃºmero (quitar espacios, guiones, etc.)
            const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
            
            if (cleanPhone.length < 10) {
                alert('âŒ NÃºmero invÃ¡lido. Debe tener al menos 10 dÃ­gitos.');
                return;
            }

            // Convertir imagen a base64
            const imageData = editorCanvas.toDataURL('image/png');
            
            // Crear mensaje con la imagen
            const message = `Â¡Mira esta imagen que creÃ© para ti! ðŸŽ¨`;
            
            // Abrir WhatsApp con el mensaje
            // Nota: WhatsApp Web no soporta enviar imÃ¡genes directamente por URL
            // Pero podemos abrir el chat y el usuario puede pegar la imagen
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
            
            // Copiar imagen al portapapeles
            editorCanvas.toBlob(function(blob) {
                try {
                    // Intentar copiar al portapapeles
                    const item = new ClipboardItem({ 'image/png': blob });
                    navigator.clipboard.write([item]).then(() => {
                        alert('âœ… Imagen copiada al portapapeles!\n\nðŸ“± Se abrirÃ¡ WhatsApp. Pega la imagen (Ctrl+V) en el chat.');
                        window.open(whatsappUrl, '_blank');
                    }).catch(() => {
                        // Si falla, solo abrir WhatsApp
                        alert('ðŸ“± Se abrirÃ¡ WhatsApp.\n\nðŸ’¡ Tip: Descarga la imagen y envÃ­ala manualmente.');
                        window.open(whatsappUrl, '_blank');
                    });
                } catch (error) {
                    // Fallback: solo abrir WhatsApp
                    alert('ðŸ“± Se abrirÃ¡ WhatsApp.\n\nðŸ’¡ Tip: Descarga la imagen y envÃ­ala manualmente.');
                    window.open(whatsappUrl, '_blank');
                }
            });
        }

        // Variable global para guardar el estado sin borde
        let editorImageWithoutBorder = null;
        let currentBorderStyle = null;

        function applyBorder(type, color, width) {
            if (!editorCurrentImage) {
                alert('âš ï¸ Primero carga una imagen');
                return;
            }

            // Guardar estado actual sin borde si no existe
            if (!editorImageWithoutBorder) {
                editorImageWithoutBorder = editorCanvas.toDataURL();
            }

            // Crear canvas temporal para aplicar el borde
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCanvas.width = editorCanvas.width;
            tempCanvas.height = editorCanvas.height;

            // Copiar contenido actual
            tempCtx.drawImage(editorCanvas, 0, 0);

            // Aplicar el borde segÃºn el tipo
            switch(type) {
                case 'simple':
                    tempCtx.strokeStyle = color;
                    tempCtx.lineWidth = width;
                    tempCtx.strokeRect(width/2, width/2, tempCanvas.width - width, tempCanvas.height - width);
                    break;

                case 'double':
                    tempCtx.strokeStyle = color;
                    tempCtx.lineWidth = width;
                    // Borde exterior
                    tempCtx.strokeRect(width, width, tempCanvas.width - width*2, tempCanvas.height - width*2);
                    // Borde interior
                    tempCtx.strokeRect(width*2.5, width*2.5, tempCanvas.width - width*5, tempCanvas.height - width*5);
                    break;

                case 'rounded':
                    tempCtx.strokeStyle = color;
                    tempCtx.lineWidth = width;
                    const radius = 30;
                    tempCtx.beginPath();
                    tempCtx.moveTo(width + radius, width);
                    tempCtx.lineTo(tempCanvas.width - width - radius, width);
                    tempCtx.arcTo(tempCanvas.width - width, width, tempCanvas.width - width, width + radius, radius);
                    tempCtx.lineTo(tempCanvas.width - width, tempCanvas.height - width - radius);
                    tempCtx.arcTo(tempCanvas.width - width, tempCanvas.height - width, tempCanvas.width - width - radius, tempCanvas.height - width, radius);
                    tempCtx.lineTo(width + radius, tempCanvas.height - width);
                    tempCtx.arcTo(width, tempCanvas.height - width, width, tempCanvas.height - width - radius, radius);
                    tempCtx.lineTo(width, width + radius);
                    tempCtx.arcTo(width, width, width + radius, width, radius);
                    tempCtx.closePath();
                    tempCtx.stroke();
                    break;

                case 'shadow':
                    // Agregar sombra alrededor
                    tempCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    tempCtx.shadowBlur = 30;
                    tempCtx.shadowOffsetX = 0;
                    tempCtx.shadowOffsetY = 10;
                    tempCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                    tempCtx.lineWidth = 1;
                    tempCtx.strokeRect(20, 20, tempCanvas.width - 40, tempCanvas.height - 40);
                    break;

                case 'gradient':
                    // Crear gradiente
                    const gradient = tempCtx.createLinearGradient(0, 0, tempCanvas.width, tempCanvas.height);
                    gradient.addColorStop(0, '#667eea');
                    gradient.addColorStop(1, '#764ba2');
                    tempCtx.strokeStyle = gradient;
                    tempCtx.lineWidth = width;
                    tempCtx.strokeRect(width/2, width/2, tempCanvas.width - width, tempCanvas.height - width);
                    break;

                case 'textspace-top':
                    // Barra superior para texto
                    tempCtx.fillStyle = color;
                    tempCtx.fillRect(0, 0, tempCanvas.width, width);
                    break;

                case 'textspace-bottom':
                    // Barra inferior para texto
                    tempCtx.fillStyle = color;
                    tempCtx.fillRect(0, tempCanvas.height - width, tempCanvas.width, width);
                    break;

                case 'frame':
                    // Marco decorativo con doble lÃ­nea
                    tempCtx.strokeStyle = color;
                    tempCtx.lineWidth = width;
                    tempCtx.strokeRect(width/2, width/2, tempCanvas.width - width, tempCanvas.height - width);
                    
                    // LÃ­nea interior blanca
                    tempCtx.strokeStyle = '#ffffff';
                    tempCtx.lineWidth = 3;
                    tempCtx.strokeRect(width - 5, width - 5, tempCanvas.width - (width*2) + 10, tempCanvas.height - (width*2) + 10);
                    break;
            }

            // Aplicar el resultado al canvas principal
            editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
            editorCtx.drawImage(tempCanvas, 0, 0);

            // Guardar estilo actual
            currentBorderStyle = { type, color, width };

            console.log('âœ… Borde aplicado:', type);
        }

        function removeBorder() {
            if (!editorImageWithoutBorder) {
                alert('â„¹ï¸ No hay borde para quitar');
                return;
            }

            // Restaurar imagen sin borde
            const img = new Image();
            img.onload = function() {
                editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
                editorCtx.fillStyle = '#2a2a2a';
                editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
                editorCtx.drawImage(img, 0, 0);
                
                // Limpiar estado
                editorImageWithoutBorder = null;
                currentBorderStyle = null;
                
                console.log('âœ… Borde removido');
            };
            img.src = editorImageWithoutBorder;
        }

        function editorUseInCampaign() {
            if (!editorCurrentImage) {
                alert('âš ï¸ Primero carga o genera una imagen');
                return;
            }
            
            // IMPORTANTE: Deseleccionar todos los stickers antes de capturar
            editorLayers.forEach(layer => {
                if (layer.type === 'sticker' && layer.data) {
                    layer.data.selected = false;
                }
                // TambiÃ©n deseleccionar capas de imagen
                layer.selected = false;
            });
            
            // Ocultar handles de la imagen
            showHandles = false;
            
            // Redibujar canvas sin bordes de selecciÃ³n
            editorRedrawCanvas();
            
            // Esperar un momento para que se redibuje
            setTimeout(() => {
                const imageUrl = editorCanvas.toDataURL('image/png', 1.0);
                
                // Guardar imagen en variable global
                window.editorImageForCampaign = imageUrl;
                
                console.log('ðŸ“Š editorUseInCampaign ejecutada - Imagen sin handles capturada');
                
                // Remover active de todos los nav-items
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                
                // Buscar y activar el nav-item de CampaÃ±as
                const navItems = document.querySelectorAll('.nav-item');
                navItems.forEach(item => {
                    if (item.textContent.trim().includes('CampaÃ±as')) {
                        item.classList.add('active');
                        console.log('âœ… Nav item CampaÃ±as activado');
                    }
                });
                
                // Ocultar todas las secciones
                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.remove('active');
                    section.style.display = 'none';
                });
                
                // Mostrar secciÃ³n de campaÃ±as
                const campaignsSection = document.getElementById('campaignsSection');
                if (campaignsSection) {
                    campaignsSection.classList.add('active');
                    campaignsSection.style.display = 'block';
                    console.log('âœ… SecciÃ³n de campaÃ±as mostrada');
                }
                
                // Insertar imagen en los campos correspondientes
                setTimeout(() => {
                    // Campo URL de imagen (Paso 1)
                    const imageUrlInput = document.getElementById('imageUrl');
                    if (imageUrlInput) {
                        imageUrlInput.value = imageUrl;
                    }
                    
                    // TambiÃ©n guardar en selectedImage para compatibilidad
                    selectedImage = imageUrl;
                    
                    // Vista previa de imagen (Paso 2)
                    const previewImage = document.getElementById('previewImage');
                    if (previewImage) {
                        previewImage.src = imageUrl;
                        previewImage.style.display = 'block';
                    }
                    
                    // Ocultar mensaje de "no hay imagen"
                    const noImageMessage = document.getElementById('noImageMessage');
                    if (noImageMessage) {
                        noImageMessage.style.display = 'none';
                    }
                    
                    // Ir al paso 1 (inicio del formulario)
                    goToStep(1);
                    
                    alert('âœ… Imagen cargada en la campaÃ±a!\n\nCompleta los detalles y continÃºa.');
                }, 200);
            }, 100);
        }

        // Actualizar presupuesto semanal cuando cambia el diario
        function updateWeeklyBudget() {
            const dailyBudget = document.getElementById('dailyBudget');
            const weeklyDisplay = document.getElementById('weeklyBudgetDisplay');
            
            if (dailyBudget && weeklyDisplay) {
                const daily = parseFloat(dailyBudget.value) || 20;
                const weekly = daily * 7;
                weeklyDisplay.textContent = weekly.toFixed(0);
            }
        }

        // Generar link de WhatsApp con imagen automÃ¡tica
        function generateWhatsAppLink() {
            // Pedir nÃºmero de WhatsApp
            const phone = prompt('ðŸ“± Ingresa el nÃºmero de WhatsApp del cliente:\n\nFormato: CÃ³digo de paÃ­s + nÃºmero\nEjemplo: 5511999999999 (Brasil)\n\nSin espacios, guiones ni sÃ­mbolos');
            
            if (!phone) {
                return; // Usuario cancelÃ³
            }
            
            // Validar que sea un nÃºmero
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            if (cleanPhone.length < 10) {
                alert('âŒ NÃºmero invÃ¡lido. Debe tener al menos 10 dÃ­gitos.\n\nEjemplo: 5511999999999');
                return;
            }
            
            // Obtener la URL de la imagen
            const imageUrl = document.getElementById('imageUrl').value || window.editorImageForCampaign;
            const mainText = document.getElementById('mainText').value;
            const productName = document.getElementById('productName').value;
            
            if (!imageUrl) {
                alert('âš ï¸ Primero agrega una imagen en el campo "URL de la Imagen"');
                return;
            }
            
            // Crear mensaje de WhatsApp con la imagen
            let message = '';
            
            if (mainText) {
                message = mainText;
            } else if (productName) {
                message = `Hola! Vi tu anuncio sobre ${productName}`;
            } else {
                message = 'Hola! Vi tu anuncio';
            }
            
            // Agregar la imagen al mensaje
            message += `\n\nðŸ“· Imagen: ${imageUrl}`;
            
            // Codificar el mensaje para URL
            const encodedMessage = encodeURIComponent(message);
            
            // Generar link de WhatsApp
            const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
            
            // Colocar en el campo
            document.getElementById('destinationUrl').value = whatsappLink;
            
            // Mostrar confirmaciÃ³n
            alert(`âœ… Link de WhatsApp generado!\n\nNÃºmero: +${cleanPhone}\n\nCuando alguien haga clic en el anuncio:\n1. Se abrirÃ¡ WhatsApp\n2. El mensaje incluirÃ¡ la imagen automÃ¡ticamente\n3. Solo tendrÃ¡n que presionar "Enviar"`);
            
            console.log('âœ… WhatsApp link generado:', whatsappLink);
        }

        // Agregar listener al campo de presupuesto cuando se carga la pÃ¡gina
        document.addEventListener('DOMContentLoaded', function() {
            const dailyBudget = document.getElementById('dailyBudget');
            if (dailyBudget) {
                dailyBudget.addEventListener('input', updateWeeklyBudget);
            }
        });

        function goToStep(step) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            // Manejar paso 6 (Ã©xito) que tiene id diferente
            if (step === 6) {
                document.getElementById('sectionSuccess').classList.add('active');
            } else {
                document.getElementById('section' + step).classList.add('active');
            }
            
            document.querySelectorAll('.progress-step').forEach((s, i) => {
                s.classList.remove('active', 'completed');
                if (i + 1 < step) s.classList.add('completed');
                if (i + 1 === step) s.classList.add('active');
            });
            
            currentStep = step;

            // Cargar vista previa de imagen en paso 2
            if (step === 2) {
                const imageUrl = document.getElementById('imageUrl').value;
                const previewImage = document.getElementById('previewImage');
                const noImageMessage = document.getElementById('noImageMessage');
                
                // Verificar si hay imagen del editor
                if (window.editorImageForCampaign) {
                    previewImage.src = window.editorImageForCampaign;
                    previewImage.style.display = 'block';
                    noImageMessage.style.display = 'none';
                    console.log('âœ… Mostrando imagen del editor en paso 2');
                } else if (imageUrl) {
                    previewImage.src = imageUrl;
                    previewImage.style.display = 'block';
                    noImageMessage.style.display = 'none';
                    console.log('âœ… Mostrando imagen de URL en paso 2');
                } else {
                    previewImage.style.display = 'none';
                    noImageMessage.style.display = 'block';
                    console.log('âš ï¸ No hay imagen para mostrar en paso 2');
                }
            }

            // Cargar vista previa completa en paso 4
            if (step === 4) {
                loadPreview();
            }
        }

        async function generateDesigns() {
            const clientName = document.getElementById('clientName').value;
            const productName = document.getElementById('productName').value;
            const imageDescription = document.getElementById('imageDescription').value;
            const mainText = document.getElementById('mainText').value;
            
            if (!clientName || !productName || !imageDescription || !mainText) {
                alert('Por favor completa todos los campos requeridos');
                return;
            }

            campaignData = {
                clientName,
                productName,
                imageDescription,
                mainText,
                secondaryText: document.getElementById('secondaryText').value,
                visualStyle: document.getElementById('visualStyle').value,
                objective: document.getElementById('adObjective').value
            };
            
            goToStep(2);
            
            const stylePrompts = {
                professional: 'professional photography, studio lighting, commercial quality, 8k, sharp focus',
                modern: 'modern design, minimalist, clean aesthetic, contemporary style, sleek',
                realistic: 'photorealistic, ultra detailed, hyperrealistic, natural lighting, lifelike',
                artistic: 'artistic, creative composition, unique perspective, vibrant, eye-catching',
                vibrant: 'vibrant colors, bold, energetic, dynamic, colorful, saturated',
                elegant: 'elegant, sophisticated, premium quality, luxurious, refined'
            };

            const results = document.getElementById('designResults');
            results.innerHTML = '';
            generatedImages = [];
            
            for (let i = 1; i <= 6; i++) {
                const fullPrompt = `${imageDescription}, with bold text "${mainText}", ${stylePrompts[campaignData.visualStyle]}, advertising poster, marketing material, professional design, high quality`;
                const seed = Math.floor(Math.random() * 1000000);
                const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?seed=${seed}&width=1024&height=1024&nologo=true&enhance=true&model=flux`;
                
                generatedImages.push({ url: imageUrl, index: i });

                const card = document.createElement('div');
                card.className = 'image-card';
                card.innerHTML = `
                    <img src="${imageUrl}" alt="DiseÃ±o ${i}" loading="lazy">
                    <div class="image-card-content">
                        <div class="image-card-title">OpciÃ³n de DiseÃ±o ${i}</div>
                        <button class="btn btn-primary" style="width: 100%; margin-top: 12px;" onclick="selectDesign('${imageUrl}', this)">Seleccionar Este DiseÃ±o</button>
                    </div>
                `;
                results.appendChild(card);
            }
            
            setTimeout(() => {
                document.getElementById('loadingState').style.display = 'none';
                results.style.display = 'grid';
                document.getElementById('navButtons2').style.display = 'flex';
            }, 3000);
        }

        function selectDesign(url, btn) {
            selectedImage = url;
            document.querySelectorAll('.image-card').forEach(c => c.classList.remove('selected'));
            btn.closest('.image-card').classList.add('selected');
            document.getElementById('continueBtn').disabled = false;
            
            const selectionResults = document.getElementById('selectionResults');
            selectionResults.innerHTML = btn.closest('.image-card').parentElement.outerHTML;
        }

        function loadPreview() {
            // Capturar datos del formulario en tiempo real
            const clientName = document.getElementById('clientName')?.value || 'No especificado';
            const productName = document.getElementById('productName')?.value || 'No especificado';
            const mainText = document.getElementById('mainText')?.value || 'No especificado';
            const imageUrl = document.getElementById('imageUrl')?.value || '';
            
            // Actualizar campaignData con los valores actuales del formulario
            campaignData = {
                clientName: clientName,
                productName: productName,
                mainText: mainText,
                secondaryText: document.getElementById('secondaryText')?.value || '',
                imageDescription: document.getElementById('imageDescription')?.value || ''
            };
            
            // Usar imagen del editor si existe, sino usar selectedImage o imageUrl
            const imageToUse = window.editorImageForCampaign || selectedImage || imageUrl;
            
            if (imageToUse) {
                document.getElementById('finalImage').src = imageToUse;
                selectedImage = imageToUse; // Actualizar selectedImage
                console.log('âœ… Imagen cargada en vista previa');
            } else {
                document.getElementById('finalImage').src = '';
                console.log('âš ï¸ No hay imagen para mostrar');
            }
            
            // Mostrar datos en la vista previa
            document.getElementById('reviewClient').textContent = clientName;
            document.getElementById('reviewProduct').textContent = productName;
            document.getElementById('reviewMainText').textContent = mainText;

            const country = document.getElementById('targetCountry').options[document.getElementById('targetCountry').selectedIndex].text;
            const regions = document.getElementById('targetRegions').value || 'Todas las regiones';
            const ageMin = document.getElementById('ageMin').value || '18';
            const ageMax = document.getElementById('ageMax').value || '65';
            const interests = document.getElementById('interests').value || 'Auto-optimizado por Meta';

            document.getElementById('reviewTarget').textContent = 
                `${country} - ${regions} | Edades: ${ageMin}-${ageMax} | Intereses: ${interests}`;
            
            console.log('ðŸ“Š Vista previa cargada:', campaignData);
        }

        function publishCampaign() {
            const btn = event.target;
            btn.disabled = true;
            btn.innerHTML = '<span>â³ Publicando...</span>';

            // Validar que hay imagen
            if (!selectedImage && !window.editorImageForCampaign) {
                alert('âš ï¸ Error: No hay imagen para publicar. Por favor vuelve atrÃ¡s y agrega una imagen.');
                btn.disabled = false;
                btn.innerHTML = '<span>ðŸš€ Publicar CampaÃ±a â†’</span>';
                return;
            }

            // Recopilar datos del formulario en tiempo real (por si vienen del editor)
            const clientName = document.getElementById('clientName')?.value || '';
            const productName = document.getElementById('productName')?.value || '';
            const mainText = document.getElementById('mainText')?.value || '';
            
            // Validar campos requeridos
            if (!clientName || !productName || !mainText) {
                alert('âš ï¸ Error: Faltan datos requeridos.\n\nPor favor completa:\n- Nombre del Cliente\n- Nombre del Producto\n- Texto Principal\n\nSerÃ¡s redirigido al Paso 1 para completar estos campos.');
                btn.disabled = false;
                btn.innerHTML = '<span>ðŸš€ Publicar CampaÃ±a â†’</span>';
                // Redirigir automÃ¡ticamente al Paso 1
                goToStep(1);
                return;
            }

            // Preparar datos completos de la campaÃ±a
            const fullCampaignData = {
                clientName: clientName,
                productName: productName,
                mainText: mainText,
                secondaryText: document.getElementById('secondaryText')?.value || '',
                imageDescription: document.getElementById('imageDescription')?.value || '',
                visualStyle: document.getElementById('visualStyle')?.value || 'professional',
                objective: document.getElementById('adObjective')?.value || 'conversions',
                image: selectedImage || window.editorImageForCampaign,
                platforms: ['Facebook', 'Instagram'],
                targeting: {
                    country: document.getElementById('targetCountry').value,
                    regions: document.getElementById('targetRegions').value,
                    ageMin: document.getElementById('ageMin').value,
                    ageMax: document.getElementById('ageMax').value,
                    interests: document.getElementById('interests').value
                },
                budget: {
                    daily: 20,
                    weekly: 140,
                    clientCharge: 200,
                    profit: 60
                }
            };

            console.log('ðŸ“¤ Publicando campaÃ±a en Facebook:', fullCampaignData);

            // Publicar REALMENTE en Facebook
            fetch('/api/facebook-publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fullCampaignData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('âœ… CampaÃ±a publicada en Facebook:', data);
                    alert('âœ… Â¡CampaÃ±a publicada exitosamente en Facebook!\n\nID del Post: ' + (data.postId || 'N/A'));
                    goToStep(6);
                } else {
                    console.error('âŒ Error al publicar:', data.error);
                    alert('âŒ Error al publicar en Facebook:\n\n' + data.error + '\n\nVerifica tus credenciales en Vercel.');
                }
            })
            .catch(error => {
                console.error('âŒ Error de red:', error);
                alert('âŒ Error de conexiÃ³n:\n\n' + error.message + '\n\nVerifica tu conexiÃ³n a internet.');
            });
        }

        // ========== FUNCIONES AVANZADAS DE EDICIÃ“N ==========

        // Sistema de Historial (Deshacer/Rehacer)
        function editorSaveState() {
            const imageData = editorCtx.getImageData(0, 0, editorCanvas.width, editorCanvas.height);
            editorHistory = editorHistory.slice(0, editorHistoryIndex + 1);
            editorHistory.push(imageData);
            editorHistoryIndex++;
            
            // Limitar historial a 20 estados
            if (editorHistory.length > 20) {
                editorHistory.shift();
                editorHistoryIndex--;
            }
        }
        
        // FunciÃ³n helper para actualizar la imagen de la capa seleccionada con el canvas actual
        function editorUpdateCurrentLayerImage() {
            const selectedLayer = editorLayers.find(l => l.selected);
            if (selectedLayer && selectedLayer.type === 'image') {
                // Convertir canvas actual a imagen
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = editorCanvas.width;
                tempCanvas.height = editorCanvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(editorCanvas, 0, 0);
                
                const updatedImg = new Image();
                updatedImg.onload = function() {
                    selectedLayer.imageData = updatedImg;
                    editorCurrentImage = updatedImg;
                    editorOriginalImage = updatedImg;
                };
                updatedImg.src = tempCanvas.toDataURL('image/png', 1.0);
            }
        }

        function editorUndo() {
            if (editorHistoryIndex > 0) {
                editorHistoryIndex--;
                editorCtx.putImageData(editorHistory[editorHistoryIndex], 0, 0);
            } else {
                alert('No hay mÃ¡s acciones para deshacer');
            }
        }

        function editorRedo() {
            if (editorHistoryIndex < editorHistory.length - 1) {
                editorHistoryIndex++;
                editorCtx.putImageData(editorHistory[editorHistoryIndex], 0, 0);
            } else {
                alert('No hay mÃ¡s acciones para rehacer');
            }
        }

        // Sistema de Capas MÃºltiples
        function editorAddImageLayer() {
            document.getElementById('editorLayerFileInput').click();
        }

        function editorLoadImageLayer(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    editorSaveState();
                    
                    // Agregar imagen como nueva capa
                    editorImageLayers.push({
                        image: img,
                        x: 100,
                        y: 100,
                        width: 400,
                        height: 400,
                        opacity: 1,
                        visible: true
                    });
                    
                    // Redibujar todo
                    editorRedrawAllLayers();
                    
                    editorLayers.unshift({
                        type: 'image',
                        name: `Imagen ${editorLayers.filter(l => l.type === 'image').length + 1}`,
                        imageData: img
                    });
                    editorUpdateLayers();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function editorRedrawAllLayers() {
            // Limpiar canvas
            editorCtx.fillStyle = '#2a2a2a';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            
            // Dibujar imagen base si existe
            if (editorCurrentImage) {
                editorDrawImage(editorCurrentImage);
            }
            
            // Dibujar todas las capas de imÃ¡genes
            editorImageLayers.forEach(layer => {
                if (layer.visible) {
                    editorCtx.globalAlpha = layer.opacity;
                    editorCtx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
                    editorCtx.globalAlpha = 1;
                }
            });
        }

        // Filtros
        function editorApplyFilter(filterType) {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen');
                return;
            }
            
            editorSaveState();
            
            // Limpiar y redibujar imagen base
            editorCtx.fillStyle = '#2a2a2a';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            editorDrawImage(editorCurrentImage);
            
            // Obtener datos de imagen
            const imageData = editorCtx.getImageData(0, 0, editorCanvas.width, editorCanvas.height);
            const data = imageData.data;
            
            switch(filterType) {
                case 'grayscale':
                    for (let i = 0; i < data.length; i += 4) {
                        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        data[i] = avg;
                        data[i + 1] = avg;
                        data[i + 2] = avg;
                    }
                    break;
                    
                case 'sepia':
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                    }
                    break;
                    
                case 'vintage':
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        data[i] = Math.min(255, r * 1.2);
                        data[i + 1] = Math.min(255, g * 1.1);
                        data[i + 2] = Math.min(255, b * 0.8);
                    }
                    break;
                    
                case 'invert':
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = 255 - data[i];
                        data[i + 1] = 255 - data[i + 1];
                        data[i + 2] = 255 - data[i + 2];
                    }
                    break;
                    
                case 'blur':
                    // Blur simple (promedio de pÃ­xeles vecinos)
                    const tempData = new Uint8ClampedArray(data);
                    const width = editorCanvas.width;
                    for (let i = 0; i < data.length; i += 4) {
                        const x = (i / 4) % width;
                        const y = Math.floor((i / 4) / width);
                        if (x > 0 && x < width - 1 && y > 0 && y < editorCanvas.height - 1) {
                            for (let c = 0; c < 3; c++) {
                                data[i + c] = (
                                    tempData[i + c] +
                                    tempData[i + c - 4] +
                                    tempData[i + c + 4] +
                                    tempData[i + c - width * 4] +
                                    tempData[i + c + width * 4]
                                ) / 5;
                            }
                        }
                    }
                    break;
                    
                case 'sharpen':
                    // Sharpen (aumentar contraste entre pÃ­xeles)
                    const tempData2 = new Uint8ClampedArray(data);
                    const width2 = editorCanvas.width;
                    for (let i = 0; i < data.length; i += 4) {
                        const x = (i / 4) % width2;
                        const y = Math.floor((i / 4) / width2);
                        if (x > 0 && x < width2 - 1 && y > 0 && y < editorCanvas.height - 1) {
                            for (let c = 0; c < 3; c++) {
                                data[i + c] = Math.min(255, Math.max(0,
                                    tempData2[i + c] * 5 -
                                    tempData2[i + c - 4] -
                                    tempData2[i + c + 4] -
                                    tempData2[i + c - width2 * 4] -
                                    tempData2[i + c + width2 * 4]
                                ));
                            }
                        }
                    }
                    break;
            }
            
            editorCtx.putImageData(imageData, 0, 0);
            editorCurrentFilters.filter = filterType;
        }

        function editorResetFilters() {
            if (!editorCurrentImage) return;
            
            editorSaveState();
            editorCtx.fillStyle = '#2a2a2a';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            editorDrawImage(editorCurrentImage);
            editorCurrentFilters.filter = 'none';
        }

        // Ajustes de Imagen
        function editorApplyAdjustments() {
            if (!editorCurrentImage) return;
            
            const brightness = document.getElementById('editorBrightness').value;
            const contrast = document.getElementById('editorContrast').value;
            const saturation = document.getElementById('editorSaturation').value;
            
            document.getElementById('brightnessValue').textContent = brightness;
            document.getElementById('contrastValue').textContent = contrast;
            document.getElementById('saturationValue').textContent = saturation;
            
            // Limpiar y redibujar
            editorCtx.fillStyle = '#2a2a2a';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            
            // Aplicar filtros CSS
            editorCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
            editorDrawImage(editorCurrentImage);
            editorCtx.filter = 'none';
            
            editorCurrentFilters.brightness = brightness;
            editorCurrentFilters.contrast = contrast;
            editorCurrentFilters.saturation = saturation;
        }

        function editorResetAdjustments() {
            document.getElementById('editorBrightness').value = 100;
            document.getElementById('editorContrast').value = 100;
            document.getElementById('editorSaturation').value = 100;
            document.getElementById('brightnessValue').textContent = 100;
            document.getElementById('contrastValue').textContent = 100;
            document.getElementById('saturationValue').textContent = 100;
            
            editorApplyAdjustments();
        }

        // Actualizar preview de transformaciÃ³n en tiempo real
        function editorUpdateTransformPreview() {
            if (!editorCurrentImage) return;
            
            const scale = document.getElementById('editorScale').value / 100;
            const posX = parseInt(document.getElementById('editorPosX').value);
            const posY = parseInt(document.getElementById('editorPosY').value);
            
            document.getElementById('scaleValue').textContent = document.getElementById('editorScale').value;
            document.getElementById('posXValue').textContent = posX;
            document.getElementById('posYValue').textContent = posY;
            
            // Guardar valores temporales
            editorTransform.scale = scale;
            editorTransform.offsetX = posX;
            editorTransform.offsetY = posY;
            
            // Redibujar con transformaciÃ³n
            editorRedrawWithTransform();
        }

        // Redibujar imagen con transformaciÃ³n aplicada
        function editorRedrawWithTransform() {
            function updateLocationTags() {
                        const container = document.getElementById('locationTagsContainer');
                        const placeholder = document.getElementById('locationTagsPlaceholder');
                        const hiddenInput = document.getElementById('targetRegions');

                        // Validar que los elementos existan
                        if (!container || !hiddenInput) {
                            console.error('âŒ Error: No se encontraron los elementos necesarios');
                            return;
                        }

                        if (locationTags.length === 0) {
                            if (placeholder) placeholder.style.display = 'block';
                            container.innerHTML = '';
                            hiddenInput.value = '';
                        } else {
                            if (placeholder) placeholder.style.display = 'none';

                            // Actualizar input oculto
                            hiddenInput.value = locationTags.join(', ');

                            // Crear tags visuales con onclick inline (funciona con innerHTML)
                            container.innerHTML = locationTags.map((location, index) => `
                                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #667eea; border-radius: 6px; font-size: 13px; color: white; font-weight: 600;">
                                    <span>ðŸ“ ${location}</span>
                                    <button type="button" onclick="window.removeLocationTag(${index}); return false;" style="background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; font-size: 18px; font-weight: bold; padding: 4px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s; line-height: 1;" onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='scale(1)'">Ã—</button>
                                </div>
                            `).join('');

                            console.log('âœ… Tags actualizados. Total:', locationTags.length);
                        }
                    }
            
            if (mode === 'contain') {
                if (imgRatio > canvasRatio) {
                    drawWidth = editorCanvas.width;
                    drawHeight = editorCurrentImage.height * (editorCanvas.width / editorCurrentImage.width);
                    offsetX = 0;
                    offsetY = (editorCanvas.height - drawHeight) / 2;
                } else {
                    drawHeight = editorCanvas.height;
                    drawWidth = editorCurrentImage.width * (editorCanvas.height / editorCurrentImage.height);
                    offsetX = (editorCanvas.width - drawWidth) / 2;
                    offsetY = 0;
                }
            } else if (mode === 'cover') {
                if (imgRatio > canvasRatio) {
                    drawHeight = editorCanvas.height;
                    drawWidth = editorCurrentImage.width * (editorCanvas.height / editorCurrentImage.height);
                    offsetX = (editorCanvas.width - drawWidth) / 2;
                    offsetY = 0;
                } else {
                    drawWidth = editorCanvas.width;
                    drawHeight = editorCurrentImage.height * (editorCanvas.width / editorCurrentImage.width);
                    offsetX = 0;
                    offsetY = (editorCanvas.height - drawHeight) / 2;
                }
            } else {
                drawWidth = editorCanvas.width;
                drawHeight = editorCanvas.height;
                offsetX = 0;
                offsetY = 0;
            }
            
            // Aplicar escala y posiciÃ³n
            const scaledWidth = drawWidth * editorTransform.scale;
            const scaledHeight = drawHeight * editorTransform.scale;
            const finalX = offsetX + editorTransform.offsetX + (drawWidth - scaledWidth) / 2;
            const finalY = offsetY + editorTransform.offsetY + (drawHeight - scaledHeight) / 2;
            
            editorCtx.drawImage(editorCurrentImage, finalX, finalY, scaledWidth, scaledHeight);
            editorCtx.filter = 'none';
        }

        // Aplicar transformaciÃ³n en tiempo real
        function editorApplyTransform() {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen');
                return;
            }
            
            const zoom = document.getElementById('editorZoom').value;
            const posX = parseInt(document.getElementById('editorPosX').value);
            const posY = parseInt(document.getElementById('editorPosY').value);
            const rotation = parseInt(document.getElementById('editorRotation').value);
            
            // Actualizar valores mostrados
            document.getElementById('zoomValue').textContent = zoom;
            document.getElementById('posXValue').textContent = posX;
            document.getElementById('posYValue').textContent = posY;
            document.getElementById('rotationValue').textContent = rotation;
            
            // Guardar valores de transformaciÃ³n
            editorTransform.zoom = zoom;
            editorTransform.posX = posX;
            editorTransform.posY = posY;
            editorTransform.rotation = rotation;
            
            // Limpiar canvas
            editorCtx.fillStyle = '#2a2a2a';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            
            // Aplicar filtros actuales
            const brightness = document.getElementById('editorBrightness').value;
            const contrast = document.getElementById('editorContrast').value;
            const saturation = document.getElementById('editorSaturation').value;
            editorCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
            
            // Calcular dimensiones con zoom
            const scale = zoom / 100;
            const canvasRatio = editorCanvas.width / editorCanvas.height;
            const imgRatio = editorCurrentImage.width / editorCurrentImage.height;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (imgRatio > canvasRatio) {
                drawWidth = editorCanvas.width * scale;
                drawHeight = editorCurrentImage.height * (editorCanvas.width / editorCurrentImage.width) * scale;
                offsetX = (editorCanvas.width - drawWidth) / 2;
                offsetY = (editorCanvas.height - drawHeight) / 2;
            } else {
                drawHeight = editorCanvas.height * scale;
                drawWidth = editorCurrentImage.width * (editorCanvas.height / editorCurrentImage.height) * scale;
                offsetX = (editorCanvas.width - drawWidth) / 2;
                offsetY = (editorCanvas.height - drawHeight) / 2;
            }
            
            // Aplicar posiciÃ³n personalizada
            offsetX += posX;
            offsetY += posY;
            
            // Aplicar rotaciÃ³n si existe
            if (rotation !== 0) {
                editorCtx.save();
                editorCtx.translate(editorCanvas.width / 2, editorCanvas.height / 2);
                editorCtx.rotate((rotation * Math.PI) / 180);
                editorCtx.drawImage(editorCurrentImage, 
                    -drawWidth / 2 + (offsetX - editorCanvas.width / 2), 
                    -drawHeight / 2 + (offsetY - editorCanvas.height / 2), 
                    drawWidth, 
                    drawHeight);
                editorCtx.restore();
            } else {
                editorCtx.drawImage(editorCurrentImage, offsetX, offsetY, drawWidth, drawHeight);
            }
            
            editorCtx.filter = 'none';
        }

        // Resetear transformaciÃ³n
        function editorResetTransform() {
            document.getElementById('editorZoom').value = 100;
            document.getElementById('editorPosX').value = 0;
            document.getElementById('editorPosY').value = 0;
            document.getElementById('editorRotation').value = 0;
            document.getElementById('zoomValue').textContent = 100;
            document.getElementById('posXValue').textContent = 0;
            document.getElementById('posYValue').textContent = 0;
            document.getElementById('rotationValue').textContent = 0;
            
            editorTransform.zoom = 100;
            editorTransform.posX = 0;
            editorTransform.posY = 0;
            editorTransform.rotation = 0;
            
            // Redibujar sin transformaciÃ³n
            if (editorCurrentImage) {
                editorCtx.fillStyle = '#2a2a2a';
                editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
                
                const brightness = document.getElementById('editorBrightness').value;
                const contrast = document.getElementById('editorContrast').value;
                const saturation = document.getElementById('editorSaturation').value;
                editorCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
                
                editorDrawImage(editorCurrentImage);
                editorCtx.filter = 'none';
            }
        }
        
        // Ajustar imagen al canvas
        function editorFitToCanvas() {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen');
                return;
            }
            
            document.getElementById('editorZoom').value = 100;
            document.getElementById('editorPosX').value = 0;
            document.getElementById('editorPosY').value = 0;
            document.getElementById('editorRotation').value = 0;
            
            editorApplyTransform();
        }

        // RotaciÃ³n
        function editorRotate(degrees) {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen');
                return;
            }
            
            editorSaveState();
            editorCurrentRotation += degrees;
            
            // Crear canvas temporal
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = editorCanvas.width;
            tempCanvas.height = editorCanvas.height;
            
            // Copiar imagen actual
            tempCtx.drawImage(editorCanvas, 0, 0);
            
            // Limpiar canvas principal
            editorCtx.fillStyle = '#2a2a2a';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            
            // Rotar
            editorCtx.save();
            editorCtx.translate(editorCanvas.width / 2, editorCanvas.height / 2);
            editorCtx.rotate((degrees * Math.PI) / 180);
            editorCtx.drawImage(tempCanvas, -editorCanvas.width / 2, -editorCanvas.height / 2);
            editorCtx.restore();
        }

        // ========== CONTROLES RÃPIDOS DE TRANSFORMACIÃ“N ==========
        
        function quickTransform() {
            if (!editorCurrentImage) return;
            
            const zoom = document.getElementById('quickZoom').value;
            const posX = parseInt(document.getElementById('quickPosX').value);
            const posY = parseInt(document.getElementById('quickPosY').value);
            const rotation = parseInt(document.getElementById('quickRotation').value);
            
            // Actualizar valores mostrados
            document.getElementById('quickZoomValue').textContent = zoom;
            document.getElementById('quickPosXValue').textContent = posX;
            document.getElementById('quickPosYValue').textContent = posY;
            document.getElementById('quickRotationValue').textContent = rotation;
            
            // Sincronizar con controles de la pestaÃ±a Editar
            if (document.getElementById('editorZoom')) {
                document.getElementById('editorZoom').value = zoom;
                document.getElementById('editorPosX').value = posX;
                document.getElementById('editorPosY').value = posY;
                document.getElementById('editorRotation').value = rotation;
            }
            
            // Limpiar canvas
            editorCtx.fillStyle = '#2a2a2a';
            editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
            
            // Aplicar filtros actuales
            const brightness = document.getElementById('editorBrightness') ? document.getElementById('editorBrightness').value : 100;
            const contrast = document.getElementById('editorContrast') ? document.getElementById('editorContrast').value : 100;
            const saturation = document.getElementById('editorSaturation') ? document.getElementById('editorSaturation').value : 100;
            editorCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
            
            // Calcular dimensiones con zoom
            const scale = zoom / 100;
            const canvasRatio = editorCanvas.width / editorCanvas.height;
            const imgRatio = editorCurrentImage.width / editorCurrentImage.height;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (imgRatio > canvasRatio) {
                drawWidth = editorCanvas.width * scale;
                drawHeight = editorCurrentImage.height * (editorCanvas.width / editorCurrentImage.width) * scale;
                offsetX = (editorCanvas.width - drawWidth) / 2;
                offsetY = (editorCanvas.height - drawHeight) / 2;
            } else {
                drawHeight = editorCanvas.height * scale;
                drawWidth = editorCurrentImage.width * (editorCanvas.height / editorCurrentImage.height) * scale;
                offsetX = (editorCanvas.width - drawWidth) / 2;
                offsetY = (editorCanvas.height - drawHeight) / 2;
            }
            
            // Aplicar posiciÃ³n personalizada
            offsetX += posX;
            offsetY += posY;
            
            // Aplicar rotaciÃ³n si existe
            if (rotation !== 0) {
                editorCtx.save();
                editorCtx.translate(editorCanvas.width / 2, editorCanvas.height / 2);
                editorCtx.rotate((rotation * Math.PI) / 180);
                editorCtx.drawImage(editorCurrentImage, 
                    -drawWidth / 2 + (offsetX - editorCanvas.width / 2), 
                    -drawHeight / 2 + (offsetY - editorCanvas.height / 2), 
                    drawWidth, 
                    drawHeight);
                editorCtx.restore();
            } else {
                editorCtx.drawImage(editorCurrentImage, offsetX, offsetY, drawWidth, drawHeight);
            }
            
            editorCtx.filter = 'none';
        }
        
        function quickResetTransform() {
            document.getElementById('quickZoom').value = 100;
            document.getElementById('quickPosX').value = 0;
            document.getElementById('quickPosY').value = 0;
            document.getElementById('quickRotation').value = 0;
            quickTransform();
        }
        
        function quickFitToCanvas() {
            quickResetTransform();
        }

        // ========== CONTROLES CON MOUSE ==========
        
        let selectedSticker = null;
        let resizingSticker = false;
        let selectedStickerHandle = null;
        let stickerOriginalWidth = 0;
        let stickerOriginalHeight = 0;
        let stickerOriginalX = 0;
        let stickerOriginalY = 0;
        let stickerDragOffset = { x: 0, y: 0 };
        
        function handleMouseDown(e) {
            const rect = editorCanvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * (editorCanvas.width / rect.width);
            const mouseY = (e.clientY - rect.top) * (editorCanvas.height / rect.height);
            
            // Primero verificar si se hizo clic en un handle de sticker seleccionado
            for (let i = 0; i < editorLayers.length; i++) {
                const layer = editorLayers[i];
                if (layer.type === 'sticker' && layer.data && layer.data.selected && layer.visible) {
                    const sticker = layer.data;
                    const handleSize = 12;
                    const corners = [
                        { x: sticker.x, y: sticker.y, name: 'tl' }, // top-left
                        { x: sticker.x + sticker.width, y: sticker.y, name: 'tr' }, // top-right
                        { x: sticker.x, y: sticker.y + sticker.height, name: 'bl' }, // bottom-left
                        { x: sticker.x + sticker.width, y: sticker.y + sticker.height, name: 'br' } // bottom-right
                    ];
                    
                    for (const corner of corners) {
                        if (mouseX >= corner.x - handleSize / 2 && mouseX <= corner.x + handleSize / 2 &&
                            mouseY >= corner.y - handleSize / 2 && mouseY <= corner.y + handleSize / 2) {
                            // Se hizo clic en un handle del sticker
                            selectedSticker = sticker;
                            resizingSticker = true;
                            selectedStickerHandle = corner.name;
                            dragStartX = mouseX;
                            dragStartY = mouseY;
                            stickerOriginalWidth = sticker.width;
                            stickerOriginalHeight = sticker.height;
                            stickerOriginalX = sticker.x;
                            stickerOriginalY = sticker.y;
                            editorCanvas.style.cursor = 'nwse-resize';
                            return;
                        }
                    }
                }
            }
            
            // Luego verificar si se hizo clic en un sticker (para moverlo)
            selectedSticker = null;
            resizingSticker = false;
            let stickerLayerIndex = -1;
            
            for (let i = 0; i < editorLayers.length; i++) {
                const layer = editorLayers[i];
                if (layer.type === 'sticker' && layer.data && layer.visible) {
                    const sticker = layer.data;
                    if (mouseX >= sticker.x && mouseX <= sticker.x + sticker.width &&
                        mouseY >= sticker.y && mouseY <= sticker.y + sticker.height) {
                        selectedSticker = sticker;
                        stickerLayerIndex = i;
                        stickerDragOffset.x = mouseX - sticker.x;
                        stickerDragOffset.y = mouseY - sticker.y;
                        
                        // Deseleccionar todas las capas
                        editorLayers.forEach(l => {
                            l.selected = false;
                            if (l.type === 'sticker' && l.data) l.data.selected = false;
                        });
                        
                        // Seleccionar esta capa y sticker
                        layer.selected = true;
                        sticker.selected = true;
                        
                        // Ocultar handles de la imagen de fondo
                        showHandles = false;
                        
                        // Actualizar UI de capas
                        editorUpdateLayers();
                        editorRedrawCanvas();
                        editorCanvas.style.cursor = 'move';
                        return;
                    }
                }
            }
            
            // Si no se hizo clic en un sticker, deseleccionar todos
            editorLayers.forEach(l => {
                l.selected = false;
                if (l.type === 'sticker' && l.data) l.data.selected = false;
            });
            editorUpdateLayers();
            editorRedrawCanvas();
            
            if (!editorCurrentImage) return;
            
            // Verificar si se hizo clic en un handle (esquina)
            if (showHandles) {
                const handle = getHandleAtPosition(mouseX, mouseY);
                if (handle) {
                    isDragging = true;
                    selectedHandle = handle;
                    dragStartX = mouseX;
                    dragStartY = mouseY;
                    editorCanvas.style.cursor = handle.cursor;
                    return;
                }
            }
            
            // Verificar si se hizo clic dentro de la imagen (para moverla)
            if (isInsideImage(mouseX, mouseY)) {
                isDragging = true;
                selectedHandle = null;
                dragStartX = mouseX;
                dragStartY = mouseY;
                lastPosX = editorTransform.posX;
                lastPosY = editorTransform.posY;
                showHandles = true; // Mostrar handles cuando se selecciona la imagen
                editorCanvas.style.cursor = 'grabbing';
            }
        }
        
        function handleMouseMove(e) {
            const rect = editorCanvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * (editorCanvas.width / rect.width);
            const mouseY = (e.clientY - rect.top) * (editorCanvas.height / rect.height);
            
            // Si estÃ¡ redimensionando un sticker
            if (resizingSticker && selectedSticker) {
                const deltaX = mouseX - dragStartX;
                const deltaY = mouseY - dragStartY;
                
                // Redimensionar segÃºn el handle seleccionado
                if (selectedStickerHandle === 'br') {
                    // Bottom-right: aumentar ancho y alto
                    selectedSticker.width = Math.max(20, stickerOriginalWidth + deltaX);
                    selectedSticker.height = Math.max(20, stickerOriginalHeight + deltaY);
                } else if (selectedStickerHandle === 'bl') {
                    // Bottom-left: cambiar x y ancho, aumentar alto
                    const newWidth = Math.max(20, stickerOriginalWidth - deltaX);
                    selectedSticker.x = stickerOriginalX + (stickerOriginalWidth - newWidth);
                    selectedSticker.width = newWidth;
                    selectedSticker.height = Math.max(20, stickerOriginalHeight + deltaY);
                } else if (selectedStickerHandle === 'tr') {
                    // Top-right: aumentar ancho, cambiar y y alto
                    selectedSticker.width = Math.max(20, stickerOriginalWidth + deltaX);
                    const newHeight = Math.max(20, stickerOriginalHeight - deltaY);
                    selectedSticker.y = stickerOriginalY + (stickerOriginalHeight - newHeight);
                    selectedSticker.height = newHeight;
                } else if (selectedStickerHandle === 'tl') {
                    // Top-left: cambiar x, y, ancho y alto
                    const newWidth = Math.max(20, stickerOriginalWidth - deltaX);
                    const newHeight = Math.max(20, stickerOriginalHeight - deltaY);
                    selectedSticker.x = stickerOriginalX + (stickerOriginalWidth - newWidth);
                    selectedSticker.y = stickerOriginalY + (stickerOriginalHeight - newHeight);
                    selectedSticker.width = newWidth;
                    selectedSticker.height = newHeight;
                }
                
                editorRedrawCanvas();
                return;
            }
            
            // Si estÃ¡ moviendo un sticker
            if (selectedSticker && !resizingSticker) {
                selectedSticker.x = mouseX - stickerDragOffset.x;
                selectedSticker.y = mouseY - stickerDragOffset.y;
                editorRedrawCanvas();
                return;
            }
            
            if (!editorCurrentImage) return;
            
            // Si no estÃ¡ arrastrando, solo cambiar cursor
            if (!isDragging) {
                // Verificar si el mouse estÃ¡ sobre un sticker
                let overSticker = false;
                for (let i = 0; i < editorLayers.length; i++) {
                    const layer = editorLayers[i];
                    if (layer.type === 'sticker' && layer.data && layer.visible) {
                        const sticker = layer.data;
                        if (mouseX >= sticker.x && mouseX <= sticker.x + sticker.width &&
                            mouseY >= sticker.y && mouseY <= sticker.y + sticker.height) {
                            editorCanvas.style.cursor = 'move';
                            overSticker = true;
                            break;
                        }
                    }
                }
                
                if (!overSticker) {
                    if (showHandles) {
                        const handle = getHandleAtPosition(mouseX, mouseY);
                        if (handle) {
                            editorCanvas.style.cursor = handle.cursor;
                            return;
                        }
                    }
                    
                    if (isInsideImage(mouseX, mouseY)) {
                        editorCanvas.style.cursor = 'move';
                    } else {
                        editorCanvas.style.cursor = 'default';
                    }
                }
                return;
            }
            
            // Si estÃ¡ arrastrando un handle (esquina) - REDIMENSIONAR
            if (selectedHandle) {
                const deltaX = mouseX - dragStartX;
                const deltaY = mouseY - dragStartY;
                
                // Calcular cambio de zoom basado en el movimiento
                let zoomChange = 0;
                if (selectedHandle.name === 'br' || selectedHandle.name === 'tr') {
                    // Esquinas derechas: mover a la derecha aumenta
                    zoomChange = deltaX * 0.1;
                } else {
                    // Esquinas izquierdas: mover a la izquierda aumenta
                    zoomChange = -deltaX * 0.1;
                }
                
                // Aplicar cambio de zoom
                editorTransform.zoom = Math.max(10, Math.min(300, editorTransform.zoom + zoomChange));
                
                // Actualizar slider si existe
                if (document.getElementById('quickZoom')) {
                    document.getElementById('quickZoom').value = Math.round(editorTransform.zoom);
                    document.getElementById('quickZoomValue').textContent = Math.round(editorTransform.zoom);
                }
                
                // Actualizar posiciÃ³n de inicio para el siguiente frame
                dragStartX = mouseX;
                dragStartY = mouseY;
                
                // Actualizar transformaciÃ³n en la capa seleccionada
                const selectedLayer = editorLayers.find(l => l.selected);
                if (selectedLayer && selectedLayer.transform) {
                    selectedLayer.transform.zoom = editorTransform.zoom;
                }
                
                // Redibujar
                editorRedrawCanvas();
            }
            // Si estÃ¡ arrastrando la imagen - MOVER
            else {
                const deltaX = mouseX - dragStartX;
                const deltaY = mouseY - dragStartY;
                
                editorTransform.posX = lastPosX + deltaX;
                editorTransform.posY = lastPosY + deltaY;
                
                // Actualizar sliders si existen
                if (document.getElementById('quickPosX')) {
                    document.getElementById('quickPosX').value = Math.round(editorTransform.posX);
                    document.getElementById('quickPosY').value = Math.round(editorTransform.posY);
                    document.getElementById('quickPosXValue').textContent = Math.round(editorTransform.posX);
                    document.getElementById('quickPosYValue').textContent = Math.round(editorTransform.posY);
                }
                
                // Actualizar transformaciÃ³n en la capa seleccionada
                const selectedLayer = editorLayers.find(l => l.selected);
                if (selectedLayer && selectedLayer.transform) {
                    selectedLayer.transform.posX = editorTransform.posX;
                    selectedLayer.transform.posY = editorTransform.posY;
                }
                
                // Redibujar
                editorRedrawCanvas();
            }
        }
        
        function handleMouseUp(e) {
            // Soltar sticker
            if (selectedSticker || resizingSticker) {
                selectedSticker = null;
                resizingSticker = false;
                selectedStickerHandle = null;
                editorCanvas.style.cursor = 'default';
                return;
            }
            
            if (isDragging) {
                isDragging = false;
                selectedHandle = null;
                
                const rect = editorCanvas.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) * (editorCanvas.width / rect.width);
                const mouseY = (e.clientY - rect.top) * (editorCanvas.height / rect.height);
                
                // Actualizar cursor segÃºn posiciÃ³n
                if (showHandles) {
                    const handle = getHandleAtPosition(mouseX, mouseY);
                    if (handle) {
                        editorCanvas.style.cursor = handle.cursor;
                        return;
                    }
                }
                
                if (isInsideImage(mouseX, mouseY)) {
                    editorCanvas.style.cursor = 'move';
                } else {
                    editorCanvas.style.cursor = 'default';
                }
            }
        }
        
        function handleMouseWheel(e) {
            if (!editorCurrentImage) return;
            
            e.preventDefault();
            
            // Zoom con la rueda del mouse
            const zoomDelta = e.deltaY > 0 ? -10 : 10;
            editorTransform.zoom = Math.max(10, Math.min(300, editorTransform.zoom + zoomDelta));
            
            // Actualizar slider si existe
            if (document.getElementById('quickZoom')) {
                document.getElementById('quickZoom').value = editorTransform.zoom;
                document.getElementById('quickZoomValue').textContent = editorTransform.zoom;
            }
            
            // Actualizar transformaciÃ³n en la capa seleccionada
            const selectedLayer = editorLayers.find(l => l.selected);
            if (selectedLayer && selectedLayer.transform) {
                selectedLayer.transform.zoom = editorTransform.zoom;
            }
            
            // Redibujar
            editorRedrawCanvas();
        }
        
        
        function drawImageHandles() {
            // Dibujar borde azul alrededor de la imagen
            editorCtx.strokeStyle = '#3b82f6';
            editorCtx.lineWidth = 3;
            editorCtx.setLineDash([10, 5]);
            editorCtx.strokeRect(imageRect.x, imageRect.y, imageRect.width, imageRect.height);
            editorCtx.setLineDash([]);
            
            // Calcular posiciones de los 4 handles en las esquinas
            const handleSize = 20;
            handles = [
                { x: imageRect.x, y: imageRect.y, cursor: 'nw-resize', name: 'tl' },
                { x: imageRect.x + imageRect.width, y: imageRect.y, cursor: 'ne-resize', name: 'tr' },
                { x: imageRect.x, y: imageRect.y + imageRect.height, cursor: 'sw-resize', name: 'bl' },
                { x: imageRect.x + imageRect.width, y: imageRect.y + imageRect.height, cursor: 'se-resize', name: 'br' }
            ];
            
            // Dibujar los 4 puntos en las esquinas
            handles.forEach(handle => {
                // CÃ­rculo blanco con borde azul
                editorCtx.fillStyle = '#ffffff';
                editorCtx.beginPath();
                editorCtx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2);
                editorCtx.fill();
                
                editorCtx.strokeStyle = '#3b82f6';
                editorCtx.lineWidth = 3;
                editorCtx.beginPath();
                editorCtx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2);
                editorCtx.stroke();
            });
        }
        
        function getHandleAtPosition(x, y) {
            const handleSize = 20;
            for (let handle of handles) {
                const distance = Math.sqrt(Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2));
                if (distance < handleSize) {
                    return handle;
                }
            }
            return null;
        }
        
        function isInsideImage(x, y) {
            return x >= imageRect.x && x <= imageRect.x + imageRect.width &&
                   y >= imageRect.y && y <= imageRect.y + imageRect.height;
        }

        // ========== FUNCIONES IA AVANZADAS ==========

        // Quitar Fondo con IA
        async function editorRemoveBackground() {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen');
                return;
            }
            
            document.getElementById('editorLoading').style.display = 'flex';
            document.querySelector('#editorLoading .spinner').nextElementSibling.textContent = 'Quitando fondo con IA...';
            
            try {
                // Convertir canvas a base64
                const imageData = editorCanvas.toDataURL('image/png');
                
                const response = await fetch('/api/remove-background', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        imageData: imageData
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Error al quitar fondo');
                }
                
                const img = new Image();
                img.onload = function() {
                    editorSaveState();
                    editorCtx.fillStyle = '#2a2a2a';
                    editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
                    editorDrawImage(img);
                    editorCurrentImage = img;
                    document.getElementById('editorLoading').style.display = 'none';
                    alert('âœ… Fondo eliminado exitosamente!');
                };
                img.src = data.imageData;
                
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('editorLoading').style.display = 'none';
                alert('âŒ Error al quitar fondo: ' + error.message);
            }
        }

        // Mejorar Calidad - MÃXIMA CALIDAD SIN CAMBIAR COLORES
        async function editorUpscale() {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen');
                return;
            }
            
            document.getElementById('editorLoading').style.display = 'flex';
            document.querySelector('#editorLoading .spinner').nextElementSibling.textContent = 'Mejorando calidad al mÃ¡ximo...';
            
            try {
                editorSaveState();
                
                // Crear canvas temporal 2x mÃ¡s grande
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                
                const originalWidth = editorCurrentImage.width;
                const originalHeight = editorCurrentImage.height;
                
                // Duplicar tamaÃ±o
                tempCanvas.width = originalWidth * 2;
                tempCanvas.height = originalHeight * 2;
                
                // PASO 1: Escalar con MÃXIMA interpolaciÃ³n
                tempCtx.imageSmoothingEnabled = true;
                tempCtx.imageSmoothingQuality = 'high';
                tempCtx.drawImage(editorCurrentImage, 0, 0, tempCanvas.width, tempCanvas.height);
                
                // PASO 2: Obtener datos de imagen
                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imageData.data;
                const width = tempCanvas.width;
                const height = tempCanvas.height;
                
                // Crear copia para procesamiento
                const original = new Uint8ClampedArray(data);
                
                // PASO 3: Unsharp Mask OPTIMIZADO (mejora nitidez sin cambiar colores)
                // Crear versiÃ³n borrosa simple
                const blurred = new Uint8ClampedArray(data.length);
                
                for (let y = 1; y < height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        const idx = (y * width + x) * 4;
                        
                        for (let c = 0; c < 3; c++) {
                            const center = original[idx + c];
                            const top = original[((y-1) * width + x) * 4 + c];
                            const bottom = original[((y+1) * width + x) * 4 + c];
                            const left = original[(y * width + (x-1)) * 4 + c];
                            const right = original[(y * width + (x+1)) * 4 + c];
                            
                            // Promedio simple para blur
                            blurred[idx + c] = (center + top + bottom + left + right) / 5;
                        }
                    }
                }
                
                // PASO 4: Aplicar Unsharp Mask
                const amount = 1.8; // Intensidad alta para mÃ¡xima nitidez
                const threshold = 2; // Umbral bajo para capturar todos los detalles
                
                for (let i = 0; i < data.length; i += 4) {
                    // Procesar cada canal RGB por separado para preservar colores
                    for (let c = 0; c < 3; c++) {
                        const diff = original[i + c] - blurred[i + c];
                        
                        // Aplicar sharpening si supera el umbral
                        if (Math.abs(diff) > threshold) {
                            const sharpened = original[i + c] + amount * diff;
                            data[i + c] = Math.min(255, Math.max(0, sharpened));
                        } else {
                            // Mantener color EXACTO original en Ã¡reas planas
                            data[i + c] = original[i + c];
                        }
                    }
                    // Mantener canal alpha sin cambios
                    data[i + 3] = original[i + 3];
                }
                
                // Aplicar resultado
                tempCtx.putImageData(imageData, 0, 0);
                
                // Crear nueva imagen con MÃXIMA calidad PNG
                const upscaledImg = new Image();
                upscaledImg.onload = function() {
                    editorCurrentImage = upscaledImg;
                    editorOriginalImage = upscaledImg;
                    
                    // Redibujar en canvas
                    editorCtx.fillStyle = '#2a2a2a';
                    editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
                    editorDrawImage(upscaledImg);
                    
                    document.getElementById('editorLoading').style.display = 'none';
                    alert('âœ… Calidad mejorada al MÃXIMO!\n\nâ€¢ ResoluciÃ³n 2x\nâ€¢ Unsharp Mask profesional\nâ€¢ Colores 100% preservados\nâ€¢ MÃ¡xima nitidez sin artefactos');
                };
                upscaledImg.src = tempCanvas.toDataURL('image/png', 1.0); // PNG calidad 100%
                
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('editorLoading').style.display = 'none';
                alert('âŒ Error al mejorar calidad: ' + error.message);
            }
        }

        // EdiciÃ³n Inteligente con IA REAL
        // EdiciÃ³n Inteligente LOCAL (sin APIs externas)
        // Permite transformar imÃ¡genes segÃºn instrucciones en lenguaje natural
        async function editorSmartEdit() {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen');
                return;
            }
            
            const promptText = prompt('ðŸ¤– Dile a la IA quÃ© hacer con tu imagen:\n\nEjemplos:\nâ€¢ "mÃ¡s brillante"\nâ€¢ "mÃ¡s contraste"\nâ€¢ "blanco y negro"\nâ€¢ "mÃ¡s saturado"\nâ€¢ "mÃ¡s oscuro"\nâ€¢ "sepia/vintage"\nâ€¢ "invertir colores"\n\nðŸ’¡ Escribe el efecto que quieres aplicar:');
            
            if (!promptText || promptText.trim() === '') return;
            
            document.getElementById('editorLoading').style.display = 'flex';
            document.querySelector('#editorLoading .spinner').nextElementSibling.textContent = 'ðŸŽ¨ Aplicando transformaciÃ³n...';
            
            try {
                editorSaveState();
                
                const prompt = promptText.toLowerCase();
                
                // Obtener datos de imagen
                const imageData = editorCtx.getImageData(0, 0, editorCanvas.width, editorCanvas.height);
                const data = imageData.data;
                
                console.log('ðŸŽ¨ Aplicando efecto:', promptText);
                
                // Aplicar efectos segÃºn el prompt
                if (prompt.includes('brillante') || prompt.includes('brillo') || prompt.includes('bright')) {
                    // Aumentar brillo
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = Math.min(255, data[i] + 50);
                        data[i + 1] = Math.min(255, data[i + 1] + 50);
                        data[i + 2] = Math.min(255, data[i + 2] + 50);
                    }
                } else if (prompt.includes('oscuro') || prompt.includes('oscurecer') || prompt.includes('dark')) {
                    // Reducir brillo
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = Math.max(0, data[i] - 50);
                        data[i + 1] = Math.max(0, data[i + 1] - 50);
                        data[i + 2] = Math.max(0, data[i + 2] - 50);
                    }
                } else if (prompt.includes('contraste') || prompt.includes('contrast')) {
                    // Aumentar contraste
                    const factor = 1.5;
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * factor) + 128));
                        data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * factor) + 128));
                        data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * factor) + 128));
                    }
                } else if (prompt.includes('saturado') || prompt.includes('saturaciÃ³n') || prompt.includes('color') || prompt.includes('vibrant')) {
                    // Aumentar saturaciÃ³n
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
                        data[i] = Math.min(255, gray + 1.5 * (r - gray));
                        data[i + 1] = Math.min(255, gray + 1.5 * (g - gray));
                        data[i + 2] = Math.min(255, gray + 1.5 * (b - gray));
                    }
                } else if (prompt.includes('blanco y negro') || prompt.includes('gris') || prompt.includes('grayscale')) {
                    // Blanco y negro
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
                        data[i] = gray;
                        data[i + 1] = gray;
                        data[i + 2] = gray;
                    }
                } else if (prompt.includes('sepia') || prompt.includes('vintage') || prompt.includes('antiguo')) {
                    // Efecto sepia
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                    }
                } else if (prompt.includes('invertir') || prompt.includes('negativo') || prompt.includes('invert')) {
                    // Invertir colores
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = 255 - data[i];
                        data[i + 1] = 255 - data[i + 1];
                        data[i + 2] = 255 - data[i + 2];
                    }
                } else if (prompt.includes('blur') || prompt.includes('difuminar') || prompt.includes('suave')) {
                    // Efecto blur simple
                    const original = new Uint8ClampedArray(data);
                    const width = editorCanvas.width;
                    const height = editorCanvas.height;
                    
                    for (let y = 1; y < height - 1; y++) {
                        for (let x = 1; x < width - 1; x++) {
                            const idx = (y * width + x) * 4;
                            for (let c = 0; c < 3; c++) {
                                let sum = 0;
                                for (let dy = -1; dy <= 1; dy++) {
                                    for (let dx = -1; dx <= 1; dx++) {
                                        const nidx = ((y + dy) * width + (x + dx)) * 4;
                                        sum += original[nidx + c];
                                    }
                                }
                                data[idx + c] = sum / 9;
                            }
                        }
                    }
                } else if (prompt.includes('nitidez') || prompt.includes('sharp') || prompt.includes('nÃ­tido')) {
                    // Aumentar nitidez
                    const original = new Uint8ClampedArray(data);
                    const width = editorCanvas.width;
                    const height = editorCanvas.height;
                    
                    for (let y = 1; y < height - 1; y++) {
                        for (let x = 1; x < width - 1; x++) {
                            const idx = (y * width + x) * 4;
                            for (let c = 0; c < 3; c++) {
                                const center = original[idx + c];
                                const top = original[((y-1) * width + x) * 4 + c];
                                const bottom = original[((y+1) * width + x) * 4 + c];
                                const left = original[(y * width + (x-1)) * 4 + c];
                                const right = original[(y * width + (x+1)) * 4 + c];
                                const avg = (top + bottom + left + right) / 4;
                                const sharpened = center + 2 * (center - avg);
                                data[idx + c] = Math.min(255, Math.max(0, sharpened));
                            }
                        }
                    }
                } else {
                    // Si no reconoce el comando, aplicar mejora general
                    const factor = 1.2;
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = Math.min(255, data[i] * factor);
                        data[i + 1] = Math.min(255, data[i + 1] * factor);
                        data[i + 2] = Math.min(255, data[i + 2] * factor);
                    }
                }
                
                // Aplicar cambios
                editorCtx.putImageData(imageData, 0, 0);
                
                // Actualizar imagen actual
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = editorCanvas.width;
                tempCanvas.height = editorCanvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(editorCanvas, 0, 0);
                
                const transformedImg = new Image();
                transformedImg.onload = function() {
                    editorCurrentImage = transformedImg;
                    editorOriginalImage = transformedImg;
                    document.getElementById('editorLoading').style.display = 'none';
                    alert('âœ… Â¡TransformaciÃ³n aplicada!\n\nðŸŽ¨ Efecto: "' + promptText + '"\n\nðŸ’¡ Tip: Puedes aplicar mÃºltiples efectos uno tras otro!');
                };
                transformedImg.src = tempCanvas.toDataURL('image/png', 1.0);
                
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('editorLoading').style.display = 'none';
                alert('âŒ Error: ' + error.message);
            }
        }
        
        // Fallback: EdiciÃ³n bÃ¡sica sin IA (cuando el servicio no estÃ¡ disponible)
        async function editorSmartEditBasic(promptText) {
            try {
                const prompt = promptText.toLowerCase();
                
                // Obtener datos de imagen
                const imageData = editorCtx.getImageData(0, 0, editorCanvas.width, editorCanvas.height);
                const data = imageData.data;
                
                // Aplicar efectos segÃºn el prompt
                if (prompt.includes('brillante') || prompt.includes('brillo')) {
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = Math.min(255, data[i] + 50);
                        data[i + 1] = Math.min(255, data[i + 1] + 50);
                        data[i + 2] = Math.min(255, data[i + 2] + 50);
                    }
                } else if (prompt.includes('oscuro') || prompt.includes('oscurecer')) {
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = Math.max(0, data[i] - 50);
                        data[i + 1] = Math.max(0, data[i + 1] - 50);
                        data[i + 2] = Math.max(0, data[i + 2] - 50);
                    }
                } else if (prompt.includes('contraste')) {
                    const factor = 1.5;
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * factor) + 128));
                        data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * factor) + 128));
                        data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * factor) + 128));
                    }
                } else if (prompt.includes('saturado') || prompt.includes('saturaciÃ³n') || prompt.includes('color')) {
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
                        data[i] = Math.min(255, gray + 1.5 * (r - gray));
                        data[i + 1] = Math.min(255, gray + 1.5 * (g - gray));
                        data[i + 2] = Math.min(255, gray + 1.5 * (b - gray));
                    }
                } else if (prompt.includes('blanco y negro') || prompt.includes('gris')) {
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
                        data[i] = gray;
                        data[i + 1] = gray;
                        data[i + 2] = gray;
                    }
                } else if (prompt.includes('sepia') || prompt.includes('vintage')) {
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                    }
                } else {
                    // Si no reconoce el comando, aplicar mejora general
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = Math.min(255, data[i] * 1.1);
                        data[i + 1] = Math.min(255, data[i + 1] * 1.1);
                        data[i + 2] = Math.min(255, data[i + 2] * 1.1);
                    }
                }
                
                // Aplicar cambios
                editorCtx.putImageData(imageData, 0, 0);
                
                document.getElementById('editorLoading').style.display = 'none';
                alert('âœ… Cambios aplicados!\n\nSe aplicÃ³: ' + promptText);
                
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('editorLoading').style.display = 'none';
                alert('âŒ Error: ' + error.message);
            }
        }

        // Editar con IA usando prompts de texto
        // Permite agregar elementos, texto, efectos, etc. a la imagen
        async function editorAiEdit() {
            if (!editorCurrentImage) {
                alert('Primero carga o genera una imagen');
                return;
            }
            
            const promptText = prompt('ðŸŽ¨ Â¿QuÃ© quieres hacer con la imagen?\n\nEjemplos:\nâ€¢ "AgrÃ©gale texto de anuncio de prÃ©stamos"\nâ€¢ "Ponle un fondo profesional de oficina"\nâ€¢ "Hazle un anuncio promocional"\nâ€¢ "AgrÃ©gale texto: PRÃ‰STAMOS RÃPIDOS"\nâ€¢ "Ponle efectos de marketing"\nâ€¢ "Hazla mÃ¡s profesional para publicidad"\n\nðŸ’¡ Describe lo que quieres agregar o cambiar:');
            
            if (!promptText || promptText.trim() === '') {
                return;
            }
            
            document.getElementById('editorLoading').style.display = 'flex';
            document.querySelector('#editorLoading .spinner').nextElementSibling.textContent = 'ðŸ¤– Editando con IA... (30-90 seg)';
            
            try {
                editorSaveState();
                
                // Convertir imagen actual a base64
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = editorCurrentImage.width;
                tempCanvas.height = editorCurrentImage.height;
                tempCtx.drawImage(editorCurrentImage, 0, 0);
                const imageBase64 = tempCanvas.toDataURL('image/png');
                
                console.log('ðŸš€ Enviando imagen y prompt a API de IA...');
                console.log('ðŸ“ Prompt:', promptText);
                
                // Llamar a la API de ediciÃ³n con IA
                const response = await fetch('/api/smart-edit-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        imageData: imageBase64,
                        prompt: promptText
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Error en la API: ' + response.statusText);
                }
                
                const result = await response.json();
                
                if (result.success && result.imageData) {
                    // Cargar imagen editada por IA
                    const editedImg = new Image();
                    editedImg.onload = function() {
                        editorCurrentImage = editedImg;
                        editorOriginalImage = editedImg;
                        
                        // Redibujar en canvas
                        editorCtx.fillStyle = '#2a2a2a';
                        editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
                        editorDrawImage(editedImg);
                        
                        document.getElementById('editorLoading').style.display = 'none';
                        alert('âœ… Â¡Imagen editada con IA!\n\nðŸŽ¨ Cambios aplicados:\nâ€¢ ' + promptText + '\n\nðŸ’Ž Editado con Stable Diffusion');
                    };
                    editedImg.onerror = function() {
                        document.getElementById('editorLoading').style.display = 'none';
                        alert('âŒ Error al cargar imagen editada');
                    };
                    editedImg.src = result.imageData;
                    
                } else {
                    document.getElementById('editorLoading').style.display = 'none';
                    alert('âŒ No se pudo editar la imagen\n\n' + (result.message || 'Servicio de IA no disponible'));
                }
                
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('editorLoading').style.display = 'none';
                alert('âŒ Error al editar con IA: ' + error.message);
            }
        }

        // Cargar plantillas automÃ¡ticamente al abrir la pÃ¡gina
        window.addEventListener('DOMContentLoaded', function() {
            // Cargar plantillas si la pestaÃ±a estÃ¡ activa
            if (document.getElementById('templatesEditorTab').classList.contains('active')) {
                loadTemplates();
                window.templatesLoaded = true;
            }
            
            // VERIFICACIÃ“N DE CARGA COMPLETA
            console.log('âœ… VERSION 5.0.0 - Build 20260228-SYNTAX-FIX');
            console.log('âœ… openImageEditor disponible:', typeof window.openImageEditor);
            console.log('âœ… showCampaigns disponible:', typeof window.showCampaigns);
            console.log('âœ… Editor de ImÃ¡genes IA cargado correctamente');
            
            // Exponer funciones globalmente
            window.openImageEditor = openImageEditor;
            window.showCampaigns = showCampaigns;
        });

        // ========== SELECTOR DE MAPA INTELIGENTE ==========
        let mapInstance = null;
        let mapMarkers = [];
        let selectedLocations = [];
        let currentMapLayer = 'street';

        function openMapSelector() {
            const modal = document.getElementById('mapSelectorModal');
            modal.style.display = 'flex';
            
            // Inicializar UI de ubicaciones seleccionadas
            updateSelectedLocationsUI();
            
            // Inicializar mapa si no existe
            if (!mapInstance) {
                setTimeout(() => {
                    initializeMap();
                }, 100);
            }
        }

        function closeMapSelector() {
            const modal = document.getElementById('mapSelectorModal');
            modal.style.display = 'none';
        }

        function initializeMap() {
            const mapDiv = document.getElementById('mapContainer');
            
            // Crear mapa centrado en Brasil
            mapInstance = L.map(mapDiv).setView([-14.235, -51.925], 4);
            
            // Capa de calles (por defecto)
            const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Â© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(mapInstance);
            
            // Capa satelital
            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Â© Esri',
                maxZoom: 19
            });
            
            // Guardar capas para cambiar vista
            window.mapLayers = {
                street: streetLayer,
                satellite: satelliteLayer
            };
            
            // Click en el mapa para agregar ubicaciÃ³n
            mapInstance.on('click', async function(e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                
                // Obtener nombre de la ciudad usando reverse geocoding
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
                    const data = await response.json();
                    
                    const city = data.address.city || data.address.town || data.address.village || data.address.state || 'UbicaciÃ³n';
                    const country = data.address.country || '';
                    const locationName = `${city}, ${country}`;
                    
                    addLocation(locationName, lat, lng);
                } catch (error) {
                    console.error('Error al obtener ubicaciÃ³n:', error);
                    addLocation(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`, lat, lng);
                }
            });
        }

        function toggleMapLayer() {
            if (!mapInstance) return;
            
            const btn = document.getElementById('mapLayerBtn');
            
            if (currentMapLayer === 'street') {
                // Cambiar a satelital
                mapInstance.removeLayer(window.mapLayers.street);
                mapInstance.addLayer(window.mapLayers.satellite);
                currentMapLayer = 'satellite';
                btn.innerHTML = 'ðŸ—ºï¸ Vista Normal';
            } else {
                // Cambiar a calles
                mapInstance.removeLayer(window.mapLayers.satellite);
                mapInstance.addLayer(window.mapLayers.street);
                currentMapLayer = 'street';
                btn.innerHTML = 'ðŸ›°ï¸ Vista Satelital';
            }
        }

        async function searchLocation() {
            const query = document.getElementById('mapSearchInput').value;
            if (!query) return;
            
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
                const data = await response.json();
                
                if (data.length > 0) {
                    const result = data[0];
                    const lat = parseFloat(result.lat);
                    const lng = parseFloat(result.lon);
                    
                    // Centrar mapa en la ubicaciÃ³n
                    mapInstance.setView([lat, lng], 12);
                    
                    // Agregar ubicaciÃ³n
                    addLocation(result.display_name, lat, lng);
                } else {
                    alert('âŒ No se encontrÃ³ la ubicaciÃ³n');
                }
            } catch (error) {
                console.error('Error al buscar ubicaciÃ³n:', error);
                alert('âŒ Error al buscar ubicaciÃ³n');
            }
        }

        function addLocation(name, lat, lng) {
            // Verificar si ya existe
            const exists = selectedLocations.some(loc => loc.name === name);
            if (exists) {
                alert(`âš ï¸ Esta ubicaciÃ³n ya estÃ¡ seleccionada:\n\n"${name}"\n\nSi quieres eliminarla, haz clic en la "Ã—" junto a su nombre en la lista de abajo.`);
                return;
            }
            
            // Agregar a lista
            const locationIndex = selectedLocations.length;
            selectedLocations.push({ name, lat, lng });
            
            // Agregar marcador al mapa con botÃ³n de eliminar
            const marker = L.marker([lat, lng]).addTo(mapInstance);
            const popupContent = `
                <div style="text-align: center;">
                    <strong>${name}</strong><br>
                    <button onclick="removeLocation(${locationIndex})" style="margin-top: 8px; padding: 4px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        ðŸ—‘ï¸ Eliminar
                    </button>
                </div>
            `;
            marker.bindPopup(popupContent).openPopup();
            mapMarkers.push(marker);
            
            // Actualizar UI
            updateSelectedLocationsUI();
        }

        function removeLocation(index) {
            // Remover de lista
            selectedLocations.splice(index, 1);
            
            // Remover marcador del mapa
            if (mapMarkers[index]) {
                mapInstance.removeLayer(mapMarkers[index]);
                mapMarkers.splice(index, 1);
            }
            
            // Actualizar UI
            updateSelectedLocationsUI();
            
            // Actualizar Ã­ndices de los popups restantes
            mapMarkers.forEach((marker, i) => {
                const loc = selectedLocations[i];
                if (loc) {
                    const popupContent = `
                        <div style="text-align: center;">
                            <strong>${loc.name}</strong><br>
                            <button onclick="removeLocation(${i})" style="margin-top: 8px; padding: 4px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                ðŸ—‘ï¸ Eliminar
                            </button>
                        </div>
                    `;
                    marker.setPopupContent(popupContent);
                }
            });
        }

        function updateSelectedLocationsUI() {
            const container = document.getElementById('selectedLocationsList');
            
            if (selectedLocations.length === 0) {
                container.innerHTML = '<span style="color: #8b949e; font-size: 13px;">Haz clic en el mapa o busca ciudades para agregar mÃºltiples ubicaciones</span>';
                return;
            }
            
            container.innerHTML = selectedLocations.map((loc, index) => `
                <div style="background: #2d3748; padding: 8px 16px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #e6edf3;">
                    <span>ðŸ“ ${loc.name}</span>
                    <button onclick="removeLocation(${index})" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 16px; padding: 0; width: 20px; height: 20px;">Ã—</button>
                </div>
            `).join('');
        }

        function clearMapSelections() {
            selectedLocations = [];
            
            // Remover todos los marcadores
            mapMarkers.forEach(marker => mapInstance.removeLayer(marker));
            mapMarkers = [];
            
            updateSelectedLocationsUI();
        }

        function applyMapSelections() {
            if (selectedLocations.length === 0) {
                alert('âš ï¸ Selecciona al menos una ubicaciÃ³n');
                return;
            }
            
            // Agregar ubicaciones como tags
            selectedLocations.forEach(loc => {
                addLocationTagFromMap(loc.name);
            });
            
            // Cerrar modal
            closeMapSelector();
            
            alert('âœ… ' + selectedLocations.length + ' ubicaciÃ³n(es) agregada(s)!');
        }

        function confirmLocations() {
            // Agregar ubicaciones como tags
            selectedLocations.forEach(loc => {
                addLocationTagFromMap(loc.name);
            });
            
            // Cerrar modal
            closeMapSelector();
            
            alert('âœ… ' + selectedLocations.length + ' ubicaciÃ³n(es) agregada(s)');
        }

        // Sistema de tags de ubicaciones
        let locationTags = [];

        function addLocationTag() {
            const input = document.getElementById('newLocationInput');
            const location = input.value.trim();
            
            if (!location) {
                alert('âš ï¸ Escribe una ubicaciÃ³n');
                return;
            }
            
            // Verificar si ya existe
            if (locationTags.includes(location)) {
                alert('âš ï¸ Esta ubicaciÃ³n ya estÃ¡ agregada');
                return;
            }
            
            // Agregar a la lista
            locationTags.push(location);
            
            // Limpiar input
            input.value = '';
            
            // Actualizar UI
            updateLocationTags();
            
            // Abrir el mapa automÃ¡ticamente para seguir agregando
            setTimeout(() => {
                openMapSelector();
            }, 300);
        }

        function addLocationTagFromMap(location) {
            // Verificar si ya existe
            if (locationTags.includes(location)) {
                return;
            }
            
            // Agregar a la lista
            locationTags.push(location);
            
            // Actualizar UI
            updateLocationTags();
            
            // Mantener el mapa abierto para seguir agregando
            // No cerramos el modal, solo mostramos un mensaje de Ã©xito
            console.log('âœ… UbicaciÃ³n agregada:', location);
        }

        // FunciÃ³n global para eliminar ubicaciÃ³n
        window.removeLocationTag = function(index) {
            console.log('ðŸ—‘ï¸ ELIMINANDO ubicaciÃ³n en Ã­ndice:', index, '- UbicaciÃ³n:', locationTags[index]);
            locationTags.splice(index, 1);
            updateLocationTags();
        };

        function updateLocationTags() {
            const container = document.getElementById('locationTagsContainer');
            const hiddenInput = document.getElementById('targetRegions');
            
            // Validar que los elementos existan
            if (!container) {
                console.error('âŒ No se encontrÃ³ locationTagsContainer');
                return;
            }
            
            if (locationTags.length === 0) {
                // Mostrar placeholder cuando no hay ubicaciones
                container.innerHTML = '<span id="locationTagsPlaceholder" style="color: #8b949e; font-size: 13px;">Haz clic en "Agregar UbicaciÃ³n" o usa el mapa</span>';
                if (hiddenInput) hiddenInput.value = '';
            } else {
                // Actualizar input oculto
                if (hiddenInput) hiddenInput.value = locationTags.join(', ');
                
                // Crear tags visuales con onclick inline (funciona con innerHTML)
                container.innerHTML = locationTags.map((location, index) => `
                    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #667eea; border-radius: 6px; font-size: 13px; color: white; font-weight: 600;">
                        <span>ðŸ“ ${location}</span>
                        <button type="button" onclick="window.removeLocationTag(${index}); return false;" style="background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; font-size: 18px; font-weight: bold; padding: 4px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s; line-height: 1;" onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='scale(1)'">Ã—</button>
                    </div>
                `).join('');
                
                console.log('âœ… Tags actualizados. Total:', locationTags.length);
            }
        }

        // ============================================
        // MONITOR DE CAMPAÃ‘AS EN TIEMPO REAL
        // ============================================

        let monitorInterval = null;

        function showMonitor(event) {
            // Cambiar navegaciÃ³n activa
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            event.currentTarget.classList.add('active');
            
            // Mostrar secciÃ³n de monitor
            document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
            document.getElementById('monitorSection').classList.add('active');
            
            // Cargar campaÃ±as inmediatamente
            loadCampaigns();
            
            // Actualizar cada 30 segundos
            if (monitorInterval) clearInterval(monitorInterval);
            monitorInterval = setInterval(loadCampaigns, 30000);
        }

        function showCampaigns(event) {
            // Cambiar navegaciÃ³n activa
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            event.currentTarget.classList.add('active');
            
            // Mostrar secciÃ³n de crear campaÃ±a
            document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
            document.getElementById('campaignsSection').classList.add('active');
            
            // Detener actualizaciÃ³n automÃ¡tica
            if (monitorInterval) {
                clearInterval(monitorInterval);
                monitorInterval = null;
            }
        }

        async function loadCampaigns() {
            try {
                // Actualizar timestamp
                const now = new Date();
                document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('es-BR');
                
                // Llamar a Facebook Graph API
                const response = await fetch('https://graph.facebook.com/v18.0/me/adaccounts?fields=campaigns{name,status,effective_status,daily_budget,lifetime_budget,insights{spend,impressions,reach,clicks}}&access_token=YOUR_ACCESS_TOKEN');
                
                if (!response.ok) {
                    throw new Error('Error al cargar campaÃ±as');
                }
                
                const data = await response.json();
                
                // Separar campaÃ±as activas e inactivas
                const activeCampaigns = [];
                const inactiveCampaigns = [];
                
                if (data.data && data.data[0] && data.data[0].campaigns) {
                    data.data[0].campaigns.data.forEach(campaign => {
                        if (campaign.effective_status === 'ACTIVE') {
                            activeCampaigns.push(campaign);
                        } else {
                            inactiveCampaigns.push(campaign);
                        }
                    });
                }
                
                // Renderizar campaÃ±as
                renderCampaigns(activeCampaigns, 'activeCampaignsContainer', true);
                renderCampaigns(inactiveCampaigns, 'inactiveCampaignsContainer', false);
                
            } catch (error) {
                console.error('Error al cargar campaÃ±as:', error);
                
                // Mostrar campaÃ±as de ejemplo mientras no hay conexiÃ³n real
                showExampleCampaigns();
            }
        }

        function showExampleCampaigns() {
            // CampaÃ±as de ejemplo para demostraciÃ³n
            const exampleActive = [
                {
                    name: 'Anuncio Rubiel',
                    effective_status: 'ACTIVE',
                    daily_budget: '1500',
                    insights: {
                        data: [{
                            spend: '45.50',
                            impressions: '2340',
                            reach: '1850',
                            clicks: '87'
                        }]
                    }
                }
            ];
            
            const exampleInactive = [
                {
                    name: 'CampaÃ±a de Prueba',
                    effective_status: 'PAUSED',
                    daily_budget: '1000',
                    insights: {
                        data: [{
                            spend: '0',
                            impressions: '0',
                            reach: '0',
                            clicks: '0'
                        }]
                    }
                }
            ];
            
            renderCampaigns(exampleActive, 'activeCampaignsContainer', true);
            renderCampaigns(exampleInactive, 'inactiveCampaignsContainer', false);
        }

        function renderCampaigns(campaigns, containerId, isActive) {
            const container = document.getElementById(containerId);
            
            if (campaigns.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #8b949e;">
                        <div style="font-size: 48px; margin-bottom: 16px;">${isActive ? 'âœ…' : 'â¸ï¸'}</div>
                        <p>No hay campaÃ±as ${isActive ? 'activas' : 'inactivas'} en este momento</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = campaigns.map(campaign => {
                const insights = campaign.insights && campaign.insights.data && campaign.insights.data[0] ? campaign.insights.data[0] : {};
                const spend = insights.spend || '0';
                const impressions = insights.impressions || '0';
                const reach = insights.reach || '0';
                const clicks = insights.clicks || '0';
                const budget = campaign.daily_budget ? (parseInt(campaign.daily_budget) / 100).toFixed(2) : '0.00';
                
                const statusColor = isActive ? '#10b981' : '#ef4444';
                const statusText = isActive ? 'ONLINE' : 'OFFLINE';
                const statusIcon = isActive ? 'ðŸŸ¢' : 'ðŸ”´';
                
                return `
                    <div style="background: #1a2332; border: 1px solid #2d3748; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                            <div>
                                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${campaign.name}</h3>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700;">${statusIcon} ${statusText}</span>
                                    <span style="color: #8b949e; font-size: 13px;">Presupuesto: R$ ${budget}/dÃ­a</span>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 16px;">
                            <div style="background: #0f1419; padding: 12px; border-radius: 8px;">
                                <div style="color: #8b949e; font-size: 12px; margin-bottom: 4px;">Gastado</div>
                                <div style="font-size: 18px; font-weight: 700; color: #3b82f6;">R$ ${spend}</div>
                            </div>
                            <div style="background: #0f1419; padding: 12px; border-radius: 8px;">
                                <div style="color: #8b949e; font-size: 12px; margin-bottom: 4px;">Impresiones</div>
                                <div style="font-size: 18px; font-weight: 700; color: #10b981;">${impressions}</div>
                            </div>
                            <div style="background: #0f1419; padding: 12px; border-radius: 8px;">
                                <div style="color: #8b949e; font-size: 12px; margin-bottom: 4px;">Alcance</div>
                                <div style="font-size: 18px; font-weight: 700; color: #f59e0b;">${reach}</div>
                            </div>
                            <div style="background: #0f1419; padding: 12px; border-radius: 8px;">
                                <div style="color: #8b949e; font-size: 12px; margin-bottom: 4px;">Clics</div>
                                <div style="font-size: 18px; font-weight: 700; color: #8b5cf6;">${clicks}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Cargar campaÃ±as de ejemplo al inicio
        document.addEventListener('DOMContentLoaded', function() {
            showExampleCampaigns();
        });

        // ============================================
        // FUNCIÃ“N PARA ABRIR EDITOR DE IMÃGENES IA
        // ============================================
        function openImageEditor(event) {
            // Cambiar navegaciÃ³n activa
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            event.currentTarget.classList.add('active');
            
            // Mostrar secciÃ³n del editor de imÃ¡genes
            document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
            document.getElementById('imageEditorSection').classList.add('active');
            
            // Detener actualizaciÃ³n automÃ¡tica del monitor
            if (monitorInterval) {
                clearInterval(monitorInterval);
                monitorInterval = null;
            }
            
            // Inicializar el editor si no estÃ¡ inicializado
            if (!editorCanvas) {
                initEditor();
            }
        }

        // ============================================
        // FUNCIÃ“N PARA ABRIR FACEBOOK ADS
        // ============================================
        function openFacebookAds(event) {
            window.open('https://business.facebook.com/adsmanager', '_blank');
        }
        
    </script>
