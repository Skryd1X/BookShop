import { ChevronDown, Globe, Heart, LogOut, Menu, Package, ShoppingCart, User, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { useI18n } from "@/lib/i18n";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { items: favoriteItems } = useFavorites();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);

  const nav = useMemo(
    () => [
      { to: "/catalog", label: t("navCatalog") },
      { to: "/catalog?filter=new", label: t("navNew") },
      { to: "/catalog?filter=bestseller", label: t("navBestsellers") },
      { to: "/collections", label: t("navCollections") },
      { to: "/blog", label: t("navBlog") },
      { to: "/faq", label: t("navFaq") },
      { to: "/about", label: t("navAbout") },
    ],
    [t],
  );

  const profileTitle = user
    ? `${user.firstName || (user.role === "admin" ? "BOOKSHOP" : "Пользователь")} ${user.lastName || (user.role === "admin" ? "Admin" : "")}`.trim()
    : "ЛК";

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
      if (langRef.current && !langRef.current.contains(target)) setLangOpen(false);
    };

    const onScroll = () => setScrolled(window.scrollY > 12);

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
    setLangOpen(false);
  }, [location.pathname, location.search]);

  const isNavActive = (to: string) => {
    const [path, queryString] = to.split("?");
    if (location.pathname !== path) return false;
    const current = new URLSearchParams(location.search);
    if (!queryString) return !current.get("filter");
    const expected = new URLSearchParams(queryString);
    return Array.from(expected.entries()).every(([key, value]) => current.get(key) === value);
  };

  return (
    <header
      className={`sticky top-0 z-[240] overflow-visible border-b border-violet-100/80 transition-all duration-300 ${
        scrolled
          ? "bg-white/78 shadow-[0_18px_44px_rgba(86,32,214,0.10)] backdrop-blur-2xl"
          : "bg-white/96 shadow-[0_10px_28px_rgba(86,32,214,0.05)]"
      }`}
    >
      <div className="container-tight py-4">
        <div className="flex items-center justify-between gap-4 xl:gap-8">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-3 md:gap-4">
            <div className="logo-box">BOOK</div>
            <div className="min-w-0">
              <div className="truncate text-[22px] font-extrabold tracking-[-0.06em] text-slate-950 sm:text-[26px] xl:text-[28px]">BOOKSHOP</div>
              <div className="hidden text-[12px] font-medium text-primary/80 sm:block">Книжный маркетплейс</div>
            </div>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 lg:flex xl:gap-3 2xl:gap-4">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={() => (isNavActive(item.to) ? "nav-link nav-link-active" : "nav-link")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <div className="relative" ref={langRef}>
              <button
                type="button"
                className="language-switcher min-w-[108px] justify-between"
                onClick={() => {
                  setLangOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-semibold">{lang === "ru" ? "Рус" : lang === "uz" ? "O'z" : "En"}</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen ? (
                <div className="glass-panel absolute right-0 top-[calc(100%+0.55rem)] z-[300] min-w-[100%] rounded-[20px] p-1.5 shadow-[0_24px_56px_rgba(95,45,255,0.16)]">
                  {[
                    { value: "ru", label: "Рус" },
                    { value: "uz", label: "O'z" },
                    { value: "en", label: "En" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`flex w-full items-center rounded-[14px] px-3 py-2.5 text-left text-sm font-semibold transition ${lang === item.value ? "bg-violet-50 text-primary" : "text-slate-600 hover:bg-violet-50"}`}
                      onClick={() => {
                        setLang(item.value as typeof lang);
                        setLangOpen(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <Link to={user ? "/favorites" : "/auth"} className="icon-button relative h-11 w-11">
              <Heart className="h-4 w-4" />
              {favoriteItems.length > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">{favoriteItems.length}</span> : null}
            </Link>

            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  className="icon-pill min-w-[56px] px-4"
                  onClick={() => {
                    setProfileOpen((prev) => !prev);
                    setLangOpen(false);
                  }}
                >
                  ЛК
                </button>
                {profileOpen ? (
                  <div className="glass-panel absolute right-0 top-[calc(100%+0.55rem)] z-[320] w-[300px] overflow-hidden rounded-[24px] p-0 shadow-[0_24px_56px_rgba(95,45,255,0.16)]">
                    <div className="border-b border-violet-100 px-5 py-4">
                      <div className="font-semibold text-slate-950">{profileTitle}</div>
                      <div className="mt-1 break-all text-sm text-primary/80">{user.email}</div>
                    </div>
                    <div className="p-2">
                      <Link to="/profile" className="flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-medium text-primary transition hover:bg-violet-50" onClick={() => setProfileOpen(false)}>
                        <UserRound className="h-4 w-4" />
                        Мой профиль
                      </Link>
                      <Link to="/profile#orders" className="flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-violet-50" onClick={() => setProfileOpen(false)}>
                        <Package className="h-4 w-4" />
                        Мои заказы
                      </Link>
                      <Link to="/favorites" className="flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-violet-50" onClick={() => setProfileOpen(false)}>
                        <Heart className="h-4 w-4" />
                        Избранное
                      </Link>
                      {user.role === "admin" ? (
                        <Link to="/admin" className="flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-violet-50" onClick={() => setProfileOpen(false)}>
                          <User className="h-4 w-4" />
                          Админ-панель
                        </Link>
                      ) : null}
                      <button className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-medium text-rose-500 transition hover:bg-rose-50" onClick={() => { setProfileOpen(false); logout(); }}>
                        <LogOut className="h-4 w-4" />
                        Выйти
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link to="/auth" className="icon-pill min-w-[56px] px-4">
                <User className="h-4 w-4" />
              </Link>
            )}

            <Link to="/cart" className="primary-button px-5 py-3.5 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4" />
              {t("cartTitle")}
              {totalItems > 0 ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{totalItems}</span> : null}
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Link to="/cart" className="icon-pill min-w-[52px] px-4">
              <ShoppingCart className="h-4 w-4" />
            </Link>
            <button className="icon-button h-11 w-11" onClick={() => setOpen((prev) => !prev)}>
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="border-t border-violet-100 bg-white/95 shadow-[0_14px_30px_rgba(95,45,255,0.08)] lg:hidden">
          <div className="container-tight grid gap-5 py-5">
            <nav className="grid gap-1.5">
              {nav.map((item) => (
                <NavLink key={item.to} to={item.to} className={() => (isNavActive(item.to) ? "nav-link-mobile nav-link-mobile-active" : "nav-link-mobile")} onClick={() => setOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: "ru", label: "Рус" },
                { value: "uz", label: "O'z" },
                { value: "en", label: "En" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`secondary-button justify-center px-4 py-3 text-sm ${lang === item.value ? "border-primary bg-violet-50 text-primary" : ""}`}
                  onClick={() => setLang(item.value as typeof lang)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid gap-2">
              {user ? (
                <>
                  <Link to="/profile" className="secondary-button justify-center px-4 py-3 text-sm" onClick={() => setOpen(false)}>Мой профиль</Link>
                  {user.role === "admin" ? <Link to="/admin" className="secondary-button justify-center px-4 py-3 text-sm" onClick={() => setOpen(false)}>Админ-панель</Link> : null}
                  <Link to="/favorites" className="secondary-button justify-center px-4 py-3 text-sm" onClick={() => setOpen(false)}>Избранное</Link>
                </>
              ) : (
                <Link to="/auth" className="secondary-button justify-center px-4 py-3 text-sm" onClick={() => setOpen(false)}>Войти</Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
