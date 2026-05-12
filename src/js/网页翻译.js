import '../utils/anti-debug.js'
import { goHome, showToast } from '../utils/common.js'

const urlInput = document.getElementById('urlInput');
const resultSection = document.getElementById('resultSection');

const languages = [
    { code: 'en', name: '英语', flag: '🇺🇸' },
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日语', flag: '🇯🇵' },
    { code: 'ko', name: '韩语', flag: '🇰🇷' },
    { code: 'de', name: '德语', flag: '🇩🇪' },
    { code: 'fr', name: '法语', flag: '🇫🇷' },
    { code: 'es', name: '西班牙语', flag: '🇪🇸' },
    { code: 'it', name: '意大利语', flag: '🇮🇹' },
    { code: 'pt', name: '葡萄牙语', flag: '🇵🇹' },
    { code: 'ru', name: '俄语', flag: '🇷🇺' },
    { code: 'ar', name: '阿拉伯语', flag: '🇸🇦' },
    { code: 'th', name: '泰语', flag: '🇹🇭' },
    { code: 'vi', name: '越南语', flag: '🇻🇳' },
    { code: 'id', name: '印尼语', flag: '🇮🇩' },
    { code: 'nl', name: '荷兰语', flag: '🇳🇱' },
    { code: 'pl', name: '波兰语', flag: '🇵🇱' },
];

document.getElementById('home-btn').addEventListener('click', () => goHome());

function generateLinks() {
    const url = urlInput.value.trim();
    if (!url) {
        showToast('请输入网址', 'error');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showToast('请输入有效的网址（以 http:// 或 https:// 开头）', 'error');
        return;
    }

    renderGoogleLinks(url);
    renderDeepLLinks(url);
    renderYoudaoLinks(url);

    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast('翻译链接已生成', 'success');
}
window.generateLinks = generateLinks;

function renderGoogleLinks(url) {
    const container = document.getElementById('googleLinks');
    const sourceLang = 'auto';

    container.innerHTML = languages.map(lang => {
        const translateUrl = 'https://translate.google.com/translate?sl=' + sourceLang + '&tl=' + lang.code + '&u=' + encodeURIComponent(url);
        return '<a href="' + translateUrl + '" target="_blank" rel="noopener noreferrer" class="translate-link">' +
            '<span class="lang-flag">' + lang.flag + '</span>' +
            '<span class="lang-name">' + lang.name + '</span>' +
            '<i class="fa fa-external-link link-icon"></i>' +
        '</a>';
    }).join('');
}

function renderDeepLLinks(url) {
    const container = document.getElementById('deeplLinks');

    container.innerHTML = languages.map(lang => {
        const translateUrl = 'https://www.deepl.com/translator#en/' + lang.code + '/' + encodeURIComponent(url);
        return '<a href="' + translateUrl + '" target="_blank" rel="noopener noreferrer" class="translate-link">' +
            '<span class="lang-flag">' + lang.flag + '</span>' +
            '<span class="lang-name">' + lang.name + '</span>' +
            '<i class="fa fa-external-link link-icon"></i>' +
        '</a>';
    }).join('');
}

function renderYoudaoLinks(url) {
    const container = document.getElementById('youdaoLinks');

    container.innerHTML = languages.map(lang => {
        const translateUrl = 'https://translate.youdao.com/' +
            '?url=' + encodeURIComponent(url) +
            '&from=auto&to=' + lang.code;
        return '<a href="' + translateUrl + '" target="_blank" rel="noopener noreferrer" class="translate-link">' +
            '<span class="lang-flag">' + lang.flag + '</span>' +
            '<span class="lang-name">' + lang.name + '</span>' +
            '<i class="fa fa-external-link link-icon"></i>' +
        '</a>';
    }).join('');
}
