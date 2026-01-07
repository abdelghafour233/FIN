export {};

interface ImageFile {
    id: string;
    file: File;
    name: string;
    size: number;
    preview: string;
    processedUrl?: string;
    status: 'idle' | 'processing' | 'done';
}

const AD_PASSWORD = "admin";

const DEFAULT_ADS = {
    smart: `<!-- Adsterra: 28274571 -->
<script src="https://bouncingbuzz.com/29/98/27/29982794e86cad0441c5d56daad519bd.js"></script>`,
};

const getSavedAds = () => {
    try {
        const saved = localStorage.getItem('elite-ads');
        return saved ? JSON.parse(saved) : DEFAULT_ADS;
    } catch (e) {
        return DEFAULT_ADS;
    }
};

const State = {
    files: [] as ImageFile[],
    activeId: null as string | null,
    theme: localStorage.getItem('elite-theme') || 'dark',
    ads: getSavedAds()
};

const injectAds = () => {
    const container = document.getElementById('ad-global-container');
    if (container && State.ads.smart) {
        const range = document.createRange();
        const fragment = range.createContextualFragment(State.ads.smart);
        container.appendChild(fragment);
    }
};

const showToast = (msg: string) => {
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');
    if (t && m) {
        m.innerText = msg;
        t.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000);
    }
};

const applyTheme = () => {
    document.documentElement.className = State.theme;
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.setAttribute('data-lucide', State.theme === 'dark' ? 'sun' : 'moon');
    }
    if ((window as any).lucide) (window as any).lucide.createIcons();
};

(window as any).toggleTheme = () => {
    State.theme = State.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('elite-theme', State.theme);
    applyTheme();
};

const updateUI = () => {
    const active = State.files.find(f => f.id === State.activeId);
    if (!active) return;
    const img = document.getElementById('main-preview') as HTMLImageElement;
    if (img) img.src = active.preview;
    const actions = document.getElementById('action-area');
    if (active.status === 'done') actions?.classList.remove('hidden');
    else actions?.classList.add('hidden');
    renderQueue();
};

const renderQueue = () => {
    const list = document.getElementById('image-queue');
    if (!list) return;
    list.innerHTML = State.files.map(f => `
        <div onclick="window.setActive('${f.id}')" class="shrink-0 cursor-pointer relative">
            <img src="${f.preview}" class="w-20 h-20 object-cover rounded-2xl border-2 transition-all ${State.activeId === f.id ? 'border-brand-primary scale-110' : 'border-transparent opacity-50'}">
        </div>
    `).join('');
};

(window as any).setActive = (id: string) => {
    State.activeId = id;
    updateUI();
};

(window as any).openAdmin = () => {
    const pass = prompt("كلمة السر:");
    if (pass === AD_PASSWORD) {
        document.getElementById('app-container')?.classList.add('hidden');
        document.getElementById('admin-view')?.classList.remove('hidden');
        (document.getElementById('ad-smart') as HTMLTextAreaElement).value = State.ads.smart;
    }
};

(window as any).closeAdmin = () => {
    document.getElementById('admin-view')?.classList.add('hidden');
    document.getElementById('app-container')?.classList.remove('hidden');
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    injectAds();

    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput?.addEventListener('change', (e: any) => {
        const items = Array.from(e.target.files as FileList);
        items.forEach(file => {
            State.files.push({
                id: Math.random().toString(36).substr(2, 9),
                file, name: file.name, size: file.size, preview: URL.createObjectURL(file), status: 'idle'
            });
        });
        if (!State.activeId && State.files.length > 0) State.activeId = State.files[0].id;
        document.getElementById('upload-view')?.classList.add('hidden');
        document.getElementById('workspace-view')?.classList.remove('hidden');
        updateUI();
    });

    document.getElementById('q-slider')?.addEventListener('input', (e: any) => {
        const label = document.getElementById('q-label');
        if (label) label.innerText = e.target.value + '%';
    });

    document.getElementById('start-process')?.addEventListener('click', async () => {
        const active = State.files.find(f => f.id === State.activeId);
        if (!active) return;
        const overlay = document.getElementById('processing-overlay');
        if (overlay) overlay.style.display = 'flex';
        
        // Simulating processing
        setTimeout(() => {
            active.status = 'done';
            active.processedUrl = active.preview;
            if (overlay) overlay.style.display = 'none';
            updateUI();
            showToast('تمت المعالجة!');
        }, 1500);
    });

    document.getElementById('save-ads')?.addEventListener('click', () => {
        const smartValue = (document.getElementById('ad-smart') as HTMLTextAreaElement).value;
        State.ads.smart = smartValue;
        localStorage.setItem('elite-ads', JSON.stringify(State.ads));
        showToast('تم الحفظ!');
        setTimeout(() => window.location.reload(), 500);
    });
});