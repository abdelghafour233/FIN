// --- App State ---
let state = {
    files: [],
    stats: JSON.parse(localStorage.getItem('conv_stats')) || { total: 0, saved: 0, time: 0 },
    settings: JSON.parse(localStorage.getItem('conv_settings')) || {
        siteName: 'محول برو',
        domain: 'convert.pro',
        fbPixel: '',
        tiktokPixel: '',
        googleSheets: ''
    },
    isDarkMode: localStorage.getItem('isDarkMode') === 'true',
    logs: JSON.parse(localStorage.getItem('conv_logs')) || []
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    applySettings();
    applyDarkMode();
    setupDropZone();
    switchTab('converter');
    initLucide();
});

function initLucide() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- Dark Mode Logic ---
window.toggleDarkMode = () => {
    // عكس الحالة الحالية
    state.isDarkMode = !state.isDarkMode;
    // حفظ التفضيل
    localStorage.setItem('isDarkMode', state.isDarkMode);
    // تطبيق التغيير
    applyDarkMode();
};

function applyDarkMode() {
    const html = document.documentElement;
    const text = document.getElementById('dark-text');
    const iconContainer = document.getElementById('dark-icon-container');

    if (state.isDarkMode) {
        html.classList.add('dark');
        if (text) text.innerText = 'الوضع النهاري';
        if (iconContainer) {
            iconContainer.innerHTML = '<i data-lucide="sun" class="w-5 h-5"></i>';
            iconContainer.classList.remove('text-slate-600');
            iconContainer.classList.add('text-yellow-400');
        }
    } else {
        html.classList.remove('dark');
        if (text) text.innerText = 'النظام الليلي';
        if (iconContainer) {
            iconContainer.innerHTML = '<i data-lucide="moon" class="w-5 h-5"></i>';
            iconContainer.classList.remove('text-yellow-400');
            iconContainer.classList.add('text-slate-600');
        }
    }
    
    // إعادة بناء الأيقونات لتعمل مكتبة Lucide مع الـ HTML الجديد
    initLucide();
}

// --- Navigation ---
window.switchTab = (tabId) => {
    const titles = {
        'converter': 'المحول الذكي',
        'dashboard': 'لوحة التحكم',
        'settings': 'الإعدادات'
    };

    ['converter', 'dashboard', 'settings'].forEach(id => {
        const view = document.getElementById(`view-${id}`);
        const tab = document.getElementById(`tab-${id}`);
        if (view) view.classList.add('hidden');
        if (tab) {
            tab.classList.remove('sidebar-active');
            tab.classList.add('text-slate-500');
        }
    });

    const targetView = document.getElementById(`view-${tabId}`);
    const targetTab = document.getElementById(`tab-${tabId}`);
    const headerTitle = document.getElementById('header-context-title');

    if (targetView) targetView.classList.remove('hidden');
    if (targetTab) {
        targetTab.classList.add('sidebar-active');
        targetTab.classList.remove('text-slate-500');
    }
    if (headerTitle) headerTitle.innerText = titles[tabId];

    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'settings') renderSettings();
    
    initLucide();
};

// --- Settings Management ---
function applySettings() {
    const brandName = document.getElementById('brand-name');
    const siteTitle = document.getElementById('site-title-tag');
    if (brandName) brandName.innerText = state.settings.siteName;
    if (siteTitle) siteTitle.innerText = `${state.settings.siteName} | محول الصور الاحترافي`;
}

window.updateSettings = (key, value) => {
    state.settings[key] = value;
    localStorage.setItem('conv_settings', JSON.stringify(state.settings));
    applySettings();
    showToast('تم حفظ الإعدادات بنجاح');
};

function renderSettings() {
    const fields = {
        'set-site-name': state.settings.siteName,
        'set-domain': state.settings.domain
    };
    for (let id in fields) {
        const el = document.getElementById(id);
        if (el) el.value = fields[id];
    }
}

// --- Converter Logic ---
function setupDropZone() {
    const dropZone = document.getElementById('drop-zone');
    const input = document.getElementById('file-input');
    if (!dropZone || !input) return;

    input.addEventListener('change', (e) => handleFiles(e.target.files));
    
    ['dragover', 'dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('drop-zone--over'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drop-zone--over'));
    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('drop-zone--over');
        handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(selected) {
    for (const file of selected) {
        if (!file.type.startsWith('image/')) continue;
        const fileObj = {
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            preview: URL.createObjectURL(file),
            targetFormat: 'image/webp',
            quality: 0.8,
            status: 'idle',
            resultBlob: null
        };
        state.files.push(fileObj);
    }
    renderFileList();
}

function renderFileList() {
    const container = document.getElementById('files-container');
    const actions = document.getElementById('global-actions');
    if (!container) return;

    if (state.files.length === 0) {
        container.innerHTML = '';
        if (actions) actions.classList.add('hidden');
        return;
    }

    if (actions) actions.classList.remove('hidden');
    container.innerHTML = state.files.map(f => `
        <div class="glass rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
            <img src="${f.preview}" class="w-16 h-16 rounded-2xl object-cover shadow-sm">
            <div class="flex-grow text-center md:text-right min-w-0">
                <h4 class="font-black text-slate-800 dark:text-white truncate text-sm">${f.file.name}</h4>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">${(f.file.size / 1024).toFixed(1)} KB</p>
            </div>
            <div class="flex items-center gap-4">
                <select onchange="updateFileOption('${f.id}', 'targetFormat', this.value)" class="bg-slate-50 dark:bg-slate-800 dark:text-white border-0 rounded-xl px-4 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="image/webp" ${f.targetFormat === 'image/webp' ? 'selected' : ''}>WEBP</option>
                    <option value="image/jpeg" ${f.targetFormat === 'image/jpeg' ? 'selected' : ''}>JPG</option>
                    <option value="image/png" ${f.targetFormat === 'image/png' ? 'selected' : ''}>PNG</option>
                </select>
                <div class="w-24">
                    <input type="range" min="0.1" max="1" step="0.1" value="${f.quality}" oninput="updateFileOption('${f.id}', 'quality', this.value)" class="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer">
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${f.status === 'idle' ? `
                    <button onclick="processSingle('${f.id}')" class="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition">
                        <i data-lucide="play" class="w-4 h-4"></i>
                    </button>
                ` : f.status === 'done' ? `
                    <button onclick="downloadFile('${f.id}')" class="bg-green-600 text-white p-3 rounded-2xl hover:bg-green-700 transition">
                        <i data-lucide="download" class="w-4 h-4"></i>
                    </button>
                ` : `<div class="p-3 animate-spin text-blue-600"><i data-lucide="loader-2" class="w-4 h-4"></i></div>`}
                <button onclick="removeFile('${f.id}')" class="text-slate-300 dark:text-slate-600 hover:text-red-500 p-3 transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
    `).join('');
    initLucide();
}

window.updateFileOption = (id, key, val) => {
    const f = state.files.find(item => item.id === id);
    if (f) f[key] = val;
};

window.removeFile = (id) => {
    state.files = state.files.filter(f => f.id !== id);
    renderFileList();
};

window.processSingle = async (id) => {
    const f = state.files.find(item => item.id === id);
    if (!f) return;

    f.status = 'converting';
    renderFileList();

    const start = performance.now();
    const result = await convertToBlob(f);
    const end = performance.now();

    f.status = 'done';
    f.resultBlob = result;
    
    updateStats(f.file.size - result.size, (end - start) / 1000);
    logOperation(f.file.name, f.file.type, f.targetFormat);
    
    renderFileList();
    showToast(`تم تحويل ${f.file.name} بنجاح!`);
};

window.convertAll = async () => {
    const idles = state.files.filter(f => f.status === 'idle');
    for (const f of idles) {
        await processSingle(f.id);
    }
};

function convertToBlob(f) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(resolve, f.targetFormat, parseFloat(f.quality));
        };
        img.src = f.preview;
    });
}

window.downloadFile = (id) => {
    const f = state.files.find(item => item.id === id);
    if (!f || !f.resultBlob) return;
    const url = URL.createObjectURL(f.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${f.file.name.split('.')[0]}.${f.targetFormat.split('/')[1]}`;
    a.click();
};

function updateStats(savedBytes, timeTaken) {
    state.stats.total++;
    state.stats.saved += Math.max(0, savedBytes);
    state.stats.time = (state.stats.time + timeTaken) / 2;
    localStorage.setItem('conv_stats', JSON.stringify(state.stats));
}

function logOperation(name, from, to) {
    const log = { name, from, to, date: new Date().toISOString() };
    state.logs.unshift(log);
    if (state.logs.length > 50) state.logs.pop();
    localStorage.setItem('conv_logs', JSON.stringify(state.logs));
}

function renderDashboard() {
    const totalEl = document.getElementById('stat-total');
    const savedEl = document.getElementById('stat-saved');
    const timeEl = document.getElementById('stat-time');
    
    if (totalEl) totalEl.innerText = state.stats.total;
    if (savedEl) savedEl.innerText = (state.stats.saved / 1024).toFixed(1) + ' KB';
    if (timeEl) timeEl.innerText = state.stats.time.toFixed(2) + 's';

    const logBody = document.getElementById('admin-log-body');
    if (logBody) {
        logBody.innerHTML = state.logs.slice(0, 10).map(l => `
            <tr class="text-xs font-bold border-b border-slate-50 dark:border-slate-800">
                <td class="py-4 text-slate-900 dark:text-white">${l.name}</td>
                <td class="py-4 text-slate-400 dark:text-slate-500 uppercase">${l.from.split('/')[1]}</td>
                <td class="py-4 text-blue-600 dark:text-blue-400 uppercase">${l.to.split('/')[1]}</td>
                <td class="py-4"><span class="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-[10px]">ناجح</span></td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="py-10 text-center text-slate-300 italic">لا توجد عمليات مسجلة بعد</td></tr>';
    }
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'bg-slate-900 dark:bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border border-white/10 animate-in slide-in-from-right duration-300';
    toast.innerHTML = `<i data-lucide="check-circle" class="text-green-500 dark:text-white w-5 h-5"></i> ${msg}`;
    container.appendChild(toast);
    initLucide();
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-10');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}
