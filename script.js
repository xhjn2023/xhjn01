// 日记应用 JavaScript

// 常量
const STORAGE_KEY = 'diary_entries';
const AUTO_SAVE_DELAY = 2000; // 自动保存延迟（毫秒）

// DOM元素
const datePicker = document.getElementById('date-picker');
const todayBtn = document.getElementById('today-btn');
const editor = document.getElementById('editor');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const historyList = document.getElementById('history-list');
const autoSaveStatus = document.getElementById('auto-save-status');
const confirmModal = document.getElementById('confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

// 状态变量
let currentDate = '';
let autoSaveTimer = null;
let deleteTargetDate = null;
let isAutoSaving = false;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 设置今天日期
    const today = new Date();
    currentDate = formatDate(today);
    datePicker.value = currentDate;
    
    // 加载日记内容
    loadDiary(currentDate);
    
    // 更新历史记录
    updateHistoryList();
    
    // 添加事件监听
    datePicker.addEventListener('change', onDateChange);
    todayBtn.addEventListener('click', setToday);
    saveBtn.addEventListener('click', saveDiary);
    clearBtn.addEventListener('click', clearEditor);
    editor.addEventListener('input', onEditorInput);
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    cancelDeleteBtn.addEventListener('click', closeModal);
    
    // 点击弹窗外部关闭
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) closeModal();
    });
});

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取日期显示格式
function getDisplayDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('zh-CN', options);
}

// 获取日期简短格式
function getShortDate(dateStr) {
    const date = new Date(dateStr);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('zh-CN', options);
}

// 加载日记
function loadDiary(date) {
    const entries = getEntries();
    const entry = entries[date];
    editor.innerHTML = entry ? entry.content : '';
    currentDate = date;
    
    // 更新历史记录高亮
    updateHistoryHighlight(date);
}

// 获取所有日记条目
function getEntries() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

// 保存日记条目
function saveEntries(entries) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        return true;
    } catch {
        return false;
    }
}

// 日期变更处理
function onDateChange(e) {
    const newDate = e.target.value;
    if (newDate) {
        loadDiary(newDate);
    }
}

// 设置今天日期
function setToday() {
    const today = new Date();
    const todayStr = formatDate(today);
    datePicker.value = todayStr;
    loadDiary(todayStr);
}

// 编辑器输入处理（触发自动保存）
function onEditorInput() {
    // 清除之前的定时器
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    
    // 显示"保存中..."状态
    if (!isAutoSaving) {
        autoSaveStatus.textContent = '⏳ 保存中...';
        autoSaveStatus.classList.add('saving');
    }
    
    // 设置新的自动保存定时器
    autoSaveTimer = setTimeout(() => {
        autoSaveDiary();
    }, AUTO_SAVE_DELAY);
}

// 自动保存日记
function autoSaveDiary() {
    isAutoSaving = true;
    const content = editor.innerHTML.trim();
    
    if (content) {
        const entries = getEntries();
        entries[currentDate] = {
            content: content,
            lastModified: new Date().toISOString()
        };
        saveEntries(entries);
    }
    
    // 更新状态
    autoSaveStatus.textContent = '✓ 已保存';
    autoSaveStatus.classList.remove('saving');
    isAutoSaving = false;
    
    // 更新历史记录
    updateHistoryList();
}

// 手动保存日记
function saveDiary() {
    const content = editor.innerHTML.trim();
    
    if (!content) {
        alert('请先输入日记内容！');
        return;
    }
    
    const entries = getEntries();
    entries[currentDate] = {
        content: content,
        lastModified: new Date().toISOString()
    };
    
    if (saveEntries(entries)) {
        autoSaveStatus.textContent = '✓ 已保存';
        autoSaveStatus.classList.remove('saving');
        updateHistoryList();
        alert('日记保存成功！');
    } else {
        alert('保存失败，请检查浏览器存储设置。');
    }
}

// 清空编辑器
function clearEditor() {
    if (editor.innerHTML.trim()) {
        if (confirm('确定要清空当前日记内容吗？')) {
            editor.innerHTML = '';
            // 从存储中删除
            const entries = getEntries();
            delete entries[currentDate];
            saveEntries(entries);
            updateHistoryList();
        }
    }
}

// 更新历史记录列表
function updateHistoryList() {
    const entries = getEntries();
    const dates = Object.keys(entries).sort((a, b) => new Date(b) - new Date(a));
    
    if (dates.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <p>暂无日记记录</p>
                <p class="empty-hint">选择日期并开始写日记吧！</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = dates.map(date => {
        const entry = entries[date];
        const preview = entry.content.replace(/<[^>]*>/g, '').substring(0, 100) + (entry.content.length > 100 ? '...' : '');
        const isActive = date === currentDate;
        
        return `
            <div class="history-item ${isActive ? 'active' : ''}" data-date="${date}">
                <div class="history-date">${getShortDate(date)}</div>
                <div class="history-preview">${preview || '暂无内容'}</div>
                <div class="history-actions">
                    <button class="edit-btn" onclick="editDiary('${date}')">编辑</button>
                    <button class="delete-btn" onclick="showDeleteConfirm('${date}')">删除</button>
                </div>
            </div>
        `;
    }).join('');
    
    // 添加点击事件
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('edit-btn') && !e.target.classList.contains('delete-btn')) {
                const date = item.dataset.date;
                datePicker.value = date;
                loadDiary(date);
            }
        });
    });
}

// 更新历史记录高亮
function updateHistoryHighlight(date) {
    document.querySelectorAll('.history-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.date === date) {
            item.classList.add('active');
        }
    });
}

// 编辑指定日期的日记
function editDiary(date) {
    datePicker.value = date;
    loadDiary(date);
}

// 显示删除确认弹窗
function showDeleteConfirm(date) {
    deleteTargetDate = date;
    confirmModal.classList.add('show');
}

// 确认删除
function confirmDelete() {
    if (deleteTargetDate) {
        const entries = getEntries();
        delete entries[deleteTargetDate];
        saveEntries(entries);
        
        // 如果删除的是当前日期，清空编辑器
        if (deleteTargetDate === currentDate) {
            editor.innerHTML = '';
        }
        
        updateHistoryList();
        closeModal();
        deleteTargetDate = null;
        alert('日记已删除！');
    }
}

// 关闭弹窗
function closeModal() {
    confirmModal.classList.remove('show');
    deleteTargetDate = null;
}

// 富文本格式化
function formatText(command) {
    document.execCommand(command, false, null);
    editor.focus();
}

// 页面关闭前提示未保存的更改
window.addEventListener('beforeunload', (e) => {
    const content = editor.innerHTML.trim();
    if (content) {
        // 尝试最后保存一次
        autoSaveDiary();
    }
});

// 键盘快捷键
editor.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDiary();
    }
    
    // Ctrl/Cmd + Z 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        formatText('undo');
    }
    
    // Ctrl/Cmd + Shift + Z 重做
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        formatText('redo');
    }
    
    // Ctrl/Cmd + B 粗体
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        formatText('bold');
    }
    
    // Ctrl/Cmd + I 斜体
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        formatText('italic');
    }
});