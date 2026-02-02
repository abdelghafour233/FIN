// StorAI Core Logic
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
// Ensure we don't crash if process is undefined in a raw browser environment
const apiKey = typeof process !== "undefined" ? process.env.API_KEY : "";
const ai = new GoogleGenAI({ apiKey: apiKey });

let currentFile = null;

const init = () => {
  setupEventListeners();
  initLucide();
  setupTheme();
  
  // Expose reset function globally
  window.resetApp = resetApp;
};

const initLucide = () => {
  if (window.lucide) window.lucide.createIcons();
};

const setupTheme = () => {
  window.toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    initLucide();
  };
};

const setupEventListeners = () => {
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const processBtn = document.getElementById('process-btn');

  if (dropZone) dropZone.addEventListener('click', () => fileInput.click());
  if (fileInput) {
    fileInput.addEventListener('change', () => { 
        if (fileInput.files && fileInput.files[0]) {
            handleFile(fileInput.files[0]);
        }
    });
  }

  if (processBtn) {
    processBtn.addEventListener('click', () => {
        processCurrentFile();
    });
  }
};

const resetApp = () => {
  currentFile = null;
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
  
  const promptInput = document.getElementById('prompt-input');
  if (promptInput) promptInput.value = '';
  
  updateUI();
  showToast("جاهز لمشروع جديد! 🚀");
};

const handleFile = (file) => {
  if (!file.type.startsWith('image/')) {
      showToast("الرجاء اختيار صورة فقط");
      return;
  }

  currentFile = {
    id: Math.random().toString(36).substr(2, 9),
    file: file,
    preview: URL.createObjectURL(file),
    status: 'idle',
    originalSize: file.size
  };
  
  updateUI();
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result;
        // Remove the Data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = result.split(',')[1];
        resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

const processCurrentFile = async () => {
  if (!currentFile || currentFile.status === 'processing') return;

  const promptInput = document.getElementById('prompt-input');
  const promptText = promptInput.value.trim();

  if (!promptText) {
      showToast("الرجاء كتابة وصف للتعديل المطلوب! ✍️");
      promptInput.focus();
      return;
  }

  currentFile.status = 'processing';
  renderQueue(); // Update UI to show loading state

  try {
    const base64Image = await fileToBase64(currentFile.file);

    // Call Gemini API
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: currentFile.file.type,
                        data: base64Image
                    }
                },
                {
                    text: promptText + " (Return only the image)"
                }
            ]
        }
    });

    let resultImageFound = false;
    
    // Extract Image from response
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64EncodeString = part.inlineData.data;
                currentFile.resultDataUrl = `data:image/png;base64,${base64EncodeString}`;
                resultImageFound = true;
                break;
            }
        }
    }

    if (resultImageFound) {
        currentFile.status = 'done';
        showToast("تم تنفيذ السحر بنجاح! ✨");
    } else {
        throw new Error("لم يتم إرجاع صورة من النموذج.");
    }

  } catch (error) {
    console.error(error);
    currentFile.status = 'error';
    showToast("حدث خطأ أثناء المعالجة، حاول مرة أخرى.");
  } finally {
      renderQueue();
  }
};

const updateUI = () => {
  const dropZone = document.getElementById('drop-zone');
  const editor = document.getElementById('editor-section');
  
  if (currentFile) {
    dropZone?.classList.add('hidden');
    editor?.classList.remove('hidden');
    renderQueue();
  } else {
    dropZone?.classList.remove('hidden');
    editor?.classList.add('hidden');
  }
};

const renderQueue = () => {
  const container = document.getElementById('image-queue');
  if (!container || !currentFile) return;

  const isProcessing = currentFile.status === 'processing';
  const isDone = currentFile.status === 'done';
  const isError = currentFile.status === 'error';

  let statusHtml = '';
  if (isProcessing) {
      statusHtml = `
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl">
            <div class="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <span class="text-white font-bold animate-pulse">جاري تحضير التعويذة...</span>
        </div>`;
  }

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-up">
        <!-- Original Image -->
        <div class="glass p-5 rounded-[2rem] border border-white/5 relative group">
            <h4 class="text-slate-400 font-bold mb-3 text-sm text-center">الصورة الأصلية</h4>
            <div class="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-800">
                <img src="${currentFile.preview}" class="w-full h-full object-contain">
            </div>
        </div>

        <!-- Result Image -->
        <div class="glass p-5 rounded-[2rem] border ${isDone ? 'border-brand-primary' : 'border-white/5'} relative">
            <h4 class="text-brand-primary font-bold mb-3 text-sm text-center flex items-center justify-center gap-2">
                <i data-lucide="sparkles" class="w-4 h-4"></i> النتيجة السحرية
            </h4>
            
            <div class="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center">
                ${statusHtml}
                
                ${isDone && currentFile.resultDataUrl ? `
                    <img src="${currentFile.resultDataUrl}" class="w-full h-full object-contain z-0">
                    <a href="${currentFile.resultDataUrl}" download="magic_storai_${currentFile.id}.png" class="absolute bottom-4 right-4 bg-brand-success text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 z-20">
                        <i data-lucide="download" class="w-4 h-4"></i> تحميل
                    </a>
                ` : isError ? `
                    <div class="text-center text-red-400 p-4">
                        <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto mb-2"></i>
                        فشلت العملية
                    </div>
                ` : `
                    <div class="text-slate-600 text-center p-4">
                        <i data-lucide="image-plus" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                        النتيجة ستظهر هنا
                    </div>
                `}
            </div>
        </div>
    </div>
    
    ${isDone ? `
        <div class="flex justify-center mt-8 animate-up">
             <button onclick="window.resetApp()" class="bg-slate-800 border border-white/10 hover:bg-slate-700 hover:border-brand-primary/50 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl flex items-center gap-3 group">
                <span class="bg-brand-primary/20 text-brand-primary p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <i data-lucide="plus" class="w-5 h-5"></i>
                </span>
                <span>بدء مشروع جديد</span>
             </button>
        </div>
    ` : ''}
  `;
  
  initLucide();
};

const showToast = (msg) => {
  const t = document.getElementById('toast');
  const m = document.getElementById('toast-msg');
  if (t && m) {
    m.innerText = msg;
    t.classList.remove('translate-y-32', 'opacity-0');
    t.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      t.classList.add('translate-y-32', 'opacity-0');
      t.classList.remove('translate-y-0', 'opacity-100');
    }, 4000);
  }
};

init();
