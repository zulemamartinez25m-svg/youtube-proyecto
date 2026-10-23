// Referencias a los elementos del DOM
const apiKeyInput = document.getElementById('api-key-input');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const feedContainer = document.getElementById('feed-container');
const statusMessage = document.getElementById('status-message');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

/**
 * Función principal para gestionar la búsqueda
 */
async function handleSearch() {
    const apiKey = apiKeyInput.value.trim();
    const query = searchInput.value.trim();

    // Validaciones iniciales de entrada
    if (!apiKey) {
        showStatus('Por favor, ingresa tu API Key de YouTube Data v3.', 'error');
        return;
    }

    if (!query) {
        showStatus('Por favor, ingresa un término o hashtag de búsqueda.', 'error');
        return;
    }

    showStatus('Cargando publicaciones...', 'info');
    clearFeed();

    // Consumo asíncrono de la API
    try {
        const data = await fetchYouTubeData(query, apiKey);
        
        if (!data.items || data.items.length === 0) {
            showStatus('No se encontraron resultados para la búsqueda realizada.', 'info');
            return;
        }

        hideStatus();
        renderFeed(data.items);
    } catch (error) {
        showStatus(error.message, 'error');
    }
}

/**
 * Función asíncrona que realiza la petición HTTP GET utilizando async/await y fetch
 */
async function fetchYouTubeData(query, apiKey) {
    const maxResults = 12;
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;

    const response = await fetch(endpoint);

    // Control de Errores HTTP
    if (!response.ok) {
        if (response.status === 400 || response.status === 403) {
            throw new Error('Error de autorización: Revisa que tu API Key sea válida o que no hayas excedido la cuota límite (Rate Limiting).');
        } else if (response.status === 404) {
            throw new Error('Servicio de API no encontrado.');
        } else {
            throw new Error(`Error en la solicitud HTTP (${response.status}): ${response.statusText}`);
        }
    }

    // Conversión de la respuesta a JSON mediante await
    return await response.json();
}

/**
 * Recorre los resultados y renderiza las tarjetas dinámicas en el DOM
 */
function renderFeed(items) {
    items.forEach(item => {
        const snippet = item.snippet;
        const videoId = item.id.videoId;

        // Formateo de fecha
        const formattedDate = formatDate(snippet.publishedAt);

        // Construcción de la tarjeta HTML
        const card = document.createElement('article');
        card.classList.add('card');

        card.innerHTML = `
            <img class="card-thumbnail" src="${snippet.thumbnails.high.url}" alt="${snippet.title}" loading="lazy">
            <div class="card-content">
                <h2 class="card-title">${snippet.title}</h2>
                <p class="card-author">Canal: <strong>${snippet.channelTitle}</strong></p>
                <p class="card-date">Publicado: ${formattedDate}</p>
                <a class="card-link" href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">
                    Ver video en YouTube ↗
                </a>
            </div>
        `;

        feedContainer.appendChild(card);
    });
}

/**
 * Función auxiliar para dar formato legible a las fechas ISO 8601
 */
function formatDate(isoString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(isoString).toLocaleDateString('es-ES', options);
}

/**
 * Utilidades para limpiar e interactuar con mensajes de estado en el DOM
 */
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

function hideStatus() {
    statusMessage.className = 'status-message hidden';
}

function clearFeed() {
    feedContainer.innerHTML = '';
}