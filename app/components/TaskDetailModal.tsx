import { useState, useEffect } from "react";
import { Hash, ExternalLink, CheckCircle2, ThumbsUp, Link as LinkIcon, MoreHorizontal, X, Clock, AlertCircle, Upload, Image as ImageIcon, RotateCcw } from "lucide-react";
import SlideOver from "./SlideOver";
import Modal from "./Modal";
import { useScheduler } from "../context/SchedulerContext";
import toast from "react-hot-toast";
import TaskComments from "./TaskComments";

export default function TaskDetailModal({ isOpen, onClose, brief, user }: any) {
  const { store, updateStore, currentUser, users } = useScheduler();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';
  const addNotification = (store as any).addNotification || null;
  const assignedIds = (Array.isArray(brief?.assignedToMulti) && brief.assignedToMulti.length > 0) ? brief.assignedToMulti : (Array.isArray(brief?.assignedTo) ? brief.assignedTo : (brief?.assignedTo ? [brief.assignedTo] : []));

  
  const safePlatforms = Array.isArray(brief?.platforms) ? brief.platforms : (typeof brief?.platforms === 'string' ? JSON.parse(brief.platforms || "[]") : []);
  const safeHashtags = Array.isArray(brief?.hashtags) ? brief.hashtags : (typeof brief?.hashtags === 'string' ? JSON.parse(brief.hashtags || "[]") : []);
  
  const [uploadData, setUploadData] = useState({
    fileUrl: "",
    fileName: "",
    platform: safePlatforms[0] || "Instagram Feed",
    note: "",
    liveLink: "",
    docContent: "",
    fileObj: null as File | null
  });

  useEffect(() => {
    if (brief && isOpen && !String(brief.id).startsWith('b')) {
      const fetchSubmissions = async () => {
        try {
          const token = localStorage.getItem("token");
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
          const res = await fetch(`${apiUrl}/tasks/${brief.id}/submissions`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              const formattedSubs = data.data.map((sub: any) => ({
                id: sub.id,
                briefId: String(sub.task_id),
                files: typeof sub.files === 'string' ? JSON.parse(sub.files) : (sub.files || []),
                designerNote: sub.designer_note,
                docContent: sub.doc_content,
                liveLink: sub.live_link,
                uploadedAt: sub.created_at,
                status: sub.status,
                submittedBy: sub.submitted_by,
                submittedByName: sub.submitted_by_name,
                submitterRole: sub.submitter_role
              }));
              
              updateStore((prev: any) => {
                const otherUploads = (prev.uploads || []).filter((u: any) => String(u.briefId) !== String(brief.id));
                return { ...prev, uploads: [...formattedSubs, ...otherUploads] };
              });
            }
          }
        } catch (err) {
          console.error("Failed to fetch submissions", err);
        }
      };
      fetchSubmissions();
    }
  }, [brief?.id, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadData(prev => ({ ...prev, fileUrl: url, fileName: file.name, fileObj: file }));
    }
  };

  const handleSubmitWork = async () => {
    if (!uploadData.fileObj && !uploadData.fileUrl && !uploadData.liveLink && !uploadData.docContent.replace(/<[^>]*>/g,'').trim()) {
      toast.error("Please provide at least a file, live link, or documentation");
      return;
    }
    
    try {
      let backendSubmission = null;
      const token = localStorage.getItem("token");
      if (token && !String(brief.id).startsWith('b')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const formData = new FormData();
        if (uploadData.fileObj) {
            formData.append("files", uploadData.fileObj);
        }
        formData.append("live_link", uploadData.liveLink || "");
        formData.append("doc_content", uploadData.docContent || "");
        formData.append("designer_note", uploadData.note || "");
        formData.append("platform", uploadData.platform || "");

        const res = await fetch(`${apiUrl}/tasks/${brief.id}/submissions`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
        
        if (!res.ok) throw new Error("Failed to submit work");
        const data = await res.json();
        backendSubmission = data.data;
      }
      
      const newUpload = backendSubmission ? {
        id: backendSubmission.id,
        briefId: brief.id,
        files: backendSubmission.files ? (typeof backendSubmission.files === 'string' ? JSON.parse(backendSubmission.files) : backendSubmission.files) : [],
        designerNote: backendSubmission.designer_note,
        docContent: backendSubmission.doc_content,
        liveLink: backendSubmission.live_link,
        uploadedAt: backendSubmission.created_at,
        status: backendSubmission.status,
        submittedBy: backendSubmission.submitted_by,
        submittedByName: currentUser.name,
        submitterRole: currentUser.role
      } : {
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

      updateStore((prev: any) => ({
        ...prev,
        uploads: [newUpload, ...(prev.uploads || [])],
        briefs: prev.briefs.map((b: any) => b.id === brief.id ? { ...b, status: "uploaded" } : b)
      }));

      toast.success("Assets submitted for review!");
      setIsUploadModalOpen(false);
      setUploadData({ fileUrl: "", fileName: "", platform: safePlatforms[0] || "Instagram Feed", note: "", liveLink: "", docContent: "", fileObj: null });
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit task to server");
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
        
        if (uploadId && !String(uploadId).startsWith('up_')) {
          await fetch(`${apiUrl}/tasks/submissions/${uploadId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus === 'approved' ? 'approved' : newStatus === 'revision' ? 'revision' : 'pending' })
          });
        }
        
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
      case "qa": return "bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/30";
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
      case "qa": return "QA";
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

  if (!brief) return null;

  return (
    <>
      <SlideOver isOpen={isOpen} onClose={onClose} width="max-w-[800px] w-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-panel shrink-0">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-sm font-semibold text-muted hover:bg-panel-2 transition-colors">
              <CheckCircle2 size={16} /> Mark complete
            </button>
            <button 
              onClick={() => {
                onClose();
                setIsUploadModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
            >
              <Upload size={16} /> Submit Work
            </button>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 mr-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {user.avatar || user.name.charAt(0)}
                </div>
                <button className="px-3 py-1.5 rounded-md border border-line text-sm font-semibold text-text hover:bg-panel-2 transition-colors">
                  Share
                </button>
              </div>
            )}
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-panel-2 text-muted transition-colors">
              <ThumbsUp size={16} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-panel-2 text-muted transition-colors">
              <LinkIcon size={16} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-panel-2 text-muted transition-colors">
              <MoreHorizontal size={16} />
            </button>
            <div className="w-[1px] h-6 bg-line mx-1"></div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-panel-2 text-muted transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-bg py-6">
          <div className="px-6 md:px-8 max-w-[800px] mx-auto w-full">
            
            <div className="bg-panel border border-line rounded-2xl shadow-sm p-6 md:p-8 mb-6">
              <h1 className="text-3xl font-black text-text mb-8 tracking-tight flex items-start gap-3">
                {brief.title}
              </h1>

              <div className="grid grid-cols-[140px_1fr] gap-y-4 mb-8 text-sm">
              <div className="text-muted font-medium flex items-center h-8">Assignee</div>
              <div className="flex items-center min-h-8 py-1">
                                    {(() => {
                                        const assignedIds = (Array.isArray(brief.assignedToMulti) && brief.assignedToMulti.length > 0) ? brief.assignedToMulti : (Array.isArray(brief.assignedTo) ? brief.assignedTo : (brief.assignedTo ? [brief.assignedTo] : []));
                                        const assignees = assignedIds.map((id: string) => users.find((u: any) => u.id === id)).filter(Boolean);
                                        if (assignees.length === 0) {
                                            // Fallback to name if user object isn't found
                                            if (brief.assignedToName) {
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-panel-2 border border-line text-xs">
                                                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                                                            {brief.assignedToName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold">{brief.assignedToName}</span>
                                                        {brief.assignedToEmail && <span className="text-muted ml-1">({brief.assignedToEmail})</span>}
                                                    </span>
                                                );
                                            }
                                            return <span className="text-muted">Unassigned</span>;
                                        }
                                        return (
                                            <div className="flex flex-wrap gap-2">
                                                {assignees.map((a: any) => (
                                                    <span key={a.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-panel-2 border border-line text-xs">
                                                        <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-bold shadow-sm">
                                                            {a.avatar || a.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-text">{a.name}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        );
                                    })()}
              </div>

              <div className="text-muted font-medium flex items-center h-8">Due date</div>
              <div className="flex items-center h-8">
                <div className="flex items-center gap-2 px-2 -ml-2 rounded hover:bg-panel-2 cursor-pointer transition-colors font-semibold text-text">
                  <Clock size={16} className="text-muted" />
                  {formatDate(brief.dueDate) || "No due date"}
                </div>
              </div>

              <div className="text-muted font-medium flex items-center min-h-8">Platforms</div>
              <div className="flex flex-wrap items-center gap-1.5 min-h-8 py-1">
                {safePlatforms.map((p: string) => (
                  <span 
                    key={p} 
                    className="chip inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-white text-[11px] font-bold shadow-sm" 
                    style={{ background: platformMeta[p]?.color || "var(--primary)" }}
                  >
                    {platformMeta[p]?.icon || p} {p}
                  </span>
                ))}
              </div>

              <div className="text-muted font-medium flex items-center h-8">Priority</div>
              <div className="flex items-center h-8">
                <span className={`px-2 py-1 rounded-[5px] text-[11px] font-extrabold uppercase tracking-wider ${
                  brief.priority === 'Low' ? 'bg-ok/10 text-ok border border-ok/20' : 
                  brief.priority === 'Urgent' ? 'bg-danger/10 text-danger border border-danger/20' : 
                  'bg-panel-2 text-text border border-line'
                }`}>
                  {brief.priority}
                </span>
              </div>

              <div className="text-muted font-medium flex items-center h-8">Status</div>
              <div className="flex items-center h-8">
                <span className={`px-2 py-1 rounded-[5px] text-[11px] font-extrabold uppercase tracking-wider border ${getStatusColor(brief.status)}`}>
                  {getStatusLabel(brief.status)}
                </span>
              </div>

              {brief.tone && (
                <>
                  <div className="text-muted font-medium flex items-center h-8">Tone</div>
                  <div className="flex items-center h-8 font-semibold text-text">
                    {brief.tone}
                  </div>
                </>
              )}

              {safeHashtags.length > 0 && (
                <>
                  <div className="text-muted font-medium flex items-center min-h-8">Hashtags</div>
                  <div className="flex flex-wrap items-center gap-1.5 min-h-8 py-1">
                    {safeHashtags.map((h: string) => (
                      <span key={h} className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-md">{h}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mb-10">
              <h3 className="font-bold text-base text-text mb-3">Description</h3>
              <div className="bg-transparent border border-transparent hover:border-line rounded-lg p-2 -ml-2 transition-colors cursor-text group min-h-[100px]">
                <p className="text-[15px] text-text whitespace-pre-wrap leading-relaxed m-0 font-medium">
                  {brief.copy || <span className="text-muted">Add more detail to this task...</span>}
                </p>
              </div>
            </div>

            {brief.notes && brief.notes.replace(/<[^>]*>/g, '').trim() && (
              <div className="mb-10">
                <h3 className="font-bold text-base text-text mb-3 flex items-center gap-2">
                  Notes <AlertCircle size={14} className="text-warning" />
                </h3>
                <div className="bg-panel border border-line rounded-xl overflow-hidden">
                  <style dangerouslySetInnerHTML={{__html: `
                    .task-notes-preview img {
                      max-width: 100%;
                      height: auto;
                      border-radius: 0.5rem;
                      margin: 0.75rem 0;
                      display: block;
                    }
                    .task-notes-preview h1 { font-size: 1.4rem; font-weight: 800; margin: 0.75rem 0 0.5rem; }
                    .task-notes-preview h2 { font-size: 1.15rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
                    .task-notes-preview p { margin: 0.25rem 0; }
                    .task-notes-preview ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
                    .task-notes-preview ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
                    .task-notes-preview li { margin: 0.2rem 0; }
                    .task-notes-preview strong { font-weight: 700; }
                    .task-notes-preview em { font-style: italic; }
                    .task-notes-preview u { text-decoration: underline; }
                    .task-notes-preview s { text-decoration: line-through; }
                    .task-notes-preview pre { background: rgba(0,0,0,0.2); border-radius: 0.4rem; padding: 0.75rem 1rem; font-family: monospace; font-size: 0.85em; white-space: pre-wrap; margin: 0.5rem 0; }
                    .task-notes-preview code { background: rgba(0,0,0,0.2); border-radius: 0.25rem; padding: 0.1em 0.3em; font-family: monospace; font-size: 0.85em; }
                    .task-notes-preview blockquote { border-left: 3px solid var(--primary, #6366f1); padding-left: 1rem; margin: 0.5rem 0; opacity: 0.8; }
                    .task-notes-preview a { color: var(--primary, #6366f1); text-decoration: underline; }
                    .task-notes-preview hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 0.75rem 0; }
                  `}} />
                  <div
                    className="task-notes-preview text-sm text-text leading-relaxed p-5"
                    dangerouslySetInnerHTML={{ __html: brief.notes }}
                  />
                </div>
              </div>
            )}

            {brief.visualReference && (
              <div className="mb-10">
                <h3 className="font-bold text-base text-text mb-3">Visual Reference</h3>
                <div className="flex">
                  <a 
                    href={brief.visualReference} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 p-3 rounded-lg border border-line bg-panel-2 hover:bg-line/30 transition-colors max-w-sm"
                  >
                    <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <ExternalLink size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-bold text-text truncate">Visual Asset Link</div>
                      <div className="text-xs text-muted truncate mt-0.5">{brief.visualReference}</div>
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* Submitted Work Section */}
            {store.uploads?.filter((u: any) => String(u.briefId) === String(brief.id)).length > 0 && (
              <div className="mb-10 pt-8 border-t border-line">
                <h3 className="font-extrabold text-xl text-text mb-6">Submitted Work</h3>
                <div className="flex flex-col gap-6">
                  {store.uploads?.filter((u: any) => String(u.briefId) === String(brief.id)).map((upload: any, idx: number) => (
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
                            <CheckCircle2 size={14} /> Approve
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

            <div className="bg-panel border border-line rounded-2xl shadow-sm p-6 md:p-8 mb-6">
              <h3 className="font-bold text-base text-text mb-4">Activity</h3>
              
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-panel-2 flex items-center justify-center text-muted shrink-0 shadow-sm border border-line">
                  <CheckCircle2 size={14} />
                </div>
                <div className="text-sm">
                  <span className="font-bold text-text">{brief.createdByName || brief.createdBy || "System"}</span> <span className="text-muted">created this task.</span>
                  <div className="text-xs text-muted mt-1">{new Date(brief.createdAt || Date.now()).toLocaleString()}</div>
                </div>
              </div>

              <TaskComments taskId={brief.id} />
            </div>

          </div>
        </div>
      </SlideOver>

      {/* Upload Work Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Submit Work for Review" maxWidth="max-w-lg">
        <div className="p-5 flex flex-col gap-5">
          <label className="border-2 border-dashed border-line hover:border-primary/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-panel-2/30 cursor-pointer relative overflow-hidden group">
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
              onChange={handleFileChange} 
            />
            {uploadData.fileUrl && uploadData.fileUrl.startsWith('blob:') ? (
              <div className="relative w-full h-40 flex items-center justify-center">
                <img src={uploadData.fileUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                  <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-md">Change File</span>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon size={24} />
                </div>
                <h3 className="font-bold text-text mb-1">Click to upload assets</h3>
                <p className="text-xs text-muted max-w-[200px]">PNG, JPG, MP4 or GIF up to 50MB</p>
              </>
            )}
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">File Name</label>
              <input 
                type="text" 
                placeholder="e.g. hero-banner.png"
                className="input"
                value={uploadData.fileName}
                onChange={(e) => setUploadData({...uploadData, fileName: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Platform</label>
              <select 
                className="input"
                value={uploadData.platform}
                onChange={(e) => setUploadData({...uploadData, platform: e.target.value})}
              >
                {safePlatforms.length > 0 ? safePlatforms.map((p: string) => (
                  <option key={p} value={p}>{p}</option>
                )) : (
                  <option value="General">General</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider">External Link (Figma, Drive)</label>
            <input 
              type="url" 
              placeholder="https://"
              className="input"
              value={uploadData.liveLink}
              onChange={(e) => setUploadData({...uploadData, liveLink: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider">Note for Reviewer</label>
            <textarea 
              placeholder="Explain your design choices or mention what needs specific review..."
              className="input min-h-[80px] resize-y"
              value={uploadData.note}
              onChange={(e) => setUploadData({...uploadData, note: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setIsUploadModalOpen(false)} className="btn text-text bg-panel-2 hover:bg-line">Cancel</button>
            <button onClick={handleSubmitWork} className="btn primary">Submit Assets</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
