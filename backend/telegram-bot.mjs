const TG_TIMEOUT_MS = 30_000;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function buildStatusLabel(status = "") {
  switch (status) {
    case "pending_payment":
      return "Ожидает оплату";
    case "paid":
      return "Оплачен";
    case "processing":
      return "В обработке";
    case "completed":
      return "Завершён";
    case "cancelled":
      return "Отменён";
    default:
      return status || "Без статуса";
  }
}

function formatAmount(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} сум`;
}

function orderSummary(order) {
  const items = Array.isArray(order?.items) && order.items.length
    ? order.items.map((item) => `• ${escapeHtml(item.title || "Товар")} × ${Number(item.quantity || 1)}`).join("\n")
    : "• Список товаров пуст";

  return [
    `<b>Заказ #${escapeHtml(order.number || order.id || "—")}</b>`,
    `Статус: <b>${escapeHtml(buildStatusLabel(order.status))}</b>`,
    `Клиент: <b>${escapeHtml(order.customerName || "Не указан")}</b>`,
    `Телефон: <b>${escapeHtml(String(order.phone || "Не указан"))}</b>`,
    `Адрес: <b>${escapeHtml(order.address || "Не указан")}</b>`,
    `Оплата: <b>${escapeHtml(order.paymentMethod || "Не указана")}</b>`,
    `Сумма: <b>${escapeHtml(formatAmount(order.amount))}</b>`,
    "",
    `<b>Состав заказа</b>`,
    items,
  ].join("\n");
}

export function createTelegramBotBridge({ env, loadDb, saveDb }) {
  const token = env.BOT_TOKEN || env.TELEGRAM_BOT_TOKEN || "";
  const adminLogin = env.ADMINS_TELEGRAM_USER || "";
  const adminPassword = env.ADMINS_TELEGRAM_PASSWORD || "";
  const loginSessions = new Map();

  let offset = 0;
  let started = false;
  let polling = false;

  async function tg(method, payload = {}) {
    if (!token) return null;
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!response?.ok) return null;
    return response.json().catch(() => null);
  }

  async function getDb() {
    const db = await loadDb();
    if (!Array.isArray(db.botAdmins)) db.botAdmins = [];
    return db;
  }

  async function persistAdmin(chatId, profile = {}) {
    const db = await getDb();
    const existing = db.botAdmins.find((item) => String(item.chatId) === String(chatId));
    const now = new Date().toISOString();

    if (existing) {
      Object.assign(existing, { ...profile, chatId, updatedAt: now, isAuthorized: true });
    } else {
      db.botAdmins.push({
        chatId,
        ...profile,
        isAuthorized: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    await saveDb(db);
  }

  async function removeAdmin(chatId) {
    const db = await getDb();
    db.botAdmins = db.botAdmins.filter((item) => String(item.chatId) !== String(chatId));
    await saveDb(db);
    loginSessions.delete(String(chatId));
  }

  async function isAuthorized(chatId) {
    const db = await getDb();
    return db.botAdmins.some((item) => String(item.chatId) === String(chatId));
  }

  function getSession(chatId) {
    return loginSessions.get(String(chatId)) || null;
  }

  function setSession(chatId, payload) {
    loginSessions.set(String(chatId), payload);
  }

  function clearSession(chatId) {
    loginSessions.delete(String(chatId));
  }

  function buildGuestKeyboard() {
    return {
      keyboard: [[{ text: "Войти" }]],
      resize_keyboard: true,
      is_persistent: true,
    };
  }

  function buildMainKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: "Актуальные", callback_data: "orders:active" },
          { text: "Оплаченные", callback_data: "orders:paid" },
        ],
        [
          { text: "В обработке", callback_data: "orders:processing" },
          { text: "Завершённые", callback_data: "orders:completed" },
        ],
        [
          { text: "Отменённые", callback_data: "orders:cancelled" },
          { text: "Обновить", callback_data: "orders:refresh" },
        ],
      ],
    };
  }

  function buildAuthorizedReplyKeyboard() {
    return {
      keyboard: [
        [{ text: "Актуальные заказы" }, { text: "Оплаченные" }],
        [{ text: "В обработке" }, { text: "Завершённые" }],
        [{ text: "Отменённые" }, { text: "Выйти" }],
      ],
      resize_keyboard: true,
      is_persistent: true,
    };
  }

  function buildOrderActions(orderId) {
    return {
      inline_keyboard: [
        [
          { text: "В обработку", callback_data: `status:${orderId}:processing` },
          { text: "Завершить", callback_data: `status:${orderId}:completed` },
        ],
        [{ text: "Отменить", callback_data: `status:${orderId}:cancelled` }],
      ],
    };
  }

  function filterOrdersByBucket(orders = [], bucket = "active") {
    switch (bucket) {
      case "paid":
        return orders.filter((item) => item.status === "paid");
      case "processing":
        return orders.filter((item) => item.status === "processing");
      case "completed":
        return orders.filter((item) => item.status === "completed");
      case "cancelled":
        return orders.filter((item) => item.status === "cancelled");
      case "active":
      default:
        return orders.filter((item) => ["pending_payment", "paid", "processing"].includes(item.status));
    }
  }

  async function sendWelcome(chatId) {
    clearSession(chatId);
    await tg("sendMessage", {
      chat_id: chatId,
      text: [
        "<b>BOOKSHOP Admin Bot</b>",
        "",
        "Войдите, чтобы открыть панель заказов.",
        "Нажмите <b>«Войти»</b> ниже.",
      ].join("\n"),
      parse_mode: "HTML",
      reply_markup: buildGuestKeyboard(),
    });
  }

  async function promptLogin(chatId) {
    setSession(chatId, { step: "await_login" });
    await tg("sendMessage", {
      chat_id: chatId,
      text: "Введите логин администратора.",
      reply_markup: buildGuestKeyboard(),
    });
  }

  async function promptPassword(chatId, login) {
    setSession(chatId, { step: "await_password", login });
    await tg("sendMessage", {
      chat_id: chatId,
      text: "Теперь введите пароль.",
      reply_markup: buildGuestKeyboard(),
    });
  }

  async function sendDashboard(chatId, text = "Панель администратора BOOKSHOP") {
    await tg("sendMessage", {
      chat_id: chatId,
      text,
      reply_markup: buildMainKeyboard(),
    });

    await tg("sendMessage", {
      chat_id: chatId,
      text: "Быстрые действия доступны и через кнопки ниже.",
      reply_markup: buildAuthorizedReplyKeyboard(),
    });
  }

  async function sendOrderBucket(chatId, bucket = "active") {
    const db = await getDb();
    const orders = filterOrdersByBucket(
      (db.orders || []).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
      bucket,
    ).slice(0, 20);

    const bucketLabel = bucket === "active" ? "Актуальные" : buildStatusLabel(bucket);

    if (!orders.length) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: `В разделе «${bucketLabel}» заказов пока нет.`,
        reply_markup: buildMainKeyboard(),
      });
      return;
    }

    await tg("sendMessage", {
      chat_id: chatId,
      text: `<b>${escapeHtml(bucketLabel)}</b>\nПоказано заказов: <b>${orders.length}</b>`,
      parse_mode: "HTML",
      reply_markup: buildMainKeyboard(),
    });

    for (const order of orders) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: orderSummary(order),
        parse_mode: "HTML",
        reply_markup: buildOrderActions(order.id),
      });
    }
  }

  async function handleGuestMessage(chatId, text, message) {
    const session = getSession(chatId);

    if (text === "/start") {
      await sendWelcome(chatId);
      return true;
    }

    if (text === "/login" || text === "Войти") {
      if (!adminLogin || !adminPassword) {
        await tg("sendMessage", {
          chat_id: chatId,
          text: "Логин и пароль администратора ещё не настроены в .env.",
          reply_markup: buildGuestKeyboard(),
        });
        return true;
      }
      await promptLogin(chatId);
      return true;
    }

    if (session?.step === "await_login") {
      const login = text.trim();
      if (!login) {
        await tg("sendMessage", { chat_id: chatId, text: "Логин не должен быть пустым." });
        return true;
      }
      await promptPassword(chatId, login);
      return true;
    }

    if (session?.step === "await_password") {
      const password = text.trim();
      const login = session.login || "";

      if (login === adminLogin && password === adminPassword) {
        await persistAdmin(chatId, {
          telegramUsername: message?.from?.username || "",
          displayName: [message?.from?.first_name, message?.from?.last_name].filter(Boolean).join(" ") || message?.from?.username || "Администратор",
        });
        clearSession(chatId);
        await sendDashboard(chatId, "Вход выполнен. Панель заказов открыта.");
      } else {
        clearSession(chatId);
        await tg("sendMessage", {
          chat_id: chatId,
          text: "Неверный логин или пароль. Нажмите «Войти», чтобы попробовать снова.",
          reply_markup: buildGuestKeyboard(),
        });
      }
      return true;
    }

    await sendWelcome(chatId);
    return true;
  }

  async function handleAuthorizedMessage(chatId, text) {
    if (text === "/start") {
      await sendDashboard(chatId, "Вы уже авторизованы.");
      return;
    }

    if (text === "/logout" || text === "Выйти") {
      await removeAdmin(chatId);
      await tg("sendMessage", {
        chat_id: chatId,
        text: "Сессия завершена.",
        reply_markup: buildGuestKeyboard(),
      });
      return;
    }

    const normalized = text.toLowerCase();
    if (normalized.includes("акту")) {
      await sendOrderBucket(chatId, "active");
      return;
    }
    if (normalized.includes("оплач")) {
      await sendOrderBucket(chatId, "paid");
      return;
    }
    if (normalized.includes("обработ")) {
      await sendOrderBucket(chatId, "processing");
      return;
    }
    if (normalized.includes("заверш")) {
      await sendOrderBucket(chatId, "completed");
      return;
    }
    if (normalized.includes("отмен")) {
      await sendOrderBucket(chatId, "cancelled");
      return;
    }

    await sendDashboard(chatId);
  }

  async function handleMessage(message) {
    const chatId = message?.chat?.id;
    const text = String(message?.text || "").trim();
    if (!chatId || !text) return;

    if (!(await isAuthorized(chatId))) {
      await handleGuestMessage(chatId, text, message);
      return;
    }

    await handleAuthorizedMessage(chatId, text);
  }

  async function handleCallback(callbackQuery) {
    const chatId = callbackQuery?.message?.chat?.id;
    const data = String(callbackQuery?.data || "");
    if (!chatId) return;

    if (!(await isAuthorized(chatId))) {
      await tg("answerCallbackQuery", {
        callback_query_id: callbackQuery.id,
        text: "Сначала войдите в панель.",
      });
      return;
    }

    if (data.startsWith("orders:")) {
      const bucket = data.split(":")[1];
      if (bucket === "refresh") {
        await sendDashboard(chatId, "Панель обновлена.");
      } else {
        await sendOrderBucket(chatId, bucket);
      }
      await tg("answerCallbackQuery", { callback_query_id: callbackQuery.id });
      return;
    }

    if (data.startsWith("status:")) {
      const [, orderId, nextStatus] = data.split(":");
      const db = await getDb();
      const order = (db.orders || []).find((item) => item.id === orderId);

      if (!order) {
        await tg("answerCallbackQuery", {
          callback_query_id: callbackQuery.id,
          text: "Заказ не найден.",
        });
        return;
      }

      order.status = nextStatus;
      order.updatedAt = new Date().toISOString();
      if (nextStatus === "cancelled") {
        order.paymentStatus = order.paymentStatus === "paid" ? "refunded_pending" : "cancelled";
      }
      if (nextStatus === "completed") {
        order.completedAt = new Date().toISOString();
      }

      await saveDb(db);
      await tg("answerCallbackQuery", {
        callback_query_id: callbackQuery.id,
        text: `Статус: ${buildStatusLabel(nextStatus)}`,
      });
      await tg("sendMessage", {
        chat_id: chatId,
        text: `Заказ #${order.number || order.id} → ${buildStatusLabel(nextStatus)}`,
      });
    }
  }

  async function poll() {
    if (!token || polling) return;
    polling = true;

    while (started) {
      try {
        const response = await tg("getUpdates", {
          offset,
          timeout: 25,
          allowed_updates: ["message", "callback_query"],
        });
        const updates = Array.isArray(response?.result) ? response.result : [];

        for (const update of updates) {
          offset = update.update_id + 1;
          if (update.message) await handleMessage(update.message);
          if (update.callback_query) await handleCallback(update.callback_query);
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, TG_TIMEOUT_MS));
      }
    }

    polling = false;
  }

  async function notifyAdmins(text, options = {}) {
    if (!token) return;
    const db = await getDb();
    const admins = db.botAdmins || [];

    for (const admin of admins) {
      await tg("sendMessage", {
        chat_id: admin.chatId,
        text,
        parse_mode: options.parseMode || undefined,
        reply_markup: options.replyMarkup || undefined,
      });
    }
  }

  async function notifyOrderPaid(order) {
    await notifyAdmins([
      "✅ Оплата подтверждена",
      `Заказ: #${order.number || order.id}`,
      `Клиент: ${order.customerName || "—"}`,
      `Телефон: ${order.phone || "—"}`,
      `Адрес: ${order.address || "—"}`,
      `Сумма: ${formatAmount(order.amount)}`,
      `Оплата: ${order.paymentMethod || "—"}`,
      `Товары: ${(order.items || []).map((item) => `${item.title} × ${item.quantity}`).join(", ")}`,
    ].join("\n"));
  }

  return {
    start() {
      if (!token || started) return;
      started = true;
      poll();
    },
    notifyAdmins,
    notifyOrderPaid,
  };
}
