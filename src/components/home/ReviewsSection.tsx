import { Star } from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { useI18n } from "@/lib/i18n";
import type { Review } from "@/types/store";

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const { t } = useI18n();

  return (
    <section className="section-space bg-[linear-gradient(180deg,#faf9fd_0%,#fff_100%)]">
      <div className="container-tight">
        <SectionHeading title={t("reviewsTitle")} subtitle={t("reviewsSubtitle")} />
        <div className="mb-10 flex flex-wrap items-center justify-center gap-3 text-amber-500">
          {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-5 w-5 fill-current" />)}
          <span className="text-lg font-bold text-slate-900">4.9 из 5</span>
          <span className="text-sm text-slate-400">· 12 847 отзывов</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {reviews.map((review) => (
            <article key={review.id} className="review-card">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-primary">
                  {review.customerName.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-950">{review.customerName}</h3>
                  <p className="text-sm text-slate-400">{review.city} · {review.dateLabel}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">“{review.text}”</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
