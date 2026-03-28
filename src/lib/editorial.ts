import type { BlogPost, FaqItem } from "@/types/store";

export const blogOverrides: Record<string, Partial<BlogPost>> = {
  "how-to-build-reading-habit": {
    cover: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80",
    readTime: "5 мин",
    content: [
      {
        ru: "Если чтение всё время откладывается на потом, проблема обычно не в мотивации, а в формате привычки. Большинство людей пытаются встроить чтение в жизнь как большую задачу, хотя куда устойчивее работают короткие и предсказуемые сценарии.",
        uz: "Agar o'qish doim keyinga qolsa, muammo ko'pincha motivatsiyada emas, odat formatidadir. Kichik va aniq ssenariylar barqarorroq ishlaydi.",
        en: "If reading keeps getting postponed, the problem is usually not motivation but habit design. Small and predictable reading rituals work better than ambitious plans.",
      },
      {
        ru: "Первый шаг — снизить порог входа. Вместо обещания читать по часу в день выберите формат на 10–15 минут. Это может быть несколько страниц утром, глава в дороге или двадцать минут перед сном. Когда старт лёгкий, привычка не вызывает внутреннего сопротивления.",
        uz: "Birinchi qadam — kirish to'sig'ini pasaytirish. Kuniga bir soat o'qish o'rniga 10–15 daqiqalik formatni tanlang.",
        en: "The first step is lowering the barrier to entry. Instead of planning to read for an hour, build a 10–15 minute format you can actually repeat.",
      },
      {
        ru: "Второй шаг — заранее распределить книги по жизненным сценариям. Для дороги лучше короткие главы и нехудожественные тексты, для вечера — спокойная проза, для выходных — более длинные книги, требующие внимания. Это снимает проблему выбора в моменте.",
        uz: "Ikkinchi qadam — kitoblarni turli vaziyatlarga oldindan taqsimlash. Bu har safar nima o'qishni tanlash muammosini kamaytiradi.",
        en: "The second step is assigning books to life scenarios in advance. That removes the friction of deciding what to read each time.",
      },
      {
        ru: "Третий шаг — привязать чтение к конкретному триггеру. После завтрака, после завершения рабочего блока, в такси, перед сном. Хороший триггер — это действие, которое уже стабильно существует в вашем дне и не требует дополнительной воли.",
        uz: "Uchinchi qadam — o'qishni aniq triggerga bog'lash. Bu kun tartibiga organik kirib borishga yordam beradi.",
        en: "The third step is tying reading to a specific trigger: after breakfast, after work, in a taxi, before sleep.",
      },
      {
        ru: "Четвёртый шаг — не усложнять выбор. Если вы держите рядом одну актуальную книгу, а не пять незавершённых, вероятность реально открыть её намного выше. Лишний выбор создаёт усталость ещё до того, как чтение началось.",
        uz: "To'rtinchi qadam — tanlovni haddan tashqari ko'paytirmaslik. Yonida bitta dolzarb kitob bo'lsa, o'qishni boshlash osonroq bo'ladi.",
        en: "The fourth step is avoiding over-choice. Keeping one current book within reach makes starting much easier than juggling five unfinished ones.",
      },
      {
        ru: "Пятый шаг — фиксировать не объём, а ритм. Намного полезнее читать понемногу, но регулярно, чем устраивать редкие длинные сессии. Именно ритм превращает чтение в часть образа жизни, а не в задачу на случай, когда появится свободное окно.",
        uz: "Beshinchi qadam — hajmni emas, ritmni kuzatish. Kichik, lekin muntazam o'qish uzoq muddatda samaraliroq.",
        en: "The fifth step is tracking rhythm rather than volume. Consistency matters more than occasional marathon sessions.",
      },
      {
        ru: "Если вы хотите вернуть чтение в свою жизнь, начните не с цели «прочитать больше», а с вопроса: в какой момент дня я готов читать без напряжения? Именно такой вопрос чаще всего и приводит к работающей системе.",
        uz: "Agar o'qishni hayotingizga qaytarmoqchi bo'lsangiz, avval kunning qaysi qismida buni zo'riqishsiz qila olishingizni aniqlang.",
        en: "If you want reading back in your life, ask not how much you want to read, but when you can read without stress. That is the beginning of a working system.",
      },
    ],
  },
  "best-business-books-2026": {
    cover: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
    readTime: "6 мин",
    content: [
      {
        ru: "Хорошая бизнес-библиотека — это не набор книг с громкими названиями, а рабочая система поддержки решений. Одни книги помогают видеть деньги и структуру, другие — понимать продажи, найм, процессы и устойчивость команды.",
        uz: "Yaxshi biznes kutubxonasi baland nomli kitoblar to'plami emas, balki qarorlarni qo'llab-quvvatlaydigan tizimdir.",
        en: "A strong business library is not a shelf of loud titles but a practical system that supports better decisions.",
      },
      {
        ru: "Для предпринимателя особенно полезны книги, которые дают рамку мышления: как оценивать приоритеты, на чём строится маржа, почему процессы важнее героических усилий и как команда влияет на масштабирование бизнеса.",
        uz: "Tadbirkor uchun ustuvorlik, marja, jarayonlar va jamoa ta'sirini tushuntirib beradigan kitoblar ayniqsa foydali.",
        en: "For founders, the most useful books are those that shape a framework: priorities, margins, processes and how teams influence scale.",
      },
      {
        ru: "В 2026 году особенно ценны книги, которые не обещают «быстрый успех», а помогают навести порядок: разобрать финмодель, выстроить систему продаж, научиться нанимать не по харизме, а по роли, и принимать решения на основе логики, а не постоянной спешки.",
        uz: "2026 yilda tez muvaffaqiyatni va'da qilmaydigan, balki tizim yaratishga yordam beradigan kitoblar ayniqsa qimmatli.",
        en: "In 2026 the most valuable books are not those promising fast success, but those helping build systems and clarity.",
      },
      {
        ru: "Если собирать такую подборку для себя, имеет смысл делить её на четыре блока: продажи и маркетинг, процессы и управление, личная эффективность руководителя и финансовая устойчивость. Тогда библиотека становится не хаотичной, а прикладной.",
        uz: "Bunday kutubxonani to'rtta blokka ajratish foydali: savdo va marketing, jarayonlar, rahbarning samaradorligi va moliyaviy barqarorlik.",
        en: "A practical way to build your selection is by splitting it into four blocks: sales, operations, leadership efficiency and financial resilience.",
      },
      {
        ru: "Отдельная ценность бизнес-книг в том, что они помогают не только расти, но и не допускать дорогих ошибок. Иногда одна вовремя прочитанная глава о переговорах, найме или структуре расходов экономит месяцы времени и очень заметные деньги.",
        uz: "Biznes kitoblarining qiymati shundaki, ular nafaqat o'sishga, balki qimmat xatolarning oldini olishga ham yordam beradi.",
        en: "Business books are valuable not only because they help growth, but because they prevent costly mistakes.",
      },
      {
        ru: "Поэтому лучшая подборка для 2026 года — это не просто список «обязательного чтения», а набор книг, который помогает владельцу бизнеса думать трезво, действовать системно и сохранять устойчивость даже в перегруженной среде.",
        uz: "Shu sababli 2026 yil uchun eng yaxshi tanlov — bu shunchaki ro'yxat emas, balki tizimli fikrlashga yordam beradigan kutubxonadir.",
        en: "That is why the best 2026 reading list is not a trophy shelf, but a library that helps you think clearly and act systematically.",
      },
    ],
  },
  "why-curated-shelves-convert-better": {
    cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80",
    readTime: "4 мин",
    content: [
      {
        ru: "Большой каталог сам по себе не делает выбор удобным. Наоборот, если перед человеком сотни похожих позиций без структуры, он устает ещё до того, как начал сравнивать товары. Именно поэтому подборки и тематические витрины работают сильнее, чем просто длинный список книг.",
        uz: "Katta katalogning o'zi tanlovni osonlashtirmaydi. Tuzilmasiz ko'p variant xaridorni tez charchatadi.",
        en: "A large catalog does not automatically make shopping easier. Without structure, too many options create fatigue before comparison even begins.",
      },
      {
        ru: "Хорошая подборка сокращает когнитивную нагрузку. Она отвечает на скрытый вопрос покупателя: «С чего начать?» Когда витрина собрана по сценарию — для подарка, для бизнеса, для подростков, для домашней библиотеки — человеку легче двигаться к покупке.",
        uz: "Yaxshi tanlov xaridorning yashirin savoliga javob beradi: 'Qayerdan boshlayman?'", 
        en: "A strong curated shelf answers the hidden customer question: 'Where do I start?'",
      },
      {
        ru: "Подборки усиливают доверие, потому что показывают редакторскую логику магазина. Покупатель видит не просто набор карточек, а определённый вкус, внимание к деталям и попытку помочь выбрать, а не просто показать всё подряд.",
        uz: "Tanlovlar do'konning didi va mantiqini ko'rsatadi, bu esa ishonchni oshiradi.",
        en: "Curated shelves build trust because they reveal the store's editorial logic rather than dumping all products at once.",
      },
      {
        ru: "Для книжного магазина это особенно важно. Книги часто покупают не только по цене, но и по настроению, задаче, интересу и контексту. Когда эти сценарии уже собраны на витрине, путь от интереса до заказа становится заметно короче.",
        uz: "Kitob do'konida bu ayniqsa muhim, chunki kitoblar ko'pincha narx bilan emas, kayfiyat va vazifa bilan tanlanadi.",
        en: "This matters even more for books, which are often chosen by mood, context and intent rather than price alone.",
      },
      {
        ru: "Именно поэтому в BOOKSHOP подборки работают как отдельный слой навигации. Они не заменяют каталог, а помогают быстрее найти нужное — и делают саму витрину более спокойной, понятной и современной.",
        uz: "Shu sababli BOOKSHOP tanlovlari katalogni almashtirmaydi, balki unga qulay yo'naltiruvchi qatlam qo'shadi.",
        en: "That is why curated shelves in BOOKSHOP do not replace the catalog — they make it easier, calmer and more modern to use.",
      },
    ],
  },
};

export function applyBlogOverride(post: BlogPost) {
  const override = blogOverrides[post.slug];
  return override ? { ...post, ...override } : post;
}

export const faqOverrides: Partial<Record<string, string>> = {
  f1: "Обычно по Ташкенту заказ доставляется в течение дня или на следующий день после подтверждения менеджером. Если книга нужна срочно, мы стараемся предложить самый быстрый вариант получения или самовывоза.",
  f2: "Да. В другие регионы Узбекистана отправляем заказы через Яндекс или BTS. Стоимость доставки оплачивает покупатель отдельно и не входит в цену книги.",
  f6: "Да, вход через Google предусмотрен как удобный способ авторизации. Пользователь может выбрать обычный вход по email и паролю или быстрый вход через Google, если этот способ активирован на стороне магазина.",
};

export function applyFaqOverride(item: FaqItem): FaqItem {
  const ru = faqOverrides[item.id];
  if (!ru) return item;
  return {
    ...item,
    answer: {
      ...item.answer,
      ru,
    },
  };
}
