"use client";
import { useState, useMemo } from "react";
import { useScheduler } from "../../context/SchedulerContext";
import { Check, AlertCircle, ExternalLink, Hash, Clock, Lock, Image as ImageIcon, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function ReviewPage() {
  const { store, updateStore, currentUser, users } = useScheduler();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const isAllowed = currentUser.role === "admin";

  // Get tasks that are ready for review (uploaded) or currently in revision
  const reviewTasks = useMemo(() => {
    return store.briefs.filter((b: any) => b.status === "uploaded" || b.status === "revision");
  }, [store.briefs]);

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    setLoadingId(taskId);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        // Optimistic UI update
        updateStore((prev: any) => ({
          ...prev,
          briefs: prev.briefs.map((b: any) => b.id === taskId ? { ...b, status: newStatus } : b)
        }));
        toast.success(`Task marked as ${newStatus}`);
      } else {
        toast.error("Failed to update task status");
      }
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Failed to update status");
    } finally {
      setLoadingId(null);
    }
  };

  const platformMeta: any = {
    "Instagram Feed": { icon: "IG", color: "var(--ig)" },
    "Instagram Story/Reel": { icon: "IR", color: "var(--ig)" },
    Facebook: { icon: "FB", color: "var(--fb)" },
    "X (Twitter)": { icon: "X", color: "var(--x)" },
    LinkedIn: { icon: "IN", color: "var(--li)" },
    Pinterest: { icon: <Hash size={14} />, color: "var(--pin)" },
    "YouTube Shorts": { icon: "YT", color: "var(--yt)" },
  };

  const formatDate = (value: string) => {
    if (!value) return "";
    return new Date(`${value}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  if (!isAllowed) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 text-muted">
        <Lock className="mx-auto mb-4" size={48} />
        <h2 className="text-xl font-bold text-text">Access Denied</h2>
        <p>You do not have permission to review tasks.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="page-title mb-8">
        <h1 className="text-3xl font-extrabold m-0 text-text tracking-tight">Review Queue</h1>
        <p className="text-muted text-sm mt-2 max-w-xl">
          Review content that has been marked as uploaded. Approve them for publishing or request revisions from the assignee.
        </p>
      </div>

      <div className="grid gap-6">
        {reviewTasks.length === 0 ? (
          <div className="empty min-h-[300px] flex flex-col items-center justify-center text-center border-2 border-dashed border-strong-line rounded-xl p-8 bg-panel">
            <Check size={48} className="text-ok mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-text mb-2">All caught up!</h3>
            <p className="text-muted text-sm max-w-md">There are no tasks currently waiting for your review. Great job keeping the queue clear!</p>
          </div>
        ) : (
          reviewTasks.map((task: any) => {
            const assignee = users.find((u: any) => u.id === task.assignedTo);
            const isRevision = task.status === "revision";
            
            return (
              <div key={task.id} className={`bg-panel border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${isRevision ? 'border-warning/50 shadow-warning/5' : 'border-line hover:shadow-md hover:border-strong-line'}`}>
                {/* Header */}
                <div className={`p-4 border-b flex flex-wrap justify-between items-center gap-4 ${isRevision ? 'bg-warning/5 border-warning/20' : 'bg-panel-2/30 border-line'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-widest rounded-md ${
                      isRevision ? 'bg-warning text-white shadow-sm' : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {isRevision ? 'In Revision' : 'Ready for Review'}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
                      <Clock size={14} />
                      Due: {formatDate(task.dueDate) || "No due date"}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleStatusUpdate(task.id, 'revision')} 
                      disabled={loadingId === task.id || isRevision}
                      className="btn ghost text-warning hover:bg-warning/10 hover:border-warning/30 px-4 transition-colors disabled:opacity-50"
                    >
                      <AlertCircle size={16} /> Request Revision
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(task.id, 'approved')} 
                      disabled={loadingId === task.id}
                      className="btn bg-ok text-white hover:bg-ok/90 px-5 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                    >
                      <Check size={16} /> {loadingId === task.id ? 'Saving...' : 'Approve Content'}
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Col: Details */}
                  <div className="lg:col-span-2 flex flex-col gap-5">
                    <div>
                      <h3 className="text-2xl font-black text-text mb-2 tracking-tight">{task.title}</h3>
                      <div className="flex flex-wrap gap-2 items-center">
                        {task.platforms?.map((p: string) => (
                          <span 
                            key={p} 
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white text-[11px] font-bold tracking-wide" 
                            style={{ background: platformMeta[p]?.color || "var(--primary)" }}
                          >
                            {platformMeta[p]?.icon || p} <span className="ml-1">{p}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-panel-2 p-5 rounded-lg border border-line">
                      <span className="text-[11px] font-extrabold text-muted uppercase tracking-widest block mb-3">Brief / Content Copy</span>
                      <p className="text-text whitespace-pre-wrap text-[15px] leading-relaxed m-0 font-medium">
                        {task.copy || <span className="text-muted italic font-normal">No content copy provided.</span>}
                      </p>
                    </div>

                    {task.visualReference && (
                      <div className="flex items-center gap-3 p-4 rounded-lg border border-line/50 bg-panel-2/50">
                        <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <ExternalLink size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-extrabold text-muted uppercase tracking-widest block mb-0.5">Reference Link</span>
                          <a href={task.visualReference} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline truncate block">
                            {task.visualReference}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Submitted Work Section */}
                    {store.uploads?.filter((u: any) => u.briefId === task.id).map((upload: any, idx: number) => (
                      <div key={upload.id || idx} className="bg-primary/5 border border-primary/20 rounded-xl p-5 shadow-sm">
                        <span className="text-[11px] font-extrabold text-primary uppercase tracking-widest mb-4 flex items-center gap-1.5">
                          <Check size={14} strokeWidth={3} /> Submitted Work {idx > 0 ? `(Revision ${idx + 1})` : ''}
                        </span>
                        
                        <div className="flex flex-col gap-3">
                          {upload.files?.map((f: any, fIdx: number) => (
                            <a 
                              key={fIdx} 
                              href={f.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center gap-4 p-4 bg-panel border border-primary/10 hover:border-primary/40 rounded-lg transition-colors group"
                            >
                              <div className="w-12 h-12 bg-panel-2 rounded flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                                <ImageIcon size={24} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-text truncate group-hover:text-primary transition-colors m-0">
                                  {f.name || "Design Asset"}
                                </h4>
                                <span className="text-xs text-muted font-medium mt-0.5 inline-block bg-panel-2 px-2 py-0.5 rounded">
                                  {f.platform}
                                </span>
                              </div>
                              <ExternalLink size={16} className="text-muted group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ))}

                          {upload.designerNote && (
                            <div className="mt-2 bg-panel p-4 rounded-lg border border-line flex gap-3">
                              <MessageSquare size={16} className="text-muted shrink-0 mt-0.5" />
                              <div className="text-sm text-text">
                                <span className="font-bold text-xs text-muted block mb-1 uppercase tracking-wider">Designer's Note</span>
                                <p className="m-0 leading-relaxed">{upload.designerNote}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Col: Meta */}
                  <div className="flex flex-col gap-6 pl-0 lg:pl-6 lg:border-l border-line/50">
                    <div>
                      <span className="text-[11px] font-extrabold text-muted uppercase tracking-widest block mb-3">Assigned Developer/Designer</span>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-line bg-panel-2/50">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-panel shrink-0">
                          {assignee?.avatar || "U"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-text leading-tight">{assignee?.name || "Unassigned"}</span>
                          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{assignee?.role || "Team Member"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] font-extrabold text-muted uppercase tracking-widest block mb-2">Priority</span>
                        <span className={`inline-block px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider rounded-md ${
                          task.priority === 'Low' ? 'bg-ok-bg text-ok' : 
                          task.priority === 'Urgent' ? 'bg-danger-bg text-danger' : 
                          'bg-panel-2 text-text border border-line'
                        }`}>
                          {task.priority || "Normal"}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-[11px] font-extrabold text-muted uppercase tracking-widest block mb-2">Tone</span>
                        <span className="text-sm font-semibold text-text">{task.tone || "Not specified"}</span>
                      </div>
                    </div>

                    {task.hashtags && task.hashtags.length > 0 && (
                      <div>
                        <span className="text-[11px] font-extrabold text-muted uppercase tracking-widest block mb-2">Hashtags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {task.hashtags.map((h: string) => (
                            <span key={h} className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {task.notes && (
                      <div className="mt-2">
                        <span className="text-[11px] font-extrabold text-warning uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <AlertCircle size={12} /> Notes
                        </span>
                        <p className="text-xs text-text bg-warning/10 p-3 rounded-lg border border-warning/20 leading-relaxed m-0">
                          {task.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
