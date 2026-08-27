import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, X } from 'lucide-react'
import {
  fetchBlogPost,
  fetchAllProjects,
  createBlogPost,
  updateBlogPost,
  uploadBlogCover,
} from '../../api/admin'
import RichTextEditor from '../../components/RichTextEditor'
import { API } from '../../api/config.js'
import { SITE_DOMAIN } from '../../lib/site'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function BlogForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const coverInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    metaDescription: '',
    editorialRating: '',
    content: '',
    ingredients: '',
    method: '',
    prepMinutes: '',
    cookMinutes: '',
    totalMinutes: '',
    servings: '',
    course: '',
    cuisine: '',
    calories: '',
    authorName: 'Pulse Recipe Editorial Team',
    authorBio: '',
    collectionId: '',
    published: false,
  })
  const [collections, setCollections] = useState([])
  const [coverPreview, setCoverPreview] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [slugManual, setSlugManual] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Koleksiyon seçimi için tüm projeler (taslaklar dahil): yazı, koleksiyon
  // yayına alınmadan da bağlanabilsin. Liste alınamazsa seçim kapalı kalır.
  useEffect(() => {
    fetchAllProjects()
      .then(setCollections)
      .catch(() => setCollections([]))
  }, [])

  // Tek yazıyı id ile çeker. Eskiden tüm liste indirilip içinden aranıyordu;
  // liste sayfalandığından (ve artık content/ingredients/method taşımadığından)
  // o yol hem yanlış hem gereksiz ağırdı.
  useEffect(() => {
    if (!isEdit) return
    fetchBlogPost(id).then((post) => {
      setForm({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        metaDescription: post.metaDescription || '',
        editorialRating: post.editorialRating ?? '',
        content: post.content || '',
        ingredients: post.ingredients || '',
        method: post.method || '',
        prepMinutes: post.prepMinutes ?? '',
        cookMinutes: post.cookMinutes ?? '',
        totalMinutes: post.totalMinutes ?? '',
        servings: post.servings || '',
        course: post.course || '',
        cuisine: post.cuisine || '',
        calories: post.calories ?? '',
        authorName: post.authorName || 'Pulse Recipe Editorial Team',
        authorBio: post.authorBio || '',
        collectionId: post.collectionId || '',
        published: post.published || false,
      })
      if (post.coverImage) setCoverPreview(`${API}${post.coverImage}`)
      setSlugManual(true)
      setLoading(false)
    }).catch(() => navigate('/rnl-panel/blog'))
  }, [id, isEdit, navigate])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleTitleChange = (val) => {
    set('title', val)
    if (!slugManual) set('slug', slugify(val))
  }

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const removeCover = () => {
    setCoverFile(null)
    setCoverPreview(null)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.slug.trim()) { setError('Slug is required.'); return }
    if (!form.content.trim()) { setError('Content is required.'); return }

    setSaving(true)
    try {
      let post
      if (isEdit) {
        // Upload a manually selected cover before publication. The backend can
        // then see it and will not spend an AI image call unnecessarily.
        if (coverFile) {
          await uploadBlogCover(id, coverFile)
          setCoverFile(null)
        }
        post = await updateBlogPost(id, form)
      } else {
        post = await createBlogPost(form)
        if (coverFile) await uploadBlogCover(post.id, coverFile)
      }
      navigate('/rnl-panel/blog')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[#448834] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/rnl-panel/blog')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Blog Posts
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Post' : 'New Blog Post'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug *</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => { setSlugManual(true); set('slug', e.target.value) }}
            placeholder="url-adresi"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
          />
          <p className="text-xs text-gray-400 mt-1">{SITE_DOMAIN}/recipes/{form.slug || '...'}</p>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Summary</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            placeholder="Short description shown in the blog list (optional)"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
          />
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description <span className="text-gray-400 font-normal">(Google arama sonucu)</span></label>
          <textarea
            value={form.metaDescription}
            onChange={(e) => set('metaDescription', e.target.value)}
            placeholder="If left empty the short summary is used. Max 160 characters recommended."
            rows={2}
            maxLength={160}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
          />
          <p className="text-xs text-gray-400 mt-1">{form.metaDescription.length}/160</p>
        </div>

        {/* Editorial rating */}
        <div>
          <label htmlFor="editorialRating" className="block text-sm font-medium text-gray-700 mb-1.5">
            Editorial Rating <span className="text-gray-400 font-normal">(0–10)</span>
          </label>
          <div className="relative max-w-48">
            <input
              id="editorialRating"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={form.editorialRating}
              onChange={(e) => set('editorialRating', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 9"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">/10</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Optional. Leave empty to hide the editorial rating on the public article.
          </p>
        </div>

        {/* Collection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Collection</label>
          <select
            value={form.collectionId}
            onChange={(e) => set('collectionId', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
          >
            <option value="">No collection</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.published ? '' : ' (taslak)'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            The post is listed on this collection&apos;s page. Leave empty to keep it in the blog only.
          </p>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image</label>
          {coverPreview ? (
            <div className="relative w-full h-52 rounded-xl overflow-hidden group">
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeCover}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#448834] hover:text-[#448834] transition-colors"
            >
              <Upload size={22} />
              <span className="text-sm">Upload cover image</span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label>
          <RichTextEditor value={form.content} onChange={(val) => set('content', val)} />
        </div>

        <section className="space-y-5 rounded-2xl border border-green-100 bg-green-50/40 p-5">
          <div>
            <h2 className="font-bold text-gray-900">Structured recipe sections</h2>
            <p className="mt-1 text-xs text-gray-500">These blocks appear separately on the public article page.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Ingredients</label>
            <RichTextEditor value={form.ingredients} onChange={(val) => set('ingredients', val)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Method</label>
            <RichTextEditor value={form.method} onChange={(val) => set('method', val)} />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-green-100 bg-green-50/40 p-5">
          <div>
            <h2 className="font-bold text-gray-900">Recipe card</h2>
            <p className="mt-1 text-xs text-gray-500">
              Shown as an “at a glance” box above the ingredients. Every field is optional —
              leave one blank and it is left out of the card. If the whole card is empty it is
              not rendered at all.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="prepMinutes" className="mb-1.5 block text-sm font-medium text-gray-700">Prep time (minutes)</label>
              <input id="prepMinutes" type="number" min={0} max={10080} placeholder="10" value={form.prepMinutes} onChange={(e) => set('prepMinutes', e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#448834] focus:outline-none focus:ring-2 focus:ring-[#448834]/30" />
            </div>
            <div>
              <label htmlFor="cookMinutes" className="mb-1.5 block text-sm font-medium text-gray-700">Cook time (minutes)</label>
              <input id="cookMinutes" type="number" min={0} max={10080} placeholder="30" value={form.cookMinutes} onChange={(e) => set('cookMinutes', e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#448834] focus:outline-none focus:ring-2 focus:ring-[#448834]/30" />
            </div>
            <div>
              <label htmlFor="totalMinutes" className="mb-1.5 block text-sm font-medium text-gray-700">Total time (minutes)</label>
              <input id="totalMinutes" type="number" min={0} max={10080} placeholder="prep + cook" value={form.totalMinutes} onChange={(e) => set('totalMinutes', e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#448834] focus:outline-none focus:ring-2 focus:ring-[#448834]/30" />
              <p className="mt-1 text-xs text-gray-400">Leave empty unless there is resting or marinating time — the page adds prep + cook on its own.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="servings" className="mb-1.5 block text-sm font-medium text-gray-700">Servings</label>
              <input id="servings" type="text" maxLength={80} placeholder="8 crescents" value={form.servings} onChange={(e) => set('servings', e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#448834] focus:outline-none focus:ring-2 focus:ring-[#448834]/30" />
            </div>
            <div>
              <label htmlFor="course" className="mb-1.5 block text-sm font-medium text-gray-700">Course</label>
              <input id="course" type="text" maxLength={80} placeholder="Dinner" value={form.course} onChange={(e) => set('course', e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#448834] focus:outline-none focus:ring-2 focus:ring-[#448834]/30" />
            </div>
            <div>
              <label htmlFor="cuisine" className="mb-1.5 block text-sm font-medium text-gray-700">Cuisine</label>
              <input id="cuisine" type="text" maxLength={120} placeholder="American" value={form.cuisine} onChange={(e) => set('cuisine', e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#448834] focus:outline-none focus:ring-2 focus:ring-[#448834]/30" />
            </div>
            <div>
              <label htmlFor="calories" className="mb-1.5 block text-sm font-medium text-gray-700">Calories (kcal)</label>
              <input id="calories" type="number" min={0} max={100000} placeholder="430" value={form.calories} onChange={(e) => set('calories', e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#448834] focus:outline-none focus:ring-2 focus:ring-[#448834]/30" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
          <div>
            <h2 className="font-bold text-gray-900">Author Info</h2>
            <p className="mt-1 text-xs text-gray-500">Author information displayed on this article.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Author name</label>
            <input type="text" maxLength={120} value={form.authorName} onChange={(e) => set('authorName', e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#448834] focus:outline-none focus:ring-2 focus:ring-[#448834]/30" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Author biography</label>
            <textarea rows={4} maxLength={2000} value={form.authorBio} onChange={(e) => set('authorBio', e.target.value)} className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#448834] focus:outline-none focus:ring-2 focus:ring-[#448834]/30" />
          </div>
        </section>

        {/* Publish status */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3.5">
          <button
            type="button"
            onClick={() => set('published', !form.published)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.published ? 'bg-[#448834]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.published ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {form.published ? 'Published' : 'Taslak'}
            </p>
            <p className="text-xs text-gray-400">
              {form.published ? 'The post is visible to everyone' : 'Only admins can see it'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#448834] hover:bg-[#357228] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Post'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/rnl-panel/blog')}
            className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}
