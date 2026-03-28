import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Heart, Star, ChevronRight, Check, X as XIcon } from "lucide-react";
import { books, formatPrice } from "@/data/books";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import BookCard from "@/components/books/BookCard";

export default function ProductDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const { addItem } = useCart();

  const book = books.find((b) => b.id === id);

  if (!book) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg text-muted-foreground">Книга не найдена</p>
        <Link to="/catalog" className="text-primary hover:text-primary-hover mt-4 inline-block">{t("goToCatalog")}</Link>
      </div>
    );
  }

  const similar = books.filter((b) => b.category === book.category && b.id !== book.id).slice(0, 4);

  const handleAddToCart = () => {
    addItem({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      oldPrice: book.oldPrice,
      image: book.image,
    });
  };

  const specs = [
    { label: t("author"), value: book.author },
    { label: t("publisher"), value: book.publisher },
    { label: t("isbn"), value: book.isbn },
    { label: t("language"), value: book.language },
    { label: t("coverType"), value: book.coverType },
    { label: t("pages"), value: String(book.pages) },
    { label: t("year"), value: String(book.year) },
  ];

  return (
    <div className="container py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/catalog" className="hover:text-primary transition-colors">{t("catalog")}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground">{book.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Image */}
        <div
          className="relative rounded-2xl overflow-hidden bg-secondary aspect-[3/4] max-h-[600px]"
          style={{ animation: "slide-in-left 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
          {book.isDiscount && book.oldPrice && (
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-sm font-bold">
              -{Math.round((1 - book.price / book.oldPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ animation: "slide-in-right 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">{book.title}</h1>
          <p className="text-muted-foreground mt-2">{book.author}</p>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(book.rating) ? "fill-primary text-primary" : "text-border"}`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">{book.rating}</span>
          </div>

          {/* Price */}
          <div className="mt-6 flex items-end gap-3">
            <span className="text-3xl font-bold text-foreground">{formatPrice(book.price)}</span>
            {book.oldPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(book.oldPrice)}</span>
            )}
          </div>

          {/* Availability */}
          <div className="mt-3 flex items-center gap-2">
            {book.inStock ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-600 font-medium">{t("inStock")}</span>
              </>
            ) : (
              <>
                <XIcon className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">{t("outOfStock")}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!book.inStock}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              {t("addToCart")}
            </button>
            <button className="px-4 py-3.5 rounded-xl border border-border hover:border-primary hover:text-primary transition-colors active:scale-[0.97]">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="font-semibold text-foreground mb-3">{t("description")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
          </div>

          {/* Specs */}
          <div className="mt-8">
            <h2 className="font-semibold text-foreground mb-3">{t("characteristics")}</h2>
            <div className="space-y-2">
              {specs.map((spec) => (
                <div key={spec.label} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{spec.label}</span>
                  <span className="text-sm font-medium text-foreground">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">{t("similarBooks")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {similar.map((b, i) => (
              <BookCard key={b.id} book={b} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
