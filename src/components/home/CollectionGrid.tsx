import { Link } from "react-router-dom";
import { SectionHeading } from "@/components/common/SectionHeading";
import { useI18n } from "@/lib/i18n";
import type { CollectionItem } from "@/types/store";

const collectionFallbacks = [
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
];

export function CollectionGrid({ collections }: { collections: CollectionItem[] }) {
  const { pick, t } = useI18n();

  if (!collections?.length) return null;

  return (
    <section className="section-space bg-[linear-gradient(180deg,#faf9fd_0%,#ffffff_100%)]">
      <div className="container-tight">
        <SectionHeading title={t("collectionsTitle")} subtitle={t("collectionsSubtitle")} actionLabel="Все подборки" actionTo="/collections" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {collections.map((collection, index) => (
            <Link key={collection.id} to={`/collections?slug=${collection.slug}`} className="collection-card group" style={{ background: collection.accent }}>
              <div>
                <span className="pill-badge inline-flex bg-white text-primary">{pick(collection.subtitle)}</span>
                <h3 className="mt-4 text-[28px] font-heading font-extrabold text-slate-950">{pick(collection.title)}</h3>
                <p className="mt-3 max-w-xs text-sm leading-7 text-slate-600">{pick(collection.description)}</p>
              </div>
              <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-[24px] border border-white/70 bg-white/75">
                <img src={collection.image || collectionFallbacks[index % collectionFallbacks.length]} alt={pick(collection.title)} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/10 to-transparent" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
