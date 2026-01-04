
export type Category = 'electronics' | 'home' | 'cars';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  specifications: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  city: string;
  phoneNumber: string;
  items: CartItem[];
  total: number;
  date: string;
  status: 'pending' | 'shipped' | 'delivered';
}

export interface Settings {
  facebookPixel: string;
  googleAnalytics: string;
  tiktokPixel: string;
  googleSheetsUrl: string;
  domain: string;
  nameServer: string;
}
