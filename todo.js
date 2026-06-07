// 待办事项应用 JavaScript

// 常量
const STORAGE_KEY = 'todo_entries';

// DOM元素
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const remainingCount = document.getElementById('remaining-count');
const footerActions = document.getElementById('footer-actions');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

// 状态变量
let tasks = [];
let currentFilter = 'all';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 加载保存的任务
    loadTasks();
    
    // 添加事件监听
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    // 筛选按钮事件
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
    
    // 初始渲染
    renderTasks();
    updateStats();
});

// 从localStorage加载任务
function loadTasks() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        tasks = data ? JSON.parse(data) : [];
    } catch {
        tasks = [];
    }
}

// 保存任务到localStorage
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
        console.error('无法保存任务到本地存储');
    }
}

// 添加新任务
function addTask() {
    const text = taskInput.value.trim();
    
    if (!text) {
        taskInput.focus();
        return;
    }
    
    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task);
    saveTasks();
    taskInput.value = '';
    taskInput.focus();
    
    renderTasks();
    updateStats();
}

// 切换任务完成状态
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

// 删除任务
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
}

// 清除已完成任务
function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
    updateStats();
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
    const completed = total - pending;
    
    taskCount.textContent = `${total} 项任务`;
    remainingCount.textContent = `${pending} 项待完成`;
}