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
    theme: localStorage.getItem('theme') || 'dark'
};

const applyTheme = () => {
    document.documentElement.classList.toggle('dark', State.theme === 'dark');
};

(window as any).toggleTheme = () => {
    State.theme = State.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', State.theme);
    applyTheme();
};

const updateActivePreview = () => {
    const active = State.files.find(f => f.id === State.selectedId);
    const mainImg = document.getElementById('main-preview-img') as HTMLImageElement;
    const nameEl = document.getElementById('active-name');
    const sizeEl = document.getElementById('active-size');
    const badge = document.getElementById('status-badge');
    const downloadZone = document.getElementById('download-zone');
    const downloadBtn = document.getElementById('final-download-link') as HTMLAnchorElement;

    if (!active || !mainImg) return;

    // Transition effect
    mainImg.style.opacity = '0';
    setTimeout(() => {
        mainImg.src = active.preview;
        mainImg.style.opacity = '1';
        if (nameEl) nameEl.innerText = active.name;
        if (sizeEl) sizeEl.innerText = `الحجم الأصلي: ${(active.originalSize/1024).toFixed(1)} KB ${active.processedSize ? ` | بعد الضغط: ${(active.processedSize/1024).toFixed(1)} KB` : ''}`;
        
        if (badge) {
            badge.innerText = active.status === 'done' ? 'تمت المعالجة' : active.status === 'processing' ? 'جاري المعالجة...' : 'جاهز';
            badge.className = `px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${active.status === 'done' ? 'bg-brand-success/20 text-brand-success' : 'bg-brand-primary/20 text-brand-primary'}`;
        }

        if (active.status === 'done' && downloadZone && downloadBtn) {
            downloadZone.classList.remove('hidden');
            downloadBtn.href = active.processedUrl || '#';
            downloadBtn.download = `optimized_${active.name}`;
        } else {
            downloadZone?.classList.add('hidden');
        }
    }, 200);

    renderThumbs();
};

const renderThumbs = () => {
    const list = document.getElementById('thumbs-list');
    if (!list) return;

    list.innerHTML = State.files.map(f => `
        <div onclick="window.selectImage('${f.id}')" class="relative group shrink-0 cursor-pointer transition-all">
            <img src="${f.preview}" class="w-16 h-16 object-cover rounded-xl shadow-md border-2 ${State.selectedId === f.id ? 'border-brand-primary' : 'border-white/5'} hover:scale-105 transition-transform">
            ${f.status === 'done' ? '<div class="absolute -top-1 -right-1 bg-brand-success text-white p-0.5 rounded-full"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
            <button onclick="event.stopPropagation(); window.removeFile('${f.id}')" class="absolute -bottom-1 -left-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        </div>
    `).join('');
    (window as any).lucide?.createIcons();
};

(window as any).selectImage = (id: string) => {
    State.selectedId = id;
    updateActivePreview();
};

(window as any).removeFile = (id: string) => {
    const item = State.files.find(f => f.id === id);
    if (item) {
        URL.revokeObjectURL(item.preview);
        if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
    }
    State.files = State.files.filter(f => f.id !== id);
    if (State.selectedId === id) {
        State.selectedId = State.files.length > 0 ? State.files[0].id : null;
    }
    
    if (State.files.length === 0) {
        document.getElementById('workspace-view')?.classList.add('hidden');
        document.getElementById('upload-view')?.classList.remove('hidden');
    } else {
        updateActivePreview();
    }
};

const processImage = async (item: ImageItem) => {
    if (item.status === 'done' || item.status === 'processing') return;

    item.status = 'processing';
    if (State.selectedId === item.id) updateActivePreview();

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
        } else {
            item.status = 'error';
        }
    } catch (e) {
        item.status = 'error';
    }
    
    if (State.selectedId === item.id) updateActivePreview();
    else renderThumbs();
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    const input = document.getElementById('file-input') as HTMLInputElement;
    const slider = document.getElementById('quality-slider') as HTMLInputElement;
    const processActiveBtn = document.getElementById('process-active-btn');
    const processAllBtn = document.getElementById('process-all-btn');

    input?.addEventListener('change', (e: any) => {
        const incoming = Array.from(e.target.files as FileList);
        if (incoming.length === 0) return;

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

        if (!State.selectedId) State.selectedId = State.files[0].id;

        document.getElementById('upload-view')?.classList.add('hidden');
        document.getElementById('workspace-view')?.classList.remove('hidden');
        updateActivePreview();
        input.value = '';
    });

    slider?.addEventListener('input', (e: any) => {
        const v = document.getElementById('quality-val');
        if (v) v.innerText = e.target.value + '%';
    });

    processActiveBtn?.addEventListener('click', () => {
        const active = State.files.find(f => f.id === State.selectedId);
        if (active) processImage(active);
    });

    processAllBtn?.addEventListener('click', async () => {
        for (const item of State.files) {
            await processImage(item);
        }
    });

    (window as any).lucide?.createIcons();
});