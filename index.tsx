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

const renderQueue = () => {
    const list = document.getElementById('files-list');
    const panel = document.getElementById('controls-panel');
    if (!list || !panel) return;

    if (State.files.length > 0) panel.classList.remove('hidden');
    else panel.classList.add('hidden');

    list.innerHTML = State.files.map(f => `
        <div class="bg-brand-card/30 p-4 rounded-2xl flex items-center justify-between border border-white/5 group">
            <div class="flex items-center gap-4">
                <img src="${f.preview}" class="w-14 h-14 object-cover rounded-xl shadow-lg border border-white/5">
                <div class="text-right">
                    <p class="text-sm font-bold truncate max-w-[150px] md:max-w-xs">${f.name}</p>
                    <p class="text-[10px] opacity-40">الحجم: ${(f.originalSize/1024).toFixed(1)} KB ${f.processedSize ? ` ➔ ${(f.processedSize/1024).toFixed(1)} KB` : ''}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${f.status === 'processing' ? '<div class="w-4 h-4 border-2 border-brand-primary border-t-transparent animate-spin rounded-full"></div>' : ''}
                ${f.status === 'done' ? `
                    <a href="${f.processedUrl}" download="compressed_${f.name}" class="p-2.5 bg-brand-success/10 text-brand-success rounded-xl hover:bg-brand-success hover:text-white transition-all shadow-lg">
                        <i data-lucide="download" class="w-5 h-5"></i>
                    </a>
                ` : ''}
                <button onclick="window.removeFile('${f.id}')" class="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </div>
        </div>
    `).join('');
    (window as any).lucide?.createIcons();
};

(window as any).removeFile = (id: string) => {
    const item = State.files.find(f => f.id === id);
    if (item) {
        URL.revokeObjectURL(item.preview);
        if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
    }
    State.files = State.files.filter(f => f.id !== id);
    renderQueue();
};

const processImage = async (item: ImageItem) => {
    if (item.status === 'done' || item.status === 'processing') return;

    item.status = 'processing';
    renderQueue();

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
    renderQueue();
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    const input = document.getElementById('file-input') as HTMLInputElement;
    const slider = document.getElementById('quality-slider') as HTMLInputElement;
    const processBtn = document.getElementById('process-all-btn');

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
        renderQueue();
        input.value = '';
    });

    slider?.addEventListener('input', (e: any) => {
        const v = document.getElementById('quality-val');
        if (v) v.innerText = e.target.value + '%';
    });

    processBtn?.addEventListener('click', async () => {
        for (const item of State.files) {
            await processImage(item);
        }
    });

    (window as any).lucide?.createIcons();
});