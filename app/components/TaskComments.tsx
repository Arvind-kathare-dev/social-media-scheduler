import { useState, useEffect } from "react";
import { useScheduler } from "../context/SchedulerContext";
import { Send, MessageSquare, CornerDownRight, X } from "lucide-react";
import toast from "react-hot-toast";
import RichTextEditor from "./RichTextEditor";

export default function TaskComments({ taskId }: { taskId: string }) {
    const { currentUser, socket, users } = useScheduler();
    const [mentionDropdownOpen, setMentionDropdownOpen] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchComments = async () => {
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
            const res = await fetch(`${apiUrl}/tasks/${taskId}/comments`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setComments(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();

        if (socket) {
            socket.emit("joinTaskRoom", taskId);
            
            socket.on("new_comment", (comment: any) => {
                setComments(prev => {
                    // if it's a root comment
                    if (!comment.parent_id) {
                        return [...prev, comment];
                    }
                    // if it's a reply
                    const updateReplies = (list: any[]) => {
                        return list.map(c => {
                            if (c.id === comment.parent_id) {
                                return { ...c, replies: [...(c.replies || []), comment] };
                            }
                            if (c.replies && c.replies.length > 0) {
                                return { ...c, replies: updateReplies(c.replies) };
                            }
                            return c;
                        });
                    };
                    return updateReplies(prev);
                });
            });

            return () => {
                socket.emit("leaveTaskRoom", taskId);
                socket.off("new_comment");
            };
        }
    }, [taskId, socket]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
            
            const res = await fetch(`${apiUrl}/tasks/${taskId}/comments`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    content: newComment,
                    parent_id: replyTo ? replyTo.id : null
                })
            });

            if (res.ok) {
                setNewComment("");
                setReplyTo(null);
            } else {
                toast.error("Failed to post comment");
            }
        } catch (error) {
            console.error("Error posting comment", error);
        }
    };

    // Helper to find a comment by ID for displaying quoted replies
    const findCommentById = (id: number, list: any[] = comments): any => {
        for (const c of list) {
            if (c.id === id) return c;
            if (c.replies && c.replies.length > 0) {
                const found = findCommentById(id, c.replies);
                if (found) return found;
            }
        }
        return null;
    };

    // Flatten nested comments for linear chat rendering
    const flattenComments = (list: any[]) => {
        let flat: any[] = [];
        list.forEach(c => {
            flat.push(c);
            if (c.replies && c.replies.length > 0) {
                flat = flat.concat(flattenComments(c.replies));
            }
        });
        return flat.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    };

    const renderChatBubble = (comment: any) => {
        const isMine = String(comment.user_id) === String(currentUser?.id);
        const parentComment = comment.parent_id ? findCommentById(comment.parent_id) : null;

        return (
            <div key={comment.id} className={`flex w-full mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}>
                {!isMine && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mr-2 mt-auto">
                        {comment.user_name ? comment.user_name.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                )}
                
                <div className={`max-w-[80%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                        {!isMine && <span className="text-[11px] font-bold text-text">{comment.user_name}</span>}
                        <span className="text-[9px] text-muted font-medium">
                            {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                    
                    <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm group ${
                        isMine 
                        ? 'bg-primary text-white rounded-br-sm' 
                        : 'bg-panel-2 border border-line text-text rounded-bl-sm'
                    }`}>
                        
                        {/* Quoted Reply Block */}
                        {parentComment && (
                            <div className={`text-[11px] p-2 mb-2 rounded-lg border-l-4 ${
                                isMine ? 'bg-black/10 border-white/50 text-white/90' : 'bg-black/5 border-primary text-muted'
                            }`}>
                                <div className="font-bold mb-0.5">{parentComment.user_name}</div>
                                <div 
                                    className="truncate max-w-[200px] opacity-80" 
                                    dangerouslySetInnerHTML={{ __html: parentComment.content.replace(/<[^>]*>?/gm, '') }} 
                                />
                            </div>
                        )}
                        
                        <div 
                            className={`text-[13px] whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-img:rounded-md prose-img:max-h-40 ${isMine ? 'text-white prose-invert' : 'text-text'}`}
                            dangerouslySetInnerHTML={{ __html: comment.content }}
                        />

                        {/* Reply Button Hook - Only visible on hover */}
                        <button 
                            onClick={() => setReplyTo(comment)}
                            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full shadow-sm hover:scale-110 ${
                                isMine ? '-left-8 bg-panel text-muted' : '-right-8 bg-panel text-muted'
                            }`}
                            title="Reply"
                        >
                            <CornerDownRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const flatComments = flattenComments(comments);

    return (
        <div className="mt-8 border-t border-line pt-6 flex flex-col h-[500px]">
            <h3 className="font-bold text-base text-text mb-4 flex items-center gap-2 shrink-0">
                <MessageSquare size={16} /> Live Chat
            </h3>

            <div className="flex-1 overflow-y-auto bg-panel rounded-xl border border-line p-4 mb-4 shadow-inner">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center text-muted text-sm py-4">Loading chat...</div>
                ) : flatComments.length === 0 ? (
                    <div className="h-full flex items-center justify-center flex-col gap-2 opacity-50">
                        <MessageSquare size={32} />
                        <p className="text-sm italic">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <div className="flex flex-col justify-end min-h-full">
                        {flatComments.map(c => renderChatBubble(c))}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4">
                {replyTo && (
                    <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/5 px-3 py-1.5 rounded-md border border-primary/20 w-fit">
                        <CornerDownRight size={12} />
                        Replying to {replyTo.user_name}
                        <button type="button" onClick={() => setReplyTo(null)} className="ml-2 hover:text-danger">
                            <X size={12} />
                        </button>
                    </div>
                )}
                <div className="relative border border-line rounded-xl bg-panel overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-sm pb-10">
                    <RichTextEditor 
                        value={newComment}
                        onChange={setNewComment}
                        placeholder="Write a comment or type @ to mention..."
                        users={users.filter(u => u.id !== currentUser?.id)}
                    />
                    <button 
                        type="submit" 
                        disabled={!newComment.trim() || newComment === '<p></p>'}
                        className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold"
                    >
                        Send <Send size={12} className="ml-1.5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
