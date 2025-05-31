// workspace.js - 工作区大管家
import { State, getNextNodeId } from './state.js';
import { DOM } from './domElements.js';
import { getNodeById, showStatus } from './utils.js'; 
// 注意：这里我们假设 renderNode, applyLayout, drawLines, applyBackground, 
// applyTextVisibility, applyCanvasTransform 这些函数后续会放到其他模块或main.js里
// 为了让这个模块能独立，我会把它们暂时定义为空函数或从外部传入

// 临时的占位函数，后续这些会从各自的模块导入或在main.js中定义
let renderNode = (node) => console.log('renderNode called for', node.id);
let applyLayout = (layout) => console.log('applyLayout called for', layout);
let drawLines = () => console.log('drawLines called');
let applyBackground = () => console.log('applyBackground called');
let applyTextVisibility = () => console.log('applyTextVisibility called');
let applyCanvasTransform = () => console.log('applyCanvasTransform called');

// 提供一个方法来设置这些依赖函数
export function setWorkspaceDependencies(dependencies) {
    renderNode = dependencies.renderNode || renderNode;
    applyLayout = dependencies.applyLayout || applyLayout;
    drawLines = dependencies.drawLines || drawLines;
    applyBackground = dependencies.applyBackground || applyBackground;
    applyTextVisibility = dependencies.applyTextVisibility || applyTextVisibility;
    applyCanvasTransform = dependencies.applyCanvasTransform || applyCanvasTransform;
}


export function initWorkspaceSystem() {
    const savedWorkspaces = localStorage.getItem('quantum_workspaces');
    if (savedWorkspaces) {
        try {
            State.workspaces = JSON.parse(savedWorkspaces);
        } catch (e) {
            State.workspaces = {};
            console.error("Failed to parse workspaces from localStorage", e);
        }
    }
    
    if (!State.workspaces.default) {
        State.workspaces.default = {
            id: 'default',
            name: '默认工作区',
            data: {
                nodes: [],
                nodeIdCounter: 0,
                panZoom: { scale: 1, offsetX: 0, offsetY: 0 },
                currentLayout: 'free',
                currentBackground: State.currentBackground || `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1772&q=80')`,
                textVisible: true
            },
            createdAt: Date.now(),
            lastModified: Date.now()
        };
    }
}

export function saveWorkspaces() {
    localStorage.setItem('quantum_workspaces', JSON.stringify(State.workspaces));
}

export function saveCurrentWorkspaceData() { // 改名以区分，这个只保存当前工作区的数据到State.workspaces
    const workspace = State.workspaces[State.currentWorkspaceId];
    if (workspace) {
        workspace.data = {
            nodes: State.nodes,
            nodeIdCounter: State.nodeIdCounter,
            panZoom: State.panZoom,
            currentLayout: State.currentLayout,
            currentBackground: State.currentBackground,
            textVisible: State.textVisible !== false // 确保是布尔值
        };
        workspace.lastModified = Date.now();
        saveWorkspaces(); // 保存所有工作区到localStorage
    }
}

export function loadWorkspace(workspaceId) {
    if (State.currentWorkspaceId && State.workspaces[State.currentWorkspaceId]) {
         saveCurrentWorkspaceData(); // 保存当前工作区数据
    }
    
    const workspaceToLoad = State.workspaces[workspaceId];
    if (!workspaceToLoad) {
        showStatus(`错误：找不到工作区 ${workspaceId}`);
        return;
    }
    
    State.currentWorkspaceId = workspaceId;
    const data = workspaceToLoad.data;
    
    if (DOM.canvas) DOM.canvas.innerHTML = '';
    if (DOM.linesSvg) DOM.linesSvg.innerHTML = '';
    
    State.nodes = data.nodes || [];
    State.nodeIdCounter = data.nodeIdCounter || 0;
    State.currentLayout = data.currentLayout || 'free';
    State.currentBackground = data.currentBackground || `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1772&q=80')`;
    State.textVisible = data.textVisible !== false; // 确保是布尔值
    
    // 合并 panZoom, 保留 isPanning, lastPanX, lastPanY 的当前状态（如果存在）
    const currentPanZoomDynamicState = { 
        isPanning: State.panZoom.isPanning, 
        lastPanX: State.panZoom.lastPanX, 
        lastPanY: State.panZoom.lastPanY 
    };
    State.panZoom = { ...{ scale: 1, offsetX: 0, offsetY: 0 }, ...data.panZoom, ...currentPanZoomDynamicState };

    applyBackground();
    applyTextVisibility();
    applyCanvasTransform();
    
    document.querySelectorAll('.layout-option').forEach(item => {
        if (item.dataset) { // 确保 item.dataset 存在
             item.classList.toggle('active', item.dataset.layout === State.currentLayout);
        }
    });
    
    State.nodes.forEach(node => renderNode(node)); // 使用之前注入的renderNode
    if (State.currentLayout !== 'free') {
        applyLayout(State.currentLayout); // 使用之前注入的applyLayout
    }
    drawLines(); // 使用之前注入的drawLines
    
    showStatus(`已切换到工作区：${workspaceToLoad.name}`);
    updateWorkspaceList(); // 更新列表以高亮当前工作区
}

export function createNewWorkspace(name) {
    const id = 'workspace_' + Date.now();
    const newName = name || '新工作区 ' + (Object.keys(State.workspaces).length + 1);
    State.workspaces[id] = {
        id: id,
        name: newName,
        data: {
            nodes: [],
            nodeIdCounter: 0,
            panZoom: { scale: 1, offsetX: 0, offsetY: 0 },
            currentLayout: 'free',
            currentBackground: State.currentBackground || `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1772&q=80')`,
            textVisible: true
        },
        createdAt: Date.now(),
        lastModified: Date.now()
    };
    saveWorkspaces();
    loadWorkspace(id); // 创建后直接加载
    // updateWorkspaceList() 会在 loadWorkspace 中被调用
}

export function deleteWorkspace(workspaceId) {
    if (workspaceId === 'default') {
        showStatus('默认工作区无法删除');
        return;
    }
    
    if (confirm(`确定要删除工作区 "${State.workspaces[workspaceId]?.name || workspaceId}" 吗？此操作无法撤销。`)) {
        delete State.workspaces[workspaceId];
        saveWorkspaces();
        
        if (State.currentWorkspaceId === workspaceId) {
            loadWorkspace('default'); // 如果删的是当前，就加载默认的
        }
        updateWorkspaceList();
        showStatus('工作区已删除');
    }
}

export function renameWorkspace(workspaceId, newNameFromPrompt) {
    const workspace = State.workspaces[workspaceId];
    const newName = newNameFromPrompt?.trim(); // ?. 防止 newNameFromPrompt 是 null
    if (workspace && newName) {
        workspace.name = newName;
        workspace.lastModified = Date.now();
        saveWorkspaces();
        updateWorkspaceList();
        showStatus('工作区已重命名');
    } else if (newNameFromPrompt !== null) { // 用户没取消prompt，但输入了空
        showStatus('名称不能为空');
    }
}

export function updateWorkspaceList() {
    if (!DOM.workspaceList) return; // 防御
    DOM.workspaceList.innerHTML = '';
    
    Object.values(State.workspaces)
        .sort((a,b) => (b.lastModified || 0) - (a.lastModified || 0)) // 按最后修改时间排序
        .forEach(workspace => {
            const item = document.createElement('div');
            item.className = 'workspace-item';
            item.classList.toggle('active', workspace.id === State.currentWorkspaceId);
            
            const nameEl = document.createElement('div');
            nameEl.className = 'workspace-name';
            nameEl.textContent = workspace.name;
            
            const actions = document.createElement('div');
            actions.className = 'workspace-actions';
            
            const loadBtn = document.createElement('button');
            loadBtn.className = 'workspace-btn';
            loadBtn.textContent = '加载';
            loadBtn.onclick = () => {
                loadWorkspace(workspace.id);
                if (DOM.workspacePanel) DOM.workspacePanel.style.display = 'none';
            };
            
            const renameBtn = document.createElement('button');
            renameBtn.className = 'workspace-btn';
            renameBtn.textContent = '重命名';
            renameBtn.onclick = () => {
                const newNamePrompt = prompt('输入新名称：', workspace.name);
                // 用户可能点取消，这时 newNamePrompt 是 null
                if (newNamePrompt !== null) {
                     renameWorkspace(workspace.id, newNamePrompt);
                }
            };
            
            actions.appendChild(loadBtn);
            actions.appendChild(renameBtn);
            
            if (workspace.id !== 'default') {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'workspace-btn';
                deleteBtn.textContent = '删除';
                deleteBtn.onclick = () => deleteWorkspace(workspace.id);
                actions.appendChild(deleteBtn);
            }
            
            item.appendChild(nameEl);
            item.appendChild(actions);
            DOM.workspaceList.appendChild(item);
        });
}