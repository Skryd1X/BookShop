import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/market";
import { QuantityControl } from "@/components/common/QuantityControl";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="container-tight py-10 md:py-12">
      <h1 className="text-[38px] font-heading font-extrabold text-slate-950 md:text-[52px]">{t("cartTitle")}</h1>
      {items.length === 0 ? (
        <div className="empty-state mt-10">
          <h2 className="text-3xl font-heading font-bold text-slate-950">{t("emptyCart")}</h2>
          <p className="mt-3 text-slate-500">{t("emptyCartText")}</p>
          <Link to="/catalog" className="primary-button mt-6 px-6 py-3">{t("catalogTitle")}</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.productId} className="cart-item-card flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-[20px] bg-violet-50 sm:h-32 sm:w-24">
                  {item.image ? <img src={item.image} alt={item.title} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary">{item.author || "Не указан"}</p>
                  <h2 className="mt-1 text-[20px] font-heading font-bold leading-[1.06] text-slate-950 sm:text-[24px] md:text-[28px]">{item.title}</h2>
                  <p className="mt-3 text-lg font-bold text-slate-900 sm:text-xl">{formatPrice(item.price)}</p>
                </div>
                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:flex-col sm:items-end">
                  <QuantityControl value={item.quantity} onChange={(value) => updateQuantity(item.productId, value)} />
                  <button className="shrink-0 text-sm font-semibold text-rose-500" onClick={() => removeItem(item.productId)}>Удалить</button>
                </div>
              </article>
            ))}
          </div>
          <aside className="summary-card h-fit xl:sticky xl:top-28">
            <h2 className="text-[28px] font-heading font-bold text-slate-950 sm:text-[30px]">{t("checkoutTitle")}</h2>
            <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
              <span>Товаров</span>
              <span>{items.length}</span>
            </div>
            <div className="mt-4 flex items-end justify-between gap-4 text-slate-950">
              <span className="text-lg font-bold">{t("total")}</span>
              <span className="text-[26px] font-extrabold leading-none sm:text-[32px]">{formatPrice(totalPrice)}</span>
            </div>
            <button className="primary-button mt-8 h-14 w-full justify-center px-6 py-4 text-base" onClick={() => navigate("/checkout")}>{t("checkoutTitle")}</button>
          </aside>
        </div>
      )}
    </div>
  );
}
