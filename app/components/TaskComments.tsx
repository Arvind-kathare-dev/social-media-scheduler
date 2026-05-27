"use client";
import { useState, useEffect, useRef } from "react";
import { useScheduler } from "../context/SchedulerContext";
import { Send, X, Download, Smile, Paperclip, CornerDownRight, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";

// ─── Emoji Picker ──────────────────────────────────────────────────────────────
const EMOJIS = ["👍","❤️","😂","😮","😢","🔥","✅","💯","🎉","👀","🙌","💪","🚀","✨","👏","😍","🤔","💡","⚡","🎯"];
// (Used for the emoji picker toolbar only — hover reactions removed)

// ─── Avatar helper ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#6366f1","#8b5cf6"], ["#ec4899","#f43f5e"], ["#14b8a6","#06b6d4"],
  ["#f59e0b","#f97316"], ["#10b981","#22c55e"], ["#3b82f6","#6366f1"],
];

function getAvatarColors(name: string) {
  const i = (name?.charCodeAt(0) || 65) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

// ─── Date separator helper ────────────────────────────────────────────────────
function getDayLabel(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

export default function TaskComments({
  taskId,
  className = "mt-8 border-t border-line pt-6 flex flex-col h-[500px]",
}: {
  taskId: string;
  className?: string;
}) {
  const { currentUser, socket, users, store } = useScheduler();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Mention State
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);

  // Auto-scroll to bottom whenever comments change
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [comments]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/tasks/${taskId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setComments(data.data || []);
    } catch (e) {
      console.error("Failed to fetch comments", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    if (socket) {
      socket.emit("joinTaskRoom", taskId);
      socket.on("new_comment", (comment: any) => {
        setComments((prev) => {
          if (!comment.parent_id) return [...prev, comment];
          const updateReplies = (list: any[]): any[] =>
            list.map((c) => {
              if (c.id === comment.parent_id) return { ...c, replies: [...(c.replies || []), comment] };
              if (c.replies?.length) return { ...c, replies: updateReplies(c.replies) };
              return c;
            });
          return updateReplies(prev);
        });
      });
      return () => {
        socket.emit("leaveTaskRoom", taskId);
        socket.off("new_comment");
      };
    }
  }, [taskId, socket]);

  const handleSubmit = async (content?: string) => {
    const msg = (content ?? newComment).trim();
    if (!msg || msg === "<p></p>") return;
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: msg, parent_id: replyTo ? replyTo.id : null }),
      });
      if (res.ok) {
        setNewComment("");
        setReplyTo(null);
      } else {
        toast.error("Failed to send message");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen) {
      const filteredUsers = users.filter((u: any) => u.name.toLowerCase().includes(mentionFilter) && u.id !== currentUser.id);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredUsers[mentionIndex]) {
          insertMention(filteredUsers[mentionIndex].name);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertMention = (name: string) => {
    if (!inputRef.current) return;
    const val = newComment;
    const cursorPos = inputRef.current.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const textAfterCursor = val.slice(cursorPos);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];
    
    // Replace the last word (which starts with @) with the mention
    const newTextBefore = textBeforeCursor.slice(0, textBeforeCursor.length - lastWord.length) + `@${name} `;
    
    setNewComment(newTextBefore + textAfterCursor);
    setMentionOpen(false);
    setMentionFilter("");
    setMentionIndex(0);
    inputRef.current.focus();
    
    // Reset height
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
      }
    }, 0);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewComment(val);
    
    // auto-grow
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";

    // Mention detection
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setMentionOpen(true);
      setMentionFilter(lastWord.slice(1).toLowerCase());
      setMentionIndex(0);
    } else {
      setMentionOpen(false);
    }
  };

  const handleImageAttach = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const imgHtml = `<img src="${src}" alt="attachment" style="max-width:260px;border-radius:12px;display:block;margin:4px 0;" />`;
      handleSubmit(imgHtml);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const insertEmoji = (emoji: string) => {
    setNewComment((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };


  // ─── Flatten & group ──────────────────────────────────────────────────────────
  const flattenComments = (list: any[]): any[] => {
    let flat: any[] = [];
    list.forEach((c) => {
      flat.push(c);
      if (c.replies?.length) flat = flat.concat(flattenComments(c.replies));
    });
    return flat.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const findById = (id: number, list = comments): any => {
    for (const c of list) {
      if (c.id === id) return c;
      if (c.replies?.length) { const f = findById(id, c.replies); if (f) return f; }
    }
    return null;
  };

  const flatComments = flattenComments(comments);

  // ─── Grouping by date ─────────────────────────────────────────────────────────
  type MessageGroup = { label: string; msgs: any[] };
  const grouped: MessageGroup[] = [];
  flatComments.forEach((c) => {
    const d = new Date(c.created_at);
    const label = getDayLabel(d);
    if (!grouped.length || grouped[grouped.length - 1].label !== label) {
      grouped.push({ label, msgs: [c] });
    } else {
      grouped[grouped.length - 1].msgs.push(c);
    }
  });

  // ─── Strip html helper ────────────────────────────────────────────────────────
  const stripHtml = (html: string) => html?.replace(/<[^>]*>/g, "").trim();

  // ─── Check if content has only image ─────────────────────────────────────────
  const isImageOnly = (html: string) => {
    const stripped = html?.replace(/<p>\s*<\/p>/g, "").replace(/\s/g, "");
    return stripped ? /^<img[^>]*>$/.test(stripped) : false;
  };

  const extractImgSrc = (html: string) => {
    const m = html?.match(/src="([^"]+)"/);
    return m ? m[1] : null;
  };

  // ─── Render bubble ────────────────────────────────────────────────────────────
  const renderBubble = (comment: any) => {
    const isMine = String(comment.user_id) === String(currentUser?.id);
    const parent = comment.parent_id ? findById(comment.parent_id) : null;
    const [c1, c2] = getAvatarColors(comment.user_name || "U");
    const imgOnly = isImageOnly(comment.content);
    const imgSrc = imgOnly ? extractImgSrc(comment.content) : null;

    return (
      <div key={comment.id} className={`flex w-full mb-1 ${isMine ? "justify-end" : "justify-start"} group/msg`}>
        {/* Avatar — other */}
        {!isMine && (
          <div
            className="w-8 h-8 rounded-full shrink-0 mr-2 mt-auto flex items-center justify-center text-[10px] font-black text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
            title={comment.user_name}
          >
            {(comment.user_name || "U").substring(0, 2).toUpperCase()}
          </div>
        )}

        <div className={`max-w-[72%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
          {/* Sender name — others only */}
          {!isMine && (
            <span className="text-[11px] font-bold mb-1 px-1" style={{ color: c1 }}>
              {comment.user_name}
            </span>
          )}

          {/* Bubble */}
          <div className="relative">
            {/* Reply button — on hover */}
            <div className={`absolute -top-8 flex gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity z-20 ${isMine ? 'right-0' : 'left-0'}`}>
              <button
                onClick={() => setReplyTo(comment)}
                className="w-7 h-7 rounded-full bg-panel border border-line shadow-md flex items-center justify-center text-muted hover:text-primary hover:scale-110 transition-all"
                title="Reply"
              >
                <CornerDownRight size={12} />
              </button>
            </div>

            {imgOnly && imgSrc ? (
              /* ─── Image-only bubble ─── */
              <div
                className={`overflow-hidden rounded-2xl shadow-md cursor-pointer relative ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                onClick={() => setViewImage(imgSrc)}
              >
                <img
                  src={imgSrc}
                  className="block max-w-[220px] max-h-[220px] object-cover hover:opacity-95 transition-opacity"
                  alt="attachment"
                />
                {/* Time overlay on image */}
                <div className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/40 text-white backdrop-blur-sm`}>
                  {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {isMine && <CheckCheck size={11} className="opacity-80" />}
                </div>
                {/* Download button on image hover */}
                <a
                  href={imgSrc}
                  download={`image-${Date.now()}.png`}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/msg:opacity-100 transition-opacity hover:bg-black/60 backdrop-blur-sm"
                  title="Download"
                >
                  <Download size={14} />
                </a>
              </div>
            ) : (
              /* ─── Text bubble ─── */
              <div
                className={`relative px-3.5 py-2.5 shadow-sm ${
                  isMine
                    ? "bg-primary text-white rounded-2xl rounded-br-sm"
                    : "bg-panel border border-line text-text rounded-2xl rounded-bl-sm"
                }`}
              >
                {/* Quoted reply */}
                {parent && (
                  <div
                    className={`text-[11px] px-2.5 py-1.5 mb-2 rounded-xl border-l-[3px] ${
                      isMine
                        ? "bg-white/10 border-white/60 text-white/80"
                        : "bg-primary/5 border-primary text-muted"
                    }`}
                  >
                    <div className="font-bold text-[10px] mb-0.5 uppercase tracking-wider opacity-80">
                      {parent.user_name}
                    </div>
                    <div className="truncate max-w-[180px] text-[11px] opacity-70">
                      {stripHtml(parent.content).slice(0, 60) || "📷 Image"}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div
                  className={`text-[13.5px] leading-relaxed break-words prose-img:rounded-lg prose-img:cursor-pointer prose-img:max-h-40 prose-a:underline ${
                    isMine ? "text-white [&_a]:text-white/90 [&_strong]:text-white" : "text-text"
                  }`}
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                  onClick={(e: any) => {
                    if (e.target.tagName === "IMG") setViewImage(e.target.src);
                  }}
                  style={{ wordBreak: "break-word" }}
                />

                {/* Time + check */}
                <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                  <span className={`text-[10px] font-medium ${isMine ? "text-white/60" : "text-muted"}`}>
                    {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isMine && <CheckCheck size={11} className="text-white/60" />}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* My avatar */}
        {isMine && (
          <div
            className="w-8 h-8 rounded-full shrink-0 ml-2 mt-auto flex items-center justify-center text-[10px] font-black text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
          >
            {(currentUser?.name || "Me").substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    );
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-panel overflow-hidden">
      <style>{`
        .chat-msgs::-webkit-scrollbar { width: 3px; }
        .chat-msgs::-webkit-scrollbar-track { background: transparent; }
        .chat-msgs::-webkit-scrollbar-thumb { background: var(--line); border-radius: 99px; }
        .chat-textarea { resize: none; max-height: 120px; overflow-y: auto; }
        .chat-textarea::-webkit-scrollbar { width: 3px; }
        .chat-textarea::-webkit-scrollbar-thumb { background: var(--line); border-radius: 99px; }
      `}</style>

      {/* ── Messages Area ───────────────────────────────────────────────── */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto chat-msgs px-3 py-2"
        style={{ background: "var(--bg)", scrollbarWidth: "thin", scrollbarColor: "var(--line) transparent" }}
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 opacity-60">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-muted">Loading messages…</span>
          </div>
        ) : flatComments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl">💬</span>
            </div>
            <div>
              <p className="text-sm font-bold text-text">No messages yet</p>
              <p className="text-xs text-muted mt-0.5">Start the conversation</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {grouped.map((group) => (
              <div key={group.label}>
                {/* ─ Date separator ─ */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-line/50" />
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest bg-panel border border-line px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-line/50" />
                </div>
                {/* Group consecutive from same sender */}
                {group.msgs.map((c) => renderBubble(c))}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Reply Bar ──────────────────────────────────────────────────────── */}
      {replyTo && (
        <div className="mx-3 mb-1 flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl text-xs">
          <CornerDownRight size={12} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-primary">{replyTo.user_name}</span>
            <span className="text-muted ml-2 truncate block">{stripHtml(replyTo.content).slice(0, 50) || "📷 Image"}</span>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-muted hover:text-danger transition-colors ml-1 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Emoji Picker ───────────────────────────────────────────────────── */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="mx-3 mb-1 p-2 bg-panel border border-line rounded-2xl shadow-xl grid grid-cols-10 gap-1 z-50"
        >
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => insertEmoji(e)}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-panel-2 rounded-lg transition-colors hover:scale-110"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Bar ─────────────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-line bg-panel shrink-0">
        <div className="flex items-end gap-2 bg-panel-2 border border-line rounded-2xl px-3 py-2 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          {/* Emoji */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors mb-0.5 ${showEmojiPicker ? "bg-primary/10 text-primary" : "text-muted hover:text-primary hover:bg-primary/10"}`}
            title="Emoji"
          >
            <Smile size={18} />
          </button>

          {/* Textarea & Mention Dropdown Container */}
          <div className="flex-1 relative flex flex-col">
            {mentionOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-64 max-h-48 overflow-y-auto bg-panel border border-line rounded-xl shadow-xl z-50">
                {users.filter((u: any) => u.name.toLowerCase().includes(mentionFilter) && u.id !== currentUser.id).length > 0 ? (
                  users.filter((u: any) => u.name.toLowerCase().includes(mentionFilter) && u.id !== currentUser.id).map((u: any, idx: number) => (
                    <div
                      key={u.id}
                      onClick={() => insertMention(u.name)}
                      className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 ${mentionIndex === idx ? 'bg-panel-2' : 'hover:bg-panel-2'}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-text">{u.name}</span>
                      <span className="text-[10px] text-muted ml-auto uppercase tracking-wider">{u.role}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-muted">No users found</div>
                )}
              </div>
            )}
            
            <textarea
              ref={inputRef}
              className="w-full bg-transparent outline-none text-[13.5px] text-text placeholder:text-muted/60 leading-relaxed chat-textarea py-1"
              rows={1}
              placeholder="Message…"
              value={newComment}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Attach image */}
          <button
            type="button"
            onClick={handleImageAttach}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-primary hover:bg-primary/10 transition-colors mb-0.5"
            title="Attach image"
          >
            <Paperclip size={18} />
          </button>

          {/* Send */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!newComment.trim() || newComment === "<p></p>"}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 mb-0.5"
            title="Send"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-muted/50 text-center mt-1.5">Enter to send · Shift+Enter for new line · Click image to view</p>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* ── Image Lightbox ─────────────────────────────────────────────────── */}
      {viewImage && (
        <div
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center"
          onClick={() => setViewImage(null)}
        >
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white text-sm font-semibold opacity-80">Image Preview</span>
            <div className="flex items-center gap-3">
              <a
                href={viewImage}
                download={`chat-image-${Date.now()}.png`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors backdrop-blur-sm"
                title="Download"
              >
                <Download size={16} /> Download
              </a>
              <button
                onClick={() => setViewImage(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Image */}
          <img
            src={viewImage}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            alt="Preview"
          />
        </div>
      )}
    </div>
  );
}
