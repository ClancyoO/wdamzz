import '../utils/anti-debug.js'
import { goHome, showToast } from '../utils/common.js'

const mainInput = document.getElementById('mainInput');
const lineCount = document.getElementById('lineCount');
const resultSection = document.getElementById('resultSection');
const statsGrid = document.getElementById('statsGrid');
const duplicateList = document.getElementById('duplicateList');
const uniqueResult = document.getElementById('uniqueResult');

let duplicateData = [];

mainInput.addEventListener('input', () => {
    const lines = mainInput.value.split('\n').filter(l => l.trim() !== '');
    lineCount.textContent = lines.length + ' 行';
});

document.getElementById('home-btn').addEventListener('click', () => goHome());

document.getElementById('clearBtn').addEventListener('click', () => {
    mainInput.value = '';
    lineCount.textContent = '0 行';
    resultSection.classList.add('hidden');
    duplicateData = [];
    showToast('已清空所有内容', 'info');
});

function detectDuplicates() {
    const text = mainInput.value;
    if (!text.trim()) {
        showToast('请先输入文本', 'error');
        return;
    }

    const ignoreCase = document.getElementById('ignoreCase').checked;
    const ignoreWhitespace = document.getElementById('ignoreWhitespace').checked;
    const ignoreEmpty = document.getElementById('ignoreEmpty').checked;

    let lines = text.split('\n');
    if (ignoreEmpty) {
        lines = lines.filter(l => l.trim() !== '');
    }

    const countMap = new Map();
    const originalMap = new Map();

    lines.forEach((line, index) => {
        let key = line;
        if (ignoreWhitespace) key = key.trim();
        if (ignoreCase) key = key.toLowerCase();

        if (countMap.has(key)) {
            countMap.set(key, countMap.get(key) + 1);
            const indices = originalMap.get(key);
            indices.push(index + 1);
        } else {
            countMap.set(key, 1);
            originalMap.set(key, [index + 1]);
        }
    });

    const totalLines = lines.length;
    const uniqueLines = countMap.size;
    const duplicateEntries = [...countMap.entries()].filter(([_, count]) => count > 1);
    const duplicateCount = duplicateEntries.reduce((sum, [_, count]) => sum + count, 0);
    const duplicateUniqueCount = duplicateEntries.length;

    duplicateData = duplicateEntries.map(([key, count]) => ({
        text: originalMap.get(key).length > 0 ? lines[originalMap.get(key)[0] - 1] : key,
        count: count,
        lines: originalMap.get(key)
    }));

    duplicateData.sort((a, b) => b.count - a.count);

    statsGrid.innerHTML =
        '<div class="stat-item">' +
            '<div class="stat-value">' + totalLines + '</div>' +
            '<div class="stat-label">总行数</div>' +
        '</div>' +
        '<div class="stat-item">' +
            '<div class="stat-value">' + uniqueLines + '</div>' +
            '<div class="stat-label">不重复行数</div>' +
        '</div>' +
        '<div class="stat-item stat-warning">' +
            '<div class="stat-value">' + duplicateCount + '</div>' +
            '<div class="stat-label">重复行数</div>' +
        '</div>' +
        '<div class="stat-item stat-danger">' +
            '<div class="stat-value">' + duplicateUniqueCount + '</div>' +
            '<div class="stat-label">重复项数</div>' +
        '</div>';

    document.getElementById('resultStats').textContent = '共 ' + duplicateUniqueCount + ' 组重复';

    if (duplicateData.length === 0) {
        duplicateList.innerHTML = '<div class="empty-hint"><i class="fa fa-check-circle text-green-500 mr-2"></i>未检测到重复项</div>';
    } else {
        duplicateList.innerHTML = duplicateData.map((item, i) => {
            return '<div class="duplicate-item">' +
                '<div class="duplicate-header">' +
                    '<span class="duplicate-index">' + (i + 1) + '</span>' +
                    '<span class="duplicate-count">重复 ' + item.count + ' 次</span>' +
                    '<span class="duplicate-lines">行号: ' + item.lines.join(', ') + '</span>' +
                '</div>' +
                '<div class="duplicate-text">' + escHtml(item.text) + '</div>' +
            '</div>';
        }).join('');
    }

    const uniqueLinesList = [...countMap.entries()].map(([key, _]) => {
        const indices = originalMap.get(key);
        return lines[indices[0] - 1];
    });
    uniqueResult.value = uniqueLinesList.join('\n');

    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast('检测完成，发现 ' + duplicateUniqueCount + ' 组重复', 'success');
}
window.detectDuplicates = detectDuplicates;

function copyDuplicates() {
    if (duplicateData.length === 0) {
        showToast('没有重复项可复制', 'error');
        return;
    }
    const text = duplicateData.map(item => item.text).join('\n');
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制重复项到剪贴板', 'success');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-999999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('已复制重复项到剪贴板', 'success');
    });
}
window.copyDuplicates = copyDuplicates;

function copyUnique() {
    const text = uniqueResult.value;
    if (!text) {
        showToast('没有去重结果可复制', 'error');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制去重结果到剪贴板', 'success');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-999999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('已复制去重结果到剪贴板', 'success');
    });
}
window.copyUnique = copyUnique;

function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
