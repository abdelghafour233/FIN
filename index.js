// StorAI Core Logic
import { GoogleGenAI } from "@google/genai";

let ai;
let currentFile = null;

// Ensure DOM is ready before attaching listeners
document.addEventListener("DOMContentLoaded", () => {
    init();
});

const init = () => {
    try {
        console.log("StorAI Starting...");
        
        // Setup UI first so buttons work even if API fails initially
        setupEventListeners();
        setupTheme();
        initLucide();

        // Attach global functions
        window.resetApp = resetApp;
        window.toggleTheme = toggleTheme;

        // Initialize API
        const apiKey = (typeof process !== "undefined" && process.env) ? process.env.API_KEY : "";
        
        if (!apiKey) {
            console.warn("API Key Not Found");
            showToast("⚠️ تنبيه: مفتاح API غير موجود، لن تعمل المعالجة.");
        } else {
            ai = new GoogleGenAI({ apiKey: apiKey });
        }

    } catch (err) {
        console.error("Critical Init Error:", err);
        showToast("حدث خطأ جسيم في تشغيل التطبيق");
    }
};

const initLucide = () => {
    if (window.lucide) window.lucide.createIcons();
};

const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    initLucide();
};

const setupEventListeners = () => {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const processBtn = document.getElementById('process-btn');

    if (dropZone && fileInput) {
        // Remove old listeners to be safe (cloning node is a quick way to clear listeners)
        const newDropZone = dropZone.cloneNode(true);
        dropZone.parentNode.replaceChild(newDropZone, dropZone);
        
        newDropZone.addEventListener('click', () => {
             document.getElementById('file-input').click();
        });
        
        // Re-attach file input listener
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        
        newFileInput.addEventListener('change', (e) => { 
            if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
            }
        });
    }

    if (processBtn) {
        processBtn.onclick = processCurrentFile; // Direct assignment to avoid duplicates
    }
};

const resetApp = () => {
    console.log("Resetting App...");
    currentFile = null;
    
    // Clear inputs
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
    
    const promptInput = document.getElementById('prompt-input');
    if (promptInput) promptInput.value = '';
    
    // Reset UI State
    const dropZone = document.getElementById('drop-zone');
    const editor = document.getElementById('editor-section');
    const queue = document.getElementById('image-queue');
    
    if(dropZone) dropZone.classList.remove('hidden');
    if(editor) editor.classList.add('hidden');
    if(queue) queue.innerHTML = '';
    
    showToast("✨ جاهز لمشروع جديد!");
};

const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
        showToast("الرجاء اختيار صورة (JPG, PNG)");
        return;
    }

    currentFile = {
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        preview: URL.createObjectURL(file),
        status: 'idle'
    };
    
    updateUI();
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
    initLucide();
};

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const processCurrentFile = async () => {
    if (!currentFile || currentFile.status === 'processing') return;

    const promptInput = document.getElementById('prompt-input');
    const promptText = promptInput.value.trim();

    if (!promptText) {
        showToast("✍️ يرجى كتابة وصف للتعديل");
        promptInput.focus();
        return;
    }

    if (!ai) {
        showToast("❌ خطأ: مفتاح API غير موجود أو لم يتم تحميل المكتبة.");
        return;
    }

    currentFile.status = 'processing';
    renderQueue();

    try {
        const base64Image = await fileToBase64(currentFile.file);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: currentFile.file.type, data: base64Image } },
                    { text: promptText + " (Return only the image)" }
                ]
            }
        });

        let resultDataUrl = null;
        const parts = response.candidates?.[0]?.content?.parts || [];
        
        for (const part of parts) {
            if (part.inlineData) {
                resultDataUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }

        if (resultDataUrl) {
            currentFile.resultDataUrl = resultDataUrl;
            currentFile.status = 'done';
            showToast("✨ تم السحر بنجاح!");
        } else {
            throw new Error("No image returned");
        }

    } catch (error) {
        console.error(error);
        currentFile.status = 'error';
        showToast("❌ فشلت العملية، حاول مرة أخرى.");
    } finally {
        renderQueue();
    }
};

const renderQueue = () => {
    const container = document.getElementById('image-queue');
    if (!container || !currentFile) return;

    const isProcessing = currentFile.status === 'processing';
    const isDone = currentFile.status === 'done';
    const isError = currentFile.status === 'error';

    let contentHtml = '';

    if (isProcessing) {
        contentHtml = `
            <div class="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl animate-pulse">
                <div class="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <div class="text-white font-bold text-lg">جاري التنفيذ...</div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-up">
            <!-- Original -->
            <div class="glass p-4 rounded-3xl border border-white/5">
                <div class="text-slate-400 text-sm font-bold text-center mb-2">الأصلية</div>
                <div class="aspect-square bg-slate-800 rounded-2xl overflow-hidden relative">
                    <img src="${currentFile.preview}" class="w-full h-full object-contain">
                </div>
            </div>

            <!-- Result -->
            <div class="glass p-4 rounded-3xl border ${isDone ? 'border-brand-primary' : 'border-white/5'} relative overflow-hidden">
                <div class="text-brand-primary text-sm font-bold text-center mb-2 flex items-center justify-center gap-2">
                    <i data-lucide="sparkles" class="w-4 h-4"></i> النتيجة
                </div>
                
                <div class="aspect-square bg-slate-800 rounded-2xl overflow-hidden relative flex items-center justify-center">
                    ${contentHtml}
                    
                    ${isDone && currentFile.resultDataUrl ? `
                        <img src="${currentFile.resultDataUrl}" class="w-full h-full object-contain relative z-0">
                        <a href="${currentFile.resultDataUrl}" download="storai_magic.png" class="absolute bottom-4 right-4 bg-brand-success hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 z-20 transition-transform hover:scale-105">
                            <i data-lucide="download" class="w-4 h-4"></i> حفظ
                        </a>
                    ` : isError ? `
                        <div class="text-red-400 flex flex-col items-center p-4 text-center">
                            <i data-lucide="alert-circle" class="w-10 h-10 mb-2"></i>
                            <p>عذراً، حدث خطأ.</p>
                        </div>
                    ` : `
                        <div class="text-slate-600 flex flex-col items-center p-4">
                            <i data-lucide="image" class="w-12 h-12 mb-2 opacity-20"></i>
                            <p class="text-sm opacity-50">النتيجة هنا</p>
                        </div>
                    `}
                </div>
            </div>
        </div>

        ${isDone ? `
            <div class="flex justify-center mt-8 animate-up">
                <button onclick="window.resetApp()" class="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl flex items-center gap-3 group">
                    <span class="bg-brand-primary/20 text-brand-primary p-2 rounded-lg group-hover:rotate-90 transition-transform duration-500">
                        <i data-lucide="refresh-cw" class="w-5 h-5"></i>
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
        
        // Clear previous timeout if exists to prevent weird jumping
        if (window.toastTimeout) clearTimeout(window.toastTimeout);
        
        window.toastTimeout = setTimeout(() => {
            t.classList.add('translate-y-32', 'opacity-0');
            t.classList.remove('translate-y-0', 'opacity-100');
        }, 4000);
    }
};
