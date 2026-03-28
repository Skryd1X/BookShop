import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { api, resolveMediaUrl } from "@/api/client";
import { formatPrice } from "@/lib/market";
import { useI18n } from "@/lib/i18n";
import type { SearchSuggestion } from "@/types/store";

interface SearchSuggestProps {
  className?: string;
  large?: boolean;
  compact?: boolean;
}

export function SearchSuggest({ className = "", large = false, compact = false }: SearchSuggestProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const data = await api.getSearchSuggestions(query.trim());
        setSuggestions(data);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [query]);

  const shellClass = useMemo(() => {
    if (large) {
      return "min-h-[78px] rounded-[24px] px-5 py-4";
    }
    if (compact) {
      return "min-h-[56px] rounded-[20px] px-4 py-2.5";
    }
    return "min-h-[62px] rounded-[22px] px-4 py-3";
  }, [large, compact]);

  const buttonClass = compact
    ? "px-5 py-3 text-sm"
    : large
      ? "px-6 py-3.5 text-base"
      : "px-5 py-3 text-sm";

  const submitSearch = () => {
    navigate(`/catalog${query ? `?search=${encodeURIComponent(query)}` : ""}`);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`glass-panel flex items-center gap-3 ${shellClass}`}>
        <Search className="h-5 w-5 shrink-0 text-primary/75" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 160)}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitSearch();
            }
          }}
          placeholder={t("searchPlaceholder")}
          className={`min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-violet-300 ${large ? "text-base md:text-lg" : "text-sm md:text-base"}`}
        />
        <button type="button" onClick={submitSearch} className={`primary-button justify-center whitespace-nowrap ${buttonClass}`}>
          {t("searchButton")}
        </button>
      </div>

      {open && suggestions.length > 0 ? (
        <div className="glass-panel absolute left-0 right-0 top-[calc(100%+0.8rem)] z-30 overflow-hidden rounded-[26px] p-2 shadow-[0_24px_56px_rgba(95,45,255,0.14)]">
          <div className="max-h-[360px] overflow-y-auto">
            {suggestions.map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.slug}`}
                className="flex items-center gap-3 rounded-[18px] px-3 py-3 transition hover:bg-white"
              >
                <div className="flex h-14 w-11 items-center justify-center overflow-hidden rounded-[16px] bg-violet-50 text-xs font-semibold text-primary">
                  {item.image ? <img src={resolveMediaUrl(item.image)} alt={item.title} className="h-full w-full object-cover" /> : item.title.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-slate-900">{item.title}</div>
                  <div className="truncate text-sm text-primary/80">{item.author}</div>
                </div>
                <div className="text-right text-[15px] font-extrabold text-primary">{formatPrice(item.price)}</div>
              </Link>
            ))}
          </div>
          <Link
            to={`/catalog${query ? `?search=${encodeURIComponent(query)}` : ""}`}
            className="mt-2 flex justify-center rounded-[18px] px-4 py-3 text-sm font-semibold text-primary transition hover:bg-violet-50"
          >
            {t("searchButton")} “{query}” →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
