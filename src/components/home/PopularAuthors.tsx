import { Link } from "react-router-dom";
import { popularAuthors } from "@/data/books";
import { useI18n } from "@/lib/i18n";

export default function PopularAuthors() {
  const { t } = useI18n();

  return (
    <section className="container py-12">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">
        {t("popularAuthors")}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {popularAuthors.map((author, i) => (
          <Link
            key={author.name}
            to={`/catalog?author=${encodeURIComponent(author.name)}`}
            className="shrink-0 flex flex-col items-center gap-3 p-5 rounded-xl bg-secondary border border-transparent hover:border-primary/20 transition-all duration-300 min-w-[140px] active:scale-[0.97]"
            style={{ animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both` }}
          >
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
              <span className="font-display text-lg font-bold text-primary">
                {author.name.charAt(0)}
              </span>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">{author.name}</div>
              <div className="text-xs text-muted-foreground">{author.booksCount} книг</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
