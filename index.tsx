
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
    const text = encodeURIComponent("جرب أداة storimage لضغط وتحسين الصور للسيو مجاناً وبأمان! 🚀");
    
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
        showToast("تم نسخ رابط storimage بنجاح! 📋");
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
    dropZone.classList.add('border-brand-primary', 'scale-[1.01]');
  });

  dropZone?.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-brand-primary', 'scale-[1.01]');
  });

  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-brand-primary', 'scale-[1.01]');
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

      if (format === 'text/html') {
          canvas.toBlob(async (imgBlob) => {
              if (imgBlob) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                      const base64data = reader.result as string;
                      const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>storimage - ${item.file.name}</title>
    <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #020617; font-family: sans-serif; }
        .container { max-width: 90%; text-align: center; }
        img { max-width: 100%; height: auto; border-radius: 12px; shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); border: 1px solid rgba(255,255,255,0.1); }
        p { color: #64748b; margin-top: 1rem; font-size: 0.8rem; }
    </style>
</head>
<body>
    <div class="container">
        <img src="${base64data}" alt="${item.file.name}">
        <p>تم الإنشاء بواسطة storimage | أداة سيو احترافية</p>
    </div>
</body>
</html>`;
                      const htmBlob = new Blob([htmlContent], { type: 'text/html' });
                      item.status = 'done';
                      item.resultBlob = htmBlob;
                      item.resultSize = htmBlob.size;
                      resolve();
                  };
                  reader.readAsDataURL(imgBlob);
              }
          }, 'image/webp', quality);
      } else {
          canvas.toBlob((blob) => {
            if (blob) {
              item.status = 'done';
              item.resultBlob = blob;
              item.resultSize = blob.size;
              resolve();
            }
          }, format, quality);
      }
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
  
  showToast('تم تحسين الصور بنجاح عبر storimage! ✨');
};

const updateUI = () => {
  const dropZone = document.getElementById('drop-zone');
  const shareArea = document.getElementById('share-area');
  const editorSection = document.getElementById('editor-section');
  
  if (files.length > 0) {
    dropZone?.classList.add('hidden');
    shareArea?.classList.add('hidden');
    editorSection?.classList.remove('hidden');
    renderQueue();
  } else {
    dropZone?.classList.remove('hidden');
    shareArea?.classList.remove('hidden');
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

  container.innerHTML = files.map(item => {
    const savings = item.resultSize ? Math.round((1 - (item.resultSize / item.originalSize)) * 100) : 0;
    
    return `
      <div class="bg-white dark:bg-brand-card p-4 md:p-5 rounded-[2rem] md:rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-4 md:gap-6 shadow-xl border border-slate-100 dark:border-white/5 animate-up">
        <div class="relative w-full sm:w-28 md:w-32 h-44 sm:h-28 md:h-32 rounded-2xl md:rounded-3xl overflow-hidden shrink-0 shadow-lg border border-slate-100 dark:border-slate-800">
          <img src="${item.preview}" class="w-full h-full object-cover" alt="معاينة الصورة في storimage">
          ${item.status === 'done' ? `
            <div class="absolute inset-0 bg-brand-success/30 flex items-center justify-center backdrop-blur-[2px]">
              <i data-lucide="check" class="w-10 h-10 text-white drop-shadow-lg"></i>
            </div>
          ` : ''}
          ${item.status === 'processing' || item.isUploading ? `
            <div class="absolute inset-0 bg-brand-primary/20 flex items-center justify-center backdrop-blur-[2px]">
              <div class="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ` : ''}
        </div>

        <div class="flex-grow text-center sm:text-right w-full">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
             <h4 class="text-base md:text-lg font-black truncate max-w-full sm:max-w-[200px]">${item.file.name}</h4>
             ${item.status === 'done' ? `
               <span class="inline-flex items-center gap-1 px-3 py-1 bg-brand-success/10 text-brand-success text-[9px] font-black rounded-full self-center sm:self-auto">
                 <i data-lucide="trending-down" class="w-3 h-3"></i>
                 تم التحسين بنسبة ${savings}%
               </span>
             ` : ''}
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-slate-50 dark:bg-brand-dark/50 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
              <span class="block text-[9px] text-slate-400 font-black mb-0.5">قبل التحسين</span>
              <span class="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300">${formatSize(item.originalSize)}</span>
            </div>
            <div class="bg-slate-50 dark:bg-brand-dark/50 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
              <span class="block text-[9px] text-slate-400 font-black mb-0.5">بعد التحسين</span>
              <span class="text-xs md:text-sm font-bold ${item.resultSize ? 'text-brand-primary' : 'text-slate-400'}">${item.resultSize ? formatSize(item.resultSize) : '--'}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-row sm:flex-col gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
          ${item.status === 'done' ? `
            <div class="flex flex-row sm:flex-col gap-2 flex-1">
              <button onclick="window.downloadOne('${item.id}')" class="flex-1 sm:w-14 sm:h-14 bg-brand-success text-brand-dark rounded-xl md:rounded-2xl py-3 sm:py-0 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg group" title="تحميل الملف">
                <i data-lucide="download" class="w-6 h-6 sm:w-7 sm:h-7"></i>
              </button>
              <button onclick="window.getShortLink('${item.id}')" ${item.isUploading ? 'disabled' : ''} class="flex-1 sm:w-14 sm:h-14 ${item.isUploading ? 'bg-slate-100' : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white'} rounded-xl md:rounded-2xl py-3 sm:py-0 flex items-center justify-center transition-all shadow-sm" title="الحصول على رابط قصير (PNG/JPEG)">
                ${item.isUploading ? '<div class="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>' : '<i data-lucide="globe" class="w-5 h-5"></i>'}
              </button>
              <button onclick="window.copyLink('${item.id}')" class="flex-1 sm:w-14 sm:h-14 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl md:rounded-2xl py-3 sm:py-0 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm" title="نسخ كود الصورة">
                <i data-lucide="code" class="w-5 h-5"></i>
              </button>
            </div>
          ` : `
            <button onclick="window.processOne('${item.id}')" ${item.status === 'processing' ? 'disabled' : ''} class="flex-1 sm:w-14 sm:h-14 ${item.status === 'processing' ? 'bg-slate-100 text-slate-300' : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white'} rounded-xl md:rounded-2xl py-3 sm:py-0 flex items-center justify-center transition-all">
              <i data-lucide="play" class="w-5 h-5 md:w-6 md:h-6"></i>
            </button>
          `}
          <button onclick="window.removeFile('${item.id}')" class="flex-1 sm:w-14 sm:h-14 bg-red-500/5 text-red-400 rounded-xl md:rounded-2xl py-3 sm:py-0 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
            <i data-lucide="trash-2" class="w-5 h-5 md:w-6 md:h-6"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
  initLucide();
};

(window as any).getShortLink = async (id: string) => {
  const item = files.find(f => f.id === id);
  if (!item || !item.resultBlob) return;

  if (item.shortLink) {
    navigator.clipboard.writeText(item.shortLink);
    showToast("تم نسخ الرابط القصير مسبقاً! 🔗");
    return;
  }

  item.isUploading = true;
  renderQueue();

  try {
    const formatSelect = document.getElementById('format-select') as HTMLSelectElement;
    let ext = formatSelect.value.split('/')[1] || 'png';
    if (formatSelect.value === 'text/html') ext = 'htm';
    
    const formData = new FormData();
    // Rename blob to have the correct extension so the host returns a link ending in it
    const fileName = `storimage_${item.id}.${ext}`;
    formData.append('file', item.resultBlob, fileName);

    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.status === 'success') {
      // tmpfiles.org returns a view URL, we need to modify it to be a direct download URL which ends in ext
      // Standard: https://tmpfiles.org/12345/file.png -> https://tmpfiles.org/dl/12345/file.png
      let rawUrl = result.data.url;
      const directLink = rawUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      
      item.shortLink = directLink;
      navigator.clipboard.writeText(directLink);
      showToast(`تم توليد ونسخ الرابط القصير (ينتهي بـ ${ext.toUpperCase()})! 🚀`);
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error(error);
    showToast("عذراً، فشل توليد الرابط القصير. حاول مرة أخرى.");
  } finally {
    item.isUploading = false;
    renderQueue();
  }
};

(window as any).copyLink = async (id: string) => {
  const item = files.find(f => f.id === id);
  if (!item || !item.resultBlob) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64data = reader.result as string;
    navigator.clipboard.writeText(base64data).then(() => {
      showToast("تم نسخ كود الصورة (Data URI) بنجاح! 📋");
    }).catch(err => {
      console.error('فشل النسخ:', err);
      showToast("خطأ في نسخ الكود.");
    });
  };
  reader.readAsDataURL(item.resultBlob);
};

(window as any).processOne = (id: string) => {
    const item = files.find(f => f.id === id);
    if(item) processImage(item);
};

(window as any).downloadOne = (id: string) => {
  const item = files.find(f => f.id === id);
  if (!item || !item.resultBlob) return;
  const url = URL.createObjectURL(item.resultBlob);
  const a = document.createElement('a');
  const formatSelect = document.getElementById('format-select') as HTMLSelectElement;
  let ext = formatSelect.value.split('/')[1];
  
  if (formatSelect.value === 'text/html') {
      ext = 'htm';
  }

  a.href = url;
  a.download = `storimage_optimized_${item.id}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

(window as any).removeFile = (id: string) => {
  files = files.filter(f => f.id !== id);
  updateUI();
};

init();
