export {};

// --- State ---
const AppState = {
    theme: localStorage.getItem('storimage-theme') || 'dark',
    files: [] as any[],
};

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    initLucide();
    setupImageLogic();

    const slider = document.getElementById('quality-slider') as HTMLInputElement;
    const qVal = document.getElementById('quality-val');
    if (slider && qVal) {
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

(window as any).switchView = (view: string) => {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`)?.classList.add('active');
    initLucide();
};

// --- Image Processing ---
function setupImageLogic() {
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
        <div class="glass p-4 rounded-2xl flex items-center justify-between gap-4">
            <div class="flex items-center gap-4 truncate">
                <img src="${f.preview}" class="w-12 h-12 object-cover rounded-lg shrink-0">
                <div class="truncate text-right">
                    <p class="text-xs font-bold truncate">${f.name}</p>
                    <p class="text-[10px] text-slate-500 uppercase">${(f.size/1024).toFixed(1)} KB</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${f.status === 'idle' ? 
                    `<button onclick="window.processOne('${f.id}')" class="p-2 bg-brand-primary text-white rounded-lg"><i data-lucide="play" class="w-4 h-4"></i></button>` :
                    f.status === 'processing' ?
                    `<div class="animate-spin text-brand-primary"><i data-lucide="loader" class="w-4 h-4"></i></div>` :
                    `<button onclick="window.downloadOne('${f.id}')" class="p-2 bg-brand-success text-white rounded-lg"><i data-lucide="download" class="w-4 h-4"></i></button>`
                }
                <button onclick="window.removeFile('${f.id}')" class="p-2 text-slate-400 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
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
    }, 600);
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
    t.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000);
};