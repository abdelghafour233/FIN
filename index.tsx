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

// الروابط الربحية الجديدة التي تم تزويدنا بها
const REWARD_LINKS = [
    "https://otieu.com/4/10430934",
    "https://otieu.com/4/10428864",
    "https://otieu.com/4/10428641",
    "https://otieu.com/4/10428459"
];

// وظيفة للحصول على رابط عشوائي لتدوير الأرباح
const getRandomLink = () => REWARD_LINKS[Math.floor(Math.random() * REWARD_LINKS.length)];

const SHARE_TEXT = "اكتشفت أداة رائعة لمعالجة الصور مجاناً وباحترافية! جربها الآن:";

const DEFAULT_ADS = {
    smart: `<script src="https://3nbf4.com/act/files/tag.min.js?z=10430766" data-cfasync="false" async></script>`,
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
    const ads = State.ads;
    const isAlreadyPresent = document.querySelector('script[src*="10430766"]') || 
                             document.body.innerHTML.includes('10430766') || 
                             document.head.innerHTML.includes('10430766');

    if (isAlreadyPresent) return;

    const container = document.getElementById('ad-global-container');
    if (container && ads.smart) {
        const range = document.createRange();
        const fragment = range.createContextualFragment(ads.smart);
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
        icon.style.color = State.theme === 'dark' ? '#f59e0b' : '#3b82f6';
    }
    if ((window as any).lucide) (window as any).lucide.createIcons();
};

(window as any).toggleTheme = () => {
    State.theme = State.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('elite-theme', State.theme);
    applyTheme();
};

(window as any).copyLink = () => {
    const link = getRandomLink();
    navigator.clipboard.writeText(link);
    showToast('تم نسخ رابط المشاركة الربحي!');
};

(window as any).nativeShare = async () => {
    const link = getRandomLink();
    if (navigator.share) {
        try {
            await navigator.share({ title: 'Elite Image', text: SHARE_TEXT, url: link });
        } catch (err) {}
    } else {
        (window as any).copyLink();
    }
};

const setupShareLinks = () => {
    const link = getRandomLink();
    const url = encodeURIComponent(link);
    const text = encodeURIComponent(SHARE_TEXT);
    const wa = document.getElementById('share-whatsapp') as HTMLAnchorElement;
    if (wa) wa.href = `https://wa.me/?text=${text}%20${url}`;
    const fb = document.getElementById('share-facebook') as HTMLAnchorElement;
    if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    const tw = document.getElementById('share-twitter') as HTMLAnchorElement;
    if (tw) tw.href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    const tg = document.getElementById('share-telegram') as HTMLAnchorElement;
    if (tg) tg.href = `https://t.me/share/url?url=${url}&text=${text}`;
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
            <img src="${f.preview}" class="w-20 h-20 object-cover rounded-2xl border-2 transition-all ${State.activeId === f.id ? 'border-brand-primary scale-110 shadow-xl' : 'border-transparent opacity-50'}">
            ${f.status === 'done' ? '<div class="absolute -top-1 -right-1 bg-brand-success text-white p-1 rounded-full shadow-lg border-2 border-white dark:border-brand-dark"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
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
    } catch (e) {
        showToast('خطأ في المعالجة');
    } finally {
        if (overlay) overlay.style.display = 'none';
        updateUI();
    }
};

(window as any).openAdmin = () => {
    const pass = prompt("كلمة السر (admin):");
    if (pass === AD_PASSWORD) {
        document.getElementById('app-container')?.classList.add('hidden');
        document.getElementById('admin-view')?.classList.remove('hidden');
        const area = document.getElementById('ad-smart') as HTMLTextAreaElement;
        if (area) area.value = State.ads.smart;
    }
};

(window as any).closeAdmin = () => {
    document.getElementById('admin-view')?.classList.add('hidden');
    document.getElementById('app-container')?.classList.remove('hidden');
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    injectAds();
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

    document.getElementById('start-process')?.addEventListener('click', processActive);

    document.getElementById('download-btn')?.addEventListener('click', () => {
        const active = State.files.find(f => f.id === State.activeId);
        if (active?.processedUrl) {
            // فتح رابط عشوائي لزيادة الأرباح عند التحميل
            window.open(getRandomLink(), '_blank');
            
            const a = document.getElementById('hidden-dl') as HTMLAnchorElement;
            const formatSelect = document.getElementById('f-select') as HTMLSelectElement;
            a.href = active.processedUrl;
            a.download = `Elite_${active.name.split('.')[0]}.${formatSelect.value.split('/')[1]}`;
            a.click();
        }
    });

    document.getElementById('save-ads')?.addEventListener('click', () => {
        const smartValue = (document.getElementById('ad-smart') as HTMLTextAreaElement).value;
        State.ads.smart = smartValue;
        localStorage.setItem('elite-ads', JSON.stringify(State.ads));
        showToast('تم الحفظ!');
        setTimeout(() => window.location.reload(), 800);
    });
});