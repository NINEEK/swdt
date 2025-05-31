// utils.js - 万能工具箱
import { State } from './state.js'; // 我们需要用到State来找节点
import { DOM } from './domElements.js'; // 我们需要用到DOM来显示状态

// 根据ID找到节点数据
export function getNodeById(id) { 
    return State.nodes.find(n => n.id === id); 
}

// 根据ID找到页面上的节点元素
export function getNodeElementById(id) { 
    return DOM.canvas.querySelector(`.node[data-id="${id}"]`); 
}

// 计算节点的层级
export function calculateNodeLevel(parentId) {
    if (!parentId) return 0;
    const parent = getNodeById(parentId); // 使用我们这里定义的getNodeById
    return parent ? parent.level + 1 : 0;
}

// 显示状态提示的工具
export function showStatus(message, duration = 2000) {
    if (DOM.statusIndicator) { // 确保statusIndicator元素存在
        DOM.statusIndicator.textContent = message;
        DOM.statusIndicator.style.display = 'block';
        
        setTimeout(() => {
            DOM.statusIndicator.style.display = 'none';
        }, duration);
    } else {
        console.log("Status:", message); // 如果找不到元素，就在控制台打印
    }
}