const sliders = document.querySelectorAll('input[type="range"]');
const calcBtn = document.getElementById('calcBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const totalScoreDisplay = document.getElementById('totalScore');
const resultArea = document.getElementById('resultArea');
const historyList = document.getElementById('historyList');

const titleInput = document.getElementById('titleInput');
const searchResults = document.getElementById('searchResults');
const top25List = document.getElementById('top25List');
const clearTopBtn = document.getElementById('clearTopBtn');

const archiveYearSelect = document.getElementById('archiveYearSelect');
const clearSeasonsBtn = document.getElementById('clearSeasonsBtn');
const seasonBtns = document.querySelectorAll('.season-btn');

// Системные переменные
let selectedAnimeYear = null;
let currentSelectedSeason = 'winter';
const currentSystemYear = new Date().getFullYear();

// РАЗДЕЛЬНАЯ ПАМЯТЬ ЛОКАЛСТОРАДЖА
let evaluations = JSON.parse(localStorage.getItem('animeRates')) || [];
let top25Data = JSON.parse(localStorage.getItem('animeTop25')) || [];
let seasonsData = JSON.parse(localStorage.getItem('animeSeasonsTop')) || {};

// ==========================================
// АВТОУДАЛЕНИЕ ДАННЫХ СТАРШЕ 5 ЛЕТ
// ==========================================
function cleanOldSeasonsData() {
    let changed = false;
    for (let year in seasonsData) {
        if (currentSystemYear - parseInt(year) > 5) {
            delete seasonsData[year];
            changed = true;
        }
    }
    if (changed) {
        localStorage.setItem('animeSeasonsTop', JSON.stringify(seasonsData));
    }
}
cleanOldSeasonsData();

// ==========================================
// НАСТРОЙКА ВЫПАДАЮЩЕГО СПИСКА ГОДОВ
// ==========================================
function initYearSelect() {
    const years = Object.keys(seasonsData).map(Number);
    if (!years.includes(currentSystemYear)) {
        years.push(currentSystemYear);
    }
    years.sort((a, b) => b - a);

    archiveYearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    archiveYearSelect.value = currentSystemYear;
}

// Переключение года в архиве топов
archiveYearSelect.addEventListener('change', () => {
    renderSeasonsTop(parseInt(archiveYearSelect.value));
});

// Переключение кнопок сезона в форме оценки
seasonBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        seasonBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSelectedSeason = btn.getAttribute('data-season');
    });
});

// ВЫВОД ТОП-3 ПО СЕЗОНАМ НА ЭКРАН
function renderSeasonsTop(year) {
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    const yearData = seasonsData[year] || {};

    seasons.forEach(s => {
        const slotsContainer = document.getElementById(`slots-${s}`);
        const list = yearData[s] || [];

        if (list.length === 0) {
            slotsContainer.innerHTML = '<p class="empty-text">Пусто</p>';
            return;
        }

        slotsContainer.innerHTML = list.map((item, index) => `
            <div class="slot-item" title="${item.name}">
                <span>${index + 1}. ${item.name}</span>
                <span class="slot-score" style="color: ${item.color}">${item.score}</span>
            </div>
        `).join('');
    });
}

// ДОБАВЛЕНИЕ АНИМЕ В ТОП-3 СЕЗОНА
function checkAndAddToSeasonsTop(newEntry, targetYear) {
    if (!seasonsData[targetYear]) seasonsData[targetYear] = {};
    if (!seasonsData[targetYear][currentSelectedSeason]) seasonsData[targetYear][currentSelectedSeason] = [];

    let currentList = seasonsData[targetYear][currentSelectedSeason];

    const existingIndex = currentList.findIndex(item => item.name.toLowerCase() === newEntry.name.toLowerCase());
    if (existingIndex !== -1) {
        if (newEntry.score > currentList[existingIndex].score) {
            currentList[existingIndex] = newEntry;
        }
    } else {
        currentList.push(newEntry);
    }

    currentList.sort((a, b) => b.score - a.score);
    seasonsData[targetYear][currentSelectedSeason] = currentList.slice(0, 3);

    localStorage.setItem('animeSeasonsTop', JSON.stringify(seasonsData));
    
    initYearSelect();
    archiveYearSelect.value = targetYear;
    renderSeasonsTop(targetYear);
}

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

// ИНТЕГРАЦИЯ С SHIKIMORI API
let searchTimeout = null;

titleInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = titleInput.value.trim();

    if (query.length < 3) {
        searchResults.classList.add('hidden');
        return;
    }

    searchTimeout = setTimeout(() => {
        fetch(`https://shikimori.one/api/animes?search=${encodeURIComponent(query)}&limit=5`)
            .then(res => res.json())
            .then(data => {
                if (data.length === 0) {
                    searchResults.classList.add('hidden');
                    return;
                }
                
                searchResults.innerHTML = data.map(anime => {
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

searchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.search-item');
    if (!item) return;

    titleInput.value = item.getAttribute('data-title');
    selectedAnimeYear = item.getAttribute('data-year');
    searchResults.classList.add('hidden');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchResults.classList.add('hidden');
    }
});


// ЛОГИКА ДЛЯ ТОП-25 (ЗАЛ СЛАВЫ)
function renderTop25() {
    top25List.innerHTML = '';
    
    if (top25Data.length === 0) {
        top25List.innerHTML = '<p class="empty-text">Топ-25 пока пуст. Оценивайте аниме на Главной!</p>';
        return;
    }

    top25Data.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.style.borderLeftColor = item.color;
        div.innerHTML = `
            <b>${index + 1}. ${item.name}</b>
            <div class="score-badge" style="color: ${item.color}">${item.score}</div>
        `;
        top25List.appendChild(div);
    });
}

function checkAndAddToTop25(newEntry) {
    const existingIndex = top25Data.findIndex(item => item.name.toLowerCase() === newEntry.name.toLowerCase());
    
    if (existingIndex !== -1) {
        if (newEntry.score > top25Data[existingIndex].score) {
            top25Data[existingIndex] = newEntry;
        }
    } else {
        top25Data.push(newEntry);
    }

    top25Data.sort((a, b) => b.score - a.score);
    top25Data = top25Data.slice(0, 25);

    localStorage.setItem('animeTop25', JSON.stringify(top25Data));
    renderTop25();
}


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

    const finalYear = selectedAnimeYear && selectedAnimeYear !== '—' ? parseInt(selectedAnimeYear) : currentSystemYear;

    const entry = { 
        name, 
        score: finalScore, 
        color: statusColor, 
        year: finalYear,
        date: new Date().toISOString() 
    };
    
    evaluations.push(entry);
    localStorage.setItem('animeRates', JSON.stringify(evaluations));
    
    checkAndAddToTop25(entry);
    checkAndAddToSeasonsTop(entry, finalYear);
    
    selectedAnimeYear = null;
    titleInput.value = '';
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

// Очистка оперативной истории
clearBtn.addEventListener('click', () => {
    if (evaluations.length === 0) return alert("История и так пуста!");
    if (confirm("Вы уверены, что хотите очистить историю последних оценок? Топ-25 и архивы сезонов при этом сохранятся.")) {
        evaluations = [];
        localStorage.removeItem('animeRates');
        renderHistory();
    }
});

// Отдельная очистка Топ-25
clearTopBtn.addEventListener('click', () => {
    if (top25Data.length === 0) return alert("Топ-25 и так пуст!");
    if (confirm("ВНИМАНИЕ! Вы уверены, что хотите ПОЛНОСТЬЮ СБРОСИТЬ ваш Топ-25 (Зал Славы)?")) {
        top25Data = [];
        localStorage.removeItem('animeTop25');
        renderTop25();
    }
});

// КНОПКА СБРОСА ТОПА СЕЗОНОВ ЗА КОНКРЕТНЫЙ ГОД
clearSeasonsBtn.addEventListener('click', () => {
    const selectedYear = parseInt(archiveYearSelect.value);
    
    // Проверяем, есть ли вообще данные в этом году
    if (!seasonsData[selectedYear] || Object.keys(seasonsData[selectedYear]).length === 0) {
        return alert(`Архив за ${selectedYear} год и так пуст!`);
    }

    if (confirm(`Вы уверены, что хотите полностью очистить топ сезонов за ${selectedYear} год? Данные за другие года останутся.`)) {
        // Удаляем конкретный год из объекта
        delete seasonsData[selectedYear];
        
        // Сохраняем обновленный объект в LocalStorage
        localStorage.setItem('animeSeasonsTop', JSON.stringify(seasonsData));
        
        // Переинициализируем выпадающий список годов и обновляем экран
        initYearSelect();
        renderSeasonsTop(parseInt(archiveYearSelect.value));
    }
});

// Инициализация при запуске страницы
initYearSelect();
renderHistory();
renderTop25();
renderSeasonsTop(parseInt(archiveYearSelect.value));
