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

const State = {
    files: [] as ImageFile[],
    activeId: null as string | null,
    theme: localStorage.getItem('elite-theme') || 'dark'
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
    if (icon) icon.setAttribute('data-lucide', State.theme === 'dark' ? 'sun' : 'moon');
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
    img.src = active.preview;
    
    const actions = document.getElementById('action-area');
    if (active.status === 'done') {
        actions?.classList.remove('hidden');
    } else {
        actions?.classList.add('hidden');
    }

    renderQueue();
    if ((window as any).lucide) (window as any).lucide.createIcons();
};

const renderQueue = () => {
    const list = document.getElementById('image-queue');
    if (!list) return;
    list.innerHTML = State.files.map(f => `
        <div onclick="window.setActive('${f.id}')" class="shrink-0 cursor-pointer relative group">
            <img src="${f.preview}" class="w-24 h-24 object-cover rounded-[1.5rem] border-4 transition-all ${State.activeId === f.id ? 'border-brand-primary scale-110 shadow-2xl' : 'border-transparent opacity-50 hover:opacity-100'}">
            ${f.status === 'done' ? '<div class="absolute -top-2 -right-2 bg-brand-success text-white p-