
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'آيفون 15 برو ماكس',
    description: 'أحدث هاتف من آبل مع كاميرا احترافية ومعالج جبار.',
    price: 14500,
    category: 'electronics',
    image: 'https://picsum.photos/seed/iphone/600/400',
    specifications: ['256GB', 'A17 Pro Chip', 'Super Retina XDR']
  },
  {
    id: '2',
    name: 'تلفاز سامسونج 65 بوصة 4K',
    description: 'تجربة سينمائية في منزلك مع دقة وضوح مذهلة.',
    price: 8900,
    category: 'electronics',
    image: 'https://picsum.photos/seed/tv/600/400',
    specifications: ['QLED', 'Smart TV', 'HDMI 2.1']
  },
  {
    id: '3',
    name: 'أريكة زاوية حديثة',
    description: 'أريكة مريحة وراقية تناسب جميع تصاميم المنازل الحديثة.',
    price: 5500,
    category: 'home',
    image: 'https://picsum.photos/seed/sofa/600/400',
    specifications: ['قماش فاخر', 'رمادي', '5 مقاعد']
  },
  {
    id: '4',
    name: 'خلاط مطبخ احترافي',
    description: 'محرك قوي لتحضير أفضل العصائر والوجبات.',
    price: 1200,
    category: 'home',
    image: 'https://picsum.photos/seed/blender/600/400',
    specifications: ['1500W', 'وعاء 2 لتر', 'شفرات فولاذية']
  },
  {
    id: '5',
    name: 'مرسيدس C-Class 2024',
    description: 'الفخامة والأداء في سيارة واحدة.',
    price: 580000,
    category: 'cars',
    image: 'https://picsum.photos/seed/car1/600/400',
    specifications: ['أوتوماتيك', 'بنزين', 'فل أوبشن']
  },
  {
    id: '6',
    name: 'تويوتا راف 4 هجين',
    description: 'السيارة العائلية الأكثر كفاءة وموثوقية.',
    price: 420000,
    category: 'cars',
    image: 'https://picsum.photos/seed/car2/600/400',
    specifications: ['هجين', 'دفع رباعي', 'موديل 2023']
  }
];

export const MOROCCAN_CITIES = [
  'الدار البيضاء', 'الرباط', 'مراكش', 'فاس', 'طنجة', 'أكادير', 'مكناس', 'وجدة', 'القنيطرة', 'تطوان'
];
