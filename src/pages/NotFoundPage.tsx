import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

export default function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="container-tight py-24 text-center">
      <div className="mx-auto max-w-xl rounded-[36px] border border-violet-100 bg-white p-10 shadow-[0_28px_60px_rgba(95,45,255,0.08)]">
        <h1 className="text-6xl font-heading font-extrabold text-slate-950">404</h1>
        <p className="mt-5 text-lg text-slate-500">{t("pageNotFound")}</p>
        <Link to="/" className="primary-button mt-8 inline-flex px-6 py-4">{t("backHome")}</Link>
      </div>
    </div>
  );
}
