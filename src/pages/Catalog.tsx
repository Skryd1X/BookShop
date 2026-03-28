import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { books, categories } from "@/data/books";
import { useI18n } from "@/lib/i18n";
import BookCard from "@/components/books/BookCard";

const sortOptions = [
  { value: "popularity", labelKey: "popularity" as const },
  { value: "newest", labelKey: "newest" as const },
  { value: "priceAsc", labelKey: "priceAsc" as const },
  { value: "priceDesc", labelKey: "priceDesc" as const },
  { value: "alphabetical", labelKey: "alphabetical" as const },
];

export default function Catalog() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState("popularity");
  const [searchQuery, setSearchQuery] = useState("");

  const initialFilter = searchParams.get("filter") || "";

  const filtered = useMemo(() => {
    let result = [...books];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.includes(q)
      );
    }

    if (selectedCategory) {
      result = result.filter((b) => b.category === selectedCategory);
    }

    if (initialFilter === "bestseller") result = result.filter((b) => b.isBestseller);
    if (initialFilter === "new") result = result.filter((b) => b.isNew);
    if (initialFilter === "discount") result = result.filter((b) => b.isDiscount);

    switch (sortBy) {
      case "priceAsc": result.sort((a, b) => a.price - b.price); break;
      case "priceDesc": result.sort((a, b) => b.price - a.price); break;
      case "newest": result.sort((a, b) => b.year - a.year); break;
      case "alphabetical": result.sort((a, b) => a.title.localeCompare(b.title)); break;
    }

    return result;
  }, [searchQuery, selectedCategory, sortBy, initialFilter]);

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-foreground mb-3">{t("category")}</h3>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory("")}
            className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
              !selectedCategory ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            Все категории
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-foreground mb-3">{t("language")}</h3>
        <div className="space-y-2">
          {["Русский", "Ўзбекча", "English"].map((lang) => (
            <label key={lang} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
              {lang}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-foreground mb-3">{t("availability")}</h3>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
          {t("inStock")}
        </label>
      </div>
    </div>
  );

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t("catalog")}</h1>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search")}
              className="w-full pl-4 pr-4 py-2 rounded-lg bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-secondary border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 hidden sm:block"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
            ))}
          </select>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-32 bg-card rounded-xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-4">{t("filters")}</h2>
            <FilterPanel />
          </div>
        </aside>

        {/* Mobile filters overlay */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-foreground/30" onClick={() => setFiltersOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-background p-6 overflow-y-auto animate-slide-right">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-foreground">{t("filters")}</h2>
                <button onClick={() => setFiltersOpen(false)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-4">
            Найдено: {filtered.length} книг
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg text-muted-foreground">Книги не найдены</p>
              <p className="text-sm text-muted-foreground mt-1">Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}