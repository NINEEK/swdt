// domElements.js - 找东西的小助手

export const DOM = {
    // 主控制
    menuToggle: document.getElementById('celestial-menu-toggle'),
    menuOptions: document.getElementById('celestial-menu-options'),
    
    // 快速工具栏
    quickToolbar: document.getElementById('quick-toolbar'),
    quickAddChild: document.getElementById('quick-add-child'),
    quickToggleText: document.getElementById('quick-toggle-text'),
    quickFocusRoot: document.getElementById('quick-focus-root'),
    quickExport: document.getElementById('quick-export'),
    
    // 菜单项
    addRootNode: document.getElementById('addRootNode'),
    toggleTextVisibility: document.getElementById('toggleTextVisibility'),
    workspaceManager: document.getElementById('workspaceManager'),
    clearMap: document.getElementById('clearMap'),
    importJSON: document.getElementById('importJSON'),
    exportJSON: document.getElementById('exportJSON'),
    exportImage: document.getElementById('exportImage'),
    
    // 工作区管理
    workspacePanel: document.getElementById('workspace-panel'),
    workspaceList: document.getElementById('workspaceList'),
    newWorkspaceName: document.getElementById('newWorkspaceName'),
    createWorkspace: document.getElementById('createWorkspace'),
    closeWorkspacePanel: document.getElementById('closeWorkspacePanel'),
    
    // 画布
    container: document.getElementById('mind-map-container'),
    canvas: document.getElementById('mind-map-canvas'),
    linesSvg: document.getElementById('lines-svg'),
    
    // 右键菜单
    contextMenu: document.getElementById('node-context-menu'),
    ctxAddChild: document.getElementById('ctx-add-child'),
    ctxEditNode: document.getElementById('ctx-edit-node'),
    ctxDeleteNode: document.getElementById('ctx-delete-node'),
    ctxFocusNode: document.getElementById('ctx-focus-node'),
    
    // 背景设置
    bgPresets: document.getElementById('bgPresets'),
    bgColor: document.getElementById('bgColor'),
    bgPresetPanel: document.getElementById('bg-preset-panel'),
    colorPickerPanel: document.getElementById('color-picker-panel'),
    applyColorBg: document.getElementById('applyColorBg'),
    bgColorPicker: document.getElementById('bgColorPicker'),
    
    // 其他
    statusIndicator: document.getElementById('status-indicator')
};