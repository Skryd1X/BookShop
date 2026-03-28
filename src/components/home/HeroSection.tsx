import { resolveMediaUrl } from "@/api/client";
import { SearchSuggest } from "@/components/common/SearchSuggest";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/types/store";

interface HeroSectionProps {
  featuredSearch: Product[];
  stats: {
    catalogCount: string;
    delivery: string;
    rating: string;
  };
}

const fallbackPromo = {
  image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1400&q=80",
  title: "Визуально сильные книги для витрины и рекомендаций",
  text: "Премиальные подборки, понятная навигация и аккуратная подача без перегруза.",
};

export function HeroSection({ featuredSearch }: HeroSectionProps) {
  const { t } = useI18n();
  const chips = ["Бестселлеры", "Новинки", "Психология", "Классика", "Экономика", "Подарки"];

  const heroImage = featuredSearch[0]?.images?.[0]
    ? resolveMediaUrl(featuredSearch[0].images[0])
    : fallbackPromo.image;

  return (
    <section className="hero-shell">
      <div className="container-tight py-8 md:py-10 xl:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] lg:items-center">
          <div className="max-w-[660px]">
            <span className="pill-badge inline-flex">✦ {t("heroBadge")}</span>
            <h1 className="mt-5 text-[42px] font-heading font-extrabold leading-[0.96] text-slate-950 sm:text-[56px] xl:text-[74px]">
              {t("heroTitleLine1")}
              <br />
              <span className="text-gradient-brand">{t("heroTitleAccent")}</span>
            </h1>
            <p className="mt-5 max-w-[620px] text-base leading-8 text-slate-500 md:text-lg">
              {t("heroSubtitle")}
            </p>
            <SearchSuggest className="mt-7" large />
            <div className="mt-5 flex flex-wrap items-center gap-2.5 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{t("popular")}</span>
              {chips.map((chip) => (
                <span key={chip} className="rounded-full border border-violet-100 bg-white/92 px-3.5 py-2 text-sm shadow-[0_10px_20px_rgba(95,45,255,0.04)]">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-stage p-5 md:p-6">
            <article className="hero-ad-panel hero-ad-panel-large">
              <img src={heroImage} alt={fallbackPromo.title} className="hero-ad-image hero-ad-image-soft" />
              <div className="hero-ad-overlay hero-ad-overlay-strong" />
              <div className="hero-ad-glow" />
              <div className="hero-ad-copy hero-ad-copy-large">
                <span className="hero-ad-kicker">BOOKSHOP SELECT</span>
                <h3 className="hero-ad-title hero-ad-title-large">{fallbackPromo.title}</h3>
                <p className="hero-ad-text hero-ad-text-large">{fallbackPromo.text}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
