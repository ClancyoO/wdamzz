import '../utils/anti-debug.js'
import { goHome } from '../utils/common.js'
import * as XLSX from 'xlsx'

let originalKeywords = []
let rootFrequency = {}
let twoRootFrequency = {}
let threeRootFrequency = {}
let fourRootFrequency = {}
let fiveRootFrequency = {}
let currentRootType = ''
let currentRoot = ''

const inputText = document.getElementById('inputText')
const analyzeBtn = document.getElementById('analyzeBtn')
const resultContainer = document.getElementById('resultContainer')
const resultTableBody = document.getElementById('resultTableBody')
const downloadBtn = document.getElementById('downloadBtn')
const loadingContainer = document.getElementById('loadingContainer')
const rootDetailModal = document.getElementById('rootDetailModal')
const modalTitle = document.getElementById('modalTitle')
const keywordList = document.getElementById('keywordList')
const closeModalBtn = document.getElementById('closeModalBtn')
const copyKeywordsBtn = document.getElementById('copyKeywordsBtn')

analyzeBtn.addEventListener('click', analyzeText)
downloadBtn.addEventListener('click', downloadExcel)
closeModalBtn.addEventListener('click', closeModal)
copyKeywordsBtn.addEventListener('click', copyKeywords)

function analyzeText() {
    const text = inputText.value.trim()
    if (!text) {
        alert('请输入需要分析的文本')
        return
    }

    showLoading()

    setTimeout(() => {
        originalKeywords = []
        rootFrequency = {}
        twoRootFrequency = {}
        threeRootFrequency = {}
        fourRootFrequency = {}
        fiveRootFrequency = {}

        const lines = text.split('\n')

        lines.forEach(line => {
            if (line.trim()) {
                originalKeywords.push(line.trim())
                processKeywords(line.trim())
            }
        })

        generateResultTable()

        hideLoading()
        resultContainer.classList.remove('hidden')

        resultContainer.scrollIntoView({ behavior: 'smooth' })
    }, 800)
}

function processKeywords(text) {
    const keywords = text.split(/[\s,.，。]+/).filter(keyword => keyword.trim())

    keywords.forEach(keyword => {
        if (keyword) {
            rootFrequency[keyword] = (rootFrequency[keyword] || 0) + 1
        }
    })

    for (let i = 0; i < keywords.length - 1; i++) {
        if (keywords[i] && keywords[i + 1]) {
            const twoRoot = `${keywords[i]} ${keywords[i + 1]}`
            twoRootFrequency[twoRoot] = (twoRootFrequency[twoRoot] || 0) + 1
        }
    }

    for (let i = 0; i < keywords.length - 2; i++) {
        if (keywords[i] && keywords[i + 1] && keywords[i + 2]) {
            const threeRoot = `${keywords[i]} ${keywords[i + 1]} ${keywords[i + 2]}`
            threeRootFrequency[threeRoot] = (threeRootFrequency[threeRoot] || 0) + 1
        }
    }

    for (let i = 0; i < keywords.length - 3; i++) {
        if (keywords[i] && keywords[i + 1] && keywords[i + 2] && keywords[i + 3]) {
            const fourRoot = `${keywords[i]} ${keywords[i + 1]} ${keywords[i + 2]} ${keywords[i + 3]}`
            fourRootFrequency[fourRoot] = (fourRootFrequency[fourRoot] || 0) + 1
        }
    }

    for (let i = 0; i < keywords.length - 4; i++) {
        if (keywords[i] && keywords[i + 1] && keywords[i + 2] && keywords[i + 3] && keywords[i + 4]) {
            const fiveRoot = `${keywords[i]} ${keywords[i + 1]} ${keywords[i + 2]} ${keywords[i + 3]} ${keywords[i + 4]}`
            fiveRootFrequency[fiveRoot] = (fiveRootFrequency[fiveRoot] || 0) + 1
        }
    }
}

function generateResultTable() {
    resultTableBody.innerHTML = ''

    const rootArray = Object.entries(rootFrequency).sort((a, b) => b[1] - a[1])
    const twoRootArray = Object.entries(twoRootFrequency).sort((a, b) => b[1] - a[1])
    const threeRootArray = Object.entries(threeRootFrequency).sort((a, b) => b[1] - a[1])
    const fourRootArray = Object.entries(fourRootFrequency).sort((a, b) => b[1] - a[1])
    const fiveRootArray = Object.entries(fiveRootFrequency).sort((a, b) => b[1] - a[1])

    const maxRows = Math.max(
        rootArray.length,
        twoRootArray.length,
        threeRootArray.length,
        fourRootArray.length,
        fiveRootArray.length
    )

    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement('tr')
        row.className = 'hover:bg-bg-module transition-all-300'
        row.style.animation = `fadeIn 0.3s ease-in-out forwards`
        row.style.animationDelay = `${i * 0.05}s`
        row.style.opacity = '0'

        const rootCell = document.createElement('td')
        rootCell.className = 'px-4 py-4 text-text-primary'
        if (i < rootArray.length) {
            const rootSpan = document.createElement('span')
            rootSpan.className = 'text-brand-blue cursor-pointer hover:underline transition-all-300'
            rootSpan.textContent = rootArray[i][0]
            rootSpan.addEventListener('click', () => showRootDetail('root', rootArray[i][0]))
            rootCell.appendChild(rootSpan)
        }
        row.appendChild(rootCell)

        const rootFreqCell = document.createElement('td')
        rootFreqCell.className = 'px-4 py-4 text-text-secondary'
        rootFreqCell.textContent = i < rootArray.length ? rootArray[i][1] : ''
        row.appendChild(rootFreqCell)

        const twoRootCell = document.createElement('td')
        twoRootCell.className = 'px-4 py-4 text-text-primary'
        if (i < twoRootArray.length) {
            const twoRootSpan = document.createElement('span')
            twoRootSpan.className = 'text-brand-blue cursor-pointer hover:underline transition-all-300'
            twoRootSpan.textContent = twoRootArray[i][0]
            twoRootSpan.addEventListener('click', () => showRootDetail('twoRoot', twoRootArray[i][0]))
            twoRootCell.appendChild(twoRootSpan)
        }
        row.appendChild(twoRootCell)

        const twoRootFreqCell = document.createElement('td')
        twoRootFreqCell.className = 'px-4 py-4 text-text-secondary'
        twoRootFreqCell.textContent = i < twoRootArray.length ? twoRootArray[i][1] : ''
        row.appendChild(twoRootFreqCell)

        const threeRootCell = document.createElement('td')
        threeRootCell.className = 'px-4 py-4 text-text-primary'
        if (i < threeRootArray.length) {
            const threeRootSpan = document.createElement('span')
            threeRootSpan.className = 'text-brand-blue cursor-pointer hover:underline transition-all-300'
            threeRootSpan.textContent = threeRootArray[i][0]
            threeRootSpan.addEventListener('click', () => showRootDetail('threeRoot', threeRootArray[i][0]))
            threeRootCell.appendChild(threeRootSpan)
        }
        row.appendChild(threeRootCell)

        const threeRootFreqCell = document.createElement('td')
        threeRootFreqCell.className = 'px-4 py-4 text-text-secondary'
        threeRootFreqCell.textContent = i < threeRootArray.length ? threeRootArray[i][1] : ''
        row.appendChild(threeRootFreqCell)

        const fourRootCell = document.createElement('td')
        fourRootCell.className = 'px-4 py-4 text-text-primary'
        if (i < fourRootArray.length) {
            const fourRootSpan = document.createElement('span')
            fourRootSpan.className = 'text-brand-blue cursor-pointer hover:underline transition-all-300'
            fourRootSpan.textContent = fourRootArray[i][0]
            fourRootSpan.addEventListener('click', () => showRootDetail('fourRoot', fourRootArray[i][0]))
            fourRootCell.appendChild(fourRootSpan)
        }
        row.appendChild(fourRootCell)

        const fourRootFreqCell = document.createElement('td')
        fourRootFreqCell.className = 'px-4 py-4 text-text-secondary'
        fourRootFreqCell.textContent = i < fourRootArray.length ? fourRootArray[i][1] : ''
        row.appendChild(fourRootFreqCell)

        const fiveRootCell = document.createElement('td')
        fiveRootCell.className = 'px-4 py-4 text-text-primary'
        if (i < fiveRootArray.length) {
            const fiveRootSpan = document.createElement('span')
            fiveRootSpan.className = 'text-brand-blue cursor-pointer hover:underline transition-all-300'
            fiveRootSpan.textContent = fiveRootArray[i][0]
            fiveRootSpan.addEventListener('click', () => showRootDetail('fiveRoot', fiveRootArray[i][0]))
            fiveRootCell.appendChild(fiveRootSpan)
        }
        row.appendChild(fiveRootCell)

        const fiveRootFreqCell = document.createElement('td')
        fiveRootFreqCell.className = 'px-4 py-4 text-text-secondary'
        fiveRootFreqCell.textContent = i < fiveRootArray.length ? fiveRootArray[i][1] : ''
        row.appendChild(fiveRootFreqCell)

        resultTableBody.appendChild(row)
    }
}

function showRootDetail(rootType, root) {
    currentRootType = rootType
    currentRoot = root

    modalTitle.textContent = `词根 "${root}" 的详情`

    keywordList.innerHTML = ''

    const matchingKeywords = originalKeywords.filter(keyword => {
        const keywords = keyword.split(/[\s,.，。]+/).filter(k => k.trim())

        switch (rootType) {
            case 'root':
                return keywords.includes(root)
            case 'twoRoot':
                const twoRoots = root.split(' ')
                for (let i = 0; i < keywords.length - 1; i++) {
                    if (keywords[i] === twoRoots[0] && keywords[i + 1] === twoRoots[1]) {
                        return true
                    }
                }
                return false
            case 'threeRoot':
                const threeRoots = root.split(' ')
                for (let i = 0; i < keywords.length - 2; i++) {
                    if (keywords[i] === threeRoots[0] && keywords[i + 1] === threeRoots[1] && keywords[i + 2] === threeRoots[2]) {
                        return true
                    }
                }
                return false
            case 'fourRoot':
                const fourRoots = root.split(' ')
                for (let i = 0; i < keywords.length - 3; i++) {
                    if (keywords[i] === fourRoots[0] && keywords[i + 1] === fourRoots[1] && keywords[i + 2] === fourRoots[2] && keywords[i + 3] === fourRoots[3]) {
                        return true
                    }
                }
                return false
            case 'fiveRoot':
                const fiveRoots = root.split(' ')
                for (let i = 0; i < keywords.length - 4; i++) {
                    if (keywords[i] === fiveRoots[0] && keywords[i + 1] === fiveRoots[1] && keywords[i + 2] === fiveRoots[2] && keywords[i + 3] === fiveRoots[3] && keywords[i + 4] === fiveRoots[4]) {
                        return true
                    }
                }
                return false
            default:
                return false
        }
    })

    if (matchingKeywords.length > 0) {
        matchingKeywords.forEach((keyword, index) => {
            const keywordItem = document.createElement('div')
            keywordItem.className = 'bg-bg-module rounded-6 p-3 text-sm text-text-primary card-hover'
            keywordItem.textContent = keyword
            keywordItem.style.animation = `fadeIn 0.3s ease-in-out forwards`
            keywordItem.style.animationDelay = `${index * 0.05}s`
            keywordItem.style.opacity = '0'
            keywordList.appendChild(keywordItem)
        })
    } else {
        const noMatchItem = document.createElement('div')
        noMatchItem.className = 'col-span-full text-center text-text-secondary py-8'
        noMatchItem.textContent = '没有找到包含该词根的关键词'
        keywordList.appendChild(noMatchItem)
    }

    rootDetailModal.classList.remove('hidden')
}

function closeModal() {
    rootDetailModal.classList.add('hidden')
}

function copyKeywords() {
    const matchingKeywords = originalKeywords.filter(keyword => {
        const keywords = keyword.split(/[\s,.，。]+/).filter(k => k.trim())

        switch (currentRootType) {
            case 'root':
                return keywords.includes(currentRoot)
            case 'twoRoot':
                const twoRoots = currentRoot.split(' ')
                for (let i = 0; i < keywords.length - 1; i++) {
                    if (keywords[i] === twoRoots[0] && keywords[i + 1] === twoRoots[1]) {
                        return true
                    }
                }
                return false
            case 'threeRoot':
                const threeRoots = currentRoot.split(' ')
                for (let i = 0; i < keywords.length - 2; i++) {
                    if (keywords[i] === threeRoots[0] && keywords[i + 1] === threeRoots[1] && keywords[i + 2] === threeRoots[2]) {
                        return true
                    }
                }
                return false
            case 'fourRoot':
                const fourRoots = currentRoot.split(' ')
                for (let i = 0; i < keywords.length - 3; i++) {
                    if (keywords[i] === fourRoots[0] && keywords[i + 1] === fourRoots[1] && keywords[i + 2] === fourRoots[2] && keywords[i + 3] === fourRoots[3]) {
                        return true
                    }
                }
                return false
            case 'fiveRoot':
                const fiveRoots = currentRoot.split(' ')
                for (let i = 0; i < keywords.length - 4; i++) {
                    if (keywords[i] === fiveRoots[0] && keywords[i + 1] === fiveRoots[1] && keywords[i + 2] === fiveRoots[2] && keywords[i + 3] === fiveRoots[3] && keywords[i + 4] === fiveRoots[4]) {
                        return true
                    }
                }
                return false
            default:
                return false
        }
    })

    const keywordsText = matchingKeywords.join('\n')

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(keywordsText).then(() => {
            showCopySuccess()
        }).catch(err => {
            console.error('复制失败:', err)
            fallbackCopyTextToClipboard(keywordsText)
        })
    } else {
        fallbackCopyTextToClipboard(keywordsText)
    }

    function showCopySuccess() {
        const originalText = copyKeywordsBtn.innerHTML
        copyKeywordsBtn.innerHTML = '<i class="fa fa-check mr-2"></i> 已复制'
        copyKeywordsBtn.classList.add('bg-green-500')
        copyKeywordsBtn.classList.remove('bg-primary', 'hover:bg-blue-600')

        setTimeout(() => {
            copyKeywordsBtn.innerHTML = originalText
            copyKeywordsBtn.classList.remove('bg-green-500')
            copyKeywordsBtn.classList.add('bg-primary', 'hover:bg-blue-600')
        }, 2000)
    }

    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea")
        textArea.value = text

        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"

        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
            const successful = document.execCommand('copy')
            if (successful) {
                showCopySuccess()
            } else {
                alert('复制失败，请手动选择并复制')
            }
        } catch (err) {
            console.error('复制失败:', err)
            alert('复制失败，请手动选择并复制')
        }

        document.body.removeChild(textArea)
    }
}

function downloadExcel() {
    const rootArray = Object.entries(rootFrequency).sort((a, b) => b[1] - a[1])
    const twoRootArray = Object.entries(twoRootFrequency).sort((a, b) => b[1] - a[1])
    const threeRootArray = Object.entries(threeRootFrequency).sort((a, b) => b[1] - a[1])
    const fourRootArray = Object.entries(fourRootFrequency).sort((a, b) => b[1] - a[1])
    const fiveRootArray = Object.entries(fiveRootFrequency).sort((a, b) => b[1] - a[1])

    const maxRows = Math.max(
        originalKeywords.length,
        rootArray.length,
        twoRootArray.length,
        threeRootArray.length,
        fourRootArray.length,
        fiveRootArray.length
    )

    const data = []

    data.push(['输入内容', '单词根', '词频', '双词根', '词频', '三词根', '词频', '四词根', '词频', '五词根', '词频'])

    for (let i = 0; i < maxRows; i++) {
        const row = []

        row.push(i < originalKeywords.length ? originalKeywords[i] : '')

        row.push(i < rootArray.length ? rootArray[i][0] : '')
        row.push(i < rootArray.length ? rootArray[i][1] : '')

        row.push(i < twoRootArray.length ? twoRootArray[i][0] : '')
        row.push(i < twoRootArray.length ? twoRootArray[i][1] : '')

        row.push(i < threeRootArray.length ? threeRootArray[i][0] : '')
        row.push(i < threeRootArray.length ? threeRootArray[i][1] : '')

        row.push(i < fourRootArray.length ? fourRootArray[i][0] : '')
        row.push(i < fourRootArray.length ? fourRootArray[i][1] : '')

        row.push(i < fiveRootArray.length ? fiveRootArray[i][0] : '')
        row.push(i < fiveRootArray.length ? fiveRootArray[i][1] : '')

        data.push(row)
    }

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(data)

    ws['!cols'] = [
        { wch: 30 },
        { wch: 20 },
        { wch: 10 },
        { wch: 25 },
        { wch: 10 },
        { wch: 30 },
        { wch: 10 },
        { wch: 35 },
        { wch: 10 },
        { wch: 40 },
        { wch: 10 }
    ]

    XLSX.utils.book_append_sheet(wb, ws, '词根分析结果')

    XLSX.writeFile(wb, '词根分析结果.xlsx')
}

function showLoading() {
    loadingContainer.classList.remove('hidden')
    resultContainer.classList.add('hidden')
}

function hideLoading() {
    loadingContainer.classList.add('hidden')
}

rootDetailModal.addEventListener('click', (e) => {
    if (e.target === rootDetailModal) {
        closeModal()
    }
})

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !rootDetailModal.classList.contains('hidden')) {
        closeModal()
    }
})

window.goHome = goHome
