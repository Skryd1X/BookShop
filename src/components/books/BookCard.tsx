import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Book, formatPrice } from "@/data/books";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

interface Props {
  book: Book;
  index?: number;
}

export default function BookCard({ book, index = 0 }: Props) {
  const { t } = useI18n();
  const { addItem } = useCart();

  return (
    <div
      className="group relative bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {book.isNew && (
          <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide">
            New
          </span>
        )}
        {book.isDiscount && book.oldPrice && (
          <span className="px-2.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
            -{Math.round((1 - book.price / book.oldPrice) * 100)}%
          </span>
        )}
        {book.isBestseller && (
          <span className="px-2.5 py-0.5 rounded-full bg-foreground text-background text-[10px] font-bold uppercase tracking-wide">
            Hit
          </span>
        )}
      </div>

      {/* Favorite */}
      <button className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary hover:text-primary-foreground active:scale-95">
        <Heart className="w-4 h-4" />
      </button>

      {/* Image */}
      <Link to={`/product/${book.id}`} className="block aspect-[3/4] overflow-hidden bg-secondary">
        <img
          src={book.image}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link to={`/product/${book.id}`}>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">{book.author}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <Star className="w-3.5 h-3.5 fill-primary text-primary" />
          <span className="text-xs font-medium text-foreground">{book.rating}</span>
        </div>

        {/* Price + Cart */}
        <div className="flex items-end justify-between mt-3">
          <div>
            <div className="text-base font-bold text-foreground">{formatPrice(book.price)}</div>
            {book.oldPrice && (
              <div className="text-xs text-muted-foreground line-through">{formatPrice(book.oldPrice)}</div>
            )}
          </div>
          <button
            onClick={() =>
              addItem({
                id: book.id,
                title: book.title,
                author: book.author,
                price: book.price,
                oldPrice: book.oldPrice,
                image: book.image,
              })
            }
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors active:scale-95"
            title={t("addToCart")}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}