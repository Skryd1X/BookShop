import { Truck, Shield, Tag, Headphones } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function WhyChooseUs() {
  const { t } = useI18n();

  const items = [
    { icon: Truck, title: t("whyDelivery"), desc: t("whyDeliveryDesc") },
    { icon: Shield, title: t("whyOriginal"), desc: t("whyOriginalDesc") },
    { icon: Tag, title: t("whyPrice"), desc: t("whyPriceDesc") },
    { icon: Headphones, title: t("whySupport"), desc: t("whySupportDesc") },
  ];

  return (
    <section className="bg-secondary py-16">
      <div className="container">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
          {t("whyUs")}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-background border border-border hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              style={{ animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both` }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
