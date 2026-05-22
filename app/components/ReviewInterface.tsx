"use client";

import { useState } from "react";
import { useScheduler } from "../context/SchedulerContext";
import { Check, AlertCircle, CornerDownRight, Send } from "lucide-react";

export default function ReviewInterface({ title, description, isDesignerOnly = false }) {
  const { store, updateStore, currentUser, users, addNotification } = useScheduler();
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null); // id of parent comment

  let pendingUploads = store.uploads.filter(u => u.status === 'pending' || u.status === 'revision');
  
  if (isDesignerOnly) {
    const designerBriefIds = store.briefs.filter(b => b.assignedTo === currentUser.id).map(b => b.id);
    pendingUploads = store.uploads.filter(u => designerBriefIds.includes(u.briefId));
  }

  const handleCommentSubmit = (e, uploadId, briefTitle) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `c_${Date.now()}`,
      uploadId,
      authorId: currentUser.id,
      authorRole: currentUser.role,
      text: commentText,
      type: "comment",
      createdAt: new Date().toISOString(),
      parentId: replyTo
    };

    updateStore(prev => ({
      ...prev,
      comments: [...prev.comments, newComment]
    }));

    // Notify others
    users
      .filter(u => (isDesignerOnly ? (u.role === 'admin' || u.role === 'editor') : u.role === 'designer'))
      .forEach(u => addNotification(u.id, `${currentUser.name} commented on ${briefTitle}`));

    setCommentText("");
    setReplyTo(null);
  };

  const handleStatusUpdate = (uploadId, briefId, status) => {
    updateStore(prev => {
      const nextUploads = prev.uploads.map(u => u.id === uploadId ? { ...u, status } : u);
      let nextBriefs = prev.briefs;
      
      // If approved, update brief status
      if (status === 'approved') {
        const remainingPending = nextUploads.filter(u => u.briefId === briefId && u.status !== 'approved').length;
        if (remainingPending === 0) {
          nextBriefs = prev.briefs.map(b => b.id === briefId ? { ...b, status: 'uploaded' } : b);
        }
      }
      return { ...prev, uploads: nextUploads, briefs: nextBriefs };
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="page-title mb-6">
        <h1 className="text-3xl font-extrabold m-0">{title}</h1>
        <p className="text-muted text-sm mt-1">{description}</p>
      </div>

      <div className="grid gap-6">
        {pendingUploads.map(upload => {
          const brief = store.briefs.find(b => b.id === upload.briefId);
          if (!brief) return null;
          
          const uploadComments = store.comments.filter(c => c.uploadId === upload.id);
          // Simple flattening for UI
          const rootComments = uploadComments.filter(c => !c.parentId);

          return (
            <div key={upload.id} className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 bg-panel border border-line rounded-custom p-4">
              <div className="asset-viewer flex flex-col gap-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-extrabold text-lg m-0">{brief.title}</h3>
                    <div className="text-sm text-muted mt-1">Uploaded {new Date(upload.uploadedAt).toLocaleString()}</div>
                  </div>
                  <span className={`px-2 py-1 text-[11px] font-extrabold uppercase rounded-[7px] ${
                    upload.status === 'approved' ? 'bg-ok-bg text-ok' : 
                    upload.status === 'revision' ? 'bg-danger-bg text-danger' : 
                    'bg-panel-2 text-text'
                  }`}>
                    {upload.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {upload.files.map((file, i) => (
                    <div key={i} className="review-asset bg-panel-2 border border-line rounded-custom p-3">
                      <div className="flex justify-between text-xs mb-2 text-muted font-bold">
                        <span>{file.platform}</span>
                        <span>{file.dimensions}</span>
                      </div>
                      <div className="w-full aspect-[4/3] bg-panel border border-line rounded-[7px] grid place-items-center text-muted border-dashed">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
                
                {upload.designerNote && (
                  <div className="p-3 bg-panel-2 rounded-custom text-sm mt-2 border border-line">
                    <strong className="block text-xs uppercase text-muted mb-1">Designer Note</strong>
                    {upload.designerNote}
                  </div>
                )}
                
                {!isDesignerOnly && upload.status !== 'approved' && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleStatusUpdate(upload.id, brief.id, 'approved')} className="btn flex-1 bg-ok text-white hover:bg-ok/90 font-medium">
                      <Check size={16} /> Approve all
                    </button>
                    <button onClick={() => handleStatusUpdate(upload.id, brief.id, 'revision')} className="btn flex-1 ghost border-danger text-danger hover:bg-danger-bg">
                      <AlertCircle size={16} /> Request revision
                    </button>
                  </div>
                )}
              </div>

              <div className="comment-thread section m-0 h-full flex flex-col">
                <h3 className="font-bold text-base mb-3 pb-2 border-b border-line">Feedback thread</h3>
                <div className="flex-1 overflow-auto flex flex-col gap-3 mb-3 pr-2 max-h-[400px]">
                  {rootComments.length === 0 ? (
                    <div className="text-center text-muted text-sm py-4">No comments yet.</div>
                  ) : (
                    rootComments.map(comment => {
                      const author = users.find(u => u.id === comment.authorId);
                      const replies = uploadComments.filter(c => c.parentId === comment.id);
                      
                      return (
                        <div key={comment.id} className="comment bg-panel-2 rounded-custom p-3 border border-line">
                          <div className="flex justify-between items-center text-xs text-muted mb-2">
                            <strong>{author?.name}</strong>
                            <span>{new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-sm m-0">{comment.text}</p>
                          
                          {/* Replies */}
                          {replies.length > 0 && (
                            <div className="mt-2 pl-3 border-l-2 border-line flex flex-col gap-2">
                              {replies.map(reply => {
                                const replyAuthor = users.find(u => u.id === reply.authorId);
                                return (
                                  <div key={reply.id} className="text-sm pt-2 mt-1 border-t border-line/50">
                                    <div className="text-xs text-muted mb-1"><strong>{replyAuthor?.name}</strong></div>
                                    {reply.text}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          <button onClick={() => setReplyTo(comment.id)} className="flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline">
                            <CornerDownRight size={14} /> Reply
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={(e) => handleCommentSubmit(e, upload.id, brief.title)} className="mt-auto border-t border-line pt-3">
                  {replyTo && (
                    <div className="text-xs text-muted mb-2 flex justify-between bg-panel-2 p-1.5 rounded">
                      <span>Replying to comment...</span>
                      <button type="button" onClick={() => setReplyTo(null)} className="text-danger">&times;</button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="input flex-1" 
                      placeholder="Add a comment..." 
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                    />
                    <button type="submit" className="btn primary px-3" disabled={!commentText.trim()}>
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })}

        {pendingUploads.length === 0 && (
          <div className="empty min-h-[160px] grid place-items-center text-center text-muted border border-dashed border-strong-line rounded-custom p-5 bg-panel">
            {isDesignerOnly ? "You have no active uploads." : "No assets pending review."}
          </div>
        )}
      </div>
    </div>
  );
}
