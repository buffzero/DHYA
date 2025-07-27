/**
 * 密探升级助手 - 资源追踪系统
 * 功能：追踪升级材料、历练进度和属性状态
 */
window.addEventListener('error', (e) => {
  console.error('全局错误:', e.message);
  alert(`脚本加载错误: ${e.message}\n请检查控制台详情`);
});

const ResourceTracker = (() => {
    // ==================== 配置常量 ====================
    const CONFIG = {
        containerId: '#resourceTracker',
        elements: {
            // 核心元素
            classStatus: '#classStatus',
            attributeStatus: '#attributeStatus',
            materialsList: '#materials-list',
            
            // 金钱和经验
            moneyCheck: '#money-check',
            fragments: '#bingshu_canjuan',
            scrolls: '#bingshu_quanjuan',
            expStatus: '#exp-status',
            
            // 历练
            yinYangTraining: '#yinYangTraining',
            windFireTraining: '#windFireTraining',
            earthWaterTraining: '#earthWaterTraining',
            
            // 系统控制
            lastUpdated: '#lastUpdated',
            resetButton: '#resetButton'
        },
        storageKey: 'DHY-Upgrade-Assistant_v1',
        requiredExp: 2386300 // 所需总经验值
    };

    // ==================== 游戏数据 ====================
    const GAME_DATA = {
        // 职业列表
        classes: ['诡道', '神纪', '岐黄', '龙盾', '破军'],
        
        // 属性列表
        attributes: ['阴', '阳', '风', '火', '地', '水'],
        
        // 所有材料数据
        materials: [
            // 80级突破材料
            { id: 'fujunhaitang', name: '【府君海棠】*30', class: '诡道', level: 'gold' },
            { id: 'panlonggu', name: '【蟠龙鼓】*30', class: '神纪', level: 'gold' },
            { id: 'yinwendao', name: '【银纹刀】*30', class: '岐黄', level: 'gold' },
            { id: 'yuguidun', name: '【玉龟盾】*30', class: '龙盾', level: 'gold' },
            { id: 'xijiaogong', name: '【犀角弓】*30', class: '破军', level: 'gold' },
            
            // 70级突破材料
            { id: 'menghunlan', name: '【梦魂兰】*30', class: '诡道', level: 'purple' },
            { id: 'zhentiangu', name: '【震天鼓】*30', class: '神纪', level: 'purple' },
            { id: 'qingtongdao', name: '【青铜刀】*30', class: '岐黄', level: 'purple' },
            { id: 'caiwendun', name: '【彩纹盾】*30', class: '龙盾', level: 'purple' },
            { id: 'tietaigong', name: '【铁胎弓】*30', class: '破军', level: 'purple' },
            
            // 通用升级材料
            { id: 'zuigucao', name: '【醉骨草】*30', class: '通用', level: 'purple' },
            { id: 'qingtingyan', name: '【蜻蜓眼】*120', class: '通用', level: 'blue' },
            { id: 'ziyunying', name: '【紫云英】*160', class: '通用', level: 'blue' },
            { id: 'yingqiongyao', name: '【瑛琼瑶】*105', class: '通用', level: 'blue' },
            { id: 'jincuodao', name: '【金错刀】*80', class: '通用', level: 'blue' },
            { id: 'diguanghe', name: '【低光荷】*100', class: '通用', level: 'blue' },
            { id: 'yuanyu', name: '【鸢羽】*40', class: '通用', level: 'blue' },
            { id: 'jianjia', name: '【蒹葭】*494', class: '通用', level: 'blue' },
        ],
        
        // 历练配置
        training: {
            windFire: [
                { name: '【历练·四】', required: 6, editable: true },
                { name: '【历练·六】', required: 12, editable: true },
                { name: '【历练·八】', required: 24, editable: true },
                { name: '【历练·十】', required: 35, editable: true },
                { name: '【历练·十二】', required: 47, editable: true }
            ],
            earthWater: [
                { name: '【历练·四】', required: 6, editable: true },
                { name: '【历练·六】', required: 12, editable: true },
                { name: '【历练·八】', required: 24, editable: true },
                { name: '【历练·十】', required: 35, editable: true },
                { name: '【历练·十二】', required: 47, editable: true }
            ],
            yinYang: [
                { name: '【历练·四】', required: 6, editable: true },
                { name: '【历练·六】', required: 12, editable: true },
                { name: '【历练·八】', required: 24, editable: true },
                { name: '【历练·十】', required: 35, editable: true },
                { name: '【历练·十二】', required: 47, editable: true }
            ]
        },
        trainingPresets: {
            13: { 
                4: 6,   // 历练四需要6次
                6: 12,  // 历练六需要12次
                8: 24,  // 历练八需要24次
                10: 16, // 历练十需要16次
                12: 1   // 历练十二需要1次
            },
            15: { 4: 6, 6: 12, 8: 24, 10: 35, 12: 12 },
            17: { 4: 6, 6: 12, 8: 24, 10: 35, 12: 47 }
        }
    };

    // 格式化日期显示
    const formatDate = (date) => {
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\//g, '-');
    };

    // 更新时间戳显示
    const updateLastUpdated = () => {
        if (state.lastUpdated && dom.lastUpdated) {
            const date = new Date(state.lastUpdated);
            dom.lastUpdated.textContent = `最近更新：${formatDate(date)}`;
        }
    };

    // ==================== 状态管理 ====================
    let state = {
        // 基础状态
        moneyChecked: false,
        fragments: 0,
        scrolls: 0,
        // 材料收集状态
        materials: {},
         trainingCompletions: { // 修改为更清晰的结构
            yinYang: {13: 0, 15: 0, 17: 0},
            windFire: {13: 0, 15: 0, 17: 0},
            earthWater: {13: 0, 15: 0, 17: 0}
        },
        // 历练进度
        training: {
            yinYang: GAME_DATA.training.yinYang.map(item => ({
                completed: 0,
                required: item.required,
                userModified: false,
                tier: 17 // 默认17修为
            })),
            windFire: GAME_DATA.training.windFire.map(item => ({
                completed: 0,
                required: item.required,
                userModified: false,
                tier: 17 // 默认17修为
            })),
            earthWater: GAME_DATA.training.earthWater.map(item => ({
                completed: 0,
                required: item.required,
                userModified: false,
                tier: 17 // 默认17修为
            }))
        },
        targetSelection: {
            classes: {
                guidao: false,
                shenji: false,
                qihuang: false,
                longdun: false,
                pojun: false
            },
            attributes: {
                yin: false,
                yang: false,
                feng: false,
                huo: false,
                di: false,
                shui: false
            }
        },
        trainingHistory: [], // 核销操作历史记录
        lastUpdated: null
    };
    const dom = {}; // 缓存DOM元素

    // ==================== 核心函数 ====================

    /**
     * 初始化应用
     * 1. 设置DOM引用
     * 2. 加载保存数据
     * 3. 渲染界面
     * 4. 绑定事件
     */
    const init = () => {
        console.log('🚀 密探资源系统启动...');
        try {
            setupDOM();
            loadData();
            renderAll();
            setupEventListeners();
            console.log('✅ 初始化完成');
        } catch (error) {
            console.error('初始化过程中出错:', error);
            alert('系统初始化失败，请刷新页面重试');
        }
    };

    // ==================== loadData 函数 ====================
    const loadData = () => {
    try {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (!saved) return;

        const parsed = JSON.parse(saved);
        
        // 新增数据迁移处理
        state.trainingCompletions = migrateOldData(parsed);
        
        // 以下是原有代码保持不变
        const materials = {};
        GAME_DATA.materials.forEach(material => {
            materials[material.id] = parsed.materials?.[material.id] || false;
        });

        state = {
            ...resetState(),
            ...parsed,
            materials,
            targetSelection: parsed.targetSelection || resetState().targetSelection,
            trainingHistory: parsed.trainingHistory || [],
            training: {
                yinYang: mergeTrainingData(parsed.training?.yinYang, 'yinYang'),
                windFire: mergeTrainingData(parsed.training?.windFire, 'windFire'),
                earthWater: mergeTrainingData(parsed.training?.earthWater, 'earthWater')
            }
        };
        
        updateLastUpdated();
    } catch (e) {
        console.error('数据加载失败:', e);
        state = resetState();
    }
};

    // 辅助函数：合并历练数据
    const mergeTrainingData = (savedData, category) => {
        return (savedData || []).map((item, i) => ({
            completed: item.completed || 0,
            required: item.required >= 0 ? item.required : GAME_DATA.training[category][i].required,
            userModified: item.userModified || false,
            tier: item.tier || 17
        }));
    };

    // 检查历练完成情况
   const checkTrainingCompletion = (category, tier) => {
        const floors = [4, 6, 8, 10, 12];
        let minCompletion = Infinity;
        
        floors.forEach((floor, index) => {
            const required = GAME_DATA.trainingPresets[tier][floor];
            const completed = state.training[category][index].completed;
            minCompletion = Math.min(minCompletion, Math.floor(completed / required));
        });
        
        return minCompletion === Infinity ? 0 : minCompletion;
    };

    // ==================== setupDOM 函数 ====================
    const setupDOM = () => {
        try {
            // 1. 检查主容器
            dom.container = document.querySelector(CONFIG.containerId);
            if (!dom.container) {
                throw new Error('主容器 #resourceTracker 未找到');
            }

            // 2. 检查关键必需元素
            const criticalElements = [
                'classStatus', 
                'attributeStatus',
                'materialsList',
                'moneyCheck',
                'fragments',
                'scrolls'
            ];
            
            criticalElements.forEach(key => {
                const selector = CONFIG.elements[key];
                dom[key] = document.querySelector(selector);
                if (!dom[key]) {
                    throw new Error(`关键元素 ${selector} 未找到`);
                }
            });

            // 3. 初始化其他元素
            Object.entries(CONFIG.elements).forEach(([key, selector]) => {
                if (!criticalElements.includes(key)) {
                    try {
                        dom[key] = document.querySelector(selector);
                        if (!dom[key] && key !== 'lastUpdated') {
                            console.warn(`⚠️ 非关键元素未找到: ${selector}`);
                        }
                    } catch (error) {
                        console.error(`初始化元素 ${selector} 失败:`, error);
                    }
                }
            });

        } catch (e) {
            console.error('DOM初始化失败:', e);
            document.body.innerHTML = `
                <div style="color:red;padding:20px;font-family:sans-serif">
                    <h2>系统初始化失败</h2>
                    <p>${e.message}</p>
                    <button onclick="location.reload()" style="padding:8px 16px;margin-top:10px;">
                        刷新页面
                    </button>
                </div>
            `;
            throw e;
        }
    };

    // ==================== 渲染函数 ====================

    // 渲染整个界面
    const renderAll = () => {
        const expStatus = calculateExpStatus();
        const baseConditionsMet = checkBaseConditions(expStatus);
        
        updateBasicUI(expStatus);
        renderTargetSelection();
        renderClassStatus(baseConditionsMet);
        renderAttributeStatus();
        renderMaterials();
        renderTraining();
    };

    // 更新基础UI元素
    const updateBasicUI = (expStatus) => {
        dom.expStatus.textContent = expStatus.text;
        dom.expStatus.className = expStatus.className;
        dom.moneyCheck.checked = state.moneyChecked;
        dom.fragments.value = state.fragments;
        dom.scrolls.value = state.scrolls;
    };

    // 目标密探元素
    const renderTargetSelection = () => {
        const targetSection = document.querySelector('.target-section');
        if (!targetSection) {
            console.error('目标密探区域未找到');
            return;
        }
        
        // 更新所有复选框状态
        const checkboxes = targetSection.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const type = checkbox.dataset.type;
            const value = checkbox.dataset.value;
            checkbox.checked = type === 'class' 
                ? state.targetSelection.classes[value] 
                : state.targetSelection.attributes[value];
        });
    };
    
    // 渲染职业状态
    const renderClassStatus = (baseConditionsMet) => {
        dom.classStatus.innerHTML = GAME_DATA.classes.map(className => {
            const isReady = checkClassReady(className, baseConditionsMet);
            const classKey = getClassKey(className);
            return `
                <div class="status-item ${classKey}">
                    <span>${className}</span>
                    <span class="status-indicator ${isReady ? 'ready' : 'pending'}">
                        ${isReady ? '可满级' : '待沉淀'}
                    </span>
                </div>
            `;
        }).join('');
    };
    
    // 渲染属性状态
    const renderAttributeStatus = () => {
        // 预计算各历练类型的完成状态
        const isYinYangReady = checkTrainingComplete('yinYang');
        const isWindFireReady = checkTrainingComplete('windFire');
        const isEarthWaterReady = checkTrainingComplete('earthWater');
    
        dom.attributeStatus.innerHTML = GAME_DATA.attributes.map(attr => {
            // 确定每个属性对应的历练类型和完成状态
            let isReady;
            let attrClass;
            
            switch(attr) {
                case '阴':
                case '阳':
                    isReady = isYinYangReady;
                    attrClass = attr === '阴' ? 'yin' : 'yang';
                    break;
                case '风':
                case '火':
                    isReady = isWindFireReady;
                    attrClass = attr === '风' ? 'feng' : 'huo';
                    break;
                case '地':
                case '水':
                    isReady = isEarthWaterReady;
                    attrClass = attr === '地' ? 'di' : 'shui';
                    break;
                default:
                    isReady = false;
                    attrClass = '';
            }
    
            return `
                <div class="status-item ${attrClass}">
                    <span>${attr}</span>
                    <span class="status-indicator ${isReady ? 'ready' : 'pending'}">
                        ${isReady ? '可满级' : '待沉淀'}
                    </span>
                </div>
            `;
        }).join('');
    };
   
    // 渲染材料列表
    const renderMaterials = () => {
        dom.materialsList.innerHTML = GAME_DATA.materials.map(material => {
            const checked = state.materials[material.id] ? 'checked' : '';
            return `
                <div class="resource-item ${material.level || 'blue'}">
                    <div class="resource-name">${material.name}</div>
                    <div class="checkbox-container">
                        <input type="checkbox" id="${material.id}-check" ${checked}>
                        <label for="${material.id}-check" class="material-checkbox"></label>
                    </div>
                </div>
            `;
        }).join('');
    };

    // 渲染所有历练类别
    const renderTraining = () => {
        renderTrainingCategory('yinYang', dom.yinYangTraining);
        renderTrainingCategory('windFire', dom.windFireTraining);
        renderTrainingCategory('earthWater', dom.earthWaterTraining);
    };

    // 渲染单个历练类别
   const renderTrainingCategory = (category, container) => {
    const floors = [4, 6, 8, 10, 12];
    const categoryName = getCategoryName(category);
    
    // 生成修为徽章（显示已完成+可完成次数）
    const completionBadges = [13, 15, 17].map(tier => {
        const completed = state.trainingCompletions[category][tier] || 0;
        const available = checkTrainingCompletion(category, tier) - completed;
        
        if (completed > 0 || available > 0) {
            return `
                <span class="completion-badge tier-${tier} 
                      ${available > 0 ? 'available' : ''}"
                      title="${categoryName}·修为${tier}：
                      已完成 ${completed}次
                      ${available > 0 ? `可领取 +${available}次` : ''}">
                    ${tier}: ${completed}${available > 0 ? `(+${available})` : ''}
                </span>
            `;
        }
        return '';
    }).filter(Boolean).join('');

        container.innerHTML = `
            <div class="training-category-title">
                <span class="category-name">${categoryName}</span>
                <div class="completion-badges">${completionBadges}</div>
                <div class="training-controls">
                    <select class="tier-select" data-category="${category}">
                        ${[13, 15, 17].map(tier => `
                            <option value="${tier}" 
                                ${state.training[category][0].tier === tier ? 'selected' : ''}>
                                修为${tier}
                            </option>
                        `).join('')}
                    </select>
                    <button class="reset-category-btn" data-category="${category}">一键撤销</button>
                </div>
            </div>
            ${GAME_DATA.training[category].map((item, index) => {
                const trainingItem = state.training[category][index] || { completed: 0 };
                const floor = floors[index];
                
                const required = trainingItem.userModified ?
                    trainingItem.required :
                    GAME_DATA.trainingPresets[trainingItem.tier][floor];
                    
                const completed = trainingItem.completed || 0;
                const isMet = completed >= required;
                const remaining = required - completed;
                
                return `
                    <div class="training-item">
                        <div class="training-header">
                            <div class="training-name">${item.name}</div>
                            <div class="training-input-status">
                                <input type="text"
                                    inputmode="numeric"
                                    class="training-count-input" 
                                    data-category="${category}" 
                                    data-index="${index}"
                                    value="${required}">
                                <div class="sub-status-indicator ${isMet ? 'met' : 'not-met'}">
                                    ${isMet ? '已满足' : `${completed}/${required}`}
                                </div>
                            </div>
                        </div>
                        ${required > 0 ? renderCircles(required, completed) : ''}
                        <div class="training-actions">
                            <button class="consume-btn" 
                                data-category="${category}" 
                                data-index="${index}" 
                                data-count="1"
                                ${isMet ? 'disabled' : ''}>
                                核销一次
                            </button>
                            <button class="consume-btn" 
                                data-category="${category}" 
                                data-index="${index}" 
                                data-count="3"
                                ${isMet || remaining < 3 ? 'disabled' : ''}>
                                核销三次
                            </button>
                            <button class="consume-btn" 
                                data-category="${category}" 
                                data-index="${index}" 
                                data-count="6"
                                ${isMet || remaining < 6 ? 'disabled' : ''}>
                                核销六次
                            </button>
                            <button class="consume-btn custom-consume" 
                                data-category="${category}" 
                                data-index="${index}">
                                核销指定次数
                            </button>
                            <input type="number" min="1" max="${remaining}" 
                                class="custom-consume-input" 
                                data-category="${category}" 
                                data-index="${index}"
                                placeholder="次数">
                            <button class="undo-btn" 
                                data-category="${category}" 
                                data-index="${index}"
                                ${completed <= 0 ? 'disabled' : ''}>
                                撤销
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    };

    // 渲染圆圈进度
    const renderCircles = (required, completed) => {
        if (required <= 0) return '';
        
        let circlesHTML = '';
        for (let i = 0; i < required; i++) {
            circlesHTML += `<div class="circle ${i < completed ? 'filled' : ''}"></div>`;
        }
        return `
            <div class="circles-container">
                ${circlesHTML}
            </div>
        `;
    };

    // ==================== 状态计算 ====================

    // 计算经验值状态
    const calculateExpStatus = () => {
        const currentExp = state.fragments * 100 + state.scrolls * 1000;
        const isMet = currentExp >= CONFIG.requiredExp;
        return {
            isMet,
            text: isMet ? '已满足' : '未满足',
            className: `sub-status-indicator ${isMet ? 'met' : 'not-met'}`
        };
    };
    

    // 检查通用升级材料是否满足
    const checkBaseConditions = (expStatus) => {
        const generalMaterials = GAME_DATA.materials.filter(m => m.class === '通用');
        const allGeneralMet = generalMaterials.every(m => state.materials[m.id]);
        return state.moneyChecked && expStatus.isMet && allGeneralMet;
    };

    // 检查职业升级材料是否满足
    const checkClassReady = (className, baseConditionsMet) => {
        const classMaterials = GAME_DATA.materials.filter(m => m.class === className);
        return baseConditionsMet && classMaterials.every(m => state.materials[m.id]);
    };

    // 检查历练是否全部完成
    const checkTrainingComplete = (category) => {
        return state.training[category].every((item, i) => 
            item.completed >= (item.userModified ? item.required : GAME_DATA.training[category][i].required)
        );
    };

    // ==================== 操作处理 ====================

    // 处理核销操作
    const handleConsume = (category, index, count) => {
    const trainingItem = state.training[category][index] || { completed: 0 };
    const required = trainingItem.userModified 
        ? trainingItem.required 
        : GAME_DATA.trainingPresets[trainingItem.tier][[4,6,8,10,12][index]];
    
    // 计算剩余次数
    const remaining = Math.max(0, required - (trainingItem.completed || 0));
    
    if (isNaN(count) || count <= 0) {
        alert('核销次数必须大于0');
        return;
    }
    
    if (count > remaining) {
        alert(`核销次数不能超过剩余次数（${remaining}）`);
        return;
    }
    
    const actualCount = Math.min(count, remaining);
    if (actualCount <= 0) return;
    
    // 更新状态前先保存旧的完成状态
    const oldCompletions = {};
    [13, 15, 17].forEach(tier => {
        oldCompletions[tier] = checkTrainingCompletion(category, tier);
    });

    // 记录操作历史
    state.trainingHistory.push({
        category,
        index,
        previousCount: trainingItem.completed,
        count: actualCount,
        timestamp: new Date().toISOString()
    });
    // 更新状态
    trainingItem.completed += actualCount;

    // 检查是否有新的修为完成
     [13, 15, 17].forEach(tier => {
        const totalAvailable = checkTrainingCompletion(category, tier);
        const alreadyCompleted = state.trainingCompletions[category][tier] || 0;
        
        if (totalAvailable > alreadyCompleted) {
            state.trainingCompletions[category][tier] = totalAvailable;
        }
    });

    updateAndSave();
};
    
    // 处理撤销操作
    const handleUndo = (category, index) => {
        const trainingItem = state.training[category][index];
        if (!trainingItem || trainingItem.completed <= 0) return;
        
        // 找到最近一次操作
        const lastActionIndex = [...state.trainingHistory]
            .reverse()
            .findIndex(a => a.category === category && a.index === index);
        
        if (lastActionIndex !== -1) {
            const actualIndex = state.trainingHistory.length - 1 - lastActionIndex;
            const lastAction = state.trainingHistory[actualIndex];
            
            trainingItem.completed = lastAction.previousCount;
            state.trainingHistory.splice(actualIndex, 1);
            updateAndSave();
        }
    };

    // 处理修为切换
    const handleTierChange = (category, tier) => {
        const floors = [4, 6, 8, 10, 12];
        
        state.training[category] = state.training[category].map((item, index) => {
            const floor = floors[index];
            const newRequired = GAME_DATA.trainingPresets[tier][floor];
            
            return {
                ...item,
                required: newRequired,
                tier: tier,
                userModified: false
            };
        });

        // 强制重新渲染历练部分
        renderTraining();
        saveData();
    };

    // 一键撤销分类
    const handleResetCategory = (category) => {
        if (!category || !state.training || !state.training[category]) {
            console.error('无效的历练类别:', category);
            return;
        }

        if (confirm(`确定要重置【${getCategoryName(category)}】的所有进度吗？`)) {
            if (Array.isArray(state.training[category])) {
                state.training[category].forEach(item => {
                    item.completed = 0;
                });
                
                // 清除相关历史记录
                state.trainingHistory = state.trainingHistory.filter(
                    record => record.category !== category
                );
                
                updateAndSave();
            }
        }
    };

    // 获取分类名称
    const getCategoryName = (category) => {
        const names = {
            yinYang: '阴阳历练',
            windFire: '风火历练', 
            earthWater: '地水历练'
        };
        return names[category] || category;
    };

    // ==================== 事件处理 ====================
    const setupEventListeners = () => {
        // 1. 通用change事件监听
        document.addEventListener('change', (e) => {
            // 修为切换监听
            if (e.target.classList.contains('tier-select')) {
                const category = e.target.dataset.category;
                const tier = parseInt(e.target.value);
                handleTierChange(category, tier);
                return;
            }

            // 目标密探选择监听
            if (e.target.matches('.target-section input[type="checkbox"]')) {
                const checkbox = e.target;
                const type = checkbox.dataset.type;
                const value = checkbox.dataset.value;
                
                if (type === 'class') {
                    state.targetSelection.classes[value] = checkbox.checked;
                } else if (type === 'attribute') {
                    state.targetSelection.attributes[value] = checkbox.checked;
                }
                updateAndSave();
                return;
            }

            // 材料勾选监听
            if (e.target.matches('#materials-list input[type="checkbox"]')) {
                const materialId = e.target.id.replace('-check', '');
                state.materials[materialId] = e.target.checked;
                updateAndSave();
            }
        });

        // 2. 输入框监听
        const handleInputChange = (e) => {
            // 兵书数量输入
            if (e.target === dom.fragments || e.target === dom.scrolls) {
                state[e.target.id === 'bingshu_canjuan' ? 'fragments' : 'scrolls'] = 
                    parseInt(e.target.value) || 0;
                updateAndSave();
                return;
            }

            // 历练次数输入
            if (e.target.classList.contains('training-count-input')) {
                const input = e.target;
                const category = input.dataset.category;
                const index = parseInt(input.dataset.index);
                
                input.value = input.value.replace(/[^0-9]/g, '');
                const newValue = parseInt(input.value) || 0;
                
                state.training[category][index].required = newValue;
                state.training[category][index].userModified = true;
                
                clearTimeout(input.saveTimeout);
                input.saveTimeout = setTimeout(() => updateAndSave(), 500);
            }
        };
        document.addEventListener('input', handleInputChange);

        // 3. 按钮点击监听
        document.addEventListener('click', (e) => {
            // 核销按钮
            if (e.target.classList.contains('consume-btn')) {
                const btn = e.target;
                let count;
                
                if (btn.classList.contains('custom-consume')) {
                    const input = btn.nextElementSibling;
                    if (!input?.classList.contains('custom-consume-input')) return;
                    count = parseInt(input.value) || 0;
                } else {
                    count = parseInt(btn.dataset.count) || 1;
                }
                
                if (count > 0) {
                    handleConsume(
                        btn.dataset.category,
                        parseInt(btn.dataset.index),
                        count
                    );
                }
                e.stopPropagation();
                return;
            }

            // 撤销按钮
            if (e.target.classList.contains('undo-btn')) {
                const btn = e.target;
                handleUndo(btn.dataset.category, parseInt(btn.dataset.index));
                e.stopPropagation();
                return;
            }

            // 一键撤销分类
            if (e.target.classList.contains('reset-category-btn')) {
                handleResetCategory(e.target.dataset.category);
                return;
            }
        });

        // 4. 独立监听的元素
        dom.moneyCheck.addEventListener('change', () => {
            state.moneyChecked = dom.moneyCheck.checked;
            updateAndSave();
        });

        dom.resetButton.addEventListener('click', () => {
            if (confirm('确定要清空所有记录吗？')) {
                state = resetState();
                updateAndSave();
            }
        });

        // 5. 键盘快捷键支持
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            if (e.key === '1') {
                document.querySelector('.consume-btn[data-count="1"]')?.click();
            } else if (e.key === '3') {
                document.querySelector('.consume-btn[data-count="3"]')?.click();
            } else if (e.key === '6') {
                document.querySelector('.consume-btn[data-count="6"]')?.click();
            }
        });
    };

    // ==================== 工具函数 ====================
    /**
 * 兼容旧版数据迁移
 * 说明：旧版本没有trainingCompletions字段，需要初始化
 */
const migrateOldData = (savedData) => {
    // 如果是从旧版升级（没有trainingCompletions字段）
    if (!savedData.trainingCompletions) {
        console.log('检测到旧版数据，初始化修为完成记录...');
        return {
            yinYang: {13: 0, 15: 0, 17: 0},
            windFire: {13: 0, 15: 0, 17: 0},
            earthWater: {13: 0, 15: 0, 17: 0}
        };
    }
    // 如果是新版数据，直接返回原有值
    return savedData.trainingCompletions;
};
    // 更新并保存数据
    const updateAndSave = () => {
        state.lastUpdated = new Date().toISOString();
        saveData();
        renderAll();
    };

    // 保存数据到本地存储
    const saveData = () => {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    };

    // 重置初始化状态
    const resetState = () => {
        // 初始化材料状态
        const materials = {};
        GAME_DATA.materials.forEach(material => {
            materials[material.id] = false;
        });
        
        // 初始化历练状态
        const initTraining = (category) => 
            GAME_DATA.training[category].map(item => ({
                completed: 0,
                required: item.required,
                userModified: false,
                tier: 17
            }));

        return {
            moneyChecked: false,
            fragments: 0,
            scrolls: 0,
            materials,
            trainingCompletions: {
                yinYang: {13: 0, 15: 0, 17: 0},
                windFire: {13: 0, 15: 0, 17: 0},
                earthWater: {13: 0, 15: 0, 17: 0}
            },
            training: {
                yinYang: initTraining('yinYang'),
                windFire: initTraining('windFire'),
                earthWater: initTraining('earthWater')
            },
            targetSelection: {
                classes: {
                    guidao: false,
                    shenji: false,
                    qihuang: false,
                    longdun: false,
                    pojun: false
                },
                attributes: {
                    yin: false,
                    yang: false,
                    feng: false,
                    huo: false,
                    di: false,
                    shui: false
                }
            },
            trainingHistory: [],
            lastUpdated: new Date().toISOString()
        };
    };

    // 初始化职业状态
    const getClassKey = (className) => {
        const map = {
            '诡道': 'guidao',
            '神纪': 'shenji',
            '岐黄': 'qihuang',
            '龙盾': 'longdun',
            '破军': 'pojun'
        };
        return map[className] || '';
    };

    // ==================== 公共接口 ====================
    return { init };
})();

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    if (!('localStorage' in window)) {
        alert('您的浏览器不支持本地存储功能，部分功能将无法使用');
        return;
    }
    try {
        ResourceTracker.init();
    } catch (error) {
        console.error('初始化失败:', error);
        alert('系统初始化失败，请刷新页面重试');
    }
});
