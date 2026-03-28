import { Gift, Heart, LogOut, MapPin, Package, Pencil, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api } from "@/api/client";
import type { Order } from "@/types/store";
import { useFavorites } from "@/lib/favorites";
import { BookCard } from "@/components/common/BookCard";

export default function ProfilePage() {
  const { user, loading, logout, refreshProfile } = useAuth();
  const { t } = useI18n();
  const { items: favorites, loading: favoritesLoading } = useFavorites();
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<{ firstName: string; lastName: string; email: string; phone: string; city: string; addressLine: string; birthDate: string; gender: "male" | "female" | "" }>({ firstName: "", lastName: "", email: "", phone: "", city: "", addressLine: "", birthDate: "", gender: "male" });

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      city: user.city || "",
      addressLine: user.addressLine || "",
      birthDate: user.birthDate || "",
      gender: user.gender || "male",
    });
    api.getMyOrders().then(setOrders).catch(() => setOrders([]));
  }, [user]);

  const menu = useMemo(
    () => [
      { label: t("profileTitle"), icon: UserRound, href: "#profile" },
      { label: t("orderHistory"), icon: Package, href: "#orders" },
      { label: t("favorites"), icon: Heart, href: "#favorites" },
      { label: t("addresses"), icon: MapPin, href: "#profile" },
      { label: t("bonuses"), icon: Gift, href: "#profile" },
    ],
    [t],
  );

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!user) {
    return <div className="container-tight py-20 text-slate-500">Loading profile...</div>;
  }

  return (
    <div className="container-tight py-10 md:py-12">
      <h1 className="text-[52px] font-heading font-extrabold text-slate-950">{t("profileTitle")}</h1>
      <div className="mt-10 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-[30px] border border-violet-100 bg-white p-7 shadow-[0_18px_40px_rgba(95,45,255,0.05)]">
            {user.avatar ? (
              <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-violet-100">
                <img src={user.avatar} alt={profileName(user)} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-violet-100 text-3xl font-heading font-extrabold text-primary">{(user.firstName || user.email).slice(0, 1).toUpperCase()}</div>
            )}
            <h2 className="mt-5 text-center text-[28px] font-heading font-bold text-slate-950">{profileName(user)}</h2>
            <p className="mt-1 text-center text-sm text-slate-400">{user.email}</p>
            <p className="mt-4 text-center text-sm font-medium text-emerald-600">● {user.role === "admin" ? "Администратор" : "Покупатель"}</p>
          </div>

          <div className="rounded-[30px] border border-violet-100 bg-white p-3 shadow-[0_18px_40px_rgba(95,45,255,0.05)]">
            {menu.map((item) => (
              <a key={item.label} href={item.href} className="flex items-center gap-3 rounded-[20px] px-4 py-4 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-primary">
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            ))}
            <button className="mt-2 flex w-full items-center gap-3 rounded-[20px] px-4 py-4 text-left text-sm font-semibold text-rose-500" onClick={logout}>
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </button>
          </div>
        </aside>

        <div className="space-y-8">
          <section id="profile" className="rounded-[32px] border border-violet-100 bg-white p-7 shadow-[0_18px_40px_rgba(95,45,255,0.05)] md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-[30px] font-heading font-bold text-slate-950">Личные данные</h2>
              <button className="secondary-button px-5 py-3" onClick={async () => { await api.updateProfile(form); await refreshProfile(); }}>
                <Pencil className="h-4 w-4" />
                Сохранить профиль
              </button>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <label className="field-shell"><span>{t("firstName")}</span><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
              <label className="field-shell"><span>{t("lastName")}</span><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
              <label className="field-shell"><span>{t("email")}</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label className="field-shell"><span>{t("phone")}</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label className="field-shell"><span>{t("city")}</span><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
              <label className="field-shell"><span>Адрес</span><input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} /></label>
              <label className="field-shell"><span>{t("birthDate")}</span><input value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></label>
            </div>
            <div className="mt-5 flex gap-3">
              <button className={`tab-button ${form.gender === "male" ? "tab-button-active" : ""}`} onClick={() => setForm({ ...form, gender: "male" })}>{t("male")}</button>
              <button className={`tab-button ${form.gender === "female" ? "tab-button-active" : ""}`} onClick={() => setForm({ ...form, gender: "female" })}>{t("female")}</button>
            </div>
          </section>

          <section id="orders" className="rounded-[32px] border border-violet-100 bg-white p-7 shadow-[0_18px_40px_rgba(95,45,255,0.05)] md:p-8">
            <h2 className="text-[30px] font-heading font-bold text-slate-950">{t("orderHistory")}</h2>
            <div className="mt-6 space-y-4">
              {orders.length === 0 ? <div className="rounded-[24px] bg-violet-50 px-5 py-4 text-sm text-slate-500">Заказов пока нет.</div> : orders.map((order) => (
                <article key={order.id} className="rounded-[24px] border border-violet-100 px-5 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-900">Заказ {order.id}</div>
                      <div className="text-sm text-slate-400">{new Date(order.createdAt).toLocaleDateString("ru-RU")}</div>
                    </div>
                    <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-primary">{order.status}</div>
                  </div>
                  <div className="mt-4 text-sm leading-7 text-slate-500">{order.items.map((item) => `${item.title} × ${item.quantity}`).join(", ")}</div>
                </article>
              ))}
            </div>
          </section>

          <section id="favorites" className="rounded-[32px] border border-violet-100 bg-white p-7 shadow-[0_18px_40px_rgba(95,45,255,0.05)] md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-[30px] font-heading font-bold text-slate-950">{t("favorites")}</h2>
              <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-primary">{favorites.length} шт.</div>
            </div>
            {favoritesLoading ? <div className="mt-5 rounded-[24px] bg-violet-50 px-5 py-4 text-sm text-slate-500">Загружаем избранное...</div> : null}
            {!favoritesLoading && favorites.length === 0 ? <div className="mt-5 rounded-[24px] bg-violet-50 px-5 py-4 text-sm text-slate-500">Вы пока ничего не добавили в избранное.</div> : null}
            {favorites.length > 0 ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{favorites.map((product) => <BookCard key={product.id} product={product} />)}</div> : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function profileName(user: { firstName?: string; lastName?: string; email: string }) {
  const fallback = user.email.split("@")[0] || "Пользователь";
  const name = `${user.firstName || fallback} ${user.lastName || ""}`.trim();
  return name || user.email;
}
