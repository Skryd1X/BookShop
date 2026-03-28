import { Navigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { BookCard } from "@/components/common/BookCard";
import { useI18n } from "@/lib/i18n";

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const { items, loading: favLoading } = useFavorites();
  const { t } = useI18n();

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!user) {
    return <div className="container-tight py-16 text-slate-500">Loading...</div>;
  }

  return (
    <div className="container-tight py-8 md:py-10">
      <span className="pill-badge inline-flex">✦ BOOKSHOP SAVE</span>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[42px] font-heading font-extrabold text-slate-950 md:text-[52px]">{t("favorites")}</h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-slate-500">Ваши сохранённые книги. Всё хранится в аккаунте и не теряется после перезагрузки.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-primary">
          <Heart className="h-4 w-4" /> {items.length} шт.
        </div>
      </div>

      {favLoading ? <div className="summary-card mt-8 text-slate-500">Загружаем избранное...</div> : null}

      {!favLoading && items.length === 0 ? (
        <div className="empty-state mt-8">
          <h2 className="text-2xl font-heading font-bold text-slate-950">Пока пусто</h2>
          <p className="mt-3 text-base leading-7 text-slate-500">Добавляйте книги через сердечко на карточке товара или в каталоге.</p>
        </div>
      ) : null}

      {items.length > 0 ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((product) => <BookCard key={product.id} product={product} />)}</div> : null}
    </div>
  );
}
