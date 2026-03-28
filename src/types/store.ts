export type Lang = "ru" | "uz" | "en";

export interface LocalizedText {
  ru: string;
  uz: string;
  en: string;
}

export interface Category {
  id: string;
  slug: string;
  icon: string;
  accent: string;
  name: LocalizedText;
  description: LocalizedText;
}

export interface Product {
  id: string;
  externalId?: string | null;
  source: "seed" | "billz" | "local";
  slug: string;
  title: string;
  author: string;
  authorSlug?: string;
  price: number;
  oldPrice?: number | null;
  rating: number;
  reviewsCount: number;
  stock: number;
  inStock: boolean;
  published: boolean;
  categorySlug: string;
  categoryName: string;
  language: string;
  publisher: string;
  isbn: string;
  coverType: string;
  pages: number;
  year: number;
  description: string;
  summary?: string;
  images: string[];
  createdAt?: string;
  updatedAt?: string;
  format?: string;
  weight?: string;
  series?: string;
  featured?: {
    bestseller?: boolean;
    newArrival?: boolean;
    collectionSlugs?: string[];
  };
  seoTitle?: string;
  seoDescription?: string;
}

export interface CollectionItem {
  id: string;
  slug: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  accent: string;
  image: string;
  productSlugs: string[];
}

export interface Author {
  id: string;
  slug: string;
  name: string;
  country: string;
  booksCount: number;
  avatar: string;
  accent: string;
}

export interface Review {
  id: string;
  productId?: string;
  productSlug?: string;
  userId?: string;
  customerName: string;
  city: string;
  dateLabel: string;
  rating: number;
  text: string;
  createdAt?: string;
  updatedAt?: string;
  published?: boolean;
  productTitle?: string;
}


export interface BlogPost {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  cover: string;
  publishedAt: string;
  readTime: string;
  category: string;
  content: LocalizedText[];
}

export interface FaqItem {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  group: "delivery" | "payment" | "returns" | "account";
}

export interface HomePayload {
  categories: Category[];
  collections: CollectionItem[];
  authors: Author[];
  reviews: Review[];
  bestsellers: Product[];
  newArrivals: Product[];
  featuredSearch: Product[];
  heroStats: {
    catalogCount: string;
    delivery: string;
    rating: string;
  };
}

export interface CatalogPayload {
  products: Product[];
  total: number;
  page: number;
  pages: number;
  categories: Category[];
}

export interface SearchSuggestion {
  id: string;
  slug: string;
  title: string;
  author: string;
  price: number;
  image?: string;
}

export interface OrderItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  updatedAt?: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  amount: number;
  currency?: string;
  items: OrderItem[];
  customerName: string;
  phone: string;
  address: string;
  note?: string;
}

export interface PaymentMethodOption {
  code: string;
  title: string;
  mode: "redirect" | "merchant_api";
}

export interface PaymentSession {
  orderId: string;
  orderNumber: string;
  amount: number;
  payment: {
    id: string;
    provider: string;
    status: string;
    mode: "redirect" | "merchant_api";
    checkoutUrl: string;
    instructions?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  role: "customer" | "admin";
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  addressLine?: string;
  birthDate: string;
  gender: "male" | "female" | "";
  avatar?: string;
  favoriteIds?: string[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface CheckoutPayload {
  fullName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: string;
  items: OrderItem[];
}
