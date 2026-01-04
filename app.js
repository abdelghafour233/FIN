// --- App State ---
const AppState = {
    theme: localStorage.getItem('imgpro-theme') || 'dark',
    currentView: 'upload',
    files: [],
    stats: JSON.parse(localStorage.getItem('imgpro-stats')) || { total: 0, saved: 0 },
    settings: JSON.parse(localStorage.getItem('imgpro-settings')) || {
        fb: '', tt: '', ga: '', domain: '', ns1: '', ns2: '', sheets: ''
    }
};

// --- Core Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    loadSettings();
    setupDropZone();
    updateStatsUI();
    initLucide();
    setupSliders();
});

function initLucide() {
    if (window.lucide) window.lucide.createIcons();
}

function setupSliders() {
    const slider = document.getElementById('quality-slider');
    const val = document.getElementById('quality-val');
    if(slider && val) {
        slider.addEventListener('input', (e) => {
            val.innerText = e.target.value + '%';
        });
    }
}

// --- Theme Management ---
window.toggleTheme = () => {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('imgpro-theme', AppState.theme);
    applyTheme();
};

function applyTheme() {
    const html = document.documentElement;
    if (AppState.theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    setTimeout(initLucide, 50);
}

// --- Navigation ---
window.toggleMobileMenu = () => {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('open');
};

window.switchView = (viewId) => {
    AppState.currentView = viewId;
    
    // UI Update Desktop Nav
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${viewId}`);
    if(activeBtn) activeBtn.classList.add('active');
    
    // Switch View Content
    document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(`view-${viewId}`);
    if(targetView) targetView.classList.add('active');
    
    if(viewId === 'stats') updateStatsUI();
    
    // Close mobile menu just in case
    const menu = document.getElementById('mobile-menu');
    if(menu) menu.classList.remove('open');
    
    initLucide();
};

// --- Image Logic ---
function setupDropZone() {
    const area = document.getElementById('drop-area');
    const input = document.getElementById('file-input');
    if(!area || !input) return;

    input.addEventListener('change', (e) => handleFiles(e.target.files));
    area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('active'); });
    area.addEventListener('dragleave', () => area.classList.remove('active'));
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('active');
        handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(incoming) {
    let count = 0;
    for (const file of incoming) {
        if (!file.type.startsWith('image/')) continue;
        const fileObj = {
            id: 'img-' + Date.now() + Math.random().toString(36).substr(2, 5),
            name: file.name,
            originalName: file.name.split('.').slice(0, -1).join('.'),
            size: file.size,
            preview: URL.createObjectURL(file),
            status: 'idle'
        };
        AppState.files.push(fileObj);
        count++;
    }
    if(count > 0) {
        renderQueue();
        showToast(`تم استقبال ${count} صور`);
    }
}

function renderQueue() {
    const queue = document.getElementById('file-queue');
    const bar = document.getElementById('action-bar');
    const btnDownloadAll = document.getElementById('btn-download-all');
    const btnProcessAll = document.getElementById('btn-process-all');

    if(!queue) return;

    if(AppState.files.length === 0) {
        queue.innerHTML = '';
        bar.classList.add('hidden');
        return;
    }

    bar.classList.remove('hidden');
    const hasDone = AppState.files.some(f => f.status === 'done');
    const hasIdle = AppState.files.some(f => f.status === 'idle');
    
    if(btnDownloadAll) btnDownloadAll.classList.toggle('hidden', !hasDone);
    if(btnProcessAll) btnProcessAll.classList.toggle('hidden', !hasIdle);

    queue.innerHTML = AppState.files.map(f => `
        <div class="neon-card p-6 rounded-[2rem] flex items-center gap-5 transition-all hover:scale-[1.03] ${f.status === 'done' ? 'image-ready' : ''}">
            <div class="relative w-20 h-20 shrink-0">
                <img src="${f.preview}" class="w-full h-full object-cover rounded-2xl shadow-xl">
                ${f.status === 'done' ? '<div class="absolute -top-2 -right-2 bg-brand-green text-black p-1.5 rounded-full shadow-lg border-2 border-brand-black"><i data-lucide="check" class="w-3.5 h-3.5"></i></div>' : ''}
            </div>
            <div class="flex-grow overflow-hidden text-right">
                <h4 class="text-sm font-black truncate">${f.name}</h4>
                <p class="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">${(f.size/1024).toFixed(1)} KB</p>
                ${f.status === 'processing' ? '<div class="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden"><div class="h-full bg-brand-green animate-pulse" style="width: 70%"></div></div>' : ''}
            </div>
            <div class="flex flex-col gap-2">
                ${f.status === 'idle' ? 
                    `<button onclick="processOne('${f.id}')" class="w-12 h-12 bg-brand-green/20 text-brand-green rounded-2xl flex items-center justify-center hover:bg-brand-green hover:text-black transition-all" title="معالجة"><i data-lucide="zap" class="w-6 h-6"></i></button>` :
                    f.status === 'processing' ?
                    `<div class="w-12 h-12 text-brand-green animate-spin flex items-center justify-center"><i data-lucide="loader" class="w-6 h-6"></i></div>` :
                    `<button onclick="downloadOne('${f.id}')" class="w-12 h-12 bg-brand-green text-black rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-lg" title="تحميل"><i data-lucide="download" class="w-6 h-6"></i></button>`
                }
                <button onclick="removeFile('${f.id}')" class="w-12 h-12 text-slate-700 hover:text-red-500 transition-colors" title="إزالة"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>
    `).join('');
    initLucide();
}

window.removeFile = (id) => {
    AppState.files = AppState.files.filter(f => f.id !== id);
    renderQueue();
};

window.clearQueue = () => {
    AppState.files = [];
    renderQueue();
    showToast('تم إخلاء منطقة العمل');
};

window.processOne = (id) => {
    const f = AppState.files.find(x => x.id === id);
    if(!f || f.status !== 'idle') return;

    f.status = 'processing';
    renderQueue();

    setTimeout(() => {
        f.status = 'done';
        AppState.stats.total++;
        const qual = parseInt(document.getElementById('quality-slider').value) / 100;
        AppState.stats.saved += Math.floor(f.size * (1 - qual));
        localStorage.setItem('imgpro-stats', JSON.stringify(AppState.stats));
        renderQueue();
    }, 1200);
};

window.processAll = () => {
    AppState.files.forEach(f => {
        if(f.status === 'idle') window.processOne(f.id);
    });
};

window.downloadOne = (id) => {
    const f = AppState.files.find(x => x.id === id);
    if(!f || f.status !== 'done') return;

    const format = document.getElementById('export-format').value || 'webp';
    const prefix = document.getElementById('name-prefix').value || '';
    const link = document.createElement('a');
    link.href = f.preview;
    link.download = `${prefix}${f.originalName}_imgpro.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.downloadAll = () => {
    const doneFiles = AppState.files.filter(f => f.status === 'done');
    if(doneFiles.length === 0) return;

    doneFiles.forEach((f, idx) => {
        setTimeout(() => window.downloadOne(f.id), idx * 400);
    });
    showToast('جاري بدء التحميل الجماعي...');
};

// --- Settings ---
function loadSettings() {
    const s = AppState.settings;
    if(document.getElementById('fb-pixel')) document.getElementById('fb-pixel').value = s.fb || '';
    if(document.getElementById('tt-pixel')) document.getElementById('tt-pixel').value = s.tt || '';
    if(document.getElementById('domain-name')) document.getElementById('domain-name').value = s.domain || '';
    if(document.getElementById('gsheets')) document.getElementById('gsheets').value = s.sheets || '';
}

window.saveSettings = () => {
    AppState.settings = {
        fb: document.getElementById('fb-pixel').value,
        tt: document.getElementById('tt-pixel').value,
        domain: document.getElementById('domain-name').value,
        sheets: document.getElementById('gsheets').value
    };
    localStorage.setItem('imgpro-settings', JSON.stringify(AppState.settings));
    showToast('تم الحفظ بنجاح');
};

// --- Helpers ---
function updateStatsUI() {
    const t = document.getElementById('stat-total');
    const s = document.getElementById('stat-saved');
    if(t) t.innerText = AppState.stats.total;
    if(s) s.innerHTML = `${(AppState.stats.saved / 1024).toFixed(1)} <span class="text-xl">KB</span>`;
}

function showToast(msg) {
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');
    if(!t || !m) return;
    m.innerText = msg;
    t.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000);
}