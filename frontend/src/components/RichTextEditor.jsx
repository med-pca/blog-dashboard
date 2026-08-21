import { useEditor, EditorContent, Extension, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link as LinkIcon, Undo, Redo,
  Minus, ChevronDown, X, ExternalLink, Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// Font size custom extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: size => ({ chain }) => chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
]

const FONT_SIZES = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px']

const COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1FAE5',
  '#DC2626', '#EA580C', '#D97706', '#16A34A', '#448834',
  '#2563EB', '#7C3AED', '#DB2777', '#FFFFFF', '#F3F4F6',
]

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick?.() }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-[#448834] text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } disabled:opacity-30`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5" />
}

function Dropdown({ label, options, onSelect, selected }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const handleSelect = (val) => {
    onSelect(val)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o) }}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 border border-gray-200 rounded hover:bg-gray-50 transition-colors min-w-22.5 justify-between"
      >
        <span className="truncate">{selected || label}</span>
        <ChevronDown size={12} className="shrink-0 text-gray-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-37.5 max-h-52 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.value) }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
              style={opt.style}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ColorPicker({ editor, currentColor }) {
  const [open, setOpen] = useState(false)
  const current = currentColor || '#000000'

  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o) }}
        title="Text colour"
        className="flex flex-col items-center p-1.5 rounded hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-bold text-gray-700 leading-none">A</span>
        <span className="w-4 h-1 rounded-full mt-0.5" style={{ backgroundColor: current }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3 w-48">
          <p className="text-xs text-gray-400 mb-2">Pick a colour</p>
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  editor.chain().focus().setColor(c).run()
                  setOpen(false)
                }}
                className="w-7 h-7 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              defaultValue={current}
              onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
              className="w-8 h-8 rounded cursor-pointer border border-gray-200"
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setOpen(false) }}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LinkModal({ open, initialUrl, onApply, onRemove, onClose }) {
  const [url, setUrl] = useState(initialUrl || '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrl(initialUrl || '')
      setTimeout(() => inputRef.current?.select(), 30)
    }
  }, [open, initialUrl])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onApply(url) }
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#448834]/10 rounded-lg flex items-center justify-center">
              <LinkIcon size={16} className="text-[#448834]" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Add Link</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">URL Adresi</label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-[#448834] focus-within:ring-2 focus-within:ring-[#448834]/20 transition-all">
            <ExternalLink size={15} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://ornek.com"
              className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-300 bg-transparent"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Must start with https://</p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onApply(url)}
            className="flex-1 bg-[#448834] hover:bg-[#357228] text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
          >
            Uygula
          </button>
          {initialUrl && (
            <button
              type="button"
              onClick={onRemove}
              title="Remove link"
              className="p-2.5 border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded-xl transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RichTextEditor({ value, onChange }) {
  const [linkModal, setLinkModal] = useState({ open: false, url: '' })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-[#448834] underline' } }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'min-h-[320px] px-5 py-4 focus:outline-none text-gray-800 leading-relaxed',
      },
    },
  })

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return {
        isBold: false, isItalic: false, isUnderline: false, isStrike: false,
        isLink: false, isBulletList: false, isOrderedList: false,
        isH1: false, isH2: false, isH3: false,
        isAlignLeft: false, isAlignCenter: false, isAlignRight: false, isAlignJustify: false,
        canUndo: false, canRedo: false,
        fontFamily: '', fontSize: '', textColor: '#000000',
      }
      return {
        isBold: ctx.editor.isActive('bold'),
        isItalic: ctx.editor.isActive('italic'),
        isUnderline: ctx.editor.isActive('underline'),
        isStrike: ctx.editor.isActive('strike'),
        isLink: ctx.editor.isActive('link'),
        isBulletList: ctx.editor.isActive('bulletList'),
        isOrderedList: ctx.editor.isActive('orderedList'),
        isH1: ctx.editor.isActive('heading', { level: 1 }),
        isH2: ctx.editor.isActive('heading', { level: 2 }),
        isH3: ctx.editor.isActive('heading', { level: 3 }),
        isAlignLeft: ctx.editor.isActive({ textAlign: 'left' }),
        isAlignCenter: ctx.editor.isActive({ textAlign: 'center' }),
        isAlignRight: ctx.editor.isActive({ textAlign: 'right' }),
        isAlignJustify: ctx.editor.isActive({ textAlign: 'justify' }),
        canUndo: ctx.editor.can().undo(),
        canRedo: ctx.editor.can().redo(),
        fontFamily: ctx.editor.getAttributes('textStyle').fontFamily || '',
        fontSize: ctx.editor.getAttributes('textStyle').fontSize || '',
        textColor: ctx.editor.getAttributes('textStyle').color || '#000000',
      }
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    // Cursor (no selection) sitting on a link: remove it directly
    if (editor.isActive('link') && editor.state.selection.empty) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    // Text selected or no link: open the modal
    const prev = editor.getAttributes('link').href || ''
    setLinkModal({ open: true, url: prev })
  }, [editor])

  const applyLink = (url) => {
    setLinkModal({ open: false, url: '' })
    if (!url) return
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const removeLink = () => {
    setLinkModal({ open: false, url: '' })
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
  }

  if (!editor) return null

  const currentFontLabel = FONT_FAMILIES.find((f) => f.value === editorState.fontFamily)?.label || 'Font'
  const currentSizeLabel = editorState.fontSize || 'Size'

  return (
    <>
    <LinkModal
      open={linkModal.open}
      initialUrl={linkModal.url}
      onApply={applyLink}
      onRemove={removeLink}
      onClose={() => setLinkModal({ open: false, url: '' })}
    />
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#448834]/30 focus-within:border-[#448834]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-gray-100 bg-gray-50">

        {/* Font family */}
        <Dropdown
          label="Font"
          selected={currentFontLabel !== 'Font' && currentFontLabel !== 'Default' ? currentFontLabel : undefined}
          options={FONT_FAMILIES.map((f) => ({
            label: f.label,
            value: f.value,
            style: { fontFamily: f.value || 'inherit' },
          }))}
          onSelect={(val) => {
            if (!val) editor.chain().focus().unsetFontFamily().run()
            else editor.chain().focus().setFontFamily(val).run()
          }}
        />

        {/* Font size */}
        <Dropdown
          label="Boyut"
          selected={currentSizeLabel !== 'Boyut' ? currentSizeLabel : undefined}
          options={FONT_SIZES.map((s) => ({ label: s, value: s }))}
          onSelect={(val) => editor.chain().focus().setFontSize(val).run()}
        />

        <Divider />

        {/* Headings */}
        <Dropdown
          label="Normal"
          selected={
            editorState.isH1 ? 'Heading 1'
            : editorState.isH2 ? 'Heading 2'
            : editorState.isH3 ? 'Heading 3'
            : undefined
          }
          options={[
            { label: 'Normal', value: '0' },
            { label: 'Heading 1', value: '1' },
            { label: 'Heading 2', value: '2' },
            { label: 'Heading 3', value: '3' },
          ]}
          onSelect={(val) => {
            if (val === '0') editor.chain().focus().setParagraph().run()
            else editor.chain().focus().toggleHeading({ level: parseInt(val) }).run()
          }}
        />

        <Divider />

        {/* Format */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editorState.isBold} title="Bold (Ctrl+B)">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editorState.isItalic} title="Italic (Ctrl+I)">
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editorState.isUnderline} title="Underline (Ctrl+U)">
          <UnderlineIcon size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editorState.isStrike} title="Strikethrough">
          <Strikethrough size={15} />
        </ToolbarButton>

        <Divider />

        {/* Color */}
        <ColorPicker editor={editor} currentColor={editorState.textColor} />

        <Divider />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editorState.isAlignLeft} title="Sola hizala">
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editorState.isAlignCenter} title="Ortala">
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editorState.isAlignRight} title="Align right">
          <AlignRight size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editorState.isAlignJustify} title="Justify">
          <AlignJustify size={15} />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editorState.isBulletList} title="Madde listesi">
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editorState.isOrderedList} title="Numbered list">
          <ListOrdered size={15} />
        </ToolbarButton>

        <Divider />

        {/* Link */}
        <ToolbarButton onClick={setLink} active={editorState.isLink} title={editorState.isLink ? 'Remove link' : 'Add link'}>
          <LinkIcon size={15} />
        </ToolbarButton>

        {/* HR */}
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <Minus size={15} />
        </ToolbarButton>

        <Divider />

        {/* Undo / Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editorState.canUndo} title="Undo (Ctrl+Z)">
          <Undo size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editorState.canRedo} title="Redo (Ctrl+Y)">
          <Redo size={15} />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      <style>{`
        .ProseMirror h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; }
        .ProseMirror h3 { font-size: 1.25em; font-weight: 600; margin: 0.5em 0; }
        .ProseMirror p { margin: 0.4em 0; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; margin: 0.4em 0; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.4em 0; }
        .ProseMirror hr { border: none; border-top: 2px solid #e5e7eb; margin: 1em 0; }
        .ProseMirror blockquote { border-left: 4px solid #448834; padding-left: 1em; color: #6b7280; margin: 0.5em 0; }
        .ProseMirror code { background: #f3f4f6; padding: 0.1em 0.3em; border-radius: 4px; font-family: monospace; }
        .ProseMirror pre { background: #1f2937; color: #f9fafb; padding: 1em; border-radius: 8px; overflow-x: auto; }
        .ProseMirror pre code { background: none; padding: 0; }
        .ProseMirror a { color: #448834; text-decoration: underline; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; float: left; height: 0; }
      `}</style>
    </div>
    </>
  )
}
