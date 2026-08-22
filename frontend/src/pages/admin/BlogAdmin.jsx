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
  deleteBlogPost,
  reorderBlogPosts,
} from "../../api/admin";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { API } from "../../api/config.js";
import { useDndReorder } from "../../hooks/useDndReorder.js";

function SortableRow({ post, onDelete, deletingId }) {
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
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={18} />
        </button>
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
        <p className="text-xs text-gray-300 mt-1">/blog/{post.slug}</p>
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

export default function BlogAdmin() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const { sensors, handleDragEnd } = useDndReorder(
    posts,
    setPosts,
    reorderBlogPosts,
    setSaving,
  );

  const load = () => {
    setLoading(true);
    fetchAllBlogPosts()
      .then(setPosts)
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete the "${title}" post?`)) return;
    setDeletingId(id);
    try {
      await deleteBlogPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
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
            {posts.length} posts
            {saving && (
              <span className="ml-2 text-[#448834]">· kaydediliyor...</span>
            )}
          </p>
        </div>
        <Link
          to="/rnl-panel/blog/yeni"
          className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus size={16} />
          New Post
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="mb-4">No blog posts yet.</p>
          <Link
            to="/rnl-panel/blog/yeni"
            className="text-[#448834] font-semibold hover:underline"
          >
            Add the first post
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-4 w-10" />
                    <th className="text-left px-3 py-4 font-medium w-20">
                      Cover
                    </th>
                    <th className="text-left px-5 py-4 font-medium">Title</th>
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
                        onDelete={handleDelete}
                        deletingId={deletingId}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        </div>
      )}
    </main>
  );
}
