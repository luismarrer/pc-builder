// Variables globales
let carrito = [];
let total = 0;
let moneda = '$'; // Moneda por defecto

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    inicializarDragAndDrop();
    cargarCarritoDesdeLocalStorage();
    actualizarCarrito();
    obtenerUbicacion();
});

const inicializarDragAndDrop = () => {
    // Obtener todos los componentes
    const componentes = document.querySelectorAll('.componente');
    const dropZone = document.getElementById('carrito-container');
    const componentesSection = document.getElementById('componentes-section');

    // Agregar eventos de drag a cada componente
    componentes.forEach(componente => {
        componente.addEventListener('dragstart', handleDragStart);
        componente.addEventListener('dragend', handleDragEnd);
    });

    // Agregar eventos de drop a la zona de carrito
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);

    // Agregar eventos de drop a la zona de componentes para eliminar del carrito
    componentesSection.addEventListener('dragover', handleDragOver);
    componentesSection.addEventListener('drop', handleRemoveFromCart);
    componentesSection.addEventListener('dragenter', handleDragEnter);
    componentesSection.addEventListener('dragleave', handleDragLeave);
}

const handleDragStart = (e) => {
    // Guardar los datos del componente que se está arrastrando
    const nombre = e.target.getAttribute('data-nombre');
    const precio = parseInt(e.target.getAttribute('data-precio'));
    const imagen = e.target.getAttribute('data-imagen');

    e.dataTransfer.setData('text/plain', JSON.stringify({
        nombre: nombre,
        precio: precio,
        imagen: imagen
    }));

    e.target.classList.add('dragging');
}

const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
}

const handleDragOver = (e) => {
    e.preventDefault(); // Permitir el drop
}

const handleDragEnter = (e) => {
    e.preventDefault();
    e.target.classList.add('drag-over');
}

const handleDragLeave = (e) => {
    e.target.classList.remove('drag-over');
}

const handleDrop = (e) => {
    e.preventDefault();
    e.target.classList.remove('drag-over');

    try {
        // Obtener los datos del componente
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        // Solo permitir componentes regulares, no elementos del carrito
        if (data.type === 'cart-item') {
            return; // No hacer nada si es un elemento del carrito
        }
        
        // Agregar al carrito solo si es un componente regular
        agregarAlCarrito(data);
    } catch (error) {
        console.error('Error al procesar el drop:', error);
        return;
    }
}

const agregarAlCarrito = (componente) => {
    // Validar que el componente no sea null y tenga precio válido
    if (!componente || !componente.nombre || !componente.precio || componente.precio <= 0) {
        alert('No se puede agregar este componente: precio inválido o componente no válido.');
        return;
    }
    
    // Verificar si el componente ya existe en el carrito
    const existe = carrito.find(item => item.nombre === componente.nombre);
    
    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({
            nombre: componente.nombre,
            precio: componente.precio,
            imagen: componente.imagen,
            cantidad: 1,
            id: Date.now() // ID único para poder eliminar
        });
    }

    actualizarCarrito();
}

const eliminarDelCarrito = (id) => {
    const item = carrito.find(item => item.id === id);
    if (item) {
        carrito = carrito.filter(item => item.id !== id);
    }
    actualizarCarrito();
}

const eliminarUnItem = (id) => {
    const item = carrito.find(item => item.id === id);
    if (item) {
        item.cantidad--;
        if (item.cantidad === 0) {
            carrito = carrito.filter(item => item.id !== id);
        }
    }
    actualizarCarrito();
}

const agregarUnItem = (id) => {
    const item = carrito.find(item => item.id === id);
    if (item) {
        item.cantidad++;
    }
    actualizarCarrito();
}

const actualizarCarrito = () => {
    const carritoItems = document.getElementById('carrito-items');
    const carritoVacio = document.querySelector('.carrito-vacio');
    const totalPrecio = document.getElementById('total-precio');
    const btnComprar = document.getElementById('btn-comprar');

    // Limpiar el contenido actual
    carritoItems.innerHTML = '';

    if (carrito.length === 0) {
        carritoVacio.style.display = 'block';
        total = 0;
        btnComprar.disabled = true;
    } else {
        carritoVacio.style.display = 'none';
        btnComprar.disabled = false;

        // Calcular total
        total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        // Crear elementos del carrito
        carrito.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'carrito-item';
            itemElement.draggable = true;
            itemElement.dataset.itemId = item.id;
            itemElement.addEventListener('dragstart', handleCartItemDragStart);
            itemElement.addEventListener('dragend', handleCartItemDragEnd);
            
            itemElement.innerHTML = `
                <img src="${item.imagen}" alt="${item.nombre}">
                <div class="item-info">
                    <h4>${item.nombre}</h4>
                    <p>${moneda}${item.precio} x ${item.cantidad}</p>
                    <p class="subtotal">${moneda}${item.precio * item.cantidad}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-cambiar-cantidad" id="minus" onclick="eliminarUnItem(${item.id})"><i class="fas fa-minus"></i></button>
                    <button class="btn-cambiar-cantidad" id="plus" onclick="agregarUnItem(${item.id})"><i class="fas fa-plus"></i></button>
                    <button class="btn-eliminar" onclick="eliminarDelCarrito(${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            carritoItems.appendChild(itemElement);
        });

        
    }

    // Actualizar el total
    totalPrecio.textContent = `${moneda}${total}`;
    
    // Guardar carrito en localStorage
    guardarCarritoEnLocalStorage();
}

// Funcionalidad adicional para los botones "Añadir al carrito"
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && e.target.textContent === 'Añadir al carrito') {
        const componente = e.target.closest('.componente');
        const componenteData = {
            nombre: componente.dataset.nombre,
            precio: parseInt(componente.dataset.precio),
            imagen: componente.dataset.imagen
        };
        agregarAlCarrito(componenteData);
    }
});

// Funcionalidad del botón finalizar compra
document.getElementById('btn-comprar').addEventListener('click', () => {

    if (total === NaN) {
        alert('Lo siento, parece que hubo un error al calcular el total. Por favor, inténtalo de nuevo más tarde.');
        return;
    }

    if (carrito.length > 0) {
        alert(`¡Compra realizada! Total: ${moneda}${total}\n\nComponentes:\n${carrito.map(item => `- ${item.nombre} x${item.cantidad}`).join('\n')}`);
        carrito = [];
        localStorage.removeItem('pc-builder-carrito');
        actualizarCarrito();
    }
});

// Funciones para manejar drag de elementos del carrito
const handleCartItemDragStart = (e) => {
    const itemId = e.target.dataset.itemId;
    e.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'cart-item',
        itemId: itemId
    }));
    e.target.classList.add('dragging');
}

const handleCartItemDragEnd = (e) => {
    e.target.classList.remove('dragging');
}

const handleRemoveFromCart = (e) => {
    e.preventDefault();
    e.target.classList.remove('drag-over');

    try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        // Solo procesar si es un elemento del carrito
        if (data.type === 'cart-item') {
            eliminarDelCarrito(parseInt(data.itemId));
        }
    } catch (error) {
        // Si no es un elemento del carrito, no hacer nada
        return;
    }
}

// Funciones de geolocalización
const obtenerUbicacion = () => {
    const ubicacionTexto = document.getElementById('ubicacion-texto');
    
    if (!navigator.geolocation) {
        ubicacionTexto.textContent = 'Geolocalización no soportada por este navegador.';
        return;
    }
    
    ubicacionTexto.textContent = 'Obteniendo ubicación...';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(4);
            const lon = position.coords.longitude.toFixed(4);
            ubicacionTexto.innerHTML = `<p>Lat:${lat} Lon:${lon}</p>`;
            
            // Determinar moneda basada en ubicación
            determinarMoneda(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    ubicacionTexto.textContent = 'Acceso a ubicación denegado.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    ubicacionTexto.textContent = 'Información de ubicación no disponible.';
                    break;
                case error.TIMEOUT:
                    ubicacionTexto.textContent = 'Tiempo de espera agotado.';
                    break;
                default:
                    ubicacionTexto.textContent = 'Error desconocido al obtener ubicación.';
                    break;
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

// Funciones de localStorage
const guardarCarritoEnLocalStorage = () => {
    if (carrito.length > 0) {
        localStorage.setItem('pc-builder-carrito', JSON.stringify(carrito));
    } else {
        localStorage.removeItem('pc-builder-carrito');
    }
}

const cargarCarritoDesdeLocalStorage = () => {
    const carritoGuardado = localStorage.getItem('pc-builder-carrito');
    
    if (carritoGuardado) {
        const confirmar = confirm('¿Quieres recuperar tu carrito anterior?');
        
        if (confirmar) {
            try {
                carrito = JSON.parse(carritoGuardado);
            } catch (error) {
                console.error('Error al cargar carrito desde localStorage:', error);
                localStorage.removeItem('pc-builder-carrito');
            }
        } else {
            localStorage.removeItem('pc-builder-carrito');
        }
    }
}

// Función para determinar moneda basada en coordenadas
const determinarMoneda = (lat, lon) => {
    // Europa: aproximadamente entre 35°N-71°N y 10°W-40°E
    if (lat >= 35 && lat <= 71 && lon >= -10 && lon <= 40) {
        moneda = '€';
    }
    // América del Norte y Sur: aproximadamente entre 83°N-56°S y 168°W-35°W
    else if (lon >= -168 && lon <= -35) {
        moneda = '$';
    }
    // Resto del mundo usa dólar por defecto
    else {
        moneda = '$';
    }
    
    // Actualizar todos los precios en la interfaz
    actualizarPreciosEnInterfaz();
}

// Función para actualizar todos los precios mostrados
const actualizarPreciosEnInterfaz = () => {
    // Actualizar precios en componentes
    const componentes = document.querySelectorAll('.componente');
    componentes.forEach(componente => {
        const precio = componente.dataset.precio;
        const precioElement = componente.querySelector('p:last-of-type');
        if (precioElement && precio) {
            precioElement.textContent = `${moneda}${precio}`;
        }
    });
    
    // Actualizar carrito si tiene elementos
    if (carrito.length > 0) {
        actualizarCarrito();
    }
}

// Event listener para el botón de ubicación
document.addEventListener('click', (e) => {
    if (e.target.id === 'btn-obtener-ubicacion') {
        obtenerUbicacion();
    }
});
