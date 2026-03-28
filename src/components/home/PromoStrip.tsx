const promoCards = [
  {
    title: "Премиальные подборки для подарка и домашней библиотеки",
    text: "Аккуратно собранные книги, которые хорошо выглядят на полке и легко выбираются в подарок.",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Спокойная витрина для удобного выбора",
    text: "Чистая подача, понятные карточки и современный ритм каталога без лишней перегрузки.",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&q=80",
  },
];

export function PromoStrip() {
  return (
    <section className="section-space pt-0">
      <div className="container-tight grid gap-4 lg:grid-cols-2">
        {promoCards.map((card) => (
          <article key={card.title} className="relative overflow-hidden rounded-[30px] border border-violet-100/80 bg-slate-950 shadow-[0_24px_50px_rgba(53,20,130,0.12)]">
            <img src={card.image} alt={card.title} className="h-[260px] w-full object-cover opacity-90 md:h-[300px]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(12,16,30,0.82)_0%,rgba(109,53,249,0.42)_100%)]" />
            <div className="absolute inset-0 flex flex-col justify-end p-7 md:p-8">
              <span className="mb-3 inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">BOOKSHOP VISUAL</span>
              <h3 className="max-w-[520px] text-[28px] font-heading font-extrabold leading-tight text-white md:text-[34px]">{card.title}</h3>
              <p className="mt-3 max-w-[540px] text-sm leading-7 text-white/80 md:text-base">{card.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
