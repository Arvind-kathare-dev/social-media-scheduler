"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useScheduler } from "../../../context/SchedulerContext";
import { 
  ArrowLeft, Clock, CheckCircle2, Hash, ExternalLink, 
  AlertCircle, Upload, ThumbsUp, MoreHorizontal, 
  Image as ImageIcon, Link as LinkIcon, RotateCcw, Eye, Check, XCircle 
} from "lucide-react";
import TaskComments from "../../../components/TaskComments";
import RichTextEditor from "../../../components/RichTextEditor";
import Modal from "../../../components/Modal";
import toast from "react-hot-toast";

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { store, updateStore, currentUser, users } = useScheduler();
  const addNotification = (store as any).addNotification || null;
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const isAdmin = currentUser.role === "admin";
  
  const brief = store.briefs?.find((b: any) => String(b.id) === String(id));
  
  const [uploadData, setUploadData] = useState({
    fileUrl: "",
    fileName: "",
    platform: "Instagram Feed",
    note: "",
    liveLink: "",
    docContent: ""
  });

  useEffect(() => {
    if (brief) {
      const safePlatforms = Array.isArray(brief.platforms) ? brief.platforms : (typeof brief.platforms === 'string' ? JSON.parse(brief.platforms || "[]") : []);
      setUploadData(prev => ({ ...prev, platform: safePlatforms[0] || "Instagram Feed" }));
    }
  }, [brief]);

  if (!brief) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle size={48} className="text-muted mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-text">Task Not Found</h2>
        <p className="text-muted mb-6">The task you are looking for does not exist or has been deleted.</p>
        <button onClick={() => router.back()} className="btn primary">
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  const safePlatforms = Array.isArray(brief.platforms) ? brief.platforms : (typeof brief.platforms === 'string' ? JSON.parse(brief.platforms || "[]") : []);
  const safeHashtags = Array.isArray(brief.hashtags) ? brief.hashtags : (typeof brief.hashtags === 'string' ? JSON.parse(brief.hashtags || "[]") : []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadData(prev => ({ ...prev, fileUrl: url, fileName: file.name }));
    }
  };

  const handleSubmitWork = async () => {
    if (!uploadData.fileName && !uploadData.fileUrl && !uploadData.liveLink && !uploadData.docContent.replace(/<[^>]*>/g,'').trim()) {
      toast.error("Please provide at least a file, live link, or documentation");
      return;
    }
    
    const newUpload = {
      id: `up_${Date.now()}`,
      briefId: brief.id,
      files: uploadData.fileUrl ? [{ url: uploadData.fileUrl, platform: uploadData.platform, dimensions: "1080x1080", name: uploadData.fileName || "asset", type: "image/png" }] : [],
      designerNote: uploadData.note,
      docContent: uploadData.docContent,
      liveLink: uploadData.liveLink,
      uploadedAt: new Date().toISOString(),
      status: "pending",
      submittedBy: currentUser.id,
      submittedByName: currentUser.name,
      submitterRole: currentUser.role
    };

    try {
      updateStore((prev: any) => ({
        ...prev,
        uploads: [newUpload, ...(prev.uploads || [])],
        briefs: prev.briefs.map((b: any) => b.id === brief.id ? { ...b, status: "uploaded" } : b)
      }));

      const token = localStorage.getItem("token");
      if (token && !String(brief.id).startsWith('b')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        await fetch(`${apiUrl}/tasks/${brief.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ status: "uploaded" })
        });
      }

      // Notify admins
      users.filter((u: any) => u.role === 'admin').forEach((u: any) => {
        addNotification?.(u.id, `${currentUser.name} submitted work for "${brief.title}"`);
      });

      toast.success("Work submitted for review!");
      setIsUploadModalOpen(false);
      setUploadData({ fileUrl: "", fileName: "", platform: safePlatforms[0] || "Instagram Feed", note: "", liveLink: "", docContent: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit");
    }
  };

  const handleStatusUpdate = async (newStatus: string, uploadId?: string) => {
    try {
      updateStore((prev: any) => {
        let nextUploads = prev.uploads || [];
        if (uploadId) {
          nextUploads = nextUploads.map((u: any) => u.id === uploadId ? { ...u, status: newStatus === 'approved' ? 'approved' : newStatus === 'revision' ? 'revision' : 'pending' } : u);
        }
        return {
          ...prev,
          uploads: nextUploads,
          briefs: prev.briefs.map((b: any) => b.id === brief.id ? { ...b, status: newStatus } : b)
        };
      });

      const token = localStorage.getItem("token");
      if (token && !String(brief.id).startsWith('b')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        await fetch(`${apiUrl}/tasks/${brief.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ status: newStatus })
        });
      }

      // Notify assignees
      assignedIds.forEach((uid: string) => {
        addNotification?.(uid, `Admin ${newStatus === 'approved' ? 'approved' : newStatus === 'revision' ? 'requested revision on' : 'updated'} "${brief.title}"`);
      });

      const labels: any = { approved: 'Task approved!', revision: 'Revision requested', todo: 'Marked as pending', in_progress: 'Marked as in progress' };
      toast.success(labels[newStatus] || 'Status updated');
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const formatDate = (value: string) => {
    if (!value) return "";
    return new Date(`${value}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo": return "bg-panel-2 text-muted border-line";
      case "in_progress": return "bg-primary/10 text-primary border-primary/20";
      case "revision": return "bg-warning/10 text-warning border-warning/30";
      case "uploaded": return "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/30";
      case "approved": 
      case "completed": return "bg-ok/10 text-ok border-ok/30";
      default: return "bg-panel-2 text-muted border-line";
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status) return "";
    switch(status) {
      case "in_progress": return "In Progress";
      case "uploaded": return "In Review";
      default: return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
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

  const assignedIds = (Array.isArray(brief.assignedToMulti) && brief.assignedToMulti.length > 0) 
    ? brief.assignedToMulti 
    : (Array.isArray(brief.assignedTo) ? brief.assignedTo : (brief.assignedTo ? [brief.assignedTo] : []));
  
  const assignees = assignedIds.map((tid: string) => users.find((u: any) => u.id === tid)).filter(Boolean);

  return (
    <div className="max-w-[1400px] mx-auto h-full flex flex-col pt-2 pb-6">
      
      {/* Top Navigation / Action Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-line shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="btn ghost w-10 h-10 p-0 rounded-xl hover:bg-panel border border-line hover:border-strong-line transition-all flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-[10px] font-extrabold text-muted uppercase tracking-widest mb-1">Task Detail</div>
            <h1 className="text-xl font-bold text-text m-0">{brief.title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin Actions */}
          {isAdmin && brief.status === 'uploaded' && (
            <>
              <button onClick={() => handleStatusUpdate('approved')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ok text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">
                <Check size={16} /> Approve
              </button>
              <button onClick={() => handleStatusUpdate('revision')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">
                <RotateCcw size={16} /> Request Revision
              </button>
              <button onClick={() => handleStatusUpdate('todo')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-sm font-bold text-muted hover:bg-panel transition-all">
                <Clock size={16} /> Mark Pending
              </button>
            </>
          )}
          {isAdmin && brief.status !== 'uploaded' && brief.status !== 'approved' && (
            <button onClick={() => handleStatusUpdate('approved')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-ok/50 text-sm font-bold text-ok hover:bg-ok/10 transition-all">
              <Check size={16} /> Mark Complete
            </button>
          )}
          {/* Assignee Actions */}
          {!isAdmin && (
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
            >
              <Upload size={16} /> {brief.status === 'revision' ? 'Resubmit Work' : 'Submit Work'}
            </button>
          )}
          {/* Status Badge */}
          <span className={`ml-2 px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border ${getStatusColor(brief.status)}`}>
            {getStatusLabel(brief.status)}
          </span>
        </div>
      </div>

      {/* Main Content Layout (2 Columns) */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 min-h-0">
        
        {/* Left Column: Task Information */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="bg-panel border border-line rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 mb-10 text-sm">
              
              {/* Status */}
              <div>
                <div className="text-[11px] font-extrabold text-muted uppercase tracking-widest mb-3">Status</div>
                <span className={`px-2.5 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider border ${getStatusColor(brief.status)}`}>
                  {getStatusLabel(brief.status)}
                </span>
              </div>

              {/* Due Date */}
              <div>
                <div className="text-[11px] font-extrabold text-muted uppercase tracking-widest mb-3">Due Date</div>
                <div className="flex items-center gap-2 font-bold text-text">
                  <Clock size={16} className="text-muted" />
                  {formatDate(brief.dueDate) || "No due date"}
                </div>
              </div>

              {/* Assignees */}
              <div className="sm:col-span-2">
                <div className="text-[11px] font-extrabold text-muted uppercase tracking-widest mb-3">Assignees</div>
                {assignees.length === 0 ? (
                  <span className="text-muted italic">Unassigned</span>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {assignees.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-panel-2 border border-line text-sm transition-colors hover:border-primary/30">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-1 ring-white/20">
                          {a.avatar || a.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-text leading-tight">{a.name}</span>
                          <span className="text-[9px] font-bold text-muted uppercase tracking-wider">{a.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <div className="text-[11px] font-extrabold text-muted uppercase tracking-widest mb-3">Priority</div>
                <span className={`px-2.5 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider ${
                  brief.priority === 'Low' ? 'bg-ok/10 text-ok border border-ok/20' : 
                  brief.priority === 'Urgent' ? 'bg-danger/10 text-danger border border-danger/20' : 
                  'bg-panel-2 text-text border border-line'
                }`}>
                  {brief.priority}
                </span>
              </div>

              {/* Tone */}
              {brief.tone && (
                <div>
                  <div className="text-[11px] font-extrabold text-muted uppercase tracking-widest mb-3">Tone</div>
                  <div className="font-bold text-text">{brief.tone}</div>
                </div>
              )}

              {/* Platforms */}
              {safePlatforms.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="text-[11px] font-extrabold text-muted uppercase tracking-widest mb-3">Platforms</div>
                  <div className="flex flex-wrap gap-2">
                    {safePlatforms.map((p: string) => (
                      <span key={p} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-white text-xs font-bold shadow-sm" style={{ background: platformMeta[p]?.color || "var(--primary)" }}>
                        {platformMeta[p]?.icon || p} {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {safeHashtags.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="text-[11px] font-extrabold text-muted uppercase tracking-widest mb-3">Hashtags</div>
                  <div className="flex flex-wrap gap-2">
                    {safeHashtags.map((h: string) => (
                      <span key={h} className="text-xs font-bold text-text bg-panel-2 border border-line px-2.5 py-1 rounded-md">{h}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <hr className="border-line mb-8" />

            {/* Description */}
            <div className="mb-10">
              <h3 className="font-extrabold text-lg text-text mb-4">Description</h3>
              <div className="bg-panel-2/30 rounded-xl p-5 border border-line/50">
                <p className="text-[15px] text-text whitespace-pre-wrap leading-relaxed m-0 font-medium">
                  {brief.copy || <span className="text-muted italic">No content copy provided.</span>}
                </p>
              </div>
            </div>

            {/* Notes */}
            {brief.notes && brief.notes.replace(/<[^>]*>/g, '').trim() && (
              <div className="mb-10">
                <h3 className="font-extrabold text-lg text-text mb-4 flex items-center gap-2">
                  Notes <AlertCircle size={16} className="text-warning" />
                </h3>
                <div className="bg-warning/5 border border-warning/20 rounded-xl overflow-hidden">
                  <style dangerouslySetInnerHTML={{__html: `
                    .task-notes-preview img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 0.75rem 0; display: block; }
                    .task-notes-preview h1 { font-size: 1.4rem; font-weight: 800; margin: 0.75rem 0 0.5rem; }
                    .task-notes-preview h2 { font-size: 1.15rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
                    .task-notes-preview p { margin: 0.25rem 0; }
                    .task-notes-preview ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
                    .task-notes-preview ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
                    .task-notes-preview li { margin: 0.2rem 0; }
                    .task-notes-preview strong { font-weight: 700; }
                    .task-notes-preview em { font-style: italic; }
                    .task-notes-preview pre { background: rgba(0,0,0,0.2); border-radius: 0.4rem; padding: 0.75rem 1rem; font-family: monospace; font-size: 0.85em; white-space: pre-wrap; margin: 0.5rem 0; }
                    .task-notes-preview code { background: rgba(0,0,0,0.2); border-radius: 0.25rem; padding: 0.1em 0.3em; font-family: monospace; font-size: 0.85em; }
                    .task-notes-preview blockquote { border-left: 3px solid var(--warning, #f59e0b); padding-left: 1rem; margin: 0.5rem 0; opacity: 0.8; }
                    .task-notes-preview a { color: var(--primary, #6366f1); text-decoration: underline; }
                  `}} />
                  <div
                    className="task-notes-preview text-sm text-text leading-relaxed p-6"
                    dangerouslySetInnerHTML={{ __html: brief.notes }}
                  />
                </div>
              </div>
            )}

            {/* Visual Reference */}
            {brief.visualReference && (
              <div>
                <h3 className="font-extrabold text-lg text-text mb-4">Visual Reference</h3>
                <a 
                  href={brief.visualReference} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-4 p-4 rounded-xl border border-line bg-panel hover:border-primary/40 hover:shadow-sm transition-all max-w-md group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ExternalLink size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-bold text-text truncate group-hover:text-primary transition-colors">Visual Asset Link</div>
                    <div className="text-xs font-semibold text-muted truncate mt-1">{brief.visualReference}</div>
                  </div>
                </a>
              </div>
            )}

            {/* Submitted Work Section */}
            {store.uploads?.filter((u: any) => u.briefId === brief.id).length > 0 && (
              <div className="mt-12 pt-8 border-t border-line">
                <h3 className="font-extrabold text-xl text-text mb-6">Submitted Work</h3>
                <div className="flex flex-col gap-6">
                  {store.uploads?.filter((u: any) => u.briefId === brief.id).map((upload: any, idx: number) => (
                    <div key={upload.id || idx} className={`border rounded-2xl p-6 ${upload.status === 'approved' ? 'bg-ok/5 border-ok/30' : upload.status === 'revision' ? 'bg-danger/5 border-danger/30' : 'bg-panel-2/50 border-line'}`}>
                      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-extrabold text-primary uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={16} strokeWidth={3} /> Submission {idx + 1}
                          </span>
                          {upload.submittedByName && (
                            <span className="text-[11px] font-bold text-muted">by {upload.submittedByName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                            upload.status === 'approved' ? 'bg-ok/10 text-ok border-ok/20' : 
                            upload.status === 'revision' ? 'bg-danger/10 text-danger border-danger/20' : 
                            'bg-panel-2 text-muted border-line'
                          }`}>
                            {upload.status === 'approved' ? '✓ Approved' : upload.status === 'revision' ? '↻ Revision' : '⏳ Pending Review'}
                          </span>
                          <span className="text-[11px] font-bold text-muted">
                            {new Date(upload.uploadedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {upload.files?.map((f: any, fIdx: number) => (
                          <a 
                            key={fIdx} 
                            href={f.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-4 p-4 bg-panel border border-line hover:border-primary/40 rounded-xl transition-colors shadow-sm group"
                          >
                            <div className="w-12 h-12 bg-panel-2 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                              <ImageIcon size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-text truncate group-hover:text-primary transition-colors m-0">
                                {f.name || "Design Asset"}
                              </h4>
                              <span className="text-[10px] font-bold text-muted uppercase tracking-wider mt-1 inline-block bg-panel-2 px-2 py-0.5 rounded">
                                {f.platform}
                              </span>
                            </div>
                            <ExternalLink size={16} className="text-muted group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>

                      {upload.liveLink && (
                        <div className="mt-4">
                          <a href={upload.liveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-3 bg-panel border border-line hover:border-primary/40 rounded-xl text-primary text-sm font-bold shadow-sm transition-all">
                            <LinkIcon size={16} /> View Live Link / Preview
                            <ExternalLink size={14} className="ml-1 opacity-70" />
                          </a>
                        </div>
                      )}

                      {upload.docContent && (upload.docContent.replace(/<[^>]*>/g, '').trim() !== '' || upload.docContent.includes('<img')) && (
                        <div className="mt-4 bg-panel border border-line rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-panel-2/50 px-4 py-2.5 border-b border-line text-[11px] font-extrabold text-muted uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle size={14} /> Documentation & Screenshots
                          </div>
                          <div className="p-5 task-notes-preview text-sm text-text leading-relaxed" dangerouslySetInnerHTML={{ __html: upload.docContent }} />
                        </div>
                      )}

                      {upload.designerNote && (
                        <div className="mt-4 bg-panel p-4 rounded-xl border border-line flex gap-3 shadow-sm">
                          <AlertCircle size={16} className="text-muted shrink-0 mt-0.5" />
                          <div className="text-sm text-text">
                            <span className="font-bold text-[11px] text-muted block mb-1 uppercase tracking-wider">Submitter's Note</span>
                            <p className="m-0 leading-relaxed font-medium">{upload.designerNote}</p>
                          </div>
                        </div>
                      )}

                      {/* Admin Review Actions per Upload */}
                      {isAdmin && upload.status !== 'approved' && (
                        <div className="mt-5 pt-4 border-t border-line/50 flex items-center gap-3">
                          <button onClick={() => handleStatusUpdate('approved', upload.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ok text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">
                            <Check size={14} /> Approve
                          </button>
                          <button onClick={() => handleStatusUpdate('revision', upload.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-warning/50 text-sm font-bold text-warning hover:bg-warning/10 transition-all">
                            <RotateCcw size={14} /> Request Revision
                          </button>
                        </div>
                      )}
                      {isAdmin && upload.status === 'approved' && (
                        <div className="mt-4 flex items-center gap-2 text-ok text-sm font-bold">
                          <CheckCircle2 size={16} /> This submission has been approved
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Right Column: Live Chat / Comments */}
        <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col bg-panel border border-line rounded-2xl shadow-sm overflow-hidden shrink-0 lg:sticky lg:top-4 lg:self-start" style={{ minHeight: '600px', maxHeight: 'calc(100vh - 120px)' }}>
          {/* Chat Header */}
          <div className="p-5 border-b border-line bg-panel-2/40 flex items-center justify-between shrink-0">
            <h3 className="font-extrabold text-base text-text flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MoreHorizontal size={16} className="text-primary" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-ok border-2 border-panel"></div>
              </div>
              Live Chat
            </h3>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-ok bg-ok/10 border border-ok/20 px-2.5 py-1 rounded-full">● Online</span>
          </div>
          
          {/* Chat Content fills and scrolls */}
          <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
            <TaskComments taskId={brief.id} className="flex flex-col h-full px-4 py-4" />
          </div>
        </div>

      </div>

      {/* Submit Work Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title={brief.status === 'revision' ? '↻ Resubmit Work for Review' : '✦ Submit Work for Review'} maxWidth="max-w-2xl">
        <div className="flex flex-col">

          {/* Role + Status Banner */}
          <div className={`mx-6 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border ${
            currentUser.role === 'designer'
              ? 'bg-[#f472b6]/10 text-[#f472b6] border-[#f472b6]/20'
              : currentUser.role === 'developer'
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-ok/10 text-ok border-ok/20'
          }`}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-70">Submitting as</span>
              <span className="font-extrabold capitalize">{currentUser.name} · {currentUser.role}</span>
            </div>
            {brief.status === 'revision' && (
              <div className="ml-auto flex items-center gap-2 text-warning text-[10px] font-extrabold uppercase tracking-widest bg-warning/10 border border-warning/30 px-3 py-1.5 rounded-lg">
                <RotateCcw size={11} strokeWidth={3} /> Revision Requested
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-6 mt-5 mb-1">
            <div className="text-[11px] font-extrabold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="flex-1 h-px bg-line"></span>
              Submission Details
              <span className="flex-1 h-px bg-line"></span>
            </div>
          </div>

          {/* Fields */}
          <div className="px-6 flex flex-col gap-5 pb-6">

            {/* File Upload UI */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-extrabold text-text uppercase tracking-widest flex items-center gap-1.5">
                <ImageIcon size={11} /> Main Asset / Screenshot
              </label>
              <div className="relative border-2 border-dashed border-line rounded-xl p-6 text-center hover:bg-panel-2 transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/*,video/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <Upload size={18} />
                  </div>
                  {uploadData.fileName ? (
                    <>
                      <p className="text-sm font-bold text-text truncate max-w-xs">{uploadData.fileName}</p>
                      <p className="text-xs text-ok font-extrabold">✓ File selected</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-text">Click or drag file to upload</p>
                      <p className="text-xs text-muted font-medium">Supports JPG, PNG, MP4, PDF</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Platform — designer only */}
            {currentUser.role === 'designer' && safePlatforms.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-extrabold text-text uppercase tracking-widest flex items-center gap-1.5">
                  <Hash size={11} /> Target Platform
                </label>
                <div className="flex flex-wrap gap-2">
                  {safePlatforms.map((p: string) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setUploadData({...uploadData, platform: p})}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        uploadData.platform === p
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-panel-2 text-text border-line hover:border-primary/40'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live Link */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-extrabold text-text uppercase tracking-widest flex items-center gap-1.5">
                <LinkIcon size={11} /> Live Link / Preview URL
                <span className="font-medium text-muted normal-case tracking-normal text-[10px]">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <ExternalLink size={15} />
                </div>
                <input
                  type="url"
                  placeholder="https://staging.yoursite.com  ·  Figma  ·  GitHub PR  ·  Drive..."
                  className="input pl-9 text-sm"
                  value={uploadData.liveLink}
                  onChange={(e) => setUploadData({...uploadData, liveLink: e.target.value})}
                />
              </div>
            </div>

            {/* Rich Text Documentation */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-extrabold text-text uppercase tracking-widest flex items-center gap-1.5">
                {currentUser.role === 'designer' ? '✦ Design Notes & Documentation' : '✦ Work Summary & Documentation'}
              </label>
              <p className="text-[11px] text-muted -mt-1 leading-snug">
                {currentUser.role === 'designer'
                  ? 'Explain your design decisions, color choices, typography, and anything the reviewer should know.'
                  : 'Describe what you built, any technical decisions, blockers, TODOs, or edge cases.'}
              </p>
              <div className="rounded-xl border border-line overflow-hidden shadow-sm">
                <RichTextEditor
                  value={uploadData.docContent}
                  onChange={(val: string) => setUploadData({...uploadData, docContent: val})}
                  placeholder={
                    currentUser.role === 'designer'
                      ? 'Write your design notes here... use @ to mention teammates'
                      : 'Write your technical summary here... use @ to mention teammates'
                  }
                  users={store.users || users}
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-line bg-panel-2/30">
            <p className="text-[11px] text-muted font-medium hidden sm:block">
              {currentUser.role === 'designer' ? 'Upload images directly in the editor using the image button ↑' : 'Paste screenshots directly into the editor ↑'}
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <button onClick={() => setIsUploadModalOpen(false)} className="btn text-text bg-panel hover:bg-panel-2 border border-line">
                Cancel
              </button>
              <button
                onClick={handleSubmitWork}
                className="btn primary px-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Upload size={15} />
                {brief.status === 'revision' ? 'Resubmit for Review' : 'Submit for Review'}
              </button>
            </div>
          </div>

        </div>
      </Modal>
    </div>
  );
}

