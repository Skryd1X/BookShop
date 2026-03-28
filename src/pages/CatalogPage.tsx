import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import { BookCard } from "@/components/common/BookCard";
import { SearchSuggest } from "@/components/common/SearchSuggest";
import { buildQuery, formatPrice } from "@/lib/market";
import { useI18n } from "@/lib/i18n";
import type { CatalogPayload } from "@/types/store";

export default function CatalogPage() {
  const { t, pick } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<CatalogPayload | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceFrom, setPriceFrom] = useState(searchParams.get("minPrice") || "");
  const [priceTo, setPriceTo] = useState(searchParams.get("maxPrice") || "");

  const category = searchParams.get("category") || "";
  const filter = searchParams.get("filter") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "popularity";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  useEffect(() => {
    setPriceFrom(minPrice);
    setPriceTo(maxPrice);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    api
      .getCatalog(buildQuery({ category, filter, search, sort, minPrice, maxPrice }))
      .then(setData)
      .catch(() => setData(null));
  }, [category, filter, search, sort, minPrice, maxPrice]);

  const categories = data?.categories || [];

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const updateParams = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  const applyPriceRange = () => {
    updateParams({ minPrice: priceFrom.trim(), maxPrice: priceTo.trim() });
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    next.set("sort", "popularity");
    setSearchParams(next);
  };

  const priceRangeText = useMemo(() => {
    if (!data?.products?.length) return null;
    const prices = data.products.map((item) => Number(item.price || 0)).filter((value) => value > 0);
    if (!prices.length) return null;
    return `${formatPrice(Math.min(...prices))} — ${formatPrice(Math.max(...prices))}`;
  }, [data]);

  const filterPanel = useMemo(
    () => (
      <div className="catalog-filters-scroll space-y-8">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">{t("category")}</h3>
          <div className="space-y-2.5">
            <button className={`filter-link ${!category ? "filter-link-active" : ""}`} onClick={() => updateParam("category", "")}>{t("allCategories")}</button>
            {categories.map((item) => (
              <button key={item.id} className={`filter-link ${category === item.slug ? "filter-link-active" : ""}`} onClick={() => updateParam("category", item.slug)}>
                {pick(item.name)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Цена</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="field-shell">
              <span>От</span>
              <input value={priceFrom} onChange={(e) => setPriceFrom(e.target.value.replace(/[^\d]/g, ""))} placeholder="0" />
            </label>
            <label className="field-shell">
              <span>До</span>
              <input value={priceTo} onChange={(e) => setPriceTo(e.target.value.replace(/[^\d]/g, ""))} placeholder="500000" />
            </label>
          </div>
          <div className="mt-2 text-xs text-slate-400">{priceRangeText || "Выберите диапазон"}</div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <button className="secondary-button justify-center px-4 py-3 text-sm" onClick={applyPriceRange}>Применить</button>
            <button className="secondary-button justify-center px-4 py-3 text-sm" onClick={() => { setPriceFrom(""); setPriceTo(""); updateParams({ minPrice: "", maxPrice: "" }); }}>Сбросить цену</button>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">{t("sortBy")}</h3>
          <div className="space-y-2.5">
            {[
              ["popularity", t("sortPopular")],
              ["least-popular", "Менее популярные"],
              ["new", t("sortNew")],
              ["price-asc", t("sortPriceAsc")],
              ["price-desc", t("sortPriceDesc")],
              ["alphabetical", t("sortAlphabetical")],
            ].map(([value, label]) => (
              <button key={value} className={`filter-link ${sort === value ? "filter-link-active" : ""}`} onClick={() => updateParam("sort", value)}>{label}</button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Формат</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button className={`filter-link ${filter === "bestseller" ? "filter-link-active" : ""}`} onClick={() => updateParam("filter", "bestseller")}>Бестселлеры</button>
            <button className={`filter-link ${filter === "new" ? "filter-link-active" : ""}`} onClick={() => updateParam("filter", "new")}>Новинки</button>
            <button className={`filter-link ${filter === "discount" ? "filter-link-active" : ""}`} onClick={() => updateParam("filter", "discount")}>Скидки</button>
            <button className="filter-link" onClick={clearAll}>{t("clearFilters")}</button>
          </div>
        </div>
      </div>
    ),
    [categories, category, filter, sort, t, pick, priceFrom, priceTo, priceRangeText],
  );

  return (
    <div className="container-tight py-8 md:py-10 xl:py-12">
      <div className="mb-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
        <div>
          <span className="pill-badge inline-flex">✦ Актуальный каталог</span>
          <h1 className="mt-4 text-[42px] font-heading font-extrabold tracking-tight text-slate-950 md:text-[56px]">{t("catalogTitle")}</h1>
          <p className="mt-3 text-base text-slate-500 md:text-lg">{t("foundBooks")}: {data?.total || 0}</p>
        </div>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1"><SearchSuggest compact /></div>
          <button className="secondary-button px-5 lg:hidden" onClick={() => setShowMobileFilters((prev) => !prev)}><SlidersHorizontal className="h-4 w-4" /> {t("filters")}</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="hidden h-fit rounded-[30px] border border-violet-100/80 bg-white/92 p-6 shadow-[0_18px_40px_rgba(95,45,255,0.05)] xl:sticky xl:top-[96px] xl:block">{filterPanel}</aside>
        <div>
          {showMobileFilters ? <div className="mb-6 rounded-[28px] border border-violet-100 bg-white p-5 xl:hidden">{filterPanel}</div> : null}
          {data?.products?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {data.products.map((product) => <BookCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="empty-state text-center text-slate-500">По выбранным фильтрам товары пока не найдены.</div>
          )}
        </div>
      </div>
    </div>
  );
}
