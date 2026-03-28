import { SectionHeading } from "@/components/common/SectionHeading";
import { useI18n } from "@/lib/i18n";
import type { Author } from "@/types/store";

export function AuthorStrip({ authors }: { authors: Author[] }) {
  const { t } = useI18n();

  return (
    <section className="section-space bg-white">
      <div className="container-tight">
        <SectionHeading title={t("authorsTitle")} subtitle={t("authorsSubtitle")} actionLabel="Все авторы" actionTo="/catalog" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
          {authors.map((author) => (
            <div key={author.id} className="author-card">
              <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border-4 border-violet-100 bg-white shadow-sm">
                <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" />
              </div>
              <h3 className="mt-4 text-center text-lg font-heading font-bold text-slate-950">{author.name}</h3>
              <p className="mt-1 text-center text-sm text-slate-400">{author.booksCount} книг</p>
              <p className="mt-1 text-center text-sm font-medium text-primary">{author.country}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
