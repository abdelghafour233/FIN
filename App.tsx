
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, Home, Smartphone, Car, Sofa, Menu, X, Trash2, Plus, Minus, Settings as SettingsIcon, Package, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, CartItem, Order, Settings, Category } from './types';
import { INITIAL_PRODUCTS, MOROCCAN_CITIES } from './constants';

// --- Components ---

const Navbar: React.FC<{ cartCount: number; isAdmin: boolean }> = ({ cartCount, isAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center">
              <span className="ml-2">متجر المغرب</span>
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-reverse space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition">الرئيسية</Link>
            <Link to="/category/electronics" className="text-gray-700 hover:text-blue-600 transition">إلكترونيات</Link>
            <Link to="/category/home" className="text-gray-700 hover:text-blue-600 transition">منزلية</Link>
            <Link to="/category/cars" className="text-gray-700 hover:text-blue-600 transition">سيارات</Link>
          </div>

          <div className="flex items-center space-x-reverse space-x-4">
            <Link to="/admin" className="text-gray-600 hover:text-blue-600">
              <LayoutDashboard size={24} />
            </Link>
            <Link to="/cart" className="relative text-gray-600 hover:text-blue-600">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-600">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-lg">
          <Link to="/" onClick={() => setIsOpen(false)} className="block text-gray-700">الرئيسية</Link>
          <Link to="/category/electronics" onClick={() => setIsOpen(false)} className="block text-gray-700">إلكترونيات</Link>
          <Link to="/category/home" onClick={() => setIsOpen(false)} className="block text-gray-700">منزلية</Link>
          <Link to="/category/cars" onClick={() => setIsOpen(false)} className="block text-gray-700">سيارات</Link>
        </div>
      )}
    </nav>
  );
};

// --- Pages ---

const HomePage: React.FC<{ products: Product[] }> = ({ products }) => {
  return (
    <div className="space-y-12 pb-12">
      {/* Hero */}
      <section className="relative h-[500px] overflow-hidden rounded-b-3xl">
        <img 
          src="https://picsum.photos/seed/ecommerce-hero/1200/600" 
          alt="Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-center text-white px-4">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">تسوق أفضل المنتجات في المغرب</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto">توصيل سريع، أسعار تنافسية، وضمان الجودة على جميع الإلكترونيات والسيارات.</p>
            <div className="flex justify-center gap-4">
              <Link to="/category/electronics" className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-full font-bold transition">الإلكترونيات</Link>
              <Link to="/category/cars" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-full font-bold transition">السيارات</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { id: 'electronics', name: 'الإلكترونيات', icon: <Smartphone />, color: 'bg-blue-100 text-blue-600' },
          { id: 'home', name: 'المنزل والمطبخ', icon: <Sofa />, color: 'bg-green-100 text-green-600' },
          { id: 'cars', name: 'السيارات والمركبات', icon: <Car />, color: 'bg-red-100 text-red-600' },
        ].map(cat => (
          <Link key={cat.id} to={`/category/${cat.id}`} className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm hover:shadow-xl transition border border-gray-100 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${cat.color} group-hover:scale-110 transition`}>
              {React.cloneElement(cat.icon as React.ReactElement, { size: 32 })}
            </div>
            <h3 className="text-xl font-bold">{cat.name}</h3>
          </Link>
        ))}
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">وصلنا حديثاً</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.slice(0, 8).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
  <Link to={`/product/${product.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition border border-gray-100 flex flex-col h-full">
    <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
    <div className="p-4 flex flex-col flex-grow">
      <div className="mb-2">
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded capitalize">{product.category}</span>
      </div>
      <h3 className="text-lg font-bold mb-2 line-clamp-1">{product.name}</h3>
      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>
      <div className="mt-auto flex justify-between items-center">
        <span className="text-xl font-bold text-blue-600">{product.price.toLocaleString()} <small className="text-xs">د.م</small></span>
        <button className="bg-gray-900 text-white p-2 rounded-lg hover:bg-blue-600 transition">
          <Plus size={20} />
        </button>
      </div>
    </div>
  </Link>
);

const CategoryPage: React.FC<{ products: Product[]; category: string }> = ({ products, category }) => {
  const filteredProducts = products.filter(p => p.category === category);
  const titles: Record<string, string> = {
    electronics: 'الإلكترونيات والتقنية',
    home: 'مستلزمات المنزل والمطبخ',
    cars: 'سوق السيارات والمركبات'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{titles[category] || 'الفئة'}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

const ProductDetailsPage: React.FC<{ products: Product[]; addToCart: (p: Product) => void }> = ({ products, addToCart }) => {
  const id = window.location.hash.split('/').pop();
  const product = products.find(p => p.id === id);
  const navigate = useNavigate();

  if (!product) return <div className="p-20 text-center">المنتج غير موجود</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <img src={product.image} alt={product.name} className="w-full h-96 object-cover rounded-2xl shadow-inner" />
        </div>
        <div className="space-y-6">
          <nav className="text-sm text-gray-400">
             الرئيسية / {product.category} / {product.name}
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
          <p className="text-2xl font-bold text-blue-600">{product.price.toLocaleString()} درهم مغربي</p>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
          
          <div className="space-y-2">
            <h3 className="font-bold">المواصفات:</h3>
            <ul className="list-disc list-inside text-gray-500 space-y-1">
              {product.specifications.map((spec, i) => <li key={i}>{spec}</li>)}
            </ul>
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              onClick={() => { addToCart(product); navigate('/cart'); }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} />
              اشتري الآن
            </button>
            <button 
              onClick={() => addToCart(product)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-xl font-bold transition"
            >
              أضف للسلة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartPage: React.FC<{ cart: CartItem[]; updateQty: (id: string, delta: number) => void; remove: (id: string) => void }> = ({ cart, updateQty, remove }) => {
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-gray-50 p-12 rounded-3xl border border-dashed border-gray-200">
          <ShoppingCart size={64} className="mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold mb-4">سلة التسوق فارغة</h2>
          <Link to="/" className="text-blue-600 font-bold hover:underline">ابدأ التسوق الآن</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-10">سلة التسوق</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-100">
              <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
              <div className="flex-grow">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-blue-600 font-bold">{item.price.toLocaleString()} د.م</p>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg">
                <button onClick={() => updateQty(item.id, -1)} className="p-1 text-gray-500 hover:text-red-500"><Minus size={18} /></button>
                <span className="font-bold min-w-[20px] text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, 1)} className="p-1 text-gray-500 hover:text-blue-500"><Plus size={18} /></button>
              </div>
              <button onClick={() => remove(item.id)} className="text-gray-300 hover:text-red-500 transition p-2">
                <Trash2 size={24} />
              </button>
            </div>
          ))}
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit space-y-6">
          <h3 className="text-xl font-bold">ملخص الطلبية</h3>
          <div className="flex justify-between text-gray-500">
            <span>المجموع الفرعي</span>
            <span>{total.toLocaleString()} د.م</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>الشحن</span>
            <span className="text-green-500">مجاني</span>
          </div>
          <div className="pt-6 border-t border-gray-100 flex justify-between font-bold text-2xl">
            <span>الإجمالي</span>
            <span className="text-blue-600">{total.toLocaleString()} د.م</span>
          </div>
          <Link to="/checkout" className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-4 rounded-xl font-bold transition">
            إتمام عملية الشراء
          </Link>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage: React.FC<{ cart: CartItem[]; placeOrder: (customer: { name: string; city: string; phone: string }) => void }> = ({ cart, placeOrder }) => {
  const [formData, setFormData] = useState({ name: '', city: '', phone: '' });
  const navigate = useNavigate();

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.city || !formData.phone) return alert('يرجى ملء كافة البيانات');
    placeOrder(formData);
    alert('تم استلام طلبك بنجاح! سنتواصل معك قريباً.');
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-10 text-center">إتمام الطلب</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-xl font-bold mb-4">معلومات الشحن</h3>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
            <input 
              required
              type="text" 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="مثال: محمد العلوي"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">المدينة</label>
            <select 
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
            >
              <option value="">اختر مدينتك</option>
              {MOROCCAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
            <input 
              required
              type="tel" 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-left"
              dir="ltr"
              placeholder="06XXXXXXXX"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition">
            تأكيد الطلب والدفع عند الاستلام
          </button>
        </form>

        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 space-y-6 h-fit">
          <h3 className="text-xl font-bold">ملخص السلة</h3>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{item.name} × {item.quantity}</span>
              <span className="font-bold">{(item.price * item.quantity).toLocaleString()} د.م</span>
            </div>
          ))}
          <div className="pt-6 border-t border-gray-200 flex justify-between font-bold text-xl">
            <span>الإجمالي</span>
            <span className="text-blue-600">{total.toLocaleString()} د.م</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Admin Section ---

const AdminDashboard: React.FC<{ 
  orders: Order[]; 
  products: Product[]; 
  settings: Settings; 
  updateSettings: (s: Settings) => void;
  deleteProduct: (id: string) => void;
}> = ({ orders, products, settings, updateSettings, deleteProduct }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'products' | 'settings'>('analytics');

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="md:w-64 space-y-2">
        <h2 className="text-2xl font-bold mb-6 px-4">لوحة التحكم</h2>
        {[
          { id: 'analytics', label: 'الإحصائيات والبكسل', icon: <BarChart3 size={20} /> },
          { id: 'orders', label: 'الطلبات', icon: <Package size={20} /> },
          { id: 'products', label: 'المنتجات', icon: <ShoppingBagIcon size={20} /> },
          { id: 'settings', label: 'الإعدادات والدومين', icon: <SettingsIcon size={20} /> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[600px]">
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h3 className="text-xl font-bold">إدارة أكواد التتبع (Pixel)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Facebook Pixel ID</label>
                <input 
                  type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={settings.facebookPixel}
                  onChange={e => updateSettings({...settings, facebookPixel: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">TikTok Pixel ID</label>
                <input 
                  type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={settings.tiktokPixel}
                  onChange={e => updateSettings({...settings, tiktokPixel: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Google Analytics (G-Tag)</label>
                <input 
                  type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={settings.googleAnalytics}
                  onChange={e => updateSettings({...settings, googleAnalytics: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">رابط Google Sheets (لربط الطلبات)</label>
                <input 
                  type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={settings.googleSheetsUrl}
                  onChange={e => updateSettings({...settings, googleSheetsUrl: e.target.value})}
                />
                <p className="text-xs text-gray-400 mt-2">* سيتم تصدير الطلبات تلقائياً إلى هذا الجدول عند كل عملية شراء.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">إدارة الطلبات ({orders.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase">
                    <th className="px-4 py-3 font-bold">رقم الطلب</th>
                    <th className="px-4 py-3 font-bold">الزبون</th>
                    <th className="px-4 py-3 font-bold">المدينة</th>
                    <th className="px-4 py-3 font-bold">الهاتف</th>
                    <th className="px-4 py-3 font-bold">المجموع</th>
                    <th className="px-4 py-3 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-mono">#{order.id.slice(0, 8)}</td>
                      <td className="px-4 py-4 font-bold">{order.customerName}</td>
                      <td className="px-4 py-4">{order.city}</td>
                      <td className="px-4 py-4 font-mono">{order.phoneNumber}</td>
                      <td className="px-4 py-4 font-bold text-blue-600">{order.total.toLocaleString()} د.م</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                          {order.status === 'pending' ? 'قيد الانتظار' : 'تم التوصيل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">المنتجات الحالية ({products.length})</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <Plus size={18} /> إضافة منتج
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p.id} className="flex gap-4 p-3 border border-gray-100 rounded-xl items-center">
                  <img src={p.image} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-grow">
                    <h4 className="font-bold text-sm line-clamp-1">{p.name}</h4>
                    <p className="text-blue-600 text-xs">{p.price.toLocaleString()} د.م</p>
                  </div>
                  <button onClick={() => deleteProduct(p.id)} className="text-red-300 hover:text-red-500"><Trash2 size={20} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <h3 className="text-xl font-bold">إعدادات المتجر والدومين</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم النطاق (Domain)</label>
                <div className="flex">
                  <span className="bg-gray-100 px-4 py-3 rounded-r-xl border border-l-0 border-gray-200 text-gray-500">https://</span>
                  <input 
                    type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-l-xl"
                    placeholder="example.com"
                    value={settings.domain}
                    onChange={e => updateSettings({...settings, domain: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">خادم الأسماء (Name Server)</label>
                <input 
                  type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm"
                  placeholder="ns1.yourhost.com, ns2.yourhost.com"
                  value={settings.nameServer}
                  onChange={e => updateSettings({...settings, nameServer: e.target.value})}
                />
              </div>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <h4 className="font-bold text-blue-800 mb-2">كيفية رفع الموقع؟</h4>
              <p className="text-sm text-blue-600">
                يمكنك تحميل كود الموقع ورفعه مباشرة على GitHub Pages أو أي استضافة تدعم المواقع الساكنة. يتم ربط الدومين عن طريق توجيه الـ DNS إلى الـ IP الخاص بالاستضافة المختارة.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const ShoppingBagIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);

// --- App Wrapper ---

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings>({
    facebookPixel: '',
    googleAnalytics: '',
    tiktokPixel: '',
    googleSheetsUrl: '',
    domain: '',
    nameServer: ''
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeCartItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const placeOrder = (customer: { name: string; city: string; phone: string }) => {
    const newOrder: Order = {
      id: Math.random().toString(36).substring(7),
      customerName: customer.name,
      city: customer.city,
      phoneNumber: customer.phone,
      items: [...cart],
      total: cart.reduce((acc, i) => acc + (i.price * i.quantity), 0),
      date: new Date().toISOString(),
      status: 'pending'
    };
    setOrders([newOrder, ...orders]);
    setCart([]);
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar cartCount={cart.reduce((a, c) => a + c.quantity, 0)} isAdmin={false} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage products={products} />} />
            <Route path="/category/electronics" element={<CategoryPage products={products} category="electronics" />} />
            <Route path="/category/home" element={<CategoryPage products={products} category="home" />} />
            <Route path="/category/cars" element={<CategoryPage products={products} category="cars" />} />
            <Route path="/product/:id" element={<ProductDetailsPage products={products} addToCart={addToCart} />} />
            <Route path="/cart" element={<CartPage cart={cart} updateQty={updateQty} remove={removeCartItem} />} />
            <Route path="/checkout" element={<CheckoutPage cart={cart} placeOrder={placeOrder} />} />
            <Route path="/admin" element={<AdminDashboard orders={orders} products={products} settings={settings} updateSettings={setSettings} deleteProduct={deleteProduct} />} />
          </Routes>
        </main>

        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">متجر المغرب الحديث</h3>
              <p className="text-gray-400 text-sm">وجهتكم الأولى للتسوق الإلكتروني في المغرب. نوفر لكم أفضل المنتجات بأفضل الأسعار.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">روابط سريعة</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><Link to="/category/electronics">إلكترونيات</Link></li>
                <li><Link to="/category/home">منزلية</Link></li>
                <li><Link to="/category/cars">سيارات</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">خدمة العملاء</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>تتبع الطلب</li>
                <li>سياسة الاسترجاع</li>
                <li>الشحن والتوصيل</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">تواصل معنا</h4>
              <p className="text-gray-400 text-sm">الهاتف: 0612345678</p>
              <p className="text-gray-400 text-sm mt-2">البريد: support@store.ma</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs">
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} متجر المغرب الحديث
          </div>
        </footer>
      </div>
    </Router>
  );
}
