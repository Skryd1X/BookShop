import { Clock3, MapPin, RotateCcw, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  const features = [
    { icon: Clock3, title: "Быстрая доставка", text: "По Ташкенту — после подтверждения заказа" },
    { icon: ShieldCheck, title: "Качественные издания", text: "Подбор книг с понятной витриной и аккуратной подачей" },
    { icon: RotateCcw, title: "Удобное оформление", text: "Избранное, корзина и подтверждение заказа без перегруза" },
    { icon: MapPin, title: "Точка в центре города", text: "улица Буюк Турон, 69, Ташкент" },
  ];

  return (
    <footer className="mt-20 border-t border-violet-100/80 bg-[linear-gradient(180deg,#f8f6fd_0%,#f1eefb_100%)] text-slate-900">
      <div className="container-tight py-6 md:py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((item) => (
            <div key={item.title} className="rounded-[26px] border border-white/90 bg-white/90 px-5 py-5 shadow-[0_18px_40px_rgba(95,45,255,0.06)] backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-violet-100 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container-tight pb-10 pt-4">
        <div className="grid gap-8 rounded-[34px] border border-white/90 bg-white/88 px-6 py-8 shadow-[0_24px_54px_rgba(95,45,255,0.06)] md:grid-cols-[1.15fr_0.7fr_0.9fr] md:px-8 md:py-10">
          <div>
            <div className="text-3xl font-heading font-extrabold text-slate-950">BOOKSHOP</div>
            <p className="mt-4 max-w-xl text-sm leading-8 text-slate-600">{t("footerText")}</p>
            <p className="mt-4 text-sm font-medium text-slate-500">Точный адрес: улица Буюк Турон, 69, Ташкент.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Навигация</h3>
            <div className="mt-4 grid gap-3 text-sm font-medium text-slate-700">
              <Link to="/catalog">Каталог</Link>
              <Link to="/collections">Подборки</Link>
              <Link to="/blog">Блог</Link>
              <Link to="/faq">FAQ / Помощь</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Контакты</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <a href="tel:+998901234567">+998 90 123-45-67</a>
              <a href="mailto:hello@bookshop.uz">hello@bookshop.uz</a>
              <span>улица Буюк Турон, 69, Ташкент</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
