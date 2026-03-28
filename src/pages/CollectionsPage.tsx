import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import { BookCard } from "@/components/common/BookCard";
import { useI18n } from "@/lib/i18n";
import type { CollectionItem, Product } from "@/types/store";

export default function CollectionsPage() {
  const { t, pick } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.getCollections().then((items) => {
      setCollections(items);
      const slug = searchParams.get("slug") || items[0]?.slug;
      if (slug) {
        api.getCollection(slug).then((response) => setProducts(response.products)).catch(() => setProducts([]));
      }
    }).catch(() => setCollections([]));
  }, []);

  const activeSlug = searchParams.get("slug") || collections[0]?.slug;
  const activeCollection = useMemo(() => collections.find((item) => item.slug === activeSlug), [collections, activeSlug]);

  const openCollection = async (slug: string) => {
    setSearchParams({ slug });
    const response = await api.getCollection(slug);
    setProducts(response.products);
  };

  return (
    <div className="container-tight py-10">
      <h1 className="text-4xl font-heading font-extrabold text-slate-950">{t("collectionsPageTitle")}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-500">{t("collectionsPageSubtitle")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {collections.map((collection) => (
          <button key={collection.id} className={`tab-button ${activeSlug === collection.slug ? "tab-button-active" : ""}`} onClick={() => openCollection(collection.slug)}>{pick(collection.title)}</button>
        ))}
      </div>
      {activeCollection ? (
        <div className="mt-8 rounded-[36px] p-8" style={{ background: activeCollection.accent }}>
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <span className="pill-badge bg-white text-primary">{pick(activeCollection.subtitle)}</span>
              <h2 className="mt-5 text-4xl font-heading font-extrabold text-slate-950">{pick(activeCollection.title)}</h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{pick(activeCollection.description)}</p>
            </div>
            <div className="overflow-hidden rounded-[32px] bg-white/80">
              <img src={activeCollection.image} alt={pick(activeCollection.title)} className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      ) : null}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => <BookCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
