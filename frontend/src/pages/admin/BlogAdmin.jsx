import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Sparkles,
  Check,
  Ban,
  MessageSquare,
  Copy,
} from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  fetchAllBlogPosts,
  fetchAllProjects,
  deleteBlogPost,
  reorderBlogPosts,
  fetchAllBlogComments,
  moderateBlogComment,
  deleteBlogComment,
} from "../../api/admin";
import AdminPager from "../../components/AdminPager";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { API } from "../../api/config.js";
import { useDndReorder } from "../../hooks/useDndReorder.js";
import { titleKey } from "../../lib/titleKey.js";

function SortableRow({
  post,
  collectionName,
  onDelete,
  deletingId,
  reorderable,
  duplicateGroup,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
  };

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date(post.createdAt).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="hover:bg-gray-50/50 transition-colors bg-white"
    >
      <td className="px-4 py-4 w-10">
        {/* Sürükleme yalnızca filtresiz listede: süzülmüş bir listede satır
            taşımak, ekranda görünmeyen kayıtların sırasını bozardı. */}
        {reorderable ? (
          <button
            {...attributes}
            {...listeners}
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical size={18} />
          </button>
        ) : (
          <span
            title="Clear the filter to reorder posts"
            className="block text-gray-200"
          >
            <GripVertical size={18} />
          </span>
        )}
      </td>
      <td className="px-3 py-4 w-20">
        <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
          {post.coverImage ? (
            <img
              src={`${API}${post.coverImage}`}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-300 text-xs">No image</span>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="font-semibold text-gray-900 text-base leading-snug">
          {post.title}
        </p>
        {post.excerpt && (
          <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">
            {post.excerpt}
          </p>
        )}
        <p className="text-xs text-gray-300 mt-1">/recipes/{post.slug}</p>
      </td>
      <td className="px-5 py-4">
        {collectionName ? (
          <span className="inline-block text-xs font-medium text-[#448834] bg-green-50 px-2 py-1 rounded-full">
            {collectionName}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
      <td className="px-5 py-4 text-sm text-gray-400">{date}</td>
      <td className="px-5 py-4">
        <div className="flex flex-col items-start gap-1">
          {post.published ? (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <Eye size={14} /> Published
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              <EyeOff size={14} /> Taslak
            </span>
          )}
          {duplicateGroup !== undefined && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              <Copy size={11} /> Duplicate #{duplicateGroup}
            </span>
          )}
          {/* Written by an AI campaign; publication stays a manual decision. */}
          {post.aiGenerated && (
            <span className="flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
              <Sparkles size={11} /> {post.published ? "AI" : "AI Draft"}
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 justify-end">
          <Link
            to={`/rnl-panel/blog/${post.id}/duzenle`}
            className="p-2 text-gray-400 hover:text-[#448834] hover:bg-green-50 rounded-lg transition-colors"
          >
            <Pencil size={16} />
          </Link>
          <button
            onClick={() => onDelete(post.id, post.title)}
            disabled={deletingId === post.id}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "duplicate", label: "Duplicates" },
];

const EMPTY_STATE = {
  all: "No blog posts yet.",
  published: "No published posts.",
  draft: "No drafts — everything is published.",
  duplicate: "No duplicates: every post has a distinct title.",
};

export default function BlogAdmin() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  // { koleksiyonId: ad } — satırdaki rozet için; alınamazsa rozet boş kalır.
  const [collectionNames, setCollectionNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [moderatingId, setModeratingId] = useState(null);
  // Liste artık sayfa sayfa iniyor; sekme sayaçları her istekte global gelir.
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [pageCount, setPageCount] = useState(1);
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState({
    all: 0,
    published: 0,
    draft: 0,
    duplicate: 0,
  });

  // Sıralama global sortOrder yazar: sayfanın başlangıç indeksi gönderilmezse
  // 2. sayfadaki sürükleme 1. sayfanın sırasını ezer.
  const reorderable = filter === "all";
  const { sensors, handleDragEnd } = useDndReorder(
    posts,
    setPosts,
    (orderedIds) => reorderBlogPosts(orderedIds, offset),
    setSaving,
  );

  const load = () => {
    setLoading(true);
    fetchAllBlogPosts({ page, filter })
      .then((data) => {
        setPosts(data.posts);
        setPageCount(data.pageCount);
        setOffset(data.offset);
        setStats(data.stats);
      })
      .catch((err) => {
        if (err.status === 401) {
          logout();
          navigate("/rnl-panel/login");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAllProjects()
      .then((list) =>
        setCollectionNames(Object.fromEntries(list.map((c) => [c.id, c.name]))),
      )
      .catch(() => setCollectionNames({}));
    fetchAllBlogComments()
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, []);

  const changeFilter = (key) => {
    // Sekme değişince 1. sayfaya dön: eski sayfa yeni filtrede var olmayabilir.
    setFilter(key);
    setPage(1);
  };

  // Kopya görünümünde aynı başlığı paylaşan satırlara ortak bir numara verir,
  // böylece hangi ikilinin/üçlünün bir arada olduğu satırdan okunabilir.
  const duplicateGroups = (() => {
    if (filter !== "duplicate") return {};
    const numberByKey = new Map();
    const out = {};
    for (const post of posts) {
      const key = titleKey(post.title);
      if (!numberByKey.has(key)) numberByKey.set(key, numberByKey.size + 1);
      out[post.id] = numberByKey.get(key);
    }
    return out;
  })();

  const handleModerate = async (id, status) => {
    setModeratingId(id);
    try {
      const updated = await moderateBlogComment(id, status);
      setComments((items) => items.map((item) => item.id === id ? { ...item, status: updated.status } : item));
    } catch (err) {
      alert(err.message);
    } finally {
      setModeratingId(null);
    }
  };

  const handleCommentDelete = async (id) => {
    if (!confirm("Delete this comment permanently?")) return;
    setModeratingId(id);
    try {
      await deleteBlogComment(id);
      setComments((items) => items.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setModeratingId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete the "${title}" post?`)) return;
    setDeletingId(id);
    try {
      await deleteBlogPost(id);
      // Sayaçlar ve sayfa dolgusu sunucuda değişti: yerel filtrelemek yerine
      // sayfayı yeniden çek. Sayfadaki son kayıt silindiyse bir geri git.
      if (posts.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      alert("Silinemedi: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {stats.all} posts · {stats.draft} drafts
            {stats.duplicate > 0 && (
              <span className="ml-1 text-amber-600">
                · {stats.duplicate} duplicates
              </span>
            )}
            {saving && (
              <span className="ml-2 text-[#448834]">· kaydediliyor...</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <a
            href="#blog-comments-admin"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-100"
          >
            <MessageSquare size={16} />
            Comments
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs tabular-nums">
              {comments.filter((comment) => comment.status === "pending").length}
            </span>
          </a>
          <Link
            to="/rnl-panel/blog/yeni"
            className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            New Post
          </Link>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => changeFilter(key)}
            aria-pressed={filter === key}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              filter === key
                ? "bg-[#448834] text-white"
                : "border border-gray-100 bg-white text-gray-500 hover:text-gray-900"
            }`}
          >
            {key === "duplicate" && <Copy size={14} />}
            {label}
            <span
              className={`rounded-full px-1.5 text-xs tabular-nums ${
                filter === key
                  ? "bg-white/20"
                  : key === "duplicate" && stats.duplicate > 0
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-50 text-gray-400"
              }`}
            >
              {stats[key]}
            </span>
          </button>
        ))}
        {!reorderable && (
          <span className="ml-1 text-xs text-gray-400">
            Reordering is available on the “All” tab.
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="mb-4">{EMPTY_STATE[filter]}</p>
          {filter === "all" ? (
            <Link
              to="/rnl-panel/blog/yeni"
              className="text-[#448834] font-semibold hover:underline"
            >
              Add the first post
            </Link>
          ) : (
            <button
              onClick={() => changeFilter("all")}
              className="text-[#448834] font-semibold hover:underline"
            >
              Show all posts
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={reorderable ? handleDragEnd : undefined}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-4 w-10" />
                    <th className="text-left px-3 py-4 font-medium w-20">
                      Cover
                    </th>
                    <th className="text-left px-5 py-4 font-medium">Title</th>
                    <th className="text-left px-5 py-4 font-medium">
                      Collection
                    </th>
                    <th className="text-left px-5 py-4 font-medium">Date</th>
                    <th className="text-left px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <SortableContext
                  items={posts.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="divide-y divide-gray-50">
                    {posts.map((post) => (
                      <SortableRow
                        key={post.id}
                        post={post}
                        collectionName={collectionNames[post.collectionId]}
                        onDelete={handleDelete}
                        deletingId={deletingId}
                        reorderable={reorderable}
                        duplicateGroup={duplicateGroups[post.id]}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        </div>
      )}

      {!loading && (
        <AdminPager
          page={page}
          pageCount={pageCount}
          onChange={setPage}
          disabled={saving}
        />
      )}

      <section id="blog-comments-admin" className="mt-10 scroll-mt-6" aria-labelledby="comments-moderation-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="comments-moderation-title" className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <MessageSquare size={20} className="text-[#448834]" /> Blog Comments
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {comments.filter((comment) => comment.status === "pending").length} awaiting approval
            </p>
          </div>
        </div>

        {commentsLoading ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center text-sm text-gray-400">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center text-sm text-gray-400">No comments yet.</div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <article key={comment.id} className={`rounded-2xl border bg-white p-5 ${comment.status === "pending" ? "border-amber-200" : "border-gray-100"}`}>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900">{comment.authorName}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${comment.status === "approved" ? "bg-green-50 text-green-700" : comment.status === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>{comment.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{comment.authorEmail} · {comment.post?.title || "Blog article"}</p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600">{comment.content}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button title="Approve" disabled={moderatingId === comment.id} onClick={() => handleModerate(comment.id, "approved")} className="rounded-lg bg-green-50 p-2 text-green-700 hover:bg-green-100 disabled:opacity-40"><Check size={17} /></button>
                    <button title="Reject" disabled={moderatingId === comment.id} onClick={() => handleModerate(comment.id, "rejected")} className="rounded-lg bg-amber-50 p-2 text-amber-700 hover:bg-amber-100 disabled:opacity-40"><Ban size={17} /></button>
                    <button title="Delete" disabled={moderatingId === comment.id} onClick={() => handleCommentDelete(comment.id)} className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-40"><Trash2 size={17} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
