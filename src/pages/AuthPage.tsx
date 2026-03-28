import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function AuthPage() {
  const { t } = useI18n();
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", captcha: "" });
  const captchaTask = useMemo(() => ({ a: 6, b: 3 }), []);

  const submit = async () => {
    try {
      if (mode === "login") {
        await auth.login(form.email, form.password);
        navigate("/");
      } else if (mode === "register") {
        if (Number(form.captcha) !== captchaTask.a + captchaTask.b) {
          setMessage("Проверьте captcha");
          return;
        }
        await auth.register(form);
        navigate("/");
      } else {
        const response = await auth.forgotPassword(form.email);
        setMessage(response);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка");
    }
  };

  const startGoogle = async () => {
    try {
      const response = await api.googleUrl();
      window.location.href = response.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google OAuth не настроен");
    }
  };

  return (
    <div className="container-tight py-12 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(480px,0.92fr)]">
        <div className="rounded-[36px] bg-[linear-gradient(135deg,#6d35f9_0%,#a382ff_100%)] p-10 text-white shadow-[0_28px_70px_rgba(111,53,255,0.30)] md:p-12">
          <span className="pill-badge bg-white text-primary">BOOKSHOP ID</span>
          <h1 className="mt-6 max-w-[620px] text-[56px] font-heading font-extrabold leading-[1.02]">{t("authTitle")}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/84">{t("authSubtitle")}</p>
          <button className="mt-10 rounded-[18px] bg-white px-6 py-4 text-sm font-bold text-primary shadow-[0_12px_30px_rgba(255,255,255,0.24)]" onClick={startGoogle}>{t("continueWithGoogle")}</button>
        </div>
        <div className="rounded-[36px] border border-violet-100 bg-white p-8 shadow-[0_18px_40px_rgba(95,45,255,0.05)] md:p-10">
          <div className="flex flex-wrap gap-3">
            <button className={`tab-button ${mode === "login" ? "tab-button-active" : ""}`} onClick={() => setMode("login")}>{t("login")}</button>
            <button className={`tab-button ${mode === "register" ? "tab-button-active" : ""}`} onClick={() => setMode("register")}>{t("register")}</button>
            <button className={`tab-button ${mode === "forgot" ? "tab-button-active" : ""}`} onClick={() => setMode("forgot")}>{t("forgotPassword")}</button>
          </div>
          <div className="mt-8 grid gap-4">
            {mode === "register" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="field-shell"><span>{t("firstName")}</span><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
                <label className="field-shell"><span>{t("lastName")}</span><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
              </div>
            ) : null}
            <label className="field-shell"><span>{t("email")}</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            {mode !== "forgot" ? <label className="field-shell"><span>{t("password")}</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label> : null}
            {mode === "register" ? (
              <label className="field-shell"><span>Captcha: {captchaTask.a} + {captchaTask.b}</span><input inputMode="numeric" value={form.captcha} onChange={(e) => setForm({ ...form, captcha: e.target.value })} /></label>
            ) : null}
            <button className="primary-button mt-2 justify-center px-6 py-4" onClick={submit}>{mode === "login" ? t("login") : mode === "register" ? t("register") : t("forgotPassword")}</button>
            {message ? <div className="rounded-[20px] bg-violet-50 px-4 py-3 text-sm font-medium text-primary">{message}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
