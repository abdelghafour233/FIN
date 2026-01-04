export {};

// --- Types ---
interface ImageFile {
    id: string;
    file: File;
    name: string;
    originalSize: number;
    processedSize: number | null;
    preview: string;
    processedUrl: string | null;
    status: 'idle' | 'processing' | 'done' | 'error';
}

// --- Global State ---
const AppState = {
    view: 'upload',
    theme: localStorage.getItem('storimage_theme') || 'dark',
    files: [] as ImageFile[],
    stats: JSON.parse(localStorage.getItem('storimage_stats') || '{"total":0, "saved":0}'),
    settings: JSON.parse(localStorage.getItem('storimage_settings') || '{"fb":"","tt":""}')
};

// --- Core Functions ---

const applyTheme = () => {
    const html = document.documentElement;
    if (AppState.theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
};

const toggleTheme = () => {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('storimage_theme', AppState.theme);
    applyTheme();
    initLucide();
};

const switchView = (viewId: string) => {
    AppState.view = viewId;
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.remove('hidden');

    if (viewId === 'stats') updateStatsUI();
    
    // Update active state on nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-brand-primary', 'bg-brand-primary/10');
        if (btn.getAttribute('onclick')?.includes(viewId)) {
            btn.classList.add('text-brand-primary', 'bg-brand-primary/10');
        }
    });
    initLucide();
};

const updateStatsUI = () => {
    const totalEl = document.getElementById('stat-total');
    const savedEl = document.getElementById('stat-saved');
    if (totalEl) totalEl.innerText = AppState.stats.total.toString();
    if (savedEl) savedEl.innerHTML = `${(AppState.stats.saved / 1024).toFixed(1)} <span class="text-xl">KB</span>`;
};

// --- Image Processing Logic ---

const processImage = async (id: string) => {
    const f = AppState.files.find(x => x.id === id);
    if (!f || f.status === 'processing') return;

    f.status = 'processing';
    renderQueue();

    try {
        const quality = parseInt((document.getElementById('quality-slider') as HTMLInputElement).value) / 100;
        const format = (document.getElementById('export-format') as HTMLSelectElement).value;
        const filters = {
            b: (document.getElementById('bright-slider') as HTMLInputElement).value,
            c: (document.getElementById('contrast-slider') as HTMLInputElement).value,
            s: (document.getElementById('saturate-slider') as HTMLInputElement).value,
        };

        const result = await compress(f.preview, quality, format, filters);
        
        f.processedUrl = result.url;
        f.processedSize = result.size;
        f.status = 'done';

        AppState.stats.total++;
        const saved = f.originalSize - result.size;
        if (saved > 0) AppState.stats.saved += saved;
        localStorage.setItem('storimage_stats', JSON.stringify(AppState.stats));
    } catch (e) {
        f.status = 'error';
    }
    renderQueue();
};

const compress = (src: string, quality: number, format: string, filters: any): Promise<{url: string, size: number}> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            ctx.filter = `brightness(${filters.b}%) contrast(${filters.c}%) saturate(${filters.s}%)`;
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                resolve({
                    url: URL.createObjectURL(blob!),
                    size: blob!.size
                });
            }, format, quality);
        };
    });
};

const renderQueue = () => {
    const container = document.getElementById('file-queue');
    const controls = document.getElementById('studio-controls');
    if (!container || !controls) return;

    if (AppState.files.length === 0) {
        container.innerHTML = '';
        controls.classList.add('hidden');
        return;
    }

    controls.classList.remove('hidden');
    container.innerHTML = AppState.files.map(f => `
        <div class="glass p-5 rounded-[2rem] flex items-center justify-between gap-4 border border-white/5">
            <div class="flex items-center gap-4">
                <img src="${f.status === 'done' ? f.processedUrl : f.preview}" class="w-16 h-16 object-cover rounded-2xl shadow-lg">
                <div class="text-right">
                    <p class="text-sm font-black truncate w-32">${f.name}</p>
                    <p class="text-[10px] opacity-50 font-bold uppercase mt-1">
                        ${(f.originalSize/1024).toFixed(1)} KB 
                        ${f.processedSize ? ` ➜ <span class="text-brand-primary">${(f.processedSize/1024).toFixed(1)} KB</span>` : ''}
                    </p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${f.status === 'idle' ? 
                    `<button onclick="window.processImage('${f.id}')" class="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all"><i data-lucide="zap" class="w-5 h-5"></i></button>` :
                    f.status === 'processing' ?
                    `<div class="w-10 h-10 text-brand-primary animate-spin flex items-center justify-center"><i data-lucide="loader-2" class="w-5 h-5"></i></div>` :
                    `<a href="${f.processedUrl}" download="processed_${f.name}" class="w-10 h-10 bg-brand-success/10 text-brand-success rounded-xl flex items-center justify-center hover:bg-brand-success hover:text-white transition-all"><i data-lucide="download" class="w-5 h-5"></i></a>`
                }
                <button onclick="window.removeFile('${f.id}')" class="w-10 h-10 text-slate-500 hover:text-red-500"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>
    `).join('');
    initLucide();
};

const initLucide = () => {
    if ((window as any).lucide) (window as any).lucide.createIcons();
};

// --- Attach to Window (CRITICAL) ---
(window as any).switchView = switchView;
(window as any).toggleTheme = toggleTheme;
(window as any).processImage = processImage;
(window as any).processAll = () => AppState.files.forEach(f => processImage(f.id));
(window as any).removeFile = (id: string) => {
    AppState.files = AppState.files.filter(f => f.id !== id);
    renderQueue();
};
(window as any).clearQueue = () => {
    AppState.files = [];
    renderQueue();
};
(window as any).saveSettings = (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    AppState.settings = { fb: formData.get('fb'), tt: formData.get('tt') };
    localStorage.setItem('storimage_settings', JSON.stringify(AppState.settings));
    alert('تم الحفظ ✅');
};

// --- Init on Load ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
        fileInput.onchange = (e: any) => {
            const incoming = e.target.files;
            if (incoming) {
                for (const file of Array.from(incoming as FileList)) {
                    AppState.files.push({
                        id: Math.random().toString(36).substr(2, 9),
                        file, name: file.name, originalSize: file.size,
                        processedSize: null, preview: URL.createObjectURL(file),
                        processedUrl: null, status: 'idle'
                    });
                }
                renderQueue();
            }
        };
    }

    // Sliders Listeners
    ['quality', 'bright', 'contrast', 'saturate'].forEach(id => {
        const slider = document.getElementById(`${id}-slider`) as HTMLInputElement;
        const val = document.getElementById(`${id}-val`);
        if (slider && val) {
            slider.addEventListener('input', (e: any) => {
                val.innerText = e.target.value + (id === 'quality' ? '%' : '%');
            });
        }
    });

    initLucide();
    console.log('StorImage Studio Ready');
});