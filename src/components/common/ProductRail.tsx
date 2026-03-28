import { BookCard } from "@/components/common/BookCard";
import { SectionHeading } from "@/components/common/SectionHeading";
import type { Product } from "@/types/store";

interface ProductRailProps {
  badge?: string;
  title: string;
  subtitle?: string;
  products: Product[];
}

export function ProductRail({ badge, title, subtitle, products }: ProductRailProps) {
  if (!products?.length) return null;

  return (
    <section className="section-space">
      <div className="container-tight">
        <SectionHeading badge={badge} title={title} subtitle={subtitle} actionLabel="Все" actionTo="/catalog" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {products.map((product) => (
            <BookCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
