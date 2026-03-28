import { Heart, Share2, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, resolveMediaUrl } from "@/api/client";
import heroBooks from "@/assets/hero-books.jpg";
import { BookCard } from "@/components/common/BookCard";
import { QuantityControl } from "@/components/common/QuantityControl";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/market";
import type { CatalogPayload, Product, Review } from "@/types/store";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/lib/auth";

function buildSafeDescription(product: Product) {
  const raw = `${product.description || ""} ${product.summary || ""}`.trim();
  if (raw && !/(billz|импорт|override|архитектур|env|client id|redirect uri|bookshop\.|каталоге bookshop)/i.test(raw)) {
    return raw;
  }

  return [
    `${product.title} — книга для спокойного, вдумчивого чтения и аккуратного размещения в домашней библиотеке или в качестве подарка.`,
    `${product.author || "Автор не указан"}. Издание подойдёт тем, кто ценит понятную подачу, хорошую тему и комфортный формат без лишнего информационного шума.`,
    `Если вам нужен похожий вариант по содержанию, формату или бюджету, менеджер BOOKSHOP поможет подобрать альтернативу и уточнить наличие.`,
  ].join(" ");
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<"description" | "specs" | "delivery">("description");
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([api.getProduct(slug), api.getProductReviews(slug).catch(() => [])])
      .then(async ([response, nextReviews]) => {
        setProduct(response);
        setReviews(nextReviews);
        setActiveImage(0);
        const catalog: CatalogPayload = await api.getCatalog(`?category=${response.categorySlug}`);
        setSimilar(catalog.products.filter((item) => item.slug !== response.slug).slice(0, 5));
      })
      .catch(() => {
        setProduct(null);
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const specs = useMemo(
    () =>
      product
        ? [
            [t("publisher"), product.publisher || "BOOKSHOP"],
            [t("isbn"), product.isbn || "—"],
            [t("language"), product.language || "Русский"],
            [t("year"), product.year ? String(product.year) : "—"],
            [t("pages"), product.pages ? String(product.pages) : "—"],
            [t("coverType"), product.coverType || "—"],
          ]
        : [],
    [product, t],
  );

  useEffect(() => {
    if (!actionMessage) return;
    const timer = window.setTimeout(() => setActionMessage(""), 2200);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  if (loading) {
    return <div className="container-tight py-20 text-slate-500">Загрузка товара...</div>;
  }

  if (!product) {
    return <div className="container-tight py-20 text-slate-500">{t("pageNotFound")}</div>;
  }

  const galleryImages = (product.images || [])
    .map((image) => resolveMediaUrl(image || ""))
    .filter(Boolean);
  const images = galleryImages.length ? galleryImages : [heroBooks];
  const activeImageSrc = images[Math.min(activeImage, images.length - 1)] || heroBooks;
  const favorite = isFavorite(product.id);
  const hasRealRating = Number(product.reviewsCount || 0) > 0 && Number(product.rating || 0) > 0;
  const safeDescription = buildSafeDescription(product);
  const shortSummary = product.summary && !/(billz|импорт|override|архитектур|каталоге bookshop)/i.test(product.summary)
    ? product.summary
    : safeDescription.split(".")[0] + ".";

  const submitReview = async () => {
    if (!slug) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      const created = await api.createProductReview(slug, { rating: reviewRating, text: reviewText });
      const nextReviews = [created, ...reviews.filter((item) => item.id !== created.id)];
      setReviews(nextReviews);
      setReviewText("");
      setReviewMessage("Отзыв сохранён. Спасибо за мнение о книге.");
      setProduct((current) =>
        current
          ? {
              ...current,
              rating: nextReviews.length ? Number((nextReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / nextReviews.length).toFixed(1)) : 0,
              reviewsCount: nextReviews.length,
            }
          : current,
      );
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : "Не удалось сохранить отзыв");
    }
  };

  const shareProduct = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, text: shortSummary, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
      setActionMessage("Ссылка на книгу готова.");
    } catch {
      setActionMessage("Не удалось поделиться ссылкой.");
    }
  };

  const toggleProductFavorite = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    await toggleFavorite(product);
    setActionMessage(favorite ? "Книга убрана из избранного." : "Книга добавлена в избранное.");
  };

  const addCurrentToCart = (count = quantity) => {
    for (let index = 0; index < count; index += 1) {
      addItem({
        productId: product.id,
        slug: product.slug,
        title: product.title,
        author: product.author,
        price: product.price,
        image: images[0] || heroBooks,
      });
    }
  };

  return (
    <div className="container-tight py-8 md:py-10 xl:py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-400 md:mb-8">
        <Link to="/">Главная</Link>
        <span>›</span>
        <Link to="/catalog">{t("catalogTitle")}</Link>
        <span>›</span>
        <Link to={`/catalog?category=${product.categorySlug}`}>{product.categoryName}</Link>
        <span>›</span>
        <span className="text-slate-700">{product.title}</span>
      </nav>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        <div className="space-y-5">
          <section className="summary-card p-4 md:p-5">
            <div className="grid gap-5 lg:grid-cols-[96px_minmax(0,1fr)]">
              {images.length > 1 ? (
                <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`overflow-hidden rounded-[18px] border bg-white p-2 shadow-[0_10px_24px_rgba(95,45,255,0.04)] transition-all duration-300 ease-out ${index === activeImage ? "border-primary ring-2 ring-primary/20" : "border-violet-100"}`}
                    >
                      <div className="h-[72px] w-[72px] overflow-hidden rounded-[14px] bg-[#faf9fd] lg:h-[78px] lg:w-[78px]">
                        <img src={image} alt={`${product.title} ${index + 1}`} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.src = heroBooks; }} />
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="order-1 lg:order-2">
                <div className="relative overflow-hidden rounded-[28px] border border-violet-100 bg-[#fbf9ff] p-4 md:p-6">
                  <div className="absolute right-4 top-4 z-10 flex flex-col gap-3">
                    <button type="button" className={`icon-button h-11 w-11 bg-white ${favorite ? "border-primary bg-violet-50 text-primary" : ""}`} onClick={toggleProductFavorite}>
                      <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
                    </button>
                    <button type="button" className="icon-button h-11 w-11 bg-white" onClick={shareProduct}>
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex min-h-[280px] items-center justify-center rounded-[24px] bg-white/86 p-2 md:min-h-[520px] md:p-6">
                    <img
                      src={activeImageSrc}
                      alt={product.title}
                      className="h-full max-h-[520px] w-full rounded-[20px] object-contain"
                      onError={(event) => {
                        event.currentTarget.src = heroBooks;
                      }}
                    />
                  </div>
                </div>
                {actionMessage ? <div className="mt-3 rounded-[18px] bg-violet-50 px-4 py-3 text-sm font-medium text-primary">{actionMessage}</div> : null}
              </div>
            </div>
          </section>

          <section className="summary-card p-4 md:p-6">
            <div className="flex flex-wrap gap-3">
              <button className={`tab-button ${tab === "description" ? "tab-button-active" : ""}`} onClick={() => setTab("description")}>{t("description")}</button>
              <button className={`tab-button ${tab === "specs" ? "tab-button-active" : ""}`} onClick={() => setTab("specs")}>{t("characteristics")}</button>
              <button className={`tab-button ${tab === "delivery" ? "tab-button-active" : ""}`} onClick={() => setTab("delivery")}>{t("deliveryAndPayment")}</button>
            </div>
            <div className="mt-6 rounded-[24px] border border-violet-100 bg-[#fcfbff] p-5 md:p-6">
              {tab === "description" ? <div className="text-base leading-8 text-slate-600">{safeDescription}</div> : null}
              {tab === "specs" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {specs.map(([label, value]) => (
                    <div key={label} className="spec-card">
                      <div className="text-sm uppercase tracking-[0.14em] text-slate-400">{label}</div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {tab === "delivery" ? (
                <div className="space-y-4 text-base leading-8 text-slate-600">
                  <p>По Ташкенту заказы доставляются после подтверждения менеджером. В другие регионы отправляем через Яндекс или BTS.</p>
                  <p>Стоимость доставки оплачивает покупатель отдельно и она не входит в сумму заказа. После оформления менеджер уточняет все детали и удобный способ получения.</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-[108px]">
          <section className="summary-card p-5 md:p-6">
            <div className="flex flex-wrap gap-2">
              <span className="pill-badge bg-violet-100 text-primary">{product.categoryName}</span>
              {product.featured?.bestseller ? <span className="pill-badge bg-amber-100 text-amber-700">Хит продаж</span> : null}
            </div>

            <h1 className="mt-5 text-[24px] font-heading font-extrabold leading-[1.06] tracking-tight text-slate-950 md:text-[30px] xl:text-[34px]">{product.title}</h1>
            <div className="mt-3 text-base font-medium text-primary md:text-lg">{product.author || "Не указан"}</div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {hasRealRating ? (
                <div className="flex items-center gap-1.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className={`h-4 w-4 ${index < Math.round(product.rating) ? "fill-current" : ""}`} />
                  ))}
                  <span className="ml-1 font-bold text-slate-900">{product.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({product.reviewsCount} отзывов)</span>
                </div>
              ) : (
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">Пока без оценок</span>
              )}
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">В наличии ({product.stock})</span>
            </div>

            <div className="mt-6 rounded-[24px] bg-violet-50/70 px-5 py-5">
              <div className="text-[34px] font-extrabold leading-tight text-slate-950 md:text-[40px]">{formatPrice(product.price)}</div>
              {product.oldPrice ? <div className="mt-2 text-lg text-slate-400 line-through">{formatPrice(product.oldPrice)}</div> : null}
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-500 md:text-base">{shortSummary}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <QuantityControl value={quantity} onChange={setQuantity} />
              <button className="primary-button h-12 min-w-[180px] flex-1 justify-center px-5" onClick={() => addCurrentToCart()}>{t("addToCart")}</button>
            </div>
            <Link to="/checkout" className="secondary-button mt-3 h-12 w-full justify-center px-5" onClick={() => addCurrentToCart(1)}>
              {t("buyNow")}
            </Link>
          </section>
        </aside>
      </div>

      <section className="mt-12 rounded-[32px] border border-violet-100 bg-white p-7 shadow-[0_18px_40px_rgba(95,45,255,0.05)] md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[30px] font-heading font-bold text-slate-950">Отзывы по книге</h2>
            <p className="mt-2 text-slate-500">Оставлять отзывы могут только зарегистрированные пользователи.</p>
          </div>
          <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-primary">{reviews.length} отзывов</div>
        </div>

        <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {reviews.length === 0 ? <div className="rounded-[24px] bg-violet-50 px-5 py-4 text-sm text-slate-500">Пока отзывов нет. Будьте первым, кто оставит мнение об этой книге.</div> : null}
            {reviews.map((review) => (
              <article key={review.id} className="rounded-[24px] border border-violet-100 px-5 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-950">{review.customerName}</div>
                    <div className="text-sm text-slate-400">{review.city} · {review.dateLabel}</div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-4 w-4 ${index < Number(review.rating || 0) ? "fill-current" : ""}`} />)}
                  </div>
                </div>
                <p className="mt-4 text-base leading-7 text-slate-600">{review.text}</p>
              </article>
            ))}
          </div>

          <div className="summary-card h-fit">
            <h3 className="text-2xl font-heading font-bold text-slate-950">Оставить отзыв</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{user ? "Ваш отзыв будет привязан к аккаунту и книге." : "Войдите в аккаунт, чтобы оценить товар и оставить отзыв."}</p>
            <div className="mt-5 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" className={`icon-button h-11 w-11 ${reviewRating === value ? "border-primary bg-violet-50 text-primary" : ""}`} onClick={() => setReviewRating(value)}>
                  {value}
                </button>
              ))}
            </div>
            <label className="field-shell mt-5">
              <span>Ваш отзыв</span>
              <textarea rows={5} value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="Поделитесь впечатлением о книге, качестве печати и подаче материала." />
            </label>
            <button className="primary-button mt-5 w-full justify-center px-5 py-4" onClick={submitReview}>
              {user ? "Сохранить отзыв" : "Войти и оставить отзыв"}
            </button>
            {reviewMessage ? <div className="mt-4 rounded-[18px] bg-violet-50 px-4 py-3 text-sm font-medium text-primary">{reviewMessage}</div> : null}
          </div>
        </div>
      </section>

      {similar.length > 0 ? (
        <section className="section-space">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[34px] font-heading font-bold text-slate-950">{t("similarBooks")}</h2>
            <Link to={`/catalog?category=${product.categorySlug}`} className="text-sm font-semibold text-primary">Смотреть все →</Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {similar.map((item) => <BookCard key={item.id} product={item} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
