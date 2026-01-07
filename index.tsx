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

interface AppSettings {
    socialBar: string;
    directLink: string;
    bannerTop: string;
    bannerSide: string;
}

const State = {
    files: [] as ImageFile[],
    activeId: null as string | null,
    theme: localStorage.getItem('elite-theme') || 'dark',
    settings: JSON.parse(localStorage.getItem('elite-config') || JSON.stringify({
        socialBar: 'https://bouncingbuzz.com/15/38/5b/15385b7c751e6c7d59d59fb7f34e2934.js',
        directLink: 'https://bouncingbuzz.com/29/98/27/29982794e86cad0441c5d56daad519bd.js',
        bannerTop: '0295263cf4ed8d9e3a97b6a2490864ee',
        bannerSide: ''
    })) as AppSettings
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

(window as any).toggleDashboard = () => {
    const p = document.getElementById('admin-panel');
    if (p) {
        const isHidden = p.classList.contains('hidden');
        if (isHidden) {
            p.classList.remove('hidden');
            p.classList.add('flex');
            (document.getElementById('cfg-social') as HTMLInputElement).value = State.settings.socialBar;
            (document.getElementById('cfg-direct') as HTMLInputElement).value = State.settings.directLink;
            (document.getElementById('cfg-banner-top') as HTMLInputElement).value = State.settings.bannerTop;
            (document.getElementById('cfg-banner-side') as HTMLInputElement).value = State.settings.bannerSide;
        } else {
            p.classList.add('hidden');
            p.classList.remove('flex');
        }
    }
};

(window as any).saveConfig = () => {
    State.settings = {
        socialBar: (document.getElementById('cfg-social') as HTMLInputElement).value,
        directLink: (document.getElementById('cfg-direct') as HTMLInputElement).value,
        bannerTop: (document.getElementById('cfg-banner-top') as HTMLInputElement).value,
        bannerSide: (document.getElementById('cfg-banner-side') as HTMLInputElement).value
    };
    localStorage.setItem('elite-config', JSON.stringify(State.settings));
    showToast('تم حفظ التغييرات بنجاح');
    setTimeout(() => window.location.reload(), 800);
};

const injectAds = () => {
    if (State.settings.socialBar) {
        const s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = State.settings.socialBar;
        document.head.appendChild(s);
    }

    const dl = document.getElementById('adsterra-direct-link') as HTMLAnchorElement;
    if (dl) dl.href = State.settings.directLink || '#';

    const topSlot = document.getElementById('ad-top-banner');
    if (topSlot && State.settings.bannerTop) {
        topSlot.innerHTML = '';
        const scriptConfig = document.createElement('script');
        scriptConfig.type = 'text/javascript';
        scriptConfig.text = `atOptions = { 'key' : '${State.settings.bannerTop}', 'format' : 'iframe', 'height' : 90, 'width' : 728, 'params' : {} };`;
        topSlot.appendChild(scriptConfig);
        const scriptInvoke = document.createElement('script');
        scriptInvoke.type = 'text/javascript';
        scriptInvoke.src = `//www.topcreativeformat.com/${State.settings.bannerTop}/invoke.js`;
        topSlot.appendChild(scriptInvoke);
    }
};

const updateUI = () => {
    const active = State.files.find(f => f.id === State.activeId);
    if (!active) return;

    const img = document.getElementById('main-preview') as HTMLImageElement;
    img.src = active.preview;
    
    const nameEl = document.getElementById('active-filename');
    const infoEl = document.getElementById('active-info');
    if (nameEl) nameEl.innerText = active.name;
    if (infoEl) infoEl.innerText = `حجم الملف: ${(active.size/1024).toFixed(1)} KB`;
    
    const actions = document.getElementById('action-area');
    if (active.status === 'done') {
        actions?.classList.remove('hidden');
        actions?.classList.add('flex');
        // تأكد من أن رابط التحميل المباشر محدث
        const dl = document.getElementById('adsterra-direct-link') as HTMLAnchorElement;
        if (dl) dl.href = State.settings.directLink || '#';
    } else {
        actions?.classList.add('hidden');
        actions?.classList.remove('flex');
    }

    renderQueue();
    if ((window as any).lucide) (window as any).lucide.createIcons();
};

const renderQueue = () => {
    const list = document.getElementById('image-queue');
    if (!list) return;
    list.innerHTML = State.files.map(f => `
        <div onclick="window.setActive('${f.id}')" class="shrink-0 cursor-pointer relative group">
            <img src="${f.preview}" class="w-20 h-20 object-cover rounded-xl border-4 transition-all ${State.activeId === f.id ? 'border-brand-primary scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}">
            ${f.status === 'done' ? '<div class="absolute -top-2 -right-2 bg-brand-success text-white p-1 rounded-full shadow-md"><i data-lucide="check" class="w-3 h-3 text-white"></i></div>' : ''}
        </div>
    `).join('');
};

(window as any).setActive = (id: string) => {
    State.activeId = id;
    updateUI();
};

const processActive = async () => {
    const active = State.files.find(f => f.id === State.activeId);
    if (!active) return;

    const overlay = document.getElementById('processing-overlay');
    if (overlay) overlay.style.display = 'flex';

    const quality = parseInt((document.getElementById('q-slider') as HTMLInputElement).value) / 100;
    const format = (document.getElementById('f-select') as HTMLSelectElement).value;

    try {
        await new Promise(r => setTimeout(r, 1200));
        const img = new Image();
        img.src = active.preview;
        await new Promise(r => img.onload = r);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, format, quality));
        if (blob) {
            if (active.processedUrl) URL.revokeObjectURL(active.processedUrl);
            active.processedUrl = URL.createObjectURL(blob);
            active.status = 'done';
            showToast('اكتملت المعالجة! يمكنك التحميل الآن.');
        }
    } catch (e) {
        showToast('فشلت المعالجة، يرجى المحاولة مرة أخرى');
    } finally {
        if (overlay) overlay.style.display = 'none';
        updateUI();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    injectAds();

    const input = document.getElementById('file-input') as HTMLInputElement;
    input?.addEventListener('change', (e: any) => {
        const items = Array.from(e.target.files as FileList);
        items.forEach(file => {
            State.files.push({
                id: Math.random().toString(36).substr(2, 9),
                file,
                name: file.name,
                size: file.size,
                preview: URL.createObjectURL(file),
                status: 'idle'
            });
        });

        if (!State.activeId && State.files.length > 0) State.activeId = State.files[0].id;
        document.getElementById('upload-view')?.classList.add('hidden');
        document.getElementById('workspace-view')?.classList.remove('hidden');
        updateUI();
    });

    document.getElementById('q-slider')?.addEventListener('input', (e: any) => {
        const lab = document.getElementById('q-label');
        if (lab) lab.innerText = e.target.value + '%';
    });

    document.getElementById('start-process')?.addEventListener('click', processActive);
    
    document.getElementById('download-btn')?.addEventListener('click', () => {
        const active = State.files.find(f => f.id === State.activeId);
        if (active?.processedUrl) {
            const a = document.getElementById('hidden-dl') as HTMLAnchorElement;
            a.href = active.processedUrl;
            a.download = `Elite_${active.name.split('.')[0]}.${(document.getElementById('f-select') as HTMLSelectElement).value.split('/')[1]}`;
            a.click();
            showToast('جاري بدء التحميل...');
        } else {
            showToast('يرجى بدء المعالجة أولاً');
        }
    });
});