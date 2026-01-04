export {};

// --- App State ---
const AppState = {
    theme: localStorage.getItem('imgpro-theme') || 'dark',
    currentView: 'upload',
    files: [] as any[],
    isUnlocked: sessionStorage.getItem('imgpro-unlocked') === 'true',
    adminPass: localStorage.getItem('imgpro-admin-pass') || '1234',
    stats: JSON.parse(localStorage.getItem('imgpro-stats') || '{"total":0,"saved":0}'),
    settings: JSON.parse(localStorage.getItem('imgpro-settings') || '{"fb":"","tt":"","adsterra":"","domain":"","sheets":""}')
};

// --- Initialization ---
const init = () => {
    applyTheme();
    loadSettings();
    setupDropZone();
    updateStatsUI();
    initLucide();
    setupSliders();
    applyAdsterra();
    console.log("ImgPro Initialized.");
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

// --- Adsterra ---
function applyAdsterra() {
    const container = document.getElementById('adsterra-footer-container');
    if (!container) return;
    container.innerHTML = '';
    const adKey = '0295263cf4ed8d9e3a97b6a2490864ee';
    (window as any).atOptions = {
        'key' : adKey,
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
    };
    const script = document.createElement('script');
    script.src = `https://bouncingbuzz.com/${adKey}/invoke.js`;
    script.async = true;
    container.appendChild(script);
}

// --- Auth & Dashboard Controls (FIXED) ---
(window as any).closeAuth = () => {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.classList.remove('active');
};

(window as any).verifyPass = () => {
    const passInput = document.getElementById('admin-pass') as HTMLInputElement;
    if (passInput && passInput.value === AppState.adminPass) {
        AppState.isUnlocked = true;
        sessionStorage.setItem('imgpro-unlocked', 'true');
        (window as any).closeAuth();
        (window as any).switchView('settings');
        showToast('تم الدخول بنجاح');
        passInput.value = '';
    } else {
        showToast('كلمة السر غير صحيحة');
    }
};

(window as any).lockDashboard = () => {
    AppState.isUnlocked = false;
    sessionStorage.removeItem('imgpro-unlocked');
    (window as any).switchView('upload');
    showToast('تم قفل لوحة التحكم');
};

(window as any).togglePasswordVisibility = (inputId: string, iconId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const icon = document.getElementById(iconId);
    if (input && icon) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        icon.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
        initLucide();
    }
};

(window as any).saveSettings = () => {
    const fb = (document.getElementById('fb-pixel') as HTMLInputElement)?.value;
    const tt = (document.getElementById('tt-pixel') as HTMLInputElement)?.value;
    const newPass = (document.getElementById('setting-admin-pass') as HTMLInputElement)?.value;

    if (newPass && newPass.trim().length > 0) {
        AppState.adminPass = newPass;
        localStorage.setItem('imgpro-admin-pass', newPass);
    }

    AppState.settings = { ...AppState.settings, fb, tt };
    localStorage.setItem('imgpro-settings', JSON.stringify(AppState.settings));
    
    showToast('تم حفظ التغييرات بنجاح');
};

// --- Social Share ---
(window as any).shareTo = (platform: string) => {
    const url = window.location.origin + window.location.pathname;
    const text = "لقد قمت للتو بمعالجة صوري باستخدام إيميج برو! منصة مذهلة وسريعة ⚡";
    let shareUrl = "";
    switch(platform) {
        case 'wa': shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`; break;
        case 'fb': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`; break;
        case 'tw': shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`; break;
        case 'tg': shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`; break;
    }
    if(shareUrl) window.open(shareUrl, '_blank');
};

// --- Theme Management ---
(window as any).toggleTheme = () => {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('imgpro-theme', AppState.theme);
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

// --- Navigation ---
(window as any).switchView = (viewId: string) => {
    if (viewId === 'settings' && !AppState.isUnlocked) {
        const overlay = document.getElementById('auth-overlay');
        if (overlay) overlay.classList.add('active');
        return;
    }
    AppState.currentView = viewId;
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${viewId}`);
    if(activeBtn) activeBtn.classList.add('active');
    document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(`view-${viewId}`);
    if(targetView) targetView.classList.add('active');
    if(viewId === 'stats') updateStatsUI();
    if(viewId === 'settings') loadSettings();
    initLucide();
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
    for (let i = 0; i < incoming.length; i++) {
        const file = incoming[i];
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
    const shareSec = document.getElementById('share-section');
    const btnDownloadAll = document.getElementById('btn-download-all');
    const btnProcessAll = document.getElementById('btn-process-all');

    if(!queue) return;
    if(AppState.files.length === 0) {
        queue.innerHTML = '';
        if(bar) bar.classList.add('hidden');
        return;
    }

    if(bar) bar.classList.remove('hidden');
    const hasDone = AppState.files.some(f => f.status === 'done');
    const hasIdle = AppState.files.some(f => f.status === 'idle');
    if(btnDownloadAll) btnDownloadAll.classList.toggle('hidden', !hasDone);
    if(btnProcessAll) btnProcessAll.classList.toggle('hidden', !hasIdle);
    if(shareSec) shareSec.classList.toggle('hidden', !hasDone);

    queue.innerHTML = AppState.files.map(f => `
        <div class="neon-card p-6 rounded-[2rem] flex items-center gap-5 transition-all hover:scale-[1.03] ${f.status === 'done' ? 'image-ready' : ''}">
            <div class="relative w-20 h-20 shrink-0">
                <img src="${f.preview}" class="w-full h-full object-cover rounded-2xl shadow-xl">
                ${f.status === 'done' ? '<div class="absolute -top-2 -right-2 bg-brand-green text-black p-1.5 rounded-full shadow-lg border-2 border-brand-black"><i data-lucide="check" class="w-3.5 h-3.5"></i></div>' : ''}
            </div>
            <div class="flex-grow overflow-hidden text-right">
                <h4 class="text-sm font-black truncate">${f.name}</h4>
                <p class="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">${(f.size/1024).toFixed(1)} KB</p>
            </div>
            <div class="flex flex-col gap-2">
                ${f.status === 'idle' ? 
                    `<button onclick="window.processOne('${f.id}')" class="w-12 h-12 bg-brand-green/20 text-brand-green rounded-2xl flex items-center justify-center hover:bg-brand-green hover:text-black transition-all"><i data-lucide="zap" class="w-6 h-6"></i></button>` :
                    f.status === 'processing' ?
                    `<div class="w-12 h-12 text-brand-green animate-spin flex items-center justify-center"><i data-lucide="loader" class="w-6 h-6"></i></div>` :
                    `<button onclick="window.downloadOne('${f.id}')" class="w-12 h-12 bg-brand-green text-black rounded-2xl flex items-center justify-center hover:scale-110 shadow-lg"><i data-lucide="download" class="w-6 h-6"></i></button>`
                }
                <button onclick="window.removeFile('${f.id}')" class="w-12 h-12 text-slate-700 hover:text-red-500"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>
    `).join('');
    setTimeout(initLucide, 50);
}

(window as any).removeFile = (id: string) => {
    AppState.files = AppState.files.filter(f => f.id !== id);
    renderQueue();
};

(window as any).clearQueue = () => {
    AppState.files = [];
    renderQueue();
};

(window as any).processOne = (id: string) => {
    const f = AppState.files.find(x => x.id === id);
    if(!f || f.status !== 'idle') return;
    f.status = 'processing';
    renderQueue();
    setTimeout(() => {
        f.status = 'done';
        AppState.stats.total++;
        const slider = document.getElementById('quality-slider') as HTMLInputElement;
        const qual = slider ? (parseInt(slider.value) / 100) : 0.85;
        AppState.stats.saved += Math.floor(f.size * (1 - qual));
        localStorage.setItem('imgpro-stats', JSON.stringify(AppState.stats));
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
    const format = (document.getElementById('export-format') as HTMLSelectElement)?.value || 'webp';
    const prefix = (document.getElementById('name-prefix') as HTMLInputElement)?.value || '';
    const link = document.createElement('a');
    link.href = f.preview;
    link.download = `${prefix}${f.originalName}_imgpro.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

(window as any).downloadAll = () => {
    const doneFiles = AppState.files.filter(f => f.status === 'done');
    doneFiles.forEach((f, idx) => {
        setTimeout(() => (window as any).downloadOne(f.id), idx * 400);
    });
};

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
    t.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000);
}

function loadSettings() {
    const s = AppState.settings;
    const fbIn = document.getElementById('fb-pixel') as HTMLInputElement;
    const ttIn = document.getElementById('tt-pixel') as HTMLInputElement;
    if (fbIn) fbIn.value = s.fb || '';
    if (ttIn) ttIn.value = s.tt || '';
}

init();