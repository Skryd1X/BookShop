import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, PencilLine, Save } from "lucide-react";
import { Navigate } from "react-router-dom";
import { api, resolveMediaUrl } from "@/api/client";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/market";
import { useI18n } from "@/lib/i18n";
import type { Category, Order, Product, Review } from "@/types/store";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  createdAt: string;
  favoriteCount: number;
  ordersCount: number;
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const { t, pick } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [overview, setOverview] = useState<{ products: number; hiddenProducts: number; orders: number; users: number; billzEnabled: boolean } | null>(null);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({ title: "", author: "", price: "89000", categorySlug: "fiction" });
  const [categoryDraft, setCategoryDraft] = useState({ name: "", description: "", icon: "📘" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Record<string, Partial<Product>>>({});

  const load = async () => {
    const [nextProducts, nextOrders, nextOverview, nextCategories, nextUsers, nextReviews] = await Promise.all([
      api.getAdminProducts(),
      api.getAdminOrders(),
      api.getAdminOverview(),
      api.getAdminCategories(),
      api.getAdminUsers(),
      api.getAdminReviews(),
    ]);
    setProducts(nextProducts);
    setOrders(nextOrders);
    setOverview(nextOverview);
    setCategories(nextCategories);
    setUsers(nextUsers);
    setReviews(nextReviews.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()));
    setEditor((prev) => {
      const next = { ...prev };
      for (const product of nextProducts) {
        next[product.id] = next[product.id] || { ...product };
      }
      return next;
    });
  };

  useEffect(() => {
    if (user?.role === "admin") {
      load().catch(() => undefined);
    }
  }, [user]);

  if (!loading && (!user || user.role !== "admin")) {
    return <Navigate to="/auth" replace />;
  }

  if (!user) {
    return <div className="container-tight py-20 text-slate-500">Loading admin panel...</div>;
  }

  const createProduct = async () => {
    await api.createAdminProduct({
      title: draft.title,
      author: draft.author,
      price: Number(draft.price),
      categorySlug: draft.categorySlug,
      categoryName: categories.find((item) => item.slug === draft.categorySlug)?.name?.ru || draft.categorySlug,
      language: "Русский",
      publisher: "BOOKSHOP Studio",
      isbn: `LOCAL-${Date.now()}`,
      coverType: "Твёрдый переплёт",
      pages: 240,
      year: new Date().getFullYear(),
      description: "Локально добавленный товар из админки.",
      images: [],
    });
    setDraft({ title: "", author: "", price: "89000", categorySlug: categories[0]?.slug || "fiction" });
    await load();
    setMessage("Новый товар создан.");
  };

  const uploadFile = async (productId: string, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await api.uploadProductImage(productId, { fileName: file.name, dataUrl: String(reader.result) });
      await load();
      setMessage("Фото товара загружено и сохранено в базе.");
    };
    reader.readAsDataURL(file);
  };

  const isRecent = (product: Product) => {
    if (!product.createdAt) return false;
    return Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 5;
  };

  const saveProduct = async (productId: string) => {
    const payload = editor[productId];
    if (!payload) return;
    await api.updateAdminProduct(productId, {
      ...payload,
      price: Number(payload.price || 0),
      oldPrice: payload.oldPrice ? Number(payload.oldPrice) : null,
      stock: Number(payload.stock || 0),
      pages: Number(payload.pages || 0),
      year: Number(payload.year || 0),
      featured: {
        bestseller: Boolean(payload.featured?.bestseller),
        newArrival: Boolean(payload.featured?.newArrival),
        collectionSlugs: payload.featured?.collectionSlugs || [],
      },
    });
    setMessage("Карточка товара обновлена.");
    await load();
  };

  const statCards = useMemo(
    () => [
      ["Товаров", overview?.products || 0],
      ["Скрыто", overview?.hiddenProducts || 0],
      ["Заказов", overview?.orders || 0],
      ["Пользователей", overview?.users || 0],
      ["BILLZ", overview?.billzEnabled ? "ON" : "OFF"],
    ],
    [overview],
  );

  return (
    <div className="container-tight py-8 md:py-10">
      <span className="pill-badge inline-flex">✦ ADMIN CONTROL</span>
      <h1 className="mt-4 text-[42px] font-heading font-extrabold text-slate-950 md:text-[52px]">{t("adminTitle")}</h1>
      <p className="mt-3 max-w-3xl text-base leading-8 text-slate-500 md:text-lg">{t("adminSubtitle")}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map(([label, value]) => (
          <div key={String(label)} className="spec-card">
            <span className="text-sm uppercase tracking-[0.16em] text-slate-400">{label}</span>
            <strong className="mt-2 block text-3xl font-extrabold text-slate-950">{String(value)}</strong>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button className="primary-button px-5 py-3" onClick={async () => { const response = await api.syncBillz(); setMessage(response.message); await load(); }}>{t("adminSync")}</button>
        {message ? <div className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-medium text-primary">{message}</div> : null}
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[30px] border border-violet-100 bg-white p-6 shadow-[0_22px_56px_rgba(95,45,255,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-heading font-bold text-slate-950">Товары</h2>
            <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-primary">{products.length} шт.</div>
          </div>
          <div className="mt-6 space-y-4">
            {products.map((product) => (
              <article key={product.id} className="rounded-[24px] border border-violet-100 px-5 py-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="h-24 w-[72px] shrink-0 overflow-hidden rounded-[18px] bg-violet-50">
                      {product.images?.[0] ? <img src={resolveMediaUrl(product.images[0])} alt={product.title} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-primary">{product.author}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xl font-heading font-bold text-slate-950">
                        <span className="line-clamp-2">{product.title}</span>
                        {isRecent(product) ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">new</span> : null}
                        {product.source === "billz" ? <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">billz</span> : null}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">{product.categoryName} · {formatPrice(product.price)} · {product.stock} шт.</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button className="secondary-button px-4 py-3 text-sm" onClick={() => setEditingId((current) => current === product.id ? null : product.id)}>
                      {editingId === product.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      Редактировать
                    </button>
                    <button className="secondary-button px-4 py-3 text-sm" onClick={async () => { await api.updateAdminProduct(product.id, { published: !product.published }); await load(); }}>{product.published ? t("adminHidden") : t("adminVisible")}</button>
                    <label className="secondary-button cursor-pointer px-4 py-3 text-sm">
                      {t("adminUploadImage")}
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => uploadFile(product.id, event.target.files?.[0] || null)} />
                    </label>
                    <button className="secondary-button px-4 py-3 text-sm" onClick={async () => { await api.deleteAdminProduct(product.id); await load(); }}>Удалить</button>
                  </div>
                </div>

                {editingId === product.id ? (
                  <div className="mt-5 grid gap-4 border-t border-violet-100 pt-5 md:grid-cols-2">
                    <label className="field-shell"><span>Название</span><input value={String(editor[product.id]?.title ?? product.title)} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], title: e.target.value } }))} /></label>
                    <label className="field-shell"><span>Автор</span><input value={String(editor[product.id]?.author ?? product.author)} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], author: e.target.value } }))} /></label>
                    <label className="field-shell"><span>Цена</span><input value={String(editor[product.id]?.price ?? product.price)} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], price: Number(e.target.value || 0) } }))} /></label>
                    <label className="field-shell"><span>Старая цена</span><input value={String(editor[product.id]?.oldPrice ?? product.oldPrice ?? "")} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], oldPrice: e.target.value ? Number(e.target.value) : null } }))} /></label>
                    <label className="field-shell"><span>Остаток</span><input value={String(editor[product.id]?.stock ?? product.stock)} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], stock: Number(e.target.value || 0), inStock: Number(e.target.value || 0) > 0 } }))} /></label>
                    <label className="field-shell"><span>Категория</span><select value={String(editor[product.id]?.categorySlug ?? product.categorySlug)} onChange={(e) => { const slug = e.target.value; const category = categories.find((item) => item.slug === slug); setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], categorySlug: slug, categoryName: category ? pick(category.name) : slug } })); }}>{categories.map((category) => <option key={category.id} value={category.slug}>{pick(category.name)}</option>)}</select></label>
                    <label className="field-shell"><span>Язык</span><input value={String(editor[product.id]?.language ?? product.language)} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], language: e.target.value } }))} /></label>
                    <label className="field-shell"><span>Издательство</span><input value={String(editor[product.id]?.publisher ?? product.publisher)} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], publisher: e.target.value } }))} /></label>
                    <label className="field-shell"><span>ISBN</span><input value={String(editor[product.id]?.isbn ?? product.isbn)} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], isbn: e.target.value } }))} /></label>
                    <label className="field-shell"><span>Переплёт</span><input value={String(editor[product.id]?.coverType ?? product.coverType)} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], coverType: e.target.value } }))} /></label>
                    <label className="field-shell"><span>Страницы</span><input value={String(editor[product.id]?.pages ?? product.pages)} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], pages: Number(e.target.value || 0) } }))} /></label>
                    <label className="field-shell"><span>Год</span><input value={String(editor[product.id]?.year ?? product.year)} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], year: Number(e.target.value || 0) } }))} /></label>
                    <label className="field-shell md:col-span-2"><span>Краткое описание</span><input value={String(editor[product.id]?.summary ?? product.summary ?? "")} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], summary: e.target.value } }))} /></label>
                    <label className="field-shell md:col-span-2"><span>Полное описание</span><textarea value={String(editor[product.id]?.description ?? product.description)} onChange={(e) => setEditor((prev) => ({ ...prev, [product.id]: { ...prev[product.id], description: e.target.value } }))} /></label>
                    <div className="md:col-span-2 flex flex-wrap gap-3">
                      <button className="secondary-button px-4 py-3 text-sm" onClick={() => setEditor((prev) => ({ ...prev, [product.id]: { ...product } }))}><PencilLine className="h-4 w-4" /> Сбросить</button>
                      <button className="primary-button px-5 py-3 text-sm" onClick={() => saveProduct(product.id)}><Save className="h-4 w-4" /> Сохранить поля</button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <div className="space-y-8">
          <section className="rounded-[30px] border border-violet-100 bg-white p-6 shadow-[0_22px_56px_rgba(95,45,255,0.06)]">
            <h2 className="text-2xl font-heading font-bold text-slate-950">{t("adminCreate")}</h2>
            <div className="mt-5 grid gap-4">
              <label className="field-shell"><span>Название</span><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
              <label className="field-shell"><span>Автор</span><input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} /></label>
              <label className="field-shell"><span>Цена</span><input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></label>
              <label className="field-shell"><span>Категория</span>
                <select value={draft.categorySlug} onChange={(e) => setDraft({ ...draft, categorySlug: e.target.value })}>
                  {categories.map((category) => <option key={category.id} value={category.slug}>{pick(category.name)}</option>)}
                </select>
              </label>
              <button className="primary-button justify-center px-5 py-4" onClick={createProduct}>{t("adminCreate")}</button>
            </div>
          </section>

          <section className="rounded-[30px] border border-violet-100 bg-white p-6 shadow-[0_22px_56px_rgba(95,45,255,0.06)]">
            <h2 className="text-2xl font-heading font-bold text-slate-950">Категории</h2>
            <div className="mt-5 grid gap-4">
              <label className="field-shell"><span>Название категории</span><input value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })} /></label>
              <label className="field-shell"><span>Описание</span><input value={categoryDraft.description} onChange={(e) => setCategoryDraft({ ...categoryDraft, description: e.target.value })} /></label>
              <label className="field-shell"><span>Иконка</span><input value={categoryDraft.icon} onChange={(e) => setCategoryDraft({ ...categoryDraft, icon: e.target.value })} /></label>
              <button className="primary-button justify-center px-5 py-4" onClick={async () => {
                await api.createAdminCategory(categoryDraft as unknown as Partial<Category> & { name?: string; description?: string });
                setCategoryDraft({ name: "", description: "", icon: "📘" });
                await load();
              }}>Добавить категорию</button>
            </div>
            <div className="mt-6 space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="rounded-[22px] border border-violet-100 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">{category.icon} {pick(category.name)}</div>
                      <div className="text-sm text-slate-400">{pick(category.description)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="secondary-button px-4 py-2 text-sm" onClick={async () => {
                        const nextName = window.prompt("Новое название категории", pick(category.name));
                        if (!nextName) return;
                        await api.updateAdminCategory(category.id, { name: nextName, description: pick(category.description), icon: category.icon });
                        await load();
                      }}>Переименовать</button>
                      <button className="secondary-button px-4 py-2 text-sm" onClick={async () => { await api.deleteAdminCategory(category.id); await load(); }}>Удалить</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[30px] border border-violet-100 bg-white p-6 shadow-[0_22px_56px_rgba(95,45,255,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-heading font-bold text-slate-950">Пользователи</h2>
            <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-primary">{users.length} шт.</div>
          </div>
          <div className="mt-6 space-y-4">
            {users.map((item) => (
              <article key={item.id} className="rounded-[22px] border border-violet-100 px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-slate-950">{item.firstName || item.email.split("@")[0]} {item.lastName}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.email}</div>
                    <div className="mt-1 text-xs text-slate-400">{item.city || "Город не указан"} · заказов: {item.ordersCount} · избранное: {item.favoriteCount}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="secondary-button px-4 py-2 text-sm" onClick={async () => {
                      await api.updateAdminUser(item.id, { role: item.role === "admin" ? "customer" : "admin" });
                      await load();
                    }}>{item.role === "admin" ? "Сделать customer" : "Сделать admin"}</button>
                    <button className="secondary-button px-4 py-2 text-sm" onClick={async () => { await api.deleteAdminUser(item.id); await load(); }}>Удалить</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-violet-100 bg-white p-6 shadow-[0_22px_56px_rgba(95,45,255,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-heading font-bold text-slate-950">Отзывы</h2>
            <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-primary">{reviews.length} шт.</div>
          </div>
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-[22px] border border-violet-100 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">{review.productTitle || "Товар"}</div>
                    <div className="text-sm text-slate-500">{review.customerName} · {review.rating}/5</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${review.published === false ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-700"}`}>
                    {review.published === false ? "скрыт" : "виден"}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{review.text}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="secondary-button px-4 py-2 text-sm" onClick={async () => { await api.updateAdminReview(review.id, { published: review.published === false }); await load(); }}>{review.published === false ? "Показать" : "Скрыть"}</button>
                  <button className="secondary-button px-4 py-2 text-sm" onClick={async () => {
                    const nextText = window.prompt("Текст отзыва", review.text || "");
                    if (nextText === null) return;
                    await api.updateAdminReview(review.id, { text: nextText });
                    await load();
                  }}>Редактировать</button>
                  <button className="secondary-button px-4 py-2 text-sm" onClick={async () => { await api.deleteAdminReview(review.id); await load(); }}>Удалить</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-[30px] border border-violet-100 bg-white p-6 shadow-[0_22px_56px_rgba(95,45,255,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-heading font-bold text-slate-950">Заказы</h2>
          <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-primary">{orders.length} шт.</div>
        </div>
        <div className="mt-5 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-[22px] border border-violet-100 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong className="text-slate-950">{order.id}</strong>
                <span className="text-sm font-semibold text-primary">{order.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{order.customerName} · {order.phone}</p>
              <p className="mt-1 text-sm text-slate-500">{order.items.map((item) => `${item.title} × ${item.quantity}`).join(", ")}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
