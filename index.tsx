export {};

// --- App State (RESTORED ALL FIELDS) ---
const AppState = {
    theme: localStorage.getItem('storimage-theme') || 'dark',
    files: [] as any[],
    settings: JSON.parse(localStorage.getItem('storimage-adv-settings') || JSON.stringify({
        fb: '',
        tt: '',
        ga: '',
        sheets: '',
        domain: '',
        ads: `<script type="text/javascript">
	atOptions = {
		'key' : '15385b7c751e6c7d59d59fb7f34e2934',
		'format' : 'iframe',
		'height' : 90,
		'width' : 728,
		'params' : {}
	};
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/15385b7c751e6c7d59d59fb7f34e2934/invoke.js"></script>`
    }))
};

// --- Core Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    setupDropZone();
    loadSettingsIntoUI();
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

const applyTheme = () => {
    const html = document.documentElement;
    AppState.theme === 'dark' ? html.classList.add('dark') : html.classList.remove('dark');
};

(window as any).toggleTheme = () => {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('storimage-theme', AppState.theme);
    applyTheme();
};

// --- Settings Management (RESTORED) ---
(window as any).openSettings = () => {
    const pass = prompt('كلمة السر (1234):');
    if (pass === '1234') {
        document.getElementById('modal-settings')?.classList.add('open');
        loadSettingsIntoUI();
    } else if (pass !== null) {
        alert('كلمة سر خاطئة');
    }
};

(window as any).closeSettings = () => document.getElementById('modal-settings')?.classList.remove('open');

function loadSettingsIntoUI() {
    const s = AppState.settings;
    (document.getElementById('set-fb') as HTMLInputElement).value = s.fb;
    (document.getElementById('set-tt') as HTMLInputElement).value = s.tt;
    (document.getElementById('set-ga') as HTMLInputElement).value = s.ga;
    (document.getElementById('set-sheets') as HTMLInputElement).value = s.sheets;
    (document.getElementById('set-domain') as HTMLInputElement).value = s.domain;
    (document.getElementById('set-ads') as HTMLTextAreaElement).value = s.ads;
}

(window as any).saveAllSettings = () => {
    AppState.settings = {
        fb: (document.getElementById('set-fb') as HTMLInputElement).value,
        tt: (document.getElementById('set-tt') as HTMLInputElement).value,
        ga: (document.getElementById('set-ga') as HTMLInputElement).value,
        sheets: (document.getElementById('set-sheets') as HTMLInputElement).value,
        domain: (document.getElementById('set-domain') as HTMLInputElement).value,
        ads: (document.getElementById('set-ads') as HTMLTextAreaElement).value,
    };
    localStorage.setItem('storimage-adv-settings', JSON.stringify(AppState.settings));
    injectAds();
    showToast('تم حفظ كافة الإعدادات بنجاح');
    (window as any).closeSettings();
};

// --- Ads Injection (FOOTER ONLY) ---
function injectAds() {
    const container = document.getElementById('ad-slot-footer');
    if (container && AppState.settings.ads.trim() !== "") {
        container.innerHTML = '';
        try {
            const range = document.createRange();
            const fragment = range.createContextualFragment(AppState.settings.ads);
            container.appendChild(fragment);
            console.log("Ads injected into footer only.");
        } catch (e) {
            console.error("Ad injection failed", e);
        }
    }
}

// --- Image Logic ---
function setupDropZone() {
    const input = document.getElementById('file-input') as HTMLInputElement;
    if (input) {
        input.addEventListener('change', (e: any) => handleFiles(e.target.files));
    }
}

function handleFiles(files: FileList) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        AppState.files.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            originalName: file.name.split('.').slice(0, -1).join('.'),
            size: file.size,
            preview: URL.createObjectURL(file),
            status: 'idle'
        });
    }
    renderQueue();
}

function renderQueue() {
    const queue = document.getElementById('file-queue');
    const bar = document.getElementById('action-bar');
    if (!queue || !bar) return;

    if (AppState.files.length === 0) {
        queue.innerHTML = '';
        bar.classList.add('hidden');
        return;
    }

    bar.classList.remove('hidden');
    const hasDone = AppState.files.some(f => f.status === 'done');
    const hasIdle = AppState.files.some(f => f.status === 'idle');
    
    document.getElementById('btn-download-all')?.classList.toggle('hidden', !hasDone);
    document.getElementById('btn-process-all')?.classList.toggle('hidden', !hasIdle);

    queue.innerHTML = AppState.files.map(f => `
        <div class="glass p-5 rounded-3xl flex items-center justify-between gap-4 border border-white/5 hover:border-brand-primary/20 transition-all">
            <div class="flex items-center gap-4 truncate">
                <div class="relative w-14 h-14 shrink-0">
                    <img src="${f.preview}" class="w-full h-full object-cover rounded-xl shadow-lg">
                    ${f.status === 'done' ? '<div class="absolute -top-1 -right-1 bg-brand-success text-white p-1 rounded-full"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
                </div>
                <div class="truncate text-right">
                    <p class="text-xs font-black truncate">${f.name}</p>
                    <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">${(f.size/1024).toFixed(1)} KB</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${f.status === 'idle' ? 
                    `<button onclick="window.processOne('${f.id}')" class="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all"><i data-lucide="play" class="w-4 h-4"></i></button>` :
                    f.status === 'processing' ?
                    `<div class="w-10 h-10 text-brand-primary animate-spin flex items-center justify-center"><i data-lucide="loader" class="w-4 h-4"></i></div>` :
                    `<button onclick="window.downloadOne('${f.id}')" class="w-10 h-10 bg-brand-success text-white rounded-xl flex items-center justify-center hover:scale-110 shadow-xl transition-all"><i data-lucide="download" class="w-4 h-4"></i></button>`
                }
                <button onclick="window.removeFile('${f.id}')" class="w-10 h-10 text-slate-500 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
    `).join('');
    initLucide();
}

(window as any).processOne = (id: string) => {
    const f = AppState.files.find(x => x.id === id);
    if (!f) return;
    f.status = 'processing';
    renderQueue();
    setTimeout(() => {
        f.status = 'done';
        renderQueue();
    }, 800);
};

(window as any).processAll = () => AppState.files.forEach(f => f.status === 'idle' && (window as any).processOne(f.id));

(window as any).downloadOne = (id: string) => {
    const f = AppState.files.find(x => x.id === id);
    if (!f || f.status !== 'done') return;
    const format = (document.getElementById('export-format') as HTMLSelectElement).value;
    const a = document.createElement('a');
    a.href = f.preview;
    a.download = `${f.originalName}_storimage.${format}`;
    a.click();
};

(window as any).downloadAll = () => AppState.files.filter(f => f.status === 'done').forEach((f, i) => setTimeout(() => (window as any).downloadOne(f.id), i * 300));
(window as any).removeFile = (id: string) => { AppState.files = AppState.files.filter(f => f.id !== id); renderQueue(); };
(window as any).clearQueue = () => { AppState.files = []; renderQueue(); };

const showToast = (msg: string) => {
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');
    if (!t || !m) return;
    m.innerText = msg;
    t.classList.remove('translate-y-32', 'opacity-0');
    setTimeout(() => t.classList.add('translate-y-32', 'opacity-0'), 3000);
};