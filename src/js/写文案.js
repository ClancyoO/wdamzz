import '../utils/anti-debug.js'
import { goHome, showToast } from '../utils/common.js'

let descriptionCounter = 1;
const storageKey = 'text-compare-tool-data';

const descriptionsContainer = document.getElementById('descriptions-container');
const addDescriptionBtn = document.getElementById('add-description');
const titleInput = document.getElementById('title-input');
const titleHighlight = document.getElementById('title-highlight');
const keywordsInput = document.getElementById('keywords-input');
const keywordsHighlight = document.getElementById('keywords-highlight');
const descriptionInput = document.getElementById('description-input');
const descriptionHighlight = document.getElementById('description-highlight');
const aplusInput = document.getElementById('aplus-input');
const aplusHighlight = document.getElementById('aplus-highlight');
const checklist1Input = document.getElementById('checklist1-input');
const checklist1Items = document.getElementById('checklist1-items');
const checklist2Input = document.getElementById('checklist2-input');
const checklist2Items = document.getElementById('checklist2-items');

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    updateChecklists();

    const leftTextareas = document.querySelectorAll('#title-input, #keywords-input, #description-input, #aplus-input, .description-input');
    leftTextareas.forEach(textarea => {
        autoResizeTextarea(textarea);
    });

    initBackToTop();
    initHomeButton();
    initClearButton();
});

function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function initHomeButton() {
    const homeButton = document.getElementById('home-button');
    homeButton.addEventListener('click', function() {
        goHome();
    });
}

function initClearButton() {
    const clearButton = document.getElementById('clear-button');
    clearButton.addEventListener('click', function() {
        if (confirm('确定要清除所有内容吗？此操作不可撤销。')) {
            clearAllContent();
            showToast('所有内容已清除');
        }
    });
}

function clearAllContent() {
    titleInput.value = '';
    keywordsInput.value = '';
    descriptionInput.value = '';
    aplusInput.value = '';

    const descriptionsContainer = document.getElementById('descriptions-container');
    descriptionsContainer.innerHTML = `
        <div class="description-item">
            <div class="flex items-center mb-1">
                <span class="text-xs bg-bg-module px-2 py-1 rounded-md mr-2">1</span>
                <button class="delete-description text-text-secondary hover:text-red-500 transition-colors ml-auto">
                    <i class="fa fa-trash"></i>
                </button>
            </div>
            <div>
                <textarea
                    class="description-input w-full bg-bg-module border border-border-color rounded-md p-3 text-text-primary input-focus"
                    placeholder="请输入描述内容..."
                ></textarea>
                <div class="description-highlight highlight-display-full hidden"></div>
            </div>
        </div>
    `;
    descriptionCounter = 1;

    checklist1Input.value = '';
    checklist2Input.value = '';

    titleHighlight.innerHTML = '';
    titleHighlight.classList.add('hidden');
    keywordsHighlight.innerHTML = '';
    keywordsHighlight.classList.add('hidden');
    descriptionHighlight.innerHTML = '';
    descriptionHighlight.classList.add('hidden');
    aplusHighlight.innerHTML = '';
    aplusHighlight.classList.add('hidden');

    checklist1Items.innerHTML = '';
    checklist2Items.innerHTML = '';

    setupDescriptionEventListeners();

    localStorage.removeItem(storageKey);

    const leftTextareas = document.querySelectorAll('#title-input, #keywords-input, #description-input, #aplus-input, .description-input');
    leftTextareas.forEach(textarea => {
        autoResizeTextarea(textarea);
    });
}

function setupDescriptionEventListeners() {
    const descriptionsContainer = document.getElementById('descriptions-container');

    descriptionsContainer.addEventListener('click', function(e) {
        if (e.target.closest('.delete-description')) {
            const item = e.target.closest('.description-item');
            if (descriptionsContainer.children.length > 1) {
                item.remove();
                updateDescriptionNumbers();
                updateAll();
            } else {
                showToast('至少需要保留一个描述项');
            }
        }
    });

    descriptionsContainer.addEventListener('input', function(e) {
        if (e.target.classList.contains('description-input')) {
            autoResizeTextarea(e.target);
            debounce(updateAll, 300)();
        }
    });
}

function setupEventListeners() {
    addDescriptionBtn.addEventListener('click', addDescription);

    titleInput.addEventListener('input', function() {
        autoResizeTextarea(this);
        debounce(updateAll, 300)();
    });
    keywordsInput.addEventListener('input', function() {
        autoResizeTextarea(this);
        debounce(updateAll, 300)();
    });
    descriptionInput.addEventListener('input', function() {
        autoResizeTextarea(this);
        debounce(updateAll, 300)();
    });
    aplusInput.addEventListener('input', function() {
        autoResizeTextarea(this);
        debounce(updateAll, 300)();
    });
    checklist1Input.addEventListener('input', debounce(updateAll, 300));
    checklist2Input.addEventListener('input', debounce(updateAll, 300));

    descriptionsContainer.addEventListener('click', function(e) {
        if (e.target.closest('.delete-description')) {
            const item = e.target.closest('.description-item');
            if (descriptionsContainer.children.length > 1) {
                item.remove();
                updateDescriptionNumbers();
                updateAll();
            } else {
                showToast('至少需要保留一个描述项');
            }
        }
    });

    descriptionsContainer.addEventListener('input', function(e) {
        if (e.target.classList.contains('description-input')) {
            autoResizeTextarea(e.target);
            debounce(updateAll, 300)();
        }
    });
}

function addDescription() {
    descriptionCounter++;
    const newItem = document.createElement('div');
    newItem.className = 'description-item animate-fade-in';
    newItem.innerHTML = `
        <div class="flex items-center mb-1">
            <span class="text-xs bg-bg-module px-2 py-1 rounded-md mr-2">${descriptionCounter}</span>
            <button class="delete-description text-text-secondary hover:text-red-500 transition-colors ml-auto">
                <i class="fa fa-trash"></i>
            </button>
        </div>
        <div>
            <textarea
                class="description-input w-full bg-bg-module border border-border-color rounded-md p-3 text-text-primary input-focus"
                placeholder="请输入描述内容..."
            ></textarea>
            <div class="description-highlight highlight-display-full hidden"></div>
        </div>
    `;
    descriptionsContainer.appendChild(newItem);
    updateAll();
}

function updateDescriptionNumbers() {
    const items = descriptionsContainer.querySelectorAll('.description-item');
    items.forEach((item, index) => {
        const numberSpan = item.querySelector('span');
        numberSpan.textContent = (index + 1).toString();
    });
    descriptionCounter = items.length;
}

function getAllLeftText() {
    const texts = [];

    if (titleInput.value.trim()) {
        texts.push(titleInput.value);
    }

    const descriptionInputs = document.querySelectorAll('.description-input');
    descriptionInputs.forEach(input => {
        if (input.value.trim()) {
            texts.push(input.value);
        }
    });

    if (keywordsInput.value.trim()) {
        texts.push(keywordsInput.value);
    }

    if (descriptionInput.value.trim()) {
        texts.push(descriptionInput.value);
    }

    if (aplusInput.value.trim()) {
        texts.push(aplusInput.value);
    }

    return texts;
}

function getChecklistItems(textarea) {
    return textarea.value
        .split('\n')
        .filter(item => item.trim() !== '')
        .map(item => item.trim());
}

function highlightText(text, checklist1, checklist2 = []) {
    if (!text || (checklist1.length === 0 && checklist2.length === 0)) return text;

    const allItems = [
        ...checklist1.map(item => ({ text: item, type: 'red' })),
        ...checklist2.map(item => ({ text: item, type: 'blue' }))
    ].filter(item => item.text);

    if (allItems.length === 0) return text;

    allItems.sort((a, b) => b.text.length - a.text.length);

    const pattern = allItems.map(item => `(${escapeRegExp(item.text)})`).join('|');
    const regex = new RegExp(pattern, 'gi');

    const itemTypeMap = {};
    allItems.forEach(item => {
        const key = item.text.toLowerCase();
        if (!itemTypeMap[key]) {
            itemTypeMap[key] = item.type;
        }
    });

    return text.replace(regex, function(match) {
        const type = itemTypeMap[match.toLowerCase()] || 'red';
        const className = type === 'red' ? 'highlight' : 'highlight-blue';
        return `<span class="${className}">${match}</span>`;
    });
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countMatches(texts, item) {
    if (!item) return 0;

    let count = 0;
    const regex = new RegExp(`\\b${escapeRegExp(item)}\\b`, 'gi');

    texts.forEach(text => {
        const matches = text.match(regex);
        if (matches) {
            count += matches.length;
        }
    });

    return count;
}

function updateAll() {
    const leftTexts = getAllLeftText();
    const checklist1 = getChecklistItems(checklist1Input);
    const checklist2 = getChecklistItems(checklist2Input);

    updateHighlightDisplay(titleInput, titleHighlight, checklist1, checklist2);
    updateHighlightDisplay(keywordsInput, keywordsHighlight, checklist1, checklist2);
    updateHighlightDisplay(descriptionInput, descriptionHighlight, checklist1, checklist2);
    updateHighlightDisplay(aplusInput, aplusHighlight, checklist1, checklist2);

    const descriptionInputs = document.querySelectorAll('.description-input');
    const descriptionHighlights = document.querySelectorAll('.description-highlight');
    descriptionInputs.forEach((input, index) => {
        if (descriptionHighlights[index]) {
            updateHighlightDisplay(input, descriptionHighlights[index], checklist1, checklist2);
        }
    });

    updateChecklistDisplay(checklist1Items, checklist1, leftTexts);
    updateChecklistDisplay(checklist2Items, checklist2, leftTexts);

    saveData();
}

function updateChecklistDisplay(container, checklist, texts) {
    container.innerHTML = '';

    const itemsWithCount = checklist.map(item => ({
        text: item,
        count: countMatches(texts, item)
    }));

    itemsWithCount.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center justify-between bg-bg-module p-2 rounded-md transition-all duration-300 hover:bg-opacity-80';

        itemElement.innerHTML = `
            <span class="text-sm">${item.text}</span>
            <span class="count-badge ${item.count > 0 ? 'positive' : ''}">${item.count}</span>
        `;

        container.appendChild(itemElement);
    });
}

function updateHighlightDisplay(inputElement, highlightElement, checklist1, checklist2 = []) {
    const highlightedText = highlightText(inputElement.value, checklist1, checklist2);

    if (highlightedText !== inputElement.value) {
        highlightElement.innerHTML = highlightedText;
        highlightElement.classList.remove('hidden');
    } else {
        highlightElement.classList.add('hidden');
    }
}

function autoResizeTextarea(textarea) {
    const scrollTop = textarea.scrollTop;

    textarea.style.height = 'auto';

    const newHeight = Math.max(38, textarea.scrollHeight);
    textarea.style.height = newHeight + 'px';

    textarea.scrollTop = scrollTop;
}

function updateChecklists() {
    const checklist1 = getChecklistItems(checklist1Input);
    const checklist2 = getChecklistItems(checklist2Input);
    const leftTexts = getAllLeftText();

    updateChecklistDisplay(checklist1Items, checklist1, leftTexts);
    updateChecklistDisplay(checklist2Items, checklist2, leftTexts);
}

function saveData() {
    const data = {
        title: titleInput.value,
        descriptions: Array.from(document.querySelectorAll('.description-input')).map(input => input.value),
        keywords: keywordsInput.value,
        description: descriptionInput.value,
        aplus: aplusInput.value,
        checklist1: checklist1Input.value,
        checklist2: checklist2Input.value,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem(storageKey, JSON.stringify(data));
}

function loadData() {
    try {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            const data = JSON.parse(savedData);

            if (data.title !== undefined) {
                titleInput.value = data.title;
            }

            if (data.descriptions && Array.isArray(data.descriptions)) {
                descriptionsContainer.innerHTML = '';
                data.descriptions.forEach((text, index) => {
                    const newItem = document.createElement('div');
                    newItem.className = 'description-item';
                    newItem.innerHTML = `
                        <div class="flex items-center mb-1">
                            <span class="text-xs bg-bg-module px-2 py-1 rounded-md mr-2">${index + 1}</span>
                            <button class="delete-description text-text-secondary hover:text-red-500 transition-colors ml-auto">
                                <i class="fa fa-trash"></i>
                            </button>
                        </div>
                        <div class="textarea-wrapper">
                            <textarea
                                class="description-input w-full bg-bg-module border border-border-color rounded-md p-3 text-text-primary input-focus resize-none"
                                rows="2"
                                placeholder="请输入描述内容..."
                            >${text || ''}</textarea>
                            <div class="description-highlight textarea-content"></div>
                        </div>
                    `;
                    descriptionsContainer.appendChild(newItem);
                });
                descriptionCounter = data.descriptions.length;
            }

            if (data.keywords !== undefined) {
                keywordsInput.value = data.keywords;
            }

            if (data.description !== undefined) {
                descriptionInput.value = data.description;
            }

            if (data.aplus !== undefined) {
                aplusInput.value = data.aplus;
            }

            if (data.checklist1 !== undefined) {
                checklist1Input.value = data.checklist1;
            }

            if (data.checklist2 !== undefined) {
                checklist2Input.value = data.checklist2;
            }
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        showToast('加载数据失败');
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
