import { CalendarDays, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/api/client";
import { applyBlogOverride } from "@/lib/editorial";
import { useI18n } from "@/lib/i18n";
import type { BlogPost } from "@/types/store";

export default function BlogPostPage() {
  const { slug } = useParams();
  const { pick } = useI18n();
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.getBlogPost(slug).then((item) => setPost(applyBlogOverride(item))).catch(() => setPost(null));
  }, [slug]);

  if (!post) {
    return <div className="container-tight py-20 text-slate-500">Статья не найдена.</div>;
  }

  return (
    <article className="container-tight py-10">
      <div className="mx-auto max-w-4xl">
        <span className="pill-badge">{post.category}</span>
        <h1 className="mt-6 text-4xl font-heading font-extrabold leading-tight text-slate-950 md:text-5xl xl:text-6xl">{pick(post.title)}</h1>
        <p className="mt-6 text-xl leading-8 text-slate-500">{pick(post.excerpt)}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-400">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {new Date(post.publishedAt).toLocaleDateString("ru-RU")}</span>
          <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {post.readTime}</span>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-[36px] border border-violet-100 shadow-[0_22px_48px_rgba(95,45,255,0.08)]">
        <img src={post.cover} alt={pick(post.title)} className="h-full w-full object-cover" />
      </div>
      <div className="mx-auto mt-12 max-w-4xl rounded-[32px] border border-violet-100 bg-white px-6 py-8 shadow-[0_18px_38px_rgba(95,45,255,0.05)] md:px-10 md:py-10">
        <div className="space-y-6 text-[17px] leading-9 text-slate-600 md:text-[18px]">
          {post.content.map((block, index) => (
            <p key={index}>{pick(block)}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
