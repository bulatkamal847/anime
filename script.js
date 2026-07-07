const sliders = document.querySelectorAll('input[type="range"]');
const calcBtn = document.getElementById('calcBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const totalScoreDisplay = document.getElementById('totalScore');
const resultArea = document.getElementById('resultArea');
const historyList = document.getElementById('historyList');

// Память для истории
let evaluations = JSON.parse(localStorage.getItem('animeRates')) || [];

// Обновление интерфейса истории
function renderHistory() {
    historyList.innerHTML = '';
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

// Заполнение цвета ползунков и передача позиции для значка ஐ
function updateSliderColor(slider) {
    const percent = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #2563EB ${percent}%, #1e293b ${percent}%)`;
    
    // Передаем процент в CSS родительского элемента, чтобы двигать символ 'ஐ'
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
    const name = document.getElementById('titleInput').value.trim() || "Без названия";
    
    let currentSum = 0;
    let maxSum = 0;
    
    sliders.forEach(s => {
        currentSum += parseFloat(s.value);
        maxSum += parseFloat(s.max); 
    });
    
    // Перевод в 100-балльную систему
    const finalScore = parseFloat(((currentSum / maxSum) * 100).toFixed(1));
    
    // Мягкая неоновая палитра для темной темы
    let statusColor = "#f43f5e"; // Неоновый красный/розовый (<50)
    if (finalScore >= 80) statusColor = "#10b981"; // Зеленый
    else if (finalScore >= 50) statusColor = "#3b82f6"; // Ярко-синий

    // Показываем результат
    resultArea.classList.remove('hidden');
    totalScoreDisplay.textContent = finalScore;
    totalScoreDisplay.style.color = statusColor;
    totalScoreDisplay.style.textShadow = `0 0 30px ${statusColor}66`;

    // Сохраняем
    const entry = { name, score: finalScore, color: statusColor, date: new Date().toISOString() };
    evaluations.push(entry);
    localStorage.setItem('animeRates', JSON.stringify(evaluations));
    
    renderHistory();
    resultArea.scrollIntoView({ behavior: 'smooth' });
});

// Экспорт в JSON-файл
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

// Логика полной очистки истории
clearBtn.addEventListener('click', () => {
    if (evaluations.length === 0) {
        alert("История и так пуста!");
        return;
    }

    if (confirm("Вы уверены, что хотите полностью очистить историю оценок?")) {
        evaluations = [];
        localStorage.removeItem('animeRates');
        renderHistory();
    }
});

// Первый запуск
renderHistory();
