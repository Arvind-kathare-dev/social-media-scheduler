import { useState, useEffect } from "react";
import { Hash, CheckCircle2 } from "lucide-react";
import { useScheduler } from "../context/SchedulerContext";
import { useRouter } from "next/navigation";

export default function TaskCard({ brief, user, autoOpen = false }: any) {
  const router = useRouter();
  
  useEffect(() => {
    if (autoOpen) {
      router.push(`/tasks/${brief.id}`);
    }
  }, [autoOpen, router, brief.id]);
  
  const safePlatforms = Array.isArray(brief.platforms) ? brief.platforms : (typeof brief.platforms === 'string' ? JSON.parse(brief.platforms || "[]") : []);
  
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
        onClick={() => router.push(`/tasks/${brief.id}`)}
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
    </>
  );
}
