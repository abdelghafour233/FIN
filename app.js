
// --- State Management ---
let state = {
    products: JSON.parse(localStorage.getItem('products')) || INITIAL_PRODUCTS,
    cart: [],
    orders: JSON.parse(localStorage.getItem('orders')) || [],
    settings: JSON.parse(localStorage.getItem('settings')) || {
        fbPixel: '',
        googlePixel: '',
        tiktokPixel: '',
        googleSheets: '',
        domain: '',
        nameServer: ''
    }
};

// --- Initialization ---
function init() {
    window.addEventListener('hashchange', render);
    render();
    updateCartBadge();
    injectTrackingScripts();
}

// --- Tracking Pixels Logic ---
function injectTrackingScripts() {
    const s = state.settings;
    if (s.fbPixel) {
        const script = document.createElement('script');
        script.innerHTML = `!function(f,b,e,v,n,t,s){...}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init', '${s.fbPixel}'); fbq('track', 'PageView');`;
        document.head.appendChild(script);
    }
    // تكرار نفس المنطق لـ Google و TikTok
}

// --- Router ---
function render() {
    const root = document.getElementById('app-root');
    const hash = window.location.hash || '#';
    
    if (hash === '#' || hash === '') {
        root.innerHTML = viewHome();
    } else if (hash.startsWith('#category/')) {
        const cat = hash.split('/')[1];
        root.innerHTML = viewCategory(cat);
    } else if (hash.startsWith('#product/')) {
        const id = hash.split('/')[1];
        root.innerHTML = viewProductDetail(id);
    } else if (hash === '#cart') {
        root.innerHTML = viewCart();
    } else if (hash === '#checkout') {
        root.innerHTML = viewCheckout();
    } else if (hash === '#admin') {
        root.innerHTML = viewAdmin();
    }
    
    lucide.createIcons();
    window.scrollTo(0, 0);
}

// --- Views ---

function viewHome() {
    return `
        <header class="relative h-[450px] overflow-hidden">
            <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1200" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-black/50 flex items-center justify-center text-center p-4">
                <div class="text-white space-y-6">
                    <h1 class="text-4xl md:text-6xl font-bold">تسوق أفضل العروض في المغرب</h1>
                    <p class="text-lg md:text-xl max-w-2xl mx-auto">توصيل سريع لكل المدن المغربية والدفع عند الاستلام</p>
                    <a href="#category/electronics" class="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-full font-bold transition">ابدأ التسوق</a>
                </div>
            </div>
        </header>

        <section class="max-w-7xl mx-auto px-4 py-16">
            <h2 class="text-3xl font-bold mb-10 border-r-4 border-blue-600 pr-4">وصلنا حديثاً</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${state.products.map(p => productCard(p)).join('')}
            </div>
        </section>
    `;
}

function productCard(p) {
    return `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col product-card transition duration-300">
            <a href="#product/${p.id}" class="overflow-hidden">
                <img src="${p.image}" class="w-full h-52 object-cover transition-transform duration-500">
            </a>
            <div class="p-4 flex-grow flex flex-col">
                <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit mb-2 uppercase">${p.category}</span>
                <h3 class="font-bold text-lg mb-2 truncate">${p.name}</h3>
                <p class="text-gray-500 text-sm line-clamp-2 mb-4">${p.description}</p>
                <div class="mt-auto flex justify-between items-center">
                    <span class="text-xl font-bold text-blue-600">${p.price.toLocaleString()} <small>د.م</small></span>
                    <button onclick="handleAddToCart('${p.id}')" class="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition">
                        <i data-lucide="plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function viewCategory(cat) {
    const filtered = state.products.filter(p => p.category === cat);
    return `
        <div class="max-w-7xl mx-auto px-4 py-12">
            <h1 class="text-3xl font-bold mb-10 capitalize">${cat === 'electronics' ? 'الإلكترونيات' : cat === 'home' ? 'المنزل' : 'السيارات'}</h1>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${filtered.map(p => productCard(p)).join('')}
            </div>
        </div>
    `;
}

function viewProductDetail(id) {
    const p = state.products.find(item => item.id === id);
    if (!p) return '<div class="p-20 text-center">المنتج غير موجود</div>';
    return `
        <div class="max-w-7xl mx-auto px-4 py-12">
            <div class="bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-12">
                <img src="${p.image}" class="w-full h-[400px] object-cover rounded-2xl shadow-lg">
                <div class="space-y-6">
                    <div class="space-y-2">
                        <h1 class="text-3xl md:text-4xl font-bold">${p.name}</h1>
                        <p class="text-3xl font-bold text-blue-600">${p.price.toLocaleString()} د.م</p>
                    </div>
                    <p class="text-gray-600 leading-relaxed">${p.description}</p>
                    <div class="space-y-2">
                        <h4 class="font-bold">المميزات:</h4>
                        <ul class="list-disc list-inside text-gray-500 space-y-1">
                            ${p.specs.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="flex gap-4 pt-6">
                        <button onclick="handleAddToCart('${p.id}', true)" class="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center gap-2">
                            <i data-lucide="zap"></i> اشترِ الآن
                        </button>
                        <button onclick="handleAddToCart('${p.id}')" class="flex-1 bg-gray-100 text-gray-900 py-4 rounded-xl font-bold hover:bg-gray-200 transition">
                            أضف للسلة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function viewCart() {
    if (state.cart.length === 0) return `
        <div class="p-20 text-center">
            <i data-lucide="shopping-basket" class="mx-auto w-16 h-16 text-gray-300 mb-4"></i>
            <h2 class="text-2xl font-bold mb-4">سلة المشتريات فارغة</h2>
            <a href="#" class="text-blue-600 font-bold hover:underline">عد للمتجر وتسوق الآن</a>
        </div>`;
    
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    return `
        <div class="max-w-4xl mx-auto px-4 py-12">
            <h1 class="text-3xl font-bold mb-10">سلة المشتريات</h1>
            <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="p-6 space-y-6 divide-y">
                    ${state.cart.map(item => `
                        <div class="flex items-center gap-4 pt-6 first:pt-0">
                            <img src="${item.image}" class="w-20 h-20 object-cover rounded-lg">
                            <div class="flex-grow">
                                <h4 class="font-bold">${item.name}</h4>
                                <p class="text-blue-600 font-bold">${item.price.toLocaleString()} د.م</p>
                            </div>
                            <div class="flex items-center gap-4 bg-gray-50 px-3 py-1 rounded-lg">
                                <button onclick="updateQty('${item.id}', -1)" class="text-gray-400 hover:text-red-500">-</button>
                                <span class="font-bold">${item.qty}</span>
                                <button onclick="updateQty('${item.id}', 1)" class="text-gray-400 hover:text-blue-500">+</button>
                            </div>
                            <button onclick="removeFromCart('${item.id}')" class="text-red-400 hover:text-red-600">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="bg-gray-50 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div class="text-2xl font-bold">الإجمالي: <span class="text-blue-600">${total.toLocaleString()} د.م</span></div>
                    <a href="#checkout" class="w-full md:w-auto bg-blue-600 text-white px-12 py-3 rounded-xl font-bold hover:bg-blue-700 transition">إتمام الطلب</a>
                </div>
            </div>
        </div>
    `;
}

function viewCheckout() {
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    return `
        <div class="max-w-7xl mx-auto px-4 py-12">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h2 class="text-2xl font-bold mb-6">معلومات الزبون</h2>
                    <form onsubmit="handlePlaceOrder(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
                            <input required name="customerName" type="text" placeholder="مثال: أحمد العلوي" class="w-full p-4 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">المدينة</label>
                            <select required name="city" class="w-full p-4 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500">
                                <option value="">اختر المدينة</option>
                                ${MOROCCAN_CITIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                            <input required name="phone" type="tel" placeholder="06XXXXXXXX" class="w-full p-4 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 text-left" dir="ltr">
                        </div>
                        <button type="submit" class="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition">تأكيد الطلب - دفع عند الاستلام</button>
                    </form>
                </div>
                <div class="bg-gray-100 p-8 rounded-3xl h-fit">
                    <h3 class="text-xl font-bold mb-6">ملخص السلة</h3>
                    <div class="space-y-4">
                        ${state.cart.map(item => `
                            <div class="flex justify-between text-sm">
                                <span>${item.name} (x${item.qty})</span>
                                <span class="font-bold">${(item.price * item.qty).toLocaleString()} د.م</span>
                            </div>
                        `).join('')}
                        <div class="pt-4 border-t border-gray-300 flex justify-between text-xl font-bold">
                            <span>الإجمالي</span>
                            <span class="text-blue-600">${total.toLocaleString()} د.م</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function viewAdmin() {
    const activeTab = window.adminTab || 'pixels';
    return `
        <div class="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
            <aside class="md:w-64 space-y-2">
                <h2 class="text-2xl font-bold mb-6">لوحة التحكم</h2>
                <button onclick="setAdminTab('pixels')" class="w-full text-right p-4 rounded-xl font-bold flex gap-3 ${activeTab === 'pixels' ? 'admin-sidebar-active' : 'hover:bg-gray-100'}">
                    <i data-lucide="bar-chart-3"></i> البكسلات والتتبع
                </button>
                <button onclick="setAdminTab('orders')" class="w-full text-right p-4 rounded-xl font-bold flex gap-3 ${activeTab === 'orders' ? 'admin-sidebar-active' : 'hover:bg-gray-100'}">
                    <i data-lucide="package"></i> الطلبات
                </button>
                <button onclick="setAdminTab('settings')" class="w-full text-right p-4 rounded-xl font-bold flex gap-3 ${activeTab === 'settings' ? 'admin-sidebar-active' : 'hover:bg-gray-100'}">
                    <i data-lucide="settings"></i> الدومين والإعدادات
                </button>
            </aside>
            <main class="flex-grow bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                ${adminContent(activeTab)}
            </main>
        </div>
    `;
}

function adminContent(tab) {
    if (tab === 'pixels') return `
        <h3 class="text-xl font-bold mb-8">إدارة البكسل (Tracking)</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label class="block text-sm font-bold mb-2">Facebook Pixel ID</label>
                <input onchange="saveSetting('fbPixel', this.value)" value="${state.settings.fbPixel}" class="w-full p-3 bg-gray-50 rounded-xl border border-gray-200">
            </div>
            <div>
                <label class="block text-sm font-bold mb-2">TikTok Pixel ID</label>
                <input onchange="saveSetting('tiktokPixel', this.value)" value="${state.settings.tiktokPixel}" class="w-full p-3 bg-gray-50 rounded-xl border border-gray-200">
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-bold mb-2">Google Analytics (G-Tag)</label>
                <input onchange="saveSetting('googlePixel', this.value)" value="${state.settings.googlePixel}" class="w-full p-3 bg-gray-50 rounded-xl border border-gray-200">
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-bold mb-2">Google Sheets API URL</label>
                <input onchange="saveSetting('googleSheets', this.value)" value="${state.settings.googleSheets}" class="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" placeholder="https://script.google.com/...">
            </div>
        </div>
    `;
    
    if (tab === 'orders') return `
        <h3 class="text-xl font-bold mb-8">إدارة الطلبات (${state.orders.length})</h3>
        <div class="overflow-x-auto">
            <table class="w-full text-right">
                <thead class="bg-gray-50 text-gray-500">
                    <tr>
                        <th class="p-4">رقم الطلب</th>
                        <th class="p-4">الزبون</th>
                        <th class="p-4">المدينة</th>
                        <th class="p-4">المجموع</th>
                        <th class="p-4">الحالة</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    ${state.orders.map(o => `
                        <tr>
                            <td class="p-4 font-mono text-xs">#${o.id.slice(0,8)}</td>
                            <td class="p-4 font-bold">${o.customerName}</td>
                            <td class="p-4">${o.city}</td>
                            <td class="p-4 font-bold text-blue-600">${o.total.toLocaleString()} د.م</td>
                            <td class="p-4"><span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">قيد الانتظار</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    if (tab === 'settings') return `
        <h3 class="text-xl font-bold mb-8">إعدادات الموقع والدومين</h3>
        <div class="space-y-6">
            <div>
                <label class="block text-sm font-bold mb-2">اسم النطاق (Domain)</label>
                <input onchange="saveSetting('domain', this.value)" value="${state.settings.domain}" class="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" placeholder="example.com">
            </div>
            <div>
                <label class="block text-sm font-bold mb-2">Name Server</label>
                <input onchange="saveSetting('nameServer', this.value)" value="${state.settings.nameServer}" class="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" placeholder="ns1.host.com, ns2.host.com">
            </div>
            <div class="p-6 bg-blue-50 text-blue-800 rounded-2xl border border-blue-100">
                <h4 class="font-bold mb-2">تعليمات الرفع:</h4>
                <ol class="text-sm list-decimal list-inside space-y-2">
                    <li>قم بتحميل ملفات المشروع (index.html, app.js, data.js).</li>
                    <li>ارفعها على GitHub مستخدماً مستودعاً جديداً.</li>
                    <li>فعل GitHub Pages من الإعدادات.</li>
                    <li>اربط الدومين الخاص بك عن طريق توجيه الـ CNAME أو الـ IP.</li>
                </ol>
            </div>
        </div>
    `;
}

// --- Logic Handlers ---

window.handleAddToCart = (id, redirect = false) => {
    const p = state.products.find(item => item.id === id);
    const inCart = state.cart.find(item => item.id === id);
    if (inCart) {
        inCart.qty++;
    } else {
        state.cart.push({ ...p, qty: 1 });
    }
    updateCartBadge();
    if (redirect) window.location.hash = '#cart';
    else alert('تمت الإضافة للسلة بنجاح!');
};

window.updateQty = (id, delta) => {
    const item = state.cart.find(i => i.id === id);
    if (item) {
        item.qty = Math.max(1, item.qty + delta);
        render();
    }
};

window.removeFromCart = (id) => {
    state.cart = state.cart.filter(i => i.id !== id);
    updateCartBadge();
    render();
};

window.handlePlaceOrder = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const order = {
        id: Math.random().toString(36).substr(2, 9),
        customerName: formData.get('customerName'),
        city: formData.get('city'),
        phone: formData.get('phone'),
        items: [...state.cart],
        total: state.cart.reduce((s, i) => s + (i.price * i.qty), 0),
        date: new Date().toISOString()
    };
    
    state.orders.push(order);
    localStorage.setItem('orders', JSON.stringify(state.orders));
    
    // محاكاة الإرسال لـ Google Sheets
    if (state.settings.googleSheets) {
        console.log('Sending to Google Sheets:', order);
    }

    state.cart = [];
    updateCartBadge();
    alert('شكراً لك! تم استلام طلبك بنجاح. سنتواصل معك هاتفياً قريباً.');
    window.location.hash = '#';
};

window.setAdminTab = (tab) => {
    window.adminTab = tab;
    render();
};

window.saveSetting = (key, value) => {
    state.settings[key] = value;
    localStorage.setItem('settings', JSON.stringify(state.settings));
};

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
    if (count > 0) {
        badge.innerText = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// Start App
init();
