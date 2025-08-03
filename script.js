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
            cultivationAttribute: '#cultivation-attribute',
            cultivationTier: '#cultivation-tier',
            calculateCultivation: '#calculate-cultivation',
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
                { name: '【历练·四】'},
                { name: '【历练·六】'},
                { name: '【历练·八】'},
                { name: '【历练·十】'},
                { name: '【历练·十二】'}
            ],
            earthWater: [
                { name: '【历练·四】'},
                { name: '【历练·六】'},
                { name: '【历练·八】'},
                { name: '【历练·十】'},
                { name: '【历练·十二】'}
            ],
            yinYang: [
                { name: '【历练·四】'},
                { name: '【历练·六】'},
                { name: '【历练·八】'},
                { name: '【历练·十】'},
                { name: '【历练·十二】'}
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
        15: { 
            4: 6, 
            6: 12, 
            8: 24, 
            10: 35, 
            12: 12 
        },
        17: { 
            4: 6, 
            6: 12, 
            8: 24, 
            10: 35, 
            12: 47 
        }
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
 
      // 统一的需求计算函数
const getActualRequired = (trainingItem, floor) => {
    // 1. 优先使用计算值
    if (trainingItem.calculatedCount !== null && 
        trainingItem.calculatedCount !== undefined) {
        return trainingItem.calculatedCount;
    }
    
    // 2. 使用用户修改值
    if (trainingItem.userModified) {
        return trainingItem.required;
    }
    
    // 3. 使用预设值
    return GAME_DATA.trainingPresets[trainingItem.tier || 17][floor];
};

    // 新增职业键名映射函数
    const getClassKey = (className) => {
        const map = {
            '诡道': 'guidao',
            '神纪': 'shenji', 
            '岐黄': 'qihuang',
            '龙盾': 'longdun',
            '破军': 'pojun'
        };
        return map[className] || className.toLowerCase();
    };
 
    const updateBasicUI = (expStatus) => {
    // 确保DOM元素已初始化
    if (!dom.expStatus || !dom.moneyCheck || !dom.fragments || !dom.scrolls) {
        console.error('updateBasicUI: 缺少必要的DOM元素');
        return;
    }

    // 更新经验显示
    dom.expStatus.textContent = expStatus.text;
    dom.expStatus.className = expStatus.className;

    // 更新复选框和输入框
    dom.moneyCheck.checked = state.moneyChecked;
    dom.fragments.value = state.fragments || 0; // 避免undefined
    dom.scrolls.value = state.scrolls || 0;

    // 更新时间戳（可选）
    if (dom.lastUpdated && state.lastUpdated) {
        try {
            const date = new Date(state.lastUpdated);
            dom.lastUpdated.textContent = `最近更新：${formatDate(date)}`;
        } catch (e) {
            console.error('日期格式化失败:', e);
        }
    }
};
    // 更新时间戳显示
    const updateLastUpdated = () => {
        if (state.lastUpdated && dom.lastUpdated) {
            const date = new Date(state.lastUpdated);
            dom.lastUpdated.textContent = `最近更新：${formatDate(date)}`;
        }
    };
    // 辅助函数：安全合并材料数据
const safelyMergeMaterials = (savedMaterials, defaultMaterials) => {
    const merged = { ...defaultMaterials };
    if (!savedMaterials || typeof savedMaterials !== 'object') {
        return merged;
    }

    GAME_DATA.materials.forEach(material => {
        if (material.id in savedMaterials) {
            // 确保转换为布尔值
            merged[material.id] = !!savedMaterials[material.id];
        }
    });
    return merged;
};
    // 辅助函数：合并历练数据
    const mergeTrainingData = (savedData, defaultData) => {
    if (!savedData) return defaultData;
    
    return savedData.map((item, index) => {
        const defaultItem = defaultData[index] || {};
        
        // 确保 completed 不会大于 required
        let completed = item.completed || 0;
        let required = item.required || defaultItem.required;
        
        if (completed > required) {
            completed = required;
        }
        
        return {
            completed: completed,
            required: required,
            userModified: item.userModified || false,
            tier: item.tier || defaultItem.tier || 17,
            // 关键修复：正确加载 calculatedCount
            calculatedCount: item.calculatedCount !== undefined ? item.calculatedCount : null
        };
    });
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
    yinYang: [4, 6, 8, 10, 12].map(floor => ({
      completed: 0,
      required: GAME_DATA.trainingPresets[17][floor],
      userModified: false,
      tier: 17,
      calculatedCount: 0
    })),
    windFire: [4, 6, 8, 10, 12].map(floor => ({
      completed: 0,
      required: GAME_DATA.trainingPresets[17][floor],
      userModified: false,
      tier: 17,
      calculatedCount: 0
    })),
    earthWater: [4, 6, 8, 10, 12].map(floor => ({
      completed: 0,
      required: GAME_DATA.trainingPresets[17][floor],
      userModified: false,
      tier: 17,
      calculatedCount: 0
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
        // 1. 初始化DOM引用
        setupDOM();
        
        // 2. 加载保存的数据
        loadData();
        
        // 3. 渲染所有界面
        renderAll();
        
        // 4. 绑定全局事件
        setupEventListeners();
        
        // 5. 新增：绑定修为材料计算事件
        setupCultivationListeners();
        
        console.log('✅ 初始化成功');
    } catch (error) {
        console.error('初始化失败:', error);
        alert(`系统初始化失败: ${error.message}\n请检查控制台`);
    }
};
 // 新增函数：绑定修为材料事件
const setupCultivationListeners = () => {
    try {
        // 确保DOM元素已加载
        if (!dom.cultivationAttribute || !dom.cultivationTier || !dom.calculateCultivation) {
            console.error('修为材料相关DOM元素未找到');
            return;
        }

        // 初始显示风火材料
        updateMaterialInputsVisibility();

        // 事件监听
        dom.cultivationAttribute.addEventListener('change', updateMaterialInputsVisibility);
        
        // 关键修复：确保绑定计算按钮事件
        dom.calculateCultivation.addEventListener('click', calculateAndApply);
    } catch (error) {
        console.error('初始化修为材料监听失败:', error);
    }
};
    // ==================== loadData 函数 ====================
   function loadData() {
    try {
        // 1. 尝试从本地存储读取数据
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (!saved) {
            console.log('无存档数据，使用默认状态');
            state = resetState();
            return;
        }

        // 2. 安全解析数据
        let parsed = {};
        try {
            parsed = JSON.parse(saved);
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('存档数据格式无效');
            }
        } catch (parseError) {
            console.error('解析存档数据失败:', parseError);
            // 重建本地存储
            localStorage.removeItem(CONFIG.storageKey); 
            state = resetState();
            return;
        }

        // 3. 获取基础重置状态
        const baseState = resetState();

        // 4. 安全合并数据（关键修复：确保所有状态正确恢复）
        state = {
            // 基础重置状态
            ...baseState,
            
            // 允许覆盖的字段 - 修复金钱和经验状态
            moneyChecked: parsed.moneyChecked !== undefined ? parsed.moneyChecked : baseState.moneyChecked,
            fragments: parsed.fragments !== undefined ? parsed.fragments : baseState.fragments,
            scrolls: parsed.scrolls !== undefined ? parsed.scrolls : baseState.scrolls,
            
            // 材料状态
            materials: safelyMergeMaterials(parsed.materials, baseState.materials),
            
            // 目标选择状态
            targetSelection: parsed.targetSelection || baseState.targetSelection,
            
            trainingHistory: Array.isArray(parsed.trainingHistory) 
                ? parsed.trainingHistory 
                : baseState.trainingHistory,
            
            // 关键修复：正确恢复历练完成状态
            trainingCompletions: parsed.trainingCompletions
                ? {...baseState.trainingCompletions, ...parsed.trainingCompletions}
                : baseState.trainingCompletions,

            // 特殊处理training数据 - 修复历练进度状态
            training: {
                yinYang: mergeTrainingData(parsed.training?.yinYang, baseState.training.yinYang),
                windFire: mergeTrainingData(parsed.training?.windFire, baseState.training.windFire),
                earthWater: mergeTrainingData(parsed.training?.earthWater, baseState.training.earthWater)
            }
        };

        // 关键修复：确保completed不会大于required
        ['yinYang', 'windFire', 'earthWater'].forEach(category => {
            if (state.training[category]) {
                state.training[category].forEach(item => {
                    if (item.completed > item.required) {
                        item.completed = item.required;
                    }
                });
            }
        });

        console.log('数据加载完成', {
            moneyChecked: state.moneyChecked,
            fragments: state.fragments,
            scrolls: state.scrolls,
            loadedMaterials: Object.keys(state.materials).length,
            trainingCompletions: state.trainingCompletions
        });

        updateLastUpdated();

    } catch (e) {
        console.error('数据加载过程中出现严重错误:', e);
        // 完全重置状态并重建存储
        state = resetState();
        saveData(); 
        alert('存档数据损坏，已重置为初始状态');
    }
};

    // 检查历练完成情况
   const checkTrainingCompletion = (category, tier) => {
    if (!state.training[category]) return 0;
    
    return state.training[category].reduce((min, item, index) => {
        const floor = [4, 6, 8, 10, 12][index];
        
        // 使用统一的需求计算函数 - 确保正确计算需求
        const required = getActualRequired(item, floor);
        
        // 计算当前完成度（避免除以零）
        if (required <= 0) return min;
        
        const completedRatio = Math.floor((item.completed || 0) / required);
        return Math.min(min, completedRatio);
    }, Infinity) || 0;
};
    // ==================== setupDOM 函数 ====================
    const setupDOM = () => {
    try {
        // 1. 检查主容器（保留原有严格检查）
        dom.container = document.querySelector(CONFIG.containerId);
        if (!dom.container) {
            throw new Error(`主容器 ${CONFIG.containerId} 未找到 - 请检查HTML是否包含该元素`);
        }

        // 2. 定义关键元素列表（保留原有关键元素检查）
        const criticalElements = [
            'classStatus', 'attributeStatus', 'materialsList',
            'moneyCheck', 'fragments', 'scrolls'
            // 注意：已移除历练容器作为关键元素
        ];

        // 3. 初始化所有元素（保留原有错误处理逻辑）
       Object.entries(CONFIG.elements).forEach(([key, selector]) => {
            try {
                dom[key] = document.querySelector(selector);
                
                // 判断是否是历练容器
                const isTrainingContainer = [
                    'yinYangTraining', 
                    'windFireTraining', 
                    'earthWaterTraining'
                ].includes(key);
                
                // 关键元素检查（排除历练容器）
                if (criticalElements.includes(key) && !isTrainingContainer && !dom[key]) {
                    throw new Error(`[关键元素] ${selector} 未找到`);
                } 
                // 非关键元素警告（排除历练容器）
                else if (!dom[key] && !isTrainingContainer) {
                    console.warn(`[非关键元素] ${selector} 未找到`);
                }
                
                // 特殊处理：如果历练容器未找到，只记录警告不抛出错误
                if (isTrainingContainer && !dom[key]) {
                    console.warn(`[历练容器] ${selector} 未找到，相关功能将不可用`);
                }
            } catch (error) {
                console.error(`元素初始化失败 ${key}:`, error);
                // 只有关键元素才会阻断流程
                if (criticalElements.includes(key)) throw error;
            }
        });


        // 4. 添加调试日志（新增）
         console.log('DOM初始化完成', { 
            container: !!dom.container,
            criticalElements: criticalElements.map(k => ({ 
                key: k, 
                found: !!dom[k] 
            })),
            trainingContainers: {
                yinYang: !!dom.yinYangTraining,
                windFire: !!dom.windFireTraining,
                earthWater: !!dom.earthWaterTraining
            }
        });

    } catch (e) {
        console.error('DOM初始化失败:', e);
        // 保留原有友好的错误界面
        document.body.innerHTML = `
            <div style="color:red;padding:20px;font-family:sans-serif">
                <h2>页面加载失败</h2>
                <p>${e.message}</p>
                <p>缺少必需元素，请检查：</p>
                <ul>
                    ${criticalElements.map(el => 
                        `<li>${el}: ${CONFIG.elements[el] || '未配置'}</li>`
                    ).join('')}
                </ul>
                <button onclick="location.reload()" style="padding:8px 16px;margin-top:15px;">
                    刷新页面
                </button>
            </div>
        `;
        throw e;
    }
};
    // ==================== 渲染函数 ====================
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
    // 渲染整个界面
    const renderAll = () => {
    console.log("开始渲染所有组件");
    try {
        const expStatus = calculateExpStatus();
        const baseConditionsMet = checkBaseConditions(expStatus);
        
        // 确保这些函数都存在
        if (typeof updateBasicUI === 'function') updateBasicUI(expStatus);
        if (typeof renderTargetSelection === 'function') renderTargetSelection();
        if (typeof renderClassStatus === 'function') renderClassStatus(baseConditionsMet);
        if (typeof renderAttributeStatus === 'function') renderAttributeStatus();
        if (typeof renderMaterials === 'function') renderMaterials(); // 只调用一次
        
        // 安全调用历练渲染
        if (dom.yinYangTraining) 
            renderTrainingCategory('yinYang', dom.yinYangTraining);
        if (dom.windFireTraining) 
            renderTrainingCategory('windFire', dom.windFireTraining);
        if (dom.earthWaterTraining) 
            renderTrainingCategory('earthWater', dom.earthWaterTraining);
    } catch (e) {
        console.error('渲染过程中出错:', e);
    }
    console.log("渲染完成");
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
    const renderTrainingCategory = (category, container) => {
    // 添加容错检查
    if (!container) {
        console.error(`渲染容器未找到: ${category}`);
        return;
    }
    
    if (!state.training[category]) {
        console.error(`历练数据未找到: ${category}`);
        container.innerHTML = `<div class="error">数据加载错误，请刷新页面</div>`;
        return;
    }
    
    // 获取分类名称（如"地水历练"）
    const categoryName = getCategoryName(category); 
    const floors = [4, 6, 8, 10, 12];
    const currentTier = state.training[category][0]?.tier || 17;

    // 生成修为徽章（显示各阶完成情况）
    const completionBadges = [13, 15, 17].map(tier => {
        const completed = state.trainingCompletions[category][tier] || 0;
        const currentProgress = checkTrainingCompletion(category, tier);
        const available = Math.max(0, currentProgress - completed);
        
        if (currentProgress > 0 || completed > 0) {
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
            <div class="category-name">${categoryName}</div>
            <div class="title-controls-container">
                <div class="completion-badges">${completionBadges}</div>
                <div class="training-controls">
                    <select class="tier-select" data-category="${category}">
                        ${[13, 15, 17].map(tier => `
                            <option value="${tier}" 
                                ${currentTier === tier ? 'selected' : ''}>
                                修为${tier}
                            </option>
                        `).join('')}
                    </select>
                    <button class="reset-category-btn" data-category="${category}">一键撤销</button>
                </div>
            </div>
        </div>
        ${state.training[category].map((trainingItem, index) => {
            const floor = floors[index];
            const actualRequired = getActualRequired(trainingItem, floor);
            const completed = trainingItem.completed || 0;
            
            // 关键：优先显示计算结果
            const displayCount = trainingItem.calculatedCount !== null ? 
                trainingItem.calculatedCount : 
                actualRequired;
                
            const isMet = completed >= displayCount;
            const remaining = isMet ? 0 : Math.max(0, displayCount - completed);


           return `
            <div class="training-item">
                <div class="training-header">
                    <div class="training-name">${GAME_DATA.training[category][index].name}</div>
                    <div class="training-input-status">
                        <input type="text"
                            class="training-count-input" 
                            data-category="${category}" 
                            data-index="${index}"
                            value="${displayCount}">  <!-- 显示 displayCount 而不是 actualRequired -->
                        <div class="sub-status-indicator ${isMet ? 'met' : 'not-met'}">
                            ${isMet ? '已满足' : `${completed}/${displayCount}`}  <!-- 显示 displayCount -->
                        </div>
                    </div>
                </div>
                ${renderCircles(displayCount, completed)}  <!-- 使用 displayCount -->
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
                        ${remaining < 3 ? 'disabled' : ''}>
                        核销三次
                    </button>
                    <button class="consume-btn" 
                        data-category="${category}" 
                        data-index="${index}" 
                        data-count="6"
                        ${remaining < 6 ? 'disabled' : ''}>
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

    // 关键：必须重新绑定事件！
    bindTrainingEvents(container);
};
 
    // 渲染圆圈进度
    const renderCircles = (required, completed) => {
    // 确保至少显示1个圆圈
    const totalCircles = Math.max(required, 1);
    
    let circlesHTML = '';
    // 已完成的蓝色圆圈
    for (let i = 0; i < Math.min(completed, totalCircles); i++) {
        circlesHTML += `<div class="circle filled"></div>`;
    }
    // 未完成的灰色圆圈
    for (let i = Math.min(completed, totalCircles); i < totalCircles; i++) {
        circlesHTML += `<div class="circle"></div>`;
    }
    return `<div class="circles-container">${circlesHTML}</div>`;
};

    // ==================== 状态计算 ====================

    // 计算经验值状态
    const calculateExpStatus = () => {
    const currentExp = state.fragments * 100 + state.scrolls * 1000;
    const isMet = currentExp >= CONFIG.requiredExp;
    
    // 显示明确的经验状态
    let statusText;
    if (isMet) {
        statusText = '已满足';
    } else {
        const needed = CONFIG.requiredExp - currentExp;
        statusText = `还需 ${needed} 经验`;
    }
    
    return {
        isMet,
        text: statusText,
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
    const trainingItem = state.training[category][index];
    const floor = [4, 6, 8, 10, 12][index];
    const tier = trainingItem.tier || 17;
    
    // 使用统一的需求计算函数
    const actualRequired = getActualRequired(trainingItem, floor);
    
    const completed = trainingItem.completed || 0;
    const remaining = Math.max(0, actualRequired - completed);
    
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
    
    // 记录操作历史
    state.trainingHistory.push({
        category,
        index,
        previousCount: completed,
        count: actualCount,
        timestamp: new Date().toISOString()
    });
    
    // 更新状态
    trainingItem.completed += actualCount;

    // 关键修复：更新修为完成记录
    const currentTier = trainingItem.tier;
    const currentProgress = checkTrainingCompletion(category, currentTier);
    const alreadyCompleted = state.trainingCompletions[category][currentTier] || 0;
    
    // 只有当新进度大于已记录进度时才更新
    if (currentProgress > alreadyCompleted) {
        state.trainingCompletions[category][currentTier] = currentProgress;
    }

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
        return {
            completed: item.completed || 0,
            required: GAME_DATA.trainingPresets[tier][floor],
            userModified: item.userModified || false,
            tier: parseInt(tier),
            // 保留计算结果
            calculatedCount: item.calculatedCount  // 不重置计算结果
        };
    });

    // 修复：使用正确的渲染函数
    if (dom[`${category}Training`]) {
        renderTrainingCategory(category, dom[`${category}Training`]);
    }
    
    saveData();
};

    // 一键撤销分类
    const handleResetCategory = (category) => {
     if (this.resetting) return;
    this.resetting = true;
     
    if (confirm(`确定要重置【${getCategoryName(category)}】的所有进度吗？`)) {
        const floors = [4, 6, 8, 10, 12];
        
        state.training[category] = state.training[category].map((item, index) => {
            const floor = floors[index];
            return {
                completed: 0, // 重置完成次数为0
                required: GAME_DATA.trainingPresets[17][floor], // 使用17阶需求
                userModified: false,
                tier: 17,
                calculatedCount: null // 重置计算结果
            };
        });

        // 清除相关历史记录
        state.trainingHistory = state.trainingHistory.filter(
            record => record.category !== category
        );
        
        // 重置修为完成记录
        [13, 15, 17].forEach(tier => {
            state.trainingCompletions[category][tier] = 0;
        });
        
        updateAndSave(); // 触发重新渲染
    }
     state.resetting = false;
};

    // 获取分类名称
    const getCategoryName = (category) => {
    const names = {
        yinYang: '阴阳历练',
        windFire: '风火历练', 
        earthWater: '地水历练'
    };
    return names[category] || category || '未知历练';
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
             // 历练输入框处理
    document.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('training-count-input')) {
            // 保存旧值并选中文本
            e.target.oldValue = e.target.value;
            e.target.select();
        }
    });
    
    document.addEventListener('focusout', (e) => {
        if (e.target.classList.contains('training-count-input')) {
            // 如果用户清空了内容，恢复旧值
            if (e.target.value === '') {
                e.target.value = e.target.oldValue;
            }
        }
    });
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
                // 添加输入框自动选中功能
    document.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('training-count-input')) {
            e.target.select(); // 自动选中文本方便直接输入
            // 或者如果要清空内容：
            // e.target.value = '';
        }
    });
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
            e.stopPropagation(); // 阻止事件冒泡
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
const updateMaterialInputsVisibility = () => {
    const attribute = dom.cultivationAttribute.value;
    document.querySelectorAll('.material-inputs').forEach(el => {
        el.style.display = 'none';
    });
    const target = document.getElementById(`${attribute}-materials`);
    if (target) target.style.display = 'grid';
};

// 材料需求配置
const MATERIAL_REQUIREMENTS = {
  windFire: {
    13: { juanShan: 180, cuiShan: 570, jinShan: 1440, yuShan: 1610, xianShan: 660, beiShan: 0 },
    15: { juanShan: 180, cuiShan: 570, jinShan: 1440, yuShan: 2550, xianShan: 2070, beiShan: 0 },
    17: { juanShan: 180, cuiShan: 570, jinShan: 1440, yuShan: 2550, xianShan: 3420, beiShan: 2100 }
  },
  yinYang: {
    13: { tongJing: 180, liuJing: 570, liuJinJing: 1440, baoShiJing: 1610, shuiJing: 660, xingHanJing: 0 },
    15: { tongJing: 180, liuJing: 570, liuJinJing: 1440, baoShiJing: 2550, shuiJing: 2070, xingHanJing: 0 },
    17: { tongJing: 180, liuJing: 570, liuJinJing: 1440, baoShiJing: 2550, shuiJing: 3420, xingHanJing: 2100 }
  },
  earthWater: {
    13: { zhuoJiu: 180, qingJiu: 570, baiJiu: 1440, lingQuan: 1610, baWangLei: 660, muLan: 0 },
    15: { zhuoJiu: 180, qingJiu: 570, baiJiu: 1440, lingQuan: 2550, baWangLei: 2070, muLan: 0 },
    17: { zhuoJiu: 180, qingJiu: 570, baiJiu: 1440, lingQuan: 2550, baWangLei: 3420, muLan: 2100 }
  }
};

// 历练层数与材料关系
const TRAINING_RELATIONS = {
  windFire: {
    4: ['juanShan', 'cuiShan'],
    6: ['cuiShan', 'jinShan'],
    8: ['jinShan', 'yuShan'],
    10: ['yuShan', 'xianShan'],
    12: ['xianShan', 'beiShan']
  },
  yinYang: {
    4: ['tongJing', 'liuJing'],
    6: ['liuJing', 'liuJinJing'],
    8: ['liuJinJing', 'baoShiJing'],
    10: ['baoShiJing', 'shuiJing'],
    12: ['shuiJing', 'xingHanJing']
  },
  earthWater: {
    4: ['zhuoJiu', 'qingJiu'],
    6: ['qingJiu', 'baiJiu'],
    8: ['baiJiu', 'lingQuan'],
    10: ['lingQuan', 'baWangLei'],
    12: ['baWangLei', 'muLan']
  }
};

// 历练关卡材料掉落
const TRAINING_DROPS = {
  4: { primary: 30, secondary: 20 },  // 历练四：主材料×30，副材料×20
  6: { primary: 40, secondary: 30 },  // 历练六：主材料×40，副材料×30
  8: { primary: 45, secondary: 35 },  // 历练八：主材料×45，副材料×35
  10: { primary: 50, secondary: 40 }, // 历练十：主材料×50，副材料×40
  12: { primary: 60, secondary: 45 }  // 历练十二：主材料×60，副材料×45
};
 
 // 计算指定历练层数需要的次数
const calculateTrainingCount = (requirements, userMaterials, level, material) => {
    // 获取可用材料量（处理NaN）
    const available = parseInt(userMaterials[material]) || 0;
    
    // 计算实际缺口（不能为负数）
    const gap = Math.max(0, requirements[material] - available);
    
    // 获取历练掉落量
    const dropsPerRun = TRAINING_DROPS[level].primary;
    
    // 计算需要次数（向上取整）
    return Math.ceil(gap / dropsPerRun);
};
   

// 更新材料缺口（考虑主副材料）
const updateMaterialGaps = (requirements, userMaterials, level, count) => {
    if (count <= 0) return;
    
    const materials = TRAINING_RELATIONS[category][level];
    const drops = TRAINING_DROPS[level];
    
    // 主材料扣除（严格类型检查）
    if (materials[0] && requirements[materials[0]]) {
        requirements[materials[0]] = Math.max(
            0, 
            requirements[materials[0]] - (count * drops.primary)
        );
    }
    
    // 副材料扣除（特别是历练十二）
    if (materials[1] && requirements[materials[1]]) {
        requirements[materials[1]] = Math.max(
            0, 
            requirements[materials[1]] - (count * drops.secondary)
        );
    }
};

// 应用计算结果到历练
const applyToTraining = (category, counts) => {
    console.log('应用计算结果到历练:', category, counts);
    
    const floors = [4, 6, 8, 10, 12];
    
    floors.forEach((floor, index) => {
        const count = counts[floor] || 0;
        if (count > 0) {
            // 直接更新状态
            if (!state.training[category][index]) {
                state.training[category][index] = {
                    completed: 0,
                    required: GAME_DATA.trainingPresets[state.training[category][index].tier][floor],
                    userModified: false,
                    tier: state.training[category][index].tier
                };
            }
            
            const trainingItem = state.training[category][index];
            const oldCompleted = trainingItem.completed;
            trainingItem.completed += count;
            
            // 记录操作历史
            state.trainingHistory.push({
                category,
                index,
                previousCount: oldCompleted,
                count: count,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // 更新修为完成记录
    [13, 15, 17].forEach(tier => {
        const totalAvailable = checkTrainingCompletion(category, tier);
        const alreadyCompleted = state.trainingCompletions[category][tier] || 0;
        
        if (totalAvailable > alreadyCompleted) {
            state.trainingCompletions[category][tier] = totalAvailable;
        }
    });
    
    // 强制保存并重新渲染
    updateAndSave();
};

// ==================== 修复后的计算函数 ====================
const calculateAndApply = () => {
    console.log('开始计算修为材料...');
    
    // 1. 获取用户选择的属性和修为等级
    const attribute = dom.cultivationAttribute.value;
    const tier = parseInt(dom.cultivationTier.value);
    const category = attribute === 'yinYang' ? 'yinYang' : 
                    attribute === 'windFire' ? 'windFire' : 'earthWater';
    
    // 2. 读取用户输入的材料数量
    const userMaterials = {};
    const materialContainer = document.getElementById(`${attribute}-materials`);
    if (!materialContainer) {
        alert('错误：找不到材料输入区域');
        return;
    }
    
    // 收集所有输入值
    materialContainer.querySelectorAll('input').forEach(input => {
        userMaterials[input.dataset.material] = parseInt(input.value) || 0;
    });

    // 3. 获取当前修为的材料需求配置
    const requirements = JSON.parse(JSON.stringify(
        MATERIAL_REQUIREMENTS[attribute][tier]
    ));

    // 4. 初始化当前库存（包含用户已有材料）
    const currentStock = {...userMaterials};
    
    // 5. 按顺序计算各层历练次数（4→6→8→10→12）
    const trainingCounts = {4:0, 6:0, 8:0, 10:0, 12:0};
    
    // 修复点1：使用正确的 TRAINING_RELATIONS 结构
    // 历练4层计算
    const level4 = 4;
    const level4Mats = TRAINING_RELATIONS[category][level4]; // 修复：添加 [category]
    const level4PrimaryGap = Math.max(0, requirements[level4Mats[0]] - currentStock[level4Mats[0]]);
    trainingCounts[level4] = Math.ceil(level4PrimaryGap / TRAINING_DROPS[level4].primary);
    
    // 更新库存（主材料+副材料）
    currentStock[level4Mats[0]] += trainingCounts[level4] * TRAINING_DROPS[level4].primary;
    currentStock[level4Mats[1]] += trainingCounts[level4] * TRAINING_DROPS[level4].secondary;
    
    // 历练6层计算
    const level6 = 6;
    const level6Mats = TRAINING_RELATIONS[category][level6]; // 修复：添加 [category]
    const level6PrimaryGap = Math.max(0, requirements[level6Mats[0]] - currentStock[level6Mats[0]]);
    trainingCounts[level6] = Math.ceil(level6PrimaryGap / TRAINING_DROPS[level6].primary);
    
    // 更新库存
    currentStock[level6Mats[0]] += trainingCounts[level6] * TRAINING_DROPS[level6].primary;
    currentStock[level6Mats[1]] += trainingCounts[level6] * TRAINING_DROPS[level6].secondary;
    
    // 历练8层计算
    const level8 = 8;
    const level8Mats = TRAINING_RELATIONS[category][level8]; // 修复：添加 [category]
    const level8PrimaryGap = Math.max(0, requirements[level8Mats[0]] - currentStock[level8Mats[0]]);
    trainingCounts[level8] = Math.ceil(level8PrimaryGap / TRAINING_DROPS[level8].primary);
    
    // 更新库存
    currentStock[level8Mats[0]] += trainingCounts[level8] * TRAINING_DROPS[level8].primary;
    currentStock[level8Mats[1]] += trainingCounts[level8] * TRAINING_DROPS[level8].secondary;
    
    // 历练10层计算
    const level10 = 10;
    const level10Mats = TRAINING_RELATIONS[category][level10]; // 修复：添加 [category]
    const level10PrimaryGap = Math.max(0, requirements[level10Mats[0]] - currentStock[level10Mats[0]]);
    trainingCounts[level10] = Math.ceil(level10PrimaryGap / TRAINING_DROPS[level10].primary);
    
    // 更新库存
    currentStock[level10Mats[0]] += trainingCounts[level10] * TRAINING_DROPS[level10].primary;
    currentStock[level10Mats[1]] += trainingCounts[level10] * TRAINING_DROPS[level10].secondary;
    
    // 历练12层计算（特殊处理）
    const level12 = 12;
    const level12Mats = TRAINING_RELATIONS[category][level12]; // 修复：添加 [category]
    
    // 先计算悲回风扇（唯一来源）
    const beiShanGap = Math.max(0, requirements[level12Mats[1]] - currentStock[level12Mats[1]]);
    trainingCounts[level12] = Math.ceil(beiShanGap / TRAINING_DROPS[level12].secondary);
    
    // 检查仙门扇是否满足
    const xianShanAfter = currentStock[level12Mats[0]] + 
                          trainingCounts[level12] * TRAINING_DROPS[level12].primary;
    const xianShanGap = Math.max(0, requirements[level12Mats[0]] - xianShanAfter);
    
    // 如果仙门扇仍有缺口，增加次数
    if (xianShanGap > 0) {
        const additional = Math.ceil(xianShanGap / TRAINING_DROPS[level12].primary);
        trainingCounts[level12] += additional;
    }

    // 6. 更新状态
     const floors = [4, 6, 8, 10, 12];
    floors.forEach((floor, index) => {
        const count = trainingCounts[floor] || 0;
        if (state.training[category][index]) {
            state.training[category][index].calculatedCount = count;
        } else {
            state.training[category][index] = {
                completed: 0,
                required: GAME_DATA.trainingPresets[tier][floor],
                userModified: false,
                tier: tier,
                calculatedCount: count
            };
        }
    });

    // 7. 保存数据并重新渲染
    saveData();
    renderTrainingCategory(category, dom[`${category}Training`]);
    
    // 8. 显示结果
    const activeCounts = Object.entries(trainingCounts)
        .filter(([_, count]) => count > 0)
        .map(([level, count]) => `历练${level}: ${count}次`);
    
    alert(activeCounts.length > 0 
        ? `需要完成:\n${activeCounts.join('\n')}` 
        : "🎉 全部材料已满足！");
};
    // ==================== 工具函数 ====================
    /**
 * 兼容旧版数据迁移
 * 说明：旧版本没有trainingCompletions字段，需要初始化
 */
 // 更新材料输入区域可见性

const migrateOldData = (savedData) => {
    // 添加参数检查
    if (!savedData || typeof savedData !== 'object') {
        console.log('无效的存档数据，初始化默认修为完成记录...');
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
    
    // 强制更新经验状态显示
    const expStatus = calculateExpStatus();
    if (dom.expStatus) {
        dom.expStatus.textContent = expStatus.text;
        dom.expStatus.className = expStatus.className;
    }
    
    // 强制更新金钱状态
    if (dom.moneyCheck) {
        dom.moneyCheck.checked = state.moneyChecked;
    }
    
    // 保存数据
    saveData();
    
    // 更新历练显示
    if (dom.yinYangTraining) renderTrainingCategory('yinYang', dom.yinYangTraining);
    if (dom.windFireTraining) renderTrainingCategory('windFire', dom.windFireTraining);
    if (dom.earthWaterTraining) renderTrainingCategory('earthWater', dom.earthWaterTraining);
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
    const initTraining = (category) => 
        [4, 6, 8, 10, 12].map(floor => ({
            completed: 0,
            required: GAME_DATA.trainingPresets[17][floor],
            userModified: false,
            tier: 17,
            calculatedCount: null  // 确保初始化为 null
        }));
  

    return {
        moneyChecked: false,
        fragments: 0,
        scrolls: 0,
        materials: GAME_DATA.materials.reduce((acc, cur) => {
            acc[cur.id] = false;
            return acc;
        }, {}),
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
            classes: { guidao: false, shenji: false, qihuang: false, longdun: false, pojun: false },
            attributes: { yin: false, yang: false, feng: false, huo: false, di: false, shui: false }
        },
        trainingHistory: [], // 清空历史记录
        lastUpdated: new Date().toISOString()
    };
};
 
     const bindTrainingEvents = (container) => {
        // 绑定撤销按钮
        container.querySelectorAll('.reset-category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            handleResetCategory(e.target.dataset.category);
        });
    });
        
        // 绑定一键撤销分类按钮
        container.querySelectorAll('.reset-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                handleResetCategory(e.target.dataset.category);
            });
        });

        // 绑定修为切换
        container.querySelectorAll('.tier-select').forEach(select => {
            select.addEventListener('change', (e) => {
                handleTierChange(e.target.dataset.category, parseInt(e.target.value));
            });
        });
    };
 
    // ==================== 公共接口 ====================
return {
        init
    };
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
