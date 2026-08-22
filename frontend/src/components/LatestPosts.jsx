import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { fetchPosts } from "../api/blog.js";
import { formatDate } from "../lib/date.js";
import { fallbackCover, resolveCoverSrc } from "../lib/postCover.js";

// "Latest from the blog" strip for the home page: the three most recent posts
// with a clear path to read more. It fails silent — if the blog is empty or the
// request fails, the section renders nothing rather than breaking the home page.
export default function LatestPosts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let ignore = false;
    fetchPosts()
      .then((data) => {
        if (!ignore) setPosts(Array.isArray(data) ? data.slice(0, 3) : []);
      })
      .catch(() => {
        if (!ignore) setPosts([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-amber-50/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">
              Latest from the Blog
            </h2>
            <p className="text-zinc-500 mt-2">
              Fresh recipes and practical kitchen tips.
            </p>
          </div>
          <Link
            to="/blog"
            className="hidden sm:inline-flex items-center gap-1.5 text-orange-700 font-semibold text-sm hover:gap-2.5 transition-all shrink-0"
          >
            View all recipes <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="bg-white rounded-2xl border border-amber-100 hover:shadow-xl hover:border-orange-300/60 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
            >
              <div className="h-48 overflow-hidden bg-amber-100/40 relative food-photo-wrap">
                <img
                  src={resolveCoverSrc(post.coverImage, index)}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 food-photo"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src =
                      fallbackCover(index);
                  }}
                />
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

        <div className="mt-10 text-center sm:hidden">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-orange-700 font-semibold text-sm"
          >
            View all recipes <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
