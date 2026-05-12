import '../utils/anti-debug.js'
import { goHome, showToast } from '../utils/common.js'
import * as XLSX from 'xlsx'

let uploadedFiles = [];
let parsedData = [];

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const fileListSection = document.getElementById('fileListSection');
const fileList = document.getElementById('fileList');
const previewSection = document.getElementById('previewSection');
const previewWrap = document.getElementById('previewWrap');
const previewInfo = document.getElementById('previewInfo');
const optionsSection = document.getElementById('optionsSection');
const actionBar = document.getElementById('actionBar');
const mergeBtn = document.getElementById('mergeBtn');
const fileCount = document.getElementById('fileCount');
const modal = document.getElementById('modal');

const ENCODING_MAP = {
    'gb2312': 'gbk',
    'gb_2312': 'gbk',
    'euc-cn': 'gbk',
    'euc_cn': 'gbk',
    'x-euc-cn': 'gbk',
    'hz-gb-2312': 'gbk',
    'big5': 'big5',
    'big5-hkscs': 'big5',
    'big5_hkscs': 'big5',
    'shift_jis': 'shift_jis',
    'shift-jis': 'shift_jis',
    'sjis': 'shift_jis',
    'x-sjis': 'shift_jis',
    'euc-jp': 'euc-jp',
    'euc_jp': 'euc-jp',
    'euc-kr': 'euc-kr',
    'euc_kr': 'euc-kr',
    'ksc5601': 'euc-kr',
    'iso-2022-jp': 'iso-2022-jp',
    'iso-2022-kr': 'iso-2022-kr',
    'iso-2022-cn': 'iso-2022-cn',
    'windows-1251': 'windows-1251',
    'windows-1252': 'windows-1252',
    'iso-8859-1': 'iso-8859-1',
    'iso-8859-2': 'iso-8859-2',
    'iso-8859-15': 'iso-8859-15',
    'latin1': 'iso-8859-1',
    'ascii': 'utf-8',
    'utf-8': 'utf-8',
    'utf8': 'utf-8',
    'utf-16': 'utf-16',
    'utf-16le': 'utf-16le',
    'utf-16be': 'utf-16be',
    'utf16': 'utf-16',
    'utf16le': 'utf-16le',
    'utf16be': 'utf-16be',
    'gb18030': 'gb18030',
    'macintosh': 'macintosh',
    'cp1252': 'windows-1252',
    'cp1251': 'windows-1251',
};

const FALLBACK_ENCODINGS = [
    'utf-8', 'gbk', 'gb18030', 'big5', 'shift_jis', 'euc-jp', 'euc-kr',
    'windows-1252', 'windows-1251', 'iso-8859-1', 'iso-8859-15', 'macintosh'
];

document.getElementById('home-btn').addEventListener('click', () => goHome());

uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
    e.preventDefault(); uploadZone.classList.remove('dragover'); handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', e => handleFiles(e.target.files));

async function handleFiles(files) {
    const validExts = ['.csv', '.xls', '.xlsx', '.xlt', '.xlsm'];
    const newFiles = Array.from(files).filter(f => {
        const ext = '.' + f.name.split('.').pop().toLowerCase();
        return validExts.includes(ext);
    });

    if (newFiles.length === 0) {
        showToast('请选择 CSV、XLS、XLSX、XLT、XLSM 格式的文件', 'error');
        return;
    }

    for (const file of newFiles) {
        if (uploadedFiles.some(u => u.name === file.name && u.size === file.size)) continue;
        uploadedFiles.push(file);
        await parseFile(file);
    }

    updateUI();
    fileInput.value = '';
}

function resolveEncodingName(rawName) {
    if (!rawName) return null;
    const key = rawName.toLowerCase().trim();
    return ENCODING_MAP[key] || (isTextDecoderSupported(key) ? key : null);
}

function isTextDecoderSupported(name) {
    try { new TextDecoder(name); return true; } catch { return false; }
}

function tryDecode(uint8, encoding) {
    try {
        const decoder = new TextDecoder(encoding, { fatal: true });
        return decoder.decode(uint8);
    } catch { return null; }
}

function smartDecode(uint8) {
    if (uint8.length >= 3 && uint8[0] === 0xEF && uint8[1] === 0xBB && uint8[2] === 0xBF) {
        return { text: tryDecode(uint8.slice(3), 'utf-8'), encoding: 'UTF-8-BOM', bom: true };
    }
    if (uint8.length >= 2 && uint8[0] === 0xFF && uint8[1] === 0xFE) {
        return { text: tryDecode(uint8, 'utf-16le'), encoding: 'UTF-16LE', bom: true };
    }
    if (uint8.length >= 2 && uint8[0] === 0xFE && uint8[1] === 0xFF) {
        return { text: tryDecode(uint8, 'utf-16be'), encoding: 'UTF-16BE', bom: true };
    }

    let detected = null;
    try {
        const result = jschardet.detect(uint8);
        if (result && result.encoding && result.confidence > 0.2) {
            detected = resolveEncodingName(result.encoding);
        }
    } catch (e) { /* ignore */ }

    if (detected) {
        const text = tryDecode(uint8, detected);
        if (text !== null) return { text, encoding: detected.toUpperCase(), bom: false };
    }

    for (const enc of FALLBACK_ENCODINGS) {
        if (enc === detected) continue;
        const text = tryDecode(uint8, enc);
        if (text !== null) {
            return { text, encoding: enc.toUpperCase(), bom: false };
        }
    }

    try {
        const decoder = new TextDecoder('utf-8', { fatal: false });
        return { text: decoder.decode(uint8), encoding: 'UTF-8(?)', bom: false };
    } catch {
        return { text: '', encoding: 'UNKNOWN', bom: false };
    }
}

async function parseFile(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const isCSV = ext === '.csv';
    const entry = { file, ext, encoding: 'UTF-8', json: null };

    try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        if (isCSV) {
            const decoded = smartDecode(uint8);
            entry.encoding = decoded.encoding;

            const parseResult = Papa.parse(decoded.text, {
                header: false,
                skipEmptyLines: 'greedy',
                delimiter: '',
                newline: '',
                quoteChar: '"',
                escapeChar: '"',
                delimitersToGuess: [',', '\t', '|', ';', ':', '#'],
                transform: value => value,
                complete: results => { entry.json = results.data; },
                error: err => { throw err; }
            });

            if (entry.json && entry.json.length > 0) {
                while (entry.json.length > 0 && entry.json[entry.json.length - 1].every(c => String(c).trim() === '')) {
                    entry.json.pop();
                }
            }
        } else {
            const workbook = XLSX.read(arrayBuffer, {
                type: 'array',
                cellFormula: false,
                cellText: true,
                cellDates: true,
                codepage: 65001
            });
            entry.workbook = workbook;
            const sheetName = workbook.SheetNames[0];
            entry.sheetName = sheetName;
            const worksheet = workbook.Sheets[sheetName];
            entry.json = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                blankrows: false
            });
            entry.encoding = 'BINARY';
        }

        parsedData.push(entry);
    } catch (err) {
        console.error('解析失败:', file.name, err);
        showToast(`「${file.name}」解析失败：${err.message || '未知错误'}`, 'error');
    }
}

function updateUI() {
    fileListSection.style.display = uploadedFiles.length ? 'block' : 'none';
    fileCount.textContent = `${uploadedFiles.length} 个文件`;
    fileList.innerHTML = parsedData.map((d, i) => `
      <div class="file-item">
        <span class="file-icon">${d.ext === '.csv' ? '&#128196;' : '&#128190;'}</span>
        <span class="file-name">${escapeHtml(d.file.name)}</span>
        <span class="encoding-tag">${escapeHtml(d.encoding)}</span>
        <span class="file-size">${formatSize(d.file.size)}</span>
        <button class="file-remove" onclick="removeFile(${i})" title="移除">&#10005;</button>
      </div>
    `).join('');

    previewSection.style.display = parsedData.length ? 'block' : 'none';
    if (parsedData.length > 0) renderPreview(parsedData[0]);

    optionsSection.style.display = parsedData.length ? 'block' : 'none';
    actionBar.style.display = parsedData.length ? 'flex' : 'none';
    mergeBtn.disabled = parsedData.length < 2;
    mergeBtn.innerHTML = parsedData.length < 2
        ? '&#128229; 请至少上传2个文件'
        : '&#128229; 合并并下载';
}

function renderPreview(entry) {
    if (!entry.json || entry.json.length === 0) {
        previewWrap.innerHTML = '<div class="preview-empty">文件内容为空</div>';
        previewInfo.textContent = '';
        return;
    }

    const rows = entry.json.slice(0, 10);
    const colCount = Math.max(...rows.map(r => r.length), 0);

    let html = '<table class="preview-table"><thead><tr>';
    for (let c = 0; c < colCount; c++) {
        html += `<th>${escapeHtml(String(rows[0][c] ?? ''))}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (let i = 1; i < rows.length; i++) {
        html += '<tr>';
        for (let c = 0; c < colCount; c++) {
            html += `<td>${escapeHtml(String(rows[i][c] ?? ''))}</td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';

    previewWrap.innerHTML = html;
    previewInfo.textContent = `共 ${entry.json.length} 行 × ${colCount} 列 · 编码: ${entry.encoding}`;
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    parsedData.splice(index, 1);
    updateUI();
}
window.removeFile = removeFile;

function clearAll() {
    uploadedFiles = [];
    parsedData = [];
    updateUI();
    document.getElementById('headerRows').value = 1;
    document.getElementById('mergeHeader').checked = true;
    document.getElementById('smartDetectBtn').classList.remove('detected');
    document.getElementById('detectResult').textContent = '';
}
window.clearAll = clearAll;

function smartDetect() {
    if (parsedData.length === 0) { showToast('请先上传文件', 'error'); return; }
    const data = parsedData[0].json;
    if (!data || data.length === 0) return;

    let detectedRows = 1;
    const maxCheck = Math.min(data.length, 6);

    for (let r = 1; r < maxCheck; r++) {
        const prev = data[r - 1] || [];
        const curr = data[r] || [];
        const next = data[r + 1] || [];

        if (curr.every(c => String(c).trim() === '')) continue;

        const prevTextRate = textRate(prev);
        const currTextRate = textRate(curr);
        const nextNumRate = numericRate(next);

        if (prevTextRate > 0.8 && currTextRate > 0.5 && nextNumRate > 0.3) {
            detectedRows = r + 1; break;
        }

        if (r >= 2) {
            const allText = [data[r-2], data[r-1], data[r]].every(row => textRate(row) > 0.9);
            const nextMixed = data[r+1] && textRate(data[r+1]) < 0.7;
            if (allText && nextMixed) { detectedRows = r + 1; break; }
        }
    }

    document.getElementById('headerRows').value = detectedRows;
    const btn = document.getElementById('smartDetectBtn');
    btn.classList.add('detected');
    btn.innerHTML = '&#10003; 已识别';
    document.getElementById('detectResult').textContent = `检测到 ${detectedRows} 行表头`;
    showToast(`智能识别完成：检测到 ${detectedRows} 行表头`, 'success');
    setTimeout(() => { btn.innerHTML = '&#9889; 智能识别'; btn.classList.remove('detected'); }, 3000);
}
window.smartDetect = smartDetect;

function textRate(row) {
    if (!row || row.length === 0) return 0;
    const textCount = row.filter(c => {
        const s = String(c).trim();
        if (!s) return false;
        return isNaN(Number(s.replace(/[,\.]/g, ''))) || s.length > 20;
    }).length;
    return textCount / row.length;
}

function numericRate(row) {
    if (!row || row.length === 0) return 0;
    const numCount = row.filter(c => {
        const s = String(c).trim().replace(/[,\%\$]/g, '');
        return s && !isNaN(Number(s)) && s !== '';
    }).length;
    return numCount / row.length;
}

function mergeTables() {
    if (parsedData.length < 2) { showToast('请至少上传2个文件', 'error'); return; }

    const mergeHeader = document.getElementById('mergeHeader').checked;
    const headerRows = parseInt(document.getElementById('headerRows').value) || 1;

    const first = parsedData[0];
    const firstHeader = first.json.slice(0, headerRows);
    const firstHeaderKey = JSON.stringify(firstHeader);

    const mismatches = [];
    for (let i = 1; i < parsedData.length; i++) {
        const d = parsedData[i];
        const otherHeader = d.json.slice(0, headerRows);
        if (JSON.stringify(otherHeader) !== firstHeaderKey) mismatches.push(d.file.name);
    }

    if (mismatches.length > 0) {
        const list = mismatches.map(n => `<span class="mismatch-file">${escapeHtml(n)}</span>`).join('、');
        openModal('表头不一致',
            `以下表格的表头与第一张表格不统一，可能导致合并后数据错位：<br><br>${list}<br><br>请检查各文件的表头行数和内容是否一致，或使用"智能识别"重新检测表头。`);
        return;
    }

    let merged = [];
    parsedData.forEach((d, idx) => {
        const data = d.json;
        if (idx === 0) {
            merged = data.slice();
        } else {
            const startRow = mergeHeader ? headerRows : 0;
            merged.push(...data.slice(startRow));
        }
    });

    const ws = XLSX.utils.aoa_to_sheet(merged);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '合并结果');

    const colWidths = [];
    merged.forEach(row => {
        row.forEach((cell, ci) => {
            const len = String(cell).getByteLength ? String(cell).getByteLength() : String(cell).length;
            colWidths[ci] = Math.max(colWidths[ci] || 0, Math.min(len * 1.2 + 2, 40));
        });
    });
    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    XLSX.writeFile(wb, `合并表格_${timestamp}.xlsx`);

    showToast(`合并完成！共 ${merged.length} 行数据`, 'success');
}
window.mergeTables = mergeTables;

function openModal(title, body) {
    document.getElementById('modalTitle').innerHTML = '&#9888; ' + escapeHtml(title);
    document.getElementById('modalBody').innerHTML = body;
    modal.classList.add('active');
}

function closeModal() { modal.classList.remove('active'); }
window.closeModal = closeModal;
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

String.prototype.getByteLength = function() {
    let len = 0;
    for (let i = 0; i < this.length; i++) {
        len += (this.charCodeAt(i) > 255) ? 2 : 1;
    }
    return len;
};
