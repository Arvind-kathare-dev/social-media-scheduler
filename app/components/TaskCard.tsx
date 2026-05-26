import { useState } from "react";
import { Hash, ExternalLink, CheckCircle2, ThumbsUp, Link as LinkIcon, MoreHorizontal, X, Clock, AlertCircle, Upload, Image as ImageIcon } from "lucide-react";
import SlideOver from "./SlideOver";
import Modal from "./Modal";
import { useScheduler } from "../context/SchedulerContext";
import toast from "react-hot-toast";
import TaskComments from "./TaskComments";
export default function TaskCard({ brief, user }: any) {
  const { store, updateStore, currentUser, users } = useScheduler();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [comment, setComment] = useState("");
  
  const safePlatforms = Array.isArray(brief.platforms) ? brief.platforms : (typeof brief.platforms === 'string' ? JSON.parse(brief.platforms || "[]") : []);
  
  const [uploadData, setUploadData] = useState({
    fileUrl: "",
    fileName: "",
    platform: safePlatforms[0] || "Instagram Feed",
    note: ""
  });

  const taskComments = (store?.comments || []).filter((c: any) => c.briefId === brief.id);

  const safeHashtags = Array.isArray(brief.hashtags) ? brief.hashtags : (typeof brief.hashtags === 'string' ? JSON.parse(brief.hashtags || "[]") : []);

  const handleAddComment = () => {
    if (!comment.trim()) return;
    const newComment = {
      id: `c_${Date.now()}`,
      briefId: brief.id,
      authorId: currentUser.id,
      text: comment,
      type: "comment",
      createdAt: new Date().toISOString(),
    };
    updateStore((prev: any) => ({
      ...prev,
      comments: [...(prev.comments || []), newComment]
    }));
    setComment("");
    toast.success("Comment added!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadData(prev => ({ ...prev, fileUrl: url, fileName: file.name }));
    }
  };

  const handleSubmitWork = async () => {
    if (!uploadData.fileName && !uploadData.fileUrl) {
      toast.error("Please provide a file name or URL");
      return;
    }
    
    const newUpload = {
      id: `up_${Date.now()}`,
      briefId: brief.id,
      files: [
        { 
          url: uploadData.fileUrl, 
          platform: uploadData.platform, 
          dimensions: "1080x1080", 
          name: uploadData.fileName || "design_asset.png", 
          type: "image/png" 
        }
      ],
      designerNote: uploadData.note,
      uploadedAt: new Date().toISOString(),
      status: "pending"
    };

    try {
      // Optimistic update
      updateStore((prev: any) => ({
        ...prev,
        uploads: [newUpload, ...(prev.uploads || [])],
        briefs: prev.briefs.map((b: any) => b.id === brief.id ? { ...b, status: "uploaded" } : b)
      }));

      // Make API call to persist the status
      const token = localStorage.getItem("token");
      if (token && !String(brief.id).startsWith('b')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        await fetch(`${apiUrl}/tasks/${brief.id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ status: "uploaded" })
        });
      }

      toast.success("Assets submitted for review!");
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit task to server");
    }
  };

  const handleAssigneeChange = (e: any) => {
    const newAssigneeId = e.target.value;
    updateStore((prev: any) => ({
      ...prev,
      briefs: prev.briefs.map((b: any) => b.id === brief.id ? { ...b, assignedTo: newAssigneeId } : b)
    }));
    toast.success("Task reassigned successfully!");
  };

  const dueClass = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${date}T00:00:00`);
    const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return "text-danger";
    if (diff <= 3) return "text-warning";
    return "text-ok";
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

  return (
    <>
      <article 
        onClick={() => setIsModalOpen(true)}
        className="task-card p-3 mb-2.5 bg-panel border border-line rounded-custom cursor-pointer hover:border-strong-line hover:shadow-sm transition-all"
      >
        <div className="card-title font-extrabold mb-2 break-words text-[14px] text-text">
          <CheckCircle2 size={14} className="inline-block mr-1.5 text-muted/50 relative -top-[1px]" />
          {brief.title}
        </div>
        <div className="meta flex flex-wrap gap-2 items-center text-xs text-muted">
          {brief.dueDate && (
            <span className={`due ${dueClass(brief.dueDate)}`}>{formatDate(brief.dueDate)}</span>
          )}
          
          {safePlatforms.map((p: string) => (
            <span 
              key={p} 
              className="chip platform inline-flex items-center gap-1.5 rounded-[5px] px-1.5 py-0.5 text-white max-w-full text-[10px] font-bold" 
              style={{ background: platformMeta[p]?.color || "var(--primary)" }}
            >
              {platformMeta[p]?.icon || p}
            </span>
          ))}
          
          <span className={`priority rounded-[5px] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
            brief.priority === 'Low' ? 'bg-ok-bg text-ok' : 
            brief.priority === 'Urgent' ? 'bg-danger-bg text-danger' : 
            'bg-panel-2 text-text border border-line'
          }`}>
            {brief.priority}
          </span>
          
          {user && (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[9px] font-bold ml-auto shadow-sm">
              {user.avatar || user.name.charAt(0)}
            </div>
          )}
        </div>
      </article>

      <SlideOver isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} width="max-w-[800px] w-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-panel shrink-0">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-sm font-semibold text-muted hover:bg-panel-2 transition-colors">
              <CheckCircle2 size={16} /> Mark complete
            </button>
            <button 
              onClick={() => {
                setIsModalOpen(false);
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
            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-panel-2 text-muted transition-colors">
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
              <div className="flex items-center h-8">
                {currentUser.role === "admin" ? (
                  <select 
                    value={brief.assignedTo} 
                    onChange={handleAssigneeChange}
                    className="bg-panel-2 border border-line text-text text-sm rounded-md px-2 py-1 outline-none focus:border-primary/50 transition-colors"
                  >
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 px-2 -ml-2 rounded hover:bg-panel-2 cursor-pointer transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                      {user?.avatar || user?.name?.charAt(0) || "U"}
                    </div>
                    <span className="font-semibold text-text">{user?.name || "Unassigned"}</span>
                  </div>
                )}
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
            </div>

            <div className="bg-panel border border-line rounded-2xl shadow-sm p-6 md:p-8 mb-6">
              <h3 className="font-bold text-base text-text mb-4">Activity</h3>
              
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-panel-2 flex items-center justify-center text-muted shrink-0 shadow-sm border border-line">
                  <CheckCircle2 size={14} />
                </div>
                <div className="text-sm">
                  <span className="font-bold text-text">{user?.name || "System"}</span> <span className="text-muted">created this task.</span>
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
              value={uploadData.fileUrl}
              onChange={(e) => setUploadData({...uploadData, fileUrl: e.target.value})}
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

          <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
            <button className="btn ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
            <button className="btn primary" onClick={handleSubmitWork}>Submit for Review</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
