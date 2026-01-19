
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

const init = () => {
  setupEventListeners();
  initLucide();
  setupTheme();
  loadMonetag();
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

const loadMonetag = () => {
  const id = localStorage.getItem('storimage-monetag-id');
  if (id) {
    const input = document.getElementById('monetag-id') as HTMLInputElement;
    if (input) input.value = id;
    injectMonetagScript(id);
  }
};

const injectMonetagScript = (id: string) => {
  if (!id) return;
  const scriptId = 'monetag-script';
  document.getElementById(scriptId)?.remove();
  const script = document.createElement('script');
  script.id = scriptId;
  script.src = `https://growther.net/tag.min.js?z=${id}`;
  script.async = true;
  script.setAttribute('data-cfasync', 'false');
  document.head.appendChild(script);
  console.log(`[storimage] Monetag active: ${id}`);
};

const setupEventListeners = () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const qualitySlider = document.getElementById('quality-slider') as HTMLInputElement;
  const qualityVal = document.getElementById('quality-val');
  const processBtn = document.getElementById('process-all');
  const saveMonetagBtn = document.getElementById('save-monetag');

  dropZone?.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    if (fileInput.files) handleFiles(fileInput.files);
  });

  qualitySlider?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    if (qualityVal) qualityVal.innerText = `${val}%`;
  });

  processBtn?.addEventListener('click', () => processAllImages());

  saveMonetagBtn?.addEventListener('click', () => {
    const id = (document.getElementById('monetag-id') as HTMLInputElement).value;
    localStorage.setItem('storimage-monetag-id', id);
    if (id) injectMonetagScript(id);
    showToast("تم تفعيل إعلانات Monetag بنجاح! 💰");
  });
};

const handleFiles = (incoming: FileList) => {
  const newFiles = Array.from(incoming).map(f => ({
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
  for (const item of idle) {
    await processImage(item);
    renderQueue();
  }
  showToast("اكتملت معالجة جميع الصور! ✨");
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
      <div class="relative w-full sm:w-32 h-44 sm:h-32 rounded-3xl overflow-hidden shadow-lg">
        <img src="${item.preview}" class="w-full h-full object-cover">
        ${item.status === 'processing' || item.isUploading ? `
          <div class="absolute inset-0 bg-brand-primary/20 backdrop-blur-[2px] flex items-center justify-center">
            <div class="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ` : ''}
      </div>

      <div class="flex-grow text-center sm:text-right w-full">
        <h4 class="text-lg font-black truncate mb-3">${item.file.name}</h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-slate-50 dark:bg-brand-dark/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
            <span class="block text-[10px] text-slate-400 font-bold mb-1 uppercase">الأصل</span>
            <span class="text-sm font-bold">${formatSize(item.originalSize)}</span>
          </div>
          <div class="bg-slate-50 dark:bg-brand-dark/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">
            <span class="block text-[10px] text-slate-400 font-bold mb-1 uppercase">النتيجة</span>
            <span class="text-sm font-bold text-brand-primary">${item.resultSize ? formatSize(item.resultSize) : '--'}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
        ${item.status === 'done' ? `
          <button onclick="window.downloadItem('${item.id}')" class="flex-1 sm:w-14 sm:h-14 bg-brand-success text-brand-dark rounded-2xl flex items-center justify-center hover:scale-105 transition-all">
            <i data-lucide="download"></i>
          </button>
          <button onclick="window.generateDirectLink('${item.id}')" ${item.isUploading ? 'disabled' : ''} class="flex-1 sm:w-14 sm:h-14 bg-brand-primary text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-all">
            <i data-lucide="globe"></i>
          </button>
        ` : `
          <button onclick="window.processItem('${item.id}')" class="flex-1 sm:w-14 sm:h-14 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all">
            <i data-lucide="play"></i>
          </button>
        `}
        <button onclick="window.removeItem('${item.id}')" class="flex-1 sm:w-14 sm:h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `).join('');
  initLucide();
};

(window as any).processItem = (id: string) => {
  const item = files.find(f => f.id === id);
  if (item) processImage(item);
};

(window as any).removeItem = (id: string) => {
  files = files.filter(f => f.id !== id);
  updateUI();
};

(window as any).downloadItem = (id: string) => {
  const item = files.find(f => f.id === id);
  if (!item || !item.resultBlob) return;
  const url = URL.createObjectURL(item.resultBlob);
  const a = document.createElement('a');
  const format = (document.getElementById('format-select') as HTMLSelectElement).value.split('/')[1] || 'webp';
  a.href = url;
  a.download = `storimage_${item.id}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
};

(window as any).generateDirectLink = async (id: string) => {
  const item = files.find(f => f.id === id);
  if (!item || !item.resultBlob) return;

  if (item.shortLink) {
    navigator.clipboard.writeText(item.shortLink);
    showToast("تم نسخ الرابط المباشر مسبقاً! 🔗");
    return;
  }

  item.isUploading = true;
  renderQueue();

  try {
    const format = (document.getElementById('format-select') as HTMLSelectElement).value.split('/')[1] || 'png';
    const formData = new FormData();
    formData.append('file', item.resultBlob, `storimage_${item.id}.${format}`);

    const res = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.status === 'success') {
      const directUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      item.shortLink = directUrl;
      navigator.clipboard.writeText(directUrl);
      showToast(`تم نسخ الرابط المباشر (ينتهي بـ .${format.toUpperCase()})! 🚀`);
    } else {
      throw new Error('Upload failed');
    }
  } catch (err) {
    showToast("عذراً، فشل رفع الصورة. حاول مرة أخرى.");
  } finally {
    item.isUploading = false;
    renderQueue();
  }
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
