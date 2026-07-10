const sliders = document.querySelectorAll('input[type="range"]');
const calcBtn = document.getElementById('calcBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const totalScoreDisplay = document.getElementById('totalScore');
const resultArea = document.getElementById('resultArea');
const historyList = document.getElementById('historyList');

const titleInput = document.getElementById('titleInput');
const searchResults = document.getElementById('searchResults');

// Переменная для хранения года выбранного аниме
let selectedAnimeYear = null;

// Память для истории
let evaluations = JSON.parse(localStorage.getItem('animeRates')) || [];

// ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetTabId = btn.getAttribute('data-tab');
        tabContents.forEach(content => {
            if (content.id === targetTabId) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
    });
});

// ==========================================
// ИНТЕГРАЦИЯ С SHIKIMORI API (ПУНКТ 4)
// ==========================================
let searchTimeout = null;

titleInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = titleInput.value.trim();

    if (query.length < 3) {
        searchResults.classList.add('hidden');
        return;
    }

    // Задержка 400мс, чтобы не спамить запросами при быстром наборе
    searchTimeout = setTimeout(() => {
        fetch(`https://shikimori.one/api/animes?search=${encodeURIComponent(query)}&limit=5`)
            .then(res => res.json())
            .then(data => {
                if (data.length === 0) {
                    searchResults.classList.add('hidden');
                    return;
                }
                
                searchResults.innerHTML = data.map(anime => {
                    // Извлекаем только год из полной даты (например, "2024-04-05")
                    const year = anime.aired_on ? anime.aired_on.split('-')[0] : '—';
                    return `
                        <div class="search-item" data-title="${anime.russian || anime.name}" data-year="${year}">
                            <span class="anime-title">${anime.russian || anime.name}</span>
                            <span class="anime-meta">${year} г.</span>
                        </div>
                    `;
                }).join('');
                
                searchResults.classList.remove('hidden');
            })
            .catch(err => console.error('Ошибка поиска Шикимори:', err));
    }, 400);
});

// Клик по выбранному элементу из списка результатов
searchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.search-item');
    if (!item) return;

    titleInput.value = item.getAttribute('data-title');
    selectedAnimeYear = item.getAttribute('data-year');
    searchResults.classList.add('hidden');
});

// Закрываем поиск, если кликнули в любое другое место экрана
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchResults.classList.add('hidden');
    }
});


// Обновление интерфейса истории
function renderHistory() {
    historyList.innerHTML = '';
    if (evaluations.length === 0) {
        historyList.innerHTML = '<p class="empty-text">История оценок пуста</p>';
        return;
    }
    evaluations.slice().reverse().forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.style.borderLeftColor = item.color;
        div.innerHTML = `
            <b>${item.name}</b>
            <div class="score-badge" style="color: ${item.color}">${item.score}</div>
        `;
        historyList.appendChild(div);
    });
}

// Заполнение цвета ползунков
function updateSliderColor(slider) {
    const percent = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #2563EB ${percent}%, #1e293b ${percent}%)`;
    slider.parentElement.style.setProperty('--percent', `${percent}%`);
}

// Инициализация ползунков
sliders.forEach(slider => {
    slider.addEventListener('input', () => {
        document.getElementById(slider.id + 'Val').textContent = slider.value;
        updateSliderColor(slider);
    });
    updateSliderColor(slider);
});

// Логика расчета
calcBtn.addEventListener('click', () => {
    const name = titleInput.value.trim() || "Без названия";
    
    let currentSum = 0;
    let maxSum = 0;
    
    sliders.forEach(s => {
        currentSum += parseFloat(s.value);
        maxSum += parseFloat(s.max); 
    });
    
    const finalScore = parseFloat(((currentSum / maxSum) * 100).toFixed(1));
    
    let statusColor = "#f43f5e"; 
    if (finalScore >= 80) statusColor = "#10b981"; 
    else if (finalScore >= 50) statusColor = "#3b82f6"; 

    resultArea.classList.remove('hidden');
    totalScoreDisplay.textContent = finalScore;
    totalScoreDisplay.style.color = statusColor;
    totalScoreDisplay.style.textShadow = `0 0 30px ${statusColor}66`;

    // Определяем год: берем из базы Шикимори, либо текущий год компа, если ввели вручную
    const finalYear = selectedAnimeYear && selectedAnimeYear !== '—' ? parseInt(selectedAnimeYear) : new Date().getFullYear();

    const entry = { 
        name, 
        score: finalScore, 
        color: statusColor, 
        year: finalYear,
        date: new Date().toISOString() 
    };
    
    evaluations.push(entry);
    localStorage.setItem('animeRates', JSON.stringify(evaluations));
    
    // Сбрасываем выбранный год для следующего ввода
    selectedAnimeYear = null;
    
    renderHistory();
    resultArea.scrollIntoView({ behavior: 'smooth' });
});

// Экспорт в JSON
exportBtn.addEventListener('click', () => {
    if (evaluations.length === 0) return alert("История пуста!");
    const dataStr = JSON.stringify(evaluations, null, 4);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "my_evaluations.json";
    link.click();
    URL.revokeObjectURL(url);
});

// Очистка истории
clearBtn.addEventListener('click', () => {
    if (evaluations.length === 0) return alert("История и так пуста!");
    if (confirm("Вы уверены, что хотите полностью очистить историю оценок?")) {
        evaluations = [];
        localStorage.removeItem('animeRates');
        renderHistory();
    }
});

// Первый запуск истории
renderHistory();
