import '../utils/anti-debug.js'
import { goHome, showToast } from '../utils/common.js'
import * as XLSX from 'xlsx'

let tableData = [];
let headers = [];
let markedRows = new Set();
let showHighlight = true;

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const asinInput = document.getElementById('asinInput');
const resultSection = document.getElementById('resultSection');
const tableContainer = document.getElementById('tableContainer');

document.getElementById('home-btn').addEventListener('click', () => goHome());

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
    e.preventDefault(); uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => { if (e.target.files.length) handleFile(e.target.files[0]); });

document.getElementById('removeFile').addEventListener('click', () => {
    tableData = [];
    headers = [];
    markedRows.clear();
    document.getElementById('fileInfo').classList.add('hidden');
    uploadZone.classList.remove('hidden');
    resultSection.classList.add('hidden');
    document.getElementById('exportBtn').disabled = true;
    fileInput.value = '';
});

asinInput.addEventListener('input', () => {
    const asins = parseAsins();
    document.getElementById('asinCount').textContent = asins.length + ' 个';
});

function parseAsins() {
    return asinInput.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

function handleFile(file) {
    const validExts = ['.csv', '.xls', '.xlsx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExts.includes(ext)) {
        showToast('请选择 CSV、XLS、XLSX 格式的文件', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

            if (jsonData.length === 0) {
                showToast('表格内容为空', 'error');
                return;
            }

            headers = jsonData[0].map(h => String(h));
            tableData = jsonData.slice(1).filter(row => row.some(cell => String(cell).trim() !== ''));

            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileSize').textContent = formatSize(file.size);
            document.getElementById('fileInfo').classList.remove('hidden');
            uploadZone.classList.add('hidden');

            showToast('文件上传成功，共 ' + tableData.length + ' 行数据', 'success');
        } catch (err) {
            showToast('文件解析失败：' + (err.message || '未知错误'), 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

function markAsin() {
    if (tableData.length === 0) {
        showToast('请先上传表格文件', 'error');
        return;
    }
    const asins = parseAsins();
    if (asins.length === 0) {
        showToast('请输入ASIN', 'error');
        return;
    }

    markedRows.clear();
    const asinSet = new Set(asins.map(a => a.toUpperCase()));

    tableData.forEach((row, rowIndex) => {
        const found = row.some(cell => {
            const cellStr = String(cell).trim().toUpperCase();
            return asinSet.has(cellStr);
        });
        if (found) markedRows.add(rowIndex);
    });

    renderTable();
    resultSection.classList.remove('hidden');
    document.getElementById('exportBtn').disabled = false;
    document.getElementById('resultStats').textContent = '共 ' + tableData.length + ' 行，标记 ' + markedRows.size + ' 行';

    showToast('标记完成，共找到 ' + markedRows.size + ' 行匹配', 'success');
}
window.markAsin = markAsin;

function renderTable() {
    const maxCols = Math.max(headers.length, ...tableData.map(r => r.length));

    let html = '<table class="result-table"><thead><tr>';
    html += '<th class="row-num">#</th>';
    for (let c = 0; c < maxCols; c++) {
        html += '<th>' + escHtml(headers[c] || '列' + (c + 1)) + '</th>';
    }
    html += '</tr></thead><tbody>';

    tableData.forEach((row, rowIndex) => {
        const isMarked = markedRows.has(rowIndex);
        const rowClass = isMarked && showHighlight ? 'marked-row' : '';
        html += '<tr class="' + rowClass + '">';
        html += '<td class="row-num">' + (rowIndex + 1) + '</td>';
        for (let c = 0; c < maxCols; c++) {
            const cellValue = String(row[c] || '');
            const isAsinCell = isMarked && isAsinMatch(cellValue);
            const cellClass = isAsinCell && showHighlight ? 'asin-cell' : '';
            html += '<td class="' + cellClass + '">' + escHtml(cellValue) + '</td>';
        }
        html += '</tr>';
    });

    html += '</tbody></table>';
    tableContainer.innerHTML = html;
}

function isAsinMatch(cellValue) {
    const asins = parseAsins();
    const upper = cellValue.trim().toUpperCase();
    return asins.some(a => a.toUpperCase() === upper);
}

function toggleHighlight() {
    showHighlight = !showHighlight;
    document.getElementById('toggleText').textContent = showHighlight ? '隐藏标记' : '显示标记';
    renderTable();
}
window.toggleHighlight = toggleHighlight;

function exportResult() {
    if (tableData.length === 0) {
        showToast('没有可导出的数据', 'error');
        return;
    }

    const exportData = [headers.concat(['是否标记'])];
    tableData.forEach((row, rowIndex) => {
        exportData.push(row.concat([markedRows.has(rowIndex) ? '是' : '否']));
    });

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '标记结果');

    const now = new Date();
    const timestamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    XLSX.writeFile(wb, '标记ASIN结果_' + timestamp + '.xlsx');

    showToast('导出成功', 'success');
}
window.exportResult = exportResult;

function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
