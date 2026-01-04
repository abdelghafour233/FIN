export {};

// --- App State ---
const AppState = {
    theme: localStorage.getItem('storimage-theme') || 'dark',
    currentView: 'upload',
    files: [] as any[],
    isUnlocked: sessionStorage.getItem('storimage-unlocked') === 'true',
    adminPass: localStorage.getItem('storimage-admin-pass') || '1234',
    stats: JSON.parse(localStorage.getItem('storimage-stats') || '{"total":0,"saved":0}'),
    settings: JSON.parse(localStorage.getItem('storimage-settings') || '{"fb":"","tt":""}')
};

// --- Initialization ---
const init = () => {
    applyTheme();
    setupDropZone();
    updateStatsUI();
    initLucide();
    setupSliders();
    console.log("StorImage Engine v3.0 Initialized.");
};

const initLucide = () => {
    const win = window as any;
    if (win.lucide) {
        win.lucide.createIcons();
    }
};

const setupSliders = () => {
    const slider = document.getElementById('quality-slider') as HTMLInputElement;
    const val = document.getElementById('quality-val');
    if(slider && val) {
        slider.addEventListener('input', (e: any) => {
            val.innerText = e.target.value + '%';
        });
    }
};

// --- Global UI Controls ---
(window as any).switchView = (viewId: string) => {
    if (viewId === 'settings' && !AppState.isUnlocked) {
        (window as any).openAuth();
        return;
    }
    
    AppState.currentView = viewId;
    
    // UI Update
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${viewId}`);
    if(activeBtn) activeBtn.classList.add('active');
    
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if(target) target.classList.add('active');
    
    if(viewId === 'stats') updateStatsUI();
    if(viewId === 'settings') loadSettings();
    initLucide();
};

(window as any).toggleTheme = () => {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('storimage-theme', AppState.theme);
    applyTheme();
};

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

// --- Auth System ---
(window as any).openAuth = () => {
    document.getElementById('auth-modal')?.classList.add('open');
};

(window as any).closeAuth = () => {
    document.getElementById('auth-modal')?.classList.remove('open');
};

(window as any).verifyAdmin = () => {
    const input = document.getElementById('admin-pass') as HTMLInputElement;
    if (input && input.value === AppState.adminPass) {
        AppState.isUnlocked = true;
        sessionStorage.setItem('storimage-unlocked', 'true');
        (window as any).closeAuth();
        (window as any).switchView('settings');
        showToast('مرحباً بك في StorImage');
        input.value = '';
    } else {
        showToast('كلمة السر خاطئة');
    }
};

(window as any).lockDashboard = () => {
    AppState.isUnlocked = false;
    sessionStorage.removeItem('storimage-unlocked');
    (window as any).switchView('upload');
    showToast('تم قفل النظام');
};

(window as any).togglePass = (id: string) => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
};

// --- Image Processing ---
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
    const shareSec = document.getElementById('share-section');

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
    if(shareSec) shareSec.classList.toggle('hidden', !hasDone);

    queue.innerHTML = AppState.files.map(f => `
        <div class="glass p-5 rounded-2xl flex items-center gap-5 transition-all hover:translate-x-1 ${f.status === 'done' ? 'border-brand-success/30' : ''}">
            <div class="relative w-16 h-16 shrink-0 group">
                <img src="${f.preview}" class="w-full h-full object-cover rounded-xl shadow-md transition-transform group-hover:scale-105">
                ${f.status === 'done' ? '<div class="absolute -top-1.5 -right-1.5 bg-brand-success text-white p-1 rounded-full text-[8px]"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
            </div>
            <div class="flex-grow overflow-hidden">
                <h4 class="text-xs font-bold truncate">${f.name}</h4>
                <p class="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">${(f.size/1024).toFixed(1)} KB • ${f.status === 'done' ? '<span class="text-brand-success">جاهز</span>' : f.status === 'processing' ? '<span class="text-brand-primary">جاري المعالجة...</span>' : 'بانتظار البدء'}</p>
                ${f.status === 'processing' ? '<div class="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden"><div class="h-full bg-brand-primary animate-pulse w-1/2"></div></div>' : ''}
            </div>
            <div class="flex items-center gap-2">
                ${f.status === 'idle' ? 
                    `<button onclick="window.processOne('${f.id}')" class="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all"><i data-lucide="zap" class="w-5 h-5"></i></button>` :
                    f.status === 'processing' ?
                    `<div class="w-10 h-10 text-brand-primary animate-spin flex items-center justify-center"><i data-lucide="loader-2" class="w-5 h-5"></i></div>` :
                    `<button onclick="window.downloadOne('${f.id}')" class="w-10 h-10 bg-brand-success text-white rounded-xl flex items-center justify-center hover:scale-110 shadow-lg shadow-green-500/20"><i data-lucide="download" class="w-5 h-5"></i></button>`
                }
                <button onclick="window.removeFile('${f.id}')" class="w-10 h-10 text-slate-400 hover:text-red-500"><i data-lucide="x" class="w-5 h-5"></i></button>
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
    }, 1500);
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
    ready.forEach((f, i) => setTimeout(() => (window as any).downloadOne(f.id), i * 300));
};

(window as any).removeFile = (id: string) => {
    AppState.files = AppState.files.filter(f => f.id !== id);
    renderQueue();
};

(window as any).clearQueue = () => {
    AppState.files = [];
    renderQueue();
    showToast('تم مسح جميع الصور');
};

// --- Settings Persistence ---
function loadSettings() {
    const s = AppState.settings;
    const fb = document.getElementById('fb-pixel') as HTMLInputElement;
    const tt = document.getElementById('tt-pixel') as HTMLInputElement;
    if(fb) fb.value = s.fb || '';
    if(tt) tt.value = s.tt || '';
}

(window as any).saveSettings = () => {
    const fb = (document.getElementById('fb-pixel') as HTMLInputElement).value;
    const tt = (document.getElementById('tt-pixel') as HTMLInputElement).value;
    const newPass = (document.getElementById('setting-admin-pass') as HTMLInputElement).value;

    if(newPass.trim()) {
        AppState.adminPass = newPass;
        localStorage.setItem('storimage-admin-pass', newPass);
    }
    
    AppState.settings = { fb, tt };
    localStorage.setItem('storimage-settings', JSON.stringify(AppState.settings));
    showToast('تم حفظ إعدادات StorImage');
};

// --- Utilities ---
function updateStatsUI() {
    const t = document.getElementById('stat-total');
    const s = document.getElementById('stat-saved');
    if(t) t.innerText = AppState.stats.total;
    if(s) s.innerHTML = `${(AppState.stats.saved / 1024).toFixed(1)} <span class="text-xl">KB</span>`;
}

function showToast(msg: string) {
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');
    if(!t || !m) return;
    m.innerText = msg;
    t.classList.remove('translate-y-32', 'opacity-0');
    setTimeout(() => t.classList.add('translate-y-32', 'opacity-0'), 3000);
}

(window as any).shareTo = (p: string) => {
    const url = window.location.href;
    const text = "لقد قمت بتحويل صوري باستخدام StorImage! أداة مذهلة ⚡";
    let share = "";
    if(p === 'wa') share = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`;
    if(p === 'fb') share = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if(share) window.open(share, '_blank');
};

init();