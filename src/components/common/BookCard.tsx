import { Heart, ShoppingCart, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Product } from "@/types/store";
import { resolveMediaUrl } from "@/api/client";
import { formatPrice } from "@/lib/market";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/lib/auth";

interface BookCardProps {
  product: Product;
}

export function BookCard({ product }: BookCardProps) {
  const { addItem } = useCart();
  const { t } = useI18n();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const favorite = isFavorite(product.id);
  const hasRealRating = Number(product.reviewsCount || 0) > 0 && Number(product.rating || 0) > 0;

  return (
    <article className="book-card group min-w-0">
      <div className="relative overflow-hidden rounded-[24px] border border-violet-100/80 bg-[linear-gradient(180deg,#fbf9ff_0%,#ffffff_100%)] p-3">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          {product.featured?.newArrival ? <span className="status-chip bg-emerald-100 text-emerald-700">Новинка</span> : null}
          {product.featured?.bestseller ? <span className="status-chip bg-amber-100 text-amber-700">Хит</span> : null}
          {product.oldPrice ? <span className="status-chip bg-rose-100 text-rose-700">-{Math.max(1, Math.round((1 - product.price / product.oldPrice) * 100))}%</span> : null}
        </div>
        <button
          type="button"
          className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/80 shadow-sm transition ${favorite ? "bg-primary text-white" : "bg-white/96 text-slate-400 hover:text-primary"}`}
          onClick={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!user) {
              navigate("/auth");
              return;
            }
            await toggleFavorite(product);
          }}
          aria-label="Добавить в избранное"
        >
          <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
        </button>
        <Link to={`/product/${product.slug}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#f7f2ff_0%,#ffffff_100%)]">
            {product.images?.[0] ? (
              <img src={resolveMediaUrl(product.images[0])} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-violet-50 text-5xl font-heading font-extrabold text-primary/50">{product.title.slice(0, 1)}</div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/5 to-transparent" />
          </div>
        </Link>
      </div>

      <div className="flex min-h-[316px] flex-1 flex-col gap-3 px-1 pb-1 pt-4">
        <div className="min-h-[104px] space-y-1.5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary/80">{product.categoryName || product.author || "Книги"}</div>
          <Link to={`/product/${product.slug}`} className="book-card-title block text-[17px] font-heading font-bold leading-[1.08] text-slate-950 transition hover:text-primary sm:text-[18px] xl:text-[19px]">
            {product.title}
          </Link>
          <p className="line-clamp-1 text-sm text-slate-500">{product.author || "Не указан"}</p>
        </div>

        <div className="flex min-h-[22px] items-center gap-2 text-sm text-slate-500">
          {hasRealRating ? (
            <>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold text-slate-700">{Number(product.rating).toFixed(1)}</span>
              </div>
              <span>({product.reviewsCount})</span>
            </>
          ) : (
            <span className="text-slate-400">Пока без оценок</span>
          )}
        </div>

        <div className="min-h-[62px]">
          <div className="text-[18px] font-extrabold leading-none text-slate-950 xl:text-[19px]">{formatPrice(product.price)}</div>
          {product.oldPrice ? (
            <div className="mt-1 text-sm text-slate-400 line-through">{formatPrice(product.oldPrice)}</div>
          ) : null}
          <div className="mt-1 text-xs font-medium text-emerald-700">В наличии: {product.stock}</div>
        </div>

        <div className="mt-auto grid grid-cols-[1fr_54px] items-stretch gap-2 pt-1">
          <Link to={`/product/${product.slug}`} className="secondary-button h-12 justify-center px-3 text-sm">
            {t("details")}
          </Link>
          <button
            className="primary-button h-12 justify-center px-0"
            onClick={() =>
              addItem({
                productId: product.id,
                slug: product.slug,
                title: product.title,
                author: product.author,
                price: product.price,
                image: resolveMediaUrl(product.images?.[0] || ""),
              })
            }
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
