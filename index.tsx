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
    theme: localStorage.getItem('theme') || 'dark',
    isDashboardOpen: false,
    isAuthenticated: false,
    dashboardPassword: 'admin123',
    adsterraKey: localStorage.getItem('adsterra_key') || '0295263cf4ed8d9e3a97b6a2490864ee',
    socialLinks: JSON.parse(localStorage.getItem('social_links') || JSON.stringify({
        whatsapp: '212600000000',
        facebook: '',
        instagram: '',
        twitter: ''
    }))
};

const applyTheme = () => {
    document.documentElement.classList.toggle('dark', State.theme === 'dark');
    setTimeout(() => {
        if ((window as any).lucide) (window as any).lucide.createIcons();
    }, 10);
};

const injectAdsterra = () => {
    const container = document.getElementById('bottom-ad-container');
    const wrapper = document.getElementById('ad-wrapper');
    if (!container || !wrapper) return;

    if (!State.adsterraKey || State.adsterraKey.trim() === '') {
        wrapper.classList.add('hidden');
        return;
    }

    wrapper.classList.remove('hidden');
    container.innerHTML = ''; // Clear existing

    // Adsterra Options
    const scriptOptions = document.createElement('script');
    scriptOptions.type = 'text/javascript';
    scriptOptions.innerHTML = `
        atOptions = {
            'key' : '${State.adsterraKey}',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
        };
    `;
    
    // Adsterra Invoke Script
    const scriptInvoke = document.createElement('script');
    scriptInvoke.type = 'text/javascript';
    scriptInvoke.src = `https://bouncingbuzz.com/${State.adsterraKey}/invoke.js`;

    container.appendChild(scriptOptions);
    container.appendChild(scriptInvoke);
};

// تحديث روابط التواصل والمشاركة
const updateSocialLinksUI = () => {
    const siteUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent("اكتشفت أداة رائعة لضغط ومعالجة الصور مجاناً وبجودة عالية! جربها من هنا:");

    // 1. أزرار التواصل (العائمة وفي التذييل)
    const isValid = (val: string) => val && val.trim() !== '' && val !== '#';

    // الواتساب (تواصل)
    const waUrl = isValid(State.socialLinks.whatsapp) ? `https://wa.me/${State.socialLinks.whatsapp}` : null;
    ['float-whatsapp', 'link-whatsapp'].forEach(id => {
        const el = document.getElementById(id) as HTMLAnchorElement;
        if (el) {
            if (waUrl) { el.href = waUrl; el.classList.remove('hidden'); }
            else { el.classList.add('hidden'); }
        }
    });

    // الفيسبوك (تواصل)
    const fbUrl = isValid(State.socialLinks.facebook) ? State.socialLinks.facebook : null;
    ['float-facebook', 'link-facebook'].forEach(id => {
        const el = document.getElementById(id) as HTMLAnchorElement;
        if (el) {
            if (fbUrl) { el.href = fbUrl; el.classList.remove('hidden'); }
            else { el.classList.add('hidden'); }
        }
    });

    // الإنستغرام (تواصل)
    const igUrl = isValid(State.socialLinks.instagram) ? State.socialLinks.instagram : null;
    ['float-instagram', 'link-instagram'].forEach(id => {
        const el = document.getElementById(id) as HTMLAnchorElement;
        if (el) {
            if (igUrl) { el.href = igUrl; el.classList.remove('hidden'); }
            else { el.classList.add('hidden'); }
        }
    });

    // تويتر (تواصل)
    const twUrl = isValid(State.socialLinks.twitter) ? State.socialLinks.twitter : null;
    ['float-twitter', 'link-twitter'].forEach(id => {
        const el = document.getElementById(id) as HTMLAnchorElement;
        if (el) {
            if (twUrl) { el.href = twUrl; el.classList.remove('hidden'); }
            else { el.classList.add('hidden'); }
        }
    });

    // 2. أزرار المشاركة (تحت زر التحميل)
    const workWa = document.getElementById('work-whatsapp') as HTMLAnchorElement;
    if (workWa) {
        workWa.href = `https://api.whatsapp.com/send?text=${shareText}%20${siteUrl}`;
        workWa.classList.remove('hidden');
    }
    const workFb = document.getElementById('work-facebook') as HTMLAnchorElement;
    if (workFb) {
        workFb.href = `https://www.facebook.com/sharer/sharer.php?u=${siteUrl}`;
        workFb.classList.remove('hidden');
    }
    const workTw = document.getElementById('work-twitter') as HTMLAnchorElement;
    if (workTw) {
        workTw.href = `https://twitter.com/intent/tweet?url=${siteUrl}&text=${shareText}`;
        workTw.classList.remove('hidden');
    }
};

(window as any).toggleTheme = () => {
    State.theme = State.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', State.theme);
    applyTheme();
};

(window as any).toggleDashboard = () => {
    State.isDashboardOpen = !State.isDashboardOpen;
    const view = document.getElementById('dashboard-view');
    const loginSec = document.getElementById('dashboard-login');
    const contentSec = document.getElementById('dashboard-content');
    const passInput = document.getElementById('dashboard-pass-input') as HTMLInputElement;

    if (view) {
        if (State.isDashboardOpen) {
            view.classList.add('open');
            if (!State.isAuthenticated) {
                loginSec?.classList.remove('hidden');
                contentSec?.classList.add('hidden');
                if (passInput) {
                    passInput.value = '';
                    passInput.type = 'password';
                    const icon = document.getElementById('pass-eye-icon');
                    if (icon) icon.setAttribute('data-lucide', 'eye');
                    (window as any).lucide?.createIcons();
                    passInput.focus();
                }
            } else {
                loginSec?.classList.add('hidden');
                contentSec?.classList.remove('hidden');
                loadDashboardInputs();
            }
        } else {
            view.classList.remove('open');
        }
    }
};

(window as any).toggleDashboardPassVisibility = () => {
    const input = document.getElementById('dashboard-pass-input') as HTMLInputElement;
    const icon = document.getElementById('pass-eye-icon');
    if (input && icon) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        icon.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
        (window as any).lucide?.createIcons();
    }
};

(window as any).verifyDashboardPass = () => {
    const input = document.getElementById('dashboard-pass-input') as HTMLInputElement;
    if (input.value === State.dashboardPassword) {
        State.isAuthenticated = true;
        document.getElementById('dashboard-login')?.classList.add('hidden');
        document.getElementById('dashboard-content')?.classList.remove('hidden');
        loadDashboardInputs();
        showToast('مرحباً بك في لوحة التحكم');
    } else {
        showToast('كلمة المرور غير صحيحة!');
        input.value = '';
        input.focus();
    }
};

(window as any).logoutDashboard = () => {
    State.isAuthenticated = false;
    (window as any).toggleDashboard();
    showToast('تم تسجيل الخروج وتأمين اللوحة');
};

const loadDashboardInputs = () => {
    const wa = document.getElementById('social-whatsapp') as HTMLInputElement;
    const fb = document.getElementById('social-facebook') as HTMLInputElement;
    const ig = document.getElementById('social-instagram') as HTMLInputElement;
    const tw = document.getElementById('social-twitter') as HTMLInputElement;
    const adKey = document.getElementById('adsterra-key') as HTMLInputElement;
    
    if (wa) wa.value = State.socialLinks.whatsapp || '';
    if (fb) fb.value = State.socialLinks.facebook || '';
    if (ig) ig.value = State.socialLinks.instagram || '';
    if (tw) tw.value = State.socialLinks.twitter || '';
    if (adKey) adKey.value = State.adsterraKey || '';
};

(window as any).saveDashboardSettings = () => {
    State.socialLinks = {
        whatsapp: (document.getElementById('social-whatsapp') as HTMLInputElement).value,
        facebook: (document.getElementById('social-facebook') as HTMLInputElement).value,
        instagram: (document.getElementById('social-instagram') as HTMLInputElement).value,
        twitter: (document.getElementById('social-twitter') as HTMLInputElement).value,
    };
    State.adsterraKey = (document.getElementById('adsterra-key') as HTMLInputElement).value;

    localStorage.setItem('social_links', JSON.stringify(State.socialLinks));
    localStorage.setItem('adsterra_key', State.adsterraKey);
    
    showToast('تم حفظ الإعدادات!');
    updateSocialLinksUI();
    injectAdsterra();
    setTimeout(() => (window as any).toggleDashboard(), 500);
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

const handleDownloadWithAd = () => {
    const realDownloadLink = document.getElementById('final-download-link') as HTMLAnchorElement;
    if (realDownloadLink) {
        realDownloadLink.click();
    }
};

const updateActivePreview = () => {
    const active = State.files.find(f => f.id === State.selectedId);
    const mainImg = document.getElementById('main-preview-img') as HTMLImageElement;
    const nameEl = document.getElementById('active-name');
    const sizeEl = document.getElementById('active-size');
    const badge = document.getElementById('status-badge');
    const downloadZone = document.getElementById('download-zone');
    const downloadAnchor = document.getElementById('final-download-link') as HTMLAnchorElement;

    if (!active || !mainImg) return;

    mainImg.style.opacity = '0';
    setTimeout(() => {
        mainImg.src = active.preview;
        mainImg.style.opacity = '1';
        if (nameEl) nameEl.innerText = active.name;
        if (sizeEl) sizeEl.innerText = `الحجم: ${(active.originalSize/1024).toFixed(1)} KB ${active.processedSize ? ` ➔ ${(active.processedSize/1024).toFixed(1)} KB` : ''}`;
        
        if (badge) {
            badge.innerText = active.status === 'done' ? 'تم الضغط بنجاح' : active.status === 'processing' ? 'جاري العمل...' : 'جاهز';
            badge.className = `px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${active.status === 'done' ? 'bg-brand-success/20 text-brand-success border border-brand-success/30' : 'bg-brand-primary/20 text-brand-primary'}`;
        }

        if (active.status === 'done' && downloadZone && downloadAnchor) {
            downloadZone.classList.remove('hidden');
            downloadAnchor.href = active.processedUrl || '#';
            downloadAnchor.download = `optimized_${active.name}`;
            updateSocialLinksUI(); 
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
            <img src="${f.preview}" class="w-16 h-16 object-cover rounded-xl shadow-md border-2 ${State.selectedId === f.id ? 'border-brand-primary ring-4 ring-brand-primary/10' : 'border-white/5'} hover:scale-105 transition-transform">
            ${f.status === 'done' ? '<div class="absolute -top-1 -right-1 bg-brand-success text-white p-0.5 rounded-full shadow-lg border-2 border-brand-dark"><i data-lucide="check" class="w-3.5 h-3.5"></i></div>' : ''}
            <button onclick="event.stopPropagation(); window.removeFile('${f.id}')" class="absolute -bottom-1 -left-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
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
    updateSocialLinksUI();
    injectAdsterra();
    
    const input = document.getElementById('file-input') as HTMLInputElement;
    const slider = document.getElementById('quality-slider') as HTMLInputElement;
    const processActiveBtn = document.getElementById('process-active-btn');
    const downloadTriggerBtn = document.getElementById('final-download-btn-trigger');

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

    downloadTriggerBtn?.addEventListener('click', () => {
        handleDownloadWithAd();
    });

    (window as any).lucide?.createIcons();
});