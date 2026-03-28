import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/client";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/market";
import { useAuth } from "@/lib/auth";
import type { PaymentMethodOption, PaymentSession } from "@/types/store";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { t } = useI18n();
  const { user } = useAuth();
  const [form, setForm] = useState({ fullName: "", phone: "+998 ", address: "", note: "", paymentMethod: "" });
  const [providers, setProviders] = useState<PaymentMethodOption[]>([]);
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getPaymentProviders().then((payload) => setProviders(payload.methods || [])).catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    setForm((prev) => ({
      ...prev,
      fullName: fullName || prev.fullName,
      phone: user.phone || prev.phone,
      address: user.addressLine || user.city || prev.address,
    }));
  }, [user]);

  useEffect(() => {
    if (!providers.length) return;
    setForm((prev) => ({ ...prev, paymentMethod: prev.paymentMethod || providers[0].code }));
  }, [providers]);

  const selectedProvider = useMemo(
    () => providers.find((item) => item.code === form.paymentMethod) || null,
    [providers, form.paymentMethod],
  );

  const createOrder = async () => {
    setSubmitting(true);
    try {
      const response = await api.createOrder({
        ...form,
        items: items.map((item) => ({ productId: item.productId, slug: item.slug, title: item.title, price: item.price, quantity: item.quantity })),
      });
      setSession(response);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось создать заказ.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToPayment = () => {
    if (!session?.payment.checkoutUrl) return;
    window.location.href = session.payment.checkoutUrl;
  };

  return (
    <div className="container-tight py-10 md:py-12">
      <h1 className="text-[38px] font-heading font-extrabold text-slate-950 md:text-[52px]">{t("checkoutTitle")}</h1>
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        <div className="rounded-[32px] border border-violet-100 bg-white p-5 shadow-[0_18px_40px_rgba(95,45,255,0.05)] md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-shell md:col-span-2"><span>{t("firstName")} и {t("lastName")}</span><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
            <label className="field-shell"><span>{t("phone")}</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="field-shell"><span>{t("address")}</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            <label className="field-shell md:col-span-2"><span>{t("note")}</span><textarea rows={4} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Способ оплаты</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {providers.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`rounded-[18px] border px-4 py-4 text-left text-sm font-semibold transition ${form.paymentMethod === item.code ? "border-primary bg-violet-50 text-primary shadow-[0_14px_28px_rgba(95,45,255,0.08)]" : "border-violet-100 bg-white text-slate-600 hover:border-primary/30 hover:text-primary"}`}
                  onClick={() => setForm((prev) => ({ ...prev, paymentMethod: item.code }))}
                >
                  <div>{item.title}</div>
                  <div className="mt-1 text-xs font-medium text-slate-400">{item.mode === "redirect" ? "Онлайн-оплата" : "Merchant API / webhook"}</div>
                </button>
              ))}
            </div>
          </div>

          <button className="primary-button mt-6 px-6 py-4" onClick={createOrder} disabled={submitting || !items.length || !selectedProvider}>
            {submitting ? "Создаём заказ..." : "Создать заказ"}
          </button>

          {session ? (
            <div className="mt-8 rounded-[28px] border border-violet-100 bg-[linear-gradient(135deg,#f5f0ff_0%,#ffffff_100%)] p-6 shadow-[0_20px_44px_rgba(95,45,255,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/75">Заказ #{session.orderNumber}</p>
              <p className="mt-3 text-[28px] font-extrabold text-slate-950">{formatPrice(session.amount)}</p>
              <p className="mt-3 text-sm leading-7 text-slate-500">Платёжный способ: <span className="font-semibold text-slate-900">{selectedProvider?.title || session.payment.provider}</span>.</p>
              {session.payment.checkoutUrl ? (
                <button className="primary-button mt-6 px-6 py-4" onClick={goToPayment}>Перейти к оплате</button>
              ) : (
                <div className="mt-5 rounded-[20px] border border-dashed border-violet-200 bg-white/80 px-4 py-4 text-sm leading-7 text-slate-500">{session.payment.instructions || "Платёжная сессия создана. После активации merchant-параметров откроется официальный платёжный сценарий."}</div>
              )}
              <p className="mt-5 text-xs leading-6 text-slate-400">После подтверждения оплаты провайдер сам отправит webhook на backend, а заказ автоматически уйдёт в Telegram-бот администраторам.</p>
            </div>
          ) : null}

          {message ? <p className="mt-4 rounded-[20px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{message}</p> : null}
        </div>

        <aside className="summary-card h-fit xl:sticky xl:top-28">
          <h2 className="text-[28px] font-heading font-bold text-slate-950 sm:text-[30px]">{t("total")}</h2>
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="flex items-start justify-between gap-4 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 font-semibold text-slate-900">{item.title}</div>
                  <div className="mt-1 text-slate-400">{item.quantity} × {formatPrice(item.price)}</div>
                </div>
                <div className="shrink-0 text-right font-semibold text-slate-900">{formatPrice(item.quantity * item.price)}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-violet-100 pt-6 text-[28px] font-extrabold leading-tight text-slate-950 sm:text-[34px]">{formatPrice(totalPrice)}</div>
        </aside>
      </div>
    </div>
  );
}
