import { useEffect, useImperativeHandle } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import type { RefObject } from "react"

export interface TRichTextEditorHandle {
  insertText: (text: string) => void
}

interface TRichTextEditorProps {
  label?: string
  defaultValue?: string
  onChange?: (html: string) => void
  editorRef?: RefObject<TRichTextEditorHandle | null>
}

type ToolbarButtonProps = {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}

function ToolbarButton({ active, onClick, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded text-sm font-medium transition-colors cursor-pointer
        ${active
          ? "bg-(--accent)/20 text-(--accent)"
          : "text-(--text-secondary) hover:bg-(--bg-hover)"
        }`}
    >
      {children}
    </button>
  )
}

function ToolbarSeparator() {
  return <span className="w-px h-5 bg-(--border) mx-1 self-center flex-shrink-0" />
}

export function TRichTextEditor({
  label,
  defaultValue,
  onChange,
  editorRef,
}: TRichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: defaultValue ?? "",
    onUpdate({ editor }) {
      onChange?.(editor.getHTML())
    },
  })

  // Expõe insertText via ref
  useImperativeHandle(
    editorRef,
    () => ({
      insertText(text: string) {
        editor?.chain().focus().insertContent(text).run()
      },
    }),
    [editor]
  )

  // Atualiza o conteúdo quando defaultValue muda (ex: carregamento do form de edição)
  useEffect(() => {
    if (!editor) return
    if (defaultValue === undefined || defaultValue === null) return
    // Só atualiza se o conteúdo for diferente para evitar loop
    if (editor.getHTML() !== defaultValue) {
      editor.commands.setContent(defaultValue)
    }
  }, [defaultValue, editor])

  if (!editor) return null

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-medium text-(--text-secondary)">
          {label}
        </label>
      )}

      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-0.5 p-1.5 border border-(--border) border-b-0
          rounded-t-lg bg-(--bg-surface)"
      >
        {/* Negrito */}
        <ToolbarButton
          title="Negrito"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>

        {/* Itálico */}
        <ToolbarButton
          title="Itálico"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>

        {/* Sublinhado */}
        <ToolbarButton
          title="Sublinhado"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* H1 */}
        <ToolbarButton
          title="Título 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </ToolbarButton>

        {/* H2 */}
        <ToolbarButton
          title="Título 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Lista bullets */}
        <ToolbarButton
          title="Lista com marcadores"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </ToolbarButton>

        {/* Lista numerada */}
        <ToolbarButton
          title="Lista numerada"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none" fontFamily="monospace">1.</text>
            <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none" fontFamily="monospace">2.</text>
            <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none" fontFamily="monospace">3.</text>
          </svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Alinhar esquerda */}
        <ToolbarButton
          title="Alinhar à esquerda"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="18" y2="18" />
          </svg>
        </ToolbarButton>

        {/* Centralizar */}
        <ToolbarButton
          title="Centralizar"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="6" y1="12" x2="18" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </ToolbarButton>

        {/* Alinhar direita */}
        <ToolbarButton
          title="Alinhar à direita"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="9" y1="12" x2="21" y2="12" />
            <line x1="6" y1="18" x2="21" y2="18" />
          </svg>
        </ToolbarButton>

        {/* Justificar */}
        <ToolbarButton
          title="Justificar"
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Desfazer */}
        <ToolbarButton
          title="Desfazer"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M3 13A9 9 0 1 0 6 6.7L3 13" />
          </svg>
        </ToolbarButton>

        {/* Refazer */}
        <ToolbarButton
          title="Refazer"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M21 13A9 9 0 1 1 18 6.7L21 13" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Área do editor */}
      <div
        className="border border-(--border) rounded-b-lg bg-(--bg-input) overflow-y-auto"
        style={{ minHeight: "300px" }}
      >
        <EditorContent
          editor={editor}
          className="trichtexteditor-content h-full"
        />
      </div>

      <style>{`
        .trichtexteditor-content .ProseMirror {
          min-height: 300px;
          padding: 0.75rem 1rem;
          outline: none;
          color: var(--text-primary);
          font-size: 0.9375rem;
          line-height: 1.6;
        }
        .trichtexteditor-content .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0.75rem 0 0.5rem;
        }
        .trichtexteditor-content .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem;
        }
        .trichtexteditor-content .ProseMirror p {
          margin: 0.25rem 0;
        }
        .trichtexteditor-content .ProseMirror ul {
          list-style: disc;
          padding-left: 1.5rem;
        }
        .trichtexteditor-content .ProseMirror ol {
          list-style: decimal;
          padding-left: 1.5rem;
        }
        .trichtexteditor-content .ProseMirror strong {
          font-weight: 700;
        }
        .trichtexteditor-content .ProseMirror em {
          font-style: italic;
        }
        .trichtexteditor-content .ProseMirror u {
          text-decoration: underline;
        }
        .trichtexteditor-content .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-muted);
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
}
