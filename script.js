// ==========================================
// ИНТЕГРАЦИЯ С SHIKIMORI API (ЧЕРЕЗ CORS ПРОКСИ)
// ==========================================
let searchTimeout = null;

titleInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = titleInput.value.trim();

    if (query.length < 3) {
        searchResults.classList.add('hidden');
        return;
    }

    searchTimeout = setTimeout(() => {
        // Базовый URL Шикимори
        const shikimoriUrl = `https://shikimori.one/api/animes?search=${encodeURIComponent(query)}&limit=5`;
        
        // Оборачиваем в бесплатный CORS-прокси для Гитхаба
        const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(shikimoriUrl)}`;

        fetch(proxyUrl)
            .then(res => res.json())
            .then(data => {
                if (!data || data.length === 0) {
                    searchResults.innerHTML = `
                        <div class="search-item" style="cursor: default; pointer-events: none;">
                            <span class="anime-title" style="color: var(--text-muted)">Ничего не найдено</span>
                        </div>
                    `;
                    searchResults.classList.remove('hidden');
                    return;
                }
                
                searchResults.innerHTML = data.map(anime => {
                    const year = anime.aired_on ? anime.aired_on.split('-')[0] : '—';
                    // Формируем полную ссылку на постер (Шикимори отдает относительный путь)
                    const posterUrl = anime.image && anime.image.preview 
                        ? `https://shikimori.one${anime.image.preview}` 
                        : 'https://placehold.co/40x60/1e293b/fff?text=?';

                    return `
                        <div class="search-item" data-title="${anime.russian || anime.name}" data-year="${year}">
                            <img src="${posterUrl}" class="search-poster" alt="poster">
                            <div class="search-info">
                                <span class="anime-title">${anime.russian || anime.name}</span>
                                <span class="anime-meta">${year} г.</span>
                            </div>
                        </div>
                    `;
                }).join('');
                
                searchResults.classList.remove('hidden');
            })
            .catch(err => {
                console.error('Ошибка поиска Шикимори:', err);
                searchResults.innerHTML = `
                    <div class="search-item" style="cursor: default; pointer-events: none;">
                        <span class="anime-title" style="color: #ef4444">Ошибка сети (введите название вручную)</span>
                    </div>
                `;
                searchResults.classList.remove('hidden');
            });
    }, 400); // Задержка, чтобы не спамить запросами при каждой букве
});

// Клик по результату поиска
searchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.search-item');
    if (!item || item.style.pointerEvents === 'none') return;

    titleInput.value = item.getAttribute('data-title');
    selectedAnimeYear = item.getAttribute('data-year');
    searchResults.classList.add('hidden');
});

// Закрытие поиска при клике в любое другое место страницы
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchResults.classList.add('hidden');
    }
});
