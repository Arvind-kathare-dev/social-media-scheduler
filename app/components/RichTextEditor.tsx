import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Type, Paperclip, X, Check,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Code, Link as LinkIcon,
  Heading1, Heading2, AlignLeft, Quote, Minus, Image as ImageIcon, AtSign,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

interface MentionUser {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  users?: MentionUser[];
  actionButton?: React.ReactNode;
}

export default function RichTextEditor({ value, onChange, placeholder, users = [], actionButton }: RichTextEditorProps) {
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);

  // Link popover state
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  // Save selection before opening popover so we can restore it
  const savedSelection = useRef<{ from: number; to: number } | null>(null);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionStartPos = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const insertBtnRef = useRef<HTMLButtonElement>(null);
  const formatBtnRef = useRef<HTMLButtonElement>(null);

  // Portal dropdown positions
  const [insertPos, setInsertPos] = useState<{ top: number; left: number } | null>(null);
  const [formatPos, setFormatPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const openInsert = (e: React.MouseEvent) => {
    e.preventDefault();
    if (insertBtnRef.current) {
      const r = insertBtnRef.current.getBoundingClientRect();
      setInsertPos({ top: r.top - 8, left: r.left });
    }
    setShowInsertMenu(v => !v);
    setShowFormatMenu(false);
    setShowLinkPopover(false);
  };

  const openFormat = (e: React.MouseEvent) => {
    e.preventDefault();
    if (formatBtnRef.current) {
      const r = formatBtnRef.current.getBoundingClientRect();
      setFormatPos({ top: r.top - 8, left: r.left });
    }
    setShowFormatMenu(v => !v);
    setShowInsertMenu(false);
    setShowLinkPopover(false);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Underline,
      Link.configure({
        openOnClick: 'whenNotEditable',
        autolink: true,
        linkOnPaste: true,
      }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: placeholder || 'Type notes for assignee...' })
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'w-full bg-transparent p-3 text-[13px] text-text outline-none min-h-[120px] max-w-none focus:outline-none tiptap-editor',
      },
      handleKeyDown(view, event) {
        if (showMentionMenu) {
          if (event.key === 'ArrowDown') { event.preventDefault(); setMentionIndex(i => Math.min(i + 1, filteredUsers.length - 1)); return true; }
          if (event.key === 'ArrowUp') { event.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return true; }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            if (filteredUsers[mentionIndex]) insertMention(filteredUsers[mentionIndex]);
            return true;
          }
          if (event.key === 'Escape') { setShowMentionMenu(false); mentionStartPos.current = null; return true; }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());

      // @mention detection
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(Math.max(0, from - 50), from, '\n');
      const atIndex = textBefore.lastIndexOf('@');
      if (atIndex !== -1) {
        const query = textBefore.slice(atIndex + 1);
        if (!query.includes(' ') && !query.includes('\n')) {
          mentionStartPos.current = from - query.length - 1;
          setMentionQuery(query);
          setMentionIndex(0);
          setShowMentionMenu(true);
          return;
        }
      }
      setShowMentionMenu(false);
      mentionStartPos.current = null;
    },
    onFocus: () => {
      setShowFormatMenu(false);
      setShowInsertMenu(false);
    }
  });

  // Clear editor when value is reset to empty
  useEffect(() => {
    if (editor && value === '') {
      // Use setContent instead of clearContent to avoid completely removing the paragraph wrapper
      editor.commands.setContent('');
    }
  }, [value, editor]);

  const insertMention = useCallback((user: MentionUser) => {
    if (!editor || mentionStartPos.current === null) return;
    const { from } = editor.state.selection;
    editor.chain().focus()
      .deleteRange({ from: mentionStartPos.current, to: from })
      .insertContent(`<strong>@${user.name}</strong>&nbsp;`)
      .run();
    setShowMentionMenu(false);
    mentionStartPos.current = null;
    setMentionQuery('');
  }, [editor]);

  // ─── Link helpers ──────────────────────────────────────────────
  const openLinkPopover = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!editor) return;
    // Snapshot selection BEFORE the input steals focus
    const { from, to } = editor.state.selection;
    savedSelection.current = { from, to };
    const existingHref = editor.getAttributes('link').href || '';
    setLinkUrl(existingHref);
    setShowLinkPopover(true);
    setShowFormatMenu(false);
    setShowInsertMenu(false);
    setTimeout(() => linkInputRef.current?.focus(), 30);
  };

  const applyLink = () => {
    if (!editor) return;
    const raw = linkUrl.trim();
    if (!raw) { removeLinkAndClose(); return; }

    let href = raw;
    // Fix missing slashes in typed protocols (e.g., "http:example.com" -> "http://example.com")
    if (/^https?:(?![\/\\])/i.test(href)) {
      href = href.replace(/^https?:[\/\\]*/i, (match) => match.toLowerCase().startsWith('https') ? 'https://' : 'http://');
    } else if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:/i.test(href)) {
      // If there's no protocol at all, prepend https://
      href = `https://${href}`;
    }

    const { from, to } = savedSelection.current ?? editor.state.selection;

    if (from === to) {
      // No text selected — insert the URL itself as clickable link text
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .insertContent(`<a href="${href}">${href}</a>`)
        .run();
    } else {
      // Text was selected — wrap it with the link mark
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .setLink({ href })
        .run();
    }
    closeLinkPopover();
  };

  const removeLinkAndClose = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    closeLinkPopover();
  };

  const closeLinkPopover = () => {
    setShowLinkPopover(false);
    setLinkUrl('');
    savedSelection.current = null;
  };

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowFormatMenu(false);
        setShowInsertMenu(false);
        setShowMentionMenu(false);
        closeLinkPopover();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          editor?.chain().focus().setImage({ src: ev.target?.result as string }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    setShowInsertMenu(false);
  };

  if (!editor) return null;

  const roleColors: Record<string, string> = {
    admin: 'text-danger',
    designer: 'text-primary',
    developer: 'text-indigo-500',
    editor: 'text-warning',
  };

  const isLinkActive = editor.isActive('link');

  return (
    <div className="relative w-full" ref={containerRef}>

      {/* ── Format Popover (portaled) ─────────────────────────── */}
      {showFormatMenu && formatPos && mounted && createPortal(
        <div
          onMouseDown={(e) => e.preventDefault()}
          style={{ position: 'fixed', top: formatPos.top, left: formatPos.left, transform: 'translateY(-100%)', zIndex: 99999 }}
          className="bg-panel-2 border border-line rounded-xl shadow-2xl flex items-center p-1 text-muted"
        >
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }} className={`p-2 rounded transition-colors ${editor.isActive('bold') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Bold"><Bold size={15} /></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }} className={`p-2 rounded transition-colors ${editor.isActive('italic') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Italic"><Italic size={15} /></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }} className={`p-2 rounded transition-colors ${editor.isActive('underline') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Underline"><UnderlineIcon size={15} /></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }} className={`p-2 rounded transition-colors ${editor.isActive('strike') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Strikethrough"><Strikethrough size={15} /></button>
          <div className="w-px h-5 bg-line mx-1" />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }} className={`p-2 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Bulleted list"><List size={15} /></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }} className={`p-2 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Numbered list"><ListOrdered size={15} /></button>
          <div className="w-px h-5 bg-line mx-1" />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleCodeBlock().run(); }} className={`p-2 rounded transition-colors ${editor.isActive('codeBlock') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Code block"><Code size={15} /></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); openLinkPopover(e as any); }} className={`p-2 rounded transition-colors ${isLinkActive ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Link"><LinkIcon size={15} /></button>
        </div>,
        document.body
      )}

      {/* ── Insert Popover (portaled) ─────────────────────────── */}
      {showInsertMenu && insertPos && mounted && createPortal(
        <div
          onMouseDown={(e) => e.preventDefault()}
          style={{ position: 'fixed', top: insertPos.top, left: insertPos.left, transform: 'translateY(-100%)', zIndex: 99999, width: '14rem' }}
          className="bg-panel border border-line rounded-xl shadow-2xl py-2 text-text text-[13px]"
        >
          <div className="px-3 pb-2 text-xs font-semibold text-muted border-b border-line">Insert block</div>
          <div className="max-h-[240px] overflow-y-auto pt-1">
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setParagraph().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 text-left rounded-md mx-auto"><AlignLeft size={13} /> Paragraph</button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 text-left"><Heading1 size={13} /> Heading 1</button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 text-left"><Heading2 size={13} /> Heading 2</button>
            <div className="h-px bg-line my-1" />
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 text-left"><List size={13} /> Bulleted list</button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 text-left"><ListOrdered size={13} /> Numbered list</button>
            <div className="h-px bg-line my-1" />
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 text-left"><Quote size={13} /> Quote</button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleCodeBlock().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 text-left"><Code size={13} /> Code block</button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 text-left"><Minus size={13} /> Divider</button>
            <div className="h-px bg-line my-1" />
            <button onMouseDown={(e) => { e.preventDefault(); handleImageUpload(); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 text-left"><ImageIcon size={13} /> Image</button>
            <button onMouseDown={(e) => { e.preventDefault(); openLinkPopover(e as any); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 text-left"><LinkIcon size={13} /> Embed link</button>
          </div>
        </div>,
        document.body
      )}

      {/* ── Link URL Popover ───────────────────────────────────── */}
      {showLinkPopover && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute bottom-[44px] left-0 right-0 z-[300] bg-panel border border-primary/30 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-panel-2/50">
            <LinkIcon size={13} className="text-primary shrink-0" />
            <span className="text-[11px] font-bold text-text uppercase tracking-wider">
              {isLinkActive ? 'Edit Link' : 'Add Link'}
            </span>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); closeLinkPopover(); }}
              className="ml-auto w-6 h-6 flex items-center justify-center rounded hover:bg-line/50 text-muted transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* URL Input Row */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className="flex-1 flex items-center gap-2 bg-panel-2 border border-line rounded-lg px-3 py-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <LinkIcon size={12} className="text-muted shrink-0" />
              <input
                ref={linkInputRef}
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                  if (e.key === 'Escape') { e.preventDefault(); closeLinkPopover(); }
                }}
                placeholder="https://example.com"
                className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-muted/50"
              />
              {linkUrl && (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setLinkUrl(''); linkInputRef.current?.focus(); }}
                  className="text-muted hover:text-text transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Apply button */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyLink(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[12px] font-semibold rounded-lg hover:opacity-90 transition-opacity shrink-0"
            >
              <Check size={13} /> Apply
            </button>
          </div>

          {/* Remove link (only shown when editing existing) */}
          {isLinkActive && (
            <div className="px-3 pb-2.5">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); removeLinkAndClose(); }}
                className="text-[11px] text-danger font-semibold hover:underline flex items-center gap-1"
              >
                <X size={11} /> Remove link
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Mention Dropdown ───────────────────────────────────── */}
      {showMentionMenu && filteredUsers.length > 0 && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute bottom-[44px] left-0 w-full sm:w-72 bg-panel border border-line rounded-xl shadow-2xl z-[200] overflow-hidden"
        >
          <div className="px-3 py-2 text-[10px] font-bold text-muted uppercase tracking-wider border-b border-line flex items-center gap-1.5">
            <AtSign size={10} /> Mention a user
          </div>
          <div className="overflow-y-auto max-h-[320px] py-1" style={{ scrollbarWidth: 'thin' }}>
            {filteredUsers.map((u, i) => (
              <button
                key={u.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${i === mentionIndex ? 'bg-primary/10 text-primary' : 'hover:bg-panel-2 text-text'}`}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                  {u.avatar || u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-semibold leading-tight truncate">{u.name}</span>
                  {u.role && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${roleColors[u.role] || 'text-muted'}`}>
                      {u.role}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Editor Box ─────────────────────────────────────────── */}
      <div className="border border-line rounded-xl overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all bg-panel flex flex-col">
        <EditorContent editor={editor} />

        {/* Bottom Toolbar */}
        <div className="px-2 py-1.5 flex items-center justify-between bg-panel-2/40 border-t border-line/50">
          <div className="flex items-center gap-0.5 text-muted">
            {/* Insert */}
            <button
              ref={insertBtnRef}
              type="button"
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${showInsertMenu ? 'bg-line/50 text-text' : 'hover:bg-line/30 hover:text-text'}`}
              onMouseDown={openInsert}
              title="Insert block"
            >
              <Plus size={14} />
            </button>
            {/* Format */}
            <button
              ref={formatBtnRef}
              type="button"
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${showFormatMenu ? 'bg-line/50 text-text' : 'hover:bg-line/30 hover:text-text'}`}
              onMouseDown={openFormat}
              title="Format text"
            >
              <Type size={14} />
            </button>

            <div className="w-px h-4 bg-line/60 mx-1" />

            {/* Mention */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); editor.chain().focus().insertContent('@').run(); }}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${showMentionMenu ? 'bg-primary/10 text-primary' : 'hover:bg-line/30 hover:text-text'}`}
              title="Mention a user"
            >
              <AtSign size={14} />
            </button>
            {/* Image */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleImageUpload(); }}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-line/30 hover:text-text transition-colors"
              title="Attach image"
            >
              <Paperclip size={14} />
            </button>
            {/* Link — next to file attach */}
            <button
              type="button"
              onClick={openLinkPopover}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${isLinkActive || showLinkPopover ? 'bg-primary/10 text-primary' : 'hover:bg-line/30 hover:text-text'}`}
              title="Add / edit link"
            >
              <LinkIcon size={14} />
            </button>
          </div>
          {actionButton && (
            <div className="flex items-center">
              {actionButton}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
