
// StorImage Core Logic
export {};

interface FileItem {
  id: string;
  file: File;
  preview: string;
  status: 'idle' | 'processing' | 'done';
  resultBlob?: Blob;
  originalSize: number;
  resultSize?: number;
  shortLink?: string;
  isUploading?: boolean;
}

// الروابط الافتراضية المزودة من المستخدم
const DEFAULT_ADSTERRA_LINKS = [
  "https://bouncingbuzz.com/zj3mgnqb3?key=06741e12c87b4f0448ad3a2ef3183b49",
  "https://bouncingbuzz.com/ctpynfts0?key=a6c7eb53025d8d39c467b947581bb153"
];

let files: FileItem[] = [];
let isAdminAuthenticated = false;
const ADMIN_PASSWORD = "admin123";
let adsterraLinks: string[] = [...DEFAULT_ADSTERRA_LINKS];

const init = () => {
  setupEventListeners();
  initLucide();
  setupTheme();
  loadAllAds();
  setupViewSwitcher();
  setupAdminLogic();
  setupGlobalClickTracker();
};

const initLucide = () => {
  if ((window as any).lucide) (window as any).lucide.createIcons();
};

const setupTheme = () => {
  (window as any).toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    const icon = document.getElementById('theme-icon');
    const isDark = document.documentElement.classList.contains('dark');
    if (icon) icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    initLucide();
  };
};

const setupViewSwitcher = () => {
  (window as any).switchView = (view: 'app' | 'admin') => {
    if (view === 'admin' && !isAdminAuthenticated) {
      (window as any).requestAdminAccess();
      return;
    }
    const views = ['app', 'admin'];
    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(`view-${view}`);
    if (target) target.classList.remove('hidden');
    initLucide();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
};

const setupAdminLogic = () => {
  (window as any).requestAdminAccess = () => {
    if (isAdminAuthenticated) {
      (window as any).switchView('admin');
    } else {
      document.getElementById('password-modal')?.classList.remove('hidden');
      document.getElementById('admin-pass-input')?.focus();
    }
  };
  (window as any).closeAdminModal = () => {
    document.getElementById('password-modal')?.classList.add('hidden');
  };
  (window as any).verifyAdminPassword = () => {
    const input = document.getElementById('admin-pass-input') as HTMLInputElement;
    if (input.value === ADMIN_PASSWORD) {
      isAdminAuthenticated = true;
      (window as any).closeAdminModal();
      (window as any).switchView('admin');
      showToast("مرحباً بك مجدداً 🔐");
    } else {
      showToast("كلمة مرور خاطئة!");
    }
  };
};

const loadAllAds = () => {
  // تحميل Monetag
  const mValue = localStorage.getItem('storimage-monetag-ids');
  if (mValue) {
    (document.getElementById('monetag-ids') as HTMLTextAreaElement).value = mValue;
    mValue.split(/[,\n]/).forEach(id => {
        if (!id.trim()) return;
        const script = document.createElement('script');
        script.src = `https://native.propellerads.com/ntfc.php?p=${id.trim()}`;
        script.async = true;
        document.head.appendChild(script);
    });
  }

  // تحميل Adsterra
  const aValue = localStorage.getItem('storimage-adsterra-links');
  if (aValue) {
    (document.getElementById('adsterra-links') as HTMLTextAreaElement).value = aValue;
    const customLinks = aValue.split(/[,\n]/).map(l => l.trim()).filter(l => l.startsWith('http'));
    if (customLinks.length > 0) {
      adsterraLinks = customLinks;
    }
  }
};

const setupGlobalClickTracker = () => {
  let hasPopped = false;
  const triggerAd = () => {
    if (hasPopped || adsterraLinks.length === 0) return;
    
    // اختيار رابط عشوائي من القائمة
    const link = adsterraLinks[Math.floor(Math.random() * adsterraLinks.length)];
    
    // محاولة فتح النافذة
    const win = window.open(link, '_blank');
    
    if (win) {
      hasPopped = true;
      // محاولة جعل النافذة في الخلفية (Popunder)
      win.blur(); 
      window.focus();
      // السماح بفتح إعلان آخر بعد 3 دقائق
      setTimeout(() => { hasPopped = false; }, 180000);
      console.log("Ad Triggered Successfully");
    }
  };

  // ربط الحدث بأي تفاعل في الصفحة لضمان تخطي حواجز المتصفح
  document.addEventListener('mousedown', triggerAd, { once: false });
  document.addEventListener('touchstart', triggerAd, { once: false });
};

const setupEventListeners = () => {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const dropZone = document.getElementById('drop-zone');
  const qualitySlider = document.getElementById('quality-slider') as HTMLInputElement;
  const qualityVal = document.getElementById('quality-val');

  dropZone?.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { if (fileInput.files) handleFiles(fileInput.files); });
  
  qualitySlider?.addEventListener('input', (e) => {
    if (qualityVal) qualityVal.innerText = `${(e.target as HTMLInputElement).value}%`;
  });

  document.getElementById('process-all')?.addEventListener('click', () => processAllImages());
  
  document.getElementById('save-all-ads')?.addEventListener('click', () => {
    const m = (document.getElementById('monetag-ids') as HTMLTextAreaElement).value.trim();
    const a = (document.getElementById('adsterra-links') as HTMLTextAreaElement).value.trim();
    localStorage.setItem('storimage-monetag-ids', m);
    localStorage.setItem('storimage-adsterra-links', a);
    showToast("تم الحفظ بنجاح! الإعلانات الآن نشطة 💰");
    setTimeout(() => window.location.reload(), 1000);
  });
};

const handleFiles = (incoming: FileList) => {
  const newFiles = Array.from(incoming).filter(f => f.type.startsWith('image/')).map(f => ({
    id: Math.random().toString(36).substr(2, 9),
    file: f,
    preview: URL.createObjectURL(f),
    status: 'idle' as const,
    originalSize: f.size
  }));
  files = [...files, ...newFiles];
  updateUI();
};

const processImage = async (item: FileItem) => {
  const quality = parseInt((document.getElementById('quality-slider') as HTMLInputElement).value) / 100;
  const format = (document.getElementById('format-select') as HTMLSelectElement).value;
  
  item.status = 'processing';
  renderQueue();

  return new Promise((resolve) => {
    const img = new Image();
    img.src = item.preview;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          item.status = 'done';
          item.resultBlob = blob;
          item.resultSize = blob.size;
          resolve(true);
        }
      }, format, quality);
    };
  });
};

const processAllImages = async () => {
  const idle = files.filter(f => f.status === 'idle');
  if (idle.length === 0) return;
  for (const item of idle) { await processImage(item); renderQueue(); }
  showToast("اكتملت المعالجة بنجاح! ✨");
};

const updateUI = () => {
  const dropZone = document.getElementById('drop-zone');
  const editor = document.getElementById('editor-section');
  if (files.length > 0) {
    dropZone?.classList.add('hidden');
    editor?.classList.remove('hidden');
    renderQueue();
  } else {
    dropZone?.classList.remove('hidden');
    editor?.classList.add('hidden');
  }
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const renderQueue = () => {
  const container = document.getElementById('image-queue');
  if (!container) return;
  container.innerHTML = files.map(item => `
    <div class="glass p-5 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6 animate-up">
      <div class="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg border border-white/5 shrink-0">
        <img src="${item.preview}" class="w-full h-full object-cover">
        ${item.status === 'processing' || item.isUploading ? `
          <div class="absolute inset-0 bg-brand-primary/20 backdrop-blur-[2px] flex items-center justify-center">
            <div class="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ` : ''}
      </div>
      <div class="flex-grow text-center sm:text-right w-full overflow-hidden">
        <h4 class="text-base font-black truncate mb-2">${item.file.name}</h4>
        <div class="flex gap-2 justify-center sm:justify-start">
            <span class="bg-slate-200/50 dark:bg-brand-dark/50 px-3 py-1.5 rounded-xl text-[10px] font-bold">الأصل: ${formatSize(item.originalSize)}</span>
            <span class="bg-brand-primary/10 text-brand-primary px-3 py-1.5 rounded-xl text-[10px] font-bold">${item.resultSize ? 'بعد: ' + formatSize(item.resultSize) : 'بانتظار الضغط'}</span>
        </div>
      </div>
      <div class="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
        ${item.status === 'done' ? `
          <button onclick="window.downloadItem('${item.id}')" class="flex-1 sm:w-12 sm:h-12 bg-brand-success text-brand-dark rounded-xl flex items-center justify-center hover:scale-105 transition-all"><i data-lucide="download" class="w-5 h-5"></i></button>
          <button onclick="window.generateDirectLink('${item.id}')" ${item.isUploading ? 'disabled' : ''} class="flex-1 sm:w-12 sm:h-12 bg-brand-primary text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all"><i data-lucide="globe" class="w-5 h-5"></i></button>
        ` : `
          <button onclick="window.processItem('${item.id}')" class="flex-1 sm:w-12 sm:h-12 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all"><i data-lucide="play" class="w-5 h-5"></i></button>
        `}
        <button onclick="window.removeItem('${item.id}')" class="flex-1 sm:w-12 sm:h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
      </div>
    </div>
  `).join('');
  initLucide();
};

(window as any).processItem = (id: string) => { const item = files.find(f => f.id === id); if (item) processImage(item); };
(window as any).removeItem = (id: string) => { files = files.filter(f => f.id !== id); updateUI(); };
(window as any).downloadItem = (id: string) => {
  const item = files.find(f => f.id === id);
  if (!item || !item.resultBlob) return;
  const url = URL.createObjectURL(item.resultBlob);
  const a = document.createElement('a');
  const format = (document.getElementById('format-select') as HTMLSelectElement).value.split('/')[1];
  a.href = url; a.download = `storimage_${item.id}.${format}`; a.click(); URL.revokeObjectURL(url);
};

(window as any).generateDirectLink = async (id: string) => {
  const item = files.find(f => f.id === id);
  if (!item || !item.resultBlob) return;
  if (item.shortLink) { navigator.clipboard.writeText(item.shortLink); showToast("تم نسخ الرابط المباشر! 🔗"); return; }
  item.isUploading = true; renderQueue();
  try {
    const formData = new FormData();
    formData.append('file', item.resultBlob, `image.${(document.getElementById('format-select') as HTMLSelectElement).value.split('/')[1]}`);
    const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.status === 'success') {
      const directUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      item.shortLink = directUrl; navigator.clipboard.writeText(directUrl); showToast("تم الرفع ونسخ الرابط بنجاح! 🚀");
    } else { throw new Error('Upload failed'); }
  } catch (err) { showToast("فشل الرفع، جرب لاحقاً."); } finally { item.isUploading = false; renderQueue(); }
};

const showToast = (msg: string) => {
  const t = document.getElementById('toast');
  const m = document.getElementById('toast-msg');
  if (t && m) {
    m.innerText = msg;
    t.classList.remove('translate-y-32', 'opacity-0');
    t.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      t.classList.add('translate-y-32', 'opacity-0');
      t.classList.remove('translate-y-0', 'opacity-100');
    }, 3000);
  }
};

init();
