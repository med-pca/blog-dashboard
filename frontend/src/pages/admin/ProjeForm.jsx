import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Upload, X, Sparkles, CheckCircle2,
} from 'lucide-react'
import {
  createProject, updateProject, fetchAllProjects,
  uploadMedia, deleteMedia,
  parseInstagramPost,
} from '../../api/admin'
import { mediaUrl } from '../../api/projects'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

const EMPTY = {
  slug: '', name: '', location: '', kw: '', date: '',
  description: '', about: '', specsTitle: 'What Is Inside', specs: [],
  highlightsTitle: 'Highlights', highlights: [],
  statBoxes: [], ctaText: 'Get Similar Suggestions',
  published: true, sortOrder: 0,
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function ProjeForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { logout } = useAdminAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(EMPTY)
  const [specsText, setSpecsText] = useState('')
  const [highlightsText, setHighlightsText] = useState('')
  const [existingMedia, setExistingMedia] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [error, setError] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [instaText, setInstaText] = useState('')
  const [instaOpen, setInstaOpen] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [fillSuccess, setFillSuccess] = useState(0)

  useEffect(() => {
    if (!isEdit) return
    fetchAllProjects()
      .then((projects) => {
        const p = projects.find((x) => x.id === id)
        if (!p) { navigate('/rnl-panel/projeler'); return }
        setForm({
          slug: p.slug, name: p.name, location: p.location, kw: p.kw,
          date: p.date, description: p.description,
          about: p.about || '', specsTitle: p.specsTitle, specs: p.specs || [],
          highlightsTitle: p.highlightsTitle, highlights: p.highlights || [],
          statBoxes: p.statBoxes || [], ctaText: p.ctaText,
          published: p.published, sortOrder: p.sortOrder,
        })
        setSpecsText((p.specs || []).join('\n'))
        setHighlightsText((p.highlights || []).join('\n'))
        const sorted = [...(p.media || [])].sort((a, b) => b.sortOrder - a.sortOrder)
        setExistingMedia(sorted)
        setSlugManual(true)
      })
      .catch(() => { logout(); navigate('/rnl-panel/login') })
      .finally(() => setLoading(false))
  }, [id, isEdit, logout, navigate])

  const set = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val }
      if (key === 'name' && !slugManual) next.slug = slugify(val)
      return next
    })
  }

  const addStatBox = () =>
    setForm((p) => ({ ...p, statBoxes: [...p.statBoxes, { value: '', label: '' }] }))
  const updateStatBox = (i, field, val) =>
    setForm((p) => {
      const arr = [...p.statBoxes]
      arr[i] = { ...arr[i], [field]: val }
      return { ...p, statBoxes: arr }
    })
  const removeStatBox = (i) =>
    setForm((p) => ({ ...p, statBoxes: p.statBoxes.filter((_, idx) => idx !== i) }))

  const handleFilePick = (e) => {
    const files = Array.from(e.target.files)
    setNewFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  const removeNewFile = (i) => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))

  const handleDeleteExisting = async (mediaId) => {
    if (!confirm('Delete this media item?')) return
    try {
      await deleteMedia(id, mediaId)
      setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId))
    } catch (err) {
      alert('Silinemedi: ' + err.message)
    }
  }


  const handleInstaParse = async () => {
    if (!instaText.trim()) return
    setParsing(true)
    setParseError('')
    try {
      const parsed = await parseInstagramPost(instaText)
      let count = 0
      if (parsed.name) { set('name', parsed.name); setSlugManual(false); count++ }
      if (parsed.location) { set('location', parsed.location); count++ }
      if (parsed.kw) { set('kw', String(parsed.kw)); count++ }
if (parsed.description) { set('description', parsed.description); count++ }
      if (parsed.about) { set('about', parsed.about); count++ }
      if (parsed.date) { set('date', parsed.date); count++ }
      if (parsed.specs?.length) { setSpecsText(parsed.specs.join('\n')); count++ }
      if (parsed.highlights?.length) { setHighlightsText(parsed.highlights.join('\n')); count++ }
      if (parsed.statBoxes?.length) { setForm(p => ({ ...p, statBoxes: parsed.statBoxes })); count++ }
      setInstaText('')
      setFillSuccess(count)
      setTimeout(() => {
        setFillSuccess(0)
        setInstaOpen(false)
      }, 2200)
    } catch (err) {
      setParseError(err.message)
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const specs = specsText.split('\n').map(l => l.trim()).filter(Boolean)
      const highlights = highlightsText.split('\n').map(l => l.trim()).filter(Boolean)
      const payload = {
        ...form,
        specs,
        highlights,
        kw: Number(form.kw),
        sortOrder: Number(form.sortOrder),
      }
      let project
      if (isEdit) {
        project = await updateProject(id, payload)
      } else {
        project = await createProject(payload)
      }

      if (newFiles.length > 0) {
        setUploadingMedia(true)
        await uploadMedia(project.id, newFiles)
        setNewFiles([])
      }

      navigate('/rnl-panel/projeler')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
      setUploadingMedia(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/rnl-panel/projeler" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Collection' : 'New Collection'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Fill in all fields and save</p>
        </div>
      </div>

      {/* Instagram Parse */}
      <div className="mb-6">
        <style>{`
          @keyframes pop-in {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.15); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fade-up {
            0% { transform: translateY(8px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes dot-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-6px); opacity: 1; }
          }
          .dot-1 { animation: dot-bounce 1.2s ease-in-out infinite; }
          .dot-2 { animation: dot-bounce 1.2s ease-in-out 0.2s infinite; }
          .dot-3 { animation: dot-bounce 1.2s ease-in-out 0.4s infinite; }
          .success-icon { animation: pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
          .success-text { animation: fade-up 0.4s ease 0.2s both; }
          .success-sub { animation: fade-up 0.4s ease 0.35s both; }
        `}</style>

        {!instaOpen ? (
          <button
            type="button"
            onClick={() => setInstaOpen(true)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-linear-to-r from-[#448834] to-[#5aa042] hover:from-[#357228] hover:to-[#4a9035] text-white transition-all shadow-md shadow-[#448834]/20 hover:shadow-lg hover:shadow-[#448834]/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-bold">Auto-fill with AI</p>
              <p className="text-xs text-white/70 mt-0.5">Paste the Instagram text to fill the whole form</p>
            </div>
            <span className="text-white/50 text-lg">→</span>
          </button>
        ) : (
          <div className="rounded-2xl border border-[#448834]/20 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-linear-to-r from-[#448834] to-[#5aa042]">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles size={15} className="text-white" />
              </div>
              <p className="text-sm font-bold text-white flex-1">Auto-fill with AI</p>
              {!parsing && !fillSuccess && (
                <button type="button" onClick={() => { setInstaOpen(false); setParseError('') }}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X size={14} className="text-white" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="bg-white px-5 py-5">
              {fillSuccess > 0 ? (
                /* Success screen */
                <div className="flex flex-col items-center py-4 gap-3">
                  <div className="success-icon">
                    <CheckCircle2 size={52} className="text-[#448834]" strokeWidth={1.5} />
                  </div>
                  <p className="success-text text-base font-bold text-gray-900">Form dolduruldu!</p>
                  <p className="success-sub text-sm text-gray-400">{fillSuccess} alan otomatik dolduruldu</p>
                </div>
              ) : parsing ? (
                /* Loading screen */
                <div className="flex flex-col items-center py-6 gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="dot-1 w-2.5 h-2.5 rounded-full bg-[#448834] inline-block" />
                    <span className="dot-2 w-2.5 h-2.5 rounded-full bg-[#448834] inline-block" />
                    <span className="dot-3 w-2.5 h-2.5 rounded-full bg-[#448834] inline-block" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Analysing the text...</p>
                </div>
              ) : (
                /* Textarea */
                <>
                  <textarea
                    value={instaText}
                    onChange={(e) => setInstaText(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834] resize-none text-gray-700 placeholder-gray-300"
                    rows={6}
                    placeholder="Paste the Instagram post text here..."
                    autoFocus
                  />
                  {parseError && (
                    <p className="mt-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{parseError}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-400">All fields are auto-filled with AI</p>
                    <button
                      type="button"
                      onClick={handleInstaParse}
                      disabled={!instaText.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#448834] hover:bg-[#357228] disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors shrink-0 ml-4"
                    >
                      <Sparkles size={14} />
                      Doldur
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Temel Bilgiler */}
        <Section step={1} title="Temel Bilgiler">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Collection Name" required span={2}>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={INPUT}
                placeholder="Market GES Projesi"
                required
              />
            </Field>
            <Field label="Konum" required>
              <input value={form.location} onChange={(e) => set('location', e.target.value)} className={INPUT} placeholder="Weeknight Dinners" required />
            </Field>
            <Field label="Featured Recipes" required>
              <input type="number" step="0.01" min="0" max="99999999.99" value={form.kw} onChange={(e) => set('kw', e.target.value)} className={INPUT} placeholder="11.25" required />
            </Field>
            <Field label="Year" required>
              <input value={form.date} onChange={(e) => set('date', e.target.value)} className={INPUT} placeholder="2025" required />
            </Field>
            <Field label="Slug (URL)" required span={2}>
              <div className="flex items-center">
                <span className="text-xs text-gray-400 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg px-2.5 py-2 whitespace-nowrap">/collections/</span>
                <input
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); set('slug', e.target.value) }}
                  className="w-full border border-gray-200 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
                  required
                  placeholder="market-ges-projesi"
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* 2. Descriptions */}
        <Section step={2} title="Descriptions">
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium text-gray-700">Short Description <span className="text-red-400">*</span></label>
              <span className="text-xs text-gray-400">Shown on the list page</span>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className={`${INPUT} resize-none`}
              rows={3}
              required
              placeholder="A short, catchy description..."
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium text-gray-700">About This Collection</label>
              <span className="text-xs text-gray-400">Shown on the detail page</span>
            </div>
            <textarea
              value={form.about}
              onChange={(e) => set('about', e.target.value)}
              className={`${INPUT} resize-none`}
              rows={5}
              placeholder="A detailed description of what this collection gives the reader..."
            />
          </div>
        </Section>

        {/* 3. Features */}
        <Section step={3} title="Features">
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium text-gray-700">What Is Inside</label>
              <span className="text-xs text-gray-400">One item per line</span>
            </div>
            <textarea
              value={specsText}
              onChange={(e) => setSpecsText(e.target.value)}
              className={`${INPUT} resize-none`}
              rows={5}
              placeholder={"12 tested weeknight recipes\n30-minute average cook time\nPantry-friendly ingredient list"}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium text-gray-700">Highlights</label>
              <span className="text-xs text-gray-400">One item per line</span>
            </div>
            <textarea
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              className={`${INPUT} resize-none`}
              rows={4}
              placeholder={"Every recipe is tested twice in a home kitchen\nLeftovers reheat well the next day"}
            />
          </div>
        </Section>

        {/* 4. Stat Boxes */}
        <Section step={4} title="Stat Boxes">
          <div className="space-y-2">
            {form.statBoxes.map((box, i) => (
              <div key={i} className="flex gap-2 items-center bg-gray-50 rounded-xl px-3 py-2.5">
                <input
                  value={box.value}
                  onChange={(e) => updateStatBox(i, 'value', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834] font-semibold"
                  placeholder="11,25 kWp"
                />
                <span className="text-gray-300 text-sm">—</span>
                <input
                  value={box.label}
                  onChange={(e) => updateStatBox(i, 'label', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
                  placeholder="Featured Recipes"
                />
                <button type="button" onClick={() => removeStatBox(i)}
                  className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addStatBox}
              className="flex items-center gap-1.5 text-sm text-[#448834] hover:text-[#357228] font-medium py-1">
              <Plus size={15} /> Add Box
            </button>
          </div>
        </Section>

        {/* 5. Photo & Video */}
        <Section step={5} title="Photo & Video">
          {isEdit && existingMedia.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Current Media</p>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                {existingMedia.filter(m => m.type !== 'thumbnail').map((m) => (
                  <div key={m.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                    {m.type === 'video' ? (
                      <video src={mediaUrl(m.src)} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={mediaUrl(m.src)} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteExisting(m.id)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 size={15} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newFiles.length > 0 && (
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
              {newFiles.map((f, i) => (
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                  {f.type.startsWith('video') ? (
                    <video src={URL.createObjectURL(f)} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X size={15} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#448834] text-gray-400 hover:text-[#448834] rounded-xl px-4 py-4 text-sm font-medium transition-colors w-full justify-center"
          >
            <Upload size={16} />
            Choose File (Photo or Video)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFilePick}
          />

        </Section>

        {/* 6. Ayarlar */}
        <Section step={6} title="Ayarlar">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Field label="CTA Butonu Metni">
              <input value={form.ctaText} onChange={(e) => set('ctaText', e.target.value)} className={`${INPUT} max-w-xs`} />
            </Field>
            <label className="flex items-center gap-3 cursor-pointer mt-5">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set('published', e.target.checked)}
                className="w-4 h-4 accent-[#448834]"
              />
              <span className="text-sm font-medium text-gray-700">Publish on the site</span>
            </label>
          </div>
        </Section>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">{error}</p>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#448834] hover:bg-[#357228] disabled:opacity-60 text-white font-bold px-7 py-2.5 rounded-xl transition-colors text-sm shadow-sm shadow-[#448834]/20"
          >
            {saving
              ? (uploadingMedia ? 'Uploading media...' : 'Saving...')
              : (isEdit ? 'Save Changes' : 'Create Collection')}
          </button>
          <Link to="/rnl-panel/projeler" className="text-sm text-gray-500 hover:text-gray-700 font-medium px-2">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  )
}

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]'

function Section({ step, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
        <span className="w-6 h-6 rounded-full bg-[#448834] text-white text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-4">
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, required, hint, span }) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : undefined}>
      <div className="flex items-baseline gap-2 mb-1">
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
