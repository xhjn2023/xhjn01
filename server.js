const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'todos.json');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 确保数据目录存在
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

// 读取所有用户数据
function readData() {
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(content);
    } catch {
        return {};
    }
}

// 保存所有用户数据
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch {
        return false;
    }
}

// API Routes

// 获取所有用户名列表
app.get('/api/users', (req, res) => {
    const data = readData();
    const users = Object.keys(data);
    res.json({ success: true, data: users });
});

// 获取指定用户的所有任务（支持筛选和排序）
app.get('/api/todos/:username', (req, res) => {
    const { username } = req.params;
    const { sortBy, filterBy, date } = req.query;
    
    const data = readData();
    let userTodos = data[username] || [];
    
    // 筛选
    if (filterBy) {
        const today = new Date().toISOString().split('T')[0];
        switch (filterBy) {
            case 'today':
                userTodos = userTodos.filter(t => t.dueDate === today);
                break;
            case 'overdue':
                userTodos = userTodos.filter(t => 
                    !t.completed && t.dueDate && t.dueDate < today
                );
                break;
            case 'upcoming':
                userTodos = userTodos.filter(t => 
                    !t.completed && t.dueDate && t.dueDate > today
                );
                break;
            case 'completed':
                userTodos = userTodos.filter(t => t.completed);
                break;
            case 'pending':
                userTodos = userTodos.filter(t => !t.completed);
                break;
            case 'date':
                if (date) {
                    userTodos = userTodos.filter(t => t.dueDate === date);
                }
                break;
        }
    }
    
    // 排序
    if (sortBy) {
        switch (sortBy) {
            case 'dueDate':
                userTodos.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
            case 'dueDateDesc':
                userTodos.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(b.dueDate) - new Date(a.dueDate);
                });
                break;
            case 'createdAt':
                userTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'createdAtAsc':
                userTodos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'completedAt':
                userTodos.sort((a, b) => {
                    if (!a.completedAt) return 1;
                    if (!b.completedAt) return -1;
                    return new Date(b.completedAt) - new Date(a.completedAt);
                });
                break;
        }
    }
    
    res.json({ success: true, data: userTodos });
});

// 添加新任务（支持日期和提醒）
app.post('/api/todos/:username', (req, res) => {
    const { username } = req.params;
    const { text, dueDate, reminder } = req.body;
    
    if (!text || !text.trim()) {
        return res.status(400).json({ success: false, message: '任务内容不能为空' });
    }
    
    const data = readData();
    if (!data[username]) {
        data[username] = [];
    }
    
    const newTask = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: dueDate || null,
        reminder: reminder || null,
        completedAt: null
    };
    
    data[username].unshift(newTask);
    
    if (saveData(data)) {
        res.json({ success: true, data: newTask });
    } else {
        res.status(500).json({ success: false, message: '保存失败' });
    }
});

// 更新任务（支持更新日期、提醒和状态）
app.put('/api/todos/:username/:taskId', (req, res) => {
    const { username, taskId } = req.params;
    const { completed, dueDate, reminder, text } = req.body;
    
    const data = readData();
    if (!data[username]) {
        return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const task = data[username].find(t => t.id === parseInt(taskId));
    if (!task) {
        return res.status(404).json({ success: false, message: '任务不存在' });
    }
    
    // 更新字段
    if (completed !== undefined) {
        task.completed = completed;
        if (completed) {
            task.completedAt = new Date().toISOString();
        } else {
            task.completedAt = null;
        }
    }
    
    if (dueDate !== undefined) {
        task.dueDate = dueDate || null;
    }
    
    if (reminder !== undefined) {
        task.reminder = reminder || null;
    }
    
    if (text !== undefined) {
        task.text = text.trim();
    }
    
    if (saveData(data)) {
        res.json({ success: true, data: task });
    } else {
        res.status(500).json({ success: false, message: '保存失败' });
    }
});

// 删除任务
app.delete('/api/todos/:username/:taskId', (req, res) => {
    const { username, taskId } = req.params;
    
    const data = readData();
    if (!data[username]) {
        return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const initialLength = data[username].length;
    data[username] = data[username].filter(t => t.id !== parseInt(taskId));
    
    if (data[username].length < initialLength) {
        if (saveData(data)) {
            res.json({ success: true, message: '删除成功' });
        } else {
            res.status(500).json({ success: false, message: '保存失败' });
        }
    } else {
        res.status(404).json({ success: false, message: '任务不存在' });
    }
});

// 清除已完成的任务
app.delete('/api/todos/:username/completed', (req, res) => {
    const { username } = req.params;
    
    const data = readData();
    if (!data[username]) {
        return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    data[username] = data[username].filter(t => !t.completed);
    
    if (saveData(data)) {
        res.json({ success: true, data: data[username] });
    } else {
        res.status(500).json({ success: false, message: '保存失败' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器已启动: http://localhost:${PORT}`);
    console.log(`待办页面: http://localhost:${PORT}/todo.html`);
    console.log(`数据文件: ${DATA_FILE}`);
});