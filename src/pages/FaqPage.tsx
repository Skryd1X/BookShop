import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/client";
import { applyFaqOverride } from "@/lib/editorial";
import { useI18n } from "@/lib/i18n";
import type { FaqItem } from "@/types/store";

export default function FaqPage() {
  const { t, pick } = useI18n();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api.getFaqs().then((data) => setItems(data.map(applyFaqOverride))).catch(() => setItems([]));
  }, []);

  const groups = useMemo(() => ({
    delivery: items.filter((item) => item.group === "delivery"),
    payment: items.filter((item) => item.group === "payment"),
    returns: items.filter((item) => item.group === "returns"),
    account: items.filter((item) => item.group === "account"),
  }), [items]);

  const groupTitles: Record<string, string> = {
    delivery: "Доставка",
    payment: "Оплата",
    returns: "Возврат",
    account: "Аккаунт",
  };

  return (
    <div className="container-tight py-10">
      <h1 className="text-4xl font-heading font-extrabold text-slate-950">{t("faqTitle")}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-500">{t("faqSubtitle")}</p>
      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        {Object.entries(groups).map(([group, entries]) => (
          <section key={group} className="rounded-[32px] border border-violet-100 bg-white p-6 shadow-[0_28px_60px_rgba(95,45,255,0.08)]">
            <h2 className="text-2xl font-heading font-bold text-slate-950">{groupTitles[group]}</h2>
            <div className="mt-5 space-y-3">
              {entries.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-violet-100 bg-violet-50/60 px-5 py-4">
                  <button className="flex w-full items-center justify-between gap-4 text-left" onClick={() => setOpenId(openId === item.id ? null : item.id)}>
                    <span className="text-base font-semibold text-slate-900">{pick(item.question)}</span>
                    <ChevronDown className={`h-4 w-4 text-primary transition ${openId === item.id ? "rotate-180" : ""}`} />
                  </button>
                  {openId === item.id ? <p className="mt-4 text-sm leading-7 text-slate-600">{pick(item.answer)}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
