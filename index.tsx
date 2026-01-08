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
    // تفعيل إعلانات Monetag عند الضغط
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
  
  showToast('اكتملت معالجة الصور بنجاح!');
};

const updateUI = () => {
  const dropZone = document.getElementById('drop-zone');
  const editorSection = document.getElementById('editor-section');
  
  if (files.length > 0) {
    dropZone?.classList.add('hidden');
    editorSection?.classList.remove('hidden');
    renderQueue();
  } else {
    dropZone?.classList.remove('hidden');
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
    t.classList.remove('translate-y-20', 'opacity-0');
    t.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      t.classList.add('translate-y-20', 'opacity-0');
      t.classList.remove('translate-y-0', 'opacity-100');
    }, 3000);
  }
};

const renderQueue = () => {
  const container = document.getElementById('image-queue');
  if (!container) return;

  container.innerHTML = files.map(item => `
    <div class="bg-white dark:bg-brand-card p-4 rounded-3xl flex items-center gap-4 shadow-lg border border-slate-100 dark:border-white/5">
      <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0">
        <img src="${item.preview}" class="w-full h-full object-cover">
      </div>
      <div class="flex-grow overflow-hidden">
        <h4 class="text-sm font-black truncate">${item.file.name}</h4>
        <div class="flex gap-3 text-[10px] font-bold mt-1">
            <span class="text-slate-400">الأصل: ${formatSize(item.originalSize)}</span>
            ${item.resultSize ? `<span class="text-brand-success">الجديد: ${formatSize(item.resultSize)}</span>` : ''}
        </div>
      </div>
      <div class="flex gap-2">
        ${item.status === 'done' ? `
          <button onclick="window.downloadOne('${item.id}')" class="w-10 h-10 bg-brand-success text-white rounded-xl flex items-center justify-center hover:scale-110 transition-all shadow-lg">
            <i data-lucide="download" class="w-5 h-5"></i>
          </button>
        ` : item.status === 'processing' ? `
          <div class="w-10 h-10 text-brand-primary animate-spin flex items-center justify-center">
            <i data-lucide="loader" class="w-5 h-5"></i>
          </div>
        ` : ''}
        <button onclick="window.removeFile('${item.id}')" class="w-10 h-10 text-slate-400 hover:text-red-500 transition-colors">
          <i data-lucide="trash-2" class="w-5 h-5"></i>
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
  a.download = `elite_${item.id}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

(window as any).removeFile = (id: string) => {
  files = files.filter(f => f.id !== id);
  updateUI();
};

init();