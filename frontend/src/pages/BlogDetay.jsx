import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  ArrowLeft,
  Star,
  BookOpen,
  Clock3,
  Printer,
  Utensils,
} from "lucide-react";
import DOMPurify from "dompurify";
import PageHeader from "../components/PageHeader";
import { BlogDetaySkeleton } from "../components/Skeletons";
import LoadError from "../components/LoadError";
import SEO from "../components/SEO";
import AdSenseBlock from "../components/AdSenseBlock";
import {
  fetchApprovedComments,
  fetchPostBySlug,
  submitBlogComment,
} from "../api/blog.js";
import { formatDate } from "../lib/date.js";
import { fallbackCover, resolveCoverSrc } from "../lib/postCover.js";
import { SITE_URL } from "../lib/site";

const RECIPE_HEADING_PATTERN =
  /ingredients|method|instructions|directions|step-by-step/i;

function prepareArticleContent(content) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = DOMPurify.sanitize(content);

  const usedIds = new Set();
  const headings = [...wrapper.querySelectorAll("h2, h3")].map(
    (heading, index) => {
      const label = heading.textContent?.trim() || `Section ${index + 1}`;
      const baseId =
        label
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `section-${index + 1}`;
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
      usedIds.add(id);
      heading.id = id;
      return { id, label, level: heading.tagName === "H3" ? 3 : 2 };
    },
  );

  return {
    html: wrapper.innerHTML,
    headings,
    recipeAnchor:
      headings.find(({ label }) => RECIPE_HEADING_PATTERN.test(label))?.id ||
      headings[0]?.id,
  };
}

// 40 -> "40 min", 90 -> "1 hr 30 min". Stored minutes are formatted here so
// the database never holds display strings.
function formatMinutes(minutes) {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

export default function BlogDetay() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentForm, setCommentForm] = useState({
    authorName: "",
    authorEmail: "",
    content: "",
  });
  const [commentState, setCommentState] = useState({
    saving: false,
    message: "",
    error: "",
  });
  const preparedContent = useMemo(
    () => prepareArticleContent(post?.content || ""),
    [post?.content],
  );
  // Only filled fields reach the card, and an all-empty card is not rendered at
  // all — existing posts keep looking exactly as they do until someone fills
  // the fields in. Total time falls back to prep + cook so the two can't clash.
  const recipeCard = useMemo(() => {
    if (!post) return [];
    const { prepMinutes: prep, cookMinutes: cook } = post;
    const total =
      post.totalMinutes ??
      (prep != null || cook != null ? (prep ?? 0) + (cook ?? 0) : null);
    return [
      { label: "Prep time", value: formatMinutes(prep) },
      { label: "Cook time", value: formatMinutes(cook) },
      { label: "Total time", value: formatMinutes(total) },
      { label: "Servings", value: post.servings },
      { label: "Course", value: post.course },
      { label: "Cuisine", value: post.cuisine },
      {
        label: "Calories",
        value: post.calories != null ? `${post.calories} kcal` : null,
      },
    ].filter((row) => row.value);
  }, [post]);

  function load() {
    setLoading(true);
    setError(null);
    fetchPostBySlug(slug)
      .then(setPost)
      .catch((err) => {
        if (err.status === 404) {
          navigate("/recipes", { replace: true });
          return;
        }
        setError(err);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    fetchApprovedComments(slug)
      .then(setComments)
      .catch(() => setComments([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleCommentSubmit(event) {
    event.preventDefault();
    setCommentState({ saving: true, message: "", error: "" });
    try {
      const result = await submitBlogComment(slug, commentForm);
      setCommentForm({ authorName: "", authorEmail: "", content: "" });
      setCommentState({ saving: false, message: result.message, error: "" });
    } catch (err) {
      setCommentState({ saving: false, message: "", error: err.message });
    }
  }

  if (loading || error) {
    return (
      <>
        <PageHeader
          title="Recipes"
          parent={{ to: "/recipes", label: "Recipes" }}
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
      : `${SITE_URL}${post.coverImage}`
    : `${SITE_URL}${fallbackCover(post.slug || slug)}`;

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
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Pulse Recipe",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/food/logo-mark.svg`,
      },
    },
  };

  function scrollToSection(id) {
    if (!id) return;
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <SEO
        title={post.title}
        description={post.metaDescription || post.excerpt || post.title}
        image={absoluteImage}
        type="article"
        jsonLd={blogSchema}
      />
      <article className="recipe-article bg-[#fffdf8]">
        <header className="border-b border-amber-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
            <nav
              className="mb-6 flex items-center gap-2 text-sm text-zinc-500"
              aria-label="Breadcrumb"
            >
              <Link to="/" className="hover:text-[#448834]">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link to="/recipes" className="hover:text-[#448834]">
                Recipes
              </Link>
            </nav>

            <div className="max-w-4xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#448834]">
                Everyday recipe
              </p>
              <h1 className="text-3xl font-extrabold leading-[1.15] text-zinc-900 sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-zinc-500">
                <span className="inline-flex items-center gap-2 font-semibold text-zinc-700">
                  <Utensils size={16} className="text-[#448834]" />{" "}
                  {post.authorName || "Pulse Recipe Editorial Team"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Calendar size={15} />{" "}
                  {formatDate(post.publishedAt || post.createdAt)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 size={15} /> Practical cooking guide
                </span>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      recipeCard.length > 0
                        ? "recipe-card"
                        : post.ingredients
                          ? "recipe-ingredients"
                          : post.method
                            ? "recipe-method"
                            : preparedContent.recipeAnchor,
                    )
                  }
                  disabled={
                    recipeCard.length === 0 &&
                    !post.ingredients &&
                    !post.method &&
                    !preparedContent.recipeAnchor
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-[#448834] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#357228] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <BookOpen size={17} /> Jump to recipe
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-bold text-zinc-700 transition hover:border-[#448834] hover:text-[#448834]"
                >
                  <Printer size={17} /> Print recipe
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="recipe-hero-image food-photo-wrap relative overflow-hidden rounded-2xl bg-zinc-100 shadow-xl shadow-amber-950/10 sm:rounded-[2rem]">
            <img
              src={resolvedCoverImage}
              alt={post.title}
              className="food-photo h-full w-full object-cover"
              fetchPriority="high"
              onError={(e) => {
                e.currentTarget.src = fallbackCover(post.slug || slug);
              }}
            />
            <span className="absolute left-5 top-5 z-10 rounded-full bg-white/90 px-4 py-2 text-[10px] font-bold tracking-[0.18em] text-[#448834] shadow-sm backdrop-blur">
              RECIPE STORY
            </span>
          </div>

          <div className="recipe-page-grid mt-10">
          <main className="min-w-0 rounded-2xl border border-amber-100 bg-white p-6 shadow-sm sm:p-9 lg:p-11">
            {post.editorialRating != null && (
              <div
                className="mb-8 inline-flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"
                aria-label={`Editorial rating: ${post.editorialRating} out of 10`}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700"
                  aria-hidden="true"
                >
                  <Star size={18} fill="currentColor" />
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                    Editorial Rating
                  </span>
                  <span className="text-lg font-bold">
                    {post.editorialRating}/10
                  </span>
                </span>
              </div>
            )}

            <AdSenseBlock
              placement="blogArticleTop"
              className="mb-10 rounded-xl border border-amber-200 bg-white p-3"
            />

            <div
              className="blog-content max-w-none text-zinc-700"
              dangerouslySetInnerHTML={{ __html: preparedContent.html }}
            />

            {recipeCard.length > 0 && (
              <section
                className="recipe-card scroll-mt-28"
                id="recipe-card"
                aria-label="Recipe details"
              >
                <p className="recipe-section-kicker">The recipe</p>
                <h2>{post.title}</h2>
                <dl className="recipe-card-grid">
                  {recipeCard.map(({ label, value }) => (
                    <div key={label} className="recipe-card-cell">
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {post.ingredients && (
              <section
                id="recipe-ingredients"
                className="recipe-structured-block scroll-mt-28"
              >
                <p className="recipe-section-kicker">What you’ll need</p>
                <h2>Ingredients</h2>
                <div
                  className="blog-content recipe-ingredients-list"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(post.ingredients),
                  }}
                />
              </section>
            )}

            {post.method && (
              <section
                id="recipe-method"
                className="recipe-structured-block scroll-mt-28"
              >
                <p className="recipe-section-kicker">Step by step</p>
                <h2>Method</h2>
                <div
                  className="blog-content recipe-method-steps"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(post.method),
                  }}
                />
              </section>
            )}

            <AdSenseBlock
              placement="blogArticleBottom"
              className="mt-10 rounded-xl border border-amber-200 bg-white p-3"
            />

            <section
              className="recipe-comments mt-12 border-t border-amber-100 pt-10"
              aria-labelledby="comments-title"
            >
              <div className="mb-7 flex items-end justify-between gap-4">
                <div>
                  <p className="recipe-section-kicker">Community</p>
                  <h2
                    id="comments-title"
                    className="text-2xl font-bold text-zinc-900"
                  >
                    Comments
                  </h2>
                </div>
                <span className="text-sm text-zinc-400">
                  {comments.length} approved
                </span>
              </div>

              <div className="space-y-4">
                {comments.length === 0 && (
                  <p className="rounded-xl bg-zinc-50 p-5 text-sm text-zinc-500">
                    No approved comments yet. Be the first to share your
                    experience.
                  </p>
                )}
                {comments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-zinc-900">
                        {comment.authorName}
                      </h3>
                      <time className="text-xs text-zinc-400">
                        {formatDate(comment.createdAt)}
                      </time>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-600">
                      {comment.content}
                    </p>
                  </article>
                ))}
              </div>

              <form
                onSubmit={handleCommentSubmit}
                className="mt-8 space-y-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-5 sm:p-6"
              >
                <div>
                  <h3 className="font-bold text-zinc-900">Leave a comment</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Your email stays private. Comments appear after admin
                    approval.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    maxLength={120}
                    value={commentForm.authorName}
                    onChange={(e) =>
                      setCommentForm((form) => ({
                        ...form,
                        authorName: e.target.value,
                      }))
                    }
                    placeholder="Your name"
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#448834] focus:ring-2 focus:ring-[#448834]/20"
                  />
                  <input
                    required
                    type="email"
                    maxLength={254}
                    value={commentForm.authorEmail}
                    onChange={(e) =>
                      setCommentForm((form) => ({
                        ...form,
                        authorEmail: e.target.value,
                      }))
                    }
                    placeholder="Your email"
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#448834] focus:ring-2 focus:ring-[#448834]/20"
                  />
                </div>
                <textarea
                  required
                  rows={5}
                  maxLength={3000}
                  value={commentForm.content}
                  onChange={(e) =>
                    setCommentForm((form) => ({
                      ...form,
                      content: e.target.value,
                    }))
                  }
                  placeholder="What did you think of this recipe?"
                  className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#448834] focus:ring-2 focus:ring-[#448834]/20"
                />
                {commentState.message && (
                  <p className="text-sm font-medium text-green-700">
                    {commentState.message}
                  </p>
                )}
                {commentState.error && (
                  <p className="text-sm font-medium text-red-600">
                    {commentState.error}
                  </p>
                )}
                <button
                  disabled={commentState.saving}
                  className="rounded-full bg-[#448834] px-5 py-3 text-sm font-bold text-white hover:bg-[#357228] disabled:opacity-50"
                >
                  {commentState.saving ? "Submitting…" : "Submit for review"}
                </button>
              </form>
            </section>

            <div className="mt-12 border-t border-amber-100 pt-8">
              <Link
                to="/recipes"
                className="inline-flex items-center gap-2 font-semibold text-[#448834] transition-all hover:gap-3"
              >
                <ArrowLeft size={16} /> Back to Recipes
              </Link>
            </div>
          </main>

          <aside className="recipe-sidebar" aria-label="Recipe navigation and author">
            <div className="recipe-sidebar-card">
              <p className="recipe-section-kicker">On this page</p>
              <nav className="mt-4" aria-label="Article table of contents">
                <ol className="recipe-toc-list">
                  {preparedContent.headings.map(({ id, label, level }) => (
                    <li key={id} className={level === 3 ? "recipe-toc-subitem" : ""}>
                      <button type="button" onClick={() => scrollToSection(id)}>{label}</button>
                    </li>
                  ))}
                  {recipeCard.length > 0 && <li><button type="button" onClick={() => scrollToSection("recipe-card")}>Recipe details</button></li>}
                  {post.ingredients && <li><button type="button" onClick={() => scrollToSection("recipe-ingredients")}>Ingredients</button></li>}
                  {post.method && <li><button type="button" onClick={() => scrollToSection("recipe-method")}>Method</button></li>}
                  <li><button type="button" onClick={() => scrollToSection("comments-title")}>Comments</button></li>
                </ol>
              </nav>
            </div>

            {recipeCard.length > 0 && (
              <div className="recipe-sidebar-card recipe-sidebar-facts">
                <p className="recipe-section-kicker">At a glance</p>
                <dl className="mt-4 divide-y divide-amber-100">
                  {recipeCard.slice(0, 4).map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <dt>{label}</dt><dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="recipe-author-card rounded-2xl bg-[#264f20] p-6 text-white shadow-sm">
              <div className="recipe-author-avatar" aria-hidden="true">
                {(post.authorName || "P").charAt(0).toUpperCase()}
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#f5ce31]">About the author</p>
              <h2 className="mt-2 text-xl font-bold">{post.authorName || "Pulse Recipe Editorial Team"}</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                {post.authorBio || "We review ingredient consistency, instructions, food-safety wording, and unsupported claims before publication."}
              </p>
              <Link to="/editorial-policy" className="mt-5 inline-flex text-sm font-bold text-[#f5ce31] hover:underline">Read our editorial policy</Link>
            </div>
          </aside>
          </div>
        </div>
      </article>
    </>
  );
}
