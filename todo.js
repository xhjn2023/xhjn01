// 待办事项应用 JavaScript (后端API版)

// API基础路径
const API_BASE = 'http://localhost:3000';

// DOM元素
const loginModal = document.getElementById('login-modal');
const appContainer = document.getElementById('app-container');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const userList = document.getElementById('user-list');
const welcomeUser = document.getElementById('welcome-user');
const switchUserBtn = document.getElementById('switch-user');
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const remainingCount = document.getElementById('remaining-count');
const footerActions = document.getElementById('footer-actions');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

// 状态变量
let currentUser = localStorage.getItem('todo_username') || '';
let tasks = [];
let currentFilter = 'all';

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
    
    // 筛选按钮事件
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
    
    // 检查是否已登录
    if (currentUser) {
        showApp();
        loadTasks();
    } else {
        showLogin();
    }
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

// 加载用户列表（从服务器获取）
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
        const response = await fetch(`${API_BASE}/api/todos/${currentUser}`);
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
}

// 添加新任务
async function addTask() {
    const text = taskInput.value.trim();
    
    if (!text) {
        taskInput.focus();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/todos/${currentUser}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        const result = await response.json();
        
        if (result.success) {
            tasks.unshift(result.data);
            taskInput.value = '';
            renderTasks();
            updateStats();
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
            task.completed = !task.completed;
            renderTasks();
            updateStats();
        }
    } catch {
        alert('更新失败，请检查服务器是否运行');
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
            tasks = tasks.filter(t => t.id !== id);
            renderTasks();
            updateStats();
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
            tasks = result.data;
            renderTasks();
            updateStats();
        }
    } catch {
        alert('清除失败，请检查服务器是否运行');
    }
}

// 设置筛选
function setFilter(filter) {
    currentFilter = filter;
    
    // 更新按钮状态
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    renderTasks();
}

// 获取筛选后的任务
function getFilteredTasks() {
    switch (currentFilter) {
        case 'pending':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

// 渲染任务列表
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <p>暂无待办任务</p>
                    <p class="empty-hint">添加新任务开始吧！</p>
                </div>
            `;
        } else {
            taskList.innerHTML = `
                <div class="empty-state">
                    <p>没有符合条件的任务</p>
                </div>
            `;
        }
        footerActions.style.display = 'none';
        return;
    }
    
    footerActions.style.display = 'flex';
    
    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <button class="task-delete" onclick="deleteTask(${task.id})">×</button>
        </div>
    `).join('');
}

// HTML转义防止XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 更新统计数据
function updateStats() {
    const total = tasks.length;
    const pending = tasks.filter(t => !t.completed).length;
    
    taskCount.textContent = `${total} 项任务`;
    remainingCount.textContent = `${pending} 项待完成`;
}