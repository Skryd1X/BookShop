import { Link } from "react-router-dom";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionTo?: string;
}

export function SectionHeading({ badge, title, subtitle, actionLabel, actionTo }: SectionHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {badge ? <span className="pill-badge mb-3 inline-flex">{badge}</span> : null}
        <h2 className="text-[34px] font-heading font-extrabold tracking-tight text-slate-950 md:text-[42px] xl:text-[48px]">{title}</h2>
        {subtitle ? <p className="mt-3 text-base leading-7 text-slate-500">{subtitle}</p> : null}
      </div>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="inline-flex items-center gap-2 self-start rounded-full border border-violet-100 bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-[0_10px_22px_rgba(95,45,255,0.05)] transition hover:border-primary/25 hover:shadow-[0_14px_28px_rgba(95,45,255,0.08)] md:self-auto">
          {actionLabel}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  );
}
