// --- App State ---
let files = [];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initLucide();
    setupDropZone();
});

function initLucide() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function setupDropZone() {
    const dropZone = document.getElementById('drop-zone');
    const input = document.getElementById('file-input');

    input.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    ['dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('drop-zone--over'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drop-zone--over'));
    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('drop-zone--over');
        handleFiles(e.dataTransfer.files);
    });
}

// --- File Handling ---
function handleFiles(selectedFiles) {
    for (const file of selectedFiles) {
        if (!file.type.startsWith('image/')) continue;

        const fileId = Math.random().toString(36).substr(2, 9);
        const fileObj = {
            id: fileId,
            originalFile: file,
            preview: URL.createObjectURL(file),
            targetFormat: 'image/webp',
            quality: 0.8,
            status: 'idle', // idle, converting, done, error
            resultBlob: null
        };
        files.push(fileObj);
    }
    renderFiles();
}

function removeFile(id) {
    files = files.filter(f => f.id !== id);
    renderFiles();
}

function updateFileOptions(id, options) {
    const file = files.find(f => f.id === id);
    if (file) {
        Object.assign(file, options);
    }
}

// --- Conversion Engine ---
async function convertFile(id) {
    const file = files.find(f => f.id === id);
    if (!file || file.status === 'converting') return;

    file.status = 'converting';
    renderFiles();

    try {
        const blob = await processImage(file);
        file.status = 'done';
        file.resultBlob = blob;
    } catch (err) {
        console.error(err);
        file.status = 'error';
    }
    renderFiles();
}

async function convertAll() {
    const idleFiles = files.filter(f => f.status === 'idle');
    for (const file of idleFiles) {
        await convertFile(file.id);
    }
}

function processImage(fileObj) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Canvas conversion failed'));
            }, fileObj.targetFormat, fileObj.quality);
        };
        img.onerror = reject;
        img.src = fileObj.preview;
    });
}

function downloadFile(id) {
    const file = files.find(f => f.id === id);
    if (!file || !file.resultBlob) return;

    const extension = file.targetFormat.split('/')[1];
    const fileName = `converted_${file.originalFile.name.split('.')[0]}.${extension}`;
    const url = URL.createObjectURL(file.resultBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// --- Rendering ---
function renderFiles() {
    const container = document.getElementById('files-container');
    const globalActions = document.getElementById('global-actions');

    if (files.length === 0) {
        container.innerHTML = '';
        globalActions.classList.add('hidden');
        return;
    }

    globalActions.classList.remove('hidden');
    container.innerHTML = files.map(file => `
        <div class="file-card glass rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-slate-200">
            <!-- Preview -->
            <div class="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img src="${file.preview}" class="w-full h-full object-cover">
            </div>

            <!-- Info -->
            <div class="flex-grow text-center md:text-right min-w-0">
                <h4 class="font-bold text-slate-800 truncate">${file.originalFile.name}</h4>
                <p class="text-slate-400 text-xs mt-1 font-bold">${(file.originalFile.size / 1024).toFixed(1)} KB</p>
            </div>

            <!-- Options -->
            <div class="flex flex-wrap items-center justify-center gap-4">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-500">إلى:</span>
                    <select onchange="updateFileOptions('${file.id}', {targetFormat: this.value})" class="bg-slate-100 border-0 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="image/webp" ${file.targetFormat === 'image/webp' ? 'selected' : ''}>WEBP</option>
                        <option value="image/jpeg" ${file.targetFormat === 'image/jpeg' ? 'selected' : ''}>JPG</option>
                        <option value="image/png" ${file.targetFormat === 'image/png' ? 'selected' : ''}>PNG</option>
                    </select>
                </div>

                <div class="flex flex-col gap-1 w-32">
                    <div class="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>الجودة</span>
                        <span>${Math.round(file.quality * 100)}%</span>
                    </div>
                    <input type="range" min="0.1" max="1" step="0.1" value="${file.quality}" 
                           oninput="updateFileOptions('${file.id}', {quality: parseFloat(this.value)}); this.previousElementSibling.lastElementChild.innerText = Math.round(this.value * 100) + '%'" 
                           class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer">
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3">
                ${file.status === 'idle' ? `
                    <button onclick="convertFile('${file.id}')" class="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition" title="تحويل">
                        <i data-lucide="play" class="w-5 h-5"></i>
                    </button>
                ` : file.status === 'converting' ? `
                    <div class="p-3 animate-spin text-blue-600">
                        <i data-lucide="loader-2" class="w-5 h-5"></i>
                    </div>
                ` : file.status === 'done' ? `
                    <button onclick="downloadFile('${file.id}')" class="bg-green-600 text-white p-3 rounded-2xl hover:bg-green-700 transition" title="تحميل">
                        <i data-lucide="download" class="w-5 h-5"></i>
                    </button>
                ` : `
                    <div class="text-red-500" title="خطأ">
                        <i data-lucide="alert-circle" class="w-5 h-5"></i>
                    </div>
                `}
                
                <button onclick="removeFile('${file.id}')" class="text-slate-300 hover:text-red-500 transition p-3">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
        </div>
    `).join('');

    initLucide();
}
