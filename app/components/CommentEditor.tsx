import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Type, Smile, AtSign, Paperclip, Star,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Code, Link as LinkIcon,
  Heading1, Heading2, AlignLeft, Quote, Table, Minus, Image as ImageIcon
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

interface CommentEditorProps {
  onSubmit: (text: string) => void;
  currentUser?: { avatar?: string; name?: string };
}

export default function CommentEditor({ onSubmit, currentUser }: CommentEditorProps) {
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] }
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: 'Add a comment' })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'w-full bg-transparent p-3 pb-12 text-[13px] text-text outline-none min-h-[90px] prose prose-sm max-w-none relative z-10 focus:outline-none tiptap-editor',
      },
    },
    onFocus: () => {
      setShowFormatMenu(false);
      setShowInsertMenu(false);
    }
  });

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
    
    // cancelled
    if (url === null) {
      return;
    }
    
    // empty
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

  const handleSubmit = () => {
    if (!editor.isEmpty) {
      onSubmit(editor.getHTML());
      editor.commands.clearContent();
      setShowFormatMenu(false);
      setShowInsertMenu(false);
    }
  };

  return (
    <div className="flex gap-3 mt-6">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm mt-1">
        {currentUser?.avatar || currentUser?.name?.charAt(0) || "U"}
      </div>
      
      <div className="flex-1 relative" ref={containerRef}>
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
          }
        `}} />

        {/* Formatting Popover */}
        {showFormatMenu && (
          <div onMouseDown={(e) => e.preventDefault()} className="absolute bottom-14 left-8 bg-panel-2 border border-line rounded-lg shadow-xl flex items-center p-1 z-50 text-muted">
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
            
            {/* Arrow pointer */}
            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-panel-2 border-b border-r border-line transform rotate-45"></div>
          </div>
        )}

        {/* Insert Popover */}
        {showInsertMenu && (
          <div onMouseDown={(e) => e.preventDefault()} className="absolute bottom-14 left-0 w-64 bg-panel border border-line rounded-lg shadow-xl py-2 z-50 text-text text-[13px]">
            <div className="px-3 pb-2 text-xs font-semibold text-muted border-b border-line">Insert</div>
            <div className="max-h-[300px] overflow-y-auto">
              <button onClick={() => { editor.chain().focus().setParagraph().run(); setShowInsertMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><AlignLeft size={14} /> Paragraph</button>
              <button onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setShowInsertMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Heading1 size={14} /> Heading 1</button>
              <button onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setShowInsertMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Heading2 size={14} /> Heading 2</button>
              <div className="h-px bg-line my-1"></div>
              <button onClick={() => { editor.chain().focus().toggleBulletList().run(); setShowInsertMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><List size={14} /> Bulleted list</button>
              <button onClick={() => { editor.chain().focus().toggleOrderedList().run(); setShowInsertMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><ListOrdered size={14} /> Numbered list</button>
              <div className="h-px bg-line my-1"></div>
              <button onClick={() => { editor.chain().focus().toggleBlockquote().run(); setShowInsertMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Quote size={14} /> Quote</button>
              <button onClick={() => { editor.chain().focus().toggleCodeBlock().run(); setShowInsertMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Code size={14} /> Code block</button>
              <button onClick={() => { editor.chain().focus().setHorizontalRule().run(); setShowInsertMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Minus size={14} /> Section break</button>
              <div className="h-px bg-line my-1"></div>
              <button onClick={() => insertText('😀')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><Smile size={14} /> Emoji</button>
              <button onClick={handleImageUpload} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><ImageIcon size={14} /> Image</button>
              <button onClick={() => insertText('@')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><AtSign size={14} /> Mention</button>
              <button onClick={handleLink} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-2 hover:text-text text-left"><LinkIcon size={14} /> Embed link</button>
            </div>
          </div>
        )}

        <div className="border border-line rounded-xl overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all bg-panel flex flex-col">
          {/* Editable Content Area (Tiptap) */}
          <EditorContent editor={editor} />

          {/* Bottom Toolbar */}
          <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center bg-transparent z-20">
            <div className="flex items-center gap-1 text-muted">
              <button 
                className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${showInsertMenu ? 'bg-line/50 text-text' : 'hover:bg-panel-2 hover:text-text'}`}
                onClick={() => { setShowInsertMenu(!showInsertMenu); setShowFormatMenu(false); }}
                title="Insert"
              >
                <Plus size={15} />
              </button>
              <button 
                className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${showFormatMenu ? 'bg-line/50 text-text' : 'hover:bg-panel-2 hover:text-text'}`}
                onClick={() => { setShowFormatMenu(!showFormatMenu); setShowInsertMenu(false); }}
                title="Format"
              >
                <Type size={15} />
              </button>
              <button onClick={() => insertText('👍')} className="w-7 h-7 rounded flex items-center justify-center hover:bg-panel-2 hover:text-text transition-colors" title="Emoji">
                <Smile size={15} />
              </button>
              <button onClick={() => insertText('@')} className="w-7 h-7 rounded flex items-center justify-center hover:bg-panel-2 hover:text-text transition-colors" title="Mention">
                <AtSign size={15} />
              </button>
              <button onClick={() => insertText('✨')} className="w-7 h-7 rounded flex items-center justify-center hover:bg-panel-2 hover:text-text transition-colors" title="Appreciation">
                <Star size={15} />
              </button>
              <button onClick={handleImageUpload} className="w-7 h-7 rounded flex items-center justify-center hover:bg-panel-2 hover:text-text transition-colors" title="Attach">
                <Paperclip size={15} />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted">
                0 people will be notified
              </span>
              <button 
                onClick={handleSubmit}
                disabled={editor.isEmpty}
                className={`h-8 px-4 rounded-md text-[13px] font-medium transition-all ${
                  !editor.isEmpty 
                    ? 'bg-[#4573d2] text-white hover:bg-[#3d65b8]' 
                    : 'bg-panel-2 text-muted border border-line cursor-not-allowed'
                }`}
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
