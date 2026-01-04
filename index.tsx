export {};

// --- Core State ---
const AppState = {
    theme: localStorage.getItem('storimage-theme') || 'dark',
    currentView: 'upload',
    files: [] as any[],
    isUnlocked: sessionStorage.getItem('storimage-unlocked') === 'true',
    adminPass: localStorage.getItem('storimage-admin-pass') || '1234',
    stats: JSON.parse(localStorage.getItem('storimage-stats') || '{"total":0,"saved":0}'),
    settings: JSON.parse(localStorage.getItem('storimage-settings') || '{"fb":"","tt":""}')
};

// --- Toast & UI Helpers ---
const showToast = (msg: string) => {
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');
    if(!t || !m) return;
    m.innerText = msg;
    t.classList.remove('translate-y-32', 'opacity-0');
    setTimeout(() => t.classList.add('translate-y-32', 'opacity-0'), 3000);
};

const initLucide = () => {
    const win = window as any;
    if (win.lucide) {
        win.lucide.createIcons();
    }
};

// --- Define Global Functions Early ---
(window as any).toggleMobileMenu = (open: boolean) => {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        if (open) menu.classList.add('active');
        else menu.classList.remove('active');
    }
};

(window as any).switchView = (viewId: string) => {
    if (viewId === 'settings' && !AppState.isUnlocked) {
        (window as any).openAuth();
        return;
    }
    
    AppState.currentView = viewId;
    
    // Update Nav Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${viewId}`);
    if(activeBtn) activeBtn.classList.add('active');
    
    // Switch View
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if(target) target.classList.add('active');
    
    if(viewId === 'stats') updateStatsUI();
    if(viewId === 'settings') loadSettings();
    initLucide();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

(window as any).toggleTheme = () => {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('storimage-theme', AppState.theme);
    applyTheme();
};

(window as any).openAuth = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('open');
};

(window as any).closeAuth = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('open');
};

(window as any).verifyAdmin = () => {
    const input = document.getElementById('admin-pass') as HTMLInputElement;
    if (input && input.value === AppState.adminPass) {
        AppState.isUnlocked = true;
        sessionStorage.setItem('storimage-unlocked', 'true');
        (window as any).closeAuth();
        (window as any).switchView('settings');
        showToast('مرحباً بك مجدداً');
        input.value = '';
    } else {
        showToast('كلمة السر خاطئة');
    }
};

(window as any).lockDashboard = () => {
    AppState.isUnlocked = false;
    sessionStorage.removeItem('storimage-unlocked');
    (window as any).switchView('upload');
    showToast('تم الخروج بنجاح');
};

(window as any).togglePass = (id: string) => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
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
            id: 'si-' + Math.random().toString(36).substr(2, 9),
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
        bar?.classList.add('hidden');
        return;
    }

    bar?.classList.remove('hidden');
    const hasDone = AppState.files.some(f => f.status === 'done');
    const hasIdle = AppState.files.some(f => f.status === 'idle');
    
    if(btnDownloadAll) btnDownloadAll.classList.toggle('hidden', !hasDone);
    if(btnProcessAll) btnProcessAll.classList.toggle('hidden', !hasIdle);

    queue.innerHTML = AppState.files.map(f => `
        <div class="glass p-6 rounded-[2rem] flex items-center gap-6 transition-all hover:scale-[1.01] ${f.status === 'done' ? 'border-brand-success/40' : ''}">
            <div class="relative w-20 h-20 shrink-0">
                <img src="${f.preview}" class="w-full h-full object-cover rounded-2xl shadow-xl">
                ${f.status === 'done' ? '<div class="absolute -top-2 -right-2 bg-brand-success text-white p-1.5 rounded-full shadow-lg"><i data-lucide="check" class="w-4 h-4"></i></div>' : ''}
            </div>
            <div class="flex-grow overflow-hidden">
                <h4 class="text-sm font-black truncate">${f.name}</h4>
                <p class="text-[10px] text-slate-500 font-black mt-1 uppercase tracking-widest">${(f.size/1024).toFixed(1)} KB • ${f.status === 'done' ? '<span class="text-brand-success font-black">جاهز للتحميل</span>' : f.status === 'processing' ? '<span class="text-brand-primary animate-pulse">جاري المعالجة...</span>' : 'بانتظار البدء'}</p>
                ${f.status === 'processing' ? '<div class="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full mt-3 overflow-hidden"><div class="h-full bg-brand-primary animate-[shimmer_2s_infinite]" style="width: 60%"></div></div>' : ''}
            </div>
            <div class="flex items-center gap-2">
                ${f.status === 'idle' ? 
                    `<button onclick="window.processOne('${f.id}')" class="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all"><i data-lucide="play" class="w-6 h-6"></i></button>` :
                    f.status === 'processing' ?
                    `<div class="w-12 h-12 text-brand-primary animate-spin flex items-center justify-center"><i data-lucide="loader" class="w-6 h-6"></i></div>` :
                    `<button onclick="window.downloadOne('${f.id}')" class="w-12 h-12 bg-brand-success text-white rounded-2xl flex items-center justify-center hover:scale-110 shadow-lg"><i data-lucide="download" class="w-6 h-6"></i></button>`
                }
                <button onclick="window.removeFile('${f.id}')" class="w-12 h-12 text-slate-400 hover:text-red-500 transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
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
    }, 1200);
};

(window as any).processAll = () => {
    AppState.files.forEach(f => {
        if(f.status === 'idle') (window as any).processOne(f.id);
    });
};

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
    showToast('بدء التحميل المتعدد...');
};

(window as any).removeFile = (id: string) => {
    AppState.files = AppState.files.filter(f => f.id !== id);
    renderQueue();
};

(window as any).clearQueue = () => {
    AppState.files = [];
    renderQueue();
    showToast('تم إخلاء القائمة');
};

// --- Storage & Init ---
function loadSettings() {
    const s = AppState.settings;
    const fb = document.getElementById('fb-pixel') as HTMLInputElement;
    const tt = document.getElementById('tt-pixel') as HTMLInputElement;
    if(fb) fb.value = s.fb || '';
    if(tt) tt.value = s.tt || '';
}

(window as any).saveSettings = () => {
    const fbInput = document.getElementById('fb-pixel') as HTMLInputElement;
    const ttInput = document.getElementById('tt-pixel') as HTMLInputElement;
    const passInput = document.getElementById('setting-admin-pass') as HTMLInputElement;

    if(passInput.value.trim()) {
        AppState.adminPass = passInput.value;
        localStorage.setItem('storimage-admin-pass', AppState.adminPass);
    }
    
    AppState.settings = { fb: fbInput.value, tt: ttInput.value };
    localStorage.setItem('storimage-settings', JSON.stringify(AppState.settings));
    showToast('تم الحفظ');
};

function updateStatsUI() {
    const t = document.getElementById('stat-total');
    const s = document.getElementById('stat-saved');
    if(t) t.innerText = AppState.stats.total;
    if(s) s.innerHTML = `${(AppState.stats.saved / 1024).toFixed(1)} <span class="text-xl">KB</span>`;
}

function applyTheme() {
    const html = document.documentElement;
    if (AppState.theme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
    } else {
        html.classList.add('light');
        html.classList.remove('dark');
    }
    setTimeout(initLucide, 50);
}

const setupSliders = () => {
    const slider = document.getElementById('quality-slider') as HTMLInputElement;
    const val = document.getElementById('quality-val');
    if(slider && val) {
        slider.addEventListener('input', (e: any) => {
            val.innerText = e.target.value + '%';
        });
    }
};

// --- Final Init ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    setupDropZone();
    updateStatsUI();
    initLucide();
    setupSliders();
});

// Run immediately if DOM ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    applyTheme();
    setupDropZone();
    updateStatsUI();
    initLucide();
    setupSliders();
}
