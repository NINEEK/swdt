// main.js - 总管家
import { State, getNextNodeId } from './state.js';
import { DOM } from './domElements.js';
import { getNodeById, getNodeElementById, calculateNodeLevel, showStatus } from './utils.js';
import { 
    initWorkspaceSystem, 
    saveCurrentWorkspaceData, // 注意这里改成了 saveCurrentWorkspaceData
    loadWorkspace, 
    createNewWorkspace, 
    deleteWorkspace, 
    renameWorkspace, 
    updateWorkspaceList,
    setWorkspaceDependencies // 导入设置依赖的函数
} from './workspace.js';

// --- 把你原来 index.html 里 <script> 标签中，除了已经移到 state.js, domElements.js, utils.js, workspace.js 之外的【所有剩余代码】都复制粘贴到这里 ---
// --- 从这里开始粘贴 ---

// 比如，LAYOUT_CONFIG 应该在这里，或者后续移到 layout.js
const LAYOUT_CONFIG = {
    tree: { nodeSpacingX: 220, nodeSpacingY: 90, startX: 120 },
    org: { nodeSpacingX: 160, nodeSpacingY: 130, startY: 120 },
    fishbone: { mainSpacing: 320, branchSpacingY: 110, branchSpacingX: 170 }
};

// 文本显隐控制系统
function toggleTextVisibility() {
    State.textVisible = !State.textVisible;
    applyTextVisibility();
    DOM.toggleTextVisibility.classList.toggle('toggle-active', !State.textVisible);
    DOM.quickToggleText.classList.toggle('active', !State.textVisible);
    saveCurrentWorkspaceData(); // 使用新的保存函数
    showStatus(State.textVisible ? '文本已显示' : '文本已隐藏');
}

function applyTextVisibility() {
    document.body.classList.toggle('text-hidden', !State.textVisible);
}

// 核心节点操作 - 部分 (getNextNodeId, getNodeById, getNodeElementById, calculateNodeLevel 已移至 utils.js 或 state.js)
function saveData() { // 这个函数现在就是 saveCurrentWorkspaceData 的别名
    saveCurrentWorkspaceData();
}

function applyCanvasTransform() {
    const transform = `translate(${State.panZoom.offsetX}px,${State.panZoom.offsetY}px) scale(${State.panZoom.scale})`;
    DOM.canvas.style.transform = transform;
    DOM.linesSvg.style.transform = transform;
    DOM.linesSvg.style.transformOrigin = '0 0';
}

function renderNode(node) { // 这个函数很重要，后续会移到 renderer.js
    const nodeEl = document.createElement('div');
    nodeEl.className = 'node';
    if (node.level === 0) nodeEl.classList.add('root-node');
    nodeEl.dataset.id = node.id;
    nodeEl.style.left = `${node.x}px`;
    nodeEl.style.top = `${node.y}px`;
    
    const textEl = document.createElement('span');
    textEl.className = 'node-text';
    textEl.textContent = node.text || '';
    nodeEl.appendChild(textEl);
    
    DOM.canvas.appendChild(nodeEl);

    nodeEl.addEventListener('mousedown', e => handleNodeMouseDown(e, node.id));
    nodeEl.addEventListener('dblclick', () => startNodeEdit(node.id));
    nodeEl.addEventListener('contextmenu', e => showNodeContextMenu(e, node.id));
}

function selectNode(nodeId) {
    // ... (selectNode 的代码) ...
    if (State.selectedNodeId && State.selectedNodeId !== nodeId) {
        getNodeElementById(State.selectedNodeId)?.classList.remove('selected');
    }
    
    if (nodeId) {
        getNodeElementById(nodeId)?.classList.add('selected');
        State.selectedNodeId = nodeId;
    } else {
        if (State.selectedNodeId) {
            getNodeElementById(State.selectedNodeId)?.classList.remove('selected');
        }
        State.selectedNodeId = null;
    }
}

function createNode(parentId, text, x, y) {
    // ... (createNode 的代码) ...
    const id = getNextNodeId(); // 从 state.js 导入
    const level = calculateNodeLevel(parentId); // 从 utils.js 导入
    const nodeSize = level === 0 ? 40 : 26;
    let canvasX = x, canvasY = y;

    if (x === undefined || y === undefined) {
        if (State.currentLayout === 'free' || !parentId) {
            const centerX = (DOM.container.offsetWidth / 2 - State.panZoom.offsetX) / State.panZoom.scale;
            const centerY = (DOM.container.offsetHeight / 2 - State.panZoom.offsetY) / State.panZoom.scale;
            canvasX = parentId ? getNodeById(parentId).x + 120 : centerX - nodeSize / 2; // getNodeById 从 utils.js 导入
            canvasY = parentId ? getNodeById(parentId).y + 70 : centerY - nodeSize / 2;
        } else {
            canvasX = 0;
            canvasY = 0;
        }
    }
    
    const node = { id, parentId, text: text || "", x: canvasX, y: canvasY, level };
    State.nodes.push(node);
    renderNode(node); // 本地函数
    
    if (State.currentLayout !== 'free') {
        applyLayout(State.currentLayout); // 本地函数
    }
    
    drawLines(); // 本地函数
    selectNode(id); // 本地函数
    if (!text) startNodeEdit(id); // 本地函数
    saveData(); // 本地函数 (实际调用 saveCurrentWorkspaceData)
    return node;
}

function startNodeEdit(nodeId) {
    // ... (startNodeEdit 的代码) ...
    if (State.activeInput) State.activeInput.blur();
    
    const node = getNodeById(nodeId);
    const nodeEl = getNodeElementById(nodeId);
    if (!node || !nodeEl) return;
    
    selectNode(nodeId);
    
    const textEl = nodeEl.querySelector('.node-text');
    if (textEl) {
        textEl.style.display = 'none';
        if (!State.textVisible) {
            textEl.classList.add('editing-temp-show');
        }
    }
    
    const inputEl = document.createElement('textarea');
    inputEl.className = 'node-input';
    inputEl.value = node.text;
    inputEl.rows = 1;
    State.activeInput = inputEl;
    
    const nodeX = parseFloat(nodeEl.style.left);
    const nodeY = parseFloat(nodeEl.style.top);
    const nodeW = nodeEl.offsetWidth;
    
    inputEl.style.width = `${Math.max(180, nodeW + 140)}px`;
    inputEl.style.left = `${nodeX + nodeW / 2 - 90}px`;
    inputEl.style.top = `${nodeY - 60}px`;

    DOM.canvas.appendChild(inputEl);
    inputEl.focus(); 
    inputEl.select();

    function adjustHeight() {
        inputEl.style.height = 'auto';
        inputEl.style.height = inputEl.scrollHeight + 'px';
    }
    
    inputEl.addEventListener('input', adjustHeight);
    adjustHeight();

    function finishEdit() {
        if (!inputEl.parentNode) return; // 防止重复触发
        node.text = inputEl.value.trim();
        if (textEl) {
            textEl.style.display = '';
            textEl.textContent = node.text;
            textEl.classList.remove('editing-temp-show');
        }
        inputEl.remove(); // 使用 remove() 更简洁
        State.activeInput = null;
        saveData();
    }
    inputEl.addEventListener('blur', finishEdit);
    inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            finishEdit(); 
        } else if (e.key === 'Escape') { 
            inputEl.value = node.text; // 恢复原文本
            finishEdit(); 
        }
    });
}

// === 布局算法系统 ===
function applyLayout(layoutType) {
    // ... (applyLayout 的代码) ...
    State.currentLayout = layoutType;
    
    document.querySelectorAll('.layout-option').forEach(item => {
        item.classList.toggle('active', item.dataset.layout === layoutType);
    });
    
    if (layoutType === 'free') {
        saveData();
        return;
    }
    
    const rootNodes = State.nodes.filter(n => n.level === 0);
    if (rootNodes.length === 0) return;
    
    switch (layoutType) {
        case 'tree':
            applyTreeLayout(rootNodes[0]);
            break;
        case 'org':
            applyOrgLayout(rootNodes[0]);
            break;
        case 'fishbone':
            applyFishboneLayout(rootNodes[0]);
            break;
    }
    
    drawLines();
    saveData();
}

function applyTreeLayout(rootNode) { /* ...代码... */ 
    const visited = new Set();
    const config = LAYOUT_CONFIG.tree;
    
    function layoutSubtree(node, x, y) {
        if (visited.has(node.id)) return { width: 0, height: 0 };
        visited.add(node.id);
        
        node.x = x;
        node.y = y;
        
        const children = State.nodes.filter(n => n.parentId === node.id);
        let totalHeight = 0;
        
        children.forEach((child, index) => {
            const childY = y + totalHeight;
            const subtree = layoutSubtree(child, x + config.nodeSpacingX, childY);
            totalHeight += subtree.height + (index < children.length - 1 ? config.nodeSpacingY : 0);
        });
        
        const nodeEl = getNodeElementById(node.id);
        if (nodeEl) {
            nodeEl.style.left = `${node.x}px`;
            nodeEl.style.top = `${node.y}px`;
        }
        
        return { 
            width: config.nodeSpacingX, 
            height: Math.max(totalHeight || config.nodeSpacingY, nodeEl ? nodeEl.offsetHeight : 40) 
        };
    }
    
    const centerY = (DOM.container.offsetHeight / 2 - State.panZoom.offsetY) / State.panZoom.scale;
    layoutSubtree(rootNode, config.startX, centerY - 20);
}
function applyOrgLayout(rootNode) { /* ...代码... */ 
    const visited = new Set();
    const config = LAYOUT_CONFIG.org;
    const levels = [];
    
    function collectLevels(node, level) {
        if (visited.has(node.id)) return;
        visited.add(node.id);
        
        if (!levels[level]) levels[level] = [];
        levels[level].push(node);
        
        const children = State.nodes.filter(n => n.parentId === node.id);
        children.forEach(child => collectLevels(child, level + 1));
    }
    
    collectLevels(rootNode, 0);
    
    const centerX = (DOM.container.offsetWidth / 2 - State.panZoom.offsetX) / State.panZoom.scale;
    
    levels.forEach((levelNodes, level) => {
        const totalWidth = levelNodes.length * config.nodeSpacingX;
        const startX = centerX - totalWidth / 2;
        
        levelNodes.forEach((node, index) => {
            node.x = startX + index * config.nodeSpacingX;
            node.y = config.startY + level * config.nodeSpacingY;
            
            const nodeEl = getNodeElementById(node.id);
            if (nodeEl) {
                nodeEl.style.left = `${node.x}px`;
                nodeEl.style.top = `${node.y}px`;
            }
        });
    });
}
function applyFishboneLayout(rootNode) { /* ...代码... */ 
    const config = LAYOUT_CONFIG.fishbone;
    const centerX = (DOM.container.offsetWidth / 2 - State.panZoom.offsetX) / State.panZoom.scale;
    const centerY = (DOM.container.offsetHeight / 2 - State.panZoom.offsetY) / State.panZoom.scale;
    
    rootNode.x = centerX;
    rootNode.y = centerY;
    
    const rootEl = getNodeElementById(rootNode.id);
    if (rootEl) {
        rootEl.style.left = `${rootNode.x}px`;
        rootEl.style.top = `${rootNode.y}px`;
    }
    
    const mainBranches = State.nodes.filter(n => n.parentId === rootNode.id);
    const halfCount = Math.ceil(mainBranches.length / 2);
    
    mainBranches.forEach((branch, index) => {
        const isTop = index < halfCount;
        const posIndex = isTop ? index : index - halfCount;
        
        branch.x = centerX - config.mainSpacing + posIndex * 140;
        branch.y = centerY + (isTop ? -config.branchSpacingY : config.branchSpacingY);
        
        const branchEl = getNodeElementById(branch.id);
        if (branchEl) {
            branchEl.style.left = `${branch.x}px`;
            branchEl.style.top = `${branch.y}px`;
        }
        
        layoutFishboneSubBranches(branch, isTop);
    });
}
function layoutFishboneSubBranches(parentNode, isTop) { /* ...代码... */ 
    const config = LAYOUT_CONFIG.fishbone;
    const children = State.nodes.filter(n => n.parentId === parentNode.id);
    
    children.forEach((child, index) => {
        child.x = parentNode.x + config.branchSpacingX;
        child.y = parentNode.y + (isTop ? -35 : 35) * (index + 1);
        
        const childEl = getNodeElementById(child.id);
        if (childEl) {
            childEl.style.left = `${child.x}px`;
            childEl.style.top = `${child.y}px`;
        }
        
        layoutFishboneSubBranches(child, isTop);
    });
}

// === 连线渲染系统 ===
function drawLines() {
    // ... (drawLines 的代码) ...
    DOM.linesSvg.innerHTML = '';
    
    State.nodes.forEach(node => {
        if (!node.parentId) return;
        const parent = getNodeById(node.parentId);
        if (!parent) return;
        const parentEl = getNodeElementById(parent.id);
        const childEl = getNodeElementById(node.id);
        if (!parentEl || !childEl) return;
        
        const px = parent.x + parentEl.offsetWidth / 2;
        const py = parent.y + parentEl.offsetHeight / 2;
        const cx = node.x + childEl.offsetWidth / 2;
        const cy = node.y + childEl.offsetHeight / 2;
        
        if (State.currentLayout === 'tree' || State.currentLayout === 'org') {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const midX = (px + cx) / 2;
            const d = `M ${px} ${py} Q ${midX} ${py} ${midX} ${(py + cy) / 2} T ${cx} ${cy}`;
            path.setAttribute('d', d);
            path.setAttribute('class', 'connection-path');
            DOM.linesSvg.appendChild(path);
        } else {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', px); 
            line.setAttribute('y1', py);
            line.setAttribute('x2', cx); 
            line.setAttribute('y2', cy);
            line.setAttribute('class', 'connection-line');
            DOM.linesSvg.appendChild(line);
        }
    });
}

// === 拖拽系统 ===
function handleNodeMouseDown(e, nodeId) { /* ...代码... */ 
    if (e.button !== 0) return;
    e.stopPropagation();
    if (State.activeInput) State.activeInput.blur();
    
    const nodeEl = getNodeElementById(nodeId);
    const node = getNodeById(nodeId);
    if (!nodeEl || !node) return;
    
    selectNode(nodeId);
    State.draggingNode = nodeEl;
    const containerRect = DOM.container.getBoundingClientRect();
    const startX = (e.clientX - containerRect.left - State.panZoom.offsetX) / State.panZoom.scale;
    const startY = (e.clientY - containerRect.top - State.panZoom.offsetY) / State.panZoom.scale;
    State.dragOffset.x = startX - node.x;
    State.dragOffset.y = startY - node.y;
    
    document.addEventListener('mousemove', handleNodeMouseMove);
    document.addEventListener('mouseup', handleNodeMouseUp);
    nodeEl.style.cursor = 'grabbing'; 
    nodeEl.style.zIndex = 25;
}
function handleNodeMouseMove(e) { /* ...代码... */ 
    if (!State.draggingNode) return;
    const nodeId = State.draggingNode.dataset.id;
    const node = getNodeById(nodeId);
    const containerRect = DOM.container.getBoundingClientRect();
    const mouseX = (e.clientX - containerRect.left - State.panZoom.offsetX) / State.panZoom.scale;
    const mouseY = (e.clientY - containerRect.top - State.panZoom.offsetY) / State.panZoom.scale;
    
    const margin = 20; // 边距限制
    const nodeWidth = State.draggingNode.offsetWidth;
    const nodeHeight = State.draggingNode.offsetHeight;

    // 确保 node.x 和 node.y 始终在画布的有效区域内
    const minX = margin;
    const minY = margin;
    const maxX = (containerRect.width / State.panZoom.scale) - nodeWidth - margin;
    const maxY = (containerRect.height / State.panZoom.scale) - nodeHeight - margin;


    node.x = Math.max(minX, Math.min(mouseX - State.dragOffset.x, maxX));
    node.y = Math.max(minY, Math.min(mouseY - State.dragOffset.y, maxY));
    
    State.draggingNode.style.left = `${node.x}px`;
    State.draggingNode.style.top = `${node.y}px`;
    drawLines();
}
function handleNodeMouseUp() { /* ...代码... */ 
    if (!State.draggingNode) return;
    State.draggingNode.style.cursor = 'pointer';
    State.draggingNode.style.zIndex = 10; // 恢复默认 z-index
    State.draggingNode = null;
    document.removeEventListener('mousemove', handleNodeMouseMove);
    document.removeEventListener('mouseup', handleNodeMouseUp);
    saveData();
}

// === 画布平移与缩放 === (这部分事件监听器直接放在main.js里)

// === 智能聚焦系统 ===
function focusOnNode(nodeId) { /* ...代码... */ 
    const node = getNodeById(nodeId);
    const nodeEl = getNodeElementById(nodeId);
    if (!node || !nodeEl) return;
    
    const containerRect = DOM.container.getBoundingClientRect();
    const targetScale = 1.5; // 可配置的聚焦缩放比例
    
    State.panZoom.scale = targetScale;
    // 计算使节点中心对齐画布中心的偏移量
    State.panZoom.offsetX = containerRect.width / 2 - (node.x + nodeEl.offsetWidth / 2) * targetScale;
    State.panZoom.offsetY = containerRect.height / 2 - (node.y + nodeEl.offsetHeight / 2) * targetScale;
    
    applyCanvasTransform();
    drawLines(); // 重绘连线
    selectNode(nodeId); // 选中聚焦的节点
    saveData();
    showStatus('已聚焦到节点');
}
function focusOnRootNode() { /* ...代码... */ 
    const rootNode = State.nodes.find(n => n.level === 0);
    if (rootNode) {
        focusOnNode(rootNode.id);
    } else {
        showStatus('未找到根节点');
    }
}

// === 右键菜单系统 ===
let contextMenuNodeId = null; // 放在 main.js 的作用域
function showNodeContextMenu(e, nodeId) { /* ...代码... */ 
    e.preventDefault();
    if (State.activeInput) State.activeInput.blur();
    selectNode(nodeId);
    contextMenuNodeId = nodeId;
    DOM.contextMenu.style.display = 'block';
    
    const menuWidth = DOM.contextMenu.offsetWidth;
    const menuHeight = DOM.contextMenu.offsetHeight;
    let x = e.clientX, y = e.clientY;
    
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 5;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 5;
    
    DOM.contextMenu.style.left = `${x}px`;
    DOM.contextMenu.style.top = `${y}px`;
}
function hideContextMenu() { /* ...代码... */ 
    DOM.contextMenu.style.display = 'none';
    contextMenuNodeId = null;
}

// === 节点删除系统 ===
function deleteNodeRecursive(nodeId) { /* ...代码... */ 
    const children = State.nodes.filter(n => n.parentId === nodeId);
    children.forEach(child => deleteNodeRecursive(child.id));
    
    const nodeEl = getNodeElementById(nodeId);
    if (nodeEl) nodeEl.remove();
    
    State.nodes = State.nodes.filter(n => n.id !== nodeId);
    
    if (State.selectedNodeId === nodeId) selectNode(null);
}
function handleDeleteNode(nodeId) { /* ...代码... */ 
    if (!nodeId || !getNodeById(nodeId)) return;
    
    if (confirm('确定要删除此节点及其所有子节点吗？')) {
        deleteNodeRecursive(nodeId);
        drawLines();
        saveData();
        showStatus('节点已删除');
    }
}

// === 菜单系统 ===
function toggleMenu() { /* ...代码... */ 
    State.isMenuOpen = !State.isMenuOpen;
    DOM.menuOptions.style.display = State.isMenuOpen ? 'block' : 'none';
}
function hideMenus() { /* ...代码... */ 
    if (State.isMenuOpen) {
        DOM.menuOptions.style.display = 'none';
        State.isMenuOpen = false;
    }
    // 同时关闭可能打开的子面板
    if (DOM.bgPresetPanel) DOM.bgPresetPanel.style.display = 'none';
    if (DOM.colorPickerPanel) DOM.colorPickerPanel.style.display = 'none';
    if (DOM.workspacePanel) DOM.workspacePanel.style.display = 'none'; // 关闭工作区面板
}

// === 背景系统 ===
function applyBackground() { /* ...代码... */ 
    if (State.currentBackground.startsWith('#')) { // 纯色背景
        document.body.style.background = State.currentBackground;
    } else { // 图片背景
        document.body.style.background = `${State.currentBackground} center/cover no-repeat`;
        // 保留一个基础的深色背景色，以防图片加载失败或透明图片
        document.body.style.backgroundColor = '#0f142b'; 
    }
}

// === 导入导出系统 === (showStatus 已移至 utils.js)
function exportWorkspaceData() { /* ...代码... */ 
    saveCurrentWorkspaceData(); // 确保导出的是最新数据
    const workspace = State.workspaces[State.currentWorkspaceId];
    if (!workspace) {
        showStatus('当前工作区数据不存在，无法导出');
        return;
    }
    if (!workspace.data || State.nodes.length === 0) {
         showStatus('没有数据可以导出');
         return;
    }
    
    const exportData = {
        workspaceName: workspace.name,
        exportDate: new Date().toISOString(),
        data: workspace.data // 直接使用 workspace.data
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `思维导图_${workspace.name}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('导出成功');
}
function importWorkspaceData(fileInput) { /* ...代码... */ 
    const file = fileInput.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported && imported.data && imported.data.nodes !== undefined) { // 检查核心数据结构
                const workspaceName = imported.workspaceName || '导入的工作区 ' + (Object.keys(State.workspaces).length);
                
                // 创建一个新工作区来存放导入的数据
                const newWorkspaceId = 'workspace_' + Date.now();
                State.workspaces[newWorkspaceId] = {
                    id: newWorkspaceId,
                    name: workspaceName,
                    data: imported.data, // 直接使用导入的data
                    createdAt: imported.createdAt || Date.now(),
                    lastModified: Date.now()
                };
                saveWorkspaces(); // 保存所有工作区
                loadWorkspace(newWorkspaceId); // 加载这个新导入的工作区
                
                showStatus('导入成功: ' + workspaceName);
            } else {
                showStatus('文件格式不正确或缺少必要数据');
            }
        } catch (err) {
            showStatus('导入失败：' + err.message);
            console.error("Import error:", err);
        }
    };
    reader.readAsText(file);
}

// === 事件绑定 === (这部分直接放在 main.js 里，因为它们是把所有东西串起来的胶水)

// === 初始化系统 ===
function init() {
    // 设置 workspace.js 依赖的函数
    setWorkspaceDependencies({
        renderNode,
        applyLayout,
        drawLines,
        applyBackground,
        applyTextVisibility,
        applyCanvasTransform
    });

    initWorkspaceSystem(); // 从 workspace.js 导入
    
    const lastWorkspaceId = localStorage.getItem('quantum_last_workspace') || 'default';
    if (State.workspaces[lastWorkspaceId]) {
        loadWorkspace(lastWorkspaceId); // 从 workspace.js 导入
    } else {
        loadWorkspace('default'); // 从 workspace.js 导入
    }
    
    if (State.nodes.length === 0 && State.currentWorkspaceId === 'default') { // 只在默认工作区为空时创建
        createNode(null, "核心主题", DOM.container.offsetWidth / 2 - 20, DOM.container.offsetHeight / 2 - 20);
    }
    
    window.addEventListener('beforeunload', () => {
        saveCurrentWorkspaceData(); // 使用新的保存函数
        localStorage.setItem('quantum_last_workspace', State.currentWorkspaceId);
    });
    
    showStatus('量子思维导图已就绪');
}

// --- 你原来代码的粘贴区域到这里结束 ---

// --- 下面是原来直接在 <script> 标签底部的事件监听和启动代码 ---
document.addEventListener('DOMContentLoaded', () => {
    // 画布平移与缩放的事件监听
    DOM.container.addEventListener('mousedown', e => {
        if (e.target !== DOM.container && e.target !== DOM.canvas && e.target !== DOM.linesSvg) return;
        if (e.button !== 0 && e.button !== 1) return; // 允许中键拖动
        if (State.activeInput) State.activeInput.blur();
        
        State.panZoom.isPanning = true;
        State.panZoom.lastPanX = e.clientX;
        State.panZoom.lastPanY = e.clientY;
        DOM.container.classList.add('grabbing');
        selectNode(null); 
        hideContextMenu(); 
        hideMenus();
    });
    
    document.addEventListener('mousemove', e => {
        if (!State.panZoom.isPanning) return;
        const dx = e.clientX - State.panZoom.lastPanX;
        const dy = e.clientY - State.panZoom.lastPanY;
        State.panZoom.offsetX += dx;
        State.panZoom.offsetY += dy;
        State.panZoom.lastPanX = e.clientX; 
        State.panZoom.lastPanY = e.clientY;
        applyCanvasTransform();
    });
    
    document.addEventListener('mouseup', () => {
        if (State.panZoom.isPanning) {
            State.panZoom.isPanning = false;
            DOM.container.classList.remove('grabbing');
            saveData();
        }
    });
    
    DOM.container.addEventListener('wheel', e => {
        e.preventDefault();
        if (State.activeInput) State.activeInput.blur();
        
        const scaleAmount = 1.1;
        const containerRect = DOM.container.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left; // 鼠标相对于容器的位置
        const mouseY = e.clientY - containerRect.top;
        
        const prevScale = State.panZoom.scale;
        
        if (e.deltaY < 0) { // 向上滚动放大
            State.panZoom.scale = Math.min(State.panZoom.scale * scaleAmount, 5); // 最大放大5倍
        } else { // 向下滚动缩小
            State.panZoom.scale = Math.max(State.panZoom.scale / scaleAmount, 0.1); // 最小缩小到0.1倍
        }
        
        // 计算新的offsetX和offsetY，使缩放中心为鼠标指针位置
        const scaleDiff = State.panZoom.scale / prevScale;
        State.panZoom.offsetX = mouseX - (mouseX - State.panZoom.offsetX) * scaleDiff;
        State.panZoom.offsetY = mouseY - (mouseY - State.panZoom.offsetY) * scaleDiff;
        
        applyCanvasTransform(); 
        drawLines(); 
        saveData();
    });

    // 主菜单事件
    DOM.menuToggle.addEventListener('click', e => {
        e.stopPropagation();
        if (State.activeInput) State.activeInput.blur();
        toggleMenu();
    });
    
    // 快速工具栏事件
    DOM.quickAddChild.addEventListener('click', () => {
        if (State.selectedNodeId) {
            const parent = getNodeById(State.selectedNodeId);
            if (parent) {
                createNode(State.selectedNodeId, "", parent.x + 150, parent.y + 80);
            }
        } else {
            showStatus('请先选择一个节点');
        }
        hideMenus(); // 添加子节点后关闭菜单（如果打开的话）
    });
    DOM.quickToggleText.addEventListener('click', () => {
        toggleTextVisibility();
        // hideMenus(); // 这个操作通常不需要关闭主菜单
    });
    DOM.quickFocusRoot.addEventListener('click', () => {
        focusOnRootNode();
        hideMenus();
    });
    DOM.quickExport.addEventListener('click', () => {
        exportWorkspaceData();
        hideMenus();
    });
    
    // 菜单项事件
    DOM.addRootNode.addEventListener('click', () => {
        if (State.activeInput) State.activeInput.blur();
        const rootExists = State.nodes.some(n => n.level === 0);
        if (rootExists && State.nodes.length > 0) { // 只有在画布非空且已有根节点时提示
            showStatus('已存在根节点');
            return;
        }
        const x = (DOM.container.offsetWidth / 2 - State.panZoom.offsetX) / State.panZoom.scale - 20; // 居中
        const y = (DOM.container.offsetHeight / 2 - State.panZoom.offsetY) / State.panZoom.scale - 20;
        createNode(null, "核心主题", x, y);
        hideMenus();
    });
    DOM.toggleTextVisibility.addEventListener('click', () => {
        toggleTextVisibility();
        hideMenus();
    });
    DOM.workspaceManager.addEventListener('click', () => {
        updateWorkspaceList();
        DOM.workspacePanel.style.display = 'block';
        hideMenus();
    });
    DOM.clearMap.addEventListener('click', () => {
        if (State.activeInput) State.activeInput.blur();
        if (State.nodes.length === 0) {
            showStatus('画布已经是空的');
            hideMenus(); // 即使是空的也关闭菜单
            return;
        }
        if (confirm('确定要清空当前工作区的所有节点吗？')) {
            DOM.canvas.innerHTML = ''; 
            DOM.linesSvg.innerHTML = '';
            State.nodes = []; 
            State.nodeIdCounter = 0; 
            State.selectedNodeId = null;
            // 重置布局和视图，但保留背景等设置
            State.currentLayout = 'free'; 
            State.panZoom = { scale: 1, offsetX: 0, offsetY: 0, isPanning: false, lastPanX: 0, lastPanY: 0 };
            applyCanvasTransform(); 
            saveData();
            showStatus('画布已清空');
        }
        hideMenus();
    });
    DOM.exportJSON.addEventListener('click', () => {
        exportWorkspaceData();
        hideMenus();
    });
    DOM.importJSON.addEventListener('click', () => {
        if (State.activeInput) State.activeInput.blur();
        const fileInput = document.createElement('input');
        fileInput.type = 'file'; 
        fileInput.accept = '.json,application/json';
        fileInput.onchange = () => importWorkspaceData(fileInput);
        fileInput.click();
        hideMenus();
    });
    DOM.exportImage.addEventListener('click', () => {
        if (State.activeInput) State.activeInput.blur();
        showStatus('图片导出功能开发中，请使用浏览器截图');
        hideMenus();
    });

    // 工作区管理面板事件
    DOM.createWorkspace.addEventListener('click', () => {
        const name = DOM.newWorkspaceName.value.trim();
        if (name) {
            createNewWorkspace(name);
            DOM.newWorkspaceName.value = '';
            // createNewWorkspace 会调用 loadWorkspace, loadWorkspace 会更新列表并关闭面板（如果需要）
            // DOM.workspacePanel.style.display = 'none'; // 这句可以由loadWorkspace里的逻辑间接触发
        } else {
            showStatus('请输入工作区名称');
        }
    });
    DOM.closeWorkspacePanel.addEventListener('click', () => {
        DOM.workspacePanel.style.display = 'none';
    });
    DOM.newWorkspaceName.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            DOM.createWorkspace.click();
        }
    });

    // 布局切换事件
    document.querySelectorAll('.layout-option').forEach(item => {
        item.addEventListener('click', () => {
            const layout = item.dataset.layout;
            if (layout !== State.currentLayout) {
                applyLayout(layout);
            }
            hideMenus();
        });
    });

    // 背景设置事件
    DOM.bgPresets.addEventListener('click', e => {
        e.stopPropagation(); // 防止触发全局点击关闭菜单
        DOM.bgPresetPanel.style.display = DOM.bgPresetPanel.style.display === 'block' ? 'none' : 'block';
        DOM.colorPickerPanel.style.display = 'none'; // 关闭另一个子面板
    });
    DOM.bgColor.addEventListener('click', e => {
        e.stopPropagation();
        DOM.colorPickerPanel.style.display = DOM.colorPickerPanel.style.display === 'block' ? 'none' : 'block';
        DOM.bgPresetPanel.style.display = 'none';
    });
    document.querySelectorAll('.bg-preset-item').forEach(item => {
        item.addEventListener('click', () => {
            const bg = item.dataset.bg;
            State.currentBackground = bg;
            applyBackground();
            document.querySelectorAll('.bg-preset-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            saveData();
            DOM.bgPresetPanel.style.display = 'none';
            showStatus('背景已更换');
        });
    });
    DOM.applyColorBg.addEventListener('click', () => {
        const color = DOM.bgColorPicker.value;
        State.currentBackground = color;
        applyBackground();
        saveData();
        DOM.colorPickerPanel.style.display = 'none';
        showStatus('背景颜色已应用');
    });

    // 右键菜单事件
    DOM.ctxAddChild.addEventListener('click', () => {
        if (State.activeInput) State.activeInput.blur();
        if (contextMenuNodeId) { // 使用 contextMenuNodeId 更可靠
            const parent = getNodeById(contextMenuNodeId);
            if (parent) {
                createNode(contextMenuNodeId, "", parent.x + 100, parent.y + 60);
            }
        }
        hideContextMenu();
    });
    DOM.ctxEditNode.addEventListener('click', () => {
        if (contextMenuNodeId) startNodeEdit(contextMenuNodeId);
        hideContextMenu();
    });
    DOM.ctxDeleteNode.addEventListener('click', () => {
        if (State.activeInput) State.activeInput.blur();
        if (contextMenuNodeId) handleDeleteNode(contextMenuNodeId);
        hideContextMenu();
    });
    DOM.ctxFocusNode.addEventListener('click', () => {
        if (contextMenuNodeId) focusOnNode(contextMenuNodeId);
        hideContextMenu();
    });

    // 全局点击事件 (用于关闭菜单等)
    document.addEventListener('click', event => {
        // 关闭右键菜单
        if (DOM.contextMenu.style.display === 'block' && !DOM.contextMenu.contains(event.target) && !event.target.closest('.node')) {
            hideContextMenu();
        }
        
        // 关闭主菜单和子面板 (如果点击的不是它们自身或触发它们的元素)
        const isClickInsideMenuSystem = DOM.menuToggle.contains(event.target) ||
                                      DOM.menuOptions.contains(event.target) ||
                                      DOM.bgPresetPanel.contains(event.target) ||
                                      DOM.colorPickerPanel.contains(event.target) ||
                                      DOM.workspacePanel.contains(event.target);

        if (State.isMenuOpen && !isClickInsideMenuSystem) {
             if (!event.target.closest('.menu-item') && // 防止点击菜单项关闭菜单
                 !event.target.closest('.bg-preset-item') &&
                 !event.target.closest('#bgColorPicker') &&
                 !event.target.closest('#applyColorBg') &&
                 !event.target.closest('.workspace-btn') &&
                 !event.target.closest('.panel-btn') &&
                 !event.target.closest('.workspace-new-input')) {
                hideMenus();
             }
        } else if (!State.isMenuOpen) { // 如果主菜单已关闭，但子面板可能还开着
            if (DOM.bgPresetPanel.style.display === 'block' && !DOM.bgPresetPanel.contains(event.target) && event.target !== DOM.bgPresets) {
                DOM.bgPresetPanel.style.display = 'none';
            }
            if (DOM.colorPickerPanel.style.display === 'block' && !DOM.colorPickerPanel.contains(event.target) && event.target !== DOM.bgColor) {
                DOM.colorPickerPanel.style.display = 'none';
            }
             if (DOM.workspacePanel.style.display === 'block' && !DOM.workspacePanel.contains(event.target) && event.target !== DOM.workspaceManager) {
                // DOM.workspacePanel.style.display = 'none'; // 这个面板通常由关闭按钮控制
            }
        }
    }, true); // 使用捕获阶段，确保先于其他点击事件

    // 键盘快捷键
    document.addEventListener('keydown', e => {
        if (State.activeInput) return; // 如果正在编辑文字，不触发快捷键

        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault(); saveData(); showStatus('已保存');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault(); exportWorkspaceData();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault(); toggleTextVisibility();
        }
        if (e.key === 'Delete' && State.selectedNodeId) {
            handleDeleteNode(State.selectedNodeId);
        }
        if (e.key === 'Tab' && State.selectedNodeId) {
            e.preventDefault();
            const parent = getNodeById(State.selectedNodeId);
            if (parent) createNode(State.selectedNodeId, "", parent.x + 150, parent.y + 80);
        }
        // 可以添加更多快捷键，比如方向键移动选中节点等
    });
    
    // 启动！
    init(); 
});