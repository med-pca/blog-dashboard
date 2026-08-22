import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  X,
  Play,
  Sparkles,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { ProjeDetaySkeleton } from "../../components/Skeletons";
import LoadError from "../../components/LoadError";
import { fetchProjectBySlug, mediaUrl } from "../../api/projects";
import { fetchPostsByCollection } from "../../api/blog.js";
import SEO from "../../components/SEO";
import { formatDate } from "../../lib/date.js";
import { fallbackCover, resolveCoverSrc } from "../../lib/postCover.js";
import { waLink, WHATSAPP_ENABLED } from "../../lib/whatsapp";
import { SITE_URL } from "../../lib/site";

export default function ProjeDetay() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  function load() {
    setLoading(true);
    setError(null);
    fetchProjectBySlug(slug)
      .then(setProject)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setCurrent(0);
    setLightbox(null);
    setPosts([]);
    setPostsLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Recipes attached to this collection. Loaded after the collection itself,
  // since the endpoint keys off its id. A failure here empties the section
  // rather than breaking the page — the collection is still readable without it.
  useEffect(() => {
    if (!project?.id) return;
    let ignore = false;
    setPostsLoading(true);
    fetchPostsByCollection(project.id)
      .then((list) => {
        if (!ignore) setPosts(list);
      })
      .catch(() => {
        if (!ignore) setPosts([]);
      })
      .finally(() => {
        if (!ignore) setPostsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [project?.id]);

  if (loading || (error && error.status !== 404)) {
    return (
      <>
        <PageHeader
          title="Collection Detail"
          parent={{ label: "Collections", to: "/projelerimiz" }}
        />
        {loading ? (
          <ProjeDetaySkeleton />
        ) : (
          <LoadError
            message="Could not load this collection. Please check your connection and try again."
            onRetry={load}
          />
        )}
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <PageHeader
          title="Collection Not Found"
          parent={{ label: "Collections", to: "/projelerimiz" }}
        />
        <div className="py-32 text-center">
          <p className="text-gray-500 mb-4">
            This collection was not found or has been removed.
          </p>
          <Link
            to="/projelerimiz"
            className="text-[#448834] font-semibold hover:underline"
          >
            Back to all collections
          </Link>
        </div>
      </>
    );
  }

  const media = [...(project.media || [])]
    .filter((m) => m.type !== "thumbnail")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const item = media[current] || null;

  const prev = () => setCurrent((i) => (i - 1 + media.length) % media.length);
  const next = () => setCurrent((i) => (i + 1) % media.length);
  const lightboxPrev = (e) => {
    e.stopPropagation();
    setLightbox((i) => (i - 1 + media.length) % media.length);
  };
  const lightboxNext = (e) => {
    e.stopPropagation();
    setLightbox((i) => (i + 1) % media.length);
  };

  const thumbMedia = project.media?.find((m) => m.type === "thumbnail");
  const firstImage = media.find((m) => m.type === "image");
  const coverSrc = thumbMedia ?? firstImage;
  const coverImg = coverSrc
    ? `${SITE_URL}${mediaUrl(coverSrc.src)}`
    : undefined;
  const projectDesc = [
    project.location && `${project.location}`,
    project.kw && `${project.kw} recipes`,
    project.type,
    "featured food collection.",
    project.description,
  ]
    .filter(Boolean)
    .join(" ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: project.name,
    description: projectDesc.slice(0, 160),
    image: coverImg,
    url: `${SITE_URL}/projelerimiz/${slug}`,
    author: {
      "@type": "Organization",
      name: "Pulse Recipe",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Pulse Recipe",
      url: SITE_URL,
    },
  };

  return (
    <>
      <SEO
        title={project.name}
        description={projectDesc.slice(0, 160)}
        image={coverImg}
        jsonLd={jsonLd}
      />
      <PageHeader
        title={project.name}
        parent={{ label: "Collections", to: "/projelerimiz" }}
      />

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-start">
          {/* Gallery */}
          {media.length > 0 && item && (
            <div>
              <div
                className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-4/3 mb-3 group cursor-pointer"
                onClick={() => setLightbox(current)}
              >
                {item.type === "video" ? (
                  <>
                    <video
                      src={mediaUrl(item.src)}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <div className="bg-white/90 rounded-full p-4 shadow-lg">
                        <Play
                          size={28}
                          className="text-[#448834] ml-1"
                          fill="#448834"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={mediaUrl(item.src)}
                      alt={`${project.name} - ${project.location} collection visual`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded-full">
                        Zoom
                      </span>
                    </div>
                  </>
                )}
                {media.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prev();
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        next();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </>
                )}
                <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                  {current + 1} / {media.length}
                </span>
              </div>

              {media.length > 1 && (
                <div className="flex gap-2">
                  {media.map((m, i) => (
                    <button
                      key={m.id || i}
                      onClick={() => setCurrent(i)}
                      className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all relative ${i === current ? "border-[#448834]" : "border-transparent opacity-60 hover:opacity-100"}`}
                    >
                      {m.type === "video" ? (
                        <>
                          <video
                            src={mediaUrl(m.src)}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play
                              size={12}
                              className="text-white"
                              fill="white"
                            />
                          </div>
                        </>
                      ) : (
                        <img
                          src={mediaUrl(m.src)}
                          alt={`${project.name} gallery photo ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="space-y-8">
            {project.about && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  About This Collection
                </h2>
                {project.about.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="text-gray-600 leading-relaxed mt-3 first:mt-0"
                  >
                    {para}
                  </p>
                ))}
              </div>
            )}

            {project.specs?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {project.specsTitle}
                </h2>
                <ul className="space-y-3">
                  {project.specs.map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2
                        size={18}
                        className="text-[#448834] shrink-0 mt-0.5"
                      />
                      <span className="text-gray-700 font-medium">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {project.highlights?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {project.highlightsTitle}
                </h2>
                <ul className="space-y-3">
                  {project.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Sparkles
                        size={16}
                        className="text-[#f5ce31] shrink-0 mt-0.5"
                      />
                      <span className="text-gray-600 text-sm">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {project.statBoxes?.length > 0 && (
              <div
                className={`grid gap-3 ${project.statBoxes.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
              >
                {project.statBoxes.map((box, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-100 p-4 text-center"
                  >
                    <p className="text-[#448834] font-bold text-2xl font-['Rajdhani']">
                      {box.value}
                    </p>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      {box.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {WHATSAPP_ENABLED ? (
              <a
              href={waLink(
                `Hi, I would like recommendations similar to ${project.name}. Could you share details?`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-[#448834]/25"
            >
              {project.ctaText || "Get Similar Suggestions"}
              <ArrowRight size={17} />
            </a>
            ) : (
              <Link to="/iletisim" className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-[#448834]/25">
              {project.ctaText || "Get Similar Suggestions"}
              <ArrowRight size={17} />
            </Link>
            )}
          </div>
        </div>
      </section>

      {/* Recipes linked to this collection. Hidden while empty so a collection
          without posts yet never renders a bare heading. */}
      {(postsLoading || posts.length > 0) && (
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-2">
                  In This Collection
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {project.name} Recipes
                </h2>
                {!postsLoading && (
                  <p className="text-gray-500 text-sm mt-2">
                    {posts.length} recipe{posts.length === 1 ? "" : "s"} in this
                    collection.
                  </p>
                )}
              </div>
              <Link
                to="/blog"
                className="text-[#448834] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              >
                All recipes <ArrowRight size={14} />
              </Link>
            </div>

            {postsLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
                  >
                    <div className="h-48 bg-gray-100" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 w-24 bg-gray-100 rounded" />
                      <div className="h-4 w-full bg-gray-100 rounded" />
                      <div className="h-3 w-2/3 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, index) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-[#448834]/20 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
                  >
                    <div className="h-48 overflow-hidden bg-gray-100">
                      <img
                        src={resolveCoverSrc(post.coverImage, post.slug)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = fallbackCover(index);
                        }}
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-3">
                        <Calendar size={11} />
                        {formatDate(post.publishedAt || post.createdAt)}
                      </p>
                      <h3 className="font-bold text-gray-900 text-base leading-snug mb-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <span className="text-[#448834] text-sm font-semibold flex items-center gap-1 mt-auto group-hover:gap-2 transition-all">
                        Read Recipe <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightbox !== null && media[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-5 right-5 text-white/70 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X size={28} />
          </button>
          <button
            className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
            onClick={lightboxPrev}
          >
            <ArrowLeft size={28} />
          </button>
          {media[lightbox].type === "video" ? (
            <video
              src={mediaUrl(media[lightbox].src)}
              controls
              autoPlay
              className="h-[85vh] max-w-[90vw] w-auto rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={mediaUrl(media[lightbox].src)}
              alt=""
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
              loading="lazy"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <button
            className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
            onClick={lightboxNext}
          >
            <ArrowRight size={28} />
          </button>
          <span className="absolute bottom-5 text-white/50 text-sm">
            {lightbox + 1} / {media.length}
          </span>
        </div>
      )}
    </>
  );
}
