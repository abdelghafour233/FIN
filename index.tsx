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
    smart: `<!-- Adsterra Active Zones -->
<!-- 1 & 2 -->
<script src="https://bouncingbuzz.com/29/98/27/29982794e86cad0441c5d56daad519bd.js"></script>
<script src="https://bouncingbuzz.com/15/38/5b/15385b7c751e6c7d59d59fb7f34e2934.js"></script>

<!-- 3 Banner -->
<div class="ad-banner-300">
<script type="text/javascript">
  atOptions = { 'key' : '0295263cf4ed8d9e3a97b6a2490864ee', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };
</script>
<script type="text/javascript" src="https://bouncingbuzz.com/0295263cf4ed8d9e3a97b6a2490864ee/invoke.js"></script>
</div>

<!-- 4 Smart -->
<div id="container-5391a99b621f7fabc01edf3b98c1b6e5"></div>

<!-- 5 Vertical -->
<script type="text/javascript">
  atOptions = { 'key' : 'deb441a26b7385b9111cbb19d72d8513', 'format' : 'iframe', 'height' : 300, 'width' : 160, 'params' : {} };
</script>
<script type="text/javascript" src="https://bouncingbuzz.com/deb441a26b7385b9111cbb19d72d8513/invoke.js"></script>

<!-- 6 Direct Link -->
<a href="https://bouncingbuzz.com/x93g7iqhij?key=7f6751f640538f788a6e6fa2e10591a8" target="_blank" style="display:block; background:#f59e0b; color:white; padding:15px; border-radius:12px; text-align:center; font-weight:bold; margin-top:10px;">احصل على العرض الحصري</a>`
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
    const pass = prompt("كلمة السر الدخول للوحة التحكم:");
    if (pass === AD_PASSWORD) {
        document.getElementById('app-container')?.classList.add('hidden');
        document.getElementById('admin-view')?.classList.remove('hidden');
        const textarea = document.getElementById('ad-smart') as HTMLTextAreaElement;
        if (textarea) textarea.value = State.ads.smart;
    } else if (pass !== null) {
        alert("كلمة سر خاطئة");
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

    document.getElementById('save-ads')?.addEventListener('click', () => {
        const textarea = document.getElementById('ad-smart') as HTMLTextAreaElement;
        if (textarea) {
            State.ads.smart = textarea.value;
            localStorage.setItem('elite-ads', JSON.stringify(State.ads));
            showToast('تم حفظ الإعلانات وتحديثها!');
            setTimeout(() => window.location.reload(), 1000);
        }
    });

    document.getElementById('start-process')?.addEventListener('click', async () => {
        const active = State.files.find(f => f.id === State.activeId);
        if (!active) return;
        const overlay = document.getElementById('processing-overlay');
        if (overlay) overlay.style.display = 'flex';
        
        setTimeout(() => {
            active.status = 'done';
            active.processedUrl = active.preview;
            if (overlay) overlay.style.display = 'none';
            updateUI();
            showToast('تمت معالجة الصورة بنجاح!');
        }, 1500);
    });
});