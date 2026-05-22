import { Hash } from "lucide-react";

export default function TaskCard({ brief, user }: any) {
  const dueClass = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${date}T00:00:00`);
    const diff = Math.ceil((due - today) / 86400000);
    if (diff < 0) return "text-danger";
    if (diff <= 3) return "text-warning";
    return "text-ok";
  };

  const formatDate = (value) => {
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
    <article className="task-card p-3 mb-2.5 bg-panel border border-line rounded-custom">
      <div className="card-title font-extrabold mb-2 break-words">{brief.title}</div>
      <div className="meta flex flex-wrap gap-2 items-center text-xs text-muted">
        <span className={`due ${dueClass(brief.dueDate)}`}>{formatDate(brief.dueDate)}</span>
        
        {brief.platforms.map(p => (
          <span 
            key={p} 
            className="chip platform inline-flex items-center gap-1.5 rounded-[7px] px-2 py-1 text-white max-w-full text-[12px]" 
            style={{ background: platformMeta[p]?.color || "var(--primary)" }}
          >
            {platformMeta[p]?.icon || p}
          </span>
        ))}
        
        <span className={`priority rounded-[7px] px-2 py-1 font-extrabold capitalize ${
          brief.priority === 'Low' ? 'bg-ok-bg text-ok' : 
          brief.priority === 'Urgent' ? 'bg-danger-bg text-danger' : 
          'bg-panel-2 text-text'
        }`}>
          {brief.priority}
        </span>
        
        <span>{user?.name || "Unknown User"}</span>
      </div>
      <div className="card-actions flex flex-wrap gap-2 mt-3">
        <button className="btn ghost h-[38px] px-3 py-2 rounded-[7px] bg-transparent border border-line text-sm text-text">Open brief</button>
      </div>
    </article>
  );
}
