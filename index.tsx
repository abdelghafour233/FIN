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

const AD_PASSWORD = "admin123";

// الإعدادات الافتراضية مع دعم الوسم الذكي الجديد
const DEFAULT_ADS = {
    smart: `<script src="https://quge5.com/88/tag.min.js" data-zone="199687" async data-cfasync="false"></script>`,
    pop: ``,
    direct: `https://otieu.com/4/10428459, https://otieu.com/4/10428641`,
    social: ``,
    banner1: ``,
    banner2: ``,
    native: ``
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

const triggerDirectLink = () => {
    if (State.ads.direct) {
        const links = State.ads.direct.split(',').map((l: string) => l.trim()).filter((l: string) => l.startsWith('http'));
        if (links.length > 0) {
            const randomLink = links[Math.floor(Math.random() * links.length)];
            window.open(randomLink, '_blank');
        }
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
    if (icon) icon.setAttribute('data-lucide', State.theme === 'dark' ? 'sun' : 'moon');
    if ((window as any).lucide) (window as any).lucide.createIcons();
};

(window as any).toggleTheme = () => {
    State.theme = State.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('elite-theme', State.theme);
    applyTheme();
};

(window as any).share = (platform: string) => {
    const url = encodeURIComponent(window.location.origin);
    const text = encodeURIComponent("ألقِ نظرة على Elite Image، أفضل أداة مجانية لمعالجة وتحويل الصور باحترافية وسهولة!");
    
    let shareUrl = '';
    switch(platform) {
        case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
        case 'twitter': shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`; break;
        case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`; break;
        case 'telegram': shareUrl = `https://t.me/share/url?url=${url}&text=${text}`; break;
        case 'pinterest': shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`; break;
        case 'copy':
            navigator.clipboard.writeText(window.location.origin).then(() => {
                showToast('تم نسخ رابط الموقع بنجاح!');
            });
            return;
    }
    
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
};

const advancedInject = (container: HTMLElement | null, html: string) => {
    if (!container || !html || html.trim() === '') return;
    container.innerHTML = '';
    const range = document.createRange();
    const fragment = range.createContextualFragment(html);
    const scripts = Array.from(fragment.querySelectorAll('script'));
    const nonScripts = Array.from(fragment.childNodes).filter(node => node.nodeName !== 'SCRIPT');
    
    nonScripts.forEach(node => container.appendChild(node.cloneNode(true)));
    
    scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.innerHTML) newScript.innerHTML = oldScript.innerHTML;
        container.appendChild(newScript);
    });
};

const injectAds = () => {
    const ads = State.ads;
    
    // حقن الوسم الذكي العام
    if (ads.smart) {
        advancedInject(document.getElementById('ad-global-container'), ads.smart);
    }
    
    if (ads.pop && ads.pop.trim() !== '') {
        const div = document.createElement('div');
        div.className = "monetag-pop";
        document.body.appendChild(div);
        advancedInject(div, ads.pop);
    }
    if (ads.social && ads.social.trim() !== '') {
        const div = document.createElement('div');
        div.className = "monetag-social";
        document.body.appendChild(div);
        advancedInject(div, ads.social);
    }
    if (ads.banner1) advancedInject(document.getElementById('ad-sidebar'), ads.banner1);
    if (ads.banner2) advancedInject(document.getElementById('ad-top'), ads.banner2);
    if (ads.native) advancedInject(document.getElementById('ad-native'), ads.native);
};

(window as any).openAdmin = () => {
    const pass = prompt("الرجاء إدخال كلمة مرور الإدارة:");
    if (pass === AD_PASSWORD) {
        const appContainer = document.getElementById('app-container');
        const adminView = document.getElementById('admin-view');
        
        if (appContainer) appContainer.classList.add('hidden');
        if (adminView) adminView.classList.remove('hidden');
        
        const fields = {
            'ad-smart': State.ads.smart,
            'ad-pop': State.ads.pop,
            'ad-direct': State.ads.direct,
            'ad-social': State.ads.social,
            'ad-banner-1': State.ads.banner1,
            'ad-banner-2': State.ads.banner2,
            'ad-banner-native': State.ads.native
        };

        Object.entries(fields).forEach(([id, value]) => {
            const el = document.getElementById(id) as (HTMLTextAreaElement | HTMLInputElement);
            if (el) el.value = value || '';
        });
        
        if ((window as any).lucide) (window as any).lucide.createIcons();
    } else if (pass !== null) {
        alert('كلمة مرور خاطئة!');
    }
};

(window as any).closeAdmin = () => {
    const appContainer = document.getElementById('app-container');
    const adminView = document.getElementById('admin-view');
    if (adminView) adminView.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
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
    if ((window as any).lucide) (window as any).lucide.createIcons();
};

const renderQueue = () => {
    const list = document.getElementById('image-queue');
    if (!list) return;
    list.innerHTML = State.files.map(f => `
        <div onclick="window.setActive('${f.id}')" class="shrink-0 cursor-pointer relative group">
            <img src="${f.preview}" class="w-20 h-20 object-cover rounded-2xl border-2 transition-all ${State.activeId === f.id ? 'border-brand-primary scale-105 shadow-lg' : 'border-transparent opacity-60'}">
            ${f.status === 'done' ? '<div class="absolute -top-1 -right-1 bg-brand-success text-white p-1 rounded-full"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
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
    
    triggerDirectLink();

    const overlay = document.getElementById('processing-overlay');
    if (overlay) overlay.style.display = 'flex';
    const qualityInput = document.getElementById('q-slider') as HTMLInputElement;
    const formatInput = document.getElementById('f-select') as HTMLSelectElement;
    const quality = qualityInput ? parseInt(qualityInput.value) / 100 : 0.85;
    const format = formatInput ? formatInput.value : 'image/webp';

    try {
        const img = new Image();
        img.src = active.preview;
        await new Promise(r => img.onload = r);
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, format, quality));
        if (blob) {
            if (active.processedUrl) URL.revokeObjectURL(active.processedUrl);
            active.processedUrl = URL.createObjectURL(blob);
            active.status = 'done';
            showToast('تمت المعالجة بنجاح!');
        }
    } catch (e) { showToast('حدث خطأ أثناء المعالجة'); }
    finally { if (overlay) overlay.style.display = 'none'; updateUI(); }
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    setTimeout(injectAds, 500);

    const input = document.getElementById('file-input') as HTMLInputElement;
    input?.addEventListener('change', (e: any) => {
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
        const lab = document.getElementById('q-label');
        if (lab) lab.innerText = e.target.value + '%';
    });

    document.getElementById('start-process')?.addEventListener('click', processActive);
    
    document.getElementById('download-btn')?.addEventListener('click', () => {
        const active = State.files.find(f => f.id === State.activeId);
        if (active?.processedUrl) {
            triggerDirectLink();
            const a = document.getElementById('hidden-dl') as HTMLAnchorElement;
            const formatSelect = document.getElementById('f-select') as HTMLSelectElement;
            a.href = active.processedUrl;
            a.download = `Elite_${active.name.split('.')[0]}.${formatSelect.value.split('/')[1]}`;
            a.click();
        }
    });

    document.getElementById('save-ads')?.addEventListener('click', () => {
        const ads = {
            smart: (document.getElementById('ad-smart') as HTMLTextAreaElement).value,
            pop: (document.getElementById('ad-pop') as HTMLTextAreaElement).value,
            direct: (document.getElementById('ad-direct') as HTMLInputElement).value,
            social: (document.getElementById('ad-social') as HTMLTextAreaElement).value,
            banner1: (document.getElementById('ad-banner-1') as HTMLTextAreaElement).value,
            banner2: (document.getElementById('ad-banner-2') as HTMLTextAreaElement).value,
            native: (document.getElementById('ad-banner-native') as HTMLTextAreaElement).value
        };
        State.ads = ads;
        localStorage.setItem('elite-ads', JSON.stringify(ads));
        showToast('تم الحفظ! جاري إعادة التحميل...');
        setTimeout(() => window.location.reload(), 800);
    });
});