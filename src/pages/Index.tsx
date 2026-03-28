import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import BookSection from "@/components/home/BookSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import PopularAuthors from "@/components/home/PopularAuthors";
import { useI18n } from "@/lib/i18n";

export default function Index() {
  const { t } = useI18n();

  return (
    <div>
      <HeroSection />
      <CategoryGrid />
      <BookSection title={t("bestsellers")} filter="bestseller" />
      <BookSection title={t("newArrivals")} filter="new" />
      <BookSection title={t("discounts")} filter="discount" />
      <PopularAuthors />
      <WhyChooseUs />
    </div>
  );
}
