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

const setupShareLinks = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("اكتشف إيليت إيميج - أسرع أداة لمعالجة الصور وتغيير صيغها مجاناً واحترافياً!");
    
    const wa = document.getElementById('share-wa') as HTMLAnchorElement;
    const fb = document.getElementById('share-fb') as HTMLAnchorElement;
    const tw = document.getElementById('share-tw') as HTMLAnchorElement;
    const tg = document.getElementById('share-tg') as HTMLAnchorElement;
    
    if (wa) wa.href = `https://wa.me/?text=${text}%20${url}`;
    if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (tw) tw.href = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    if (tg) tg.href = `https://t.me/share/url?url=${url}&text=${text}`;
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
    if (img) img.src = active.processedUrl || active.preview;
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
            ${f.status === 'done' ? '<div class="absolute -top-1 -right-1 bg-brand-success text-white p-0.5 rounded-full"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
        </div>
    `).join('');
    if ((window as any).lucide) (window as any).lucide.createIcons();
};

(window as any).setActive = (id: string) => {
    State.activeId = id;
    updateUI();
};

const processImage = async (file: ImageFile) => {
    return new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(file.preview);
            
            ctx.drawImage(img, 0, 0);
            
            const quality = parseInt((document.getElementById('q-slider') as HTMLInputElement).value) / 100;
            const format = (document.getElementById('f-select') as HTMLSelectElement).value;
            
            const dataUrl = canvas.toDataURL(format, quality);
            resolve(dataUrl);
        };
        img.src = file.preview;
    });
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    setupShareLinks();

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
        
        try {
            const processedDataUrl = await processImage(active);
            active.status = 'done';
            active.processedUrl = processedDataUrl;
            showToast('تمت معالجة الصورة بنجاح!');
        } catch (err) {
            console.error(err);
            showToast('حدث خطأ أثناء المعالجة');
        } finally {
            if (overlay) overlay.style.display = 'none';
            updateUI();
        }
    });

    document.getElementById('download-btn')?.addEventListener('click', () => {
        const active = State.files.find(f => f.id === State.activeId);
        if (active && active.status === 'done') {
            const link = document.createElement('a');
            link.href = active.processedUrl!;
            const extension = (document.getElementById('f-select') as HTMLSelectElement).value.split('/')[1];
            link.download = `${active.name.split('.')[0]}_elite.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
});