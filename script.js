const sliders = document.querySelectorAll('input[type="range"]');
const calcBtn = document.getElementById('calcBtn');
const clearBtn = document.getElementById('clearBtn');
const totalScoreDisplay = document.getElementById('totalScore');
const resultArea = document.getElementById('resultArea');
const historyList = document.getElementById('historyList');

// Переключатель тем
const themeToggleBtn = document.getElementById('themeToggleBtn');

// Элементы Модального Окна
const detailsModal = document.getElementById('detailsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalPoster = document.getElementById('modalPoster');
const modalTitle = document.getElementById('modalTitle');
const modalMeta = document.getElementById('modalMeta');
const modalScore = document.getElementById('modalScore');
const modalScoresGrid = document.getElementById('modalScoresGrid');
const editAnimeBtn = document.getElementById('editAnimeBtn');

// Элементы панели фильтрации
const searchHistoryInput = document.getElementById('searchHistoryInput');
const filterGenreSelect = document.getElementById('filterGenreSelect');
const filterStudioSelect = document.getElementById('filterStudioSelect');
const sortHistorySelect = document.getElementById('sortHistorySelect');

// Поля ручного ввода
const titleInput = document.getElementById('titleInput');
const studioInput = document.getElementById('studioInput');
const genresInput = document.getElementById('genresInput');
const yearInput = document.getElementById('yearInput');
const posterInput = document.getElementById('posterInput');

// Топ-25 элементы
const top25List = document.getElementById('top25List');
const clearTopBtn = document.getElementById('clearTopBtn');
const exportRatesBtn = document.getElementById('exportRatesBtn');
const importRatesFile = document.getElementById('importRatesFile');

const archiveYearSelect = document.getElementById('archiveYearSelect');
const clearSeasonsBtn = document.getElementById('clearSeasonsBtn');
const seasonBtns = document.querySelectorAll('.season-btn');

// Элементы профиля
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileRegDate = document.getElementById('profileRegDate');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');

const statCount = document.getElementById('statCount');
const statAvg = document.getElementById('statAvg');
const statStudio = document.getElementById('statStudio');
const statGenre = document.getElementById('statGenre');

const exportProfileBtn = document.getElementById('exportProfileBtn');
const importProfileFile = document.getElementById('importProfileFile');

// Системные переменные
let currentSelectedSeason = 'winter';
const currentSystemYear = new Date().getFullYear();
let activeViewingId = null; 

yearInput.value = currentSystemYear;

// БАЗА ДАННЫХ ИЗ LOCALSTORAGE
let evaluations = JSON.parse(localStorage.getItem('animeRates')) || [];
let top25Data = JSON.parse(localStorage.getItem('animeTop25')) || [];
let seasonsData = JSON.parse(localStorage.getItem('animeSeasonsTop')) || {};
let profileData = JSON.parse(localStorage.getItem('animeProfile')) || null;

// ЛОГИКА ТЕМЫ
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeToggleBtn.textContent = '☀';
} else {
    themeToggleBtn.textContent = '🌙';
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeToggleBtn.textContent = isLight ? '☀' : '🌙';
    sliders.forEach(slider => updateSliderColor(slider));
});

// ИНИЦИАЛИЗАЦИЯ И УПРАВЛЕНИЕ ПРОФИЛЕМ 
function initProfile() {
    const defaultAvatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
    
    if (!profileData) {
        const randId = Math.floor(1000 + Math.random() * 9000);
        const today = new Date();
        const formattedDate = String(today.getDate()).padStart(2, '0') + '.' + 
                              String(today.getMonth() + 1).padStart(2, '0') + '.' + 
                              today.getFullYear();
                              
        profileData = {
            nickname: `#${randId}`,
            avatar: defaultAvatarUrl,
            regDate: formattedDate
        };
        localStorage.setItem('animeProfile', JSON.stringify(profileData));
    }
    
    renderProfileView();
    calculateAnalytics();
}

function renderProfileView() {
    profileName.textContent = profileData.nickname;
    profileAvatar.src = profileData.avatar;
    profileRegDate.textContent = `Регистрация: ${profileData.regDate}`;
}

profileName.addEventListener('click', () => {
    const newName = prompt("Введите ваш новый никнейм:", profileData.nickname);
    if (newName && newName.trim() !== "") {
        profileData.nickname = newName.trim();
        localStorage.setItem('animeProfile', JSON.stringify(profileData));
        renderProfileView();
    }
});

changeAvatarBtn.addEventListener('click', () => {
    const newAvatarUrl = prompt("Вставьте URL-ссылку на новую картинку аватарки:", profileData.avatar);
    if (newAvatarUrl && newAvatarUrl.trim() !== "") {
        profileData.avatar = newAvatarUrl.trim();
        localStorage.setItem('animeProfile', JSON.stringify(profileData));
        renderProfileView();
    }
});

// УМНАЯ СТАТИСТИКА
function calculateAnalytics() {
    if (evaluations.length === 0) {
        statCount.textContent = "0";
        statAvg.textContent = "0.0";
        statStudio.textContent = "—";
        statGenre.textContent = "—";
        return;
    }

    statCount.textContent = evaluations.length;

    const totalSum = evaluations.reduce((acc, item) => acc + item.score, 0);
    statAvg.textContent = (totalSum / evaluations.length).toFixed(1);

    const studioMetrics = {};
    const genreMetrics = {};

    evaluations.forEach(item => {
        if (item.studio && item.studio !== "Не указана") {
            const st = item.studio.trim();
            if (!studioMetrics[st]) studioMetrics[st] = { count: 0, totalScore: 0 };
            studioMetrics[st].count++;
            studioMetrics[st].totalScore += item.score;
        }

        if (item.genres && item.genres !== "Не указаны") {
            item.genres.split(',').forEach(g => {
                const gen = g.trim();
                if (gen !== "") {
                    if (!genreMetrics[gen]) genreMetrics[gen] = { count: 0, totalScore: 0 };
                    genreMetrics[gen].count++;
                    genreMetrics[gen].totalScore += item.score;
                }
            });
        }
    });

    let bestStudio = "—";
    let maxStudioWeight = -1;
    for (let st in studioMetrics) {
        const avg = studioMetrics[st].totalScore / studioMetrics[st].count;
        const weight = studioMetrics[st].count * 1.5 + avg; 
        if (weight > maxStudioWeight) {
            maxStudioWeight = weight;
            bestStudio = st;
        }
    }
    statStudio.textContent = bestStudio;

    let topGenre = "—";
    let maxGenreCount = -1;
    for (let gen in genreMetrics) {
        if (genreMetrics[gen].count > maxGenreCount) {
            maxGenreCount = genreMetrics[gen].count;
            topGenre = gen;
        }
    }
    statGenre.textContent = topGenre;
}

// Резервная копия только карточки профиля
exportProfileBtn.addEventListener('click', () => {
    const profileBackup = {
        profile: profileData,
        rates: evaluations
    };
    const dataStr = JSON.stringify(profileBackup, null, 4);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profileData.nickname.replace(/[\s#]/g, '_')}_profile.json`;
    link.click();
    URL.revokeObjectURL(url);
});

importProfileFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsed = JSON.parse(event.target.result);
            if (parsed && parsed.profile && Array.isArray(parsed.rates)) {
                profileData = parsed.profile;
                evaluations = parsed.rates;
                
                localStorage.setItem('animeProfile', JSON.stringify(profileData));
                localStorage.setItem('animeRates', JSON.stringify(evaluations));
                
                rebuildAllTops();
                renderHistory();
                renderProfileView();
                calculateAnalytics();
                
                alert("Профиль и статистика успешно импортированы!");
            } else {
                alert("Ошибка: Неверный формат резервной копии профиля.");
            }
        } catch (err) {
            alert("Не удалось прочитать файл резервной копии.");
        }
        importProfileFile.value = ""; 
    };
    reader.readAsText(file);
});

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

seasonBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        seasonBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSelectedSeason = btn.getAttribute('data-season');
    });
});

// РЕНДЕР КОРОЛЯ СЕЗОНА
function renderSeasonsTop(year) {
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    const yearData = seasonsData[year] || {};

    seasons.forEach(s => {
        const winnerContainer = document.getElementById(`winner-${s}`);
        const leader = yearData[s];

        if (!leader) {
            winnerContainer.innerHTML = '<p class="empty-text">Нет лидера</p>';
            winnerContainer.onclick = null;
            winnerContainer.style.cursor = 'default';
            return;
        }

        winnerContainer.innerHTML = `
            <img src="${leader.poster}" class="winner-poster" alt="poster">
            <span class="winner-title" title="${leader.name}">${leader.name}</span>
            <span class="winner-meta">${leader.studio || 'Без студии'}</span>
            <div class="winner-score" style="color: ${leader.color}">${leader.score}</div>
        `;
        
        winnerContainer.style.cursor = 'pointer';
        const targetId = leader.id || leader.date;
        winnerContainer.onclick = () => showAnimeDetails(targetId);
    });
}

function checkAndAddToSeasonsTop(newEntry, targetYear, assignedSeason) {
    if (!seasonsData[targetYear]) seasonsData[targetYear] = {};
    
    const currentLeader = seasonsData[targetYear][assignedSeason];

    if (!currentLeader || newEntry.score > currentLeader.score) {
        seasonsData[targetYear][assignedSeason] = newEntry;
    }

    localStorage.setItem('animeSeasonsTop', JSON.stringify(seasonsData));
    
    initYearSelect();
    archiveYearSelect.value = targetYear;
    renderSeasonsTop(targetYear);
}

// Полный пересчет Зала Славы и Королей Сезонов
function rebuildAllTops() {
    let sorted = [...evaluations].sort((a, b) => b.score - a.score);
    let newTop25 = [];
    sorted.forEach(entry => {
        if (!newTop25.some(item => item.name.toLowerCase() === entry.name.toLowerCase())) {
            newTop25.push(entry);
        }
    });
    top25Data = newTop25.slice(0, 25);
    localStorage.setItem('animeTop25', JSON.stringify(top25Data));

    seasonsData = {};
    evaluations.forEach(entry => {
        if (entry.year && entry.season) {
            if (!seasonsData[entry.year]) seasonsData[entry.year] = {};
            const currentLeader = seasonsData[entry.year][entry.season];
            if (!currentLeader || entry.score > currentLeader.score) {
                seasonsData[entry.year][entry.season] = entry;
            }
        }
    });
    localStorage.setItem('animeSeasonsTop', JSON.stringify(seasonsData));

    initYearSelect();
    renderTop25();
    renderSeasonsTop(parseInt(archiveYearSelect.value));
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

// ==========================================
// ЛОГИКА ДЛЯ ТОП-25 (С ТОЧЕЧНЫМ УДАЛЕНИЕМ)
// ==========================================
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
        
        const targetId = item.id || item.date;
        
        div.addEventListener('click', (e) => {
            if (e.target.closest('.inline-delete-btn')) return;
            showAnimeDetails(targetId);
        });

        div.innerHTML = `
            <div class="history-left">
                <img src="${item.poster}" class="history-poster" alt="poster">
                <div class="history-info">
                    <b>${index + 1}. ${item.name}</b>
                    <span class="history-meta-text">${item.year} г. • Студия: ${item.studio}</span>
                </div>
            </div>
            <div class="history-right-block">
                <div class="score-badge" style="color: ${item.color}">${item.score}</div>
                <button class="inline-delete-btn" title="Удалить из Топ-25">&times;</button>
            </div>
        `;

        const deleteBtn = div.querySelector('.inline-delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            if (confirm(`Удалить аниме «${item.name}» только из списка Топ-25?`)) {
                top25Data.splice(index, 1);
                localStorage.setItem('animeTop25', JSON.stringify(top25Data));
                renderTop25();
            }
        });

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

// УПРАВЛЕНИЕ ОСНОВНОЙ БАЗОЙ ТАЙТЛОВ ИЗ ВКЛАДКИ ТОП-25
exportRatesBtn.addEventListener('click', () => {
    if (evaluations.length === 0) return alert("База оценок пуста!");
    const dataStr = JSON.stringify(evaluations, null, 4);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "anime_rates_database.json";
    link.click();
    URL.revokeObjectURL(url);
});

importRatesFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsed = JSON.parse(event.target.result);
            if (Array.isArray(parsed)) {
                evaluations = parsed;
                localStorage.setItem('animeRates', JSON.stringify(evaluations));
                
                rebuildAllTops();
                renderHistory();
                calculateAnalytics();
                
                alert("База оценок успешно импортирована!");
            } else {
                alert("Ошибка: Файл должен содержать массив оценок.");
            }
        } catch (err) {
            alert("Не удалось корректно прочитать файл JSON.");
        }
        importRatesFile.value = ""; 
    };
    reader.readAsText(file);
});

// ДИНАМИЧЕСКИЕ СЕЛЕКТОРЫ
function updateFilterSelectOptions() {
    const currentGenreSelection = filterGenreSelect.value;
    const currentStudioSelection = filterStudioSelect.value;

    const genresSet = new Set();
    const studiosSet = new Set();

    evaluations.forEach(item => {
        if (item.genres && item.genres !== "Не указаны") {
            item.genres.split(',').forEach(g => genresSet.add(g.trim()));
        }
        if (item.studio && item.studio !== "Не указана") {
            studiosSet.add(item.studio.trim());
        }
    });

    filterGenreSelect.innerHTML = '<option value="">Все жанры</option>' + 
        Array.from(genresSet).sort().map(g => `<option value="${g}">${g}</option>`).join('');

    filterStudioSelect.innerHTML = '<option value="">Все студии</option>' + 
        Array.from(studiosSet).sort().map(s => `<option value="${s}">${s}</option>`).join('');

    filterGenreSelect.value = currentGenreSelection;
    filterStudioSelect.value = currentStudioSelection;
}

// ИСТОРИЯ ОЦЕНОК
function renderHistory() {
    historyList.innerHTML = '';
    updateFilterSelectOptions();

    if (evaluations.length === 0) {
        historyList.innerHTML = '<p class="empty-text">История оценок пуста</p>';
        return;
    }

    const searchQuery = searchHistoryInput.value.toLowerCase().trim();
    const selectedGenre = filterGenreSelect.value;
    const selectedStudio = filterStudioSelect.value;
    const currentSort = sortHistorySelect.value;

    let filteredList = evaluations.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery);
        const matchesGenre = !selectedGenre || 
            (item.genres && item.genres.split(',').map(g => g.trim().toLowerCase()).includes(selectedGenre.toLowerCase()));
        const matchesStudio = !selectedStudio || 
            (item.studio && item.studio.trim().toLowerCase() === selectedStudio.toLowerCase());

        return matchesSearch && matchesGenre && matchesStudio;
    });

    if (currentSort === 'new') {
        filteredList.reverse(); 
    } else if (currentSort === 'scoreDesc') {
        filteredList.sort((a, b) => b.score - a.score);
    } else if (currentSort === 'scoreAsc') {
        filteredList.sort((a, b) => a.score - b.score);
    }

    if (filteredList.length === 0) {
        historyList.innerHTML = '<p class="empty-text">Совпадений по фильтрам не найдено</p>';
        return;
    }

    filteredList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.style.borderLeftColor = item.color;
        const targetId = item.id || item.date;
        div.addEventListener('click', () => showAnimeDetails(targetId));
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

searchHistoryInput.addEventListener('input', renderHistory);
filterGenreSelect.addEventListener('change', renderHistory);
filterStudioSelect.addEventListener('change', renderHistory);
sortHistorySelect.addEventListener('change', renderHistory);

// МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ
const CRITERIA_NAMES = {
    story: 'Сюжет',
    chars: 'Персонажи / Рисовка',
    visual: 'Анимация',
    music: 'Музыка',
    originality: 'Оригинальность',
    ending: 'Финал',
    real: 'Реализация',
    vibe: 'Вайб / Атмосфера'
};

function showAnimeDetails(id) {
    const anime = evaluations.find(item => String(item.id || item.date) === String(id));
    if (!anime) return;
    
    activeViewingId = id;
    modalPoster.src = anime.poster;
    modalTitle.textContent = anime.name;
    modalMeta.textContent = `${anime.year} г. • Студия: ${anime.studio} • Жанры: ${anime.genres}`;
    modalScore.textContent = anime.score;
    modalScore.style.color = anime.color;
    
    modalScoresGrid.innerHTML = '';
    if (anime.slidersData) {
        for (let key in anime.slidersData) {
            const maxVal = (key === 'real' || key === 'vibe') ? 5 : 10;
            const item = document.createElement('div');
            item.className = 'modal-score-item';
            item.innerHTML = `
                <span>${CRITERIA_NAMES[key] || key}:</span>
                <span>${anime.slidersData[key]} / ${maxVal}</span>
            `;
            modalScoresGrid.appendChild(item);
        }
    } else {
        modalScoresGrid.innerHTML = '<p class="empty-text">Подробные критерии недоступны</p>';
    }
    
    detailsModal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => detailsModal.classList.add('hidden'));
detailsModal.addEventListener('click', (e) => {
    if (e.target === detailsModal) detailsModal.classList.add('hidden');
});

editAnimeBtn.addEventListener('click', () => {
    const anime = evaluations.find(item => String(item.id || item.date) === String(activeViewingId));
    if (!anime) return;
    
    titleInput.value = anime.name;
    studioInput.value = anime.studio;
    genresInput.value = anime.genres;
    yearInput.value = anime.year;
    posterInput.value = anime.poster === 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop' ? '' : anime.poster;
    
    if (anime.season) {
        currentSelectedSeason = anime.season;
        seasonBtns.forEach(b => {
            if (b.getAttribute('data-season') === anime.season) b.classList.add('active');
            else b.classList.remove('active');
        });
    }
    
    if (anime.slidersData) {
        for (let key in anime.slidersData) {
            const slider = document.getElementById(key);
            if (slider) {
                slider.value = anime.slidersData[key];
                document.getElementById(key + 'Val').textContent = anime.slidersData[key];
                updateSliderColor(slider);
            }
        }
    }
    
    evaluations = evaluations.filter(item => String(item.id || item.date) !== String(activeViewingId));
    localStorage.setItem('animeRates', JSON.stringify(evaluations));
    
    rebuildAllTops();
    renderHistory();
    calculateAnalytics();
    
    document.querySelector('.tab-btn[data-tab="mainTab"]').click();
    detailsModal.classList.add('hidden');
    
    titleInput.focus();
    titleInput.scrollIntoView({ behavior: 'smooth' });
});

function updateSliderColor(slider) {
    const percent = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    const isLight = document.body.classList.contains('light-theme');
    const trackColor = isLight ? '#e2e8f0' : '#1e293b';
    slider.style.background = `linear-gradient(to right, #2563EB ${percent}%, ${trackColor} ${percent}%)`;
    slider.parentElement.style.setProperty('--percent', `${percent}%`);
}

sliders.forEach(slider => {
    slider.addEventListener('input', () => {
        document.getElementById(slider.id + 'Val').textContent = slider.value;
        updateSliderColor(slider);
    });
    updateSliderColor(slider);
});

// РАСЧЕТ И СОХРАНЕНИЕ С ГЛАВНОЙ
calcBtn.addEventListener('click', () => {
    const name = titleInput.value.trim() || "Без названия";
    const studio = studioInput.value.trim() || "Не указана";
    const genres = genresInput.value.trim() || "Не указаны";
    const year = parseInt(yearInput.value) || currentSystemYear;
    
    const defaultPoster = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop';
    const poster = posterInput.value.trim() || defaultPoster;
    
    let currentSum = 0;
    let maxSum = 0;
    let slidersData = {};
    
    sliders.forEach(s => {
        currentSum += parseFloat(s.value);
        maxSum += parseFloat(s.max); 
        slidersData[s.id] = parseFloat(s.value); 
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
        id: Date.now(), 
        name, studio, genres, year, poster,
        score: finalScore, 
        color: statusColor, 
        slidersData, 
        season: currentSelectedSeason,
        date: new Date().toISOString() 
    };
    
    evaluations.push(entry);
    localStorage.setItem('animeRates', JSON.stringify(evaluations));
    
    checkAndAddToTop25(entry);
    checkAndAddToSeasonsTop(entry, year, currentSelectedSeason);
    calculateAnalytics();
    
    titleInput.value = '';
    studioInput.value = '';
    genresInput.value = '';
    posterInput.value = '';
    yearInput.value = currentSystemYear;
    
    renderHistory();
    resultArea.scrollIntoView({ behavior: 'smooth' });
});

// Полная очистка логов на Главной
clearBtn.addEventListener('click', () => {
    if (evaluations.length === 0) return alert("История и так пуста!");
    if (confirm("Очистить историю последних оценок? Топы сохранятся.")) {
        evaluations = [];
        localStorage.removeItem('animeRates');
        renderHistory();
        calculateAnalytics();
    }
});

// Очистить Весь Топ-25
clearTopBtn.addEventListener('click', () => {
    if (top25Data.length === 0) return alert("Топ-25 пуст!");
    if (confirm("Вы уверены, что хотите полностью очистить Топ-25 (Зал Славы)?")) {
        top25Data = [];
        localStorage.removeItem('animeTop25');
        renderTop25();
    }
});

// Сброс лидеров за год
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

// СТАРТ
initProfile();
initYearSelect();
renderHistory();
renderTop25();
renderSeasonsTop(parseInt(archiveYearSelect.value));
