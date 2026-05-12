import '../utils/anti-debug.js'
import { goHome, showToast } from '../utils/common.js'

const kwInput = document.getElementById('kwInput');
const asinInput = document.getElementById('asinInput');
const kwLinksContainer = document.getElementById('kwLinks');
const asinLinksContainer = document.getElementById('asinLinks');

const openedKw = new Set();
const openedAsin = new Set();

function parseLines(text) {
    return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

function generateKwUrl(keyword) {
    return 'https://www.amazon.com/s?k=' + encodeURIComponent(keyword).replace(/%20/g, '+');
}

function generateAsinUrl(asin) {
    return 'https://www.amazon.com/dp/' + asin.trim();
}

function renderLinks() {
    const keywords = parseLines(kwInput.value);
    const asins = parseLines(asinInput.value);

    document.getElementById('kwCount').textContent = keywords.length + ' 条';
    document.getElementById('asinCount').textContent = asins.length + ' 条';

    if (keywords.length === 0) {
        kwLinksContainer.innerHTML = '<span class="empty-hint">在上方输入关键词后自动生成链接</span>';
    } else {
        kwLinksContainer.innerHTML = keywords.map((kw, i) => {
            const url = generateKwUrl(kw);
            const isOpened = openedKw.has(i);
            return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="link-item' + (isOpened ? ' opened' : '') + '" data-type="kw" data-index="' + i + '" title="' + url + '">' + (isOpened ? '<i class="fa fa-check" style="font-size:10px"></i> ' : '<i class="fa fa-search" style="font-size:10px"></i> ') + escHtml(kw) + '</a>';
        }).join('');
    }

    if (asins.length === 0) {
        asinLinksContainer.innerHTML = '<span class="empty-hint">在上方输入ASIN后自动生成链接</span>';
    } else {
        asinLinksContainer.innerHTML = asins.map((asin, i) => {
            const url = generateAsinUrl(asin);
            const isOpened = openedAsin.has(i);
            return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="link-item' + (isOpened ? ' opened' : '') + '" data-type="asin" data-index="' + i + '" title="' + url + '">' + (isOpened ? '<i class="fa fa-check" style="font-size:10px"></i> ' : '<i class="fa fa-barcode" style="font-size:10px"></i> ') + escHtml(asin) + '</a>';
        }).join('');
    }

    const kwLinkCount = keywords.length;
    const asinLinkCount = asins.length;
    document.getElementById('kwLinkCount').textContent = kwLinkCount + ' 个链接' + (openedKw.size > 0 ? '（已打开 ' + Math.min(openedKw.size, kwLinkCount) + ' 个）' : '');
    document.getElementById('asinLinkCount').textContent = asinLinkCount + ' 个链接' + (openedAsin.size > 0 ? '（已打开 ' + Math.min(openedAsin.size, asinLinkCount) + ' 个）' : '');
}

function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

kwInput.addEventListener('input', () => {
    const keywords = parseLines(kwInput.value);
    const newOpened = new Set();
    keywords.forEach((kw, i) => {
        if (openedKw.has(i)) newOpened.add(i);
    });
    openedKw.clear();
    newOpened.forEach(i => openedKw.add(i));
    renderLinks();
});

asinInput.addEventListener('input', () => {
    const asins = parseLines(asinInput.value);
    const newOpened = new Set();
    asins.forEach((asin, i) => {
        if (openedAsin.has(i)) newOpened.add(i);
    });
    openedAsin.clear();
    newOpened.forEach(i => openedAsin.add(i));
    renderLinks();
});

document.addEventListener('click', function(e) {
    const link = e.target.closest('.link-item');
    if (!link) return;
    const type = link.dataset.type;
    const index = parseInt(link.dataset.index);
    if (type === 'kw') {
        openedKw.add(index);
    } else if (type === 'asin') {
        openedAsin.add(index);
    }
    link.classList.add('opened');
    const icon = link.querySelector('i');
    if (icon) {
        icon.className = 'fa fa-check';
        icon.style.fontSize = '10px';
    }
    updateLinkCounts();
});

function updateLinkCounts() {
    const keywords = parseLines(kwInput.value);
    const asins = parseLines(asinInput.value);
    document.getElementById('kwLinkCount').textContent = keywords.length + ' 个链接' + (openedKw.size > 0 ? '（已打开 ' + Math.min(openedKw.size, keywords.length) + ' 个）' : '');
    document.getElementById('asinLinkCount').textContent = asins.length + ' 个链接' + (openedAsin.size > 0 ? '（已打开 ' + Math.min(openedAsin.size, asins.length) + ' 个）' : '');
}

function batchOpenKw(count) {
    const keywords = parseLines(kwInput.value);
    const unopened = [];
    keywords.forEach((kw, i) => {
        if (!openedKw.has(i)) {
            unopened.push({ index: i, url: generateKwUrl(kw) });
        }
    });
    if (unopened.length === 0) {
        showToast('关键词链接已全部打开', 'info');
        return;
    }
    const toOpen = unopened.slice(0, count);
    toOpen.forEach(link => {
        window.open(link.url, '_blank');
        openedKw.add(link.index);
    });
    renderLinks();
    showToast('已打开 ' + toOpen.length + ' 个关键词链接', 'success');
}
window.batchOpenKw = batchOpenKw;

function batchOpenAsin(count) {
    const asins = parseLines(asinInput.value);
    const unopened = [];
    asins.forEach((asin, i) => {
        if (!openedAsin.has(i)) {
            unopened.push({ index: i, url: generateAsinUrl(asin) });
        }
    });
    if (unopened.length === 0) {
        showToast('ASIN链接已全部打开', 'info');
        return;
    }
    const toOpen = unopened.slice(0, count);
    toOpen.forEach(link => {
        window.open(link.url, '_blank');
        openedAsin.add(link.index);
    });
    renderLinks();
    showToast('已打开 ' + toOpen.length + ' 个ASIN链接', 'success');
}
window.batchOpenAsin = batchOpenAsin;

document.getElementById('home-btn').addEventListener('click', () => goHome());

document.getElementById('clearBtn').addEventListener('click', () => {
    kwInput.value = '';
    asinInput.value = '';
    openedKw.clear();
    openedAsin.clear();
    renderLinks();
    showToast('已清空所有内容', 'info');
});

renderLinks();
