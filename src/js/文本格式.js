import '../utils/anti-debug.js'
import { goHome, showToast } from '../utils/common.js'

const mainInput = document.getElementById('mainInput');
const boldInput = document.getElementById('boldInput');
const charCount = document.getElementById('charCount');
const resultArea = document.getElementById('resultArea');
const resultTitle = document.getElementById('resultTitle');
const resultBody = document.getElementById('resultBody');

let wordCapState = 'upper';
let allCaseState = 'upper';
let sentenceCapState = 'upper';

mainInput.addEventListener('input', () => {
    charCount.textContent = mainInput.value.length + ' 字符';
});

document.getElementById('home-btn').addEventListener('click', () => goHome());

document.getElementById('clearBtn').addEventListener('click', () => {
    mainInput.value = '';
    boldInput.value = '';
    charCount.textContent = '0 字符';
    resultArea.classList.add('hidden');
    wordCapState = 'upper';
    allCaseState = 'upper';
    sentenceCapState = 'upper';
    document.getElementById('wordCapHint').textContent = '→大写';
    document.getElementById('allCaseHint').textContent = '→大写';
    document.getElementById('sentenceCapHint').textContent = '→大写';
    showToast('已清空所有内容', 'info');
});

function convertWordCapitalize() {
    const text = mainInput.value;
    if (!text.trim()) { showToast('请先输入文本', 'error'); return; }

    let result;
    if (wordCapState === 'upper') {
        result = text.replace(/\b\w/g, c => c.toUpperCase());
        wordCapState = 'lower';
        document.getElementById('wordCapHint').textContent = '→小写';
    } else {
        result = text.replace(/\b\w/g, c => c.toLowerCase());
        wordCapState = 'upper';
        document.getElementById('wordCapHint').textContent = '→大写';
    }

    mainInput.value = result;
    showResult('全首字母大小写切换', result);
    charCount.textContent = result.length + ' 字符';
}
window.convertWordCapitalize = convertWordCapitalize;

function convertAllCase() {
    const text = mainInput.value;
    if (!text.trim()) { showToast('请先输入文本', 'error'); return; }

    let result;
    if (allCaseState === 'upper') {
        result = text.toUpperCase();
        allCaseState = 'lower';
        document.getElementById('allCaseHint').textContent = '→小写';
    } else {
        result = text.toLowerCase();
        allCaseState = 'upper';
        document.getElementById('allCaseHint').textContent = '→大写';
    }

    mainInput.value = result;
    showResult('全文大小写切换', result);
    charCount.textContent = result.length + ' 字符';
}
window.convertAllCase = convertAllCase;

function convertSentenceCapitalize() {
    const text = mainInput.value;
    if (!text.trim()) { showToast('请先输入文本', 'error'); return; }

    let result;
    if (sentenceCapState === 'upper') {
        result = text.replace(/(^\s*\w|[.!?]\s+\w)/gm, match => match.toUpperCase());
        sentenceCapState = 'lower';
        document.getElementById('sentenceCapHint').textContent = '→小写';
    } else {
        result = text.replace(/(^\s*\w|[.!?]\s+\w)/gm, match => match.toLowerCase());
        sentenceCapState = 'upper';
        document.getElementById('sentenceCapHint').textContent = '→大写';
    }

    mainInput.value = result;
    showResult('句首字母大写切换', result);
    charCount.textContent = result.length + ' 字符';
}
window.convertSentenceCapitalize = convertSentenceCapitalize;

function convertBoldFormat() {
    const text = mainInput.value;
    if (!text.trim()) { showToast('请先输入文本', 'error'); return; }

    const boldLines = boldInput.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (boldLines.length === 0) { showToast('请输入需要加粗的文本', 'error'); return; }

    let result = text;
    boldLines.forEach(boldText => {
        const escaped = boldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'gi');
        result = result.replace(regex, '<b>' + boldText + '</b>');
    });

    const lines = result.split('\n');
    const formatted = lines.map(line => {
        if (line.trim() === '') return '';
        return '<p>' + line + '</p>';
    }).join('\n');

    showResult('换行加粗格式代码', formatted);
}
window.convertBoldFormat = convertBoldFormat;

function showResult(title, content) {
    resultTitle.innerHTML = '<i class="fa fa-check-circle mr-1"></i>' + title;
    resultBody.textContent = content;
    resultArea.classList.remove('hidden');
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyResult() {
    const text = resultBody.textContent;
    if (!text) { showToast('没有可复制的内容', 'error'); return; }
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板', 'success');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-999999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('已复制到剪贴板', 'success');
    });
}
window.copyResult = copyResult;
