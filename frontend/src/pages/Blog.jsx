import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { BlogSkeleton } from "../components/Skeletons";
import LoadError from "../components/LoadError";
import SEO from "../components/SEO";
import AdSenseBlock from "../components/AdSenseBlock";
import { fetchPosts } from "../api/blog.js";
import { formatDate } from "../lib/date.js";
import { fallbackCover, resolveCoverSrc } from "../lib/postCover.js";
import { SITE_URL } from "../lib/site";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    fetchPosts()
      .then(setPosts)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const jsonLd =
    posts.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Pulse Recipe",
          url: `${SITE_URL}/recipes`,
          description:
            "Fresh recipes, practical kitchen tips, and seasonal food inspiration.",
          publisher: {
            "@type": "Organization",
            name: "Pulse Recipe",
            url: SITE_URL,
          },
          blogPost: posts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: `${SITE_URL}/recipes/${p.slug}`,
            datePublished: p.publishedAt || p.createdAt,
            description: p.excerpt || p.title,
            ...(p.coverImage
              ? { image: `${SITE_URL}${p.coverImage}` }
              : {}),
          })),
        }
      : undefined;

  return (
    <>
      <SEO
        title="Recipes"
        description="Discover easy and delicious recipes, step-by-step cooking guides, and everyday kitchen inspiration."
        jsonLd={jsonLd}
      />
      <PageHeader title="Recipes" />

      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-white border-b border-amber-100 pt-20 pb-12">
        <div className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-orange-700 font-semibold text-xs uppercase tracking-widest mb-3">
            Fresh From The Kitchen
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
            Recipe Collection
          </h2>
          <p className="text-zinc-600 text-base leading-relaxed">
            Find cozy weeknight dinners, bright seasonal plates, and simple tips
            that make everyday cooking easier.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-white to-amber-50/40">
        <div className="max-w-5xl mx-auto px-6">
          <AdSenseBlock
            placement="blogList"
            className="mb-10 rounded-xl border border-amber-200 bg-white p-3"
          />

          {loading ? (
            <BlogSkeleton />
          ) : error ? (
            <LoadError
              message="Could not load recipes. Please check your connection and try again."
              onRetry={load}
            />
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <p>No recipes published yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <Link
                  key={post.id}
                  to={`/recipes/${post.slug}`}
                  className="bg-white rounded-2xl border border-amber-100 hover:shadow-xl hover:border-orange-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  <div className="h-48 overflow-hidden bg-amber-100/40 relative food-photo-wrap">
                    <img
                      src={resolveCoverSrc(post.coverImage, index)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 food-photo"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = fallbackCover(index);
                      }}
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-white/85 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-orange-800 tracking-wide">
                      FOOD JOURNAL
                    </span>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mb-3">
                      <Calendar size={11} />
                      {formatDate(post.publishedAt || post.createdAt)}
                    </p>
                    <h3 className="font-bold text-zinc-900 text-base leading-snug mb-2 flex-1">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-zinc-600 text-sm leading-relaxed mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="text-orange-700 text-sm font-semibold flex items-center gap-1 mt-auto group-hover:gap-2 transition-all">
                      Read Recipe <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
