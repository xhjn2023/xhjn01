// 健身时长记录应用 JavaScript

// API基础路径
const API_BASE = 'http://localhost:3000';

// 健身项目配置
const SPORTS = {
    running: { name: '跑步', icon: '🏃' },
    swimming: { name: '游泳', icon: '🏊' },
    strength: { name: '力量训练', icon: '🏋️' },
    cycling: { name: '骑行', icon: '🚴' },
    yoga: { name: '瑜伽', icon: '🧘' },
    basketball: { name: '篮球', icon: '🏀' },
    football: { name: '足球', icon: '⚽' },
    other: { name: '其他', icon: '🎯' }
};

// DOM元素
const authModal = document.getElementById('auth-modal');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const registerUsername = document.getElementById('register-username');
const registerPassword = document.getElementById('register-password');
const registerPassword2 = document.getElementById('register-password2');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const switchToRegister = document.getElementById('switch-to-register');
const switchToLogin = document.getElementById('switch-to-login');
const userNameDisplay = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const navTabs = document.querySelectorAll('.nav-tab');
const pages = document.querySelectorAll('.page');
const sportItems = document.querySelectorAll('.sport-item');
const selectedSportDisplay = document.getElementById('selected-sport');
const timerHours = document.getElementById('timer-hours');
const timerMinutes = document.getElementById('timer-minutes');
const timerSeconds = document.getElementById('timer-seconds');
const timerStartBtn = document.getElementById('timer-start');
const timerPauseBtn = document.getElementById('timer-pause');
const timerStopBtn = document.getElementById('timer-stop');
const inputHours = document.getElementById('input-hours');
const inputMinutes = document.getElementById('input-minutes');
const manualSaveBtn = document.getElementById('manual-save');
const todayDuration = document.getElementById('today-duration');
const todayCount = document.getElementById('today-count');
const todaySports = document.getElementById('today-sports');
const historyFilter = document.getElementById('history-filter');
const historyDate = document.getElementById('history-date');
const historyList = document.getElementById('history-list');
const periodBtns = document.querySelectorAll('.period-btn');
const totalDuration = document.getElementById('total-duration');
const avgDuration = document.getElementById('avg-duration');
const totalCount = document.getElementById('total-count');
const exportCsvBtn = document.getElementById('export-csv');
const exportJsonBtn = document.getElementById('export-json');
const exportStart = document.getElementById('export-start');
const exportEnd = document.getElementById('export-end');
const clearDataBtn = document.getElementById('clear-data');

// 状态变量
let currentUser = null;
let selectedSport = null;
let timerInterval = null;
let timerRunning = false;
let timerPaused = false;
let timerSecondsCount = 0;
let records = [];
let currentPeriod = 'week';
let sportChart = null;
let trendChart = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查本地存储的用户
    const savedUser = localStorage.getItem('fitness_user');
    if (savedUser) {
        currentUser = savedUser;
        showApp();
        loadRecords();
    }
    
    // 登录/注册切换
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
    });
    
    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'flex';
    });
    
    // 登录按钮
    loginBtn.addEventListener('click', handleLogin);
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // 注册按钮
    registerBtn.addEventListener('click', handleRegister);
    registerPassword2.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRegister();
    });
    
    // 退出按钮
    logoutBtn.addEventListener('click', handleLogout);
    
    // 导航标签切换
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // 健身项目选择
    sportItems.forEach(item => {
        item.addEventListener('click', () => selectSport(item.dataset.sport));
    });
    
    // 计时器控制
    timerStartBtn.addEventListener('click', startTimer);
    timerPauseBtn.addEventListener('click', pauseTimer);
    timerStopBtn.addEventListener('click', stopTimer);
    
    // 手动保存
    manualSaveBtn.addEventListener('click', saveManualRecord);
    
    // 历史筛选
    historyFilter.addEventListener('change', loadHistory);
    historyDate.addEventListener('change', loadHistory);
    
    // 统计周期
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentPeriod = btn.dataset.period;
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateStats();
        });
    });
    
    // 导出按钮
    exportCsvBtn.addEventListener('click', exportToCSV);
    exportJsonBtn.addEventListener('click', exportToJSON);
    
    // 清除数据
    clearDataBtn.addEventListener('click', clearAllData);
    
    // 设置默认日期
    const today = new Date().toISOString().split('T')[0];
    historyDate.value = today;
    exportEnd.value = today;
    exportStart.value = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
});

// 处理登录
function handleLogin() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    // 检查本地存储的用户数据
    const users = JSON.parse(localStorage.getItem('fitness_users') || '{}');
    
    if (users[username] && users[username] === password) {
        currentUser = username;
        localStorage.setItem('fitness_user', username);
        showApp();
        loadRecords();
        loginUsername.value = '';
        loginPassword.value = '';
    } else {
        alert('用户名或密码错误');
    }
}

// 处理注册
function handleRegister() {
    const username = registerUsername.value.trim();
    const password = registerPassword.value;
    const password2 = registerPassword2.value;
    
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    if (password !== password2) {
        alert('两次密码输入不一致');
        return;
    }
    
    if (password.length < 4) {
        alert('密码至少需要4个字符');
        return;
    }
    
    // 检查用户是否已存在
    const users = JSON.parse(localStorage.getItem('fitness_users') || '{}');
    
    if (users[username]) {
        alert('用户名已存在');
        return;
    }
    
    // 保存用户
    users[username] = password;
    localStorage.setItem('fitness_users', JSON.stringify(users));
    
    currentUser = username;
    localStorage.setItem('fitness_user', username);
    
    alert('注册成功！');
    showApp();
    registerUsername.value = '';
    registerPassword.value = '';
    registerPassword2.value = '';
}

// 处理退出
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('fitness_user');
    showAuth();
    stopTimer();
}

// 显示登录界面
function showAuth() {
    authModal.classList.add('show');
    appContainer.style.display = 'none';
}

// 显示主应用
function showApp() {
    authModal.classList.remove('show');
    appContainer.style.display = 'block';
    userNameDisplay.textContent = currentUser;
}

// 切换页面标签
function switchTab(tabName) {
    navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    pages.forEach(page => {
        page.classList.toggle('active', page.id === `${tabName}-page`);
    });
    
    if (tabName === 'history') {
        loadHistory();
    } else if (tabName === 'stats') {
        updateStats();
    }
}

// 选择健身项目
function selectSport(sport) {
    selectedSport = sport;
    
    sportItems.forEach(item => {
        item.classList.toggle('selected', item.dataset.sport === sport);
    });
    
    selectedSportDisplay.textContent = `已选择: ${SPORTS[sport].name}`;
    selectedSportDisplay.classList.add('has-sport');
}

// 开始计时
function startTimer() {
    if (!selectedSport) {
        alert('请先选择健身项目');
        return;
    }
    
    if (timerPaused) {
        // 继续计时
        timerPaused = false;
        timerInterval = setInterval(updateTimer, 1000);
        timerPauseBtn.style.display = 'inline-block';
        timerStartBtn.style.display = 'none';
    } else {
        // 开始新计时
        timerSecondsCount = 0;
        timerRunning = true;
        timerPaused = false;
        timerInterval = setInterval(updateTimer, 1000);
        timerStartBtn.style.display = 'none';
        timerPauseBtn.style.display = 'inline-block';
        timerStopBtn.style.display = 'inline-block';
    }
}

// 更新计时器显示
function updateTimer() {
    timerSecondsCount++;
    const h = Math.floor(timerSecondsCount / 3600);
    const m = Math.floor((timerSecondsCount % 3600) / 60);
    const s = timerSecondsCount % 60;
    
    timerHours.textContent = h.toString().padStart(2, '0');
    timerMinutes.textContent = m.toString().padStart(2, '0');
    timerSeconds.textContent = s.toString().padStart(2, '0');
}

// 暂停计时
function pauseTimer() {
    timerPaused = true;
    clearInterval(timerInterval);
    timerPauseBtn.style.display = 'none';
    timerStartBtn.style.display = 'inline-block';
    timerStartBtn.textContent = '继续';
}

// 结束计时并保存
function stopTimer() {
    if (timerSecondsCount > 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        timerPaused = false;
        
        const duration = Math.round(timerSecondsCount / 60); // 转换为分钟
        saveRecord(selectedSport, duration);
        
        // 重置计时器
        timerSecondsCount = 0;
        timerHours.textContent = '00';
        timerMinutes.textContent = '00';
        timerSeconds.textContent = '00';
        
        timerStartBtn.style.display = 'inline-block';
        timerStartBtn.textContent = '开始计时';
        timerPauseBtn.style.display = 'none';
        timerStopBtn.style.display = 'none';
    }
}

// 手动保存记录
function saveManualRecord() {
    if (!selectedSport) {
        alert('请先选择健身项目');
        return;
    }
    
    const hours = parseInt(inputHours.value) || 0;
    const minutes = parseInt(inputMinutes.value) || 0;
    const totalMinutes = hours * 60 + minutes;
    
    if (totalMinutes <= 0) {
        alert('请输入有效的时长');
        return;
    }
    
    saveRecord(selectedSport, totalMinutes);
    
    inputHours.value = 0;
    inputMinutes.value = 0;
}

// 保存记录到本地存储
function saveRecord(sport, duration) {
    const record = {
        id: Date.now(),
        sport: sport,
        duration: duration,
        date: new Date().toISOString(),
        userId: currentUser
    };
    
    // 保存到本地存储
    const allRecords = JSON.parse(localStorage.getItem('fitness_records') || '[]');
    allRecords.push(record);
    localStorage.setItem('fitness_records', JSON.stringify(allRecords));
    
    records = allRecords.filter(r => r.userId === currentUser);
    
    updateTodaySummary();
    
    alert(`记录保存成功！${SPORTS[sport].name} ${duration} 分钟`);
}

// 加载用户记录
function loadRecords() {
    const allRecords = JSON.parse(localStorage.getItem('fitness_records') || '[]');
    records = allRecords.filter(r => r.userId === currentUser);
    
    updateTodaySummary();
}

// 更新今日概览
function updateTodaySummary() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.date.split('T')[0] === today);
    
    const totalMinutes = todayRecords.reduce((sum, r) => sum + r.duration, 0);
    const uniqueSports = [...new Set(todayRecords.map(r => r.sport))];
    
    todayDuration.textContent = totalMinutes;
    todayCount.textContent = todayRecords.length;
    todaySports.textContent = uniqueSports.length > 0 
        ? uniqueSports.map(s => SPORTS[s].name).join('、') 
        : '-';
}

// 加载历史记录
function loadHistory() {
    const filter = historyFilter.value;
    const selectedDate = historyDate.value;
    
    let filteredRecords = [...records];
    
    if (filter === 'day' && selectedDate) {
        filteredRecords = records.filter(r => r.date.split('T')[0] === selectedDate);
    } else if (filter === 'week' && selectedDate) {
        const date = new Date(selectedDate);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        filteredRecords = records.filter(r => {
            const recordDate = new Date(r.date.split('T')[0]);
            return recordDate >= weekStart && recordDate <= weekEnd;
        });
    } else if (filter === 'month' && selectedDate) {
        const month = selectedDate.split('-')[1];
        const year = selectedDate.split('-')[0];
        
        filteredRecords = records.filter(r => {
            const recordMonth = r.date.split('-')[1];
            const recordYear = r.date.split('-')[0];
            return recordMonth === month && recordYear === year;
        });
    }
    
    // 按日期排序（最新在前）
    filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    renderHistoryList(filteredRecords);
}

// 渲染历史记录列表
function renderHistoryList(filteredRecords) {
    if (filteredRecords.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <p>暂无健身记录</p>
                <p class="empty-hint">开始记录您的健身时长吧！</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = filteredRecords.map(record => {
        const sport = SPORTS[record.sport];
        const date = new Date(record.date);
        const dateStr = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="history-item">
                <div class="history-item-left">
                    <span class="history-sport-icon">${sport.icon}</span>
                    <div class="history-info">
                        <span class="history-sport-name">${sport.name}</span>
                        <span class="history-date">${dateStr}</span>
                    </div>
                </div>
                <span class="history-duration">${record.duration}分钟</span>
                <button class="history-delete" onclick="deleteRecord(${record.id})">×</button>
            </div>
        `;
    }).join('');
}

// 删除记录
function deleteRecord(id) {
    if (!confirm('确定删除这条记录吗？')) return;
    
    const allRecords = JSON.parse(localStorage.getItem('fitness_records') || '[]');
    const newRecords = allRecords.filter(r => r.id !== id);
    localStorage.setItem('fitness_records', JSON.stringify(newRecords));
    
    records = newRecords.filter(r => r.userId === currentUser);
    
    loadHistory();
    updateTodaySummary();
}

// 更新统计数据
function updateStats() {
    const now = new Date();
    let startDate;
    
    if (currentPeriod === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
    } else if (currentPeriod === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
        startDate = new Date(now.getFullYear(), 0, 1);
    }
    
    const periodRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= startDate && recordDate <= now;
    });
    
    // 计算统计数据
    const totalMinutes = periodRecords.reduce((sum, r) => sum + r.duration, 0);
    const days = Math.ceil((now - startDate) / (24 * 60 * 60 * 1000));
    const avgMinutes = days > 0 ? Math.round(totalMinutes / days) : 0;
    
    totalDuration.textContent = totalMinutes;
    avgDuration.textContent = avgMinutes;
    totalCount.textContent = periodRecords.length;
    
    // 更新图表
    updateSportChart(periodRecords);
    updateTrendChart(periodRecords, startDate, now);
}

// 更新项目分布图表
function updateSportChart(records) {
    const sportData = {};
    
    records.forEach(r => {
        if (!sportData[r.sport]) {
            sportData[r.sport] = 0;
        }
        sportData[r.sport] += r.duration;
    });
    
    const labels = Object.keys(sportData).map(s => SPORTS[s].name);
    const data = Object.values(sportData);
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    
    const ctx = document.getElementById('sport-chart').getContext('2d');
    
    if (sportChart) {
        sportChart.destroy();
    }
    
    sportChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// 更新时长趋势图表
function updateTrendChart(records, startDate, endDate) {
    const dailyData = {};
    
    // 填充日期
    const current = new Date(startDate);
    while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        dailyData[dateStr] = 0;
        current.setDate(current.getDate() + 1);
    }
    
    // 填充数据
    records.forEach(r => {
        const dateStr = r.date.split('T')[0];
        if (dailyData[dateStr] !== undefined) {
            dailyData[dateStr] += r.duration;
        }
    });
    
    const labels = Object.keys(dailyData).map(d => {
        const date = new Date(d);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    const data = Object.values(dailyData);
    
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '时长(分钟)',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 10 }
                    }
                },
                x: {
                    ticks: {
                        font: { size: 10 },
                        maxTicksLimit: 7
                    }
                }
            }
        }
    });
}

// 导出为CSV
function exportToCSV() {
    const startDate = exportStart.value;
    const endDate = exportEnd.value;
    
    let filteredRecords = [...records];
    
    if (startDate && endDate) {
        filteredRecords = records.filter(r => {
            const date = r.date.split('T')[0];
            return date >= startDate && date <= endDate;
        });
    }
    
    if (filteredRecords.length === 0) {
        alert('没有可导出的数据');
        return;
    }
    
    // 生成CSV内容
    const headers = ['日期', '项目', '时长(分钟)'];
    const rows = filteredRecords.map(r => {
        const date = new Date(r.date).toLocaleString('zh-CN');
        const sport = SPORTS[r.sport].name;
        return [date, sport, r.duration];
    });
    
    const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
    // 下载文件
    downloadFile(csvContent, 'fitness_records.csv', 'text/csv;charset=utf-8');
}

// 导出为JSON
function exportToJSON() {
    const startDate = exportStart.value;
    const endDate = exportEnd.value;
    
    let filteredRecords = [...records];
    
    if (startDate && endDate) {
        filteredRecords = records.filter(r => {
            const date = r.date.split('T')[0];
            return date >= startDate && date <= endDate;
        });
    }
    
    if (filteredRecords.length === 0) {
        alert('没有可导出的数据');
        return;
    }
    
    // 格式化数据
    const exportData = filteredRecords.map(r => ({
        date: new Date(r.date).toLocaleString('zh-CN'),
        sport: SPORTS[r.sport].name,
        duration: r.duration,
        durationFormatted: `${Math.floor(r.duration / 60)}小时${r.duration % 60}分钟`
    }));
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    
    downloadFile(jsonContent, 'fitness_records.json', 'application/json');
}

// 下载文件
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 清除所有数据
function clearAllData() {
    if (!confirm('确定清除所有健身记录吗？此操作不可恢复！')) return;
    
    const allRecords = JSON.parse(localStorage.getItem('fitness_records') || '[]');
    const newRecords = allRecords.filter(r => r.userId !== currentUser);
    localStorage.setItem('fitness_records', JSON.stringify(newRecords));
    
    records = [];
    
    updateTodaySummary();
    loadHistory();
    updateStats();
    
    alert('数据已清除');
}