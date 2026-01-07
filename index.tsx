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

const AD_PASSWORD = "admin123"; // يمكنك تغيير كلمة المرور من هنا

const State = {
    files: [] as ImageFile[],
    activeId: null as string | null,
    theme: localStorage.getItem('elite-theme') || 'dark',
    ads: JSON.parse(localStorage.getItem('elite-ads') || '{}')
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

// وظيفة حقن الإعلانات
const injectAds = () => {
    const ads = State.ads;
    
    // حقن Pop-under و Social Bar في الـ head أو body
    if (ads.pop) {
        const div = document.createElement('div');
        div.innerHTML = ads.pop;
        const scripts = div.getElementsByTagName('script');
        for (let s of Array.from(scripts)) {
            const newS = document.createElement('script');
            if (s.src) newS.src = s.src;
            else newS.textContent = s.textContent;
            document.body.appendChild(newS);
        }
    }

    if (ads.social) {
        const div = document.createElement('div');
        div.innerHTML = ads.social;
        const scripts = div.getElementsByTagName('script');
        for (let s of Array.from(scripts)) {
            const newS = document.createElement('script');
            if (s.src) newS.src = s.src;
            else newS.textContent = s.textContent;
            document.body.appendChild(newS);
        }
    }

    // حقن البنرات في أماكنها
    if (ads.banner1) {
        const el = document.getElementById('ad-top');
        if (el) el.innerHTML = ads.banner1;
    }
    if (ads.banner2) {
        const el = document.getElementById('ad-sidebar');
        if (el) el.innerHTML = ads.banner2;
    }
};

(window as any).openAdmin = () => {
    const pass = prompt("الرجاء إدخال كلمة مرور لوحة التحكم:");
    if (pass === AD_PASSWORD) {
        document.getElementById('upload-view')?.classList.add('hidden');
        document.getElementById('workspace-view')?.classList.add('hidden');
        document.getElementById('admin-view')?.classList.remove('hidden');
        
        // تعبئة البيانات الحالية
        (document.getElementById('ad-pop') as HTMLTextAreaElement).value = State.ads.pop || '';
        (document.getElementById('ad-social') as HTMLTextAreaElement).value = State.ads.social || '';
        (document.getElementById('ad-banner-1') as HTMLTextAreaElement).value = State.ads.banner1 || '';
        (document.getElementById('ad-banner-2') as HTMLTextAreaElement).value = State.ads.banner2 || '';
        
        showToast('مرحباً بك في لوحة التحكم');
    } else if (pass !== null) {
        alert('كلمة مرور خاطئة!');
    }
};

// وظيفة المشاركة الاجتماعية
(window as any).share = (platform: 'whatsapp' | 'facebook' | 'x' | 'telegram') => {
    const url = window.location.href;
    const text = "أنصحكم باستخدام Elite Image، أفضل أداة لمعالجة وتحويل الصور بجودة عالية ومجاناً! 🚀\n";
    
    let shareUrl = "";
    switch (platform) {
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + url)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'x':
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
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
            <img src="${f.preview}" class="w-20 h-20 object-cover rounded-2xl border-2 transition-all ${State.activeId === f.id ? 'border-brand-primary scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}">
            ${f.status === 'done' ? '<div class="absolute -top-1 -right-1 bg-brand-success text-white p-1 rounded-full shadow-lg"><i data-lucide="check" class="w-3 h-3"></i></div>' : ''}
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
        canvas.width = img.width;
        canvas.height = img.height;
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
        showToast('حدث خطأ أثناء المعالجة');
    } finally {
        if (overlay) overlay.style.display = 'none';
        updateUI();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    injectAds(); // تفعيل الإعلانات عند التحميل

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
            showToast('بدأ التحميل...');
        }
    });

    // حفظ الإعلانات
    document.getElementById('save-ads')?.addEventListener('click', () => {
        const ads = {
            pop: (document.getElementById('ad-pop') as HTMLTextAreaElement).value,
            social: (document.getElementById('ad-social') as HTMLTextAreaElement).value,
            banner1: (document.getElementById('ad-banner-1') as HTMLTextAreaElement).value,
            banner2: (document.getElementById('ad-banner-2') as HTMLTextAreaElement).value
        };
        State.ads = ads;
        localStorage.setItem('elite-ads', JSON.stringify(ads));
        showToast('تم حفظ الإعلانات بنجاح!');
        setTimeout(() => window.location.reload(), 1000); // إعادة التحميل لتفعيل الأكواد الجديدة
    });
});