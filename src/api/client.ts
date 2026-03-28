import type {
  AuthResponse,
  BlogPost,
  CatalogPayload,
  CheckoutPayload,
  CollectionItem,
  FaqItem,
  HomePayload,
  Order,
  PaymentMethodOption,
  PaymentSession,
  Product,
  SearchSuggestion,
  UserProfile,
  Category,
  Review,
} from "@/types/store";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const TOKEN_KEY = "bookshop-token";

export function resolveMediaUrl(path = "") {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }
  return `${API_BASE}${path}`;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token: string) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

async function request<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getStoredToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  getHome: () => request<HomePayload>("/api/home"),
  getCatalog: (query = "") => request<CatalogPayload>(`/api/products${query}`),
  getProduct: (slug: string) => request<Product>(`/api/products/${slug}`),
  getCollections: () => request<CollectionItem[]>("/api/collections"),
  getCollection: (slug: string) => request<{ collection: CollectionItem; products: Product[] }>(`/api/collections/${slug}`),
  getBlogPosts: () => request<BlogPost[]>("/api/blog/posts"),
  getBlogPost: (slug: string) => request<BlogPost>(`/api/blog/posts/${slug}`),
  getFaqs: () => request<FaqItem[]>("/api/faqs"),
  getSearchSuggestions: (q: string) => request<SearchSuggestion[]>(`/api/search/suggest?q=${encodeURIComponent(q)}`),
  getProductReviews: (slug: string) => request<Review[]>(`/api/products/${slug}/reviews`),
  createProductReview: (slug: string, payload: { rating: number; text: string }) => request<Review>(`/api/products/${slug}/reviews`, { method: "POST", body: JSON.stringify(payload) }),
  getFavorites: () => request<Product[]>("/api/favorites"),
  toggleFavorite: (productId: string) => request<{ ok: boolean; active: boolean; favoriteIds: string[] }>(`/api/favorites/${productId}`, { method: "PUT" }),
  register: (payload: Record<string, string>) => request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: Record<string, string>) => request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  forgotPassword: (payload: Record<string, string>) => request<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify(payload) }),
  googleUrl: () => request<{ url: string }>("/api/auth/google/url"),
  getProfile: () => request<UserProfile>("/api/profile/me"),
  updateProfile: (payload: Partial<UserProfile>) => request<UserProfile>("/api/profile/me", { method: "PUT", body: JSON.stringify(payload) }),
  getMyOrders: () => request<Order[]>("/api/orders/my"),
  getOrderStatus: (orderId: string) => request<Order>(`/api/orders/${orderId}/status`),
  getPaymentProviders: () => request<{ methods: PaymentMethodOption[] }>("/api/payments/providers"),
  createOrder: (payload: CheckoutPayload) => request<PaymentSession>("/api/checkout/create", { method: "POST", body: JSON.stringify(payload) }),
  getAdminOverview: () => request<{ products: number; hiddenProducts: number; orders: number; users: number; billzEnabled: boolean }>("/api/admin/overview"),
  getAdminCategories: () => request<Category[]>("/api/admin/categories"),
  createAdminCategory: (payload: Partial<Category> & { name?: string; description?: string }) => request<Category>("/api/admin/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateAdminCategory: (id: string, payload: Record<string, unknown>) => request<Category>(`/api/admin/categories/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteAdminCategory: (id: string) => request<{ ok: boolean }>(`/api/admin/categories/${id}`, { method: "DELETE" }),
  getAdminProducts: () => request<Product[]>("/api/admin/products"),
  getAdminUsers: () => request<Array<{ id: string; email: string; role: string; firstName: string; lastName: string; phone: string; city: string; createdAt: string; favoriteCount: number; ordersCount: number }>>("/api/admin/users"),
  updateAdminUser: (id: string, payload: Record<string, unknown>) => request<Record<string, unknown>>(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteAdminUser: (id: string) => request<{ ok: boolean }>(`/api/admin/users/${id}`, { method: "DELETE" }),
  getAdminReviews: () => request<Review[]>("/api/admin/reviews"),
  updateAdminReview: (id: string, payload: Record<string, unknown>) => request<Review>(`/api/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteAdminReview: (id: string) => request<{ ok: boolean }>(`/api/admin/reviews/${id}`, { method: "DELETE" }),
  getAdminOrders: () => request<Order[]>("/api/admin/orders"),
  updateAdminProduct: (id: string, payload: Partial<Product>) => request<Product>(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteAdminProduct: (id: string) => request<{ ok: boolean }>(`/api/admin/products/${id}`, { method: "DELETE" }),
  createAdminProduct: (payload: Partial<Product>) => request<Product>("/api/admin/products", { method: "POST", body: JSON.stringify(payload) }),
  syncBillz: () => request<{ message: string; imported: number }>("/api/admin/billz/sync", { method: "POST" }),
  uploadProductImage: (id: string, payload: { fileName: string; dataUrl: string }) => request<Product>(`/api/admin/products/${id}/image`, { method: "POST", body: JSON.stringify(payload) }),
};
