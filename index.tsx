export {};

// --- App State ---
const AppState = {
    theme: localStorage.getItem('storimage-theme') || 'dark',
    currentView: 'upload',
    files: [] as any[],
    stats: JSON.parse(localStorage.getItem('storimage-stats') || '{"total":0,"saved":0}'),
    settings: JSON.parse(localStorage.getItem('storimage-settings') || JSON.stringify({
        fb: '',
        tt: '',
        scripts: '<script src="https://bouncingbuzz.com/15/38/5b/15385b7c751e6c7d59d59fb7f34e2934.js"></script>'
    }))
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    setupDropZone();
    updateStatsUI();
    injectAds();
    initLucide();
    
    const slider = document.getElementById('quality-slider') as HTMLInputElement;
    const qVal = document.getElementById('quality-val');
    if(slider && qVal) {
        slider.addEventListener('input', (e: any) => {
            qVal.innerText = e.target.value + '%';
        });
    }
});

const initLucide = () => { if ((window as any).lucide) (window as any).lucide.createIcons(); };

// --- Theme ---
const applyTheme = () => {
    const html = document.documentElement;
    AppState.theme === 'dark' ? html.classList.add('dark') : html.classList.remove('dark');
};

(window as any).toggleTheme = () => {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('storimage-theme', AppState.theme);
    applyTheme();
};

// --- View Management ---
(window as any).switchView = (viewId: string) => {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`)?.classList.add('active');
    if(viewId === 'stats') updateStatsUI();
    initLucide();
};

// --- Ads Injection (FOOTER ONLY) ---
const injectAds = () => {
    const container = document.getElementById('ads-injection-container');
    if (container && AppState.settings.scripts) {
        container.innerHTML = '';
        try {
            const range = document.createRange();
            const fragment = range.createContextualFragment(AppState.settings.scripts);
            container.appendChild(fragment);
            console.log("Ads injected into footer only.");
        } catch (e) {
            console.error("Ad injection error:", e);
        }
    }
};

// --- Image Logic ---
function setupDropZone() {
    const area = document.getElementById('drop-area');
    const input = document.getElementById('file-input') as HTMLInputElement;
    if(!area || !input) return;
    input.addEventListener('change', (e: any) => handleFiles(e.target.files));
    area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('active'); });
    area.addEventListener('dragleave', () => area.classList.remove('active'));
    area.addEventListener('drop', (e: any) => {
        e.preventDefault();
        area.classList.remove('active');
        handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(incoming: FileList) {
    let count = 0;
    for (const file of incoming) {
        if (!file.type.startsWith('image/')) continue;
        const fileObj = {
            id: 'img-' + Math.random().toString(36).substr(2, 9),
            name: file.name,
            originalName: file.name.split('.').slice(0, -1).join('.'),
            size: file.size,
            preview: URL.createObjectURL(file),
            status: 'idle'
        };
        AppState.files.push(fileObj);
        count++;
    }
    if(count > 0) { renderQueue(); showToast(`تم إضافة ${count} صور`); }
}

function renderQueue() {
    const queue = document.getElementById('file-queue');
    const bar = document.getElementById('action-bar');
    if(!queue) return;
    
    if(AppState.files.length === 0) {
        queue.innerHTML = '';
        bar?.classList.add('hidden');
        return;
    }
    
    bar?.classList.remove('hidden');
    const hasDone = AppState.files.some(f => f.status === 'done');
    const hasIdle = AppState.files.some(f => f.status === 'idle');
    
    document.getElementById('btn-download-all')?.classList.toggle('hidden', !hasDone);
    document.getElementById('btn-process-all')?.classList.toggle('hidden', !hasIdle);

    queue.innerHTML = AppState.files.map(f => `
        <div class="glass p-5 rounded-3xl flex items-center gap-5 transition-all hover:bg-white/5">
            <div class="relative w-16 h-16 shrink-0">
                <img src="${f.preview}" class="w-full h-full object-cover rounded-2xl">
                ${f.status === 'done' ? '<div class="absolute -top-1 -right-1 bg-brand-success text-white p-1 rounded-full"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
            </div>
            <div class="flex-grow overflow-hidden">
                <h4 class="text-xs font-black truncate">${f.name}</h4>
                <p class="text-[9px] text-slate-500 font-black mt-1 uppercase">${(f.size/1024).toFixed(1)} KB</p>
            </div>
            <div class="flex items-center gap-2">
                ${f.status === 'idle' ? 
                    `<button onclick="window.processOne('${f.id}')" class="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all"><i data-lucide="zap" class="w-5 h-5"></i></button>` :
                    f.status === 'processing' ?
                    `<div class="w-10 h-10 text-brand-primary animate-spin flex items-center justify-center"><i data-lucide="loader" class="w-5 h-5"></i></div>` :
                    `<button onclick="window.downloadOne('${f.id}')" class="w-10 h-10 bg-brand-success text-white rounded-xl flex items-center justify-center hover:scale-110 shadow-lg"><i data-lucide="download" class="w-5 h-5"></i></button>`
                }
                <button onclick="window.removeFile('${f.id}')" class="w-10 h-10 text-slate-400 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>
    `).join('');
    initLucide();
}

(window as any).processOne = (id: string) => {
    const f = AppState.files.find(x => x.id === id);
    if(!f || f.status !== 'idle') return;
    f.status = 'processing';
    renderQueue();
    setTimeout(() => {
        f.status = 'done';
        AppState.stats.total++;
        const qual = parseInt((document.getElementById('quality-slider') as HTMLInputElement).value) / 100;
        AppState.stats.saved += Math.floor(f.size * (1 - qual));
        localStorage.setItem('storimage-stats', JSON.stringify(AppState.stats));
        renderQueue();
    }, 1000);
};

(window as any).processAll = () => AppState.files.forEach(f => { if(f.status === 'idle') (window as any).processOne(f.id); });

(window as any).downloadOne = (id: string) => {
    const f = AppState.files.find(x => x.id === id);
    if(!f || f.status !== 'done') return;
    const format = (document.getElementById('export-format') as HTMLSelectElement).value;
    const link = document.createElement('a');
    link.href = f.preview;
    link.download = `${f.originalName}_storimage.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

(window as any).downloadAll = () => {
    const ready = AppState.files.filter(f => f.status === 'done');
    ready.forEach((f, i) => setTimeout(() => (window as any).downloadOne(f.id), i * 350));
    showToast('جاري التحميل...');
};

(window as any).removeFile = (id: string) => { AppState.files = AppState.files.filter(f => f.id !== id); renderQueue(); };
(window as any).clearQueue = () => { AppState.files = []; renderQueue(); showToast('تم مسح القائمة'); };

// --- Admin ---
(window as any).openAuth = () => {
    const pass = prompt('كلمة السر (1234):');
    if (pass === '1234') {
        document.getElementById('modal-auth')?.classList.add('open');
        (document.getElementById('pixel-fb') as HTMLInputElement).value = AppState.settings.fb;
        (document.getElementById('pixel-tt') as HTMLInputElement).value = AppState.settings.tt;
        (document.getElementById('ad-scripts') as HTMLTextAreaElement).value = AppState.settings.scripts;
    }
};

(window as any).closeAuth = () => document.getElementById('modal-auth')?.classList.remove('open');

(window as any).saveAdminSettings = () => {
    const fb = (document.getElementById('pixel-fb') as HTMLInputElement).value;
    const tt = (document.getElementById('pixel-tt') as HTMLInputElement).value;
    const scripts = (document.getElementById('ad-scripts') as HTMLTextAreaElement).value;
    
    AppState.settings = { fb, tt, scripts };
    localStorage.setItem('storimage-settings', JSON.stringify(AppState.settings));
    injectAds();
    showToast('تم الحفظ');
    (window as any).closeAuth();
};

const updateStatsUI = () => {
    const t = document.getElementById('stat-total');
    const s = document.getElementById('stat-saved');
    if(t) (t as HTMLElement).innerText = AppState.stats.total;
    if(s) (s as HTMLElement).innerHTML = `${(AppState.stats.saved / 1024).toFixed(1)} <span class="text-xl">KB</span>`;
};

const showToast = (msg: string) => {
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');
    if (!t || !m) return;
    (m as HTMLElement).innerText = msg;
    t.classList.remove('translate-y-32', 'opacity-0');
    setTimeout(() => t.classList.add('translate-y-32', 'opacity-0'), 3000);
};