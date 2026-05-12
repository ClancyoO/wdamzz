import '../utils/anti-debug.js'
import { goHome, showToast } from '../utils/common.js'

const GOOGLE_COLORS = [
    '#4285F4', '#EA4335', '#FBBC05', '#34A853',
    '#FF6D01', '#46BDC6', '#7B61FF', '#F538A0',
    '#00ACC1', '#FF7043', '#8D6E63', '#78909C'
];
const GOOGLE_COLORS_ALPHA = GOOGLE_COLORS.map(c => c + '33');

let columns = [{ name: '数据列 1', values: '' }];
let currentChartType = 'line';
let chartInstances = [];
let pieLabels = [];

const xInput = document.getElementById('xInput');
const yColumnsContainer = document.getElementById('yColumnsContainer');
const pieLabelSection = document.getElementById('pieLabelSection');
const pieLabelsContainer = document.getElementById('pieLabelsContainer');
const chartArea = document.getElementById('chartArea');

function parseLines(text) {
    return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

function parseNumbers(text) {
    return text.split('\n').map(l => l.trim()).filter(l => l.length > 0).map(l => {
        const isPercent = l.endsWith('%');
        const cleaned = l.replace(/%$/, '').trim();
        const n = parseFloat(cleaned);
        return isNaN(n) ? { value: 0, isPercent: isPercent } : { value: n, isPercent: isPercent };
    });
}

function isColPercent(colValues) {
    if (colValues.length === 0) return false;
    const nonZero = colValues.filter(v => v.value !== 0);
    if (nonZero.length === 0) return false;
    return nonZero.every(v => v.isPercent);
}

function escAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderColumns() {
    yColumnsContainer.innerHTML = columns.map((col, i) => {
        return '<div class="column-card">' +
            '<div class="column-header">' +
                '<input type="text" class="column-name-input" value="' + escAttr(col.name) + '" data-col="' + i + '" onchange="updateColName(' + i + ', this.value)" placeholder="列名称">' +
                (columns.length > 1 ? '<button class="delete-col-btn" onclick="deleteColumn(' + i + ')" title="删除此列"><i class="fa fa-times"></i></button>' : '') +
            '</div>' +
            '<textarea class="data-input" data-col="' + i + '" oninput="updateColValues(' + i + ', this.value)" placeholder="每行一个数值&#10;例如：&#10;120&#10;200&#10;150&#10;180&#10;220" style="min-height:100px">' + escHtml(col.values) + '</textarea>' +
        '</div>';
    }).join('');
    document.getElementById('yColCount').textContent = columns.length + ' 列';
}

function addColumn() {
    columns.push({ name: '数据列 ' + (columns.length + 1), values: '' });
    renderColumns();
    renderChart();
}
window.addColumn = addColumn;

function deleteColumn(index) {
    columns.splice(index, 1);
    renderColumns();
    renderChart();
}
window.deleteColumn = deleteColumn;

function updateColName(index, name) {
    columns[index].name = name;
    renderChart();
}
window.updateColName = updateColName;

function updateColValues(index, values) {
    columns[index].values = values;
    renderChart();
}
window.updateColValues = updateColValues;

xInput.addEventListener('input', () => {
    const lines = parseLines(xInput.value);
    document.getElementById('xCount').textContent = lines.length + ' 个值';
    renderChart();
});

function switchChart(type, btn) {
    currentChartType = type;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (type === 'pie') {
        pieLabelSection.classList.remove('hidden');
        renderPieLabels();
    } else {
        pieLabelSection.classList.add('hidden');
    }
    renderChart();
}
window.switchChart = switchChart;

function renderPieLabels() {
    const xLabels = parseLines(xInput.value);
    if (xLabels.length === 0) {
        pieLabelsContainer.innerHTML = '<p class="text-xs text-text-secondary">请先输入横坐标值</p>';
        return;
    }
    while (pieLabels.length < xLabels.length) {
        pieLabels.push('');
    }
    pieLabels.length = xLabels.length;
    pieLabelsContainer.innerHTML = xLabels.map((label, i) => {
        return '<div class="flex items-center gap-2">' +
            '<span class="text-xs text-text-secondary w-6 text-right flex-shrink-0">' + (i + 1) + '</span>' +
            '<input type="text" class="pie-label-input" data-pie-index="' + i + '" value="' + escAttr(pieLabels[i]) + '" oninput="updatePieLabel(' + i + ', this.value)" placeholder="' + escAttr(label) + '">' +
        '</div>';
    }).join('');
}

function updatePieLabel(index, value) {
    pieLabels[index] = value;
    renderChart();
}
window.updatePieLabel = updatePieLabel;

function autoFillPieLabels() {
    const xLabels = parseLines(xInput.value);
    pieLabels = xLabels.map(l => l);
    renderPieLabels();
    renderChart();
}
window.autoFillPieLabels = autoFillPieLabels;

function destroyAllCharts() {
    chartInstances.forEach(c => c.destroy());
    chartInstances = [];
}

function renderChart() {
    const xLabels = parseLines(xInput.value);
    destroyAllCharts();
    chartArea.innerHTML = '';

    if (xLabels.length === 0) return;

    if (currentChartType === 'pie') {
        renderPieCharts(xLabels);
    } else {
        renderLineBarChart(xLabels);
    }
}

function getColData(col, xLabels) {
    const parsed = parseNumbers(col.values);
    const padded = [];
    for (let j = 0; j < xLabels.length; j++) {
        padded.push(j < parsed.length ? parsed[j] : { value: 0, isPercent: false });
    }
    return padded;
}

function getColNumbers(col, xLabels) {
    return getColData(col, xLabels).map(v => v.value);
}

function hasDifferentScales(allData) {
    if (allData.length < 2) return false;
    const maxValues = allData.map(d => {
        const absVals = d.map(v => Math.abs(v));
        return Math.max(...absVals);
    });
    const positiveMaxes = maxValues.filter(v => v > 0);
    if (positiveMaxes.length < 2) return false;
    const minMax = Math.min(...positiveMaxes);
    const maxMax = Math.max(...positiveMaxes);
    return maxMax / minMax > 5;
}

function formatDataLabel(value, isPercent) {
    if (value === 0) return isPercent ? '0%' : '0';
    if (isPercent) {
        if (Number.isInteger(value)) return value + '%';
        return value.toFixed(1) + '%';
    }
    if (Math.abs(value) >= 10000) return (value / 1000).toFixed(1) + 'k';
    if (Math.abs(value) >= 1000) return (value / 1000).toFixed(1) + 'k';
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(1);
}

function renderLineBarChart(xLabels) {
    const allParsed = columns.map(col => getColData(col, xLabels));
    const allData = allParsed.map(d => d.map(v => v.value));
    const colPercents = allParsed.map(d => isColPercent(d));
    const diffScales = hasDifferentScales(allData);

    const scales = {
        x: {
            ticks: { color: '#555555', font: { size: 11 } },
            grid: { color: '#e5e7eb' }
        }
    };

    const datasets = columns.map((col, i) => {
        const color = GOOGLE_COLORS[i % GOOGLE_COLORS.length];
        const bgColor = GOOGLE_COLORS_ALPHA[i % GOOGLE_COLORS_ALPHA.length];
        const isPct = colPercents[i];
        const ds = {
            label: col.name,
            data: allData[i],
            borderColor: color,
            backgroundColor: currentChartType === 'bar' ? color + 'CC' : bgColor,
            borderWidth: currentChartType === 'line' ? 2.5 : 0,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: currentChartType === 'line' ? 4 : 0,
            pointHoverRadius: currentChartType === 'line' ? 6 : 0,
            tension: 0.3,
            fill: currentChartType === 'line' ? false : undefined,
            borderRadius: currentChartType === 'bar' ? 4 : 0,
            barPercentage: 0.7,
            _isPercent: isPct,
        };

        if (diffScales) {
            const axisId = 'y' + i;
            ds.yAxisID = axisId;
            scales[axisId] = {
                type: 'linear',
                display: true,
                position: i === 0 ? 'left' : 'right',
                ticks: {
                    color: color,
                    font: { size: 11 },
                    callback: function(value) {
                        return isPct ? value + '%' : value;
                    }
                },
                grid: {
                    drawOnChartArea: i === 0,
                    color: '#e5e7eb',
                },
                beginAtZero: true,
                title: {
                    display: true,
                    text: col.name + (isPct ? ' (%)' : ''),
                    color: color,
                    font: { size: 12, weight: 'bold' }
                }
            };
        } else {
            ds.yAxisID = 'y';
        }

        return ds;
    });

    if (!diffScales) {
        const allPct = colPercents.every(p => p);
        scales.y = {
            ticks: {
                color: '#555555',
                font: { size: 11 },
                callback: function(value) {
                    return allPct ? value + '%' : value;
                }
            },
            grid: { color: '#e5e7eb' },
            beginAtZero: true,
        };
    }

    const canvasId = 'mainChart';
    chartArea.innerHTML = '<div class="chart-container"><div class="chart-wrapper" style="height:560px"><canvas id="' + canvasId + '"></canvas></div></div>';

    const ctx = document.getElementById(canvasId).getContext('2d');
    const chart = new Chart(ctx, {
        type: currentChartType,
        data: {
            labels: xLabels,
            datasets: datasets
        },
        plugins: [ChartDataLabels],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: columns.length > 1,
                    position: 'top',
                    labels: {
                        color: '#333333',
                        font: { size: 12 },
                        usePointStyle: true,
                        padding: 16,
                    }
                },
                tooltip: {
                    backgroundColor: '#333333',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#555555',
                    borderWidth: 1,
                    cornerRadius: 6,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            const isPct = context.dataset._isPercent;
                            const val = formatDataLabel(context.parsed.y, isPct);
                            return ' ' + context.dataset.label + ': ' + val;
                        }
                    }
                },
                title: {
                    display: false
                },
                datalabels: {
                    display: diffScales ? true : 'auto',
                    color: function(context) {
                        return GOOGLE_COLORS[context.datasetIndex % GOOGLE_COLORS.length];
                    },
                    font: { size: 11, weight: 'bold' },
                    anchor: 'end',
                    align: 'top',
                    offset: 2,
                    formatter: function(value, context) {
                        const isPct = context.dataset._isPercent;
                        return formatDataLabel(value, isPct);
                    }
                }
            },
            scales: scales,
            animation: {
                duration: 600,
                easing: 'easeOutQuart'
            }
        }
    });
    chartInstances.push(chart);
}

function renderPieCharts(xLabels) {
    let html = '<div class="space-y-4">';

    columns.forEach((col, colIdx) => {
        const canvasId = 'pieChart_' + colIdx;
        html += '<div class="pie-chart-card">';
        html += '<div class="pie-chart-title">' + escHtml(col.name) + '</div>';
        html += '<div class="chart-wrapper" style="height:480px"><canvas id="' + canvasId + '"></canvas></div>';
        html += '</div>';
    });

    html += '</div>';
    chartArea.innerHTML = html;

    columns.forEach((col, colIdx) => {
        const parsed = getColData(col, xLabels);
        const nums = parsed.map(v => v.value);
        const isPct = isColPercent(parsed);
        const labels = xLabels.map((label, i) => {
            return (pieLabels[i] && pieLabels[i].trim()) ? pieLabels[i] : label;
        });

        const bgColors = xLabels.map((_, i) => GOOGLE_COLORS[i % GOOGLE_COLORS.length]);
        const borderColors = xLabels.map(() => '#ffffff');

        const ctx = document.getElementById('pieChart_' + colIdx).getContext('2d');
        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: nums,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    hoverOffset: 8,
                    _isPercent: isPct,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            color: '#333333',
                            font: { size: 11 },
                            padding: 10,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                const ds = data.datasets[0];
                                const total = ds.data.reduce((a, b) => a + b, 0);
                                const isPct = ds._isPercent;
                                return data.labels.map((label, i) => {
                                    const value = ds.data[i];
                                    const pct = total > 0 ? (value / total * 100).toFixed(1) : 0;
                                    const valStr = formatDataLabel(value, isPct);
                                    return {
                                        text: label + '  ' + valStr + ' (' + pct + '%)',
                                        fillStyle: ds.backgroundColor[i],
                                        strokeStyle: '#ffffff',
                                        lineWidth: 1,
                                        hidden: false,
                                        index: i,
                                        pointStyle: 'rectRounded',
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#333333',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#555555',
                        borderWidth: 1,
                        cornerRadius: 6,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? (context.parsed / total * 100).toFixed(1) : 0;
                                const isPct = context.dataset._isPercent;
                                const valStr = formatDataLabel(context.parsed, isPct);
                                return ' ' + context.label + ': ' + valStr + ' (' + pct + '%)';
                            }
                        }
                    },
                    title: {
                        display: false
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 600,
                    easing: 'easeOutQuart'
                }
            }
        });
        chartInstances.push(chart);
    });
}

document.getElementById('home-btn').addEventListener('click', () => goHome());

document.getElementById('clearBtn').addEventListener('click', () => {
    xInput.value = '';
    columns = [{ name: '数据列 1', values: '' }];
    pieLabels = [];
    document.getElementById('xCount').textContent = '0 个值';
    renderColumns();
    renderChart();
    showToast('已清空所有数据', 'info');
});

renderColumns();
