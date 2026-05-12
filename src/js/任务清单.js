import '../utils/anti-debug.js'
import { goHome, showToast } from '../utils/common.js'

const STORAGE_KEY = 'tasklist_data';
let tasks = [];
let calYear, calMonth, selectedDate = null;
let currentFilter = 'all';
let newQuadrant = 0;
let confirmCallback = null;

function loadTasks() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        tasks = raw ? JSON.parse(raw) : [];
    } catch(e) { tasks = []; }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function formatDate(str) {
    if (!str) return '无期限';
    const parts = str.split('-');
    return parts[0] + '/' + parseInt(parts[1]) + '/' + parseInt(parts[2]);
}

function initCalendar() {
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    renderCalendar();
}

function changeMonth(delta) {
    calMonth += delta;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
}
window.changeMonth = changeMonth;

function selectToday() {
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    selectedDate = todayStr();
    currentFilter = 'date';
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('dateFilterBtn').classList.add('active');
    renderCalendar();
    renderTasks();
}
window.selectToday = selectToday;

function renderCalendar() {
    const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    document.getElementById('calTitle').textContent = calYear + '年 ' + months[calMonth];

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev = new Date(calYear, calMonth, 0).getDate();
    const today = todayStr();

    const taskDates = new Set();
    tasks.forEach(t => { if (t.dueDate) taskDates.add(t.dueDate); });

    let html = '';
    for (let i = 0; i < firstDay; i++) {
        const d = daysInPrev - firstDay + 1 + i;
        html += '<div class="cal-day other-month">' + d + '</div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = calYear + '-' + String(calMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
        let cls = 'cal-day';
        if (dateStr === today) cls += ' today';
        if (dateStr === selectedDate) cls += ' selected';
        if (taskDates.has(dateStr)) cls += ' has-task';
        html += '<div class="' + cls + '" onclick="selectDate(\'' + dateStr + '\')">' + d + '</div>';
    }
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - totalCells % 7) % 7;
    for (let i = 1; i <= remaining; i++) {
        html += '<div class="cal-day other-month">' + i + '</div>';
    }
    document.getElementById('calGrid').innerHTML = html;
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    currentFilter = 'date';
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('dateFilterBtn').classList.add('active');
    renderCalendar();
    renderTasks();
}
window.selectDate = selectDate;

function setNewQuadrant(q) {
    newQuadrant = newQuadrant === q ? 0 : q;
    document.querySelectorAll('.q-btn[data-q]').forEach(b => {
        b.className = 'q-btn';
        if (parseInt(b.dataset.q) === newQuadrant) {
            b.classList.add('active-q' + newQuadrant);
        }
    });
}
window.setNewQuadrant = setNewQuadrant;

function addTask() {
    const input = document.getElementById('newTaskInput');
    const title = input.value.trim();
    if (!title) { showToast('请输入任务名称', 'error'); return; }
    const dueDate = document.getElementById('newTaskDate').value || todayStr();
    tasks.push({
        id: genId(),
        title: title,
        quadrant: newQuadrant || 4,
        dueDate: dueDate,
        done: false,
        subtasks: [],
        createdAt: Date.now()
    });
    input.value = '';
    saveTasks();
    renderCalendar();
    renderTasks();
    showToast('任务已添加', 'success');
}
window.addTask = addTask;

function toggleTask(id) {
    const t = tasks.find(t => t.id === id);
    if (t) { t.done = !t.done; saveTasks(); renderTasks(); }
}
window.toggleTask = toggleTask;

function deleteTask(id) {
    showConfirm('确认删除此任务？', () => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderCalendar();
        renderTasks();
        showToast('任务已删除', 'info');
    });
}
window.deleteTask = deleteTask;

function changeQuadrant(id, q) {
    const t = tasks.find(t => t.id === id);
    if (t) { t.quadrant = q; saveTasks(); renderTasks(); }
}
window.changeQuadrant = changeQuadrant;

function changeDueDate(id, date) {
    const t = tasks.find(t => t.id === id);
    if (t) { t.dueDate = date; saveTasks(); renderCalendar(); renderTasks(); }
}
window.changeDueDate = changeDueDate;

function addSubtask(taskId) {
    const input = document.getElementById('subinput_' + taskId);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const t = tasks.find(t => t.id === taskId);
    if (t) {
        t.subtasks.push({ id: genId(), text: text, done: false });
        input.value = '';
        saveTasks();
        renderTasks();
    }
}
window.addSubtask = addSubtask;

function toggleSubtask(taskId, subId) {
    const t = tasks.find(t => t.id === taskId);
    if (t) {
        const s = t.subtasks.find(s => s.id === subId);
        if (s) { s.done = !s.done; saveTasks(); renderTasks(); }
    }
}
window.toggleSubtask = toggleSubtask;

function deleteSubtask(taskId, subId) {
    const t = tasks.find(t => t.id === taskId);
    if (t) {
        t.subtasks = t.subtasks.filter(s => s.id !== subId);
        saveTasks();
        renderTasks();
    }
}
window.deleteSubtask = deleteSubtask;

function setFilter(f, btn) {
    currentFilter = f;
    selectedDate = null;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCalendar();
    renderTasks();
}
window.setFilter = setFilter;

function getFilteredTasks() {
    let list = [...tasks];
    switch(currentFilter) {
        case 'pending': list = list.filter(t => !t.done); break;
        case 'done': list = list.filter(t => t.done); break;
        case 'q1': list = list.filter(t => t.quadrant === 1); break;
        case 'q2': list = list.filter(t => t.quadrant === 2); break;
        case 'q3': list = list.filter(t => t.quadrant === 3); break;
        case 'q4': list = list.filter(t => t.quadrant === 4); break;
        case 'date':
            if (selectedDate) list = list.filter(t => t.dueDate === selectedDate);
            break;
    }
    const qOrder = {1:0, 2:1, 3:2, 4:3};
    list.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.quadrant !== b.quadrant) return qOrder[a.quadrant] - qOrder[b.quadrant];
        return b.createdAt - a.createdAt;
    });
    return list;
}

function renderTasks() {
    const list = getFilteredTasks();
    const container = document.getElementById('taskList');

    if (list.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-text-secondary text-sm"><i class="fa fa-check-circle text-3xl mb-3 block opacity-30"></i>暂无任务</div>';
        updateStats();
        return;
    }

    container.innerHTML = list.map(t => {
        const qClass = 'q' + t.quadrant;
        const doneClass = t.done ? ' done' : '';
        const subtaskProgress = t.subtasks.length > 0
            ? (t.subtasks.filter(s => s.done).length / t.subtasks.length * 100).toFixed(0)
            : -1;

        let html = '<div class="task-item ' + qClass + doneClass + '">';
        html += '<div class="flex items-start gap-3">';
        html += '<div class="custom-cb' + (t.done ? ' checked' : '') + '" onclick="toggleTask(\'' + t.id + '\')">';
        if (t.done) html += '<i class="fa fa-check"></i>';
        html += '</div>';
        html += '<div class="flex-1 min-w-0">';
        html += '<div class="flex items-center gap-2 flex-wrap">';
        html += '<span class="task-title text-sm font-medium">' + escHtml(t.title) + '</span>';
        html += '<span class="text-xs px-1.5 py-0.5 rounded" style="';
        if (t.quadrant === 1) html += 'background:rgba(239,68,68,0.15);color:#ef4444';
        else if (t.quadrant === 2) html += 'background:rgba(59,130,246,0.15);color:#3b82f6';
        else if (t.quadrant === 3) html += 'background:rgba(234,179,8,0.15);color:#eab308';
        else html += 'background:rgba(107,114,128,0.15);color:#9ca3af';
        html += '">Q' + t.quadrant + '</span>';
        html += '</div>';
        html += '<div class="flex items-center gap-2 mt-1.5 flex-wrap">';
        html += '<span class="text-xs text-text-secondary"><i class="fa fa-calendar-o mr-1"></i>' + formatDate(t.dueDate) + '</span>';
        html += '<input type="date" class="input-field" style="width:130px;padding:3px 8px;font-size:11px" value="' + (t.dueDate||'') + '" onchange="changeDueDate(\'' + t.id + '\',this.value)" title="修改日期">';
        html += '<div class="flex gap-0.5">';
        for (let q = 1; q <= 4; q++) {
            const isActive = t.quadrant === q;
            html += '<button class="q-btn' + (isActive ? ' active-q'+q : '') + '" style="padding:2px 6px;font-size:10px" onclick="changeQuadrant(\'' + t.id + '\',' + q + ')" title="Q' + q + '">Q' + q + '</button>';
        }
        html += '</div>';
        html += '</div>';

        if (t.subtasks.length > 0) {
            html += '<div class="mt-2">';
            html += '<div class="progress-bar mb-1.5"><div class="progress-fill" style="width:' + subtaskProgress + '%"></div></div>';
            html += '<div class="text-xs text-text-secondary mb-1.5">' + t.subtasks.filter(s=>s.done).length + '/' + t.subtasks.length + ' 步骤完成</div>';
            t.subtasks.forEach(s => {
                html += '<div class="subtask-item' + (s.done ? ' done' : '') + '">';
                html += '<div class="subtask-cb' + (s.done ? ' checked' : '') + '" onclick="toggleSubtask(\'' + t.id + '\',\'' + s.id + '\')">';
                if (s.done) html += '<i class="fa fa-check"></i>';
                html += '</div>';
                html += '<span class="subtask-text flex-1">' + escHtml(s.text) + '</span>';
                html += '<button class="icon-btn danger" style="width:20px;height:20px" onclick="deleteSubtask(\'' + t.id + '\',\'' + s.id + '\')"><i class="fa fa-times" style="font-size:9px"></i></button>';
                html += '</div>';
            });
            html += '</div>';
        }

        html += '<div class="flex items-center gap-1 mt-2">';
        html += '<input type="text" class="input-field" style="width:160px;padding:4px 8px;font-size:12px" id="subinput_' + t.id + '" placeholder="添加子步骤..." onkeydown="if(event.key===\'Enter\')addSubtask(\'' + t.id + '\')">';
        html += '<button class="icon-btn" onclick="addSubtask(\'' + t.id + '\')" title="添加子步骤"><i class="fa fa-plus"></i></button>';
        html += '</div>';

        html += '</div>';
        html += '<button class="icon-btn danger" onclick="deleteTask(\'' + t.id + '\')" title="删除任务"><i class="fa fa-trash"></i></button>';
        html += '</div>';
        html += '</div>';
        return html;
    }).join('');

    updateStats();
}

function updateStats() {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    const pending = total - done;
    const q1 = tasks.filter(t => t.quadrant === 1 && !t.done).length;
    const q2 = tasks.filter(t => t.quadrant === 2 && !t.done).length;
    const q3 = tasks.filter(t => t.quadrant === 3 && !t.done).length;
    const q4 = tasks.filter(t => t.quadrant === 4 && !t.done).length;
    const overdue = tasks.filter(t => !t.done && t.dueDate && t.dueDate < todayStr()).length;

    document.getElementById('statsArea').innerHTML =
        '<p>总任务：<span class="text-text-primary">' + total + '</span></p>' +
        '<p>待完成：<span class="text-primary">' + pending + '</span></p>' +
        '<p>已完成：<span class="text-green-400">' + done + '</span></p>' +
        (overdue > 0 ? '<p class="text-red-400">已逾期：<span>' + overdue + '</span></p>' : '') +
        '<div class="border-t border-border-color my-1.5"></div>' +
        '<p>Q1 待办：<span class="text-red-400">' + q1 + '</span></p>' +
        '<p>Q2 待办：<span class="text-blue-400">' + q2 + '</span></p>' +
        '<p>Q3 待办：<span class="text-yellow-400">' + q3 + '</span></p>' +
        '<p>Q4 待办：<span class="text-gray-400">' + q4 + '</span></p>';
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function showConfirm(msg, cb) {
    document.getElementById('confirmMsg').textContent = msg;
    confirmCallback = cb;
    document.getElementById('confirmModal').classList.remove('hidden');
}

function closeConfirm() {
    document.getElementById('confirmModal').classList.add('hidden');
    confirmCallback = null;
}
window.closeConfirm = closeConfirm;

document.getElementById('confirmOk').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
});

document.getElementById('home-btn').addEventListener('click', () => goHome());

document.getElementById('clearAllBtn').addEventListener('click', () => {
    showConfirm('确认清除所有任务数据？此操作不可恢复！', () => {
        tasks = [];
        saveTasks();
        renderCalendar();
        renderTasks();
        showToast('所有数据已清除', 'info');
    });
});

document.getElementById('newTaskDate').value = todayStr();
loadTasks();
initCalendar();
renderTasks();
