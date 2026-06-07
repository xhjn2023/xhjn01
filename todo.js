// 待办事项应用 JavaScript (增强版)

// API基础路径
const API_BASE = 'http://localhost:3000';

// DOM元素
const loginModal = document.getElementById('login-modal');
const editModal = document.getElementById('edit-modal');
const appContainer = document.getElementById('app-container');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const userList = document.getElementById('user-list');
const welcomeUser = document.getElementById('welcome-user');
const switchUserBtn = document.getElementById('switch-user');
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const remainingCount = document.getElementById('remaining-count');
const footerActions = document.getElementById('footer-actions');
const clearCompletedBtn = document.getElementById('clear-completed');
const quickFilterBtns = document.querySelectorAll('.quick-filter-btn');
const sortSelect = document.getElementById('sort-select');
const dateFilterInput = document.getElementById('date-filter-input');
const clearDateFilterBtn = document.getElementById('clear-date-filter');
const todayCount = document.getElementById('today-count');
const overdueCount = document.getElementById('overdue-count');
const pendingCount = document.getElementById('pending-count');
const completedCount = document.getElementById('completed-count');
const editText = document.getElementById('edit-text');
const editDueDate = document.getElementById('edit-due-date');
const editReminder = document.getElementById('edit-reminder');
const saveEditBtn = document.getElementById('save-edit');
const cancelEditBtn = document.getElementById('cancel-edit');

// 状态变量
let currentUser = localStorage.getItem('todo_username') || '';
let tasks = [];
let currentFilter = 'all';
let currentSort = 'createdAt';
let currentDateFilter = '';
let editingTaskId = null;
let reminderInterval = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 添加事件监听
    loginBtn.addEventListener('click', handleLogin);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    switchUserBtn.addEventListener('click', switchUser);
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    // 快捷筛选按钮
    quickFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => setQuickFilter(btn.dataset.filter));
    });
    
    // 排序选择
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        loadTasks();
    });
    
    // 日期筛选
    dateFilterInput.addEventListener('change', (e) => {
        currentDateFilter = e.target.value;
        if (currentDateFilter) {
            setQuickFilter('date');
        } else {
            setQuickFilter('all');
        }
    });
    clearDateFilterBtn.addEventListener('click', () => {
        currentDateFilter = '';
        dateFilterInput.value = '';
        setQuickFilter('all');
    });
    
    // 编辑模态框
    saveEditBtn.addEventListener('click', saveEdit);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });
    
    // 检查是否已登录
    if (currentUser) {
        showApp();
        loadTasks();
    } else {
        showLogin();
    }
    
    // 启动提醒检查
    startReminderCheck();
    
    // 请求通知权限
    requestNotificationPermission();
});

// 显示登录界面
function showLogin() {
    loginModal.classList.add('show');
    appContainer.style.display = 'none';
    loadUserList();
}

// 显示主应用
function showApp() {
    loginModal.classList.remove('show');
    appContainer.style.display = 'block';
    welcomeUser.textContent = currentUser;
}

// 处理登录
async function handleLogin() {
    const username = usernameInput.value.trim();
    
    if (!username) {
        usernameInput.focus();
        return;
    }
    
    currentUser = username;
    localStorage.setItem('todo_username', username);
    usernameInput.value = '';
    showApp();
    await loadTasks();
}

// 加载用户列表
async function loadUserList() {
    try {
        const response = await fetch(`${API_BASE}/api/users`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            userList.innerHTML = result.data.map(user => 
                `<div class="user-item" onclick="selectUser('${user}')">${escapeHtml(user)}</div>`
            ).join('');
            document.getElementById('user-list-section').style.display = 'block';
        } else {
            document.getElementById('user-list-section').style.display = 'none';
        }
    } catch {
        document.getElementById('user-list-section').style.display = 'none';
    }
}

// 选择已有用户
function selectUser(username) {
    currentUser = username;
    localStorage.setItem('todo_username', username);
    showApp();
    loadTasks();
}

// 切换用户
function switchUser() {
    currentUser = '';
    localStorage.removeItem('todo_username');
    showLogin();
}

// 从服务器加载任务
async function loadTasks() {
    try {
        let url = `${API_BASE}/api/todos/${currentUser}?sortBy=${currentSort}`;
        if (currentFilter !== 'all' && currentFilter !== 'date') {
            url += `&filterBy=${currentFilter}`;
        }
        if (currentDateFilter) {
            url += `&filterBy=date&date=${currentDateFilter}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            tasks = result.data;
        } else {
            tasks = [];
        }
    } catch {
        tasks = [];
    }
    
    renderTasks();
    updateStats();
    updateDetailedStats();
}

// 设置快捷筛选
function setQuickFilter(filter) {
    currentFilter = filter;
    
    // 更新按钮状态
    quickFilterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    // 如果不是日期筛选，清除日期筛选输入
    if (filter !== 'date') {
        currentDateFilter = '';
        dateFilterInput.value = '';
    }
    
    loadTasks();
}

// 添加新任务
async function addTask() {
    const text = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    
    if (!text) {
        taskInput.focus();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/todos/${currentUser}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, dueDate })
        });
        
        const result = await response.json();
        
        if (result.success) {
            taskInput.value = '';
            dueDateInput.value = '';
            loadTasks();
        }
    } catch {
        alert('添加失败，请检查服务器是否运行');
    }
}

// 切换任务完成状态
async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/todos/${currentUser}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !task.completed })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadTasks();
        }
    } catch {
        alert('更新失败，请检查服务器是否运行');
    }
}

// 打开编辑模态框
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    editingTaskId = id;
    editText.value = task.text;
    editDueDate.value = task.dueDate || '';
    
    // 处理提醒时间格式
    if (task.reminder) {
        const reminderDate = new Date(task.reminder);
        const localDateTime = reminderDate.toISOString().slice(0, 16);
        editReminder.value = localDateTime;
    } else {
        editReminder.value = '';
    }
    
    editModal.classList.add('show');
}

// 关闭编辑模态框
function closeEditModal() {
    editModal.classList.remove('show');
    editingTaskId = null;
}

// 保存编辑
async function saveEdit() {
    if (!editingTaskId) return;
    
    const text = editText.value.trim();
    const dueDate = editDueDate.value || null;
    const reminder = editReminder.value ? new Date(editReminder.value).toISOString() : null;
    
    if (!text) {
        editText.focus();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/todos/${currentUser}/${editingTaskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, dueDate, reminder })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeEditModal();
            loadTasks();
        }
    } catch {
        alert('保存失败，请检查服务器是否运行');
    }
}

// 删除任务
async function deleteTask(id) {
    try {
        const response = await fetch(`${API_BASE}/api/todos/${currentUser}/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadTasks();
        }
    } catch {
        alert('删除失败，请检查服务器是否运行');
    }
}

// 清除已完成任务
async function clearCompleted() {
    try {
        const response = await fetch(`${API_BASE}/api/todos/${currentUser}/completed`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadTasks();
        }
    } catch {
        alert('清除失败，请检查服务器是否运行');
    }
}

// 获取任务状态类名
function getTaskStatusClass(task) {
    const today = new Date().toISOString().split('T')[0];
    
    if (task.completed) {
        return 'completed';
    }
    
    if (task.dueDate) {
        if (task.dueDate < today) {
            return 'overdue';
        }
        if (task.dueDate === today) {
            return 'today';
        }
    }
    
    return '';
}

// 获取日期状态类名
function getDateStatusClass(dateStr, isCompleted) {
    if (isCompleted) return '';
    const today = new Date().toISOString().split('T')[0];
    if (dateStr < today) return 'overdue';
    if (dateStr === today) return 'today';
    return '';
}

// 格式化日期显示
function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (dateStr === todayStr) return '今天';
    if (dateStr === tomorrowStr) return '明天';
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 渲染任务列表
function renderTasks() {
    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <p>暂无待办任务</p>
                <p class="empty-hint">添加新任务开始吧！</p>
            </div>
        `;
        footerActions.style.display = 'none';
        return;
    }
    
    footerActions.style.display = 'flex';
    
    taskList.innerHTML = tasks.map(task => {
        const statusClass = getTaskStatusClass(task);
        const dueDateClass = getDateStatusClass(task.dueDate, task.completed);
        
        // 构建日期信息
        let datesHtml = '';
        if (task.dueDate) {
            datesHtml += `<span class="task-date-item ${dueDateClass}">
                <span class="date-icon">📅</span>
                到期: ${formatDateDisplay(task.dueDate)}
            </span>`;
        }
        if (task.completed && task.completedAt) {
            datesHtml += `<span class="task-date-item">
                <span class="date-icon">✅</span>
                完成: ${formatDateDisplay(task.completedAt.split('T')[0])}
            </span>`;
        }
        if (task.reminder) {
            datesHtml += `<span class="task-reminder-icon">🔔</span>`;
        }
        
        return `
            <div class="task-item ${statusClass}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
                <div class="task-content">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <div class="task-dates">${datesHtml}</div>
                </div>
                <div class="task-actions">
                    <button class="task-edit" onclick="openEditModal(${task.id})">✏️</button>
                    <button class="task-delete" onclick="deleteTask(${task.id})">×</button>
                </div>
            </div>
        `;
    }).join('');
}

// 更新基础统计
function updateStats() {
    const total = tasks.length;
    const pending = tasks.filter(t => !t.completed).length;
    
    taskCount.textContent = `${total} 项任务`;
    remainingCount.textContent = `${pending} 项待完成`;
}

// 更新详细统计
function updateDetailedStats() {
    const today = new Date().toISOString().split('T')[0];
    
    const todayTasks = tasks.filter(t => t.dueDate === today && !t.completed).length;
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;
    const completedTasks = tasks.filter(t => t.completed).length;
    
    todayCount.textContent = todayTasks;
    overdueCount.textContent = overdueTasks;
    pendingCount.textContent = pendingTasks;
    completedCount.textContent = completedTasks;
}

// HTML转义防止XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 请求通知权限
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// 启动提醒检查
function startReminderCheck() {
    // 每分钟检查一次提醒
    reminderInterval = setInterval(checkReminders, 60000);
    // 立即检查一次
    checkReminders();
}

// 检查提醒
function checkReminders() {
    if (!currentUser || tasks.length === 0) return;
    
    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
    
    tasks.forEach(task => {
        if (task.reminder && !task.completed && !task.reminderShown) {
            const reminderTime = new Date(task.reminder);
            
            // 如果提醒时间在当前时间和5分钟后之间
            if (reminderTime >= now && reminderTime <= fiveMinutesLater) {
                showReminder(task);
                task.reminderShown = true; // 标记已显示，避免重复提醒
            }
        }
    });
}

// 显示提醒
function showReminder(task) {
    // 浏览器通知
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('待办提醒', {
            body: task.text,
            icon: '📋'
        });
    }
    
    // 页面内提示
    const reminderDiv = document.createElement('div');
    reminderDiv.className = 'reminder-popup';
    reminderDiv.innerHTML = `
        <div class="reminder-content">
            <span class="reminder-icon">🔔</span>
            <span class="reminder-text">提醒: ${escapeHtml(task.text)}</span>
            <button class="reminder-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    document.body.appendChild(reminderDiv);
    
    // 5秒后自动消失
    setTimeout(() => {
        reminderDiv.remove();
    }, 5000);
}