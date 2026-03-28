import { CalendarDays, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { useI18n } from "@/lib/i18n";
import { applyBlogOverride } from "@/lib/editorial";
import type { BlogPost } from "@/types/store";

export default function BlogPage() {
  const { t, pick } = useI18n();
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    api.getBlogPosts().then((items) => setPosts(items.map(applyBlogOverride))).catch(() => setPosts([]));
  }, []);

  return (
    <div className="container-tight py-10">
      <h1 className="text-4xl font-heading font-extrabold text-slate-950 md:text-5xl">{t("blogTitle")}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-500">{t("blogSubtitle")}</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {posts.map((post) => (
          <article key={post.id} className="rounded-[32px] border border-violet-100 bg-white p-4 shadow-[0_28px_60px_rgba(95,45,255,0.08)]">
            <div className="aspect-[4/3] overflow-hidden rounded-[26px] bg-violet-50">
              <img src={post.cover} alt={pick(post.title)} className="h-full w-full object-cover" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="rounded-full bg-violet-50 px-3 py-1 font-semibold text-primary">{post.category}</span>
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {new Date(post.publishedAt).toLocaleDateString("ru-RU")}</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {post.readTime}</span>
            </div>
            <h2 className="mt-4 text-[34px] font-heading font-bold leading-tight text-slate-950">{pick(post.title)}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{pick(post.excerpt)}</p>
            <Link to={`/blog/${post.slug}`} className="primary-button mt-6 inline-flex px-5 py-3 text-sm">{t("blogReadMore")}</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
