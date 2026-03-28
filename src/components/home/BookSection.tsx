import { Link } from "react-router-dom";
import { books } from "@/data/books";
import { useI18n } from "@/lib/i18n";
import BookCard from "@/components/books/BookCard";

interface Props {
  title: string;
  filter: "bestseller" | "new" | "discount" | "all";
}

export default function BookSection({ title, filter }: Props) {
  const { t } = useI18n();

  const filtered = filter === "all"
    ? books.slice(0, 8)
    : books.filter((b) =>
        filter === "bestseller" ? b.isBestseller :
        filter === "new" ? b.isNew :
        b.isDiscount
      );

  return (
    <section className="container py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
        <Link to={`/catalog?filter=${filter}`} className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
          {t("seeAll")} →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.slice(0, 6).map((book, i) => (
          <BookCard key={book.id} book={book} index={i} />
        ))}
      </div>
    </section>
  );
}
