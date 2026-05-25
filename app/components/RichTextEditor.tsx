import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Type, Smile, AtSign, Paperclip, Star,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Code, Link as LinkIcon,
  Heading1, Heading2, AlignLeft, Quote, Minus, Image as ImageIcon, Eye, EyeOff
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] }
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: placeholder || 'Type notes for assignee...' })
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'w-full bg-transparent p-3 pb-12 text-[13px] text-text outline-none min-h-[120px] prose prose-sm max-w-none relative z-10 focus:outline-none tiptap-editor',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onFocus: () => {
      setShowFormatMenu(false);
      setShowInsertMenu(false);
    }
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowFormatMenu(false);
        setShowInsertMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) {
    return null;
  }

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setShowInsertMenu(false);
    setShowFormatMenu(false);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const base64 = readerEvent.target?.result as string;
          editor.chain().focus().setImage({ src: base64 }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    setShowInsertMenu(false);
  };

  const insertText = (text: string) => {
    editor.chain().focus().insertContent(text).run();
    setShowInsertMenu(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <style dangerouslySetInnerHTML={{__html: `
        .tiptap-editor p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        .rte-preview img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 0.75rem 0; display: block; }
        .rte-preview h1 { font-size: 1.35rem; font-weight: 800; margin: 0.75rem 0 0.5rem; }
        .rte-preview h2 { font-size: 1.1rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
        .rte-preview p { margin: 0.2rem 0; }
        .rte-preview ul { list-style: disc; padding-left: 1.5rem; margin: 0.4rem 0; }
        .rte-preview ol { list-style: decimal; padding-left: 1.5rem; margin: 0.4rem 0; }
        .rte-preview li { margin: 0.15rem 0; }
        .rte-preview strong { font-weight: 700; }
        .rte-preview em { font-style: italic; }
        .rte-preview u { text-decoration: underline; }
        .rte-preview s { text-decoration: line-through; }
        .rte-preview pre { background: rgba(0,0,0,0.25); border-radius: 0.4rem; padding: 0.6rem 1rem; font-family: monospace; font-size: 0.82em; white-space: pre-wrap; margin: 0.5rem 0; }
        .rte-preview code { background: rgba(0,0,0,0.2); border-radius: 0.2rem; padding: 0.1em 0.3em; font-family: monospace; font-size: 0.85em; }
        .rte-preview blockquote { border-left: 3px solid #6366f1; padding-left: 1rem; margin: 0.5rem 0; opacity: 0.8; }
        .rte-preview a { color: #6366f1; text-decoration: underline; }
        .rte-preview hr { border: none; border-top: 1px solid rgba(128,128,128,0.2); margin: 0.75rem 0; }
      `}} />

      {/* Tab bar: Write | Preview */}
      <div className="flex items-center gap-1 mb-2">
        <button
          type="button"
          onClick={() => { setShowPreview(false); setShowFormatMenu(false); setShowInsertMenu(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border ${
            !showPreview
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'text-muted border-transparent hover:bg-panel-2 hover:text-text'
          }`}
        >
          <Type size={12} /> Write
        </button>
        <button
          type="button"
          onClick={() => { setShowPreview(true); setShowFormatMenu(false); setShowInsertMenu(false); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border ${
            showPreview
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'text-muted border-transparent hover:bg-panel-2 hover:text-text'
          }`}
        >
          <Eye size={12} /> Preview
        </button>
      </div>

      {/* PREVIEW MODE */}
      {showPreview ? (
        <div className="border border-line rounded-xl bg-panel overflow-hidden">
          {editor && !editor.isEmpty ? (
            <div
              className="rte-preview text-sm text-text leading-relaxed p-4 min-h-[120px]"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[120px] text-muted gap-2">
              <EyeOff size={20} />
              <span className="text-[13px]">Nothing to preview yet. Switch to Write tab to add content.</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Formatting Popover */}
          {showFormatMenu && (
            <div onMouseDown={(e) => e.preventDefault()} className="absolute bottom-12 left-8 bg-panel-2 border border-line rounded-lg shadow-xl flex items-center p-1 z-50 text-muted">
              <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded transition-colors ${editor.isActive('bold') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Bold"><Bold size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded transition-colors ${editor.isActive('italic') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Italic"><Italic size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded transition-colors ${editor.isActive('underline') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Underline"><UnderlineIcon size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded transition-colors ${editor.isActive('strike') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Strikethrough"><Strikethrough size={16} /></button>
              <div className="w-px h-5 bg-line mx-1"></div>
              <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Bulleted list"><List size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Numbered list"><ListOrdered size={16} /></button>
              <div className="w-px h-5 bg-line mx-1"></div>
              <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-2 rounded transition-colors ${editor.isActive('codeBlock') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Code block"><Code size={16} /></button>
              <button type="button" onClick={handleLink} className={`p-2 rounded transition-colors ${editor.isActive('link') ? 'bg-line text-text' : 'hover:bg-line/50 hover:text-text'}`} title="Link"><LinkIcon size={16} /></button>
              <div className="absolute -bottom-2 left-4 w-4 h-4 bg-panel-2 border-b border-r border-line transform rotate-45"></div>
            </div>
          )}

          {/* Insert Popover */}
          {showInsertMenu && (
            <div onMouseDown={(e) => e.preventDefault()} className="absolute bottom-12 left-0 w-64 bg-panel border border-line rounded-lg shadow-xl py-2 z-50 text-text text-[13px]">
              <div className="px-3 pb-2 text-xs font-semibold text-muted border-b border-line">Insert</div>
              <div className="max-h-[260px] overflow-y-auto">
                <button onClick={() => { editor.chain().focus().setParagraph().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><AlignLeft size={14} /> Paragraph</button>
                <button onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Heading1 size={14} /> Heading 1</button>
                <button onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Heading2 size={14} /> Heading 2</button>
                <div className="h-px bg-line my-1"></div>
                <button onClick={() => { editor.chain().focus().toggleBulletList().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><List size={14} /> Bulleted list</button>
                <button onClick={() => { editor.chain().focus().toggleOrderedList().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><ListOrdered size={14} /> Numbered list</button>
                <div className="h-px bg-line my-1"></div>
                <button onClick={() => { editor.chain().focus().toggleBlockquote().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Quote size={14} /> Quote</button>
                <button onClick={() => { editor.chain().focus().toggleCodeBlock().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Code size={14} /> Code block</button>
                <button onClick={() => { editor.chain().focus().setHorizontalRule().run(); setShowInsertMenu(false); }} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Minus size={14} /> Section break</button>
                <div className="h-px bg-line my-1"></div>
                <button onClick={() => insertText('😀')} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Smile size={14} /> Emoji</button>
                <button onClick={handleImageUpload} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><ImageIcon size={14} /> Image</button>
                <button onClick={() => insertText('@')} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><AtSign size={14} /> Mention</button>
                <button onClick={handleLink} type="button" className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><LinkIcon size={14} /> Embed link</button>
              </div>
            </div>
          )}

          <div className="border border-line rounded-xl overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all bg-panel flex flex-col">
            <EditorContent editor={editor} />

            {/* Bottom Toolbar */}
            <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center bg-transparent z-20">
              <div className="flex items-center gap-1 text-muted">
                <button
                  type="button"
                  className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${showInsertMenu ? 'bg-line/50 text-text' : 'hover:bg-panel-2 hover:text-text'}`}
                  onClick={(e) => { e.preventDefault(); setShowInsertMenu(!showInsertMenu); setShowFormatMenu(false); }}
                  title="Insert"
                >
                  <Plus size={15} />
                </button>
                <button
                  type="button"
                  className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${showFormatMenu ? 'bg-line/50 text-text' : 'hover:bg-panel-2 hover:text-text'}`}
                  onClick={(e) => { e.preventDefault(); setShowFormatMenu(!showFormatMenu); setShowInsertMenu(false); }}
                  title="Format"
                >
                  <Type size={15} />
                </button>
                <button type="button" onClick={(e) => { e.preventDefault(); insertText('👍'); }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-panel-2 hover:text-text transition-colors" title="Emoji">
                  <Smile size={15} />
                </button>
                <button type="button" onClick={(e) => { e.preventDefault(); insertText('@'); }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-panel-2 hover:text-text transition-colors" title="Mention">
                  <AtSign size={15} />
                </button>
                <button type="button" onClick={(e) => { e.preventDefault(); insertText('✨'); }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-panel-2 hover:text-text transition-colors" title="Appreciation">
                  <Star size={15} />
                </button>
                <button type="button" onClick={(e) => { e.preventDefault(); handleImageUpload(); }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-panel-2 hover:text-text transition-colors" title="Attach image">
                  <Paperclip size={15} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

