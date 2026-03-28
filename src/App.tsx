import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { FavoritesProvider } from "@/lib/favorites";
import { I18nProvider } from "@/lib/i18n";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import AuthPage from "@/pages/AuthPage";
import ProfilePage from "@/pages/ProfilePage";
import CollectionsPage from "@/pages/CollectionsPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import FaqPage from "@/pages/FaqPage";
import AboutPage from "@/pages/AboutPage";
import AdminPage from "@/pages/AdminPage";
import FavoritesPage from "@/pages/FavoritesPage";
import NotFoundPage from "@/pages/NotFoundPage";

const queryClient = new QueryClient();

function AppShell() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-site">
      <Header />
      <main key={`${location.pathname}${location.search}`} className="route-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <CartProvider>
            <FavoritesProvider>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <AppShell />
              </BrowserRouter>
            </FavoritesProvider>
          </CartProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
