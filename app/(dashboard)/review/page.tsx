"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useScheduler } from "../../context/SchedulerContext";
import {
  Check, Clock, Lock, Image as ImageIcon, Eye, RotateCcw,
  Hash, AlertTriangle, Layers, ArrowRight, CheckCircle2, RefreshCcw
} from "lucide-react";
import toast from "react-hot-toast";

export default function ReviewPage() {
  const { store, updateStore, currentUser, users } = useScheduler();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const isAllowed = currentUser.role === "admin";

  const reviewTasks = useMemo(() => {
    return store.briefs.filter((b: any) => b.status === "uploaded" || b.status === "revision");
  }, [store.briefs]);

  const readyCount = reviewTasks.filter((t: any) => t.status === "uploaded").length;
  const revisionCount = reviewTasks.filter((t: any) => t.status === "revision").length;

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    setLoadingId(taskId);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        updateStore((prev: any) => ({
          ...prev,
          briefs: prev.briefs.map((b: any) => b.id === taskId ? { ...b, status: newStatus } : b)
        }));
        toast.success(`Task marked as ${newStatus}`);
      } else {
        toast.error("Failed to update task status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoadingId(null);
    }
  };

  const platformColors: Record<string, string> = {
    "Instagram Feed": "#E1306C",
    "Instagram Story/Reel": "#C13584",
    Facebook: "#1877F2",
    "X (Twitter)": "#1DA1F2",
    LinkedIn: "#0077B5",
    Pinterest: "#E60023",
    "YouTube Shorts": "#FF0000",
  };

  const formatDate = (value: string) => {
    if (!value) return "No due date";
    const d = new Date(`${value}T00:00:00`);
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(`${dueDate}T00:00:00`) < new Date();
  };

  if (!isAllowed) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center py-32 gap-4">
        <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-2">
          <Lock size={36} className="text-danger" />
        </div>
        <h2 className="text-2xl font-black text-text">Access Restricted</h2>
        <p className="text-muted max-w-sm">You don&apos;t have the permissions to view the review queue. Contact your admin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-10">

      {/* ── Header ── */}
      <div className="relative bg-panel border border-line rounded-3xl p-7 overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <h1 className="text-3xl font-black text-text tracking-tight mb-1">Review Queue</h1>
            <p className="text-muted text-sm max-w-md leading-relaxed">
              Approve submitted content for publishing, or send it back for revisions.
            </p>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 bg-primary/8 border border-primary/20 text-primary px-4 py-2.5 rounded-2xl">
              <Layers size={16} />
              <span className="text-sm font-extrabold">{readyCount}</span>
              <span className="text-xs font-bold opacity-70">Pending</span>
            </div>
            {revisionCount > 0 && (
              <div className="flex items-center gap-2.5 bg-warning/10 border border-warning/20 text-warning px-4 py-2.5 rounded-2xl">
                <RefreshCcw size={16} />
                <span className="text-sm font-extrabold">{revisionCount}</span>
                <span className="text-xs font-bold opacity-70">In Revision</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Task List ── */}
      {reviewTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[340px] bg-panel border-2 border-dashed border-line rounded-3xl text-center gap-4 p-10">
          <div className="w-20 h-20 rounded-full bg-ok/10 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-ok" />
          </div>
          <div>
            <h3 className="text-xl font-black text-text mb-1">You&apos;re all caught up!</h3>
            <p className="text-muted text-sm max-w-xs mx-auto">No content is waiting for review right now. Great work keeping the queue clear.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviewTasks.map((task: any) => {
            const assignedIds = (Array.isArray(task.assignedToMulti) && task.assignedToMulti.length > 0)
              ? task.assignedToMulti
              : task.assignedTo ? [task.assignedTo] : [];
            const assignees = assignedIds.map((tid: string) => users.find((u: any) => u.id === tid)).filter(Boolean);
            const isRevision = task.status === "revision";
            const taskUploads = (store.uploads || []).filter((u: any) => u.briefId === task.id);
            const totalAssets = taskUploads.reduce((acc: number, u: any) => acc + (u.files?.length || 0), 0);
            const overdue = isOverdue(task.dueDate);

            const priorityConfig: Record<string, { cls: string; dot: string }> = {
              Urgent:  { cls: "bg-danger/10 text-danger border border-danger/20",  dot: "bg-danger" },
              High:    { cls: "bg-warning/10 text-warning border border-warning/20", dot: "bg-warning" },
              Medium:  { cls: "bg-primary/10 text-primary border border-primary/20", dot: "bg-primary" },
              Low:     { cls: "bg-ok/10 text-ok border border-ok/20",              dot: "bg-ok" },
            };
            const pConf = priorityConfig[task.priority] || { cls: "bg-panel-2 text-muted border border-line", dot: "bg-muted" };

            return (
              <div
                key={task.id}
                className={`group relative bg-panel border rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
                  isRevision
                    ? "border-warning/30 shadow-warning/5 shadow-md"
                    : "border-line hover:border-primary/30"
                }`}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl ${isRevision ? "bg-warning" : "bg-primary"}`} />

                <div className="pl-5 pr-6 py-5 flex flex-col lg:flex-row items-stretch gap-5">

                  {/* ── Submitter ── */}
                  <div className="flex items-center gap-3.5 min-w-[180px] shrink-0">
                    <div className={`relative w-12 h-12 rounded-2xl text-white font-black flex items-center justify-center text-base shadow-md shrink-0 ${
                      isRevision
                        ? "bg-gradient-to-br from-warning to-orange-500"
                        : "bg-gradient-to-br from-primary to-emerald-500"
                    }`}>
                      {assignees[0]?.name?.charAt(0)?.toUpperCase() || "U"}
                      {/* Online dot */}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-ok border-2 border-panel rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Submitted By</p>
                      <p className="text-sm font-extrabold text-text leading-tight truncate">{assignees[0]?.name || "Unassigned"}</p>
                      <p className="text-[11px] font-semibold text-muted capitalize mt-0.5">{assignees[0]?.role || "Team Member"}</p>
                    </div>
                  </div>

                  {/* ── Divider ── */}
                  <div className="hidden lg:block w-px bg-line/60 shrink-0" />

                  {/* ── Task Info ── */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">

                    {/* Status + Due */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-lg ${
                        isRevision
                          ? "bg-warning text-white"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}>
                        {isRevision ? <RefreshCcw size={10} /> : <Layers size={10} />}
                        {isRevision ? "In Revision" : "Ready for Review"}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1 ${
                        overdue ? "bg-danger/10 text-danger border border-danger/20" : "text-muted"
                      }`}>
                        {overdue && <AlertTriangle size={11} />}
                        <Clock size={11} />
                        {formatDate(task.dueDate)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className="text-base font-black text-text hover:text-primary transition-colors cursor-pointer truncate leading-snug"
                    >
                      {task.title}
                    </h2>

                    {/* Platforms */}
                    {task.platforms && task.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {task.platforms.map((p: string) => (
                          <span
                            key={p}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                            style={{ background: platformColors[p] || "var(--primary)" }}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Divider ── */}
                  <div className="hidden lg:block w-px bg-line/60 shrink-0" />

                  {/* ── Meta Chips ── */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-start justify-start gap-3 shrink-0 min-w-[120px]">
                    {/* Priority */}
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest hidden lg:block">Priority</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${pConf.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pConf.dot}`} />
                        {task.priority || "Normal"}
                      </span>
                    </div>

                    {/* Assets */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
                      <ImageIcon size={13} />
                      <span>{totalAssets} {totalAssets === 1 ? "asset" : "assets"}</span>
                    </div>

                    {/* All assignees avatars if more than 1 */}
                    {assignees.length > 1 && (
                      <div className="flex -space-x-2">
                        {assignees.slice(0, 4).map((a: any) => (
                          <div
                            key={a.id}
                            title={`${a.name} (${a.role})`}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-emerald-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-panel"
                          >
                            {a.name?.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {assignees.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-panel-2 border border-line text-muted text-[9px] font-bold flex items-center justify-center ring-2 ring-panel">
                            +{assignees.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Divider ── */}
                  <div className="hidden lg:block w-px bg-line/60 shrink-0" />

                  {/* ── Actions ── */}
                  <div className="flex flex-row lg:flex-col items-center gap-2.5 shrink-0 justify-end lg:justify-center w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0">
                    <button
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-extrabold border border-primary/20 hover:border-primary/40 transition-all w-full justify-center group/btn"
                    >
                      <Eye size={14} />
                      Review Task
                      <ArrowRight size={13} className="opacity-0 group-hover/btn:opacity-100 -ml-1 transition-all" />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(task.id, "revision")}
                      disabled={loadingId === task.id || isRevision}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-warning/10 hover:bg-warning/20 text-warning text-xs font-extrabold border border-warning/20 hover:border-warning/40 transition-all w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RotateCcw size={14} />
                      Request Revision
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(task.id, "approved")}
                      disabled={loadingId === task.id}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ok hover:bg-ok/90 text-white text-xs font-extrabold shadow-sm shadow-ok/30 active:scale-95 transition-all w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Check size={14} strokeWidth={3} />
                      {loadingId === task.id ? "Saving…" : "Approve"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
