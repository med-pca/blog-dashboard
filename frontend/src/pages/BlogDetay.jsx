import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Calendar, ArrowLeft } from "lucide-react";
import DOMPurify from "dompurify";
import PageHeader from "../components/PageHeader";
import { BlogDetaySkeleton } from "../components/Skeletons";
import LoadError from "../components/LoadError";
import SEO from "../components/SEO";
import AdSenseBlock from "../components/AdSenseBlock";
import { fetchPostBySlug } from "../api/blog.js";
import { formatDate } from "../lib/date.js";
import { API } from "../api/config.js";

const FOOD_FALLBACKS = [
  "/food/illustration-1.svg",
  "/food/illustration-2.svg",
  "/food/illustration-3.svg",
  "/food/illustration-4.svg",
];

function pickFallback(seed = "") {
  const sum = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return FOOD_FALLBACKS[sum % FOOD_FALLBACKS.length];
}

function resolveCoverSrc(coverImage, slug) {
  if (!coverImage) return pickFallback(slug);
  if (/^https?:\/\//i.test(coverImage)) return coverImage;
  // Bundled artwork under /food/ is served by the frontend; uploads live on the API host.
  if (coverImage.startsWith("/food/")) return coverImage;
  return `${API}${coverImage}`;
}

export default function BlogDetay() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    fetchPostBySlug(slug)
      .then(setPost)
      .catch((err) => {
        if (err.status === 404) {
          navigate("/blog", { replace: true });
          return;
        }
        setError(err);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading || error) {
    return (
      <>
        <PageHeader
          title="Recipes"
          parent={{ to: "/blog", label: "Recipes" }}
        />
        {loading ? (
          <BlogDetaySkeleton />
        ) : (
          <LoadError
            message="Could not load this recipe. Please check your connection and try again."
            onRetry={load}
          />
        )}
      </>
    );
  }

  if (!post) return null;

  const resolvedCoverImage = resolveCoverSrc(
    post.coverImage,
    post.slug || slug,
  );
  const absoluteImage = post.coverImage
    ? /^https?:\/\//i.test(post.coverImage)
      ? post.coverImage
      : `https://renelenerji.com${post.coverImage}`
    : `https://renelenerji.com${pickFallback(post.slug || slug)}`;

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription || post.excerpt || post.title,
    image: absoluteImage,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    author: {
      "@type": "Organization",
      name: "Pulse Recipe",
      url: "https://renelenerji.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Pulse Recipe",
      logo: {
        "@type": "ImageObject",
        url: "https://renelenerji.com/food/logo-mark.svg",
      },
    },
  };

  return (
    <>
      <SEO
        title={post.title}
        description={post.metaDescription || post.excerpt || post.title}
        image={absoluteImage}
        type="article"
        jsonLd={blogSchema}
      />
      <PageHeader
        title={post.title}
        parent={{ to: "/blog", label: "Recipes" }}
      />

      <article className="max-w-3xl mx-auto px-6 py-16 bg-gradient-to-b from-white to-amber-50/30 rounded-3xl">
        <div className="rounded-2xl overflow-hidden mb-10 shadow-lg shadow-orange-100/60 food-photo-wrap relative">
          <img
            src={resolvedCoverImage}
            alt={post.title}
            className="w-full max-h-80 object-cover food-photo"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = pickFallback(post.slug || slug);
            }}
          />
          <span className="absolute top-4 left-4 rounded-full bg-white/85 backdrop-blur px-3 py-1 text-[10px] font-semibold text-orange-800 tracking-wide">
            RECIPE STORY
          </span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <p className="text-sm text-zinc-500 flex items-center gap-1.5">
            <Calendar size={13} />
            {formatDate(post.publishedAt || post.createdAt)}
          </p>
        </div>

        <h1 className="text-3xl font-bold text-zinc-900 mb-4 leading-tight">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-lg text-zinc-600 leading-relaxed mb-8 border-l-4 border-orange-500 pl-4">
            {post.excerpt}
          </p>
        )}

        <AdSenseBlock
          placement="blogArticleTop"
          className="mb-10 rounded-xl border border-amber-200 bg-white p-3"
        />

        <div
          className="prose prose-zinc max-w-none text-zinc-700 leading-relaxed blog-content"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />

        <AdSenseBlock
          placement="blogArticleBottom"
          className="mt-10 rounded-xl border border-amber-200 bg-white p-3"
        />

        <div className="mt-12 pt-8 border-t border-amber-100">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-orange-700 font-semibold hover:gap-3 transition-all"
          >
            <ArrowLeft size={16} />
            Back to Recipes
          </Link>
        </div>
      </article>
    </>
  );
}
