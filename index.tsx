// Added export {} to define this file as a module and avoid global scope variable collisions
export {};

interface FileItem {
  id: string;
  file: File;
  preview: string;
  status: 'idle' | 'processing' | 'done';
  resultBlob?: Blob;
  originalSize: number;
  resultSize?: number;
}

let files: FileItem[] = [];

const init = () => {
  setupEventListeners();
  initLucide();
  setupTheme();
  setupShareLogic();
};

const initLucide = () => {
  if ((window as any).lucide) (window as any).lucide.createIcons();
};

const setupTheme = () => {
  (window as any).toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    const icon = document.getElementById('theme-icon');
    const isDark = document.documentElement.classList.contains('dark');
    if (icon) {
      icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    }
    initLucide();
  };
};

const setupShareLogic = () => {
  (window as any).shareSite = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("جرب أداة إيليت إيميج لضغط الصور وتحويلها بجودة خرافية! 🔥");
    
    let shareUrl = "";
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(window.location.href);
        showToast("تم نسخ الرابط بنجاح! 📋");
        return;
    }
    
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
  };
};

const setupEventListeners = () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const qualitySlider = document.getElementById('quality-slider') as HTMLInputElement;
  const qualityVal = document.getElementById('quality-val');
  const processBtn = document.getElementById('process-all');

  dropZone?.addEventListener('click', () => fileInput?.click());
  
  dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
  });

  dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('active'));

  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  });

  fileInput?.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files) handleFiles(target.files);
  });

  qualitySlider?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    if (qualityVal) qualityVal.innerText = `${val}%`;
  });

  processBtn?.addEventListener('click', () => {
    processAllImages();
  });
};

const handleFiles = (incomingFiles: FileList) => {
  const newFiles: FileItem[] = Array.from(incomingFiles)
    .filter(file => file.type.startsWith('image/'))
    .map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'idle',
      originalSize: file.size
    }));

  files = [...files, ...newFiles];
  updateUI();
};

const processImage = async (item: FileItem): Promise<void> => {
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
          resolve();
        }
      }, format, quality);
    };
  });
};

const processAllImages = async () => {
  const idleFiles = files.filter(f => f.status === 'idle');
  if (idleFiles.length === 0) return;

  for (const fileItem of idleFiles) {
    await processImage(fileItem);
    renderQueue();
  }
  
  showToast('تمت معالجة الصور بنجاح!');
};

const updateUI = () => {
  const dropZone = document.getElementById('drop-zone');
  const shareGrid = document.getElementById('share-grid')?.parentElement;
  const editorSection = document.getElementById('editor-section');
  
  if (files.length > 0) {
    dropZone?.classList.add('hidden');
    shareGrid?.classList.add('hidden');
    editorSection?.classList.remove('hidden');
    renderQueue();
  } else {
    dropZone?.classList.remove('hidden');
    shareGrid?.classList.remove('hidden');
    editorSection?.classList.add('hidden');
  }
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

const renderQueue = () => {
  const container = document.getElementById('image-queue');
  if (!container) return;

  container.innerHTML = files.map(item => `
    <div class="bg-white dark:bg-brand-card p-6 rounded-[2.5rem] flex items-center gap-6 shadow-2xl border border-slate-100 dark:border-white/5 animate-up">
      <div class="relative w-24 h-24 rounded-3xl overflow-hidden shrink-0 shadow-xl border-4 border-slate-100 dark:border-slate-800">
        <img src="${item.preview}" class="w-full h-full object-cover">
        ${item.status === 'done' ? `
          <div class="absolute inset-0 bg-brand-success/20 flex items-center justify-center backdrop-blur-[2px]">
            <i data-lucide="check-circle" class="w-10 h-10 text-brand-success drop-shadow-lg"></i>
          </div>
        ` : ''}
      </div>
      <div class="flex-grow overflow-hidden">
        <h4 class="text-lg font-black truncate mb-2 text-right">${item.file.name}</h4>
        <div class="flex items-center justify-end gap-4 text-xs font-bold">
            ${item.resultSize ? `<span class="px-3 py-1 rounded-full bg-brand-success/10 text-brand-success">الجديد: ${formatSize(item.resultSize)}</span>` : ''}
            <span class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">الأصلي: ${formatSize(item.originalSize)}</span>
        </div>
      </div>
      <div class="flex gap-3">
        ${item.status === 'done' ? `
          <button onclick="window.downloadOne('${item.id}')" class="w-14 h-14 bg-brand-success text-brand-dark rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg">
            <i data-lucide="download" class="w-7 h-7"></i>
          </button>
        ` : item.status === 'processing' ? `
          <div class="w-14 h-14 text-brand-primary animate-spin flex items-center justify-center">
            <i data-lucide="loader" class="w-8 h-8"></i>
          </div>
        ` : `
          <div class="w-14 h-14 text-slate-300 dark:text-slate-700 flex items-center justify-center">
            <i data-lucide="clock" class="w-7 h-7"></i>
          </div>
        `}
        <button onclick="window.removeFile('${item.id}')" class="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
          <i data-lucide="trash-2" class="w-6 h-6"></i>
        </button>
      </div>
    </div>
  `).join('');
  initLucide();
};

(window as any).downloadOne = (id: string) => {
  const item = files.find(f => f.id === id);
  if (!item || !item.resultBlob) return;
  const url = URL.createObjectURL(item.resultBlob);
  const a = document.createElement('a');
  const ext = (document.getElementById('format-select') as HTMLSelectElement).value.split('/')[1];
  a.href = url;
  a.download = `elite_compressed_${item.id}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

(window as any).removeFile = (id: string) => {
  files = files.filter(f => f.id !== id);
  updateUI();
};

init();