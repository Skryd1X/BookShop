# BOOKSHOP

Готовый стартовый проект книжного маркетплейса в бело-фиолетовом стиле под ваши референсы. Backend уже переведён на BILLZ 2.

## Что уже включено

- новый визуальный стиль главной, каталога, карточки товара, профиля, FAQ, блога и подборок;
- Router под страницы `/`, `/catalog`, `/product/:slug`, `/cart`, `/checkout`, `/auth`, `/profile`, `/collections`, `/blog`, `/faq`, `/about`, `/admin`;
- frontend на React + Vite + Tailwind;
- backend без внешних зависимостей на `node:http`;
- каталог, категории, подборки, отзывы, блог и FAQ отдаются с backend API;
- email/password авторизация;
- подготовленная архитектура под Google OAuth;
- backend уже переведён на BILLZ 2 auth + catalog sync;
- админ-панель с ручным скрытием/показом товара, созданием локального товара и загрузкой фото;
- оформление заказа с оплатой переводом на карту и подтверждением через кнопку;
- уведомление в Telegram-бот после нажатия `Я оплатил`.

## Важные честные ограничения

- точные шрифты **TheSans Mono Web Var** и **MT Sans Full** не вложены в архив, потому что это обычно лицензируемые шрифты. В проекте уже подготовлены `@font-face` и fallback-цепочки. Чтобы включить точные шрифты, положите свои лицензированные `woff2` файлы в `public/fonts/`.
- BILLZ 2 у разных аккаунтов может отличаться по route-path и структуре ответов. Поэтому интеграция сделана через адаптер, access/secret token и env-переменные, а не через жёстко вшитые неподтверждённые route-имена.
- ручная оплата на карту настроена как flow: показать номер карты → клиент переводит → жмёт кнопку → Telegram получает уведомление. Подключения платёжного шлюза здесь нет, потому что по вашему ТЗ нужен именно карточный перевод с ручным подтверждением.

## Запуск

### 1. Frontend

```bash
npm install
npm run dev
```

### 2. Backend

```bash
cp .env.example .env
node backend/server.mjs
```

По умолчанию backend поднимается на `http://localhost:3001`.

## Основные env-переменные

- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — вход в админку
- `PAYMENT_CARD_NUMBER`, `PAYMENT_CARD_HOLDER`, `PAYMENT_CARD_BANK` — реквизиты для оплаты
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — отправка уведомлений о подтверждении оплаты
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — Google OAuth
- `BILLZ_ENABLED`, `BILLZ_API_VERSION`, `BILLZ_AUTH_URL`, `BILLZ_BASE_URL`, `BILLZ_PRODUCTS_PATH`, `BILLZ_CATEGORIES_PATH`, `BILLZ_ACCESS_TOKEN`, `BILLZ_SECRET_TOKEN`, `BILLZ_COMPANY_ID`, `BILLZ_STORE_ID` — адаптер BILLZ 2

## Как работает BILLZ 2 слой

При нажатии `Синхронизировать BILLZ` backend:

1. берёт настройки BILLZ 2 из `.env`;
2. использует `BILLZ_ACCESS_TOKEN`, а если его нет — сам получает новый `access_token` через `BILLZ_SECRET_TOKEN`;
3. делает запросы на товары и категории через `BILLZ_BASE_URL` и path-переменные;
4. пытается распознать массив из полей `data`, `items`, `products`, `categories`, `result`, `results`;
5. мапит BILLZ 2 данные в структуру витрины BOOKSHOP;
6. сохраняет их в локальную базу `backend/storage/db.json`, при этом не теряет локально загруженные изображения для уже импортированных товаров.

Это позволяет:

- грузить витрину строго из BILLZ 2;
- локально скрывать/показывать позиции;
- добавлять локальные фото к товарам и не терять их после следующей синхронизации;
- держать сайт и его override-данные отдельно от исходного источника.

## Где хранится локальная база

- `backend/storage/db.json` — товары, категории, пользователи, заказы, блог, FAQ и overrides
- `backend/storage/uploads/` — фотографии, загруженные через админку

## Что ещё можно сразу сделать после запуска

- заменить demo контент в `backend/seed.mjs` на реальные книги;
- подключить точные шрифты в `public/fonts`;
- заполнить `.env` под ваш BILLZ 2 аккаунт;
- включить Google OAuth;
- заменить demo телефон, email и данные карты.
