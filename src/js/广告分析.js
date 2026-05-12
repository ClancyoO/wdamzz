import '../utils/anti-debug.js'
import { goHome } from '../utils/common.js'
import * as XLSX from 'xlsx'

let originalData = [];
let tableData = [];
let headers = [];
let requiredHeaders = [
    '展示量', '点击量', '7天总订单数(#)', '花费',
    '7天总销售额', '日期', '客户搜索词'
];
let headerMap = {};

const dataInput = document.getElementById('data-input');
const parseBtn = document.getElementById('parse-btn');
const tableSection = document.getElementById('table-section');
const dataTable = document.getElementById('data-table');
const headerStatus = document.getElementById('header-status');
const analyzeBtn = document.getElementById('analyze-btn');
const resultSection = document.getElementById('result-section');
const resultTable = document.getElementById('result-table');
const downloadBtn = document.getElementById('download-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

function init() {
    const homeBtn = document.getElementById('home-btn');
    homeBtn.addEventListener('click', function() {
        goHome();
    });

    parseBtn.addEventListener('click', parseData);
    analyzeBtn.addEventListener('click', analyzeData);
    downloadBtn.addEventListener('click', downloadExcel);

    dataInput.addEventListener('paste', function() {
        setTimeout(() => {
            if (dataInput.value.trim()) {
                parseData();
            }
        }, 100);
    });
}

function parseData() {
    const input = dataInput.value.trim();
    if (!input) {
        showToast('请输入表格数据', 'error');
        return;
    }

    try {
        showLoading('正在解析数据...');

        const lines = input.split('\n');

        headers = lines[0].split('\t');

        originalData = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split('\t');
            if (values.length < headers.length) {
                while (values.length < headers.length) {
                    values.push('');
                }
            }

            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            originalData.push(row);
        }

        tableData = originalData.slice(0, 10);

        renderTable();

        checkHeaders();

        tableSection.classList.remove('hidden');

        tableSection.scrollIntoView({ behavior: 'smooth' });

        showToast('数据解析成功', 'success');
    } catch (error) {
        console.error('解析数据失败:', error);
        showToast('数据解析失败，请检查输入格式', 'error');
    } finally {
        hideLoading();
    }
}

function renderTable() {
    dataTable.innerHTML = '';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    headers.forEach((header, index) => {
        const th = document.createElement('th');
        th.className = 'header-cell';
        th.textContent = header;
        th.dataset.index = index;

        th.addEventListener('click', (e) => {
            e.stopPropagation();
            showHeaderDropdown(th);
        });

        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    dataTable.appendChild(thead);

    const tbody = document.createElement('tbody');

    tableData.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');

        headers.forEach((header) => {
            const td = document.createElement('td');
            const value = row[header] || '';

            if (!isNaN(value) && value !== '') {
                const num = parseFloat(value);
                if (isFinite(num)) {
                    if (header === '花费' || header === '7天总销售额') {
                        td.textContent = num.toFixed(2);
                    } else {
                        td.textContent = num.toFixed(0);
                    }
                } else {
                    td.textContent = value;
                }
            } else {
                td.textContent = value;
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    dataTable.appendChild(tbody);
}

function showHeaderDropdown(th) {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.remove();
    });

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';

    requiredHeaders.forEach(header => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = header;

        item.addEventListener('click', () => {
            const index = parseInt(th.dataset.index);
            headers[index] = header;
            th.textContent = header;
            dropdown.remove();

            checkHeaders();

            renderTable();
        });

        dropdown.appendChild(item);
    });

    th.appendChild(dropdown);

    document.addEventListener('click', function closeDropdown(e) {
        if (!dropdown.contains(e.target) && e.target !== th) {
            dropdown.remove();
            document.removeEventListener('click', closeDropdown);
        }
    });
}

function checkHeaders() {
    const missingHeaders = [];
    const headerCells = dataTable.querySelectorAll('thead th');

    headerCells.forEach(cell => {
        cell.classList.remove('highlight-error');
    });

    requiredHeaders.forEach(requiredHeader => {
        if (!headers.includes(requiredHeader)) {
            missingHeaders.push(requiredHeader);
        }
    });

    if (missingHeaders.length > 0) {
        headerStatus.textContent = `缺少必填表头: ${missingHeaders.join(', ')}`;
        headerStatus.className = 'text-sm font-medium text-danger';

        headerCells.forEach(cell => {
            cell.classList.add('highlight-error');
        });

        analyzeBtn.disabled = true;
        analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        headerStatus.textContent = '表头检查通过';
        headerStatus.className = 'text-sm font-medium text-success';

        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');

        createHeaderMap();
    }
}

function createHeaderMap() {
    headerMap = {};
    requiredHeaders.forEach(header => {
        headerMap[header] = header;
    });
}

function analyzeData() {
    try {
        showLoading('正在分析数据...');

        const aggregatedData = {};

        originalData.forEach(row => {
            const searchTerm = row['客户搜索词'] || '';

            if (!searchTerm) return;

            if (!aggregatedData[searchTerm]) {
                aggregatedData[searchTerm] = {
                    曝光: 0,
                    点击: 0,
                    订单: 0,
                    总花费: 0,
                    销售额: 0,
                    最后日期: ''
                };
            }

            const impressions = parseNumber(row['展示量']);
            const clicks = parseNumber(row['点击量']);
            const orders = parseNumber(row['7天总订单数(#)']);
            const cost = parseNumber(row['花费']);
            const sales = parseNumber(row['7天总销售额']);

            aggregatedData[searchTerm].曝光 += impressions;
            aggregatedData[searchTerm].点击 += clicks;
            aggregatedData[searchTerm].订单 += orders;
            aggregatedData[searchTerm].总花费 += cost;
            aggregatedData[searchTerm].销售额 += sales;

            console.log(`搜索词: "${searchTerm}"`);
            console.log(`  展示量: "${row['展示量']}" -> ${impressions}`);
            console.log(`  点击量: "${row['点击量']}" -> ${clicks}`);
            console.log(`  订单数: "${row['7天总订单数(#)']}" -> ${orders}`);
            console.log(`  花费: "${row['花费']}" -> ${cost}`);
            console.log(`  销售额: "${row['7天总销售额']}" -> ${sales}`);

            const currentDate = row['日期'] || '';
            if (currentDate &&
                (!aggregatedData[searchTerm].最后日期 ||
                 new Date(currentDate) > new Date(aggregatedData[searchTerm].最后日期))) {
                aggregatedData[searchTerm].最后日期 = currentDate;
            }
        });

        const resultData = [];
        for (const searchTerm in aggregatedData) {
            const data = aggregatedData[searchTerm];

            const clickRate = data.曝光 > 0 ? (data.点击 / data.曝光) * 100 : 0;
            const conversionRate = data.点击 > 0 ? (data.订单 / data.点击) * 100 : 0;
            const acos = data.销售额 > 0 ? (data.总花费 / data.销售额) * 100 : 0;
            const cpc = data.点击 > 0 ? data.总花费 / data.点击 : 0;
            const cpa = data.订单 > 0 ? data.总花费 / data.订单 : 0;

            resultData.push({
                客户搜索词: searchTerm,
                曝光: data.曝光.toFixed(0),
                点击: data.点击.toFixed(0),
                订单: data.订单.toFixed(0),
                点击率: clickRate.toFixed(2) + '%',
                转化率: conversionRate.toFixed(2) + '%',
                销售额: data.销售额.toFixed(2),
                总花费: data.总花费.toFixed(2),
                ACOS: acos.toFixed(2) + '%',
                CPC: cpc.toFixed(2),
                CPA: cpa.toFixed(2),
                最后日期: formatDate(data.最后日期)
            });
        }

        resultData.sort((a, b) => parseFloat(b.订单) - parseFloat(a.订单));

        renderResultTable(resultData);

        resultSection.classList.remove('hidden');

        resultSection.scrollIntoView({ behavior: 'smooth' });

        showToast('数据分析完成', 'success');
    } catch (error) {
        console.error('分析数据失败:', error);
        showToast('数据分析失败，请检查数据格式', 'error');
    } finally {
        hideLoading();
    }
}

function renderResultTable(data) {
    resultTable.innerHTML = '';

    if (data.length === 0) {
        const tbody = document.createElement('tbody');
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 12;
        cell.textContent = '没有找到符合条件的数据';
        cell.className = 'text-center py-4 text-gray-500';
        row.appendChild(cell);
        tbody.appendChild(row);
        resultTable.appendChild(tbody);
        return;
    }

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const resultHeaders = [
        '客户搜索词', '曝光', '点击', '订单', '点击率',
        '转化率', '销售额', '总花费', 'ACOS', 'CPC', 'CPA', '最后日期'
    ];

    resultHeaders.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    resultTable.appendChild(thead);

    const tbody = document.createElement('tbody');

    data.forEach(row => {
        const tr = document.createElement('tr');

        resultHeaders.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '0';

            if (header === '订单' && parseFloat(row[header]) > 0) {
                td.className = 'bg-order-positive font-medium';
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    resultTable.appendChild(tbody);
}

function downloadExcel() {
    try {
        showLoading('正在生成Excel文件...');

        const resultHeaders = [
            '客户搜索词', '曝光', '点击', '订单', '点击率',
            '转化率', '销售额', '总花费', 'ACOS', 'CPC', 'CPA', '最后日期'
        ];

        const rows = [];
        rows.push(resultHeaders);

        const tbody = resultTable.querySelector('tbody');
        if (tbody) {
            const cells = tbody.querySelectorAll('tr td');
            let row = [];

            cells.forEach((cell, index) => {
                let value = cell.textContent;

                if (value.includes('%')) {
                    value = value.replace('%', '');
                    if (!isNaN(value) && value !== '') {
                        value = parseFloat(value);
                        if (value > 1) {
                            value = value / 100;
                        }
                    }
                } else if (!isNaN(value) && value !== '') {
                    value = parseFloat(value);
                }

                row.push(value);

                if ((index + 1) % 12 === 0) {
                    rows.push(row);
                    row = [];
                }
            });
        }

        const wb = XLSX.utils.book_new();

        const ws = XLSX.utils.aoa_to_sheet(rows, {
            cellDates: true,
            cellStyles: true
        });

        const colWidths = [
            { wch: 20 },
            { wch: 10 },
            { wch: 10 },
            { wch: 10 },
            { wch: 10 },
            { wch: 10 },
            { wch: 12 },
            { wch: 12 },
            { wch: 10 },
            { wch: 10 },
            { wch: 10 },
            { wch: 12 }
        ];
        ws['!cols'] = colWidths;

        const styles = {
            header: {
                font: {
                    bold: true,
                    color: { rgb: '000000' }
                },
                fill: {
                    fgColor: { rgb: 'F8FAFC' }
                },
                alignment: {
                    horizontal: 'left',
                    vertical: 'center'
                },
                border: {
                    top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    right: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    left: { style: 'thin', color: { rgb: 'E2E8F0' } }
                }
            },
            orderPositive: {
                fill: {
                    fgColor: { rgb: 'E6F7EF' }
                },
                font: {
                    bold: true
                },
                alignment: {
                    horizontal: 'right',
                    vertical: 'center'
                },
                border: {
                    top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    right: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    left: { style: 'thin', color: { rgb: 'E2E8F0' } }
                }
            },
            integer: {
                numFmt: 0,
                alignment: {
                    horizontal: 'right',
                    vertical: 'center'
                },
                border: {
                    top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    right: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    left: { style: 'thin', color: { rgb: 'E2E8F0' } }
                }
            },
            decimal: {
                numFmt: 2,
                alignment: {
                    horizontal: 'right',
                    vertical: 'center'
                },
                border: {
                    top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    right: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    left: { style: 'thin', color: { rgb: 'E2E8F0' } }
                }
            },
            percentage: {
                numFmt: 11,
                alignment: {
                    horizontal: 'right',
                    vertical: 'center'
                },
                border: {
                    top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    right: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    left: { style: 'thin', color: { rgb: 'E2E8F0' } }
                }
            },
            text: {
                alignment: {
                    horizontal: 'left',
                    vertical: 'center'
                },
                border: {
                    top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    right: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    left: { style: 'thin', color: { rgb: 'E2E8F0' } }
                }
            },
            date: {
                numFmt: 14,
                alignment: {
                    horizontal: 'left',
                    vertical: 'center'
                },
                border: {
                    top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    right: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                    left: { style: 'thin', color: { rgb: 'E2E8F0' } }
                }
            }
        };

        const range = XLSX.utils.decode_range(ws['!ref']);

        for (let col = 0; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (ws[cellAddress]) {
                ws[cellAddress].s = styles.header;
            }
        }

        for (let row = 1; row <= range.e.r; row++) {
            for (let col = 0; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = ws[cellAddress];

                if (!cell) continue;

                switch (col) {
                    case 0:
                        cell.s = styles.text;
                        break;
                    case 1:
                    case 2:
                        cell.s = styles.integer;
                        break;
                    case 3:
                        if (cell.v > 0) {
                            cell.s = styles.orderPositive;
                        } else {
                            cell.s = styles.integer;
                        }
                        break;
                    case 4:
                    case 5:
                    case 8:
                        if (cell.v > 1) {
                            cell.v = cell.v / 100;
                        }
                        cell.s = styles.percentage;
                        break;
                    case 6:
                    case 7:
                    case 9:
                    case 10:
                        cell.s = styles.decimal;
                        break;
                    case 11:
                        cell.s = styles.date;
                        break;
                }
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, '分析结果');

        const date = new Date();
        const fileName = `分析结果_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.xlsx`;

        XLSX.writeFile(wb, fileName);

        showToast('表格下载成功', 'success');
    } catch (error) {
        console.error('下载Excel失败:', error);
        showToast('下载Excel失败，请稍后重试', 'error');
    } finally {
        hideLoading();
    }
}

function parseNumber(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    let strValue = String(value);

    strValue = strValue.replace(/[,，\s￥$€£¥]/g, '');

    const num = parseFloat(strValue);
    return isNaN(num) ? 0 : num;
}

function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function showToast(message, type = 'info') {
    toastMessage.textContent = message;

    toast.className = 'fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg transform transition-all duration-300 z-50';

    switch (type) {
        case 'success':
            toast.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toast.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toast.classList.add('bg-warning', 'text-white');
            break;
        default:
            toast.classList.add('bg-gray-800', 'text-white');
    }

    toast.classList.remove('hidden', 'translate-y-10', 'opacity-0');

    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

function showLoading(text = '正在处理数据...') {
    loadingText.textContent = text;
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', init);
