const sliders = document.querySelectorAll('input[type="range"]');
const calcBtn = document.getElementById('calcBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const totalScoreDisplay = document.getElementById('totalScore');
const resultArea = document.getElementById('resultArea');
const historyList = document.getElementById('historyList');

// Поля ручного ввода
const titleInput = document.getElementById('titleInput');
const studioInput = document.getElementById('studioInput');
const genresInput = document.getElementById('genresInput');
const yearInput = document.getElementById('yearInput');
const posterInput = document.getElementById('posterInput');

const top25List = document.getElementById('top25List');
const clearTopBtn = document.getElementById('clearTopBtn');

const archiveYearSelect = document.getElementById('archiveYearSelect');
const clearSeasonsBtn = document.getElementById('clearSeasonsBtn');
const seasonBtns = document.querySelectorAll('.season-btn');

// Системные переменные
let currentSelectedSeason = 'winter';
const currentSystemYear = new Date().getFullYear();

// Установка дефолтного года в поле ввода
yearInput.value = currentSystemYear;

// БАЗА ДАННЫХ ИЗ LOCALSTORAGE
let evaluations = JSON.parse(localStorage.getItem('animeRates')) || [];
let top25Data = JSON.parse(localStorage.getItem('animeTop25')) || [];
let seasonsData = JSON.parse(localStorage.getItem('animeSeasonsTop')) || {};

// Автоочистка данных старше 5 лет
function cleanOldSeasonsData() {
    let changed = false;
    for (let year in seasonsData) {
        if (currentSystemYear - parseInt(year) > 5) {
            delete seasonsData[year];
            changed = true;
        }
    }
    if (changed) localStorage.setItem('animeSeasonsTop', JSON.stringify(seasonsData));
}
cleanOldSeasonsData();

// НАСТРОЙКА ВЫПАДАЮЩЕГО СПИСКА ГОДОВ
function initYearSelect() {
    const years = Object.keys(seasonsData).map(Number);
    if (!years.includes(currentSystemYear)) {
        years.push(currentSystemYear);
    }
    years.sort((a, b) => b - a);

    archiveYearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    archiveYearSelect.value = currentSystemYear;
}

archiveYearSelect.addEventListener('change', () => {
    renderSeasonsTop(parseInt(archiveYearSelect.value));
});

// Переключение кнопок сезона
seasonBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        seasonBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSelectedSeason = btn.getAttribute('data-season');
    });
});

// РЕНДЕР КОРОЛЯ СЕЗОНА (1 ТАЙТЛ НА СЕЗОН С ПОСТЕРОМ)
function renderSeasonsTop(year) {
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    const yearData = seasonsData[year] || {};

    seasons.forEach(s => {
        const winnerContainer = document.getElementById(`winner-${s}`);
        const leader = yearData[s]; // Тут теперь лежит один объект, а не массив

        if (!leader) {
            winnerContainer.innerHTML = '<p class="empty-text">Нет лидера</p>';
            return;
        }

        winnerContainer.innerHTML = `
            <img src="${leader.poster}" class="winner-poster" alt="poster">
            <span class="winner-title" title="${leader.name}">${leader.name}</span>
            <span class="winner-meta">${leader.studio || 'Без студии'}</span>
            <div class="winner-score" style="color: ${leader.color}">${leader.score}</div>
        `;
    });
}

// ОБНОВЛЕНИЕ ЛИДЕРА СЕЗОНА (ОСТАЕТСЯ ТОЛЬКО 1 ЛУЧШИЙ)
function checkAndAddToSeasonsTop(newEntry, targetYear) {
    if (!seasonsData[targetYear]) seasonsData[targetYear] = {};
    
    const currentLeader = seasonsData[targetYear][currentSelectedSeason];

    // Если лидера еще нет, или новая оценка выше текущего лидера — перезаписываем слот
    if (!currentLeader || newEntry.score > currentLeader.score) {
        seasonsData[targetYear][currentSelectedSeason] = newEntry;
    }

    localStorage.setItem('animeSeasonsTop', JSON.stringify(seasonsData));
    
    initYearSelect();
    archiveYearSelect.value = targetYear;
    renderSeasonsTop(targetYear);
}

// ЛОГИКА ТАБОВ
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetTabId = btn.getAttribute('data-tab');
        tabContents.forEach(content => {
            content.id === targetTabId ? content.classList.remove('hidden') : content.classList.add('hidden');
        });
    });
});

// ЛОГИКА ДЛЯ ТОП-25
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
            <div class="history-left">
                <img src="${item.poster}" class="history-poster" alt="poster">
                <div class="history-info">
                    <b>${index + 1}. ${item.name}</b>
                    <span class="history-meta-text">${item.year} г. • Студия: ${item.studio}</span>
                </div>
            </div>
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

// РЕНДЕР ИСТОРЫ ОЦЕНОК
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
            <div class="history-left">
                <img src="${item.poster}" class="history-poster" alt="poster">
                <div class="history-info">
                    <b>${item.name}</b>
                    <span class="history-meta-text">${item.year} г. • ${item.genres} [${item.studio}]</span>
                </div>
            </div>
            <div class="score-badge" style="color: ${item.color}">${item.score}</div>
        `;
        historyList.appendChild(div);
    });
}

// Покраска ползунков
function updateSliderColor(slider) {
    const percent = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #2563EB ${percent}%, #1e293b ${percent}%)`;
    slider.parentElement.style.setProperty('--percent', `${percent}%`);
}

sliders.forEach(slider => {
    slider.addEventListener('input', () => {
        document.getElementById(slider.id + 'Val').textContent = slider.value;
        updateSliderColor(slider);
    });
    updateSliderColor(slider);
});

// РАСЧЕТ И СОХРАНЕНИЕ С РУЧНЫМИ ДАННЫМИ
calcBtn.addEventListener('click', () => {
    const name = titleInput.value.trim() || "Без названия";
    const studio = studioInput.value.trim() || "Не указана";
    const genres = genresInput.value.trim() || "Не указаны";
    const year = parseInt(yearInput.value) || currentSystemYear;
    
    // Дефолтная заглушка-постер, если пользователь оставил поле пустым
    const defaultPoster = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop';
    const poster = posterInput.value.trim() || defaultPoster;
    
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

    const entry = { 
        name, studio, genres, year, poster,
        score: finalScore, 
        color: statusColor, 
        date: new Date().toISOString() 
    };
    
    evaluations.push(entry);
    localStorage.setItem('animeRates', JSON.stringify(evaluations));
    
    checkAndAddToTop25(entry);
    checkAndAddToSeasonsTop(entry, year);
    
    // Очищаем форму
    titleInput.value = '';
    studioInput.value = '';
    genresInput.value = '';
    posterInput.value = '';
    yearInput.value = currentSystemYear;
    
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

// Очистить историю
clearBtn.addEventListener('click', () => {
    if (evaluations.length === 0) return alert("История и так пуста!");
    if (confirm("Очистить историю последних оценок? Топы сохранятся.")) {
        evaluations = [];
        localStorage.removeItem('animeRates');
        renderHistory();
    }
});

// Очистить Топ-25
clearTopBtn.addEventListener('click', () => {
    if (top25Data.length === 0) return alert("Топ-25 пуст!");
    if (confirm("Вы уверены, что хотите сбросить Топ-25 (Зал Славы)?")) {
        top25Data = [];
        localStorage.removeItem('animeTop25');
        renderTop25();
    }
});

// Сброс топа сезонов за год
clearSeasonsBtn.addEventListener('click', () => {
    const selectedYear = parseInt(archiveYearSelect.value);
    if (!seasonsData[selectedYear] || Object.keys(seasonsData[selectedYear]).length === 0) {
        return alert(`Архив за ${selectedYear} год пуст!`);
    }
    if (confirm(`Удалить лидеров сезонов за ${selectedYear} год?`)) {
        delete seasonsData[selectedYear];
        localStorage.setItem('animeSeasonsTop', JSON.stringify(seasonsData));
        initYearSelect();
        renderSeasonsTop(parseInt(archiveYearSelect.value));
    }
});

// Старт инициализации
initYearSelect();
renderHistory();
renderTop25();
renderSeasonsTop(parseInt(archiveYearSelect.value));
