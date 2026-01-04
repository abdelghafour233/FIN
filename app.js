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
});

function initLucide() {
    if (window.lucide) window.lucide.createIcons();
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
    setTimeout(initLucide, 10);
}

// --- Navigation ---
window.switchView = (viewId) => {
    AppState.currentView = viewId;
    
    // UI Update
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${viewId}`).classList.add('active');
    
    document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    if(viewId === 'stats') updateStatsUI();
    initLucide();
};

// --- Image Processing & Upload ---
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
            status: 'idle' // idle, processing, done
        };
        AppState.files.push(fileObj);
        count++;
    }
    if(count > 0) {
        renderQueue();
        showToast(`تمت إضافة ${count} ملفات`);
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

    // Show "Download All" if at least one is done
    const hasDone = AppState.files.some(f => f.status === 'done');
    const hasIdle = AppState.files.some(f => f.status === 'idle');
    
    if(btnDownloadAll) btnDownloadAll.classList.toggle('hidden', !hasDone);
    if(btnProcessAll) btnProcessAll.classList.toggle('hidden', !hasIdle);

    queue.innerHTML = AppState.files.map(f => `
        <div class="neon-card p-6 rounded-[2rem] flex items-center gap-5 transition-all hover:scale-[1.02] ${f.status === 'done' ? 'image-ready' : ''}">
            <div class="relative w-16 h-16 shrink-0">
                <img src="${f.preview}" class="w-full h-full object-cover rounded-xl shadow-lg">
                ${f.status === 'done' ? '<div class="absolute -top-2 -right-2 bg-brand-green text-black p-1 rounded-full shadow-lg"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
            </div>
            <div class="flex-grow overflow-hidden text-right">
                <h4 class="text-xs font-black truncate">${f.name}</h4>
                <p class="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">${(f.size/1024).toFixed(1)} KB</p>
            </div>
            <div class="flex gap-2">
                ${f.status === 'idle' ? 
                    `<button onclick="processOne('${f.id}')" class="w-10 h-10 bg-brand-green/20 text-brand-green rounded-xl flex items-center justify-center hover:bg-brand-green hover:text-black transition-all" title="معالجة"><i data-lucide="zap" class="w-5 h-5"></i></button>` :
                    f.status === 'processing' ?
                    `<div class="w-10 h-10 text-brand-green animate-spin flex items-center justify-center"><i data-lucide="refresh-cw" class="w-5 h-5"></i></div>` :
                    `<button onclick="downloadOne('${f.id}')" class="w-10 h-10 bg-brand-green text-black rounded-xl flex items-center justify-center hover:scale-110 transition-all" title="تحميل"><i data-lucide="download" class="w-5 h-5"></i></button>`
                }
                <button onclick="removeFile('${f.id}')" class="w-10 h-10 text-slate-600 hover:text-red-500 transition-colors" title="إزالة"><i data-lucide="x" class="w-5 h-5"></i></button>
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
    showToast('تم مسح القائمة');
};

window.processOne = (id) => {
    const f = AppState.files.find(x => x.id === id);
    if(!f || f.status !== 'idle') return;

    f.status = 'processing';
    renderQueue();

    // Mock processing / compression
    setTimeout(() => {
        f.status = 'done';
        AppState.stats.total++;
        AppState.stats.saved += Math.floor(f.size * 0.45);
        localStorage.setItem('imgpro-stats', JSON.stringify(AppState.stats));
        renderQueue();
    }, 1000);
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
    const link = document.createElement('a');
    link.href = f.preview;
    link.download = `${f.originalName}_imgpro.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('بدء التحميل...');
};

window.downloadAll = () => {
    const doneFiles = AppState.files.filter(f => f.status === 'done');
    if(doneFiles.length === 0) return;

    doneFiles.forEach((f, index) => {
        setTimeout(() => {
            window.downloadOne(f.id);
        }, index * 300); // Small delay to prevent browser blocks
    });
    showToast('بدء التحميل الجماعي...');
};

// --- Dashboard / Settings ---
function loadSettings() {
    const s = AppState.settings;
    if(document.getElementById('fb-pixel')) document.getElementById('fb-pixel').value = s.fb || '';
    if(document.getElementById('tt-pixel')) document.getElementById('tt-pixel').value = s.tt || '';
    if(document.getElementById('ga-id')) document.getElementById('ga-id').value = s.ga || '';
    if(document.getElementById('domain-name')) document.getElementById('domain-name').value = s.domain || '';
    if(document.getElementById('ns1')) document.getElementById('ns1').value = s.ns1 || '';
    if(document.getElementById('ns2')) document.getElementById('ns2').value = s.ns2 || '';
    if(document.getElementById('gsheets')) document.getElementById('gsheets').value = s.sheets || '';
}

window.saveSettings = () => {
    AppState.settings = {
        fb: document.getElementById('fb-pixel').value,
        tt: document.getElementById('tt-pixel').value,
        ga: document.getElementById('ga-id').value,
        domain: document.getElementById('domain-name').value,
        ns1: document.getElementById('ns1').value,
        ns2: document.getElementById('ns2').value,
        sheets: document.getElementById('gsheets').value
    };
    localStorage.setItem('imgpro-settings', JSON.stringify(AppState.settings));
    showToast('تم حفظ كافة الإعدادات بنجاح');
};

// --- UI Helpers ---
function updateStatsUI() {
    const totalEl = document.getElementById('stat-total');
    const savedEl = document.getElementById('stat-saved');
    if(totalEl) totalEl.innerText = AppState.stats.total;
    if(savedEl) savedEl.innerHTML = `${(AppState.stats.saved / 1024).toFixed(1)} <span class="text-xl">KB</span>`;
}

function showToast(msg) {
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');
    if(!t || !m) return;
    m.innerText = msg;
    t.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000);
}