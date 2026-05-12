import '../utils/anti-debug.js'
import { goHome, showToast } from '../utils/common.js'

const unitData = {
    length: {
        name: '长度',
        units: {
            'mm': { name: '毫米 (mm)', factor: 0.001 },
            'cm': { name: '厘米 (cm)', factor: 0.01 },
            'dm': { name: '分米 (dm)', factor: 0.1 },
            'm': { name: '米 (m)', factor: 1 },
            'km': { name: '千米 (km)', factor: 1000 },
            'in': { name: '英寸 (in)', factor: 0.0254 },
            'ft': { name: '英尺 (ft)', factor: 0.3048 },
            'yd': { name: '码 (yd)', factor: 0.9144 },
            'mi': { name: '英里 (mi)', factor: 1609.344 },
            'nmi': { name: '海里 (nmi)', factor: 1852 },
            'li': { name: '里', factor: 500 },
            'zhang': { name: '丈', factor: 10/3 },
            'chi': { name: '尺', factor: 1/3 },
            'cun': { name: '寸', factor: 1/30 },
            'fen': { name: '分', factor: 1/300 },
        }
    },
    weight: {
        name: '重量',
        units: {
            'mg': { name: '毫克 (mg)', factor: 0.000001 },
            'g': { name: '克 (g)', factor: 0.001 },
            'kg': { name: '千克 (kg)', factor: 1 },
            't': { name: '吨 (t)', factor: 1000 },
            'oz': { name: '盎司 (oz)', factor: 0.028349523125 },
            'lb': { name: '磅 (lb)', factor: 0.45359237 },
            'jin': { name: '斤', factor: 0.5 },
            'liang': { name: '两', factor: 0.05 },
            'ct': { name: '克拉 (ct)', factor: 0.0002 },
            'gr': { name: '格令 (gr)', factor: 0.00006479891 },
        }
    },
    area: {
        name: '面积',
        units: {
            'mm2': { name: '平方毫米 (mm²)', factor: 0.000001 },
            'cm2': { name: '平方厘米 (cm²)', factor: 0.0001 },
            'dm2': { name: '平方分米 (dm²)', factor: 0.01 },
            'm2': { name: '平方米 (m²)', factor: 1 },
            'km2': { name: '平方千米 (km²)', factor: 1000000 },
            'ha': { name: '公顷 (ha)', factor: 10000 },
            'acre': { name: '英亩 (acre)', factor: 4046.8564224 },
            'in2': { name: '平方英寸 (in²)', factor: 0.00064516 },
            'ft2': { name: '平方英尺 (ft²)', factor: 0.09290304 },
            'mu': { name: '亩', factor: 666.6666666667 },
        }
    },
    volume: {
        name: '体积',
        units: {
            'mm3': { name: '立方毫米 (mm³)', factor: 1e-9 },
            'cm3': { name: '立方厘米 (cm³)', factor: 1e-6 },
            'dm3': { name: '立方分米 (dm³)', factor: 0.001 },
            'm3': { name: '立方米 (m³)', factor: 1 },
            'ml': { name: '毫升 (mL)', factor: 0.000001 },
            'cl': { name: '厘升 (cL)', factor: 0.00001 },
            'dl': { name: '分升 (dL)', factor: 0.0001 },
            'l': { name: '升 (L)', factor: 0.001 },
            'floz_uk': { name: '英制液体盎司 (fl oz UK)', factor: 2.84130625e-5 },
            'floz_us': { name: '美制液体盎司 (fl oz US)', factor: 2.95735295625e-5 },
            'gal_us': { name: '美制加仑 (gal US)', factor: 0.003785411784 },
            'gal_uk': { name: '英制加仑 (gal UK)', factor: 0.00454609 },
            'in3': { name: '立方英寸 (in³)', factor: 1.6387064e-5 },
            'ft3': { name: '立方英尺 (ft³)', factor: 0.028316846592 },
        }
    },
    temperature: {
        name: '温度',
        units: {
            'c': { name: '摄氏度 (°C)', factor: null },
            'f': { name: '华氏度 (°F)', factor: null },
            'k': { name: '开尔文 (K)', factor: null },
        }
    },
    data: {
        name: '数据存储',
        units: {
            'bit': { name: '比特 (bit)', factor: 1 },
            'B': { name: '字节 (B)', factor: 8 },
            'KB': { name: '千字节 (KB)', factor: 8192 },
            'MB': { name: '兆字节 (MB)', factor: 8388608 },
            'GB': { name: '吉字节 (GB)', factor: 8589934592 },
            'TB': { name: '太字节 (TB)', factor: 8796093022208 },
            'PB': { name: '拍字节 (PB)', factor: 9007199254740992 },
            'Kbit': { name: '千比特 (Kbit)', factor: 1000 },
            'Mbit': { name: '兆比特 (Mbit)', factor: 1000000 },
            'Gbit': { name: '吉比特 (Gbit)', factor: 1000000000 },
        }
    },
    pressure: {
        name: '压力',
        units: {
            'pa': { name: '帕斯卡 (Pa)', factor: 1 },
            'kpa': { name: '千帕 (kPa)', factor: 1000 },
            'mpa': { name: '兆帕 (MPa)', factor: 1000000 },
            'bar': { name: '巴 (bar)', factor: 100000 },
            'mbar': { name: '毫巴 (mbar)', factor: 100 },
            'atm': { name: '标准大气压 (atm)', factor: 101325 },
            'psi': { name: '磅力/平方英寸 (psi)', factor: 6894.757293168 },
            'mmhg': { name: '毫米汞柱 (mmHg)', factor: 133.3223684211 },
            'inhg': { name: '英寸汞柱 (inHg)', factor: 3386.389 },
            'torr': { name: '托 (Torr)', factor: 133.3223684211 },
        }
    },
    speed: {
        name: '速度',
        units: {
            'ms': { name: '米/秒 (m/s)', factor: 1 },
            'kmh': { name: '千米/时 (km/h)', factor: 1/3.6 },
            'mph': { name: '英里/时 (mph)', factor: 0.44704 },
            'kn': { name: '节 (kn)', factor: 0.514444 },
            'fts': { name: '英尺/秒 (ft/s)', factor: 0.3048 },
            'mach': { name: '马赫 (Mach)', factor: 340.29 },
            'c': { name: '光速 (c)', factor: 299792458 },
        }
    }
};

let currentCategory = 'length';

const fromUnitSelect = document.getElementById('fromUnit');
const toUnitSelect = document.getElementById('toUnit');
const inputArea = document.getElementById('inputArea');
const convertBtn = document.getElementById('convertBtn');
const resultSection = document.getElementById('resultSection');
const resultBody = document.getElementById('resultBody');
const fromUnitHeader = document.getElementById('fromUnitHeader');
const toUnitHeader = document.getElementById('toUnitHeader');
const swapBtn = document.getElementById('swapBtn');
const copyAllBtn = document.getElementById('copyAllBtn');
const extractedPreview = document.getElementById('extractedPreview');
const extractedTags = document.getElementById('extractedTags');
const homeBtn = document.getElementById('home-btn');

homeBtn.addEventListener('click', () => goHome());

document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentCategory = this.dataset.category;
        populateUnitSelects();
        resultSection.classList.add('hidden');
    });
});

function populateUnitSelects() {
    const units = unitData[currentCategory].units;
    const keys = Object.keys(units);
    fromUnitSelect.innerHTML = '';
    toUnitSelect.innerHTML = '';
    keys.forEach(key => {
        const opt1 = document.createElement('option');
        opt1.value = key;
        opt1.textContent = units[key].name;
        fromUnitSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = key;
        opt2.textContent = units[key].name;
        toUnitSelect.appendChild(opt2);
    });
    if (keys.length > 1) toUnitSelect.value = keys[1];
}

swapBtn.addEventListener('click', () => {
    const tmp = fromUnitSelect.value;
    fromUnitSelect.value = toUnitSelect.value;
    toUnitSelect.value = tmp;
    doConvert();
});

function extractNumbers(text) {
    if (!text.trim()) return [];
    const cleaned = text.replace(/[×✕✖\*xX]/g, ' ').replace(/[^\d.\-\s,;|、，；]/g, ' ');
    const parts = cleaned.split(/[\s,;|、，；]+/);
    const nums = [];
    parts.forEach(p => {
        const n = parseFloat(p);
        if (!isNaN(n) && isFinite(n)) nums.push(n);
    });
    return nums;
}

inputArea.addEventListener('input', () => {
    const nums = extractNumbers(inputArea.value);
    if (nums.length > 0) {
        extractedPreview.classList.remove('hidden');
        extractedTags.innerHTML = nums.map(n => `<span class="extracted-tag">${n}</span>`).join('');
    } else {
        extractedPreview.classList.add('hidden');
        extractedTags.innerHTML = '';
    }
});

function convert(value, fromKey, toKey, category) {
    if (category === 'temperature') {
        return convertTemperature(value, fromKey, toKey);
    }
    const fromFactor = unitData[category].units[fromKey].factor;
    const toFactor = unitData[category].units[toKey].factor;
    if (!fromFactor || !toFactor) return value;
    const baseValue = value * fromFactor;
    return baseValue / toFactor;
}

function convertTemperature(value, from, to) {
    if (from === to) return value;
    let celsius;
    switch (from) {
        case 'c': celsius = value; break;
        case 'f': celsius = (value - 32) * 5 / 9; break;
        case 'k': celsius = value - 273.15; break;
    }
    switch (to) {
        case 'c': return celsius;
        case 'f': return celsius * 9 / 5 + 32;
        case 'k': return celsius + 273.15;
    }
}

function formatNumber(num, decimalPlaces) {
    if (decimalPlaces !== 'auto' && decimalPlaces !== undefined) {
        const dp = parseInt(decimalPlaces);
        return num.toFixed(dp);
    }
    if (Number.isInteger(num) && Math.abs(num) < 1e15) return num.toLocaleString();
    if (Math.abs(num) >= 1e10 || (Math.abs(num) < 0.0001 && num !== 0)) {
        return num.toExponential(6);
    }
    const str = num.toPrecision(10);
    return parseFloat(str).toString();
}

function doConvert() {
    const nums = extractNumbers(inputArea.value);
    if (nums.length === 0) {
        showToast('请输入需要换算的数值', 'error');
        return;
    }
    const fromKey = fromUnitSelect.value;
    const toKey = toUnitSelect.value;
    const fromName = unitData[currentCategory].units[fromKey].name;
    const toName = unitData[currentCategory].units[toKey].name;
    const dp = document.getElementById('decimalSelect').value;

    fromUnitHeader.textContent = fromName;
    toUnitHeader.textContent = toName;

    resultBody.innerHTML = '';
    nums.forEach((num, i) => {
        const result = convert(num, fromKey, toKey, currentCategory);
        const row = document.createElement('tr');
        row.className = 'border-b border-border-color hover:bg-bg-module/50 transition-colors result-row';
        row.style.animationDelay = `${i * 0.05}s`;
        row.innerHTML = `
            <td class="px-6 py-3 text-text-primary font-medium">${num}</td>
            <td class="px-6 py-3 text-text-secondary">${fromName}</td>
            <td class="px-6 py-3 text-center text-primary">→</td>
            <td class="px-6 py-3 text-primary font-semibold">${formatNumber(result, dp)}</td>
        `;
        resultBody.appendChild(row);
    });

    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

convertBtn.addEventListener('click', doConvert);

document.getElementById('decimalSelect').addEventListener('change', () => {
    if (!resultSection.classList.contains('hidden')) doConvert();
});

inputArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doConvert();
    }
});

copyAllBtn.addEventListener('click', () => {
    const rows = resultBody.querySelectorAll('tr');
    if (rows.length === 0) {
        showToast('没有可复制的结果', 'error');
        return;
    }
    const fromName = unitData[currentCategory].units[fromUnitSelect.value].name;
    const toName = unitData[currentCategory].units[toUnitSelect.value].name;
    let text = `原始值\t${fromName}\t换算结果\t${toName}\n`;
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        text += `${cells[0].textContent}\t${cells[1].textContent}\t${cells[3].textContent}\t${toName}\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板，可粘贴到Excel', 'success');
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
});

populateUnitSelects();
