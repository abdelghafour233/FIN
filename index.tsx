export {};

interface ImageItem {
    id: string;
    file: File;
    name: string;
    originalSize: number;
    processedSize: number | null;
    preview: string;
    processedUrl: string | null;
    status: 'idle' | 'processing' | 'done' | 'error';
}

const State = {
    files: [] as ImageItem[],
    selectedId: null as string | null,
    theme: localStorage.getItem('img-theme') || 'dark',
    isDashboardOpen: false,
    isAuthenticated: false,
    dashboardPassword: 'admin123'
};

const applyTheme = () => {
    document.documentElement.classList.toggle('dark', State.theme === 'dark');
    if ((window as any).lucide) (window as any).lucide.createIcons();
};

(window as any).toggleTheme = () => {
    State.theme = State.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('img-theme', State.theme);
    applyTheme();
};

(window as any).toggleDashboard = () => {
    State.isDashboardOpen = !State.isDashboardOpen;
    const view = document.getElementById('dashboard-view');
    if (view) {
        view.classList.toggle('open', State.isDashboardOpen);
        if (State.isDashboardOpen && !State.isAuthenticated) {
            document.getElementById('dashboard-login')?.classList.remove('hidden');
            document.getElementById('dashboard-content')?.classList.add('hidden');
        }
    }
};

(window as any).verifyDashboardPass = () => {
    const input = document.getElementById('dashboard-pass-input') as HTMLInputElement;
    if (input.value === State.dashboardPassword) {
        State.isAuthenticated = true;
        document.getElementById('dashboard-login')?.classList.add('hidden');
        document.getElementById('dashboard-content')?.classList.remove('hidden');
        showToast('مرحباً بك في لوحة التحكم');
    } else {
        showToast('كلمة المرور خاطئة');
    }
};

const showToast = (msg: string) => {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    if (toast && toastMsg) {
        toastMsg.innerText = msg;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
    }
};

const updateActivePreview = () => {
    const active = State.files.find(f => f.id === State.selectedId);
    const mainImg = document.getElementById('main-preview-img') as HTMLImageElement;
    const nameEl = document.getElementById('active-name');
    const sizeEl = document.getElementById('active-size');
    const downloadZone = document.getElementById('download-zone');
    const downloadAnchor = document.getElementById('final-download-link') as HTMLAnchorElement;

    if (!active || !mainImg) return;

    mainImg.src = active.preview;
    if (nameEl) nameEl.innerText = active.name;
    if (sizeEl) sizeEl.innerText = `الحجم: ${(active.originalSize/1024).toFixed(1)} KB ${active.processedSize ? ` ➔ ${(active.processedSize/1024).toFixed(1)} KB` : ''}`;
    
    if (active.status === 'done' && downloadZone && downloadAnchor) {
        downloadZone.classList.remove('hidden');
        downloadAnchor.href = active.processedUrl || '#';
        downloadAnchor.download = `processed_${active.name}`;
    } else {
        downloadZone?.classList.add('hidden');
    }

    renderThumbs();
};

const renderThumbs = () => {
    const list = document.getElementById('thumbs-list');
    if (!list) return;

    list.innerHTML = State.files.map(f => `
        <div onclick="window.selectImage('${f.id}')" class="relative shrink-0 cursor-pointer transition-all">
            <img src="${f.preview}" class="w-16 h-16 object-cover rounded-xl border-2 ${State.selectedId === f.id ? 'border-brand-primary' : 'border-transparent'}">
            ${f.status === 'done' ? '<div class="absolute -top-1 -right-1 bg-brand-success text-white p-0.5 rounded-full"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
        </div>
    `).join('');
    if ((window as any).lucide) (window as any).lucide.createIcons();
};

(window as any).selectImage = (id: string) => {
    State.selectedId = id;
    updateActivePreview();
};

const processImage = async (item: ImageItem) => {
    if (item.status === 'done' || item.status === 'processing') return;

    item.status = 'processing';
    updateActivePreview();

    const quality = parseInt((document.getElementById('quality-slider') as HTMLInputElement).value) / 100;
    const format = (document.getElementById('format-select') as HTMLSelectElement).value;

    try {
        const img = new Image();
        img.src = item.preview;
        await new Promise(r => img.onload = r);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, format, quality));
        if (blob) {
            item.processedSize = blob.size;
            item.processedUrl = URL.createObjectURL(blob);
            item.status = 'done';
            showToast('تمت المعالجة بنجاح');
        }
    } catch (e) {
        item.status = 'error';
        showToast('خطأ أثناء المعالجة');
    }
    
    updateActivePreview();
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    
    const input = document.getElementById('file-input') as HTMLInputElement;
    const slider = document.getElementById('quality-slider') as HTMLInputElement;
    const processBtn = document.getElementById('process-active-btn');
    const downloadTriggerBtn = document.getElementById('final-download-btn-trigger');

    input?.addEventListener('change', (e: any) => {
        const incoming = Array.from(e.target.files as FileList);
        incoming.forEach(file => {
            State.files.push({
                id: Math.random().toString(36).substr(2, 9),
                file,
                name: file.name,
                originalSize: file.size,
                processedSize: null,
                preview: URL.createObjectURL(file),
                processedUrl: null,
                status: 'idle'
            });
        });

        if (!State.selectedId && State.files.length > 0) State.selectedId = State.files[0].id;

        document.getElementById('upload-view')?.classList.add('hidden');
        document.getElementById('workspace-view')?.classList.remove('hidden');
        updateActivePreview();
    });

    slider?.addEventListener('input', (e: any) => {
        const v = document.getElementById('quality-val');
        if (v) v.innerText = e.target.value + '%';
    });

    processBtn?.addEventListener('click', () => {
        const active = State.files.find(f => f.id === State.selectedId);
        if (active) processImage(active);
    });

    downloadTriggerBtn?.addEventListener('click', () => {
        (document.getElementById('final-download-link') as HTMLAnchorElement).click();
    });
});