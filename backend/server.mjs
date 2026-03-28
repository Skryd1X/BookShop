import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import { seedData } from "./seed.mjs";
import { createTelegramBotBridge } from "./telegram-bot.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = normalize(join(__dirname, ".."));

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const source = readFileSync(filePath, "utf8");
  for (const rawLine of source.split("\n")) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(join(projectRoot, ".env"));
loadEnvFile(join(projectRoot, ".env.local"));

const storageDir = join(__dirname, "storage");
const uploadsDir = join(storageDir, "uploads");
const dbFile = join(storageDir, "db.json");
const distDir = join(projectRoot, "dist");

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["true", "1", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const env = {
  PORT: Number(process.env.PORT || 3001),
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:8080",
  APP_BASE_URL: process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3001}`,
  JWT_SECRET: process.env.JWT_SECRET || "bookshop-secret",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@bookshop.uz",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "Admin123!",
  BOT_TOKEN: process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "",
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "",
  ADMINS_TELEGRAM_USER: process.env.ADMINS_TELEGRAM_USER || "",
  ADMINS_TELEGRAM_PASSWORD: process.env.ADMINS_TELEGRAM_PASSWORD || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || "",
  PAYME_ENABLED: parseBoolean(process.env.PAYME_ENABLED, false),
  PAYME_MERCHANT_ID: process.env.PAYME_MERCHANT_ID || "",
  PAYME_LOGIN: process.env.PAYME_LOGIN || "",
  PAYME_KEY: process.env.PAYME_KEY || "",
  PAYME_CHECKOUT_URL: process.env.PAYME_CHECKOUT_URL || "https://checkout.paycom.uz",
  CLICK_ENABLED: parseBoolean(process.env.CLICK_ENABLED, false),
  CLICK_MERCHANT_ID: process.env.CLICK_MERCHANT_ID || "",
  CLICK_MERCHANT_USER_ID: process.env.CLICK_MERCHANT_USER_ID || "",
  CLICK_SERVICE_ID: process.env.CLICK_SERVICE_ID || "",
  CLICK_SECRET_KEY: process.env.CLICK_SECRET_KEY || "",
  CLICK_PAYMENT_URL: process.env.CLICK_PAYMENT_URL || "https://my.click.uz/services/pay",
  UZUM_ENABLED: parseBoolean(process.env.UZUM_ENABLED, false),
  UZUM_SERVICE_ID: process.env.UZUM_SERVICE_ID || "",
  UZUM_LOGIN: process.env.UZUM_LOGIN || "",
  UZUM_PASSWORD: process.env.UZUM_PASSWORD || "",
  UZUM_PAYMENT_URL_TEMPLATE: process.env.UZUM_PAYMENT_URL_TEMPLATE || "",
  PAYMENT_RETURN_URL: process.env.PAYMENT_RETURN_URL || "",
  DATA_RETENTION_DAYS: Number(process.env.DATA_RETENTION_DAYS || 14),
  BILLZ_ENABLED: parseBoolean(process.env.BILLZ_ENABLED, false),
  BILLZ_API_VERSION: process.env.BILLZ_API_VERSION || "v2",
  BILLZ_AUTH_URL: process.env.BILLZ_AUTH_URL || "https://api-admin.billz.ai/v1/auth/login",
  BILLZ_BASE_URL: process.env.BILLZ_BASE_URL || "https://api-admin.billz.ai",
  BILLZ_PRODUCTS_PATH: process.env.BILLZ_PRODUCTS_PATH || "/v2/products",
  BILLZ_CATEGORIES_PATH: process.env.BILLZ_CATEGORIES_PATH || "/v2/categories",
  BILLZ_PRODUCTS_PATHS: splitCsv(process.env.BILLZ_PRODUCTS_PATHS),
  BILLZ_CATEGORIES_PATHS: splitCsv(process.env.BILLZ_CATEGORIES_PATHS),
  BILLZ_ACCESS_TOKEN: process.env.BILLZ_ACCESS_TOKEN || process.env.BILLZ_TOKEN || "",
  BILLZ_SECRET_TOKEN: process.env.BILLZ_SECRET_TOKEN || process.env.BILLZ_SECRET || "",
  BILLZ_COMPANY_ID: process.env.BILLZ_COMPANY_ID || "",
  BILLZ_STORE_ID: process.env.BILLZ_STORE_ID || "",
  BILLZ_REQUEST_TIMEOUT_MS: Number(process.env.BILLZ_REQUEST_TIMEOUT_MS || 20000),
  BILLZ_SYNC_INTERVAL_MINUTES: Number(process.env.BILLZ_SYNC_INTERVAL_MINUTES || 15),
  MONGODB_URI: process.env.MONGODB_URI || "",
  MONGODB_DB: process.env.MONGODB_DB || "bookshop",
  MONGO_ONLY: parseBoolean(process.env.MONGO_ONLY, Boolean(process.env.MONGODB_URI)),
};

function getRequestOrigin(req) {
  return String(req.headers.origin || "").trim();
}

function appendVaryHeader(res, value) {
  const current = String(res.getHeader("Vary") || "").trim();
  if (!current) {
    res.setHeader("Vary", value);
    return;
  }
  const values = current
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!values.includes(value)) {
    values.push(value);
    res.setHeader("Vary", values.join(", "));
  }
}

function buildCorsHeaders(req) {
  const requestOrigin = getRequestOrigin(req);
  const requestedHeaders = String(req.headers["access-control-request-headers"] || "").trim();

  const allowHeaders = requestedHeaders || [
    "Content-Type",
    "Authorization",
    "ngrok-skip-browser-warning",
    "X-Requested-With",
    "Accept",
    "Origin",
  ].join(", ");

  const headers = {
    "Access-Control-Allow-Origin": requestOrigin || "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Expose-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (String(req.headers["access-control-request-private-network"] || "").toLowerCase() === "true") {
    headers["Access-Control-Allow-Private-Network"] = "true";
  }

  return headers;
}

function applyCors(req, res) {
  const headers = buildCorsHeaders(req);
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  appendVaryHeader(res, "Origin");
  appendVaryHeader(res, "Access-Control-Request-Headers");
  appendVaryHeader(res, "Access-Control-Request-Method");
}

const billzTokenCache = {
  value: "",
  exp: 0,
};

let billzSyncInProgress = false;

mkdirSync(storageDir, { recursive: true });
mkdirSync(uploadsDir, { recursive: true });

const mongoState = {
  client: null,
  db: null,
  promise: null,
};

const collectionNames = [
  "categories",
  "products",
  "collections",
  "authors",
  "reviews",
  "blogPosts",
  "faqs",
  "users",
  "orders",
  "payments",
  "paymentEvents",
  "botAdmins",
  "passwordResets",
];

const seedKeysByCollection = {
  categories: "categories",
  products: "products",
  collections: "collections",
  authors: "authors",
  reviews: "reviews",
  blogPosts: "blogPosts",
  faqs: "faqs",
  users: null,
  orders: null,
  payments: null,
  paymentEvents: null,
  botAdmins: null,
  passwordResets: null,
};

const CATEGORY_PRESETS = [
  {
    slug: "fiction",
    icon: "📚",
    accent: "linear-gradient(135deg,#f3ecff 0%,#ffffff 100%)",
    name: { ru: "Художественная литература", uz: "Badiiy adabiyot", en: "Fiction" },
    description: { ru: "Романы, проза и классические произведения", uz: "Romanlar, proza va klassika", en: "Novels, prose and classics" },
    patterns: [/(роман|классик|литератур|fiction|novel|prose|поэз|повест|рассказ|эмил|булгаков|достоев|оруэл|бронте)/i],
  },
  {
    slug: "business",
    icon: "💼",
    accent: "linear-gradient(135deg,#efe9ff 0%,#ffffff 100%)",
    name: { ru: "Бизнес и экономика", uz: "Biznes va iqtisod", en: "Business & economics" },
    description: { ru: "Маркетинг, менеджмент, деньги и стратегия", uz: "Marketing, menejment va strategiya", en: "Marketing, management and strategy" },
    patterns: [/(бизнес|эконом|финанс|маркет|менедж|карьер|business|econom|market|money|finance)/i],
  },
  {
    slug: "psychology",
    icon: "🧠",
    accent: "linear-gradient(135deg,#f6edff 0%,#ffffff 100%)",
    name: { ru: "Психология", uz: "Psixologiya", en: "Psychology" },
    description: { ru: "Эмоции, мышление, отношения и привычки", uz: "Hissiyotlar va tafakkur", en: "Emotions, thinking and habits" },
    patterns: [/(псих|отношен|мышлен|эмоци|self|habit|mind|личност|мотивац|осознан)/i],
  },
  {
    slug: "children",
    icon: "🧒",
    accent: "linear-gradient(135deg,#fff0ff 0%,#ffffff 100%)",
    name: { ru: "Детские книги", uz: "Bolalar kitoblari", en: "Children" },
    description: { ru: "Сказки, подростковое и семейное чтение", uz: "Ertaklar va bolalar uchun", en: "Fairy tales and young readers" },
    patterns: [/(дет|сказк|подрост|kids|child|prin[ct]|принц|гарри поттер|harry potter)/i],
  },
  {
    slug: "history",
    icon: "🏛️",
    accent: "linear-gradient(135deg,#f2efff 0%,#ffffff 100%)",
    name: { ru: "История и биографии", uz: "Tarix va biografiyalar", en: "History & biographies" },
    description: { ru: "История, цивилизации, воспоминания и биографии", uz: "Tarix va biografiyalar", en: "History, civilisations and biographies" },
    patterns: [/(истор|биограф|цивилиз|history|memoir|war|наполеон|харрари)/i],
  },
  {
    slug: "education",
    icon: "🎓",
    accent: "linear-gradient(135deg,#eef4ff 0%,#ffffff 100%)",
    name: { ru: "Образование", uz: "Ta'lim", en: "Education" },
    description: { ru: "Учёба, языки, навыки и развитие знаний", uz: "Ta'lim va ko'nikmalar", en: "Study, languages and skills" },
    patterns: [/(учеб|обуч|англ|grammar|educat|school|guide|справочник|энциклоп)/i],
  },
  {
    slug: "stationery",
    icon: "✦",
    accent: "linear-gradient(135deg,#f5f0ff 0%,#ffffff 100%)",
    name: { ru: "Подарки и блокноты", uz: "Sovg'alar va bloknotlar", en: "Gifts & stationery" },
    description: { ru: "Блокноты, открытки, сувениры и печатные аксессуары", uz: "Bloknotlar va sovg'alar", en: "Notebooks, postcards and stationery" },
    patterns: [/(блокнот|открытк|сувен|канц|stationery|notebook|planner|gift|card)/i],
  },
]

const GENERIC_CATEGORY_SLUGS = new Set(["category", "categories", "other", "books", "book", "товары", "products"])
const GENERIC_CATEGORY_NAMES = new Set(["категория", "categories", "category", "books", "book", "товары", "products"])


function slugify(input = "") {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || `item-${Date.now()}`;
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stripHtml(input = "") {
  return String(input)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function getCategoryPresetBySlug(slug = "") {
  return CATEGORY_PRESETS.find((item) => item.slug === slug) || null;
}

function isMeaningfulCategoryName(value = "") {
  const label = String(value || "").trim().toLowerCase();
  if (!label) return false;
  if (label.length <= 2) return false;
  if (GENERIC_CATEGORY_NAMES.has(label)) return false;
  return true;
}

function scorePresetMatch(preset, text = "") {
  if (!text) return 0;
  return preset.patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
}

function matchCategoryPreset(textValue = "") {
  const text = String(textValue || "").trim();
  if (!text) return null;

  let bestPreset = null;
  let bestScore = 0;
  for (const preset of CATEGORY_PRESETS) {
    const score = scorePresetMatch(preset, text);
    if (score > bestScore) {
      bestPreset = preset;
      bestScore = score;
    }
  }

  return bestPreset;
}

function inferCategoryDescriptor({ categoryName = "", title = "", author = "", description = "", fallbackSlug = "" } = {}) {
  const meaningful = isMeaningfulCategoryName(categoryName);
  const combined = [categoryName, title, author, description].filter(Boolean).join(" ");
  const preset = matchCategoryPreset(combined) || (fallbackSlug ? getCategoryPresetBySlug(fallbackSlug) : null);

  if (meaningful && !preset) {
    return {
      slug: slugify(categoryName),
      icon: "📘",
      accent: "linear-gradient(135deg,#f4efff 0%,#ffffff 100%)",
      name: { ru: categoryName, uz: categoryName, en: categoryName },
      description: { ru: "Раздел каталога BOOKSHOP", uz: "BOOKSHOP katalogi bo'limi", en: "BOOKSHOP catalog section" },
      rawName: categoryName,
      derived: false,
    };
  }

  if (preset) {
    return {
      slug: preset.slug,
      icon: preset.icon,
      accent: preset.accent,
      name: preset.name,
      description: preset.description,
      rawName: meaningful ? categoryName : preset.name.ru,
      derived: !meaningful,
    };
  }

  return {
    slug: fallbackSlug && !GENERIC_CATEGORY_SLUGS.has(fallbackSlug) ? fallbackSlug : "fiction",
    icon: "📘",
    accent: "linear-gradient(135deg,#f4efff 0%,#ffffff 100%)",
    name: { ru: meaningful ? categoryName : "Книги", uz: meaningful ? categoryName : "Kitoblar", en: meaningful ? categoryName : "Books" },
    description: { ru: "Раздел каталога BOOKSHOP", uz: "BOOKSHOP katalogi bo'limi", en: "BOOKSHOP catalog section" },
    rawName: meaningful ? categoryName : "Книги",
    derived: !meaningful,
  };
}

function ensureProductCategory(product) {
  const descriptor = inferCategoryDescriptor({
    categoryName: product.categoryName,
    title: product.title,
    author: product.author,
    description: product.description || product.summary || "",
    fallbackSlug: product.categorySlug,
  });
  if (!product.categorySlug || GENERIC_CATEGORY_SLUGS.has(product.categorySlug) || product.categorySlug !== descriptor.slug) {
    product.categorySlug = descriptor.slug;
  }
  if (!isMeaningfulCategoryName(product.categoryName) || descriptor.derived) {
    product.categoryName = descriptor.name.ru;
  }
}

function ensureCategoryCollectionShape(db) {
  if (!Array.isArray(db.categories)) db.categories = [];
  const existing = new Map(db.categories.map((category) => [category.slug, category]));
  for (const product of db.products || []) {
    ensureProductCategory(product);
    const descriptor = inferCategoryDescriptor({
      categoryName: product.categoryName,
      title: product.title,
      author: product.author,
      description: product.description || product.summary || "",
      fallbackSlug: product.categorySlug,
    });
    if (!existing.has(descriptor.slug)) {
      const category = {
        id: `auto-cat-${descriptor.slug}`,
        slug: descriptor.slug,
        icon: descriptor.icon,
        accent: descriptor.accent,
        name: descriptor.name,
        description: descriptor.description,
      };
      db.categories.push(category);
      existing.set(descriptor.slug, category);
    }
  }
}

function normalizeDbState(db) {
  if (!Array.isArray(db.categories)) db.categories = [];
  if (!Array.isArray(db.collections)) db.collections = [];
  if (!Array.isArray(db.authors)) db.authors = [];
  if (!Array.isArray(db.blogPosts)) db.blogPosts = [];
  if (!Array.isArray(db.faqs)) db.faqs = [];
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.orders)) db.orders = [];
  if (!Array.isArray(db.payments)) db.payments = [];
  if (!Array.isArray(db.paymentEvents)) db.paymentEvents = [];
  if (!Array.isArray(db.botAdmins)) db.botAdmins = [];
  if (!Array.isArray(db.passwordResets)) db.passwordResets = [];
  if (!Array.isArray(db.products)) db.products = [];
  if (!Array.isArray(db.reviews)) db.reviews = [];
  for (const product of db.products) {
    product.images = normalizeImages(product.images || []);
    product.price = Number(product.price || 0);
    product.oldPrice = product.oldPrice ? Number(product.oldPrice) : null;
    product.stock = Number(product.stock || 0);
    product.inStock = product.stock > 0 && product.published !== false;
    product.published = product.published !== false;
    product.createdAt = product.createdAt || product.updatedAt || new Date().toISOString();
    product.updatedAt = product.updatedAt || product.createdAt;
    product.rating = Number(product.rating || 0);
    product.reviewsCount = Number(product.reviewsCount || 0);
    ensureProductCategory(product);
  }
  for (const order of db.orders) {
    order.createdAt = order.createdAt || new Date().toISOString();
    order.updatedAt = order.updatedAt || order.createdAt;
    order.number = String(order.number || order.id || '').replace(/\D/g, '').slice(-5) || String(Date.now()).slice(-5);
    order.status = order.status || 'pending_payment';
    order.paymentStatus = order.paymentStatus || (order.status === 'paid' ? 'paid' : 'pending');
    order.paymentMethod = order.paymentMethod || 'payme';
    order.amount = Number(order.amount || 0);
    order.items = Array.isArray(order.items) ? order.items : [];
  }
  for (const payment of db.payments) {
    payment.createdAt = payment.createdAt || new Date().toISOString();
    payment.updatedAt = payment.updatedAt || payment.createdAt;
    payment.status = payment.status || 'pending';
    payment.amount = Number(payment.amount || 0);
    payment.amountTiyin = Number(payment.amountTiyin || Math.round(Number(payment.amount || 0) * 100));
  }
  ensureCategoryCollectionShape(db);
  for (const product of db.products) {
    recalculateProductReviewStats(db, product);
  }
  return purgeExpiredRecords(db);
}


function purgeExpiredRecords(db) {
  const retentionMs = Math.max(1, Number(env.DATA_RETENTION_DAYS || 14)) * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - retentionMs;
  const keepRecent = (item) => {
    const ts = new Date(item?.createdAt || item?.updatedAt || 0).getTime();
    if (!Number.isFinite(ts) || ts <= 0) return true;
    return ts >= cutoff;
  };
  db.orders = (db.orders || []).filter(keepRecent);
  db.payments = (db.payments || []).filter(keepRecent);
  db.paymentEvents = (db.paymentEvents || []).filter(keepRecent);
  return db;
}

function createPublicOrderNumber(db) {
  const existing = new Set((db.orders || []).map((item) => String(item.number || '')));
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const candidate = String(10000 + Math.floor(Math.random() * 90000));
    if (!existing.has(candidate)) return candidate;
  }
  return String(Date.now()).slice(-5);
}

function nowIso() {
  return new Date().toISOString();
}

function toTiyin(amountSums = 0) {
  return Math.round(Number(amountSums || 0) * 100);
}

function fromTiyin(amountTiyin = 0) {
  return Math.round(Number(amountTiyin || 0) / 100);
}

function formatClickAmount(amount = 0) {
  return Number(amount || 0).toFixed(2);
}

function resolvePaymentReturnUrl(order) {
  const base = env.PAYMENT_RETURN_URL || `${env.FRONTEND_URL.replace(/\/$/, '')}/profile#orders`;
  const url = new URL(base, env.FRONTEND_URL);
  if (order?.id) url.searchParams.set('orderId', order.id);
  if (order?.number) url.searchParams.set('order', order.number);
  return url.toString();
}

function parseBasicAuth(req) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const index = decoded.indexOf(':');
    if (index === -1) return null;
    return { login: decoded.slice(0, index), password: decoded.slice(index + 1) };
  } catch {
    return null;
  }
}

function assertBasicAuth(req, login, password) {
  const auth = parseBasicAuth(req);
  return Boolean(auth && auth.login === login && auth.password === password);
}

function parseRawBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk.toString('utf8');
    });
    req.on('end', () => resolve(raw));
  });
}

function parseFormBody(raw = '') {
  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries());
}

function recordPaymentEvent(db, event) {
  db.paymentEvents.unshift({
    id: `pe-${randomUUID()}`,
    createdAt: nowIso(),
    ...event,
  });
}

function findOrderByPublicReference(db, reference) {
  const value = String(reference || '').trim();
  if (!value) return null;
  return (db.orders || []).find((item) => item.id === value || String(item.number) === value) || null;
}

function findPaymentByOrderAndProvider(db, orderId, provider) {
  return (db.payments || []).find((item) => item.orderId === orderId && item.provider === provider) || null;
}

function updateOrderPaymentState(order, payment, nextStatus) {
  order.updatedAt = nowIso();
  payment.updatedAt = order.updatedAt;
  payment.status = nextStatus;
  if (nextStatus === 'paid') {
    order.status = order.status === 'completed' ? 'completed' : 'paid';
    order.paymentStatus = 'paid';
    order.paidAt = order.updatedAt;
  } else if (nextStatus === 'cancelled') {
    order.paymentStatus = 'cancelled';
    if (order.status === 'pending_payment') order.status = 'cancelled';
  } else {
    order.paymentStatus = nextStatus;
  }
}

function createPaymeCheckoutUrl(order) {
  if (!env.PAYME_ENABLED || !env.PAYME_MERCHANT_ID) return '';
  const params = [
    `m=${env.PAYME_MERCHANT_ID}`,
    `ac.order_id=${order.number}`,
    `a=${toTiyin(order.amount)}`,
    `l=ru`,
    `c=${resolvePaymentReturnUrl(order)}`,
  ].join(';');
  const encoded = Buffer.from(params).toString('base64url');
  return `${env.PAYME_CHECKOUT_URL.replace(/\/$/, '')}/${encoded}`;
}

function createClickCheckoutUrl(order) {
  if (!env.CLICK_ENABLED || !env.CLICK_MERCHANT_ID || !env.CLICK_SERVICE_ID) return '';
  const url = new URL(env.CLICK_PAYMENT_URL);
  url.searchParams.set('service_id', env.CLICK_SERVICE_ID);
  url.searchParams.set('merchant_id', env.CLICK_MERCHANT_ID);
  if (env.CLICK_MERCHANT_USER_ID) url.searchParams.set('merchant_user_id', env.CLICK_MERCHANT_USER_ID);
  url.searchParams.set('amount', formatClickAmount(order.amount));
  url.searchParams.set('transaction_param', order.number);
  url.searchParams.set('return_url', resolvePaymentReturnUrl(order));
  return url.toString();
}

function createUzumCheckoutUrl(order) {
  if (!env.UZUM_ENABLED || !env.UZUM_PAYMENT_URL_TEMPLATE) return '';
  return env.UZUM_PAYMENT_URL_TEMPLATE
    .replaceAll('{order_id}', encodeURIComponent(order.id))
    .replaceAll('{order_number}', encodeURIComponent(order.number))
    .replaceAll('{amount_tiyin}', String(toTiyin(order.amount)))
    .replaceAll('{amount}', encodeURIComponent(String(order.amount)))
    .replaceAll('{return_url}', encodeURIComponent(resolvePaymentReturnUrl(order)));
}

function getEnabledPaymentMethods() {
  const methods = [];
  if (env.PAYME_ENABLED && env.PAYME_MERCHANT_ID) methods.push({ code: 'payme', title: 'Payme', mode: 'redirect' });
  if (env.CLICK_ENABLED && env.CLICK_MERCHANT_ID && env.CLICK_SERVICE_ID) methods.push({ code: 'click', title: 'Click', mode: 'redirect' });
  if (env.UZUM_ENABLED) methods.push({ code: 'uzum', title: 'Uzum Bank', mode: env.UZUM_PAYMENT_URL_TEMPLATE ? 'redirect' : 'merchant_api' });
  return methods;
}

function buildPaymentSession(order, payment) {
  const checkoutUrl = payment.provider === 'payme'
    ? createPaymeCheckoutUrl(order)
    : payment.provider === 'click'
      ? createClickCheckoutUrl(order)
      : createUzumCheckoutUrl(order);
  return {
    orderId: order.id,
    orderNumber: order.number,
    amount: order.amount,
    payment: {
      id: payment.id,
      provider: payment.provider,
      status: payment.status,
      mode: checkoutUrl ? 'redirect' : 'merchant_api',
      checkoutUrl,
      instructions: checkoutUrl ? '' : 'Платёжный сценарий Uzum Bank активируется после выдачи merchant-параметров и URL/виджета от Uzum Bank.',
    },
  };
}

function computeCatalogAverageRating(products = []) {
  const rated = products.filter((product) => Number(product.reviewsCount || 0) > 0 && Number(product.rating || 0) > 0);
  if (!rated.length) return "Без оценок";
  const weightedTotal = rated.reduce((sum, product) => sum + Number(product.rating || 0) * Number(product.reviewsCount || 0), 0);
  const weight = rated.reduce((sum, product) => sum + Number(product.reviewsCount || 0), 0);
  if (!weight) return "Без оценок";
  return `${(weightedTotal / weight).toFixed(1)} / 5.0`;
}

function pickPromoPlaceholder(index = 0) {
  const placeholders = [
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80",
  ];
  return placeholders[index % placeholders.length];
}

function isMongoEnabled() {
  return Boolean(env.MONGODB_URI && env.MONGODB_DB);
}

async function getMongoDb() {
  if (!isMongoEnabled()) {
    if (env.MONGO_ONLY) {
      throw new Error("Mongo-only mode is enabled, but MONGODB_URI is missing.");
    }
    return null;
  }
  if (mongoState.db) return mongoState.db;
  if (mongoState.promise) return mongoState.promise;

  mongoState.promise = (async () => {
    const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
    await client.connect();
    mongoState.client = client;
    mongoState.db = client.db(env.MONGODB_DB);
    return mongoState.db;
  })();

  try {
    return await mongoState.promise;
  } finally {
    mongoState.promise = null;
  }
}

async function ensureMongoSeed(db) {
  for (const collectionName of collectionNames) {
    const collection = db.collection(collectionName);
    const count = await collection.estimatedDocumentCount();
    if (count > 0) continue;
    const seedKey = seedKeysByCollection[collectionName];
    const docs = seedKey ? jsonClone(seedData[seedKey] || []) : [];
    if (!docs.length) continue;
    await collection.insertMany(
      docs.map((doc, index) => ({
        _id: doc.id || `${collectionName}-${index + 1}`,
        ...doc,
      })),
      { ordered: false },
    );
  }
}

async function replaceMongoCollection(db, collectionName, docs) {
  const collection = db.collection(collectionName);
  await collection.deleteMany({});
  if (!docs.length) return;
  await collection.insertMany(
    docs.map((doc, index) => ({
      _id: doc.id || `${collectionName}-${index + 1}`,
      ...doc,
    })),
    { ordered: false },
  );
}

function hashPassword(password) {
  const salt = randomBytes(12).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored?.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const candidate = scryptSync(password, salt, 64);
  const target = Buffer.from(hash, "hex");
  return candidate.length === target.length && timingSafeEqual(candidate, target);
}

function createToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", env.JWT_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token?.includes(".")) return null;
  const [body, signature] = token.split(".");
  const expected = createHmac("sha256", env.JWT_SECRET).update(body).digest("base64url");
  if (expected !== signature) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function ensureJsonDb() {
  if (existsSync(dbFile)) return;
  const db = {
    categories: jsonClone(seedData.categories),
    products: jsonClone(seedData.products),
    collections: jsonClone(seedData.collections),
    authors: jsonClone(seedData.authors),
    reviews: jsonClone(seedData.reviews),
    blogPosts: jsonClone(seedData.blogPosts),
    faqs: jsonClone(seedData.faqs),
    users: [],
    orders: [],
    payments: [],
    paymentEvents: [],
    botAdmins: [],
    passwordResets: [],
  };
  writeFileSync(dbFile, JSON.stringify(db, null, 2), "utf8");
}

async function loadDb() {
  const mongoDb = await getMongoDb();
  if (!mongoDb) {
    if (env.MONGO_ONLY) {
      throw new Error("Mongo-only mode is enabled. JSON storage fallback is disabled.");
    }
    ensureJsonDb();
    return normalizeDbState(JSON.parse(readFileSync(dbFile, "utf8")));
  }

  await ensureMongoSeed(mongoDb);

  const [categories, products, collections, authors, reviews, blogPosts, faqs, users, orders, payments, paymentEvents, botAdmins, passwordResets] = await Promise.all(
    collectionNames.map(async (collectionName) => {
      const docs = await mongoDb.collection(collectionName).find({}, { projection: { _id: 0 } }).toArray();
      return docs;
    }),
  );

  return normalizeDbState({
    categories,
    products,
    collections,
    authors,
    reviews,
    blogPosts,
    faqs,
    users,
    orders,
    payments,
    paymentEvents,
    botAdmins,
    passwordResets,
  });
}

async function saveDb(db) {
  purgeExpiredRecords(db);
  const mongoDb = await getMongoDb();
  if (!mongoDb) {
    if (env.MONGO_ONLY) {
      throw new Error("Mongo-only mode is enabled. JSON storage fallback is disabled.");
    }
    writeFileSync(dbFile, JSON.stringify(db, null, 2), "utf8");
    return;
  }

  for (const collectionName of collectionNames) {
    await replaceMongoCollection(mongoDb, collectionName, db[collectionName] || []);
  }
}

function sendJson(res, status, payload) {
  if (!res.headersSent) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text, contentType = "text/plain; charset=utf-8") {
  if (!res.headersSent) {
    res.statusCode = status;
    res.setHeader("Content-Type", contentType);
  }
  res.end(text);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk.toString("utf8");
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}


function paymeResponse(id, result = null, error = null) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    ...(error ? { error } : { result }),
  };
}

function paymeError(id, code, message, data = null) {
  return paymeResponse(id, null, { code, message, data });
}

async function handlePaymeWebhook(req, res, db) {
  if (!env.PAYME_LOGIN || !env.PAYME_KEY) {
    sendJson(res, 503, paymeError(null, -32400, 'Payme is not configured'));
    return true;
  }
  if (!assertBasicAuth(req, env.PAYME_LOGIN, env.PAYME_KEY)) {
    sendJson(res, 401, paymeError(null, -32504, 'Недостаточно привилегий'));
    return true;
  }
  const body = await parseBody(req);
  const { method, params = {}, id } = body || {};
  const orderRef = params.account?.order_id || params.account?.order || params.account?.id;
  const order = findOrderByPublicReference(db, orderRef);

  if (method === 'CheckPerformTransaction') {
    if (!order) {
      sendJson(res, 200, paymeError(id, -31050, 'Заказ не найден'));
      return true;
    }
    if (toTiyin(order.amount) !== Number(params.amount || 0)) {
      sendJson(res, 200, paymeError(id, -31001, 'Неверная сумма'));
      return true;
    }
    sendJson(res, 200, paymeResponse(id, { allow: true }));
    return true;
  }

  if (method === 'CreateTransaction') {
    if (!order) {
      sendJson(res, 200, paymeError(id, -31050, 'Заказ не найден'));
      return true;
    }
    if (toTiyin(order.amount) !== Number(params.amount || 0)) {
      sendJson(res, 200, paymeError(id, -31001, 'Неверная сумма'));
      return true;
    }
    let payment = findPaymentByOrderAndProvider(db, order.id, 'payme');
    if (!payment) payment = createPaymentForOrder(db, { ...order, paymentMethod: 'payme' });
    payment.providerReference = String(params.id || payment.providerReference || '');
    payment.externalId = payment.providerReference;
    payment.createdAt = payment.createdAt || nowIso();
    payment.updatedAt = nowIso();
    payment.status = 'created';
    recordPaymentEvent(db, { orderId: order.id, paymentId: payment.id, provider: 'payme', type: 'create_transaction', payload: params });
    await saveDb(db);
    sendJson(res, 200, paymeResponse(id, {
      create_time: new Date(payment.createdAt).getTime(),
      transaction: payment.id,
      state: 1,
    }));
    return true;
  }

  if (method === 'PerformTransaction') {
    const payment = (db.payments || []).find((item) => String(item.providerReference || item.externalId || '') === String(params.id || ''));
    if (!payment) {
      sendJson(res, 200, paymeError(id, -31003, 'Транзакция не найдена'));
      return true;
    }
    const targetOrder = (db.orders || []).find((item) => item.id === payment.orderId);
    if (!targetOrder) {
      sendJson(res, 200, paymeError(id, -31050, 'Заказ не найден'));
      return true;
    }
    payment.performTime = Date.now();
    updateOrderPaymentState(targetOrder, payment, 'paid');
    recordPaymentEvent(db, { orderId: targetOrder.id, paymentId: payment.id, provider: 'payme', type: 'perform_transaction', payload: params });
    await saveDb(db);
    await notifyTelegram(targetOrder);
    sendJson(res, 200, paymeResponse(id, {
      transaction: payment.id,
      perform_time: payment.performTime,
      state: 2,
    }));
    return true;
  }

  if (method === 'CancelTransaction') {
    const payment = (db.payments || []).find((item) => String(item.providerReference || item.externalId || '') === String(params.id || ''));
    if (!payment) {
      sendJson(res, 200, paymeError(id, -31003, 'Транзакция не найдена'));
      return true;
    }
    const targetOrder = (db.orders || []).find((item) => item.id === payment.orderId);
    payment.cancelTime = Date.now();
    payment.cancelReason = params.reason || null;
    payment.status = payment.performTime ? 'cancelled_after_paid' : 'cancelled';
    if (targetOrder) updateOrderPaymentState(targetOrder, payment, 'cancelled');
    recordPaymentEvent(db, { orderId: targetOrder?.id || null, paymentId: payment.id, provider: 'payme', type: 'cancel_transaction', payload: params });
    await saveDb(db);
    sendJson(res, 200, paymeResponse(id, {
      transaction: payment.id,
      cancel_time: payment.cancelTime,
      state: payment.performTime ? -2 : -1,
    }));
    return true;
  }

  if (method === 'CheckTransaction') {
    const payment = (db.payments || []).find((item) => String(item.providerReference || item.externalId || '') === String(params.id || ''));
    if (!payment) {
      sendJson(res, 200, paymeError(id, -31003, 'Транзакция не найдена'));
      return true;
    }
    sendJson(res, 200, paymeResponse(id, {
      create_time: new Date(payment.createdAt).getTime(),
      perform_time: payment.performTime || 0,
      cancel_time: payment.cancelTime || 0,
      transaction: payment.id,
      state: payment.status === 'paid' ? 2 : payment.status === 'cancelled' ? -1 : payment.status === 'cancelled_after_paid' ? -2 : 1,
      reason: payment.cancelReason || null,
    }));
    return true;
  }

  if (method === 'GetStatement') {
    const from = Number(params.from || 0);
    const to = Number(params.to || Date.now());
    const transactions = (db.payments || [])
      .filter((item) => item.provider === 'payme')
      .filter((item) => {
        const created = new Date(item.createdAt).getTime();
        return created >= from && created <= to;
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((item) => ({
        id: item.providerReference || item.externalId || item.id,
        time: new Date(item.createdAt).getTime(),
        amount: item.amountTiyin,
        account: { order_id: item.orderNumber },
        create_time: new Date(item.createdAt).getTime(),
        perform_time: item.performTime || 0,
        cancel_time: item.cancelTime || 0,
        transaction: item.id,
        state: item.status === 'paid' ? 2 : item.status === 'cancelled' ? -1 : item.status === 'cancelled_after_paid' ? -2 : 1,
        reason: item.cancelReason || null,
      }));
    sendJson(res, 200, paymeResponse(id, { transactions }));
    return true;
  }

  sendJson(res, 200, paymeError(id, -32601, 'Метод не найден'));
  return true;
}

async function handleClickWebhook(req, res, db) {
  const raw = await parseRawBody(req);
  const params = parseFormBody(raw);
  if (!env.CLICK_SECRET_KEY || !env.CLICK_SERVICE_ID) {
    sendJson(res, 503, { error: -9, error_note: 'Click is not configured' });
    return true;
  }
  if (String(params.service_id) !== String(env.CLICK_SERVICE_ID) || !verifyClickSignature(params)) {
    sendJson(res, 403, { error: -1, error_note: 'SIGN CHECK FAILED' });
    return true;
  }
  const order = findOrderByPublicReference(db, params.merchant_trans_id);
  if (!order) {
    sendJson(res, 200, {
      click_trans_id: params.click_trans_id,
      merchant_trans_id: params.merchant_trans_id,
      merchant_prepare_id: 0,
      error: -5,
      error_note: 'Order not found',
    });
    return true;
  }

  let payment = findPaymentByOrderAndProvider(db, order.id, 'click');
  if (!payment) payment = createPaymentForOrder(db, { ...order, paymentMethod: 'click' });
  payment.providerReference = String(params.click_trans_id || payment.providerReference || '');
  payment.externalId = String(params.click_paydoc_id || payment.externalId || '');
  payment.prepareId = payment.prepareId || Number(String(Date.now()).slice(-9));

  if (Number(params.action) === 0) {
    if (Number(order.amount) !== Number(params.amount || 0)) {
      sendJson(res, 200, { click_trans_id: params.click_trans_id, merchant_trans_id: order.number, merchant_prepare_id: payment.prepareId, error: -2, error_note: 'Incorrect amount' });
      return true;
    }
    payment.status = 'created';
    payment.updatedAt = nowIso();
    recordPaymentEvent(db, { orderId: order.id, paymentId: payment.id, provider: 'click', type: 'prepare', payload: params });
    await saveDb(db);
    sendJson(res, 200, { click_trans_id: params.click_trans_id, merchant_trans_id: order.number, merchant_prepare_id: payment.prepareId, error: 0, error_note: 'Success' });
    return true;
  }

  if (Number(params.action) === 1) {
    if (Number(params.error || 0) === 0) {
      updateOrderPaymentState(order, payment, 'paid');
      payment.confirmId = payment.confirmId || Number(String(Date.now()).slice(-9));
      recordPaymentEvent(db, { orderId: order.id, paymentId: payment.id, provider: 'click', type: 'complete', payload: params });
      await saveDb(db);
      await notifyTelegram(order);
      sendJson(res, 200, { click_trans_id: params.click_trans_id, merchant_trans_id: order.number, merchant_confirm_id: payment.confirmId, error: 0, error_note: 'Success' });
      return true;
    }
    updateOrderPaymentState(order, payment, 'cancelled');
    recordPaymentEvent(db, { orderId: order.id, paymentId: payment.id, provider: 'click', type: 'cancelled', payload: params });
    await saveDb(db);
    sendJson(res, 200, { click_trans_id: params.click_trans_id, merchant_trans_id: order.number, merchant_confirm_id: 0, error: -9, error_note: 'Cancelled' });
    return true;
  }

  sendJson(res, 400, { error: -8, error_note: 'Unsupported action' });
  return true;
}

async function handleUzumWebhook(req, res, db, action) {
  if (!env.UZUM_LOGIN || !env.UZUM_PASSWORD || !env.UZUM_SERVICE_ID) {
    sendJson(res, 503, { status: 'ERROR', message: 'Uzum is not configured' });
    return true;
  }
  if (!assertBasicAuth(req, env.UZUM_LOGIN, env.UZUM_PASSWORD)) {
    sendJson(res, 401, { status: 'ERROR', message: 'Unauthorized' });
    return true;
  }
  const body = await parseBody(req);
  const orderRef = body?.params?.orderNumber || body?.params?.account || body?.params?.orderId || body?.params?.order_id;
  const order = action === 'status' ? (db.orders || []).find((item) => (db.payments || []).some((pay) => pay.orderId === item.id && String(pay.providerReference || '') === String(body.transId || ''))) : findOrderByPublicReference(db, orderRef);

  if (!order && action !== 'status') {
    sendJson(res, 400, { serviceId: Number(env.UZUM_SERVICE_ID), timestamp: body?.timestamp || Date.now(), status: 'FAILED', message: 'Order not found' });
    return true;
  }

  let payment = order ? findPaymentByOrderAndProvider(db, order.id, 'uzum') : null;
  if (order && !payment) payment = createPaymentForOrder(db, { ...order, paymentMethod: 'uzum' });

  if (action === 'check') {
    sendJson(res, 200, { serviceId: Number(env.UZUM_SERVICE_ID), timestamp: body.timestamp, status: 'OK', data: { account: { value: order.number }, fio: { value: order.customerName || 'BOOKSHOP Customer' } } });
    return true;
  }

  if (action === 'create') {
    payment.providerReference = body.transId;
    payment.amountTiyin = Number(body.amount || payment.amountTiyin);
    payment.amount = fromTiyin(payment.amountTiyin);
    payment.status = 'created';
    payment.updatedAt = nowIso();
    order.amount = payment.amount;
    order.updatedAt = payment.updatedAt;
    recordPaymentEvent(db, { orderId: order.id, paymentId: payment.id, provider: 'uzum', type: 'create', payload: body });
    await saveDb(db);
    sendJson(res, 200, { serviceId: Number(env.UZUM_SERVICE_ID), transId: body.transId, status: 'CREATED', transTime: Date.now(), data: { account: { value: order.number }, fio: { value: order.customerName || '' } }, amount: payment.amountTiyin });
    return true;
  }

  if (action === 'confirm') {
    const targetPayment = (db.payments || []).find((item) => item.provider === 'uzum' && String(item.providerReference || '') === String(body.transId || '')) || payment;
    const targetOrder = order || (targetPayment ? (db.orders || []).find((item) => item.id === targetPayment.orderId) : null);
    if (!targetPayment || !targetOrder) {
      sendJson(res, 400, { status: 'FAILED', message: 'Transaction not found' });
      return true;
    }
    updateOrderPaymentState(targetOrder, targetPayment, 'paid');
    recordPaymentEvent(db, { orderId: targetOrder.id, paymentId: targetPayment.id, provider: 'uzum', type: 'confirm', payload: body });
    await saveDb(db);
    await notifyTelegram(targetOrder);
    sendJson(res, 200, { serviceId: Number(env.UZUM_SERVICE_ID), transId: body.transId, status: 'CONFIRMED', confirmTime: Date.now(), data: { account: { value: targetOrder.number }, fio: { value: targetOrder.customerName || '' } }, amount: targetPayment.amountTiyin });
    return true;
  }

  if (action === 'reverse') {
    const targetPayment = (db.payments || []).find((item) => item.provider === 'uzum' && String(item.providerReference || '') === String(body.transId || '')) || payment;
    const targetOrder = order || (targetPayment ? (db.orders || []).find((item) => item.id === targetPayment.orderId) : null);
    if (!targetPayment || !targetOrder) {
      sendJson(res, 400, { status: 'FAILED', message: 'Transaction not found' });
      return true;
    }
    updateOrderPaymentState(targetOrder, targetPayment, 'cancelled');
    recordPaymentEvent(db, { orderId: targetOrder.id, paymentId: targetPayment.id, provider: 'uzum', type: 'reverse', payload: body });
    await saveDb(db);
    sendJson(res, 200, { serviceId: Number(env.UZUM_SERVICE_ID), transId: body.transId, status: 'REVERSED', reverseTime: Date.now(), data: { account: { value: targetOrder.number }, fio: { value: targetOrder.customerName || '' } }, amount: targetPayment.amountTiyin });
    return true;
  }

  if (action === 'status') {
    const targetPayment = (db.payments || []).find((item) => item.provider === 'uzum' && String(item.providerReference || '') === String(body.transId || ''));
    const targetOrder = targetPayment ? (db.orders || []).find((item) => item.id === targetPayment.orderId) : null;
    if (!targetPayment || !targetOrder) {
      sendJson(res, 400, { status: 'FAILED', message: 'Transaction not found' });
      return true;
    }
    sendJson(res, 200, { serviceId: Number(env.UZUM_SERVICE_ID), transId: body.transId, status: targetPayment.status === 'paid' ? 'CONFIRMED' : targetPayment.status === 'cancelled' ? 'FAILED' : 'CREATED', transTime: new Date(targetPayment.createdAt).getTime(), confirmTime: targetOrder.paidAt ? new Date(targetOrder.paidAt).getTime() : null, reverseTime: targetPayment.status === 'cancelled' ? new Date(targetPayment.updatedAt).getTime() : null, data: { account: { value: targetOrder.number }, fio: { value: targetOrder.customerName || '' } }, amount: targetPayment.amountTiyin });
    return true;
  }

  return false;
}

function resolveUser(req, db) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const payload = verifyToken(token);
  if (!payload?.sub) return null;
  if (payload.role === "admin") {
    return {
      id: "admin-user",
      email: env.ADMIN_EMAIL,
      role: "admin",
      firstName: "BOOKSHOP",
      lastName: "Admin",
      phone: "+998 90 123 45 67",
      city: "Tashkent",
      addressLine: "",
      birthDate: "",
      gender: "",
      createdAt: new Date().toISOString(),
    };
  }
  return db.users.find((user) => user.id === payload.sub) || null;
}

function requireUser(req, res, db) {
  const user = resolveUser(req, db);
  if (!user) {
    sendJson(res, 401, { message: "Unauthorized" });
    return null;
  }
  return user;
}

function requireAdmin(req, res, db) {
  const user = requireUser(req, res, db);
  if (!user) return null;
  if (user.role !== "admin") {
    sendJson(res, 403, { message: "Admin access required" });
    return null;
  }
  return user;
}

function getStorefrontProducts(db) {
  const publishedProducts = db.products.filter((product) => product.published !== false);
  const realProducts = publishedProducts.filter((product) => product.source !== "seed");
  return realProducts.length ? realProducts : publishedProducts;
}

function getStorefrontCategories(db) {
  const products = getStorefrontProducts(db);
  const usedSlugs = new Set(products.map((product) => product.categorySlug).filter(Boolean));
  const matchedCategories = db.categories.filter((category) => usedSlugs.has(category.slug));
  if (matchedCategories.length) return matchedCategories;
  return buildFallbackCategoriesFromProducts(products);
}

function applyProductFilters(db, query) {
  let products = getStorefrontProducts(db);
  const search = (query.get("search") || "").toLowerCase().trim();
  const category = query.get("category") || "";
  const filter = query.get("filter") || "";
  const sort = query.get("sort") || "popularity";
  const minPrice = Number(query.get("minPrice") || 0);
  const maxPrice = Number(query.get("maxPrice") || 0);

  if (search) {
    products = products.filter((product) => [product.title, product.author, product.isbn].join(" ").toLowerCase().includes(search));
  }
  if (category) {
    products = products.filter((product) => product.categorySlug === category);
  }
  if (filter === "bestseller") {
    products = products.filter((product) => product.featured?.bestseller);
  }
  if (filter === "new") {
    products = products.filter((product) => product.featured?.newArrival);
  }
  if (filter === "discount") {
    products = products.filter((product) => product.oldPrice && product.oldPrice > product.price);
  }
  if (minPrice > 0) {
    products = products.filter((product) => Number(product.price || 0) >= minPrice);
  }
  if (maxPrice > 0) {
    products = products.filter((product) => Number(product.price || 0) <= maxPrice);
  }

  if (sort === "new") products.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime() || b.year - a.year);
  else if (sort === "price-asc") products.sort((a, b) => a.price - b.price || Number(b.inStock) - Number(a.inStock));
  else if (sort === "price-desc") products.sort((a, b) => b.price - a.price || Number(b.inStock) - Number(a.inStock));
  else if (sort === "alphabetical") products.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  else if (sort === "least-popular") products.sort((a, b) => (a.reviewsCount || 0) - (b.reviewsCount || 0) || a.price - b.price);
  else products.sort((a, b) => Number(b.inStock) - Number(a.inStock) || Number(b.price > 0) - Number(a.price > 0) || (b.reviewsCount || 0) - (a.reviewsCount || 0) || b.price - a.price);

  return products;
}

function publicHomePayload(db) {
  const published = getStorefrontProducts(db);
  const fallbackEditorial = (db.products || []).filter((product) => product.source === "seed" && product.published !== false);
  const qualityPublished = published.filter((product) => Number(product.price || 0) > 0 && product.inStock);
  const curatedSource = qualityPublished.length >= 4 ? qualityPublished : fallbackEditorial.length ? fallbackEditorial : published;
  const sortedByPopularity = [...curatedSource].sort((a, b) => Number(b.inStock) - Number(a.inStock) || Number(b.price > 0) - Number(a.price > 0) || Number(b.reviewsCount || 0) - Number(a.reviewsCount || 0) || Number(b.price || 0) - Number(a.price || 0) || String(a.title).localeCompare(String(b.title), "ru"));
  const sortedByNovelty = [...curatedSource].sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime() || Number(b.year || 0) - Number(a.year || 0));

  const bestsellers = curatedSource.filter((product) => product.featured?.bestseller);
  if (bestsellers.length < 5) {
    for (const product of sortedByPopularity) {
      if (!bestsellers.find((item) => item.id === product.id)) bestsellers.push(product);
      if (bestsellers.length >= 5) break;
    }
  }

  const newArrivals = curatedSource.filter((product) => product.featured?.newArrival);
  if (newArrivals.length < 5) {
    for (const product of sortedByNovelty) {
      if (!newArrivals.find((item) => item.id === product.id)) newArrivals.push(product);
      if (newArrivals.length >= 5) break;
    }
  }

  const featuredSearch = sortedByPopularity.slice(0, 4).map((product, index) => ({
    ...product,
    images: product.images?.length ? product.images : [pickPromoPlaceholder(index)],
  }));

  return {
    categories: getStorefrontCategories(db),
    collections: db.collections,
    authors: db.authors,
    reviews: [],
    bestsellers: bestsellers.slice(0, 5),
    newArrivals: newArrivals.slice(0, 5),
    featuredSearch,
    heroStats: {
      catalogCount: `${published.length.toLocaleString("ru-RU")}+`,
      delivery: "1–3 дня",
      rating: computeCatalogAverageRating(published),
    },
  };
}

function findMime(file) {
  const extension = extname(file).toLowerCase();
  if (extension === ".js") return "application/javascript; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".ico") return "image/x-icon";
  return "text/html; charset=utf-8";
}

function serveFile(res, filePath) {
  if (!existsSync(filePath)) return false;
  const data = readFileSync(filePath);
  sendText(res, 200, data, findMime(filePath));
  return true;
}

let telegramBridge = null;

async function notifyTelegram(order) {
  if (!telegramBridge) return;
  await telegramBridge.notifyOrderPaid(order).catch(() => undefined);
}

function createOrderFromCheckout(db, body, user) {
  const items = Array.isArray(body.items) ? body.items.filter((item) => item && item.productId && Number(item.quantity) > 0) : [];
  const amount = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const now = nowIso();
  const order = {
    id: `ord-${randomUUID()}`,
    number: createPublicOrderNumber(db),
    userId: user?.id || null,
    email: user?.email || String(body.email || '').trim(),
    createdAt: now,
    updatedAt: now,
    status: 'pending_payment',
    paymentStatus: 'pending',
    paymentMethod: String(body.paymentMethod || 'payme').toLowerCase(),
    currency: 'UZS',
    amount,
    items,
    customerName: String(body.fullName || '').trim(),
    phone: String(body.phone || '').trim(),
    address: String(body.address || '').trim(),
    note: String(body.note || '').trim(),
  };
  db.orders.unshift(order);
  return order;
}

function createPaymentForOrder(db, order) {
  const now = nowIso();
  const payment = {
    id: `pay-${randomUUID()}`,
    orderId: order.id,
    orderNumber: order.number,
    provider: order.paymentMethod,
    status: 'pending',
    amount: order.amount,
    amountTiyin: toTiyin(order.amount),
    currency: 'UZS',
    providerReference: null,
    externalId: null,
    checkoutUrl: '',
    createdAt: now,
    updatedAt: now,
  };
  db.payments.unshift(payment);
  recordPaymentEvent(db, { orderId: order.id, paymentId: payment.id, provider: payment.provider, type: 'created', payload: { amount: payment.amount, amountTiyin: payment.amountTiyin } });
  return payment;
}

function clickDigest(timestamp, secretKey) {
  return createHash('sha1').update(`${timestamp}${secretKey}`).digest('hex');
}

function verifyClickSignature(params) {
  if (String(params.action) === '0') {
    const prepareSource = `${params.click_trans_id || ''}${params.service_id || ''}${env.CLICK_SECRET_KEY || ''}${params.merchant_trans_id || ''}${params.amount || ''}${params.action || ''}${params.sign_time || ''}`;
    return createHash('md5').update(prepareSource).digest('hex') === String(params.sign_string || '').toLowerCase();
  }
  const source = `${params.click_trans_id || ''}${params.service_id || ''}${env.CLICK_SECRET_KEY || ''}${params.merchant_trans_id || ''}${params.merchant_prepare_id || ''}${params.amount || ''}${params.action || ''}${params.sign_time || ''}`;
  return createHash('md5').update(source).digest('hex') === String(params.sign_string || '').toLowerCase();
}

function buildClickAuthHeader() {
  const ts = Math.floor(Date.now() / 1000);
  return `${env.CLICK_MERCHANT_USER_ID}:${clickDigest(ts, env.CLICK_SECRET_KEY)}:${ts}`;
}

async function createClickInvoice(payment, order) {
  if (!env.CLICK_ENABLED || !env.CLICK_MERCHANT_USER_ID || !env.CLICK_SECRET_KEY || !env.CLICK_SERVICE_ID) {
    return null;
  }
  const response = await fetch('https://api.click.uz/v2/merchant/invoice/create', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Auth: buildClickAuthHeader(),
    },
    body: JSON.stringify({
      service_id: Number(env.CLICK_SERVICE_ID),
      amount: Number(order.amount),
      phone_number: String(order.phone || '').replace(/\D/g, ''),
      merchant_trans_id: order.number,
    }),
  }).catch(() => null);
  if (!response?.ok) return null;
  const payload = await response.json().catch(() => null);
  if (!payload || Number(payload.error_code || 0) !== 0) return null;
  payment.externalId = String(payload.invoice_id || '');
  payment.providerReference = payment.externalId;
  return payload;
}

async function initializePaymentSession(db, order, payment) {
  if (payment.provider === 'click') {
    await createClickInvoice(payment, order);
  }
  const session = buildPaymentSession(order, payment);
  payment.checkoutUrl = session.payment.checkoutUrl || '';
  payment.updatedAt = nowIso();
  recordPaymentEvent(db, { orderId: order.id, paymentId: payment.id, provider: payment.provider, type: 'session_created', payload: session.payment });
  return session;
}

function decodeJwtPayload(token) {
  if (!token?.includes(".")) return null;
  try {
    const [, body] = token.split(".");
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function tokenExpiresSoon(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= Number(payload.exp) * 1000 - 60_000;
}

function buildBillzCandidatePaths(primaryPath, extraPaths = []) {
  const set = new Set([primaryPath, ...extraPaths].filter(Boolean));
  return Array.from(set);
}

function withBillzFilters(path) {
  const target = new URL(path, env.BILLZ_BASE_URL);
  if (env.BILLZ_COMPANY_ID && !target.searchParams.has("company_id")) {
    target.searchParams.set("company_id", env.BILLZ_COMPANY_ID);
  }
  if (env.BILLZ_STORE_ID) {
    if (!target.searchParams.has("store_id")) target.searchParams.set("store_id", env.BILLZ_STORE_ID);
    if (!target.searchParams.has("shop_id")) target.searchParams.set("shop_id", env.BILLZ_STORE_ID);
  }
  return target;
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function extractNumber(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
}

function collectPathCandidates(input, matcher, path = [], bucket = []) {
  if (input === null || input === undefined) return bucket;
  if (Array.isArray(input)) {
    input.forEach((item, index) => collectPathCandidates(item, matcher, [...path, String(index)], bucket));
    return bucket;
  }
  if (typeof input === "object") {
    Object.entries(input).forEach(([key, value]) => {
      const nextPath = [...path, key];
      if (matcher(key, value, nextPath)) {
        bucket.push({ path: nextPath.join("."), value });
      }
      collectPathCandidates(value, matcher, nextPath, bucket);
    });
  }
  return bucket;
}

function findNumberDeep(input, keyPatterns, fallback = 0) {
  const candidates = collectPathCandidates(
    input,
    (key, value, path) => {
      const joined = path.join(".").toLowerCase();
      if (!keyPatterns.some((pattern) => pattern.test(joined))) return false;
      const numeric = Number(value);
      return Number.isFinite(numeric);
    },
  );

  for (const candidate of candidates) {
    const numeric = Number(candidate.value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return fallback;
}

function findStringDeep(input, keyPatterns) {
  const candidates = collectPathCandidates(
    input,
    (key, value, path) => {
      const joined = path.join(".").toLowerCase();
      return keyPatterns.some((pattern) => pattern.test(joined)) && typeof value === "string" && value.trim();
    },
  );

  for (const candidate of candidates) {
    const value = String(candidate.value || "").trim();
    if (value) return value;
  }

  return "";
}

function extractString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeImages(rawImages) {
  if (!rawImages) return [];
  const source = Array.isArray(rawImages) ? rawImages : [rawImages];
  const direct = source
    .map((entry) => {
      if (!entry) return "";
      if (typeof entry === "string") return entry;
      return entry.url || entry.src || entry.path || entry.original || entry.preview || entry.medium || entry.thumbnail || "";
    })
    .filter(Boolean);

  const nested = collectPathCandidates(
    rawImages,
    (key, value, path) => {
      const joined = path.join(".").toLowerCase();
      return /(image|photo|picture|preview|cover|thumbnail|medium|original|url)/i.test(joined) && typeof value === "string" && value.trim();
    },
  )
    .map((entry) => String(entry.value).trim())
    .filter(Boolean);

  return Array.from(new Set([...direct, ...nested]));
}

function resolveCategoryName(item) {
  const category = item.category;
  const categories = Array.isArray(item.categories) ? item.categories : [];
  return extractString(
    item.category_name,
    item.category_title,
    typeof category === "string" ? category : "",
    category?.name,
    category?.title,
    categories[0]?.name,
    categories[0]?.title,
    item.group_name,
    findStringDeep(item, [/(^|\.)(category|categories|group|section)(\.|$)/i]),
  ) || "Категория";
}

function pickRemoteDescription(item) {
  const description = extractString(item.description, item.long_description, item.short_description, item.annotation, findStringDeep(item, [/(description|annotation|summary|content|body)/i]));
  const cleanDescription = stripHtml(description);
  return cleanDescription || "Описание книги будет дополнено в ближайшее время. Пока можно ориентироваться на основные характеристики и наличие товара.";
}

function mapBillzProduct(item) {
  const title = extractString(item.title, item.name, item.product_name, item.full_name) || "BILLZ product";
  const rawImages = item.images || item.photos || item.photo_urls || item.photo || item.image || item.gallery || [];
  const images = normalizeImages(rawImages);
  const remoteCreatedAt = extractString(item.created_at, item.createdAt, findStringDeep(item, [/(created_at|createdat|date_created)/i]));
  const remoteUpdatedAt = extractString(item.updated_at, item.updatedAt, item.modified_at, findStringDeep(item, [/(updated_at|updatedat|modified_at|date_updated)/i]));
  const createdAt = remoteCreatedAt || new Date().toISOString();
  const updatedAt = remoteUpdatedAt || createdAt;
  const price = extractNumber(
    item.price,
    item.sale_price,
    item.retail_price,
    item.current_price,
    item.salePrice,
    item.retailPrice,
    item.selling_price,
    item.actual_price,
    findNumberDeep(item, [/(^|\.)(price|sale_price|retail_price|selling_price|actual_price|current_price|shop_price|price_value)(\.|$)/i]),
  );
  const oldPriceValue = extractNumber(item.old_price, item.compare_at_price, item.base_price, item.oldPrice, findNumberDeep(item, [/(old_price|compare_at_price|base_price|original_price|full_price)/i]));
  const oldPrice = oldPriceValue > price ? oldPriceValue : null;
  const stock = extractNumber(item.stock, item.quantity, item.remains, item.available_qty, item.available_quantity, item.balance, item.qty, findNumberDeep(item, [/(stock|quantity|remains|available_qty|available_quantity|balance|qty|count)/i]));
  const rawId = item.id || item.product_id || item.uuid || item.uid || item.sku || randomUUID();
  const id = String(rawId);
  const categoryName = resolveCategoryName(item);
  const description = pickRemoteDescription(item);
  const categoryDescriptor = inferCategoryDescriptor({ categoryName, title, description });
  const summary = stripHtml(extractString(item.short_description, item.annotation, item.description, findStringDeep(item, [/(short_description|annotation|summary|subtitle)/i]))) || "Книга доступна в каталоге BOOKSHOP.";

  return {
    id: `billz-${id}`,
    externalId: id,
    source: "billz",
    slug: slugify(`${title}-${id}`),
    title,
    author: extractString(item.author, item.brand, item.manufacturer) || "Не указан",
    price,
    oldPrice,
    rating: 0,
    reviewsCount: 0,
    stock,
    inStock: stock > 0,
    published: item.published !== false,
    categorySlug: categoryDescriptor.slug,
    categoryName: categoryDescriptor.name.ru,
    language: extractString(item.language, item.lang, findStringDeep(item, [/(language|lang)/i])) || "Русский",
    publisher: extractString(item.publisher, item.vendor, item.brand, findStringDeep(item, [/(publisher|vendor|brand)/i])) || "BILLZ 2",
    isbn: extractString(item.isbn, item.barcode, item.sku) || `BILLZ-${id}`,
    coverType: extractString(item.cover, item.cover_type) || "Твёрдый переплёт",
    pages: extractNumber(item.pages, item.page_count, 240),
    year: extractNumber(item.year, item.published_year, new Date().getFullYear()),
    description,
    summary,
    images: images.length ? images : [pickPromoPlaceholder(Number(id.replace(/\D/g, "") || 0))],
    format: extractString(item.format) || "60x90/16",
    weight: extractString(item.weight) || "—",
    featured: {
      bestseller: Boolean(item.is_bestseller),
      newArrival: Boolean(item.is_new) || Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 60 * 24 * 21,
      collectionSlugs: [],
    },
    createdAt,
    updatedAt,
    lastSyncedAt: new Date().toISOString(),
  };
}

function mergeBillzProduct(existingProduct, incomingProduct) {
  if (!existingProduct) return incomingProduct;

  const localUploadImages = (existingProduct.images || []).filter((image) => String(image).startsWith("/uploads/"));
  const mergedImages = Array.from(new Set([...localUploadImages, ...(incomingProduct.images || [])]));

  return {
    ...incomingProduct,
    slug: existingProduct.slug || incomingProduct.slug,
    createdAt: existingProduct.createdAt || incomingProduct.createdAt || new Date().toISOString(),
    updatedAt: incomingProduct.updatedAt || new Date().toISOString(),
    published: typeof existingProduct.published === "boolean" ? existingProduct.published : incomingProduct.published,
    images: mergedImages,
    featured: {
      ...incomingProduct.featured,
      collectionSlugs: existingProduct.featured?.collectionSlugs || incomingProduct.featured?.collectionSlugs || [],
    },
    lastSyncedAt: new Date().toISOString(),
  };
}

function mapBillzCategory(item) {
  const name = extractString(item.name, item.title, item.category_name) || "Категория";
  const descriptor = inferCategoryDescriptor({ categoryName: name, title: name });
  return {
    id: `billz-cat-${item.id || descriptor.slug}`,
    slug: descriptor.slug,
    icon: descriptor.icon,
    accent: descriptor.accent,
    name: descriptor.name,
    description: descriptor.description,
  };
}

function buildFallbackCategoriesFromProducts(products) {
  const map = new Map();
  for (const product of products) {
    const descriptor = inferCategoryDescriptor({
      categoryName: product.categoryName,
      title: product.title,
      author: product.author,
      description: product.description || product.summary || "",
      fallbackSlug: product.categorySlug,
    });
    if (map.has(descriptor.slug)) continue;
    map.set(descriptor.slug, {
      id: `billz-cat-${descriptor.slug}`,
      slug: descriptor.slug,
      icon: descriptor.icon,
      accent: descriptor.accent,
      name: descriptor.name,
      description: descriptor.description,
    });
  }
  return Array.from(map.values());
}

function extractPagination(payload) {
  const currentPage = extractNumber(payload?.meta?.current_page, payload?.pagination?.current_page, payload?.page, 1) || 1;
  const lastPage = extractNumber(payload?.meta?.last_page, payload?.meta?.page_count, payload?.pagination?.total_pages, payload?.pages, currentPage) || currentPage;
  const perPage = extractNumber(payload?.meta?.per_page, payload?.pagination?.per_page, payload?.per_page, 0);
  return { currentPage, lastPage, perPage };
}

async function fetchBillzPayload(url, accessToken) {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
  if (env.BILLZ_COMPANY_ID) headers["X-Company-Id"] = env.BILLZ_COMPANY_ID;
  if (env.BILLZ_STORE_ID) headers["X-Store-Id"] = env.BILLZ_STORE_ID;

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(env.BILLZ_REQUEST_TIMEOUT_MS),
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload?.message || payload?.error || response.statusText;
    const error = new Error(`BILLZ request failed (${response.status}): ${message}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function resolveBillzAccessToken() {
  if (env.BILLZ_ACCESS_TOKEN && !tokenExpiresSoon(env.BILLZ_ACCESS_TOKEN)) {
    return env.BILLZ_ACCESS_TOKEN;
  }

  if (billzTokenCache.value && Date.now() < billzTokenCache.exp - 60_000) {
    return billzTokenCache.value;
  }

  if (!env.BILLZ_SECRET_TOKEN) {
    throw new Error("BILLZ 2 access token is missing. Fill BILLZ_ACCESS_TOKEN or BILLZ_SECRET_TOKEN in .env.");
  }

  const response = await fetch(env.BILLZ_AUTH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ secret_token: env.BILLZ_SECRET_TOKEN }),
    signal: AbortSignal.timeout(env.BILLZ_REQUEST_TIMEOUT_MS),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`BILLZ auth failed (${response.status}): ${payload?.message || payload?.error || response.statusText}`);
  }

  const accessToken = payload?.data?.access_token || payload?.access_token || "";
  if (!accessToken) {
    throw new Error("BILLZ auth response did not contain access_token.");
  }

  const jwtPayload = decodeJwtPayload(accessToken);
  billzTokenCache.value = accessToken;
  billzTokenCache.exp = jwtPayload?.exp ? Number(jwtPayload.exp) * 1000 : Date.now() + 15 * 60_000;
  return accessToken;
}

async function fetchBillzCollection(label, candidatePaths, accessToken) {
  let lastError = null;

  for (const candidate of candidatePaths) {
    const firstUrl = withBillzFilters(candidate);
    try {
      const firstPayload = await fetchBillzPayload(firstUrl, accessToken);
      let items = extractList(firstPayload);
      const pagination = extractPagination(firstPayload);

      if (pagination.lastPage > pagination.currentPage) {
        const allItems = [...items];
        const lastPage = Math.min(pagination.lastPage, 20);
        for (let page = pagination.currentPage + 1; page <= lastPage; page += 1) {
          const nextUrl = new URL(firstUrl.toString());
          nextUrl.searchParams.set("page", String(page));
          if (pagination.perPage && !nextUrl.searchParams.has("per_page")) {
            nextUrl.searchParams.set("per_page", String(pagination.perPage));
          }
          const nextPayload = await fetchBillzPayload(nextUrl, accessToken);
          allItems.push(...extractList(nextPayload));
        }
        items = allItems;
      }

      return {
        items,
        pathUsed: firstUrl.pathname + firstUrl.search,
      };
    } catch (error) {
      lastError = error;
      if (error?.status === 401 && env.BILLZ_SECRET_TOKEN) {
        billzTokenCache.value = "";
        billzTokenCache.exp = 0;
      }
    }
  }

  throw lastError || new Error(`BILLZ ${label} request failed.`);
}

async function syncBillz(db) {
  if (!env.BILLZ_ENABLED) {
    return { imported: 0, message: "BILLZ sync skipped: BILLZ_ENABLED=false" };
  }

  const accessToken = await resolveBillzAccessToken();
  const productPaths = buildBillzCandidatePaths(env.BILLZ_PRODUCTS_PATH, env.BILLZ_PRODUCTS_PATHS);
  const categoryPaths = buildBillzCandidatePaths(env.BILLZ_CATEGORIES_PATH, env.BILLZ_CATEGORIES_PATHS);

  const [productResult, categoryResult] = await Promise.all([
    fetchBillzCollection("products", productPaths, accessToken),
    fetchBillzCollection("categories", categoryPaths, accessToken).catch(() => ({ items: [], pathUsed: "" })),
  ]);

  const existingBillzProducts = new Map(
    db.products
      .filter((product) => product.source === "billz" && product.externalId)
      .map((product) => [String(product.externalId), product]),
  );

  const mappedProducts = productResult.items
    .map(mapBillzProduct)
    .filter((item) => item.price >= 0)
    .map((item) => mergeBillzProduct(existingBillzProducts.get(String(item.externalId)), item));

  let mappedCategories = categoryResult.items.map(mapBillzCategory).filter((item) => !GENERIC_CATEGORY_SLUGS.has(item.slug));
  const fallbackCategories = buildFallbackCategoriesFromProducts(mappedProducts);
  if (!mappedCategories.length || mappedCategories.length < 3) {
    mappedCategories = fallbackCategories;
  } else {
    for (const fallbackCategory of fallbackCategories) {
      if (!mappedCategories.find((item) => item.slug === fallbackCategory.slug)) mappedCategories.push(fallbackCategory);
    }
  }

  const preservedLocalProducts = db.products.filter((product) => product.source !== "billz");
  db.products = [...preservedLocalProducts, ...mappedProducts];

  const preservedCategories = db.categories.filter((category) => !String(category.id).startsWith("billz-cat-"));
  db.categories = [...preservedCategories, ...mappedCategories];
  await saveDb(db);

  const parts = [`BILLZ 2 sync completed: ${mappedProducts.length} products imported.`];
  if (productResult.pathUsed) parts.push(`Products path: ${productResult.pathUsed}`);
  if (categoryResult.pathUsed) parts.push(`Categories path: ${categoryResult.pathUsed}`);

  return {
    imported: mappedProducts.length,
    message: parts.join(" "),
  };
}

function ensureUserFavorites(user) {
  if (!Array.isArray(user.favoriteIds)) user.favoriteIds = [];
  return user.favoriteIds;
}

function getProductReviews(db, product) {
  if (!product) return [];
  return (db.reviews || [])
    .filter((review) => review.productId === product.id || review.productSlug === product.slug)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
}

function recalculateProductReviewStats(db, product) {
  if (!product) return;
  const reviews = getProductReviews(db, product).filter((review) => review.published !== false);
  product.reviewsCount = reviews.length;
  product.rating = reviews.length
    ? Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1))
    : 0;
}

function getCategoryLabel(db, categorySlug, fallback = "Категория") {
  return db.categories.find((item) => item.slug === categorySlug)?.name?.ru || fallback;
}

function createProfileFromUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    city: user.city || "",
    addressLine: user.addressLine || "",
    birthDate: user.birthDate || "",
    gender: user.gender || "",
    avatar: user.avatar || "",
    favoriteIds: Array.isArray(user.favoriteIds) ? user.favoriteIds : [],
    createdAt: user.createdAt,
  };
}

async function handle(req, res) {

  const url = new URL(req.url, env.APP_BASE_URL);
  const pathname = url.pathname;
  const db = await loadDb();

  if (pathname === "/api/health") {
    sendJson(res, 200, { ok: true, ts: new Date().toISOString() });
    return;
  }

  if (pathname === "/api/home" && req.method === "GET") {
    sendJson(res, 200, publicHomePayload(db));
    return;
  }

  if (pathname === "/api/products" && req.method === "GET") {
    const products = applyProductFilters(db, url.searchParams);
    sendJson(res, 200, { products, total: products.length, page: 1, pages: 1, categories: getStorefrontCategories(db) });
    return;
  }

  if (pathname.startsWith("/api/products/") && !pathname.endsWith("/reviews") && req.method === "GET") {
    const slug = decodeURIComponent(pathname.split("/").pop() || "");
    const product = getStorefrontProducts(db).find((item) => item.slug === slug || item.id === slug || String(item.externalId || "") === slug);
    if (!product) {
      sendJson(res, 404, { message: "Product not found" });
      return;
    }
    sendJson(res, 200, product);
    return;
  }

  if (pathname.startsWith("/api/products/") && pathname.endsWith("/reviews") && req.method === "GET") {
    const slug = decodeURIComponent(pathname.split("/")[3] || "");
    const product = getStorefrontProducts(db).find((item) => item.slug === slug || item.id === slug || String(item.externalId || "") === slug);
    if (!product) {
      sendJson(res, 404, { message: "Product not found" });
      return;
    }
    sendJson(res, 200, getProductReviews(db, product).filter((review) => review.published !== false));
    return;
  }

  if (pathname.startsWith("/api/products/") && pathname.endsWith("/reviews") && req.method === "POST") {
    const user = requireUser(req, res, db);
    if (!user) return;
    const slug = decodeURIComponent(pathname.split("/")[3] || "");
    const product = getStorefrontProducts(db).find((item) => item.slug === slug || item.id === slug || String(item.externalId || "") === slug);
    if (!product) {
      sendJson(res, 404, { message: "Product not found" });
      return;
    }
    const body = await parseBody(req);
    const rating = Math.max(1, Math.min(5, Number(body.rating || 0)));
    const textValue = String(body.text || "").trim();
    if (!rating || !textValue) {
      sendJson(res, 400, { message: "Rating and review text are required" });
      return;
    }
    const existing = (db.reviews || []).find((item) => item.productId === product.id && item.userId === user.id);
    const review = existing || {
      id: `review-${randomUUID()}`,
      productId: product.id,
      productSlug: product.slug,
      userId: user.id,
      customerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      city: user.city || "Tashkent",
      createdAt: new Date().toISOString(),
      published: true,
    };
    review.rating = rating;
    review.text = textValue;
    review.dateLabel = new Date().toLocaleDateString("ru-RU");
    review.updatedAt = new Date().toISOString();
    if (!existing) db.reviews.unshift(review);
    recalculateProductReviewStats(db, product);
    await saveDb(db);
    sendJson(res, 200, review);
    return;
  }

  if (pathname === "/api/search/suggest" && req.method === "GET") {
    const q = (url.searchParams.get("q") || "").toLowerCase().trim();
    const suggestions = getStorefrontProducts(db)
      .filter((item) => [item.title, item.author, item.isbn].join(" ").toLowerCase().includes(q))
      .slice(0, 6)
      .map((item) => ({ id: item.id, slug: item.slug, title: item.title, author: item.author, price: item.price, image: item.images?.[0] || "" }));
    sendJson(res, 200, suggestions);
    return;
  }

  if (pathname === "/api/collections" && req.method === "GET") {
    sendJson(res, 200, db.collections);
    return;
  }

  if (pathname.startsWith("/api/collections/") && req.method === "GET") {
    const slug = pathname.split("/").pop();
    const collection = db.collections.find((item) => item.slug === slug);
    if (!collection) {
      sendJson(res, 404, { message: "Collection not found" });
      return;
    }
    const products = getStorefrontProducts(db).filter((item) => collection.productSlugs.includes(item.slug));
    sendJson(res, 200, { collection, products });
    return;
  }

  if (pathname === "/api/blog/posts" && req.method === "GET") {
    sendJson(res, 200, db.blogPosts);
    return;
  }

  if (pathname.startsWith("/api/blog/posts/") && req.method === "GET") {
    const slug = pathname.split("/").pop();
    const post = db.blogPosts.find((item) => item.slug === slug);
    if (!post) {
      sendJson(res, 404, { message: "Blog post not found" });
      return;
    }
    sendJson(res, 200, post);
    return;
  }

  if (pathname === "/api/faqs" && req.method === "GET") {
    sendJson(res, 200, db.faqs);
    return;
  }

  if (pathname === "/api/auth/register" && req.method === "POST") {
    const body = await parseBody(req);
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    if (!email || !password) {
      sendJson(res, 400, { message: "Email and password are required" });
      return;
    }
    if (db.users.some((user) => user.email === email)) {
      sendJson(res, 409, { message: "User already exists" });
      return;
    }
    const user = {
      id: randomUUID(),
      email,
      passwordHash: hashPassword(password),
      role: "customer",
      firstName: body.firstName || "",
      lastName: body.lastName || "",
      phone: body.phone || "",
      city: body.city || "Tashkent",
      addressLine: body.addressLine || "",
      birthDate: body.birthDate || "",
      gender: body.gender || "",
      avatar: "",
      favoriteIds: [],
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    await saveDb(db);
    const token = createToken({ sub: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
    sendJson(res, 200, { token, user: createProfileFromUser(user) });
    return;
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    const body = await parseBody(req);
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (email === env.ADMIN_EMAIL.toLowerCase() && password === env.ADMIN_PASSWORD) {
      const admin = { id: "admin-user", email: env.ADMIN_EMAIL, role: "admin", firstName: "BOOKSHOP", lastName: "Admin", phone: "+998 90 123 45 67", city: "Tashkent", birthDate: "", gender: "", avatar: "", createdAt: new Date().toISOString() };
      const token = createToken({ sub: admin.id, role: admin.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
      sendJson(res, 200, { token, user: createProfileFromUser(admin) });
      return;
    }

    const user = db.users.find((item) => item.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      sendJson(res, 401, { message: "Invalid credentials" });
      return;
    }

    const token = createToken({ sub: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
    sendJson(res, 200, { token, user: createProfileFromUser(user) });
    return;
  }

  if (pathname === "/api/auth/forgot-password" && req.method === "POST") {
    const body = await parseBody(req);
    sendJson(res, 200, { message: `Ссылка для восстановления отправлена на ${body.email || "указанный email"} (в демо-режиме только сообщение).` });
    return;
  }

  if (pathname === "/api/auth/google/url" && req.method === "GET") {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_REDIRECT_URI) {
      sendJson(res, 400, { message: "Google OAuth is not configured. Fill GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI in .env." });
      return;
    }
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      include_granted_scopes: "true",
      prompt: "select_account",
    });
    sendJson(res, 200, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
    return;
  }

  if (pathname === "/api/auth/google/callback" && req.method === "GET") {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
      sendText(res, 400, "Google OAuth is not configured.");
      return;
    }

    const code = url.searchParams.get("code");
    if (!code) {
      sendText(res, 400, "Missing OAuth code.");
      return;
    }

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });
      const tokenPayload = await tokenResponse.json();
      const accessToken = tokenPayload.access_token;
      const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
      const profile = await profileResponse.json();
      const email = String(profile.email || "").toLowerCase();
      let user = db.users.find((item) => item.email === email);
      if (!user) {
        user = {
          id: randomUUID(),
          email,
          passwordHash: "",
          role: "customer",
          firstName: profile.given_name || "Google",
          lastName: profile.family_name || "User",
          phone: "",
          city: "Tashkent",
          birthDate: "",
          gender: "",
          avatar: profile.picture || "",
          favoriteIds: [],
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        await saveDb(db);
      }
      const token = createToken({ sub: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
      res.writeHead(302, { Location: `${env.FRONTEND_URL}/auth?token=${encodeURIComponent(token)}` });
      res.end();
    } catch (error) {
      sendText(res, 500, error instanceof Error ? error.message : "Google OAuth failed.");
    }
    return;
  }

  if (pathname === "/api/favorites" && req.method === "GET") {
    const user = requireUser(req, res, db);
    if (!user) return;
    const favoriteIds = ensureUserFavorites(user);
    const favorites = db.products.filter((product) => favoriteIds.includes(product.id) && product.published !== false);
    sendJson(res, 200, favorites);
    return;
  }

  if (pathname.startsWith("/api/favorites/") && req.method === "PUT") {
    const user = requireUser(req, res, db);
    if (!user) return;
    if (user.role === "admin") {
      sendJson(res, 403, { message: "Favorites are available for customer accounts only" });
      return;
    }
    const productId = decodeURIComponent(pathname.split("/").pop() || "");
    const product = db.products.find((item) => item.id === productId || item.slug === productId);
    if (!product) {
      sendJson(res, 404, { message: "Product not found" });
      return;
    }
    const target = db.users.find((item) => item.id === user.id);
    const favoriteIds = ensureUserFavorites(target);
    const exists = favoriteIds.includes(product.id);
    target.favoriteIds = exists ? favoriteIds.filter((item) => item !== product.id) : [...favoriteIds, product.id];
    await saveDb(db);
    sendJson(res, 200, { ok: true, active: !exists, favoriteIds: target.favoriteIds });
    return;
  }

  if (pathname === "/api/profile/me" && req.method === "GET") {
    const user = requireUser(req, res, db);
    if (!user) return;
    sendJson(res, 200, createProfileFromUser(user));
    return;
  }

  if (pathname === "/api/profile/me" && req.method === "PUT") {
    const user = requireUser(req, res, db);
    if (!user) return;
    const body = await parseBody(req);
    if (user.role === "admin") {
      sendJson(res, 200, createProfileFromUser({ ...user, ...body }));
      return;
    }
    const target = db.users.find((item) => item.id === user.id);
    Object.assign(target, body);
    await saveDb(db);
    sendJson(res, 200, createProfileFromUser(target));
    return;
  }

  if (pathname === "/api/payments/providers" && req.method === "GET") {
    sendJson(res, 200, { methods: getEnabledPaymentMethods() });
    return;
  }

  if (pathname === "/api/payments/payme/webhook" && req.method === "POST") {
    await handlePaymeWebhook(req, res, db);
    return;
  }

  if (pathname === "/api/payments/click/webhook" && req.method === "POST") {
    await handleClickWebhook(req, res, db);
    return;
  }

  if (pathname === "/api/payments/uzum/check" && req.method === "POST") {
    await handleUzumWebhook(req, res, db, "check");
    return;
  }

  if (pathname === "/api/payments/uzum/create" && req.method === "POST") {
    await handleUzumWebhook(req, res, db, "create");
    return;
  }

  if (pathname === "/api/payments/uzum/confirm" && req.method === "POST") {
    await handleUzumWebhook(req, res, db, "confirm");
    return;
  }

  if (pathname === "/api/payments/uzum/reverse" && req.method === "POST") {
    await handleUzumWebhook(req, res, db, "reverse");
    return;
  }

  if (pathname === "/api/payments/uzum/status" && req.method === "POST") {
    await handleUzumWebhook(req, res, db, "status");
    return;
  }

  if (pathname === "/api/orders/my" && req.method === "GET") {
    const user = requireUser(req, res, db);
    if (!user) return;
    const orders = user.role === "admin" ? db.orders : db.orders.filter((order) => order.userId === user.id || order.email === user.email);
    sendJson(res, 200, orders);
    return;
  }

  if (pathname.startsWith("/api/orders/") && pathname.endsWith("/status") && req.method === "GET") {
    const id = pathname.split("/")[3];
    const order = (db.orders || []).find((item) => item.id === id || String(item.number) === id);
    if (!order) {
      sendJson(res, 404, { message: "Order not found" });
      return;
    }
    sendJson(res, 200, order);
    return;
  }

  if (pathname === "/api/checkout/create" && req.method === "POST") {
    const body = await parseBody(req);
    const user = resolveUser(req, db);
    const methods = getEnabledPaymentMethods();
    const methodCode = String(body.paymentMethod || methods[0]?.code || "").toLowerCase();
    const selectedMethod = methods.find((item) => item.code === methodCode);
    if (!selectedMethod) {
      sendJson(res, 400, { message: "Выберите доступный способ оплаты." });
      return;
    }
    const order = createOrderFromCheckout(db, { ...body, paymentMethod: methodCode }, user);
    if (!order.items.length) {
      sendJson(res, 400, { message: "Корзина пуста." });
      return;
    }
    if (!order.customerName || !order.phone || !order.address) {
      sendJson(res, 400, { message: "Заполните ФИО, телефон и адрес." });
      return;
    }
    const payment = createPaymentForOrder(db, order);
    const session = await initializePaymentSession(db, order, payment);
    await saveDb(db);
    sendJson(res, 200, session);
    return;
  }
  if (pathname === "/api/admin/overview" && req.method === "GET") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    sendJson(res, 200, {
      products: db.products.length,
      hiddenProducts: db.products.filter((product) => product.published === false).length,
      orders: db.orders.length,
      users: db.users.length + 1,
      billzEnabled: env.BILLZ_ENABLED,
      billzVersion: env.BILLZ_API_VERSION,
      billzConfigured: Boolean(env.BILLZ_ACCESS_TOKEN || env.BILLZ_SECRET_TOKEN),
      billzBaseUrl: env.BILLZ_BASE_URL,
    });
    return;
  }

  if (pathname === "/api/admin/categories" && req.method === "GET") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    sendJson(res, 200, db.categories);
    return;
  }

  if (pathname === "/api/admin/categories" && req.method === "POST") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const body = await parseBody(req);
    const label = String(body.name || body.title || "").trim() || "Новая категория";
    const slug = slugify(body.slug || label);
    const existing = db.categories.find((item) => item.slug === slug);
    if (existing) {
      sendJson(res, 409, { message: "Category already exists" });
      return;
    }
    const category = {
      id: `local-cat-${randomUUID()}`,
      slug,
      icon: body.icon || "📘",
      accent: body.accent || "linear-gradient(135deg,#f4efff 0%,#ffffff 100%)",
      name: { ru: label, uz: body.uz || label, en: body.en || label },
      description: {
        ru: body.description || "Категория, созданная из админки",
        uz: body.descriptionUz || body.description || "Admin paneldan yaratilgan kategoriya",
        en: body.descriptionEn || body.description || "Category created from the admin panel",
      },
    };
    db.categories.unshift(category);
    await saveDb(db);
    sendJson(res, 200, category);
    return;
  }

  if (pathname.startsWith("/api/admin/categories/") && req.method === "PATCH") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const id = decodeURIComponent(pathname.split("/").pop() || "");
    const category = db.categories.find((item) => item.id === id || item.slug === id);
    if (!category) {
      sendJson(res, 404, { message: "Category not found" });
      return;
    }
    const body = await parseBody(req);
    if (body.name || body.title) {
      const label = String(body.name || body.title).trim();
      category.name = { ru: label, uz: body.uz || label, en: body.en || label };
      if (!body.keepSlug) category.slug = slugify(body.slug || label);
    }
    if (body.icon) category.icon = body.icon;
    if (body.description) {
      category.description = {
        ru: body.description,
        uz: body.descriptionUz || body.description,
        en: body.descriptionEn || body.description,
      };
    }
    db.products.forEach((product) => {
      if (product.categorySlug === id || product.categorySlug === category.slug || product.categoryName === (body.previousName || category.name?.ru)) {
        product.categorySlug = category.slug;
        product.categoryName = category.name?.ru || category.slug;
      }
    });
    await saveDb(db);
    sendJson(res, 200, category);
    return;
  }

  if (pathname.startsWith("/api/admin/categories/") && req.method === "DELETE") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const id = decodeURIComponent(pathname.split("/").pop() || "");
    const index = db.categories.findIndex((item) => item.id === id || item.slug === id);
    if (index === -1) {
      sendJson(res, 404, { message: "Category not found" });
      return;
    }
    const [removed] = db.categories.splice(index, 1);
    db.products.forEach((product) => {
      if (product.categorySlug === removed.slug) {
        product.categorySlug = "other";
        product.categoryName = "Без категории";
      }
    });
    await saveDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/admin/products" && req.method === "GET") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    sendJson(res, 200, db.products);
    return;
  }


  if (pathname === "/api/admin/users" && req.method === "GET") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    sendJson(
      res,
      200,
      db.users.map((item) => ({
        id: item.id,
        email: item.email,
        role: item.role || "customer",
        firstName: item.firstName || "",
        lastName: item.lastName || "",
        phone: item.phone || "",
        city: item.city || "",
        createdAt: item.createdAt || "",
        favoriteCount: Array.isArray(item.favoriteIds) ? item.favoriteIds.length : 0,
        ordersCount: db.orders.filter((order) => order.userId === item.id).length,
      })),
    );
    return;
  }

  if (pathname.startsWith("/api/admin/users/") && req.method === "PATCH") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const id = pathname.split("/").pop();
    const target = db.users.find((item) => item.id === id);
    if (!target) {
      sendJson(res, 404, { message: "User not found" });
      return;
    }
    const body = await parseBody(req);
    Object.assign(target, {
      firstName: body.firstName ?? target.firstName,
      lastName: body.lastName ?? target.lastName,
      phone: body.phone ?? target.phone,
      city: body.city ?? target.city,
      role: body.role === "admin" ? "admin" : target.role || "customer",
    });
    await saveDb(db);
    sendJson(res, 200, {
      id: target.id,
      email: target.email,
      role: target.role || "customer",
      firstName: target.firstName || "",
      lastName: target.lastName || "",
      phone: target.phone || "",
      city: target.city || "",
      createdAt: target.createdAt || "",
    });
    return;
  }

  if (pathname.startsWith("/api/admin/users/") && req.method === "DELETE") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const id = pathname.split("/").pop();
    const nextUsers = db.users.filter((item) => item.id !== id);
    if (nextUsers.length === db.users.length) {
      sendJson(res, 404, { message: "User not found" });
      return;
    }
    db.users = nextUsers;
    db.reviews = db.reviews.filter((item) => item.userId !== id);
    db.orders = db.orders.filter((item) => item.userId !== id);
    await saveDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/admin/reviews" && req.method === "GET") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    sendJson(
      res,
      200,
      db.reviews.map((review) => ({
        ...review,
        productTitle: db.products.find((product) => product.id === review.productId || product.slug === review.productSlug)?.title || "Товар удалён",
      })),
    );
    return;
  }

  if (pathname.startsWith("/api/admin/reviews/") && req.method === "PATCH") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const id = pathname.split("/").pop();
    const review = db.reviews.find((item) => item.id === id);
    if (!review) {
      sendJson(res, 404, { message: "Review not found" });
      return;
    }
    const body = await parseBody(req);
    if (body.text !== undefined) review.text = String(body.text || review.text);
    if (body.rating !== undefined) review.rating = Math.max(1, Math.min(5, Number(body.rating || review.rating || 5)));
    if (body.published !== undefined) review.published = Boolean(body.published);
    review.updatedAt = new Date().toISOString();
    const product = db.products.find((item) => item.id === review.productId || item.slug === review.productSlug);
    recalculateProductReviewStats(db, product);
    await saveDb(db);
    sendJson(res, 200, review);
    return;
  }

  if (pathname.startsWith("/api/admin/reviews/") && req.method === "DELETE") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const id = pathname.split("/").pop();
    const review = db.reviews.find((item) => item.id === id);
    const nextReviews = db.reviews.filter((item) => item.id !== id);
    if (nextReviews.length === db.reviews.length) {
      sendJson(res, 404, { message: "Review not found" });
      return;
    }
    db.reviews = nextReviews;
    const product = db.products.find((item) => item.id === review?.productId || item.slug === review?.productSlug);
    recalculateProductReviewStats(db, product);
    await saveDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/admin/orders" && req.method === "GET") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    sendJson(res, 200, db.orders);
    return;
  }

  if (pathname.startsWith("/api/admin/orders/") && pathname.endsWith("/status") && req.method === "PATCH") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const orderId = pathname.split("/")[4];
    const order = (db.orders || []).find((item) => item.id === orderId || String(item.number) === orderId);
    if (!order) {
      sendJson(res, 404, { message: "Order not found" });
      return;
    }
    const body = await parseBody(req);
    order.status = String(body.status || order.status);
    order.updatedAt = nowIso();
    if (order.status === 'completed') order.completedAt = order.updatedAt;
    await saveDb(db);
    sendJson(res, 200, order);
    return;
  }

  if (pathname === "/api/admin/products" && req.method === "POST") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const body = await parseBody(req);
    const title = body.title || "Новый товар";
    const categorySlug = body.categorySlug || "fiction";
    const product = {
      id: `local-${randomUUID()}`,
      externalId: null,
      source: "local",
      slug: slugify(title),
      title,
      author: body.author || "BOOKSHOP",
      price: Number(body.price || 0),
      oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
      rating: 0,
      reviewsCount: 0,
      stock: Number(body.stock || 10),
      inStock: Number(body.stock || 10) > 0,
      published: true,
      categorySlug,
      categoryName: body.categoryName || getCategoryLabel(db, categorySlug, categorySlug),
      language: body.language || "Русский",
      publisher: body.publisher || "BOOKSHOP Studio",
      isbn: body.isbn || `LOCAL-${Date.now()}`,
      coverType: body.coverType || "Твёрдый переплёт",
      pages: Number(body.pages || 240),
      year: Number(body.year || new Date().getFullYear()),
      description: body.description || "Локально добавленный товар через админку.",
      summary: body.summary || "Локальный товар BOOKSHOP.",
      images: Array.isArray(body.images) ? body.images : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      featured: { bestseller: false, newArrival: true, collectionSlugs: [] },
    };
    db.products.unshift(product);
    await saveDb(db);
    sendJson(res, 200, product);
    return;
  }

  if (pathname.startsWith("/api/admin/products/") && pathname.endsWith("/image") && req.method === "POST") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const id = pathname.split("/")[4];
    const product = db.products.find((item) => item.id === id);
    if (!product) {
      sendJson(res, 404, { message: "Product not found" });
      return;
    }
    const body = await parseBody(req);
    const match = String(body.dataUrl || "").match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      sendJson(res, 400, { message: "Invalid image payload" });
      return;
    }
    const extension = match[1].split("/")[1] || "png";
    const fileName = `${slugify(body.fileName || product.slug)}-${Date.now()}.${extension}`;
    const filePath = join(uploadsDir, fileName);
    writeFileSync(filePath, Buffer.from(match[2], "base64"));
    const publicPath = `/uploads/${fileName}`;
    product.images = [publicPath, ...(product.images || []).filter((item) => item !== publicPath)].slice(0, 6);
    await saveDb(db);
    sendJson(res, 200, product);
    return;
  }

  if (pathname.startsWith("/api/admin/products/") && req.method === "PATCH") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const id = pathname.split("/").pop();
    const product = db.products.find((item) => item.id === id);
    if (!product) {
      sendJson(res, 404, { message: "Product not found" });
      return;
    }
    const body = await parseBody(req);
    Object.assign(product, body);
    product.slug = slugify(product.title || product.slug);
    if (body.categorySlug && !body.categoryName) {
      product.categoryName = getCategoryLabel(db, body.categorySlug, product.categoryName || "Категория");
    }
    product.updatedAt = new Date().toISOString();
    await saveDb(db);
    sendJson(res, 200, product);
    return;
  }

  if (pathname.startsWith("/api/admin/products/") && req.method === "DELETE") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    const id = pathname.split("/").pop();
    const nextProducts = db.products.filter((item) => item.id !== id);
    if (nextProducts.length === db.products.length) {
      sendJson(res, 404, { message: "Product not found" });
      return;
    }
    db.products = nextProducts;
    await saveDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/admin/billz/sync" && req.method === "POST") {
    const user = requireAdmin(req, res, db);
    if (!user) return;
    try {
      const result = await syncBillz(db);
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 500, { message: error instanceof Error ? error.message : "BILLZ sync failed" });
    }
    return;
  }

  if (pathname.startsWith("/uploads/")) {
    const safeName = pathname.replace("/uploads/", "");
    const filePath = join(uploadsDir, safeName);
    if (!serveFile(res, filePath)) {
      sendJson(res, 404, { message: "Upload not found" });
    }
    return;
  }

  if (existsSync(distDir)) {
    const requested = pathname === "/" ? join(distDir, "index.html") : join(distDir, pathname);
    if (existsSync(requested) && statSync(requested).isFile()) {
      serveFile(res, requested);
      return;
    }
    serveFile(res, join(distDir, "index.html"));
    return;
  }

  sendJson(res, 404, { message: "Not found" });
}

const server = createServer((req, res) => {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  handle(req, res).catch((error) => {
    console.error("[HTTP ERROR]", error instanceof Error ? error.stack || error.message : error);

    if (!res.headersSent) {
      sendJson(res, 500, {
        message: error instanceof Error ? error.message : "Unexpected error",
      });
      return;
    }

    try {
      res.end();
    } catch {}
  });
});

async function runScheduledBillzSync(reason = "interval") {
  if (!env.BILLZ_ENABLED || billzSyncInProgress) return;
  billzSyncInProgress = true;
  try {
    const db = await loadDb();
    const result = await syncBillz(db);
    console.log(`[BILLZ] ${reason}: ${result.message}`);
  } catch (error) {
    console.error(`[BILLZ] ${reason} sync failed:`, error instanceof Error ? error.message : error);
  } finally {
    billzSyncInProgress = false;
  }
}

async function runRetentionSweep() {
  const db = await loadDb();
  await saveDb(db);
}

async function startServer() {
  if (env.MONGO_ONLY) {
    await getMongoDb();
    const db = await loadDb();
    await saveDb(db);
  }

  telegramBridge = createTelegramBotBridge({ env, loadDb, saveDb });

  server.listen(env.PORT, () => {
    console.log(`BOOKSHOP backend listening on http://localhost:${env.PORT}`);
    console.log(`BILLZ: enabled=${env.BILLZ_ENABLED} configured=${Boolean(env.BILLZ_ACCESS_TOKEN || env.BILLZ_SECRET_TOKEN)} base=${env.BILLZ_BASE_URL}`);
    console.log(`MongoDB: enabled=${isMongoEnabled()} db=${env.MONGODB_DB} mode=${env.MONGO_ONLY ? "mongo-only" : "hybrid"}`);
    console.log(`Payments: payme=${env.PAYME_ENABLED} click=${env.CLICK_ENABLED} uzum=${env.UZUM_ENABLED}`);

    telegramBridge?.start();
    runScheduledBillzSync("startup");
    runRetentionSweep().catch(() => undefined);

    if (env.BILLZ_ENABLED && env.BILLZ_SYNC_INTERVAL_MINUTES > 0) {
      const timer = setInterval(() => {
        runScheduledBillzSync("interval");
      }, env.BILLZ_SYNC_INTERVAL_MINUTES * 60_000);
      timer.unref?.();
    }

    const retentionTimer = setInterval(() => {
      runRetentionSweep().catch(() => undefined);
    }, 6 * 60 * 60 * 1000);
    retentionTimer.unref?.();
  });
}

startServer().catch((error) => {
  console.error("BOOKSHOP backend failed to start:", error instanceof Error ? error.message : error);
  process.exit(1);
});
