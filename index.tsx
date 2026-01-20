// Define as module
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

let files: FileItem[] = [];
let isAdminAuthenticated = false;
const ADMIN_PASSWORD = "admin123";

const init = () => {
  setupEventListeners();
  initLucide();
  setupTheme();
  loadMonetag();
  setupViewSwitcher();
  setupAdminLogic();
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
      document.getElementById(`view-${v}`)?.classList.add('hidden');
    });
    document.getElementById(`view-${view}`)?.classList.remove('hidden');
    
    if (view === 'app') updateUI();
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
    const input = document.getElementById('admin-pass-input') as HTMLInputElement;
    if (input) input.value = '';
  };

  (window as any).verifyAdminPassword = () => {
    const input = document.getElementById('admin-pass-input') as HTMLInputElement;
    if (input.value === ADMIN_PASSWORD) {
      isAdminAuthenticated = true;
      (window as any).closeAdminModal();
      (window as any).switchView('admin');
      showToast("مرحباً بك في لوحة الإدارة 🔐");
    } else {
      showToast("كلمة المرور خاطئة! ❌");
      input.classList.add('border-red-500');
      setTimeout(() => input.classList.remove('border-red-500'), 1000);
    }
  };

  (window as any).togglePasswordVisibility = () => {
    const input = document.getElementById('admin-pass-input') as HTMLInputElement;
    const icon = document.getElementById('eye-icon');
    if (input.type === 'password') {
      input.type = 'text';
      icon?.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      icon?.setAttribute('data-lucide', 'eye');
    }
    initLucide();
  };
};

const extractTagId = (input: string): string | null => {
  // Regex to find numbers after / or directly as input
  const match = input.match(/(\d+)(?:\D|$)/);
  return match ? match[1] : null;
};

const loadMonetag = () => {
  const storedValue = localStorage.getItem('storimage-monetag-ids');
  if (storedValue) {
    const textarea = document.getElementById('monetag-ids') as HTMLTextAreaElement;
    if (textarea) textarea.value = storedValue;
    
    const entries = storedValue.split(/[,\n]/).map(e => e.trim()).filter(e => e);
    const validIds: string[] = [];
    
    entries.forEach(entry => {
      const id = extractTagId(entry);
      if (id) {
        validIds.push(id);
        injectMonetagScript(id);
      }
    });

    if (validIds.length > 0) {
      document.getElementById('ad-status-container')?.classList.remove('hidden');
      console.log(`[storimage] ${validIds.length} ads loaded.`);
    }
  }
};

const injectMonetagScript = (id: string) => {
  if (!id) return;
  const scriptId = `monetag-script-${id}`;
  if (document.getElementById(scriptId)) return;

  // Injection Strategy 1: The standard loader
  const script = document.createElement('script');
  script.id = scriptId;
  script.src = `https://growther.net/tag.min.js?z=${id}`;
  script.async = true;
  script.setAttribute('data-cfasync', 'false');
  document.head.appendChild(script);

  // Injection Strategy 2: Background Onclick trigger (Popunder)
  const meta = document.createElement('meta');
  meta.name = "monetag";
  meta.content = id;
  document.head.appendChild(meta);
};

const setupEventListeners = () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const qualitySlider = document.getElementById('quality-slider') as HTMLInputElement;
  const qualityVal = document.getElementById('quality-val');
  const processBtn = document.getElementById('process-all');
  const saveMonetagBtn = document.getElementById('save-monetag');

  dropZone?.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { if (fileInput.files) handleFiles(fileInput.files); });
  
  qualitySlider?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    if (qualityVal) qualityVal.innerText = `${val}%`;
  });

  processBtn?.addEventListener('click', () => processAllImages());

  saveMonetagBtn?.addEventListener('click', () => {
    const rawInput = (document.getElementById('monetag-ids') as HTMLTextAreaElement).value.trim();
    if (!rawInput) return showToast("يرجى إدخال روابط أو معرفات");
    
    localStorage.setItem('storimage-monetag-ids', rawInput);
    
    const entries = rawInput.split(/[,\n]/).map(e => e.trim()).filter(e => e);
    let injectedCount = 0;

    entries.forEach(entry => {
      const id = extractTagId(entry);
      if (id) {
        injectMonetagScript(id);
        injectedCount++;
      }
    });

    if (injectedCount > 0) {
      document.getElementById('ad-status-container')?.classList.remove('hidden');
      showToast(`تم تفعيل وحقن ${injectedCount} من الأكواد بنجاح! 💰`);
    } else {
      showToast("لم يتم العثور على معرفات صالحة في الإدخال.");
    }
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
  if (newFiles.length === 0) return;
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
      canvas.width = img.width;
      canvas.height = img.height;
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
  showToast("تم تحسين جميع الصور بنجاح! ✨");
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
    <div class="bg-white dark:bg-brand-card p-5 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-6 shadow-xl border border-slate-100 dark:border-white/5">
      <div class="relative w-full sm:w-28 h-32 sm:h-28 rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800">
        <img src="${item.preview}" class="w-full h-full object-cover">
        ${item.status === 'processing' || item.isUploading ? `
          <div class="absolute inset-0 bg-brand-primary/20 backdrop-blur-[2px] flex items-center justify-center">
            <div class="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ` : ''}
      </div>
      <div class="flex-grow text-center sm:text-right w-full">
        <h4 class="text-base font-black truncate mb-2">${item.file.name}</h4>
        <div class="flex gap-2 justify-center sm:justify-start">
            <span class="bg-slate-50 dark:bg-brand-dark/50 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-100 dark:border-white/5">الأصل: ${formatSize(item.originalSize)}</span>
            <span class="bg-brand-primary/10 text-brand-primary px-3 py-1.5 rounded-xl text-[10px] font-bold border border-brand-primary/5">الآن: ${item.resultSize ? formatSize(item.resultSize) : '--'}</span>
        </div>
      </div>
      <div class="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
        ${item.status === 'done' ? `
          <button onclick="window.downloadItem('${item.id}')" class="flex-1 sm:w-12 sm:h-12 bg-brand-success text-brand-dark rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-lg"><i data-lucide="download" class="w-5 h-5"></i></button>
          <button onclick="window.generateDirectLink('${item.id}')" ${item.isUploading ? 'disabled' : ''} class="flex-1 sm:w-12 sm:h-12 bg-brand-primary text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-lg"><i data-lucide="globe" class="w-5 h-5"></i></button>
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
  const format = (document.getElementById('format-select') as HTMLSelectElement).value.split('/')[1] || 'webp';
  a.href = url; a.download = `storimage_${item.id}.${format}`; a.click(); URL.revokeObjectURL(url);
};

(window as any).generateDirectLink = async (id: string) => {
  const item = files.find(f => f.id === id);
  if (!item || !item.resultBlob) return;
  if (item.shortLink) { navigator.clipboard.writeText(item.shortLink); showToast("تم نسخ الرابط المباشر! 🔗"); return; }
  item.isUploading = true; renderQueue();
  try {
    const format = (document.getElementById('format-select') as HTMLSelectElement).value.split('/')[1] || 'png';
    const formData = new FormData();
    formData.append('file', item.resultBlob, `storimage_${item.id}.${format}`);
    const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.status === 'success') {
      const directUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      item.shortLink = directUrl; navigator.clipboard.writeText(directUrl); showToast("تم رفع الصورة ونسخ الرابط المباشر! 🚀");
    } else { throw new Error('Upload failed'); }
  } catch (err) { showToast("فشل الرفع، يرجى المحاولة لاحقاً."); } finally { item.isUploading = false; renderQueue(); }
};

const showToast = (msg: string) => {
  const t = document.getElementById('toast');
  const m = document.getElementById('toast-msg');
  if (t && m) {
    m.innerText = msg; t.classList.remove('translate-y-32', 'opacity-0'); t.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => { t.classList.add('translate-y-32', 'opacity-0'); t.classList.remove('translate-y-0', 'opacity-100'); }, 3000);
  }
};

init();