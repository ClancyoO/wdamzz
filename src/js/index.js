import '../utils/anti-debug.js'

document.getElementById('new-tab-btn').addEventListener('click', function() {
    window.open(window.location.href, '_blank');
});

function navigateToTool(toolName) {
    const toolMap = {
        '广告分析': '广告分析.html',
        '网页翻译': '网页翻译.html',
        '词根拆解-词根溯源': '词根拆解.html',
        '重复检测': '重复检测.html',
        '标记关键词': '标记关键词.html',
        '标记ASIN': '标记ASIN.html',
        '写文案': '写文案.html',
        '合并表格': '合并表格.html',
        '单位换算': '单位换算.html',
        '投产核算': '投产核算.html',
        '批量打开关键词&ASIN': '批量打开.html',
        '图表生成': '图表生成.html',
        '任务清单': '任务清单.html',
        '文本格式': '文本格式.html',
    }
    if (toolMap[toolName]) {
        window.location.href = toolMap[toolName]
        return
    }
    const safeToolName = toolName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    window.location.href = `${safeToolName}.html`;
}

window.navigateToTool = navigateToTool

document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const tools = document.querySelectorAll('#tools-container .card');
    let hasResults = false;

    tools.forEach(tool => {
        const toolName = tool.getAttribute('data-tool').toLowerCase();
        const toolDescription = tool.querySelector('p').textContent.toLowerCase();

        if (toolName.includes(searchTerm) || toolDescription.includes(searchTerm)) {
            tool.style.display = 'block';
            hasResults = true;
        } else {
            tool.style.display = 'none';
        }
    });

    document.getElementById('no-results').style.display = hasResults ? 'none' : 'block';
});

document.querySelectorAll('.card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.05}s`;
});
