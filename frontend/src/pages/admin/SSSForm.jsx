import { useState } from 'react'
import { createFaq, updateFaq } from '../../api/admin'

export default function SSSForm({ initial = {}, onSave, onCancel }) {
  const isEdit = Boolean(initial.id)
  const [form, setForm] = useState({
    question: initial.question || '',
    answer: initial.answer || '',
    published: initial.published !== undefined ? initial.published : true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.question.trim()) { setError('Question is required.'); return }
    if (!form.answer.trim()) { setError('Answer is required.'); return }

    setSaving(true)
    try {
      if (isEdit) {
        await updateFaq(initial.id, form)
      } else {
        await createFaq(form)
      }
      onSave()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Question' : 'New Question'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Question *</label>
          <input
            type="text"
            value={form.question}
            onChange={(e) => set('question', e.target.value)}
            placeholder="Frequently asked question"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Answer *</label>
          <textarea
            value={form.answer}
            onChange={(e) => set('answer', e.target.value)}
            placeholder="The answer to the question"
            rows={6}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
          />
        </div>

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
          <p className="text-sm font-medium text-gray-700">
            {form.published ? 'Published' : 'Hidden'}
          </p>
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
            {saving ? 'Saving...' : isEdit ? 'Save' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}
