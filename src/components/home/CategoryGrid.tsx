import { Link } from "react-router-dom";
import { SectionHeading } from "@/components/common/SectionHeading";
import { useI18n } from "@/lib/i18n";
import type { Category } from "@/types/store";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const { pick, t } = useI18n();

  if (!categories?.length) return null;

  return (
    <section className="section-space bg-white/55">
      <div className="container-tight">
        <SectionHeading title={t("categoriesTitle")} subtitle={t("categoriesSubtitle")} actionLabel={t("allCategories")} actionTo="/catalog" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} to={`/catalog?category=${category.slug}`} className="category-card group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/80 bg-[linear-gradient(135deg,#f7f3ff_0%,#fff_100%)] text-2xl shadow-[0_12px_26px_rgba(95,45,255,0.08)]">
                  {category.icon}
                </div>
                <span className="mt-1 rounded-full border border-violet-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80 transition group-hover:border-primary/30">Раздел</span>
              </div>
              <div>
                <h3 className="text-[22px] font-heading font-bold text-slate-950">{pick(category.name)}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{pick(category.description)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
