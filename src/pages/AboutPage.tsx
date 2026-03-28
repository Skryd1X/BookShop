import { ExternalLink, MapPinned } from "lucide-react";
import { useMemo, useState } from "react";

const MAP_LINK = "https://yandex.uz/maps/-/CPVoZT7f";
const STATIC_MAP = "https://static-maps.yandex.ru/1.x/?ll=69.268488,41.306492&z=18&size=650,420&l=map&lang=ru_RU&pt=69.268488,41.306492,pm2rdm";

export default function AboutPage() {
  const [mapFailed, setMapFailed] = useState(false);

  const mapCard = useMemo(
    () => (
      <a href={MAP_LINK} target="_blank" rel="noreferrer" className="group block h-full w-full">
        {mapFailed ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#f7f4ff_0%,#ffffff_100%)] px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-primary shadow-[0_16px_34px_rgba(95,45,255,0.12)]">
              <MapPinned className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold text-slate-950">Открыть карту BOOKSHOP</h3>
              <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                Если встроенная карта не отображается в браузере, откройте точку в Яндекс Картах и сразу постройте маршрут до магазина.
              </p>
            </div>
            <span className="primary-button px-5 py-3 text-sm font-semibold">
              Открыть Яндекс Карты
              <ExternalLink className="h-4 w-4" />
            </span>
          </div>
        ) : (
          <img
            src={STATIC_MAP}
            alt="BOOKSHOP на карте"
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.01]"
            loading="lazy"
            onError={() => setMapFailed(true)}
          />
        )}
      </a>
    ),
    [mapFailed],
  );

  return (
    <div className="container-tight py-8 md:py-10 xl:py-12">
      <section className="summary-card overflow-hidden">
        <span className="pill-badge">BOOKSHOP</span>
        <h1 className="mt-5 text-[42px] font-heading font-extrabold tracking-tight text-slate-950 md:text-[58px]">Книжный магазин BOOKSHOP в центре Ташкента</h1>
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <p className="text-base leading-8 text-slate-600 md:text-lg">
            BOOKSHOP — это книжный магазин в Ташкенте с современной витриной, спокойным каталогом и удобным оформлением заказа. Мы работаем для тех, кто хочет быстро найти нужную книгу, выбрать подарок, собрать домашнюю библиотеку или просто купить качественное издание без визуального шума и лишних шагов.
          </p>
          <p className="text-base leading-8 text-slate-600 md:text-lg">
            Наш магазин находится по адресу <strong>улица Буюк Турон, 69, Ташкент</strong>. Удобный городской ориентир — район ЦУМа и метро «Космонавтов». Это хорошая точка как для самовывоза, так и для личной консультации по выбору книг, актуальным новинкам и тематическим подборкам.
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <article className="summary-card">
          <h2 className="text-2xl font-heading font-bold text-slate-950">Что представляет собой BOOKSHOP</h2>
          <div className="mt-4 space-y-4 text-base leading-8 text-slate-600">
            <p>
              Мы строим книжную витрину, где главную роль играет не визуальный шум, а сама книга: обложка, тема, автор, цена, наличие и понятное описание. В BOOKSHOP каталог не перегружает покупателя. Здесь легко перейти от интереса к выбору и спокойно сравнить несколько вариантов.
            </p>
            <p>
              В центре внимания — книги для личного чтения, подарка, семьи, обучения, бизнеса и повседневного интереса. Мы стараемся сочетать актуальные издания, популярные позиции и красиво оформленные книги, которые хорошо смотрятся и на полке, и в подарочном сценарии.
            </p>
            <p>
              Для покупателей из Ташкента важна скорость и понятность сервиса. Для покупателей из других регионов — аккуратная отправка и прозрачные условия. Поэтому доставка по регионам оформляется через Яндекс или BTS, а стоимость доставки оплачивается покупателем отдельно и не входит в цену книги.
            </p>
          </div>
        </article>

        <article className="summary-card overflow-hidden p-0">
          <div className="border-b border-violet-100 px-6 py-5">
            <h2 className="text-2xl font-heading font-bold text-slate-950">Где нас найти</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">BOOKSHOP, улица Буюк Турон, 69, Ташкент. Ориентир — район ЦУМа и метро «Космонавтов».</p>
          </div>
          <div className="aspect-[4/3] w-full overflow-hidden bg-violet-50">
            {mapCard}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 text-sm leading-7 text-slate-600">
            <p className="max-w-xl">Если нужен точный маршрут или подтверждение наличия книги перед визитом, менеджер поможет уточнить детали и подскажет удобный способ получения заказа.</p>
            <a href={MAP_LINK} target="_blank" rel="noreferrer" className="secondary-button px-4 py-2.5 text-sm font-semibold">
              Построить маршрут
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </article>
      </section>

      <section className="mt-8 summary-card">
        <h2 className="text-3xl font-heading font-bold text-slate-950">Почему покупателям удобно у нас</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Спокойный каталог", "Чёткие карточки товара, понятные цены и минимум лишнего визуального шума."],
            ["Удобный адрес", "Магазин в центре города: улица Буюк Турон, 69, Ташкент — удобно доехать и забрать заказ."],
            ["Нормальная консультация", "Если нужно, мы поможем подобрать похожие книги, подарочные варианты и альтернативы по бюджету."],
            ["Доставка по регионам", "Отправка через Яндекс или BTS; стоимость доставки оплачивает покупатель отдельно."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-[24px] border border-violet-100 bg-violet-50/45 p-5">
              <h3 className="text-lg font-heading font-bold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
