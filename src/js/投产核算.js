import '../utils/anti-debug.js'
import { goHome, showToast } from '../utils/common.js'

const inputs = {
    price: document.getElementById('price'),
    cost: document.getElementById('cost'),
    firstLeg: document.getElementById('firstLeg'),
    fbaFee: document.getElementById('fbaFee'),
    commissionRate: document.getElementById('commissionRate'),
    adRate: document.getElementById('adRate'),
    returnRate: document.getElementById('returnRate'),
    storageRate: document.getElementById('storageRate'),
    exchangeRate: document.getElementById('exchangeRate'),
};

function getVal(id) {
    const v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? 0 : v;
}

function getRate() {
    const v = parseFloat(document.getElementById('exchangeRate').value);
    return isNaN(v) || v <= 0 ? 6.8 : v;
}

function getCurrency(field) {
    const btn = document.querySelector(`.currency-toggle[data-field="${field}"]`);
    return btn ? btn.dataset.currency : '¥';
}

function toggleCurrency(btn) {
    const cur = btn.dataset.currency;
    btn.dataset.currency = cur === '¥' ? '$' : '¥';
    btn.textContent = btn.dataset.currency;
    calculate();
}

window.toggleCurrency = toggleCurrency;

function toCNY(value, field) {
    return getCurrency(field) === '$' ? value * getRate() : value;
}

function fmt(n) {
    if (isNaN(n) || !isFinite(n)) return '-';
    return n.toFixed(2);
}

function pct(n) {
    if (isNaN(n) || !isFinite(n)) return '-';
    return n.toFixed(2) + '%';
}

function setColor(el, value) {
    el.classList.remove('positive', 'negative', 'neutral');
    if (value > 0) el.classList.add('positive');
    else if (value < 0) el.classList.add('negative');
    else el.classList.add('neutral');
}

function calculate() {
    const priceRaw = getVal('price');
    const costRaw = getVal('cost');
    const firstLegRaw = getVal('firstLeg');
    const fbaFeeRaw = getVal('fbaFee');
    const commissionRate = getVal('commissionRate') / 100;
    const adRate = getVal('adRate') / 100;
    const returnRate = getVal('returnRate') / 100;
    const storageRate = getVal('storageRate') / 100;

    const price = toCNY(priceRaw, 'price');
    const cost = toCNY(costRaw, 'cost');
    const firstLeg = toCNY(firstLegRaw, 'firstLeg');
    const fbaFee = toCNY(fbaFeeRaw, 'fbaFee');

    const commission = price * commissionRate;
    const adFee = price * adRate;
    const returnLoss = price * returnRate;
    const fbaWithReturn = fbaFee * (1 + returnRate);
    const storageFee = price * storageRate;

    const totalCost = cost + firstLeg + fbaWithReturn + commission + adFee + returnLoss + storageFee;
    const grossProfit = price - totalCost;
    const grossMargin = price > 0 ? (grossProfit / price * 100) : 0;
    const paymentBack = price - commission - adFee - returnLoss;
    const paymentRate = price > 0 ? (paymentBack / price * 100) : 0;
    const investment = cost + firstLeg + fbaFee + storageFee;
    const roi = investment > 0 ? (grossProfit / investment * 100) : 0;

    const elGrossProfit = document.getElementById('grossProfit');
    const elGrossMargin = document.getElementById('grossMargin');
    const elRoi = document.getElementById('roi');
    const elPaymentBack = document.getElementById('paymentBack');
    const elPaymentRate = document.getElementById('paymentRate');
    const elTotalCost = document.getElementById('totalCost');

    if (price === 0 && cost === 0) {
        elGrossProfit.textContent = '-';
        elGrossMargin.textContent = '-';
        elRoi.textContent = '-';
        elPaymentBack.textContent = '-';
        elPaymentRate.textContent = '-';
        elTotalCost.textContent = '-';
        elGrossProfit.className = 'result-value neutral';
        elGrossMargin.className = 'result-value neutral';
        elRoi.className = 'result-value neutral';
        elPaymentBack.className = 'result-value neutral';
        elPaymentRate.className = 'result-value neutral';
        elTotalCost.className = 'result-value neutral';
        document.querySelectorAll('#breakdown span[id^="bd"]').forEach(el => el.textContent = '-');
        return;
    }

    elGrossProfit.textContent = fmt(grossProfit);
    setColor(elGrossProfit, grossProfit);

    elGrossMargin.textContent = pct(grossMargin);
    setColor(elGrossMargin, grossMargin);

    elRoi.textContent = pct(roi);
    setColor(elRoi, roi);

    elPaymentBack.textContent = fmt(paymentBack);
    setColor(elPaymentBack, paymentBack);

    elPaymentRate.textContent = pct(paymentRate);
    setColor(elPaymentRate, paymentRate);

    elTotalCost.textContent = fmt(totalCost);
    elTotalCost.className = 'result-value neutral';

    document.getElementById('bdCost').textContent = fmt(cost);
    document.getElementById('bdFirstLeg').textContent = fmt(firstLeg);
    document.getElementById('bdFba').textContent = fmt(fbaWithReturn);
    document.getElementById('bdCommission').textContent = fmt(commission);
    document.getElementById('bdAd').textContent = fmt(adFee);
    document.getElementById('bdReturn').textContent = fmt(returnLoss);
    document.getElementById('bdStorage').textContent = fmt(storageFee);
    document.getElementById('bdTotal').textContent = fmt(totalCost);
    document.getElementById('bdPrice').textContent = fmt(price);

    const bdProfit = document.getElementById('bdProfit');
    bdProfit.textContent = fmt(grossProfit);
    bdProfit.className = grossProfit >= 0 ? 'text-green-400' : 'text-red-400';
}

Object.values(inputs).forEach(input => {
    input.addEventListener('input', calculate);
});

document.getElementById('home-btn').addEventListener('click', () => goHome());

document.getElementById('clearBtn').addEventListener('click', () => {
    inputs.price.value = '';
    inputs.cost.value = '';
    inputs.firstLeg.value = '';
    inputs.fbaFee.value = '';
    inputs.commissionRate.value = '15';
    inputs.adRate.value = '0';
    inputs.returnRate.value = '0';
    inputs.storageRate.value = '0';
    inputs.exchangeRate.value = '6.8';
    document.querySelectorAll('.currency-toggle').forEach(btn => {
        const field = btn.dataset.field;
        const defaultCur = (field === 'price' || field === 'fbaFee') ? '$' : '¥';
        btn.dataset.currency = defaultCur;
        btn.textContent = defaultCur;
    });
    calculate();
    showToast('已清空所有输入', 'info');
});

document.getElementById('copyBtn').addEventListener('click', () => {
    const priceRaw = getVal('price');
    if (priceRaw === 0) {
        showToast('请先输入数据', 'error');
        return;
    }
    const costRaw = getVal('cost');
    const firstLegRaw = getVal('firstLeg');
    const fbaFeeRaw = getVal('fbaFee');
    const commissionRate = getVal('commissionRate');
    const adRate = getVal('adRate');
    const returnRate = getVal('returnRate');
    const storageRate = getVal('storageRate');
    const rate = getRate();

    const price = toCNY(priceRaw, 'price');
    const cost = toCNY(costRaw, 'cost');
    const firstLeg = toCNY(firstLegRaw, 'firstLeg');
    const fbaFee = toCNY(fbaFeeRaw, 'fbaFee');

    const commission = price * commissionRate / 100;
    const adFee = price * adRate / 100;
    const returnLoss = price * returnRate / 100;
    const fbaWithReturn = fbaFee * (1 + returnRate / 100);
    const storageFee = price * storageRate / 100;
    const totalCost = cost + firstLeg + fbaWithReturn + commission + adFee + returnLoss + storageFee;
    const grossProfit = price - totalCost;
    const grossMargin = price > 0 ? (grossProfit / price * 100) : 0;
    const paymentBack = price - commission - adFee - returnLoss;
    const paymentRate = price > 0 ? (paymentBack / price * 100) : 0;
    const investment = cost + firstLeg + fbaFee + storageFee;
    const roi = investment > 0 ? (grossProfit / investment * 100) : 0;

    const curLabel = (field) => getCurrency(field) === '$' ? '$' : '¥';

    const lines = [
        '投产核算结果',
        '',
        '输入参数',
        `汇率\t1$ = ${rate}¥`,
        `售价\t${fmt(priceRaw)} ${curLabel('price')}`,
        `成本\t${fmt(costRaw)} ${curLabel('cost')}`,
        `头程运费\t${fmt(firstLegRaw)} ${curLabel('firstLeg')}`,
        `FBA运费\t${fmt(fbaFeeRaw)} ${curLabel('fbaFee')}`,
        `佣金比例\t${commissionRate}%`,
        `推广费用占比\t${adRate}%`,
        `退货率\t${returnRate}%`,
        `仓储及其它占比\t${storageRate}%`,
        '',
        '费用明细（已换算为人民币）',
        `产品成本\t${fmt(cost)} ¥`,
        `头程运费\t${fmt(firstLeg)} ¥`,
        `FBA运费(含退货分摊)\t${fmt(fbaWithReturn)} ¥`,
        `平台佣金\t${fmt(commission)} ¥`,
        `推广费用\t${fmt(adFee)} ¥`,
        `退货损失\t${fmt(returnLoss)} ¥`,
        `仓储及其它\t${fmt(storageFee)} ¥`,
        `总成本\t${fmt(totalCost)} ¥`,
        '',
        '计算结果（人民币）',
        `毛利额\t${fmt(grossProfit)} ¥`,
        `毛利率\t${pct(grossMargin)}`,
        `回款额\t${fmt(paymentBack)} ¥`,
        `回款率\t${pct(paymentRate)}`,
        `ROI\t${pct(roi)}`,
    ];
    const text = lines.join('\n');

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
});

calculate();