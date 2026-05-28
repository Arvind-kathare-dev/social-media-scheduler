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
        className="task-card p-4 mb-3 bg-panel border border-line rounded-xl cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-line group-hover:bg-primary transition-colors"></div>
        <div className="card-title font-extrabold mb-3 break-words text-[15px] text-text group-hover:text-primary transition-colors pl-1">
          <CheckCircle2 size={16} className="inline-block mr-2 text-muted/40 relative -top-[1px] group-hover:text-primary transition-colors" />
          {brief.title}
        </div>
        <div className="meta flex flex-wrap gap-2.5 items-center text-[11px] font-bold text-muted pl-1">
          {brief.dueDate && (
            <span className={`due ${dueClass(brief.dueDate)}`}>{formatDate(brief.dueDate)}</span>
          )}
          
          {safePlatforms.map((p: string) => (
            <span 
              key={p} 
              className="chip platform inline-flex items-center gap-1.5 rounded-[6px] px-2 py-0.5 text-white max-w-full text-[10px] font-extrabold shadow-sm" 
              style={{ background: platformMeta[p]?.color || "var(--primary)" }}
            >
              {platformMeta[p]?.icon || p}
            </span>
          ))}
          
          <span className={`priority rounded-[6px] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
            brief.priority === 'Low' ? 'bg-ok/10 text-ok border border-ok/20' : 
            brief.priority === 'Urgent' ? 'bg-danger/10 text-danger border border-danger/20' : 
            'bg-panel-2 text-text border border-line'
          }`}>
            {brief.priority}
          </span>
          
          {user && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[10px] font-bold ml-auto shadow-sm ring-2 ring-panel group-hover:ring-primary/20 transition-all">
              {user.avatar || user.name.charAt(0)}
            </div>
          )}
        </div>
      </article>
    </>
  );
}
