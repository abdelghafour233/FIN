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
    dashboardPassword: 'admin'
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

(window as any).toggleDashboard = () => {
    const view = document.getElementById('dashboard-view');
    if (view) {
        view.style.display = view.style.display === 'none' ? 'flex' : 'none';
    }
};

(window as any).verifyDashboardPass = () => {
    const input = document.getElementById('dashboard-pass-input') as HTMLInputElement;
    if (input.value === State.dashboardPassword) {
        showToast('تم الحفظ. أرباحك في ازدياد!');
    } else {
        showToast('كلمة المرور غير صحيحة');
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
        downloadAnchor.download = `StorImage_${active.name}`;
    } else {
        downloadZone?.classList.add('hidden');
    }

    renderThumbs();
};

const renderThumbs = () => {
    const list = document.getElementById('thumbs-list');
    if (!list) return;

    list.innerHTML = State.files.map(f => `
        <div onclick="window.selectImage('${f.id}')" class="relative shrink-0 cursor-pointer group">
            <img src="${f.preview}" class="w-16 h-16 object-cover rounded-xl border-2 transition-all ${State.selectedId === f.id ? 'border-brand-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'}">
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

    const loader = document.getElementById('processing-loader');
    if (loader) loader.style.display = 'flex';

    item.status = 'processing';
    updateActivePreview();

    const quality = parseInt((document.getElementById('quality-slider') as HTMLInputElement).value) / 100;
    const format = (document.getElementById('format-select') as HTMLSelectElement).value || 'image/webp';

    try {
        // تأخير وهمي لمدة 3 ثوانٍ لزيادة زمن بقاء المستخدم وعرض الإعلانات
        await new Promise(resolve => setTimeout(resolve, 3000));

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
            showToast('تمت المعالجة بنجاح! حمل صورتك الآن');
        }
    } catch (e) {
        item.status = 'error';
        showToast('حدث خطأ');
    } finally {
        if (loader) loader.style.display = 'none';
    }
    
    updateActivePreview();
};

document.addEventListener('DOMContentLoaded', () => {
    if ((window as any).lucide) (window as any).lucide.createIcons();
    
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