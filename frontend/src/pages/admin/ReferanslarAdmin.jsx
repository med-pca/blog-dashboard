import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { fetchAllReferences, deleteReference, reorderReferences } from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { API } from '../../api/config.js'
import { useDndReorder } from '../../hooks/useDndReorder.js'

function SortableRow({ r, onDelete, deletingId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: r.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
  }

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50/50 transition-colors bg-white">
      <td className="px-4 py-5 w-10">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={18} />
        </button>
      </td>
      <td className="px-3 py-5">
        <div className="w-16 h-16 shrink-0 flex items-center justify-center">
          {r.logo ? (
            <img src={`${API}${r.logo}`} alt={r.name} className="max-h-14 max-w-full object-contain" />
          ) : (
            <span className="text-gray-300 text-base font-bold">{r.name.charAt(0)}</span>
          )}
        </div>
      </td>
      <td className="px-5 py-5">
        <p className="font-semibold text-gray-900 text-base">{r.name}</p>
      </td>
      <td className="px-5 py-5">
        {r.published ? (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <Eye size={14} /> Published
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <EyeOff size={14} /> Hidden
          </span>
        )}
      </td>
      <td className="px-5 py-5">
        <div className="flex items-center gap-2 justify-end">
          <Link
            to={`/rnl-panel/referanslar/${r.id}/duzenle`}
            className="p-2 text-gray-400 hover:text-[#448834] hover:bg-green-50 rounded-lg transition-colors"
          >
            <Pencil size={16} />
          </Link>
          <button
            onClick={() => onDelete(r.id, r.name)}
            disabled={deletingId === r.id}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function ReferanslarAdmin() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [refs, setRefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const { sensors, handleDragEnd } = useDndReorder(refs, setRefs, reorderReferences, setSaving)

  const load = () => {
    setLoading(true)
    fetchAllReferences()
      .then(setRefs)
      .catch((err) => {
        if (err.status === 401) {
          logout()
          navigate('/rnl-panel/login')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps


  const handleDelete = async (id, name) => {
    if (!confirm(`Delete the "${name}" community entry?`)) return
    setDeletingId(id)
    try {
      await deleteReference(id)
      setRefs((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      alert('Could not delete: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Community</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {refs.length} entries
            {saving && <span className="ml-2 text-[#448834]">· saving...</span>}
          </p>
        </div>
        <Link
          to="/rnl-panel/referanslar/yeni"
          className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus size={16} />
          New Entry
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : refs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="mb-4">No community entries yet.</p>
          <Link to="/rnl-panel/referanslar/yeni" className="text-[#448834] font-semibold hover:underline">
            Add the first entry
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-4 w-10" />
                    <th className="text-left px-3 py-4 font-medium w-20">Image</th>
                    <th className="text-left px-5 py-4 font-medium">Name</th>
                    <th className="text-left px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <SortableContext items={refs.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-gray-50">
                    {refs.map((r) => (
                      <SortableRow
                        key={r.id}
                        r={r}
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
  )
}
