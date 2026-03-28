import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/data/books";

export default function Cart() {
  const { items, removeItem, updateQty, totalPrice } = useCart();
  const { t } = useI18n();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center" style={{ animation: "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <ShoppingBag className="w-16 h-16 text-border mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-foreground">{t("emptyCart")}</h2>
        <p className="text-muted-foreground mt-2">{t("emptyCartDesc")}</p>
        <Link
          to="/catalog"
          className="inline-flex items-center mt-6 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-hover transition-colors"
        >
          {t("goToCatalog")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">{t("cart")}</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-xl bg-card border border-border"
              style={{ animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both` }}
            >
              <Link to={`/product/${item.id}`} className="w-20 h-28 rounded-lg overflow-hidden bg-secondary shrink-0">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{item.author}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium tabular-nums">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-foreground">{formatPrice(item.price * item.qty)}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 bg-card rounded-xl border border-border p-6 space-y-4">
            {/* Promo */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t("promoCode")}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors active:scale-95">
                {t("apply")}
              </button>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Товары ({items.reduce((s, i) => s + i.qty, 0)})</span>
                <span className="text-sm font-medium text-foreground">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Доставка</span>
                <span className="text-sm font-medium text-foreground">Бесплатно</span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">{t("total")}</span>
                <span className="text-xl font-bold text-foreground">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors active:scale-[0.97]">
              {t("checkout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
