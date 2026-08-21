import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, ChevronDown } from 'lucide-react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { fetchAllFaqs, deleteFaq, reorderFaqs } from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import SSSForm from './SSSForm'
import { useDndReorder } from '../../hooks/useDndReorder.js'

function SortableRow({ faq, onDelete, onEdit, deletingId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: faq.id })
  const [expanded, setExpanded] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-5">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
        >
          <GripVertical size={20} />
        </button>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <p className="flex-1 font-semibold text-gray-800 text-base leading-snug">{faq.question}</p>
          <ChevronDown
            size={18}
            className={`text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {faq.published ? (
            <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full mr-2">
              <Eye size={12} /> Published
            </span>
          ) : (
            <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full mr-2">
              <EyeOff size={12} /> Hidden
            </span>
          )}
          <button
            onClick={() => onEdit(faq)}
            className="p-2 text-gray-400 hover:text-[#448834] hover:bg-green-50 rounded-lg transition-colors"
          >
            <Pencil size={17} />
          </button>
          <button
            onClick={() => onDelete(faq.id, faq.question)}
            disabled={deletingId === faq.id}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-50">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line pl-8 pt-4">{faq.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function SSSAdmin() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null) // null = closed, {} = new, {id,...} = editing

  const { sensors, handleDragEnd } = useDndReorder(faqs, setFaqs, reorderFaqs, setSaving)

  const load = () => {
    setLoading(true)
    fetchAllFaqs()
      .then(setFaqs)
      .catch((err) => {
        if (err.status === 401) {
          logout()
          navigate('/rnl-panel/login')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps


  const handleDelete = async (id, question) => {
    if (!confirm(`Delete the "${question}" question?`)) return
    setDeletingId(id)
    try {
      await deleteFaq(id)
      setFaqs((prev) => prev.filter((f) => f.id !== id))
    } catch (err) {
      alert('Silinemedi: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (editing !== null) {
    return (
      <SSSForm
        initial={editing}
        onSave={() => { setEditing(null); load() }}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">S.S.S.</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {faqs.length} soru
            {saving && <span className="ml-2 text-[#448834]">· kaydediliyor...</span>}
          </p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus size={16} />
          New Question
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="mb-4">No questions yet.</p>
          <button onClick={() => setEditing({})} className="text-[#448834] font-semibold hover:underline">
            Add the first question
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={faqs.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <SortableRow
                  key={faq.id}
                  faq={faq}
                  onDelete={handleDelete}
                  onEdit={setEditing}
                  deletingId={deletingId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </main>
  )
}
