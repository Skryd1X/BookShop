import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { ProductRail } from "@/components/common/ProductRail";
import { AuthorStrip } from "@/components/home/AuthorStrip";
import { CollectionGrid } from "@/components/home/CollectionGrid";
import { HeroSection } from "@/components/home/HeroSection";
import { PromoStrip } from "@/components/home/PromoStrip";
import { useI18n } from "@/lib/i18n";
import type { HomePayload } from "@/types/store";

export default function HomePage() {
  const { t } = useI18n();
  const [data, setData] = useState<HomePayload | null>(null);

  useEffect(() => {
    api.getHome().then(setData).catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="container-tight py-14 md:py-20">
        <div className="glass-panel rounded-[28px] px-6 py-10 text-center shadow-[0_22px_46px_rgba(95,45,255,0.08)] md:px-10 md:py-14">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-violet-100" />
          <h1 className="mt-5 text-2xl font-heading font-bold text-slate-950">BOOKSHOP загружается</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 md:text-base">
            Витрина получает данные напрямую из каталога и собирает главную страницу без ручных заглушек в карточках.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeroSection featuredSearch={data.featuredSearch} stats={data.heroStats} />
      <PromoStrip />
      <ProductRail badge="✦ Подборка витрины" title={t("bestsellersTitle")} subtitle={t("bestsellersSubtitle")} products={data.bestsellers} />
      <ProductRail badge="✦ Рекомендуем сегодня" title={t("newArrivalsTitle")} subtitle={t("newArrivalsSubtitle")} products={data.newArrivals} />
      <CollectionGrid collections={data.collections} />
      {data.authors?.length ? <AuthorStrip authors={data.authors} /> : null}
    </div>
  );
}
