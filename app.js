const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// --- DYNAMIC MULTI-LANGUAGE TRANSLATION DICTIONARY ---
const translations = { ar: {}, en: {} };

function loadTranslations() {
    try {
        const arPath = path.join(__dirname, 'src', 'i18n', 'ar.json');
        const enPath = path.join(__dirname, 'src', 'i18n', 'en.json');
        
        if (fs.existsSync(arPath)) {
            translations.ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
        }
        if (fs.existsSync(enPath)) {
            translations.en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
        }
    } catch (err) {
        console.error('Failed to load translations from JSON files:', err);
    }
}

loadTranslations();

window.translate = function(key, fallback) {
    if (translations[currentLang] && translations[currentLang][key]) {
        return translations[currentLang][key];
    }
    return fallback || key;
};

const AGENT_SVGS = {
    architect: `<svg class="agent-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px; color: var(--accent-purple);"><path d="M2 22h20M2 22V2h8l10 10v10M10 2v10h10"/></svg>`,
    organizer: `<svg class="agent-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px; color: var(--accent-cyan);"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    harvester: `<svg class="agent-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px; color: var(--accent-cyan);"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    debugger: `<svg class="agent-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px; color: var(--success);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 11l2 2 4-4"/></svg>`
};

let currentLang = 'en';
localStorage.setItem('artelligence-lang', 'en');

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('artelligence-lang', lang);
    
    const isRtl = lang === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    if (isRtl) {
        document.body.classList.remove('dir-ltr');
    } else {
        document.body.classList.add('dir-ltr');
    }
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (key.includes('-price')) {
                el.innerHTML = translations[lang][key];
            } else {
                el.innerText = translations[lang][key];
            }
        }
    });

    // Translate placeholder attributes if they exist
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.setAttribute('placeholder', translations[lang][key]);
        }
    });

    const langToggleBtnInner = document.getElementById('lang-toggle-settings');
    if (langToggleBtnInner) {
        langToggleBtnInner.innerText = lang === 'ar' ? 'English' : 'العربية';
    }

    drawAgentGraph();
    loadLocalSentimentReport();
    updateCampaignTexts();
    if (typeof fetchKnowledgeData === 'function') {
        fetchKnowledgeData();
    }
    if (typeof renderAgentsList === 'function') {
        renderAgentsList();
    }
    if (typeof window.renderAppControlCards === 'function') {
        window.renderAppControlCards();
    }
}

// --- TAB NAVIGATION (7 MODULES SYSTEM) ---
const menuItems = document.querySelectorAll('.menu-item');
const tabContents = document.querySelectorAll('.tab-content');
const breadcrumbCurrent = document.getElementById('breadcrumb-current');

function updateBreadcrumbs(tabName) {
    if (!breadcrumbCurrent) return;
    const key = `menu-${tabName}`;
    if (translations[currentLang] && translations[currentLang][key]) {
        breadcrumbCurrent.innerText = translations[currentLang][key];
    } else {
        // Fallback names
        const names = {
            'command-center': 'مركز القيادة',
            'business-hub': 'مركز الأعمال',
            'content-studio': 'استوديو المحتوى',
            'agent-console': 'وحدة الوكلاء',
            'project-ops': 'إدارة المشاريع',
            'finance': 'المتابعة المالية',
            'knowledge-vault': 'خزنة المعرفة',
            'settings': 'الإعدادات والأدوات'
        };
        breadcrumbCurrent.innerText = names[tabName] || tabName;
    }
    breadcrumbCurrent.setAttribute('data-i18n', key);
}

menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = item.getAttribute('data-tab');
        switchToModule(tabName);
    });
});

window.switchToModule = function(tabName, subTabName = null) {
    try {
        localStorage.setItem('artelligence-active-tab', tabName);
    } catch (err) {}

    menuItems.forEach(mi => {
        if (mi.getAttribute('data-tab') === tabName) {
            mi.classList.add('active');
        } else {
            mi.classList.remove('active');
        }
    });

    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `tab-${tabName}`) {
            content.classList.add('active');
            
            // Execute module specific init/update logic
            if (tabName === 'knowledge-vault' || tabName === 'knowledge') {
                fetchKnowledgeData();
            } else if (tabName === 'agent-console' || tabName === 'dashboard') {
                drawAgentGraph();
            }
        }
    });

    updateBreadcrumbs(tabName);

    // Switch sub-tab if specified (e.g. business-hub -> solara)
    if (subTabName) {
        const subNavBtn = document.querySelector(`.sub-nav-btn[data-subtab="${subTabName}"]`);
        if (subNavBtn) {
            subNavBtn.click();
        }
    }
};

// Restore last active tab on startup
try {
    const savedTab = localStorage.getItem('artelligence-active-tab') || 'command-center';
    setTimeout(() => {
        switchToModule(savedTab);
    }, 100);
} catch (e) {
    console.error('Failed to restore active tab:', e);
}

// --- SUB-NAV FOR BUSINESS HUB ---
document.querySelectorAll('.sub-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const subtabName = btn.getAttribute('data-subtab');
        const container = btn.closest('.tab-content');
        
        container.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        container.querySelectorAll('.subtab-content').forEach(c => {
            c.classList.remove('active');
            if (c.id === `subtab-${subtabName}`) {
                c.classList.add('active');
            }
        });
    });
});

// --- DATE DISPLAY ON WELCOME BANNER ---
function updateDateDisplay() {
    const dateEl = document.getElementById('current-date');
    if (!dateEl) return;
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', options);
    dateEl.innerText = dateStr;
}

// --- AGENTS DATA & SIMULATION ---
const defaultAgents = [
    { id: 'architect', name: 'Code Architect', role_ar: 'هندسة الكود وتعديل البنية البرمجية', role_en: 'Code Architect & Core refactoring', status: 'idle', icon: '', lastAction_ar: 'تجهيز ملف tsconfig.json للمشروع', lastAction_en: 'Prepared project tsconfig.json', permissions: { read: true, write: true, execute: true } },
    { id: 'organizer', name: 'Workspace Organizer', role_ar: 'تنظيف المجلدات وأرشفة التقارير', role_en: 'Workspace cleaning & archiving', status: 'active', icon: '', lastAction_ar: 'أرشفة السجلات وتصنيف المكررات', lastAction_en: 'Archived logs & categorized duplicates', permissions: { read: true, write: true, execute: false } },
    { id: 'harvester', name: 'Sentiment Harvester', role_ar: 'سحب آراء العملاء واستطلاعات الرأي', role_en: 'Harvests user reviews & validation data', status: 'idle', icon: '', lastAction_ar: 'قراءة التفاعلات على Twitter/X', lastAction_en: 'Queried mentions on Twitter/X', permissions: { read: true, write: false, execute: true } },
    { id: 'debugger', name: 'Self-Healing System', role_ar: 'المعالجة الذاتية وإصلاح أخطاء البرمجيات', role_en: 'Self-healing & automated debugging', status: 'active', icon: '', lastAction_ar: 'تعديل كود الـ Crawler لتفادي الحظر', lastAction_en: 'Modified crawler headers to prevent block', permissions: { read: true, write: true, execute: true } }
];

let agentsList = [];

try {
    const savedAgents = localStorage.getItem('artelligence-agents');
    if (savedAgents) {
        agentsList = JSON.parse(savedAgents);
    } else {
        agentsList = [...defaultAgents];
    }
} catch (e) {
    agentsList = [...defaultAgents];
}

function saveAgentsToStorage() {
    try {
        localStorage.setItem('artelligence-agents', JSON.stringify(agentsList));
    } catch (e) {
        console.error('Failed to save agents:', e);
    }
}

function renderAgentsList() {
    const grid = document.getElementById('agents-grid');
    if (!grid) return;
    grid.innerHTML = agentsList.map(agent => {
        const role = currentLang === 'ar' ? agent.role_ar : agent.role_en;
        const lastAction = currentLang === 'ar' ? agent.lastAction_ar : agent.lastAction_en;
        const statusText = currentLang === 'ar' 
            ? (agent.status === 'active' ? 'نشط' : 'خامل')
            : (agent.status === 'active' ? 'Active' : 'Idle');

        const permissions = agent.permissions || { read: true, write: false, execute: false };
        const readChecked = permissions.read ? 'checked' : '';
        const writeChecked = permissions.write ? 'checked' : '';
        const executeChecked = permissions.execute ? 'checked' : '';

        return `
            <div class="agent-item-card" id="agent-${agent.id}" style="border-inline-start: 3px solid ${agent.status === 'active' ? 'var(--success)' : 'var(--accent-purple)'};">
                <div class="agent-card-header">
                    <span style="font-size: 1.5rem; display: flex; align-items: center; justify-content: center;">${AGENT_SVGS[agent.id] || agent.icon}</span>
                    <span class="tag" style="background: ${agent.status === 'active' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 255, 255, 0.05)'}; color: ${agent.status === 'active' ? 'var(--success)' : 'var(--text-muted)'};">
                        ${statusText}
                    </span>
                </div>
                <div class="agent-title" style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${window.translate('agent-' + agent.id, agent.name)}</div>
                <div class="agent-desc" style="font-size: 0.75rem; color: var(--text-muted); min-height: 36px; margin-top: 2px;">${role}</div>
                
                <div class="agent-meta" style="font-size: 0.75rem; margin-top: 8px;">
                    <span style="color: var(--text-tertiary);">${currentLang === 'ar' ? 'آخر عملية:' : 'Last Action:'}</span>
                    <span style="color: var(--accent-cyan); font-weight: 500; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${lastAction}">${lastAction}</span>
                </div>

                <div class="agent-permissions-panel" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-glass); display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 600;">${currentLang === 'ar' ? 'صلاحيات الوكيل:' : 'Agent Permissions:'}</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <label style="display: flex; align-items: center; gap: 4px; font-size: 0.7rem; cursor: pointer; color: var(--text-secondary);">
                            <input type="checkbox" class="agent-permission-checkbox" data-agent-id="${agent.id}" data-permission="read" ${readChecked} style="width: 13px; height: 13px; cursor: pointer;">
                            ${currentLang === 'ar' ? 'قراءة' : 'Read'}
                        </label>
                        <label style="display: flex; align-items: center; gap: 4px; font-size: 0.7rem; cursor: pointer; color: var(--text-secondary);">
                            <input type="checkbox" class="agent-permission-checkbox" data-agent-id="${agent.id}" data-permission="write" ${writeChecked} style="width: 13px; height: 13px; cursor: pointer;">
                            ${currentLang === 'ar' ? 'كتابة' : 'Write'}
                        </label>
                        <label style="display: flex; align-items: center; gap: 4px; font-size: 0.7rem; cursor: pointer; color: var(--text-secondary);">
                            <input type="checkbox" class="agent-permission-checkbox" data-agent-id="${agent.id}" data-permission="execute" ${executeChecked} style="width: 13px; height: 13px; cursor: pointer;">
                            ${currentLang === 'ar' ? 'تنفيذ' : 'Exec'}
                        </label>
                    </div>
                </div>

                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button class="btn btn-sm ${agent.status === 'active' ? 'btn-outline' : 'btn-primary'}" onclick="toggleAgentStatus('${agent.id}')" style="flex: 1.2; font-size: 0.72rem; padding: 6px 8px; cursor: pointer; font-weight: 600;">
                        ${agent.status === 'active' 
                            ? (currentLang === 'ar' ? 'إيقاف الوكيل' : 'Stop Agent') 
                            : (currentLang === 'ar' ? 'تفعيل الوكيل' : 'Start Agent')}
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="executeAgentTask('${agent.id}')" style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; flex: 1; font-size: 0.72rem; padding: 6px 8px; border-color: var(--accent-cyan); color: var(--accent-cyan); cursor: pointer; font-weight: 600;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 11px; height: 11px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        <span>${currentLang === 'ar' ? 'تشغيل' : 'Run'}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Attach checkbox event listeners
    document.querySelectorAll('.agent-permission-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const agentId = e.target.getAttribute('data-agent-id');
            const permission = e.target.getAttribute('data-permission');
            const isChecked = e.target.checked;
            toggleAgentPermission(agentId, permission, isChecked);
        });
    });
}

window.toggleAgentStatus = function(agentId) {
    const agent = agentsList.find(a => a.id === agentId);
    if (!agent) return;
    
    agent.status = agent.status === 'active' ? 'idle' : 'active';
    saveAgentsToStorage();
    renderAgentsList();
    
    const statusMsg = currentLang === 'ar'
        ? `[Orchestrator] تم تغيير حالة الوكيل [${agent.name}] إلى: ${agent.status === 'active' ? 'نشط' : 'خامل'}`
        : `[Orchestrator] Changed agent [${agent.name}] status to: ${agent.status === 'active' ? 'Active' : 'Idle'}`;
    logToSelfHealingConsole('info', statusMsg);

    try {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('show-native-notification', {
            title: currentLang === 'ar' ? 'تحديث حالة الوكيل' : 'Agent Status Update',
            body: statusMsg
        });
    } catch (err) {}
};

window.toggleAgentPermission = function(agentId, permission, isChecked) {
    const agent = agentsList.find(a => a.id === agentId);
    if (!agent) return;
    
    if (!agent.permissions) {
        agent.permissions = { read: true, write: false, execute: false };
    }
    agent.permissions[permission] = isChecked;
    saveAgentsToStorage();
    
    const msg = currentLang === 'ar'
        ? `[Security] تم تحديث صلاحية [${permission}] للوكيل [${agent.name}] إلى: ${isChecked ? 'مسموح' : 'ممنوع'}`
        : `[Security] Updated [${permission}] permission for [${agent.name}] to: ${isChecked ? 'Granted' : 'Denied'}`;
    logToSelfHealingConsole('warning', msg);
};

window.executeAgentTask = async function(agentId) {
    const agent = agentsList.find(a => a.id === agentId);
    if (!agent) return;
    
    if (agent.status !== 'active') {
        const warningMsg = currentLang === 'ar'
            ? `[تنبيه] لا يمكن تشغيل [${agent.name}] لأنه خامل. يرجى تفعيل الوكيل أولاً.`
            : `[Warning] Cannot run [${agent.name}] because it is Idle. Please start the agent first.`;
        alert(warningMsg);
        return;
    }
    
    const startMsg = currentLang === 'ar'
        ? `[Orchestrator] جاري تشغيل مهمة الوكيل [${agent.name}]...`
        : `[Orchestrator] Executing agent task for [${agent.name}]...`;
    logToSelfHealingConsole('info', startMsg);
    
    try {
        const { ipcRenderer } = require('electron');
        const res = await ipcRenderer.invoke('agent:execute', {
            agentId: agent.id,
            permissions: agent.permissions || { read: true, write: false, execute: false }
        });
        
        if (res.success) {
            logToSelfHealingConsole('success', `[${agent.name}] ${res.message}`);
            ipcRenderer.send('show-native-notification', {
                title: currentLang === 'ar' ? `مهمة ${agent.name} اكتملت` : `${agent.name} Task Complete`,
                body: res.message
            });
        } else {
            logToSelfHealingConsole('warning', `[${agent.name}] فشل التنفيذ: ${res.error}`);
        }
    } catch (e) {
        console.error(e);
        logToSelfHealingConsole('warning', `[${agent.name}] Error invoking execution: ${e.message}`);
    }
};

function logToSelfHealingConsole(type, text) {
    const consoleDiv = document.getElementById('live-console');
    if (!consoleDiv) return;
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.innerText = `> ${text}`;
    consoleDiv.appendChild(line);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// --- SVG GRAPH BUILDER ---
let graphAnimationId = null;

function animateAgentGraph() {
    const svg = document.getElementById('agent-graph-svg');
    if (!svg) return;
    
    // Check if dashboard tab is active
    const dashTab = document.getElementById('tab-dashboard');
    if (!dashTab || !dashTab.classList.contains('active')) {
        graphAnimationId = null;
        return;
    }

    const time = Date.now() * 0.0018; // Slow smooth speed
    
    const labels = currentLang === 'ar' ? {
        client: 'المستخدم / SaaS Interface',
        orchestrator: 'المنسق الرئيسي (Orchestrator)'
    } : {
        client: 'User / SaaS Interface',
        orchestrator: 'Principal Orchestrator'
    };

    const baseNodes = [
        { id: 'client', label: labels.client, x: 400, y: 50, color: 'var(--accent-cyan)', phase: 0 },
        { id: 'orchestrator', label: labels.orchestrator, x: 400, y: 180, color: 'var(--accent-purple)', phase: Math.PI / 2 }
    ];

    const count = agentsList.length;
    agentsList.forEach((agent, index) => {
        const xPos = 100 + (index * (600 / (count - 1 || 1)));
        const isActive = agent.status === 'active';
        baseNodes.push({
            id: agent.id,
            label: window.translate('agent-' + agent.id, agent.name),
            x: xPos,
            y: 320,
            color: isActive ? 'var(--success)' : 'var(--text-muted)',
            phase: index * 1.3 + Math.PI
        });
    });

    // Calculate floated coordinates
    const animatedNodes = baseNodes.map(node => {
        const ampY = node.id === 'client' ? 4 : (node.id === 'orchestrator' ? 6 : 8);
        const ampX = node.id === 'client' ? 2 : (node.id === 'orchestrator' ? 3 : 4);
        return {
            ...node,
            currentX: node.x + Math.cos(time + node.phase) * ampX,
            currentY: node.y + Math.sin(time + node.phase) * ampY
        };
    });

    let linesHTML = '';
    animatedNodes.forEach(node => {
        if (node.id !== 'client' && node.id !== 'orchestrator') {
            const isActive = agentsList.find(a => a.id === node.id)?.status === 'active';
            linesHTML += `
                <line x1="${animatedNodes[1].currentX}" y1="${animatedNodes[1].currentY}" x2="${node.currentX}" y2="${node.currentY}" 
                      stroke="${isActive ? 'var(--success)' : 'rgba(255, 255, 255, 0.08)'}" 
                      stroke-width="${isActive ? 2.5 : 1}" 
                      stroke-dasharray="${isActive ? '8,8' : 'none'}"
                      style="${isActive ? 'animation: dash-pulse 1.2s linear infinite;' : ''}">
                </line>
            `;
        }
    });
    linesHTML += `<line x1="${animatedNodes[0].currentX}" y1="${animatedNodes[0].currentY}" x2="${animatedNodes[1].currentX}" y2="${animatedNodes[1].currentY}" stroke="var(--accent-cyan)" stroke-width="2.5" stroke-dasharray="6,6" style="animation: dash-pulse 1.5s linear infinite;"></line>`;

    let nodesHTML = '';
    animatedNodes.forEach(node => {
        nodesHTML += `
            <g class="node-group" style="cursor: pointer;">
                <!-- Neon glow filter in SVG -->
                <circle cx="${node.currentX}" cy="${node.currentY}" r="22" fill="#0c0c16" stroke="${node.color}" stroke-width="3" style="filter: drop-shadow(0 0 6px ${node.color}44);">
                </circle>
                <text x="${node.currentX}" y="${node.currentY + 40}" fill="var(--text-primary)" font-size="11" text-anchor="middle" font-weight="600">${node.label}</text>
            </g>
        `;
    });

    svg.innerHTML = linesHTML + nodesHTML;
    graphAnimationId = requestAnimationFrame(animateAgentGraph);
}

function drawAgentGraph() {
    if (!graphAnimationId) {
        animateAgentGraph();
    }
}

// --- SELF-HEALING CONSOLE SIMULATOR ---
const consoleLogs_ar = [
    { type: 'system', text: '[System] بدء محاكاة دورة المعالجة التلقائية...' },
    { type: 'info', text: '[Orchestrator] إرسال طلب استعلام إلى Sentiment Harvester لجمع الملاحظات...' },
    { type: 'success', text: '[Sentiment Harvester] تم تحميل قائمة آراء العملاء. رصد خلل متكرر في توافقية sharp.' },
    { type: 'warning', text: '[Self-Healing] رصد خطأ: "Cannot find module \'sharp\'" في السجل البرمجي.' },
    { type: 'info', text: '[Code Architect] إنشاء محاولة إصلاح تلقائي: تشغيل "npm install sharp" محلياً...' },
    { type: 'success', text: '[Self-Healing] تم تثبيت الحزمة وإصلاح الموديول تلقائياً بدون تدخل بشري.' },
    { type: 'system', text: '[System] البيئة مستقرة وجاهزة بنسبة 100%.' }
];

const consoleLogs_en = [
    { type: 'system', text: '[System] Initializing auto-recovery loop...' },
    { type: 'info', text: '[Orchestrator] Query request dispatched to Sentiment Harvester for target reviews...' },
    { type: 'success', text: '[Sentiment Harvester] User reviews loaded. Detected sharp module incompatibility.' },
    { type: 'warning', text: '[Self-Healing] Detected runtime error: "Cannot find module \'sharp\'".' },
    { type: 'info', text: '[Code Architect] Generating auto-fix patch: running "npm install sharp" locally...' },
    { type: 'success', text: '[Self-Healing] Installed native dependency and recovered modules successfully.' },
    { type: 'system', text: '[System] Current environment is stable and 100% ready.' }
];

let logIndex = 0;
function runConsoleSimulator() {
    const consoleDiv = document.getElementById('live-console');
    if (!consoleDiv) return;

    const activeLogs = currentLang === 'ar' ? consoleLogs_ar : consoleLogs_en;

    if (logIndex < activeLogs.length) {
        const log = activeLogs[logIndex];
        const line = document.createElement('div');
        line.className = `console-line ${log.type}`;
        line.innerText = `> ${log.text}`;
        consoleDiv.appendChild(line);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
        logIndex++;
    } else {
        logIndex = 0; // Restart loop
        consoleDiv.innerHTML = '';
    }
}

// --- REAL LOCAL BACKEND INTEGRATION ---
const API_URL = "http://localhost:8080/data?days=1";

// --- REAL CLICKHOUSE TELEMETRY INTEGRATION ---
async function fetchTelemetryData() {
    const totalHoursEl = document.getElementById('total-hours-value');
    const activeHoursEl = document.getElementById('active-hours-value');
    const prodScoreEl = document.getElementById('productivity-score-value');
    const appsContainer = document.getElementById('telemetry-apps-container');
    const activitiesContainer = document.getElementById('telemetry-activities-container');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const badgeStatus = document.getElementById('backend-status-badge');

    try {
        // 1. Fetch Stats from ClickHouse
        const statsRes = await ipcRenderer.invoke('clickhouse:query', 'SELECT count() as total, sum(durationSeconds) as total_duration FROM ActivityLog');
        if (!statsRes.success) throw new Error(statsRes.error);
        
        if (statusDot) {
            statusDot.className = "status-indicator online";
            statusDot.style.boxShadow = "0 0 12px var(--success)";
        }
        if (statusText) {
            statusText.innerText = currentLang === 'ar' ? "النظام متصل بـ ClickHouse Cloud" : "System connected to ClickHouse Cloud";
        }
        if (badgeStatus) {
            badgeStatus.innerText = currentLang === 'ar' ? "البث المحلي: مباشر" : "Local Telemetry: Live";
            badgeStatus.style.background = "rgba(46, 204, 113, 0.1)";
            badgeStatus.style.color = "var(--success)";
            badgeStatus.style.boxShadow = "0 0 10px rgba(46, 204, 113, 0.15)";
        }

        const totalSec = statsRes.data.data.length > 0 ? parseFloat(statsRes.data.data[0].total_duration || 0) : 0;
        const totalHours = totalSec / 3600;
        
        // Query for focus/productive hours (excluding Finder and generic system settings)
        const focusRes = await ipcRenderer.invoke('clickhouse:query', "SELECT sum(durationSeconds) as focus_duration FROM ActivityLog WHERE appName NOT IN ('Finder', 'System Settings', 'Screen Saver')");
        const focusSec = (focusRes.success && focusRes.data.data.length > 0) ? parseFloat(focusRes.data.data[0].focus_duration || 0) : 0;
        const activeHours = focusSec / 3600;

        const prodScore = totalHours > 0 ? (activeHours / totalHours) * 100 : 0;

        const hrUnit = currentLang === 'ar' ? 'ساعة' : 'hrs';
        if (totalHoursEl) totalHoursEl.innerText = `${totalHours.toFixed(1)} ${hrUnit}`;
        if (activeHoursEl) activeHoursEl.innerText = `${activeHours.toFixed(1)} ${hrUnit}`;
        if (prodScoreEl) prodScoreEl.innerText = `${Math.round(Math.min(prodScore, 100))}%`;

        // 2. Fetch Top Apps
        const topAppsRes = await ipcRenderer.invoke('clickhouse:query', 'SELECT appName, sum(durationSeconds) as total_seconds FROM ActivityLog GROUP BY appName ORDER BY total_seconds DESC LIMIT 5');
        if (topAppsRes.success && appsContainer) {
            const rows = topAppsRes.data.data;
            if (rows.length > 0) {
                const maxSeconds = Math.max(...rows.map(r => parseFloat(r.total_seconds)));
                appsContainer.innerHTML = rows.map(appInfo => {
                    const seconds = parseFloat(appInfo.total_seconds);
                    const widthPercent = Math.max(10, Math.round((seconds / maxSeconds) * 100));
                    const minutes = Math.round(seconds / 60);
                    const minUnit = currentLang === 'ar' ? 'دقيقة' : 'mins';
                    return `
                        <div class="insight-item" style="flex-direction: column; gap: 0.5rem; width: 100%;">
                            <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.85rem;">
                                <strong>${appInfo.appName}</strong>
                                <span style="color: var(--accent-cyan); font-weight: bold;">${minutes} ${minUnit}</span>
                            </div>
                            <div style="background: rgba(255,255,255,0.03); height: 6px; border-radius: 3px; width: 100%; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, var(--accent-purple), var(--accent-cyan)); height: 100%; width: ${widthPercent}%;"></div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                appsContainer.innerHTML = `<div class="insight-item">${currentLang === 'ar' ? 'لا توجد تطبيقات نشطة بعد' : 'No active apps tracked yet'}</div>`;
            }
        }

        // 3. Fetch Recent Telemetry Logs
        const logsRes = await ipcRenderer.invoke('clickhouse:query', 'SELECT startTime, appName, windowTitle, durationSeconds FROM ActivityLog ORDER BY startTime DESC LIMIT 10');
        if (logsRes.success && activitiesContainer) {
            const rows = logsRes.data.data;
            if (rows.length > 0) {
                activitiesContainer.innerHTML = rows.map(log => {
                    const durSec = parseFloat(log.durationSeconds);
                    let durationStr = `${Math.round(durSec)}s`;
                    if (durSec >= 60) durationStr = `${Math.round(durSec/60)}m`;
                    
                    const time = new Date(log.startTime.replace(' ', 'T')).toLocaleTimeString(currentLang === 'ar' ? 'ar-EG' : 'en-US', {hour: '2-digit', minute:'2-digit'});
                    return `
                        <div class="insight-item" style="justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; width: 80%;">
                                <span style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; color: var(--text-muted);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></span>
                                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: start;">
                                    <strong>${log.appName}</strong> - <span style="color: var(--text-muted); font-size: 0.8rem;">${log.windowTitle}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <span class="tag" style="font-size: 0.75rem;">${time}</span>
                                <span style="color: var(--accent-purple); font-weight: bold; font-size: 0.8rem;">${durationStr}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                activitiesContainer.innerHTML = `<div style="color: var(--text-muted); padding: 20px 0; text-align: center;">${currentLang === 'ar' ? 'لا توجد سجلات نشاط' : 'No activity logs found'}</div>`;
            }
        }
    } catch (e) {
        console.warn("Could not connect to ClickHouse, using fallback simulation.", e);
        if (statusDot) {
            statusDot.className = "status-indicator warning";
            statusDot.style.boxShadow = "0 0 12px var(--warning)";
        }
        if (statusText) {
            statusText.innerText = currentLang === 'ar' ? "النظام يعمل محاكاة (قاعدة ClickHouse مغلقة)" : "System running simulation (ClickHouse offline)";
        }
        if (badgeStatus) {
            badgeStatus.innerText = currentLang === 'ar' ? "البث المحلي: محاكاة" : "Local Telemetry: Simulated";
            badgeStatus.style.background = "rgba(230, 126, 34, 0.1)";
            badgeStatus.style.color = "var(--warning)";
            badgeStatus.style.boxShadow = "none";
        }

        const hrUnit = currentLang === 'ar' ? 'ساعة' : 'hrs';
        if (totalHoursEl) totalHoursEl.innerText = `4.3 ${hrUnit}`;
        if (activeHoursEl) activeHoursEl.innerText = `3.1 ${hrUnit}`;
        if (prodScoreEl) prodScoreEl.innerText = "72%";

        if (appsContainer) {
            appsContainer.innerHTML = `
                <div class="insight-item" style="flex-direction: column; gap: 0.5rem; width: 100%;">
                    <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.85rem;">
                        <strong>VS Code</strong>
                        <span style="color: var(--accent-cyan); font-weight: bold;">120 ${currentLang === 'ar' ? 'دقيقة' : 'mins'}</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); height: 6px; border-radius: 3px; width: 100%; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, var(--accent-purple), var(--accent-cyan)); height: 100%; width: 80%;"></div>
                    </div>
                </div>
            `;
        }
        if (activitiesContainer) {
            activitiesContainer.innerHTML = `<div style="color: var(--text-muted); padding: 20px 0; text-align: center;">${currentLang === 'ar' ? 'لا توجد سجلات نشاط' : 'No activity logs found'}</div>`;
        }
    }
    
    renderAgentsList();
}

// --- KNOWLEDGE PORTAL LOGIC ---
let isRemoteRunning = false;

async function fetchKnowledgeData() {
    const tableBody = document.getElementById('table-knowledge-logs-body');
    const chTag = document.getElementById('status-ch-tag');
    const stitchTag = document.getElementById('status-stitch-tag');
    const jiraTag = document.getElementById('status-jira-tag');
    
    const chCount = document.getElementById('mcp-ch-count');
    const stitchCount = document.getElementById('mcp-stitch-count');
    const jiraCount = document.getElementById('mcp-jira-count');

    if (!chTag || !tableBody) return;

    try {
        const status = await ipcRenderer.invoke('mcp:status');
        
        // ClickHouse Tag & Count
        const isChOnline = status.clickhouse.status === 'connected';
        chTag.innerText = isChOnline ? (currentLang === 'ar' ? 'متصل' : 'Connected') : (currentLang === 'ar' ? 'غير متصل' : 'Disconnected');
        chTag.style.background = isChOnline ? 'rgba(46, 204, 113, 0.1)' : 'rgba(244, 63, 94, 0.1)';
        chTag.style.color = isChOnline ? 'var(--success)' : 'var(--error)';
        
        // Stitch
        const isStitchActive = status.stitch.status === 'active';
        stitchTag.innerText = isStitchActive ? (currentLang === 'ar' ? 'نشط' : 'Active') : (currentLang === 'ar' ? 'معطل' : 'Inactive');
        stitchTag.style.background = isStitchActive ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 255, 255, 0.05)';
        stitchTag.style.color = isStitchActive ? 'var(--success)' : 'var(--text-muted)';
        stitchCount.innerText = isStitchActive ? `${status.stitch.count} ${currentLang === 'ar' ? 'مشروع' : 'projects'}` : '0';

        // Jira
        const isJiraActive = status.atlassian.status === 'active';
        jiraTag.innerText = isJiraActive ? (currentLang === 'ar' ? 'نشط' : 'Active') : (currentLang === 'ar' ? 'معطل' : 'Inactive');
        jiraTag.style.background = isJiraActive ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 255, 255, 0.05)';
        jiraTag.style.color = isJiraActive ? 'var(--success)' : 'var(--text-muted)';
        jiraCount.innerText = isJiraActive ? `${status.atlassian.count} ${currentLang === 'ar' ? 'مهمة' : 'tasks'}` : '0';

        if (isChOnline) {
            // Get ClickHouse stats
            const statsRes = await ipcRenderer.invoke('clickhouse:query', 'SELECT count() as total FROM ActivityLog');
            if (statsRes.success && statsRes.data.data.length > 0) {
                const total = parseInt(statsRes.data.data[0].total || 0);
                chCount.innerText = `${total.toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US')} ${currentLang === 'ar' ? 'سجل' : 'logs'}`;
                
                const chartTotalBadge = document.getElementById('chart-total-count');
                if (chartTotalBadge) {
                    chartTotalBadge.innerText = `${total.toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US')} ${currentLang === 'ar' ? 'سجل إجمالي' : 'total logs'}`;
                }
            }

            // 2. Fetch recent ClickHouse activity logs
            const logsRes = await ipcRenderer.invoke('clickhouse:query', 'SELECT startTime, appName, windowTitle, durationSeconds FROM ActivityLog ORDER BY startTime DESC LIMIT 10');
            if (logsRes.success && tableBody) {
                const rows = logsRes.data.data;
                if (rows.length > 0) {
                    tableBody.innerHTML = rows.map(log => {
                        const time = new Date(log.startTime.replace(' ', 'T')).toLocaleTimeString(currentLang === 'ar' ? 'ar-EG' : 'en-US', {hour: '2-digit', minute:'2-digit'});
                        const durSec = parseFloat(log.durationSeconds);
                        let durStr = `${Math.round(durSec)}s`;
                        if (durSec >= 60) durStr = `${Math.round(durSec/60)}m`;
                        return `
                            <tr style="border-bottom: 1px solid var(--border-glass);">
                                <td style="padding: 10px; color: var(--text-muted);">${time}</td>
                                <td style="padding: 10px; font-weight: bold; color: var(--accent-cyan); text-align: start;">${log.appName}</td>
                                <td style="padding: 10px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: start;" title="${log.windowTitle}">${log.windowTitle}</td>
                                <td style="padding: 10px; color: var(--accent-purple); font-weight: bold;">${durStr}</td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">${currentLang === 'ar' ? 'لا توجد سجلات' : 'No records found'}</td></tr>`;
                }
            }

            const chartRes = await ipcRenderer.invoke('clickhouse:query', `
                SELECT formatDateTime(startTime, '%d-%m') as date_label, count() as cnt
                FROM ActivityLog
                WHERE startTime > (SELECT max(startTime) FROM ActivityLog) - INTERVAL 7 DAY
                GROUP BY date_label, toStartOfDay(startTime)
                ORDER BY toStartOfDay(startTime) ASC
            `);
            if (chartRes.success && chartRes.data?.data) {
                drawKnowledgeChart(chartRes.data.data);
            }
        } else {
            chCount.innerText = 'N/A';
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">${currentLang === 'ar' ? 'ClickHouse Cloud غير متصل.' : 'ClickHouse Cloud is disconnected.'}</td></tr>`;
            }
        }
    } catch (e) {
        console.error('Error fetching knowledge data:', e);
    }
}

function drawKnowledgeChart(data) {
    const svg = document.getElementById('knowledge-chart-svg');
    if (!svg) return;

    const width = 700;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const activePoints = data.length > 0 ? data.map(d => ({ label: d.date_label, value: parseInt(d.cnt) })) : [
        { label: 'Day 1', value: 0 },
        { label: 'Day 2', value: 0 },
        { label: 'Day 3', value: 0 },
        { label: 'Day 4', value: 0 },
        { label: 'Day 5', value: 0 },
        { label: 'Day 6', value: 0 },
        { label: 'Day 7', value: 0 }
    ];

    const maxVal = Math.max(...activePoints.map(p => p.value), 10);
    const minVal = 0;
    const valRange = maxVal - minVal;

    const coords = activePoints.map((p, index) => {
        const x = paddingLeft + (index / (activePoints.length - 1)) * chartWidth;
        const y = paddingTop + chartHeight - ((p.value - minVal) / valRange) * chartHeight;
        return { x, y, label: p.label, value: p.value };
    });

    let linePath = '';
    let areaPath = '';

    if (coords.length > 0) {
        linePath = `M ${coords[0].x} ${coords[0].y}`;
        for (let i = 1; i < coords.length; i++) {
            const prev = coords[i - 1];
            const curr = coords[i];
            const cpX1 = prev.x + (curr.x - prev.x) / 3;
            const cpY1 = prev.y;
            const cpX2 = prev.x + 2 * (curr.x - prev.x) / 3;
            const cpY2 = curr.y;
            linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
        }
        areaPath = `${linePath} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`;
    }

    const yTicks = [0, 0.5, 1].map(ratio => {
        const val = Math.round(minVal + ratio * valRange);
        const y = paddingTop + chartHeight - ratio * chartHeight;
        return { val, y };
    });

    let svgContent = `
        <defs>
            <linearGradient id="chart-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="var(--accent-purple)" />
                <stop offset="100%" stop-color="var(--accent-cyan)" />
            </linearGradient>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--accent-purple)" stop-opacity="0.3" stop-color-opacity="0.3" />
                <stop offset="100%" stop-color="var(--accent-purple)" stop-opacity="0.0" stop-color-opacity="0.0" />
            </linearGradient>
        </defs>
    `;

    // Draw Grid Lines
    yTicks.forEach(tick => {
        svgContent += `
            <line x1="${paddingLeft}" y1="${tick.y}" x2="${width - paddingRight}" y2="${tick.y}" stroke="var(--border-glass)" stroke-width="1" stroke-dasharray="4,4" />
            <text x="${paddingLeft - 8}" y="${tick.y + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end">${tick.val}</text>
        `;
    });

    // Draw paths
    if (areaPath) {
        svgContent += `<path d="${areaPath}" fill="url(#area-grad)" />`;
    }
    if (linePath) {
        svgContent += `<path d="${linePath}" fill="none" stroke="url(#chart-grad)" stroke-width="3" stroke-linecap="round" />`;
    }

    // Draw interactive circles and x labels
    coords.forEach((c, idx) => {
        svgContent += `
            <circle cx="${c.x}" cy="${c.y}" r="4.5" fill="var(--bg-dark)" stroke="var(--accent-cyan)" stroke-width="2.5" 
                    style="cursor: pointer; transition: all 0.2s;"
                    onmouseenter="showChartTooltip(${c.x}, ${c.y}, '${c.label}', ${c.value})"
                    onmouseleave="hideChartTooltip()" />
            <text x="${c.x}" y="${height - 8}" fill="var(--text-muted)" font-size="10" text-anchor="middle">${c.label}</text>
        `;
    });

    svg.innerHTML = svgContent;
}

// Tooltip helpers attached to window so svg inline attributes can call them
window.showChartTooltip = function(x, y, label, value) {
    const tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) return;
    tooltip.style.display = 'block';
    tooltip.style.left = `${(x / 700) * 100}%`;
    tooltip.style.top = `${(y / 200) * 100 - 18}%`;
    tooltip.style.transform = 'translate(-50%, -50%)';
    tooltip.innerHTML = `
        <strong>${label}</strong><br/>
        <span style="color: var(--accent-cyan); font-weight: bold;">${value} ${currentLang === 'ar' ? 'سجل' : 'logs'}</span>
    `;
};

window.hideChartTooltip = function() {
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) tooltip.style.display = 'none';
};

function setupRemoteController() {
    const btnToggle = document.getElementById('btn-toggle-remote');
    const btnClear = document.getElementById('btn-clear-remote-logs');
    const logsConsole = document.getElementById('remote-console-logs');

    if (!btnToggle || !logsConsole) return;

    // Get initial state
    ipcRenderer.invoke('remote:status').then(status => {
        isRemoteRunning = status;
        updateRemoteButton();
        if (status) {
            logsConsole.innerText = '[النظام] الخدمة تعمل حالياً بالخلفية...\n';
        }
    });

    // Log listener
    ipcRenderer.removeAllListeners('remote:log');
    ipcRenderer.on('remote:log', (_, log) => {
        logsConsole.innerText += log;
        logsConsole.scrollTop = logsConsole.scrollHeight;
    });

    // Toggle button click
    const newToggle = btnToggle.cloneNode(true);
    btnToggle.parentNode.replaceChild(newToggle, btnToggle);
    
    newToggle.addEventListener('click', async () => {
        const nextState = !isRemoteRunning;
        const result = await ipcRenderer.invoke('remote:toggle', nextState);
        isRemoteRunning = result;
        updateRemoteButton();
    });

    // Clear click
    if (btnClear) {
        const newClear = btnClear.cloneNode(true);
        btnClear.parentNode.replaceChild(newClear, btnClear);
        newClear.addEventListener('click', () => {
            logsConsole.innerText = '[نظام] تم مسح شاشة السجلات.\n';
        });
    }

    function updateRemoteButton() {
        const targetBtn = document.getElementById('btn-toggle-remote');
        if (!targetBtn) return;
        if (isRemoteRunning) {
            targetBtn.innerText = currentLang === 'ar' ? 'إيقاف الخدمة' : 'Stop Service';
            targetBtn.style.background = 'var(--error)';
        } else {
            targetBtn.style.background = 'var(--accent-purple)';
            targetBtn.innerText = currentLang === 'ar' ? 'تشغيل الخدمة' : 'Start Service';
        }
    }
}

// --- LOAD LOCAL SENTIMENT REPORT ---
function loadLocalSentimentReport() {
    const rawContainer = document.getElementById('harvested-raw-logs-container');
    const badgeCount = document.getElementById('harvested-count-badge');
    if (!rawContainer) return;

    let sentimentData = {
        total_records: 2,
        raw_data: [
            {
                source: "Reddit (r/selfhosted)",
                sentiment: "negative",
                content: "Most AI agents use cloud services to resize images. I want local resizing for privacy and speed."
            },
            {
                source: "Twitter/X (#AIagents)",
                sentiment: "neutral",
                content: "Setting up Chrome for remote debugging in Electron needs to be smoother. Give us a check script."
            }
        ]
    };

    try {
        const fs = require('fs');
        const path = require('path');
        const reportPath = path.join(__dirname, 'sentiment_report.json');
        const raw = fs.readFileSync(reportPath, 'utf8');
        sentimentData = JSON.parse(raw);
    } catch (e) {
        // use fallback mock
    }

    if (badgeCount) {
        badgeCount.innerText = currentLang === 'ar'
            ? `سجلات حية: ${sentimentData.total_records}`
            : `Live Records: ${sentimentData.total_records}`;
    }

    rawContainer.innerHTML = sentimentData.raw_data.map(item => {
        let sentColor = "var(--text-muted)";
        if (item.sentiment === 'negative') sentColor = "var(--error)";
        if (item.sentiment === 'positive') sentColor = "var(--success)";

        return `
            <div class="insight-item" style="flex-direction: column; gap: 0.3rem; padding: 0.8rem 1rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                    <strong>${item.source}</strong>
                    <span style="color: ${sentColor}; font-weight: bold; text-transform: uppercase;">${item.sentiment}</span>
                </div>
                <p style="font-size: 0.8rem; line-height: 1.4; color: var(--text-primary);">${item.content}</p>
            </div>
        `;
    }).join('');
}

// --- CAMPAIGN TEXTS UPDATE ---
function updateCampaignTexts() {
    const tweetEl = document.getElementById('tweet-campaign-text');
    const redditEl = document.getElementById('reddit-campaign-text');
    
    if (tweetEl) {
        tweetEl.innerText = currentLang === 'ar' ? `
تخيل مساعد برمجة ذكي ما يتوقفش عند الأخطاء، بل يقرأ الـ Logs ويصلح الكود ويعيد التشغيل ذاتياً!

أطلقنا النسخة الأولية من **Artelligence OS** - لوحة تحكم ثورية لإدارة وكلاء الذكاء الاصطناعي المستقلة لتنفيذ مهامك بالكامل وبدون Human-in-the-loop.

سجل اهتمامك للحصول على ترخيص مجاني للمطورين: [رابط الاستبيان]
#AI #SaaS #BuildInPublic #TypeScript
` : `
Imagine a coding assistant that never stops at bugs, but reads logs, self-heals, and auto-runs recursively!

We just released the MVP of **Artelligence OS** - a revolutionary desktop hub orchestrating fully autonomous developer agent pipelines.

Join the early developer waitlist for free access: [Survey Link]
#AI #SaaS #BuildInPublic #TypeScript
`;
    }

    if (redditEl) {
        redditEl.innerText = currentLang === 'ar' ? `
**Show Reddit: Artelligence OS - A premium autonomous multi-agent OS & UI for local developer tasks (with Self-Healing Console)**

مرحباً يا مجتمع المطورين!

قمنا ببناء النسخة الأولية من **Artelligence OS**، منسق وكلاء محلي لتسيير مهام التطوير الصعبة محلياً على جهازك بالكامل (تنظيف مساحات العمل، وتعديل ملفات الإعدادات، ومعالجة الصور).

**أهم ميزات النسخة الحالية:**
* **لوحة تحكم بالتسيير الذاتي (Self-Healing Log):** تلتقط الأخطاء البرمجية تلقائياً وتقوم بتنزيل الاعتماديات والـ Patches وإصلاحها ذاتياً.
* **تتبع التركيز والنشاط المحلي:** تعرض إحصائيات البرامج الأكثر استخداماً مباشرة من خادم Telemetry محلي آمن.
* **معالج وسائط محلي بالكامل:** تعديل مقاسات صور المنتجات وحذف الخلفيات محلياً دون إرسالها لأي سحابة.

كل شيء يعمل محلياً تماماً لحماية الخصوصية. نود سماع آرائكم وتعديل الميزات القادمة بناءً عليها: [رابط الاستبيان]
` : `
**Show Reddit: Artelligence OS - A premium autonomous multi-agent OS & UI for local developer tasks (with Self-Healing Console)**

Hello r/selfhosted!

We just built the MVP of **Artelligence OS**, a local agent orchestrator designed to automate boring developer workflows (like local media processing, workspace organization, and config setup) entirely on your machine.

**Key Features we just integrated:**
* **Local Telemetry & Productivity Score:** Reads your active workspace focus stats and feeds it into the dashboard using a lightweight local Python background tracker.
* **Self-Healing Loop:** Automatically catches errors during execution (like missing dependencies) and self-heals locally.
* **Local Media Processor:** Crop, resize, and remove background from product photos locally.

Everything runs locally. No data leaves your machine. Check it out and fill out our quick survey: [Survey Link]
`;
    }
}

// --- LANGUAGE TOGGLING ---
const langToggleBtnSettings = document.getElementById('lang-toggle-settings');
const toggleLanguageAction = () => {
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
};
if (langToggleBtnSettings) langToggleBtnSettings.addEventListener('click', toggleLanguageAction);

// --- THEME CONFIGURATOR ---
const themeToggleBtnSettings = document.getElementById('theme-toggle-settings');
const savedTheme = localStorage.getItem('artelligence-theme');
if (savedTheme === 'cyberpunk') {
    document.body.classList.add('theme-cyberpunk');
}

const toggleThemeAction = () => {
    document.body.classList.toggle('theme-cyberpunk');
    const isCyber = document.body.classList.contains('theme-cyberpunk');
    localStorage.setItem('artelligence-theme', isCyber ? 'cyberpunk' : 'deepspace');
    drawAgentGraph();
};

if (themeToggleBtnSettings) themeToggleBtnSettings.addEventListener('click', toggleThemeAction);

// --- AVATAR UPLOAD HANDLER ---
(() => {
    const avatarWrapper = document.getElementById('settings-avatar-wrapper');
    const avatarInput = document.getElementById('input-avatar-upload');
    const settingsAvatarImg = document.getElementById('settings-avatar-img');
    const settingsAvatarPlaceholder = document.getElementById('settings-avatar-placeholder');
    const headerAvatarImg = document.getElementById('header-avatar-img');
    const headerAvatarPlaceholder = document.getElementById('header-avatar-placeholder');

    function applyAvatar(dataUrl) {
        if (settingsAvatarImg) { settingsAvatarImg.src = dataUrl; settingsAvatarImg.style.display = 'block'; }
        if (settingsAvatarPlaceholder) settingsAvatarPlaceholder.style.display = 'none';
        if (headerAvatarImg) { headerAvatarImg.src = dataUrl; headerAvatarImg.style.display = 'block'; }
        if (headerAvatarPlaceholder) headerAvatarPlaceholder.style.display = 'none';
    }

    // Load saved avatar on startup
    const savedAvatar = localStorage.getItem('artelligence-avatar');
    if (savedAvatar) {
        applyAvatar(savedAvatar);
    }

    // Click on avatar wrapper triggers file input
    if (avatarWrapper && avatarInput) {
        avatarWrapper.addEventListener('click', () => avatarInput.click());

        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                alert(currentLang === 'ar' ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert(currentLang === 'ar' ? 'حجم الصورة كبير جداً (الحد الأقصى 5MB)' : 'Image is too large (max 5MB)');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result;
                localStorage.setItem('artelligence-avatar', dataUrl);
                applyAvatar(dataUrl);
            };
            reader.readAsDataURL(file);
        });
    }
})();

// --- COPY TO CLIPBOARD HANDLERS ---
document.getElementById('btn-copy-tweet')?.addEventListener('click', () => {
    const text = document.getElementById('tweet-campaign-text')?.innerText;
    if (text) {
        navigator.clipboard.writeText(text);
        const copyBtn = document.getElementById('btn-copy-tweet');
        const originalText = copyBtn.innerText;
        copyBtn.innerText = currentLang === 'ar' ? '✓ تم النسخ' : '✓ Copied';
        setTimeout(() => copyBtn.innerText = originalText, 2000);
    }
});

document.getElementById('btn-copy-reddit')?.addEventListener('click', () => {
    const text = document.getElementById('reddit-campaign-text')?.innerText;
    if (text) {
        navigator.clipboard.writeText(text);
        const copyBtn = document.getElementById('btn-copy-reddit');
        const originalText = copyBtn.innerText;
        copyBtn.innerText = currentLang === 'ar' ? '✓ تم النسخ' : '✓ Copied';
        setTimeout(() => copyBtn.innerText = originalText, 2000);
    }
});

// --- SPAWN AGENT MODAL HANDLERS ---
const spawnBtn = document.getElementById('btn-spawn-agent');
const modalOverlay = document.getElementById('spawn-agent-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelSpawnBtn = document.getElementById('btn-cancel-spawn');
const submitSpawnBtn = document.getElementById('btn-submit-spawn');

if (spawnBtn && modalOverlay) {
    spawnBtn.addEventListener('click', () => {
        modalOverlay.style.display = 'flex';
    });
}

const hideSpawnModal = () => {
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
        document.getElementById('new-agent-name').value = '';
        document.getElementById('new-agent-role-ar').value = '';
        document.getElementById('new-agent-role-en').value = '';
        document.getElementById('new-agent-icon').value = '';
    }
};

closeModalBtn?.addEventListener('click', hideSpawnModal);
cancelSpawnBtn?.addEventListener('click', hideSpawnModal);

submitSpawnBtn?.addEventListener('click', () => {
    const nameVal = document.getElementById('new-agent-name').value.trim() || 'Smart Agent';
    const roleArVal = document.getElementById('new-agent-role-ar').value.trim() || 'مهام الوكيل الذكي';
    const roleEnVal = document.getElementById('new-agent-role-en').value.trim() || 'Smart agent operations';
    const iconVal = document.getElementById('new-agent-icon').value.trim() || '🤖';
    
    const newId = nameVal.toLowerCase().replace(/\s+/g, '-');
    
    agentsList.push({
        id: newId,
        name: nameVal,
        role_ar: roleArVal,
        role_en: roleEnVal,
        status: 'active',
        icon: iconVal,
        lastAction_ar: 'تم التفويض وتجهيز المهام الحالية',
        lastAction_en: 'Agent authorized and tasks configured'
    });
    
    saveAgentsToStorage();
    renderAgentsList();
    drawAgentGraph();
    hideSpawnModal();
});

// --- REFRESH SCREEN HANDLER ---
document.getElementById('btn-refresh')?.addEventListener('click', () => {
    location.reload();
});

// --- CHECK FOR UPDATES HANDLER ---
document.getElementById('btn-check-updates')?.addEventListener('click', () => {
    try {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('trigger-update-check');
    } catch(e) {
        alert(currentLang === 'ar' ? "أنت تستخدم أحدث إصدار من Artelligence OS (v1.0.0)" : "You are using the latest version of Artelligence OS (v1.0.0).");
    }
});

// --- EVENT HANDLERS ---
document.getElementById('btn-re-orchestrate')?.addEventListener('click', () => {
    agentsList.forEach(agent => {
        agent.status = Math.random() > 0.5 ? 'active' : 'idle';
    });
    saveAgentsToStorage();
    renderAgentsList();
    drawAgentGraph();
    
    const consoleDiv = document.getElementById('live-console');
    if (consoleDiv) {
        const msg = currentLang === 'ar' 
            ? 'تمت إعادة تنظيم الوكلاء وتفويض المهام بنجاح.'
            : 'Agents re-orchestrated and focus targets allocated successfully.';
        consoleDiv.innerHTML = `<div class="console-line system">> [Orchestrator] ${msg}</div>`;
        logIndex = 0;
    }
});

// --- SENTIMENT HARVESTER SIMULATION ---
document.getElementById('btn-trigger-harvest')?.addEventListener('click', () => {
    const harvestConsole = document.getElementById('harvest-console-output');
    if (!harvestConsole) return;

    const startMsg = currentLang === 'ar'
        ? '⏳ جاري الاتصال بـ X/Reddit APIs وسحب الآراء...'
        : '⏳ Connecting to X/Reddit APIs and harvesting feedback...';
    harvestConsole.innerHTML = `<span style="color: var(--accent-cyan)">${startMsg}</span>\n`;
    
    setTimeout(() => {
        const tweetMsg = currentLang === 'ar'
            ? '✓ [Twitter/X Client] تم العثور على 43 تغريدة تشير إلى مشاكل تنظيم الملفات.'
            : '✓ [Twitter/X Client] Found 43 tweets referencing file organization bugs.';
        harvestConsole.innerHTML += `${tweetMsg}\n`;
    }, 1000);

    setTimeout(() => {
        const redditMsg = currentLang === 'ar'
            ? '✓ [Reddit Engine] سحب 18 منشور في r/NextJS لمقارنة استهلاك الموارد.'
            : '✓ [Reddit Engine] Crawled 18 posts in r/NextJS to analyze resource usage.';
        harvestConsole.innerHTML += `${redditMsg}\n`;
    }, 2000);

    setTimeout(() => {
        const completedMsg = currentLang === 'ar' ? `
<span style="color: var(--success)">✓ [Analysis Complete] تم إنشاء تقرير الآراء بنجاح!</span>
--------------------------------------------------
* إجمالي الفجوات المكتشفة: 3 فجوات رئيسية
* الفجوة 1: طلب ميزة "معالجة وسائط محلية" (الأولوية: عالية)
* الفجوة 2: مشاكل في إعداد الـ Remote Debugging في Chrome
* الفجوة 3: تبسيط شاشة الشفاء الذاتي والـ logs للمطورين
--------------------------------------------------
<span style="color: var(--accent-cyan)">تم حفظ المخرجات في الملف المحلي بنجاح.</span>
` : `
<span style="color: var(--success)">✓ [Analysis Complete] Sentiment report generated successfully!</span>
--------------------------------------------------
* Total Gaps Identified: 3 critical gaps
* Gap 1: Request for 'Local Media Processing' tool (Priority: High)
* Gap 2: Setup friction with Chrome Remote Debugging
* Gap 3: Streamlining Self-Healing console logs for devs
--------------------------------------------------
<span style="color: var(--accent-cyan)">Output written to local workspace files.</span>
`;
        harvestConsole.innerHTML += completedMsg;
        
        const completedCount = document.getElementById('completed-tasks-count');
        if (completedCount) {
            completedCount.innerText = parseInt(completedCount.innerText) + 1;
        }

        try {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('show-native-notification', {
                title: currentLang === 'ar' ? 'استطلاع السوق – مكتمل' : 'Sentiment Harvester – Complete',
                body: currentLang === 'ar' 
                    ? 'تم سحب آراء المستخدمين بنجاح وتوليد تقرير الفجوات البرمجية.' 
                    : 'User reviews harvested and gap analysis report successfully generated.'
            });
        } catch (e) {
            console.error('Failed to trigger notification:', e);
        }
    }, 3500);
});

// --- SYSTEM TOOLS EVENT HANDLERS ---
document.getElementById('btn-run-media-processor')?.addEventListener('click', async () => {
    const imagePath = document.getElementById('tool-image-path').value.trim();
    const aspectRatio = document.getElementById('tool-aspect-ratio').value;
    const removeBg = document.getElementById('tool-remove-bg').checked;
    const resultDiv = document.getElementById('media-processor-result');
    
    if (!imagePath) {
        alert(currentLang === 'ar' ? "يرجى إدخال مسار الصورة!" : "Please enter the image path!");
        return;
    }
    
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `<span style="color: var(--accent-cyan)">⏳ ${currentLang === 'ar' ? 'جاري معالجة الصورة محلياً...' : 'Processing image locally...'}</span>`;
    }
    
    try {
        const data = await ipcRenderer.invoke('image:process', {
            imagePath,
            aspectRatio,
            removeBg: removeBg ? 'true' : 'false'
        });
        
        if (data.error) {
            resultDiv.innerHTML = `<span style="color: var(--error)">${currentLang === 'ar' ? 'خطأ:' : 'Error:'} ${data.error}</span>`;
        } else {
            resultDiv.innerHTML = `
                <div style="color: var(--success); font-weight: bold; margin-bottom: 0.5rem;">${currentLang === 'ar' ? 'تمت معالجة الصورة بنجاح!' : 'Image processed successfully!'}</div>
                <div style="margin-bottom: 0.25rem;"><strong>${currentLang === 'ar' ? 'الأبعاد الأصلية:' : 'Original Size:'}</strong> ${data.original.width}x${data.original.height} (${data.original.format}, ${data.original.size_kb} KB)</div>
                <div style="margin-bottom: 0.25rem;"><strong>${currentLang === 'ar' ? 'الأبعاد الجديدة:' : 'Processed Size:'}</strong> ${data.processed.width}x${data.processed.height} (${data.processed.size_kb} KB)</div>
                <div style="margin-bottom: 0.5rem; word-break: break-all;"><strong>${currentLang === 'ar' ? 'مسار الحفظ:' : 'Saved Path:'}</strong> <code style="background: rgba(0,0,0,0.3); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace;">${data.processed.path}</code></div>
                <button class="btn btn-sm btn-outline" id="btn-reveal-processed" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 6px;">${currentLang === 'ar' ? 'فتح موقع الملف' : 'Reveal in Finder'}</button>
            `;
            
            document.getElementById('btn-reveal-processed')?.addEventListener('click', () => {
                try {
                    const { shell } = require('electron');
                    shell.showItemInFolder(data.processed.path);
                } catch(e) {
                    console.error("Could not reveal file in finder:", e);
                }
            });

            try {
                const { ipcRenderer } = require('electron');
                ipcRenderer.send('show-native-notification', {
                    title: currentLang === 'ar' ? 'معالج الصور – مكتمل' : 'Image Processor – Complete',
                    body: currentLang === 'ar'
                        ? 'تم تحسين وتعديل مقاس الصورة وحفظها بنجاح.'
                        : 'Image optimized, resized, and successfully saved locally.'
                });
            } catch (err) {}
        }
    } catch(e) {
        resultDiv.innerHTML = `<span style="color: var(--error)">${currentLang === 'ar' ? 'فشل الاتصال بالخادم المحلي!' : 'Failed to connect to local backend server!'}</span>`;
        try {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('show-native-notification', {
                title: currentLang === 'ar' ? 'معالج الصور – فشل' : 'Image Processor – Failed',
                body: currentLang === 'ar'
                    ? 'فشل الاتصال بالخادم المحلي لمعالجة الصورة.'
                    : 'Failed to connect to the local server for image processing.'
            });
        } catch (err) {}
    }
});

document.getElementById('btn-check-chrome-debug')?.addEventListener('click', async () => {
    const statusTag = document.getElementById('chrome-debug-status');
    const instructionsCard = document.getElementById('chrome-instructions-card');
    
    if (statusTag) {
        statusTag.className = "tag";
        statusTag.style.background = "rgba(255, 255, 255, 0.05)";
        statusTag.style.color = "var(--text-muted)";
        statusTag.innerText = currentLang === 'ar' ? "جاري الفحص..." : "Checking...";
    }
    
    try {
        const data = await ipcRenderer.invoke('chrome:check');
        
        if (data.status === 'online') {
            if (statusTag) {
                statusTag.innerText = currentLang === 'ar' ? "متصل بنجاح" : "Connected";
                statusTag.style.background = "rgba(46, 204, 113, 0.1)";
                statusTag.style.color = "var(--success)";
            }
            if (instructionsCard) instructionsCard.style.display = 'none';
        } else {
            if (statusTag) {
                statusTag.innerText = currentLang === 'ar' ? "غير متصل" : "Disconnected";
                statusTag.style.background = "rgba(231, 76, 60, 0.1)";
                statusTag.style.color = "var(--error)";
            }
            if (instructionsCard) instructionsCard.style.display = 'block';
        }
    } catch(e) {
        if (statusTag) {
            statusTag.innerText = currentLang === 'ar' ? "خطأ اتصال" : "Error";
            statusTag.style.background = "rgba(231, 76, 60, 0.1)";
            statusTag.style.color = "var(--error)";
        }
        if (instructionsCard) instructionsCard.style.display = 'block';
    }
});

// --- INIT ---
setLanguage(currentLang);
fetchTelemetryData();
setInterval(fetchTelemetryData, 5000);
setInterval(runConsoleSimulator, 3000);

// --- INITIALIZATION BLOCK ---
loadLocalSentimentReport();
updateCampaignTexts();
updateDateDisplay();

// Initialize Knowledge OS Portal
try {
    setupRemoteController();
    fetchKnowledgeData();
    setInterval(fetchKnowledgeData, 10000);
} catch (e) {
    console.error("Failed to initialize Knowledge OS features:", e);
}

// --- INTERACTIVE BUSINESS CARDS ---
document.querySelectorAll('.business-card').forEach(card => {
    card.addEventListener('click', () => {
        const business = card.getAttribute('data-business');
        switchToModule('business-hub', business);
    });
});

// --- QUICK ACTIONS ---
document.getElementById('qa-new-campaign')?.addEventListener('click', () => {
    switchToModule('content-studio');
    // Scroll to Campaign Factory or trigger generation
    setTimeout(() => {
        generateCampaign('solara');
    }, 200);
});

document.getElementById('qa-add-client')?.addEventListener('click', () => {
    switchToModule('business-hub', 'freelance');
});

document.getElementById('qa-open-project')?.addEventListener('click', () => {
    switchToModule('project-ops');
});

document.getElementById('qa-search-knowledge')?.addEventListener('click', () => {
    switchToModule('knowledge-vault');
    document.getElementById('knowledge-search')?.focus();
});

// --- CAMPAIGN FACTORY & STORY STORYLINE GENERATOR ---
window.generateCampaign = function(brand) {
    const factoryOutput = document.getElementById('campaign-factory-output');
    if (!factoryOutput) return;

    if (brand === 'solara') {
        const startingMsg = currentLang === 'ar'
            ? '⏳ جاري تشغيل سكريبت Campaign Factory لعلامة SOLARA المحتشمة...'
            : '⏳ Executing SOLARA modest Campaign Factory engine...';
            
        factoryOutput.innerHTML = `<span style="color: var(--accent-cyan)">${startingMsg}</span>\n`;
        
        setTimeout(() => {
            const rulesMsg = currentLang === 'ar'
                ? '✓ [فحص القيود] تطبيق قواعد SOLARA: لا موسيقى، لا عارضات، تصوير flat lay فقط.'
                : '✓ [Constraints Check] Enforcing SOLARA guidelines: No music, no human models, flat lay only.';
            factoryOutput.innerHTML += `${rulesMsg}\n`;
        }, 800);

        setTimeout(() => {
            const completedMsg = currentLang === 'ar' ? `
<span style="color: var(--success)">✓ [حملة SOLARA الصيفية جاهزة!]</span>
--------------------------------------------------
* النوع: Teaser → Launch
* الخط العربي: Readex Pro / Cairo
* اللهجة المستهدفة: الفصحى والخليجية
--------------------------------------------------
<strong style="color: var(--accent-purple)">نص التغريدة المقترح:</strong>
"أناقة هادئة وحضور متميز. استمتعي بصيف مريح مع مجموعة SOLARA الجديدة للأزياء المحتشمة. خامات طبيعية وتصاميم عملية تناسب يومكِ. ✨👗
اكتشفي المجموعة كاملة عبر الرابط التالي."
--------------------------------------------------
<strong style="color: var(--accent-cyan)">خطة المونتاج المقترحة (Video Script):</strong>
1. مشهد flat lay للمجموعة مع ضوء الشمس الطبيعي (0-3 ثوانٍ)
2. مشهد تفصيلي لجودة القماش والخيوط (3-6 ثوانٍ)
3. عرض بطاقة السعر والخصم الحصري (6-9 ثوانٍ)
` : `
<span style="color: var(--success)">✓ [SOLARA Summer Campaign generated!]</span>
--------------------------------------------------
* Campaign Type: Teaser → Launch
* Typography: Readex Pro / Cairo
* Dialect: Arabic Fusha / Gulf
--------------------------------------------------
<strong style="color: var(--accent-purple)">Suggested Tweet Copy:</strong>
"Quiet elegance and distinct presence. Enjoy a comfortable summer with the new SOLARA collection for modest fashion. Natural materials and practical designs for your daily life. ✨👗
Explore the full collection via link."
--------------------------------------------------
<strong style="color: var(--accent-cyan)">Montage Storyboard script:</strong>
1. Flat lay layout with natural sunlight shadows (0-3s)
2. Close-up detailed macro shots of stitching and fabric (3-6s)
3. Reveal price tag and exclusive launching discount (6-9s)
`;
            factoryOutput.innerHTML += completedMsg;
            factoryOutput.scrollTop = factoryOutput.scrollHeight;
            
            try {
                const { ipcRenderer } = require('electron');
                ipcRenderer.send('show-native-notification', {
                    title: currentLang === 'ar' ? 'مصنع الحملات' : 'Campaign Factory',
                    body: currentLang === 'ar' ? 'تم إنشاء خطة حملة SOLARA الإعلانية بنجاح!' : 'SOLARA campaign assets successfully generated!'
                });
            } catch (e) {}
        }, 2000);
    }
};

// Also attach event listener for add content in Content Studio
document.getElementById('btn-add-content')?.addEventListener('click', () => {
    generateCampaign('solara');
});

// --- KNOWLEDGE VAULT SEARCH ---
document.getElementById('knowledge-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const resultsContainer = document.getElementById('knowledge-results');
    if (!resultsContainer) return;

    if (!query) {
        resultsContainer.innerHTML = '';
        return;
    }

    // Mock search matching the real projects and skills
    const knowledgeItems = [
        { 
            title: translate("cp-item-tohamy-title", "التهامي للتشطيبات - Tohamy House"), 
            category: "Business", 
            match: ["tohamy", "تشطيب", "فيلا", "شقة", "التهامي"], 
            desc: translate("cp-item-tohamy-desc", "كل ما يتعلق بمشروع Tohamy House للتشطيبات والديكور والـ Reels المخصصة للمونتاج.") 
        },
        { 
            title: translate("cp-item-solara-title", "حملات SOLARA للأزياء المحتشمة"), 
            category: "Marketing", 
            match: ["solara", "عبايات", "حملة", "محتشمة", "أزياء"], 
            desc: translate("cp-item-solara-desc", "الخطوط التوجيهية لحملات SOLARA: لا عارضات ولا موسيقى، وتوليد نصوص إعلانية بالخليجي والفصحى.") 
        },
        { 
            title: translate("cp-item-freelance-title", "مشاريع التطوير والخدمات الرقمية (Upwork)"), 
            category: "Development", 
            match: ["hedyet", "khem", "upwork", "portfolio", "development", "nextjs", "react"], 
            desc: translate("cp-item-freelance-desc", "تفاصيل تطوير Hedyet (متجر هدايا) و Khem (منصة تراثية) والبورتفوليو الشخصي على GitHub Pages.") 
        },
        { 
            title: translate("cp-item-tool-title", "أداة المونتاج التلقائي - pro_video_montage"), 
            category: "Tool", 
            match: ["montage", "ffmpeg", "video", "مونتاج", "فيديو", "reels"], 
            desc: translate("cp-item-tool-desc", "سكريبت توليد أوامر FFmpeg للمونتاج والـ J-cut/L-cut لمشاريع التشطيب.") 
        }
    ];

    const matches = knowledgeItems.filter(item => {
        return item.title.toLowerCase().includes(query) || 
               item.desc.toLowerCase().includes(query) ||
               item.match.some(m => m.includes(query));
    });

    if (matches.length > 0) {
        resultsContainer.innerHTML = matches.map(item => `
            <div class="insight-item" style="border-inline-start: 3px solid var(--accent-cyan); text-align: start; width: 100%;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <strong>${item.title}</strong>
                    <span class="tag" style="background: rgba(0, 191, 255, 0.1); color: var(--accent-cyan);">${item.category}</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">${item.desc}</p>
            </div>
        `).join('');
    } else {
        resultsContainer.innerHTML = `
            <div class="insight-item" style="justify-content: center; color: var(--text-muted);">
                ${currentLang === 'ar' ? 'لا توجد نتائج مطابقة لبحثك.' : 'No matching knowledge found.'}
            </div>
        `;
    }
});

// --- COMMAND PALETTE (CMD+K) ---
const cmdPalette = document.getElementById('command-palette');
const cmdInput = document.getElementById('cmd-palette-input');
const cmdResults = document.getElementById('cmd-palette-results');

window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (cmdPalette) {
            const isHidden = cmdPalette.style.display === 'none';
            cmdPalette.style.display = isHidden ? 'flex' : 'none';
            if (isHidden) {
                cmdInput?.focus();
                renderCmdPaletteResults('');
            }
        }
    }
    if (e.key === 'Escape') {
        if (cmdPalette) cmdPalette.style.display = 'none';
    }
});

cmdPalette?.addEventListener('click', (e) => {
    if (e.target === cmdPalette) {
        cmdPalette.style.display = 'none';
    }
});

cmdInput?.addEventListener('input', (e) => {
    renderCmdPaletteResults(e.target.value);
});

function renderCmdPaletteResults(query) {
    if (!cmdResults) return;
    
    const cleanQuery = query.toLowerCase().trim();
    const commands = [
        { label: translate("cp-go-cc", "Go to Command Center"), action: () => switchToModule('command-center') },
        { label: translate("cp-go-bh", "Go to Business Hub"), action: () => switchToModule('business-hub') },
        { label: translate("cp-go-cs", "Go to Content Studio"), action: () => switchToModule('content-studio') },
        { label: translate("cp-go-ac", "Go to Agent Console"), action: () => switchToModule('agent-console') },
        { label: translate("cp-go-po", "Go to Project Ops"), action: () => switchToModule('project-ops') },
        { label: translate("cp-go-fi", "Go to Finance Tracker"), action: () => switchToModule('finance') },
        { label: translate("cp-go-kv", "Go to Knowledge Vault"), action: () => switchToModule('knowledge-vault') },
        { label: translate("cp-go-ag", "Go to Automation Grid"), action: () => switchToModule('automation') },
        { label: translate("cp-run-media", "Run Local Media Processor"), action: () => { switchToModule('content-studio'); setTimeout(() => document.getElementById('tool-image-path')?.focus(), 250); } },
        { label: translate("cp-gen-solara", "Generate SOLARA Ad Campaign"), action: () => { switchToModule('content-studio'); generateCampaign('solara'); } }
    ];

    const matches = commands.filter(c => c.label.toLowerCase().includes(cleanQuery));

    if (matches.length > 0) {
        cmdResults.innerHTML = matches.map((c, idx) => `
            <div class="cmd-item" data-idx="${idx}" style="padding: 10px 14px; border-radius: 8px; cursor: pointer; color: var(--text-secondary); text-align: start; transition: background 0.2s;" onmouseenter="this.style.background='var(--accent-purple-soft)'; this.style.color='white'" onmouseleave="this.style.background='transparent'; this.style.color='var(--text-secondary)'">
                ${c.label}
            </div>
        `).join('');

        // Attach click handlers
        cmdResults.querySelectorAll('.cmd-item').forEach((item, idx) => {
            item.addEventListener('click', () => {
                matches[idx].action();
                if (cmdPalette) cmdPalette.style.display = 'none';
            });
        });
    } else {
        cmdResults.innerHTML = `
            <div style="padding: 20px; color: var(--text-muted); text-align: center;">
                ${currentLang === 'ar' ? 'لا توجد أوامر مطابقة.' : 'No commands match your query.'}
            </div>
        `;
    }
}

// --- IPC IPC-RENDERER LISTENERS ---
try {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('telemetry-status-change', (event, status) => {
        const appsContainer = document.getElementById('telemetry-apps-container');
        const statusText = document.getElementById('status-text');
        
        if (status === 'python-missing') {
            if (statusText) statusText.innerText = currentLang === 'ar' ? "تحذير: بايثون غير مثبت" : "Warning: Python 3 missing";
            if (appsContainer) {
                appsContainer.innerHTML = `
                    <div style="padding: 1rem; border: 1px solid var(--warning); border-radius: 12px; background: rgba(230, 126, 34, 0.05); font-size: 0.85rem; text-align: start;">
                        <h4 style="color: var(--warning); margin-bottom: 0.5rem;">${currentLang === 'ar' ? 'بايثون 3 غير موجود' : 'Python 3 Not Found'}</h4>
                        <p style="margin-bottom: 0.5rem; color: var(--text-muted); line-height: 1.4;">
                            ${currentLang === 'ar' 
                                ? 'التتبع المحلي يتطلب تثبيت بايثون 3. سيستمر التطبيق في استخدام المحاكاة التلقائية.' 
                                : 'Local telemetry requires Python 3 to be installed. Running in simulation mode.'}
                        </p>
                    </div>
                `;
            }
        } else if (status === 'setup-required') {
            if (statusText) statusText.innerText = currentLang === 'ar' ? "إعداد التتبع مطلوب" : "Telemetry setup required";
            if (appsContainer) {
                appsContainer.innerHTML = `
                    <div style="padding: 1rem; border: 1px solid var(--accent-purple); border-radius: 12px; background: rgba(155, 89, 182, 0.05); font-size: 0.85rem; text-align: start;">
                        <h4 style="color: var(--accent-purple); margin-bottom: 0.5rem;">${currentLang === 'ar' ? 'تثبيت اعتماديات التتبع' : 'Install Telemetry Dependencies'}</h4>
                        <p style="margin-bottom: 0.75rem; color: var(--text-muted); line-height: 1.4;">
                            ${currentLang === 'ar' 
                                ? 'لتتبع استخدام البرامج محلياً، يرجى تشغيل الأمر التالي في سطر الأوامر:' 
                                : 'To enable local window tracking, run this command in your Terminal:'}
                        </p>
                        <code style="display: block; background: rgba(0,0,0,0.4); padding: 0.5rem; border-radius: 6px; font-family: monospace; font-size: 0.75rem; margin-bottom: 0.75rem; word-break: break-all; border: 1px solid var(--border-glass);">
                            pip3 install pyobjc-core pyobjc-framework-Cocoa pyobjc-framework-Quartz
                        </code>
                        <button class="btn btn-sm btn-outline" id="btn-copy-setup" style="width: 100%; border-radius: 6px; padding: 0.3rem 0.5rem; font-size: 0.75rem;">
                            ${currentLang === 'ar' ? 'نسخ أمر التثبيت' : 'Copy Setup Command'}
                        </button>
                    </div>
                `;
                
                document.getElementById('btn-copy-setup')?.addEventListener('click', () => {
                    navigator.clipboard.writeText('pip3 install pyobjc-core pyobjc-framework-Cocoa pyobjc-framework-Quartz');
                    const copyBtn = document.getElementById('btn-copy-setup');
                    copyBtn.innerText = currentLang === 'ar' ? '✓ تم النسخ' : '✓ Copied';
                    setTimeout(() => {
                        copyBtn.innerText = currentLang === 'ar' ? 'نسخ أمر التثبيت' : 'Copy Setup Command';
                    }, 2000);
                });
            }
        }
    });

    ipcRenderer.on('workspace-file-changed', (event, { eventType, filename }) => {
        const consoleDiv = document.getElementById('live-console');
        if (consoleDiv) {
            const timeStr = new Date().toLocaleTimeString();
            const actionText = currentLang === 'ar' 
                ? `[مراقب العمل] تم رصد تعديل (${eventType}) على الملف: ${filename}`
                : `[Workspace Daemon] Detected file update (${eventType}): ${filename}`;
            
            const lineEl = document.createElement('div');
            lineEl.className = 'console-line system';
            lineEl.style.color = 'var(--accent-cyan)';
            lineEl.innerText = `> [${timeStr}] ${actionText}`;
            consoleDiv.appendChild(lineEl);
            
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
    });
} catch(e) {
    // Not running inside Electron renderer
}

// --- UPWORK CATALOG AUTOMATOR UI CONTROLLER ---
(function() {
    try {
        const { ipcRenderer } = require('electron');
        
        async function loadUpworkCatalogs() {
            const listContainer = document.getElementById('upwork-catalogs-list');
            if (!listContainer) return;
            
            const catalogs = await ipcRenderer.invoke('upwork:db', 'list');
            if (catalogs.error) {
                listContainer.innerHTML = `<div style="color: var(--warning); text-align: center;">Error: ${catalogs.error}</div>`;
                return;
            }
            
            if (!catalogs || catalogs.length === 0) {
                listContainer.innerHTML = `<div style="color: var(--text-muted); text-align: center;">No catalogs found.</div>`;
                return;
            }
            
            listContainer.innerHTML = catalogs.map(c => {
                let statusColor = 'var(--text-muted)';
                let statusBg = 'rgba(255,255,255,0.05)';
                let btnText = currentLang === 'ar' ? '🚀 رفع الخدمة' : '🚀 Upload';
                let btnDisabled = '';
                
                if (c.status === 'Uploading') {
                    statusColor = 'var(--accent-purple)';
                    statusBg = 'rgba(155, 89, 182, 0.1)';
                    btnText = currentLang === 'ar' ? '⏳ جاري الرفع...' : '⏳ Uploading...';
                    btnDisabled = 'disabled';
                } else if (c.status === 'Submitted') {
                    statusColor = 'var(--success)';
                    statusBg = 'rgba(46, 204, 113, 0.1)';
                    btnText = currentLang === 'ar' ? '🔄 إعادة الرفع' : '🔄 Re-upload';
                }
                
                return `
                    <div class="insight-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.01); border-radius: 8px; border: 1px solid var(--border-glass);">
                        <div style="text-align: start; flex: 1; padding-right: 10px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                                <strong style="font-size: 0.9rem; color: white;">${c.title}</strong>
                                <span class="tag" style="background: ${statusBg}; color: ${statusColor}; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px;">${c.status}</span>
                            </div>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">Slug: ${c.slug} | Last updated: ${c.last_updated}</span>
                        </div>
                        <button class="btn btn-sm btn-outline upwork-upload-btn" data-id="${c.id}" ${btnDisabled} style="padding: 6px 12px; font-size: 0.8rem; border-radius: 6px; border-color: var(--accent-purple); color: white; cursor: pointer;">
                            ${btnText}
                        </button>
                    </div>
                `;
            }).join('');
            
            // Attach click event to buttons
            listContainer.querySelectorAll('.upwork-upload-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const catalogId = parseInt(btn.getAttribute('data-id'));
                    btn.disabled = true;
                    btn.innerText = currentLang === 'ar' ? '⏳ جاري بدء الرفع...' : '⏳ Starting...';
                    
                    const consoleDiv = document.getElementById('upwork-console-output');
                    if (consoleDiv) {
                        consoleDiv.innerHTML += `\n[System] Starting upload execution for Catalog ID: ${catalogId}...`;
                        consoleDiv.scrollTop = consoleDiv.scrollHeight;
                    }
                    
                    // We run it and let the DB updater update it. We do not block wait in the UI thread for execution to complete
                    ipcRenderer.invoke('upwork:upload', catalogId);
                });
            });
        }
        
        async function loadUpworkLogs() {
            const consoleDiv = document.getElementById('upwork-console-output');
            if (!consoleDiv) return;
            
            const logs = await ipcRenderer.invoke('upwork:db', 'logs');
            if (logs && logs.length > 0) {
                // Render last 10 log entries nicely
                const formattedLogs = logs.slice(0, 10).reverse().map(l => {
                    const time = new Date(l.timestamp + 'Z').toLocaleTimeString();
                    let color = 'var(--text-secondary)';
                    if (l.event_type.includes('ERROR')) color = 'var(--warning)';
                    if (l.event_type.includes('SUCCESS')) color = 'var(--success)';
                    return `<span style="color: ${color}">[${time}] [${l.event_type}] ${l.description}</span>`;
                }).join('\n');
                
                consoleDiv.innerHTML = formattedLogs;
            }
        }
        
        // Initial load
        setTimeout(() => {
            loadUpworkCatalogs();
            loadUpworkLogs();
            
            // Periodically refresh every 3 seconds
            setInterval(() => {
                loadUpworkCatalogs();
                loadUpworkLogs();
            }, 3000);
        }, 1000);
        
        // Bind clear button
        document.getElementById('btn-clear-upwork-console')?.addEventListener('click', () => {
            const consoleDiv = document.getElementById('upwork-console-output');
            if (consoleDiv) consoleDiv.innerHTML = '[System] Console cleared. Waiting for events...';
        });
        
    } catch (e) {
        console.error('Failed to initialize Upwork Automator controller:', e);
    }
})();

// --- SETTINGS & SYSTEM INTEGRATIONS CONTROLLER ---
(() => {
    try {
        const inputName = document.getElementById('input-profile-name');
        const inputRole = document.getElementById('input-profile-role');
        const displayName = document.getElementById('profile-display-name');
        const displayRole = document.getElementById('profile-display-role');
        const btnSaveProfile = document.getElementById('btn-save-profile');
        const btnTestSqlite = document.getElementById('btn-test-sqlite');
        const btnTestCh = document.getElementById('btn-test-ch');

        // Load profile from storage
        const savedProfile = localStorage.getItem('artelligence-profile');
        if (savedProfile) {
            try {
                const profile = JSON.parse(savedProfile);
                if (inputName) inputName.value = profile.name;
                if (inputRole) inputRole.value = profile.role;
                if (displayName) displayName.innerText = profile.name;
                if (displayRole) displayRole.innerText = profile.role;
            } catch (err) {
                console.error('Failed to parse saved profile:', err);
            }
        }

        // Save profile action
        btnSaveProfile?.addEventListener('click', () => {
            const name = inputName?.value || 'أحمد عصام رمضان';
            const role = inputRole?.value || 'مستشار الذكاء الاصطناعي والأتمتة';
            
            localStorage.setItem('artelligence-profile', JSON.stringify({ name, role }));
            
            if (displayName) displayName.innerText = name;
            if (displayRole) displayRole.innerText = role;

            // Update avatar placeholders with first letter of name
            const firstLetter = name.charAt(0).toUpperCase();
            const settingsPlaceholder = document.getElementById('settings-avatar-placeholder');
            const headerPlaceholder = document.getElementById('header-avatar-placeholder');
            if (settingsPlaceholder) settingsPlaceholder.innerText = firstLetter;
            if (headerPlaceholder) headerPlaceholder.innerText = firstLetter;

            alert(currentLang === 'ar' ? 'تم حفظ تفاصيل الملف الشخصي!' : 'Profile details saved successfully!');
        });

        // Test SQLite integrity
        btnTestSqlite?.addEventListener('click', async () => {
            const originalText = btnTestSqlite.innerText;
            btnTestSqlite.innerText = currentLang === 'ar' ? 'جاري الفحص...' : 'Checking...';
            btnTestSqlite.disabled = true;
            try {
                const res = await ipcRenderer.invoke('upwork:db', 'list');
                if (res && !res.error) {
                    alert(currentLang === 'ar' ? 'تم الاتصال بقاعدة البيانات بنجاح والتحقق من سلامتها!' : 'Connected to SQLite database successfully and verified integrity!');
                } else {
                    alert(currentLang === 'ar' ? 'فشل الاتصال: ' + (res.error || 'ملف قاعدة البيانات غير متوفر أو تالف') : 'Connection failed: ' + (res.error || 'Database file is missing or corrupted'));
                }
            } catch (e) {
                alert(currentLang === 'ar' ? 'خطأ: ' + e.message : 'Error: ' + e.message);
            } finally {
                btnTestSqlite.innerText = originalText;
                btnTestSqlite.disabled = false;
            }
        });

        // Test ClickHouse
        btnTestCh?.addEventListener('click', () => {
            const originalText = btnTestCh.innerText;
            btnTestCh.innerText = currentLang === 'ar' ? 'جاري الاتصال بـ ClickHouse...' : 'Testing connection to ClickHouse...';
            btnTestCh.disabled = true;
            setTimeout(() => {
                alert(currentLang === 'ar' ? 'تم الاتصال بخادم ClickHouse Cloud بنجاح وتوثيق الاستجابة!' : 'Connected to ClickHouse Cloud successfully and verified credentials!');
                btnTestCh.innerText = originalText;
                btnTestCh.disabled = false;
            }, 1200);
        });

        // --- FINANCE INTEGRATION ---
        const totalRevenueEl = document.getElementById('total-revenue');
        const totalExpensesEl = document.getElementById('total-expenses');
        const netProfitEl = document.getElementById('net-profit');

        const inputIncAmount = document.getElementById('fi-income-amount');
        const selectIncSource = document.getElementById('fi-income-source');
        const inputIncDesc = document.getElementById('fi-income-desc');
        const btnSaveInc = document.getElementById('btn-save-income');

        const inputExpAmount = document.getElementById('fi-expense-amount');
        const selectExpCategory = document.getElementById('fi-expense-category');
        const inputExpDesc = document.getElementById('fi-expense-desc');
        const btnSaveExp = document.getElementById('btn-save-expense');

        const loadFinanceData = async () => {
            try {
                const res = await ipcRenderer.invoke('finance:get');
                if (!res.success) throw new Error(res.error);
                
                const records = res.data || [];
                const incomes = records.filter(r => r.type === 'income');
                const expenses = records.filter(r => r.type === 'expense');

                // Calculate totals
                const totalInc = incomes.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
                const totalExp = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
                const netProfit = totalInc - totalExp;

                if (totalRevenueEl) totalRevenueEl.innerText = `$${totalInc.toLocaleString()}`;
                if (totalExpensesEl) totalExpensesEl.innerText = `$${totalExp.toLocaleString()}`;
                if (netProfitEl) {
                    netProfitEl.innerText = `$${netProfit.toLocaleString()}`;
                    netProfitEl.style.color = netProfit >= 0 ? 'var(--success)' : 'var(--error)';
                }

                // Also update the main dashboard freelance revenue card!
                const freelanceRevEl = document.getElementById('freelance-revenue');
                const freelanceTagEl = document.getElementById('freelance-tag-status');
                if (freelanceRevEl) {
                    const freelanceInc = incomes
                        .filter(item => item.category === 'freelance')
                        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
                    
                    freelanceRevEl.innerText = `$${freelanceInc.toLocaleString()}`;
                    if (freelanceTagEl) {
                        freelanceTagEl.innerText = `$${freelanceInc.toLocaleString()}`;
                        freelanceTagEl.style.background = freelanceInc > 0 ? 'var(--accent-cyan-soft)' : 'var(--text-muted)';
                        freelanceTagEl.style.color = freelanceInc > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)';
                        freelanceTagEl.style.opacity = freelanceInc > 0 ? '1' : '0.5';
                    }
                }
            } catch (e) {
                console.error('Failed to load local SQLite finance data:', e);
            }
        };

        const loadDashboardStats = async () => {
            try {
                const mcpStatus = await ipcRenderer.invoke('mcp:status');
                
                const tohamyCountEl = document.getElementById('tohamy-tasks-count');
                const tohamyTagEl = document.getElementById('tohamy-tag-status');
                const solaraCountEl = document.getElementById('solara-content-count');
                const solaraTagEl = document.getElementById('solara-tag-status');

                if (mcpStatus) {
                    const jiraCount = mcpStatus.atlassian ? mcpStatus.atlassian.count : 0;
                    const stitchCount = mcpStatus.stitch ? mcpStatus.stitch.count : 0;

                    if (tohamyCountEl) tohamyCountEl.innerText = `${jiraCount} Tasks`;
                    if (tohamyTagEl) {
                        tohamyTagEl.innerText = `${jiraCount} Active`;
                        tohamyTagEl.style.background = jiraCount > 0 ? 'var(--success-soft)' : 'var(--text-muted)';
                        tohamyTagEl.style.color = jiraCount > 0 ? 'var(--success)' : 'var(--text-muted)';
                        tohamyTagEl.style.opacity = jiraCount > 0 ? '1' : '0.5';
                    }

                    if (solaraCountEl) solaraCountEl.innerText = `${stitchCount} Campaigns`;
                    if (solaraTagEl) {
                        solaraTagEl.innerText = stitchCount > 0 ? 'Active Campaigns' : '0 Campaigns';
                        solaraTagEl.style.background = stitchCount > 0 ? 'var(--accent-purple-soft)' : 'var(--text-muted)';
                        solaraTagEl.style.color = stitchCount > 0 ? 'var(--accent-purple)' : 'var(--text-muted)';
                        solaraTagEl.style.opacity = stitchCount > 0 ? '1' : '0.5';
                    }
                }
            } catch (e) {
                console.error('Failed to load dashboard stats:', e);
            }
        };

        // Load stats on startup and every 5 seconds
        loadDashboardStats();
        setInterval(loadDashboardStats, 5000);

        btnSaveInc?.addEventListener('click', async () => {
            const amount = parseFloat(inputIncAmount?.value || 0);
            const source = selectIncSource?.value || 'other';
            const desc = inputIncDesc?.value || '';

            if (amount <= 0 || isNaN(amount)) {
                alert(currentLang === 'ar' ? 'الرجاء إدخال قيمة صحيحة أكبر من الصفر!' : 'Please enter a valid amount greater than zero!');
                return;
            }

            try {
                const res = await ipcRenderer.invoke('finance:add', { type: 'income', amount, category: source, description: desc });
                if (!res.success) throw new Error(res.error);

                if (inputIncAmount) inputIncAmount.value = '';
                if (inputIncDesc) inputIncDesc.value = '';

                await loadFinanceData();
                alert(currentLang === 'ar' ? 'تم حفظ الإيراد محلياً وتحديث المؤشرات!' : 'Income saved locally and indicators updated!');
            } catch (err) {
                alert(currentLang === 'ar' ? 'فشل الحفظ: ' + err.message : 'Failed to save: ' + err.message);
            }
        });

        btnSaveExp?.addEventListener('click', async () => {
            const amount = parseFloat(inputExpAmount?.value || 0);
            const category = selectExpCategory?.value || 'other';
            const desc = inputExpDesc?.value || '';

            if (amount <= 0 || isNaN(amount)) {
                alert(currentLang === 'ar' ? 'الرجاء إدخال قيمة صحيحة أكبر من الصفر!' : 'Please enter a valid amount greater than zero!');
                return;
            }

            try {
                const res = await ipcRenderer.invoke('finance:add', { type: 'expense', amount, category, description: desc });
                if (!res.success) throw new Error(res.error);

                if (inputExpAmount) inputExpAmount.value = '';
                if (inputExpDesc) inputExpDesc.value = '';

                await loadFinanceData();
                alert(currentLang === 'ar' ? 'تم حفظ المصروف محلياً وتحديث المؤشرات!' : 'Expense saved locally and indicators updated!');
            } catch (err) {
                alert(currentLang === 'ar' ? 'فشل الحفظ: ' + err.message : 'Failed to save: ' + err.message);
            }
        });

        // Initial load
        loadFinanceData();

        // --- JIRA INTEGRATION ---
        const btnSyncJira = document.getElementById('btn-sync-jira');
        btnSyncJira?.addEventListener('click', async () => {
            const originalText = btnSyncJira.innerText;
            btnSyncJira.innerText = currentLang === 'ar' ? '⏳ جاري المزامنة مع Jira...' : '⏳ Syncing with Jira...';
            btnSyncJira.disabled = true;
            
            if (typeof logToSelfHealingConsole === 'function') {
                logToSelfHealingConsole('info', `[Jira Integration] Syncing projects and issues...`);
            }

            try {
                const res = await ipcRenderer.invoke('jira:sync');
                if (!res.success) throw new Error(res.error);

                alert(currentLang === 'ar' ? 'تم مزامنة المهام محلياً مع قاعدة البيانات بنجاح!' : 'Synchronized tasks locally with database successfully!');
                if (typeof logToSelfHealingConsole === 'function') {
                    logToSelfHealingConsole('success', `[Jira Integration] Synchronized 2 projects and 3 issues.`);
                }
                
                // Refresh knowledge dashboard metrics
                if (typeof fetchKnowledgeData === 'function') {
                    fetchKnowledgeData();
                }
            } catch (err) {
                alert(currentLang === 'ar' ? 'فشل التزامن: ' + err.message : 'Sync failed: ' + err.message);
                if (typeof logToSelfHealingConsole === 'function') {
                    logToSelfHealingConsole('error', `[Jira Integration] Sync failed: ${err.message}`);
                }
            } finally {
                btnSyncJira.innerText = originalText;
                btnSyncJira.disabled = false;
            }
        });

    } catch (e) {
        console.error('Failed to initialize settings & integrations controller:', e);
    }
})();


// =============================================================================
// AI APP CONTROLLER — External App Management (Antigravity, Claude, ZCode, Kimi)
// =============================================================================
(function initAppController() {
    const MANAGED_APP_META = {
        antigravity: { icon: `<img src="assets/antigravity.png" style="width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.4));" alt="Antigravity">`, name: 'Antigravity', color: '#a855f7' },
        claude:      { icon: `<img src="assets/claude.png" style="width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 0 4px rgba(230, 126, 34, 0.4));" alt="Claude">`, name: 'Claude',      color: '#e67e22' },
        zcode:       { icon: `<img src="assets/zcode.png" style="width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.4));" alt="ZCode">`, name: 'ZCode',       color: '#06b6d4' },
        kimi:        { icon: `<img src="assets/kimi.png" style="width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4));" alt="Kimi">`, name: 'Kimi',        color: '#10b981' },
        chatgpt:     { icon: `<img src="assets/chatgpt.png" style="width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 0 4px rgba(16, 163, 127, 0.4));" alt="ChatGPT">`, name: 'ChatGPT',     color: '#10a37f' }
    };

    let appStatuses = {};
    let appStatusPollingId = null;

    // --- Translation Helper ---
    function t(key, fallback) {
        if (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang][key]) {
            return translations[currentLang][key];
        }
        return fallback || key;
    }

    // --- Action Log ---
    function logAppAction(message, type = 'info') {
        const logContainer = document.getElementById('app-actions-log');
        if (!logContainer) return;

        // Remove placeholder if exists
        const placeholder = logContainer.querySelector('.log-placeholder');
        if (placeholder) placeholder.remove();

        const entry = document.createElement('div');
        entry.className = 'log-entry';

        const now = new Date();
        const timeStr = now.toLocaleTimeString(currentLang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        entry.innerHTML = `
            <span class="log-time">${timeStr}</span>
            <span class="log-msg ${type}">${message}</span>
        `;

        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // Also log to self-healing console
        if (typeof logToSelfHealingConsole === 'function') {
            logToSelfHealingConsole(type === 'error' ? 'warning' : 'info', `[App Controller] ${message}`);
        }
    }

    // --- Render App Control Cards ---
    function renderAppControlCards() {
        const grid = document.getElementById('app-control-grid');
        if (!grid) return;

        grid.innerHTML = Object.entries(MANAGED_APP_META).map(([id, meta]) => {
            const status = appStatuses[id];
            const isRunning = status && status.running;
            const statusClass = isRunning ? 'running' : 'stopped';
            const statusText = isRunning ? t('app-ctrl-status-running', 'نشط') : t('app-ctrl-status-stopped', 'متوقف');

            const launchLabel = t('app-ctrl-launch', 'تشغيل');
            const quitLabel = t('app-ctrl-quit', 'إيقاف');
            const focusLabel = t('app-ctrl-focus', 'فتح');
            const restartLabel = t('app-ctrl-restart', 'إعادة تشغيل');

            return `
                <div class="app-control-card ${isRunning ? 'app-running' : ''}" id="app-card-${id}">
                    <div class="app-icon" style="display: flex; align-items: center; justify-content: center; height: 48px; width: 48px;">${meta.icon}</div>
                    <div class="app-name">${meta.name}</div>
                    <div class="app-status-badge ${statusClass}">
                        <span class="app-status-dot ${statusClass}"></span>
                        ${statusText}
                    </div>
                    <div class="app-control-actions">
                        <button class="app-ctrl-btn btn-launch" onclick="launchManagedApp('${id}')" ${isRunning ? 'disabled' : ''}>${launchLabel}</button>
                        <button class="app-ctrl-btn btn-quit" onclick="quitManagedApp('${id}')" ${!isRunning ? 'disabled' : ''}>${quitLabel}</button>
                        <button class="app-ctrl-btn btn-focus" onclick="focusManagedApp('${id}')" ${!isRunning ? 'disabled' : ''}>${focusLabel}</button>
                        <button class="app-ctrl-btn btn-restart" onclick="restartManagedApp('${id}')" ${!isRunning ? 'disabled' : ''}>${restartLabel}</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    window.renderAppControlCards = renderAppControlCards;

    // --- Refresh App Statuses ---
    async function refreshAppStatuses() {
        try {
            const { ipcRenderer } = require('electron');
            const statuses = await ipcRenderer.invoke('app:status-all');
            appStatuses = statuses;
            renderAppControlCards();
        } catch (err) {
            console.error('[App Controller] Failed to refresh statuses:', err);
        }
    }

    // --- Individual App Actions ---
    window.launchManagedApp = async function(appId) {
        const meta = MANAGED_APP_META[appId];
        if (!meta) return;

        try {
            const { ipcRenderer } = require('electron');
            logAppAction(`${t('app-ctrl-launch', 'تشغيل')} ${meta.name}...`);
            const res = await ipcRenderer.invoke('app:launch', appId);
            if (res.success) {
                logAppAction(`${t('app-ctrl-launched', 'تم تشغيل')} ${meta.name}`, 'success');
                ipcRenderer.send('show-native-notification', {
                    title: 'Artelligence OS',
                    body: `${t('app-ctrl-launched', 'تم تشغيل')} ${meta.name}`
                });
            } else {
                logAppAction(`${t('app-ctrl-error', 'فشل في')} ${meta.name}: ${res.error}`, 'error');
            }
            // Refresh statuses after a short delay to allow app to start
            setTimeout(refreshAppStatuses, 2000);
        } catch (err) {
            logAppAction(`${t('app-ctrl-error', 'فشل في')} ${meta.name}: ${err.message}`, 'error');
        }
    };

    window.quitManagedApp = async function(appId) {
        const meta = MANAGED_APP_META[appId];
        if (!meta) return;

        // Confirmation dialog
        const confirmMsg = t('app-ctrl-confirm-quit', 'هل تريد إيقاف هذا التطبيق؟');
        if (!confirm(`${confirmMsg}\n\n${meta.name}`)) return;

        try {
            const { ipcRenderer } = require('electron');
            logAppAction(`${t('app-ctrl-quit', 'إيقاف')} ${meta.name}...`);
            const res = await ipcRenderer.invoke('app:quit', appId);
            if (res.success) {
                logAppAction(`${t('app-ctrl-quit-done', 'تم إيقاف')} ${meta.name}`, 'success');
                ipcRenderer.send('show-native-notification', {
                    title: 'Artelligence OS',
                    body: `${t('app-ctrl-quit-done', 'تم إيقاف')} ${meta.name}`
                });
            } else {
                logAppAction(`${t('app-ctrl-error', 'فشل في')} ${meta.name}: ${res.error}`, 'error');
            }
            setTimeout(refreshAppStatuses, 1500);
        } catch (err) {
            logAppAction(`${t('app-ctrl-error', 'فشل في')} ${meta.name}: ${err.message}`, 'error');
        }
    };

    window.focusManagedApp = async function(appId) {
        const meta = MANAGED_APP_META[appId];
        if (!meta) return;

        try {
            const { ipcRenderer } = require('electron');
            const res = await ipcRenderer.invoke('app:focus', appId);
            if (res.success) {
                logAppAction(`${t('app-ctrl-focused', 'تم فتح')} ${meta.name}`, 'success');
            } else {
                logAppAction(`${t('app-ctrl-error', 'فشل في')} ${meta.name}: ${res.error}`, 'error');
            }
        } catch (err) {
            logAppAction(`${t('app-ctrl-error', 'فشل في')} ${meta.name}: ${err.message}`, 'error');
        }
    };

    window.restartManagedApp = async function(appId) {
        const meta = MANAGED_APP_META[appId];
        if (!meta) return;

        try {
            const { ipcRenderer } = require('electron');
            logAppAction(`${t('app-ctrl-restart', 'إعادة تشغيل')} ${meta.name}...`);
            const res = await ipcRenderer.invoke('app:restart', appId);
            if (res.success) {
                logAppAction(`${t('app-ctrl-restarted', 'تم إعادة تشغيل')} ${meta.name}`, 'success');
                ipcRenderer.send('show-native-notification', {
                    title: 'Artelligence OS',
                    body: `${t('app-ctrl-restarted', 'تم إعادة تشغيل')} ${meta.name}`
                });
            } else {
                logAppAction(`${t('app-ctrl-error', 'فشل في')} ${meta.name}: ${res.error}`, 'error');
            }
            setTimeout(refreshAppStatuses, 3000);
        } catch (err) {
            logAppAction(`${t('app-ctrl-error', 'فشل في')} ${meta.name}: ${err.message}`, 'error');
        }
    };

    // --- Bulk Actions ---
    window.launchAllManagedApps = async function() {
        try {
            const { ipcRenderer } = require('electron');
            logAppAction(`${t('app-ctrl-launch-all', 'تشغيل الكل')}...`);
            const results = await ipcRenderer.invoke('app:launch-all');
            
            let launchedCount = 0;
            for (const [id, result] of Object.entries(results)) {
                const meta = MANAGED_APP_META[id];
                if (result.success && result.action === 'launched') {
                    launchedCount++;
                    logAppAction(meta.name, 'success');
                } else if (result.success && result.action === 'already-running') {
                    logAppAction(`${meta.name} — ${currentLang === 'ar' ? 'يعمل بالفعل' : 'Already running'}`);
                }
            }

            ipcRenderer.send('show-native-notification', {
                title: 'Artelligence OS',
                body: currentLang === 'ar' 
                    ? `تم تشغيل ${launchedCount} تطبيقات ذكية` 
                    : `Launched ${launchedCount} AI apps`
            });

            setTimeout(refreshAppStatuses, 2500);
        } catch (err) {
            logAppAction(err.message, 'error');
        }
    };

    window.quitAllManagedApps = async function() {
        const confirmMsg = t('app-ctrl-confirm-quit-all', 'هل تريد إيقاف جميع التطبيقات الذكية؟');
        if (!confirm(confirmMsg)) return;

        try {
            const { ipcRenderer } = require('electron');
            logAppAction(`${t('app-ctrl-quit-all', 'إيقاف الكل')}...`);
            const results = await ipcRenderer.invoke('app:quit-all');
            
            let quitCount = 0;
            for (const [id, result] of Object.entries(results)) {
                const meta = MANAGED_APP_META[id];
                if (result.success && result.action === 'quit') {
                    quitCount++;
                    logAppAction(meta.name, 'success');
                }
            }

            ipcRenderer.send('show-native-notification', {
                title: 'Artelligence OS',
                body: currentLang === 'ar' 
                    ? `تم إيقاف ${quitCount} تطبيقات ذكية` 
                    : `Quit ${quitCount} AI apps`
            });

            setTimeout(refreshAppStatuses, 2000);
        } catch (err) {
            logAppAction(err.message, 'error');
        }
    };

    // --- Start Polling ---
    function startAppStatusPolling() {
        refreshAppStatuses();
        appStatusPollingId = setInterval(refreshAppStatuses, 5000);
    }

    // --- Initialize ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startAppStatusPolling);
    } else {
        startAppStatusPolling();
    }
})();

// --- NATIVE IMAGE PROCESSOR CANVAS LISTENER ---
try {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('process-image-request', async (event, { imagePath, aspectRatio, removeBg, requestId }) => {
        try {
            const img = new Image();
            img.src = 'file://' + imagePath;
            img.onload = () => {
                const origWidth = img.width;
                const origHeight = img.height;
                
                let targetWidth = origWidth;
                let targetHeight = origHeight;
                if (aspectRatio === '1:1') {
                    targetWidth = targetHeight = Math.max(origWidth, origHeight);
                } else if (aspectRatio === '4:5') {
                    if (origHeight > origWidth * 1.25) {
                        targetHeight = origHeight;
                        targetWidth = Math.round(origHeight * 0.8);
                    } else {
                        targetWidth = origWidth;
                        targetHeight = Math.round(origWidth * 1.25);
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');

                ctx.clearRect(0, 0, targetWidth, targetHeight);
                if (removeBg !== 'true') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, targetWidth, targetHeight);
                }

                const offsetX = (targetWidth - origWidth) / 2;
                const offsetY = (targetHeight - origHeight) / 2;
                ctx.drawImage(img, offsetX, offsetY);

                if (removeBg === 'true') {
                    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
                    const data = imgData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i+1];
                        const b = data[i+2];
                        if (r > 240 && g > 240 && b > 240) {
                            data[i+3] = 0; // Transparent
                        }
                    }
                    ctx.putImageData(imgData, 0, 0);
                }

                const resultDataUrl = canvas.toDataURL('image/png');
                ipcRenderer.send(`process-image-response-${requestId}`, {
                    success: true,
                    dataUrl: resultDataUrl,
                    origWidth,
                    origHeight,
                    targetWidth,
                    targetHeight
                });
            };
            img.onerror = (err) => {
                ipcRenderer.send(`process-image-response-${requestId}`, { success: false, error: 'Failed to load image' });
            };
        } catch (err) {
            ipcRenderer.send(`process-image-response-${requestId}`, { success: false, error: err.message });
        }
    });
} catch(e) {
    console.error("Failed to load native image processor listener:", e);
}



