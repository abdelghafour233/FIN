export {};

// --- Core State Management ---
const AppState = {
    theme: localStorage.getItem('storimage-theme') || 'dark',
    currentView: 'upload',
    files: [] as any[],
    isUnlocked: sessionStorage.getItem('storimage-unlocked') === 'true',
    adminPass: localStorage.getItem('storimage-admin-pass') || '1234',
    stats: JSON.parse(localStorage.getItem('storimage-stats') || '{"total":0,"saved":0}'),
    // الإعدادات الافتراضية مع أكواد Adsterra الصحيحة
    settings: JSON.parse(localStorage.getItem('storimage-settings') || JSON.stringify({
        fb: '', 
        tt: '', 
        adPop: '<script src="https://bouncingbuzz.com/29/98/27/29982794e86cad0441c5d56daad519bd.js"></script>',
        adSocial: '<script src="https://bouncingbuzz.com/15/38/5b/15385b7c751e6c7d59d59fb7f34e2934.js"></script>',
        adCustom: `<script type="text/javascript">
	atOptions = {
		'key' : '0295263cf4ed8d9e3a97b6a2490864ee',
		'format' : 'iframe',
		'height' : 250,
		'width' : 300,
		'params' : {}
	};
</script>
<script type="text/javascript" src="//bouncingbuzz.com/0295263cf4ed8d9e3a97b6a2490864ee/invoke.js"></script>`
    }))
};

// --- UI Helpers ---
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

// وظيفة لحقن السكربتات في الصفحة (لتفعيل الإعلانات)
const injectScripts = () => {
    const { adPop, adCustom, adSocial } = AppState.settings;
    const container = document.getElementById('ads-injection-container');
    if (container) {
        // تنظيف الحاوية
        container.innerHTML = '';
        
        // دمج الأكواد
        const combinedHTML = (adPop || '') + (adCustom || '') + (adSocial || '');
        
        // استخدام Range لضمان تنفيذ السكربتات
        try {
            const range = document.createRange();
            const fragment = range.createContextualFragment(combinedHTML);
            container.appendChild(fragment);
            console.log("Scripts Injected Successfully (Popunder + SocialBar + Banner)");
        } catch (e) {
            console.error("Error injecting scripts:", e);
        }
    }
};

const switchView = (viewId: string) => {
    if (viewId === 'settings' && !AppState.isUnlocked) {
        (window as any).openAuth();
        return;
    }
    AppState.currentView = viewId;
    
    // Desktop Nav
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${viewId}`)?.classList.add('active');
    
    // Mobile Nav
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`m-nav-${viewId}`)?.classList.add('active');
    
    // Views
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`)?.classList.add('active');
    
    if(viewId === 'stats') updateStatsUI();
    if(viewId === 'settings') loadSettings();
    
    initLucide();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const toggleTheme = () => {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('storimage-theme', AppState.theme);
    applyTheme();
};

const openAuth = () => document.getElementById('auth-modal')?.classList.add('open');
const closeAuth = () => document.getElementById('auth-modal')?.classList.remove('open');

const verifyAdmin = () => {
    const input = document.getElementById('admin-pass') as HTMLInputElement;
    if (input && input.value === AppState.adminPass) {
        AppState.isUnlocked = true;
        sessionStorage.setItem('storimage-unlocked', 'true');
        (window as any).closeAuth();
        (window as any).switchView('settings');
        showToast('مرحباً أيها المسؤول');
        input.value = '';
    } else {
        showToast('كلمة السر غير صحيحة');
    }
};

const lockDashboard = () => {
    AppState.isUnlocked = false;
    sessionStorage.removeItem('storimage-unlocked');
    (window as any).switchView('upload');
    showToast('تم قفل الإعدادات');
};

// Global Exports
(window as any).switchView = switchView;
(window as any).toggleTheme = toggleTheme;
(window as any).openAuth = openAuth;
(window as any).closeAuth = closeAuth;
(window as any).verifyAdmin = verifyAdmin;
(window as any).lockDashboard = lockDashboard;

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
    if(count > 0) { renderQueue(); showToast(`تمت إضافة ${count} صور`); }
}

function renderQueue() {
    const queue = document.getElementById('file-queue');
    const bar = document.getElementById('action-bar');
    if(!queue) return;
    if(AppState.files.length === 0) { queue.innerHTML = ''; bar?.classList.add('hidden'); return; }
    bar?.classList.remove('hidden');
    const hasDone = AppState.files.some(f => f.status === 'done');
    const hasIdle = AppState.files.some(f => f.status === 'idle');
    document.getElementById('btn-download-all')?.classList.toggle('hidden', !hasDone);
    document.getElementById('btn-process-all')?.classList.toggle('hidden', !hasIdle);
    queue.innerHTML = AppState.files.map(f => `
        <div class="glass p-5 rounded-3xl flex items-center gap-5 transition-all hover:bg-white/5">
            <div class="relative w-16 h-16 shrink-0">
                <img src="${f.preview}" class="w-full h-full object-cover rounded-2xl shadow-md">
                ${f.status === 'done' ? '<div class="absolute -top-1 -right-1 bg-brand-success text-white p-1 rounded-full"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
            </div>
            <div class="flex-grow overflow-hidden text-right">
                <h4 class="text-xs font-black truncate">${f.name}</h4>
                <p class="text-[9px] text-slate-500 font-black mt-1 uppercase tracking-widest">${(f.size/1024).toFixed(1)} KB</p>
            </div>
            <div class="flex items-center gap-2">
                ${f.status === 'idle' ? 
                    `<button onclick="window.processOne('${f.id}')" class="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all"><i data-lucide="play" class="w-6 h-6"></i></button>` :
                    f.status === 'processing' ?
                    `<div class="w-12 h-12 text-brand-primary animate-spin flex items-center justify-center"><i data-lucide="loader" class="w-6 h-6"></i></div>` :
                    `<button onclick="window.downloadOne('${f.id}')" class="w-12 h-12 bg-brand-success text-white rounded-2xl flex items-center justify-center hover:scale-110 shadow-lg"><i data-lucide="download" class="w-6 h-6"></i></button>`
                }
                <button onclick="window.removeFile('${f.id}')" class="w-12 h-12 text-slate-400 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
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
    showToast('جاري بدء التحميلات...');
};

(window as any).removeFile = (id: string) => { AppState.files = AppState.files.filter(f => f.id !== id); renderQueue(); };
(window as any).clearQueue = () => { AppState.files = []; renderQueue(); showToast('تمت تصفية القائمة'); };

function loadSettings() {
    const s = AppState.settings;
    const fb = document.getElementById('fb-pixel') as HTMLInputElement;
    const tt = document.getElementById('tt-pixel') as HTMLInputElement;
    const adPop = document.getElementById('ads-popunder') as HTMLTextAreaElement;
    const adSocial = document.getElementById('ads-social') as HTMLTextAreaElement;
    const adCustom = document.getElementById('ads-custom-script') as HTMLTextAreaElement;

    if(fb) fb.value = s.fb || '';
    if(tt) tt.value = s.tt || '';
    if(adPop) adPop.value = s.adPop || '';
    if(adSocial) adSocial.value = s.adSocial || '';
    if(adCustom) adCustom.value = s.adCustom || '';
}

(window as any).saveSettings = () => {
    const fb = (document.getElementById('fb-pixel') as HTMLInputElement).value;
    const tt = (document.getElementById('tt-pixel') as HTMLInputElement).value;
    const adPop = (document.getElementById('ads-popunder') as HTMLTextAreaElement).value;
    const adSocial = (document.getElementById('ads-social') as HTMLTextAreaElement).value;
    const adCustom = (document.getElementById('ads-custom-script') as HTMLTextAreaElement).value;

    AppState.settings = { fb, tt, adPop, adSocial, adCustom };
    localStorage.setItem('storimage-settings', JSON.stringify(AppState.settings));
    
    // إعادة حقن السكربتات فوراً لتفعيل الإعلانات
    injectScripts();
    
    showToast('تم حفظ الإعدادات');
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

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    setupDropZone();
    updateStatsUI();
    initLucide();
    
    // حقن السكربتات عند بدء التشغيل
    injectScripts();
    
    const slider = document.getElementById('quality-slider') as HTMLInputElement;
    const qVal = document.getElementById('quality-val');
    if(slider && qVal) {
        slider.addEventListener('input', (e: any) => {
            qVal.innerText = e.target.value + '%';
        });
    }
});