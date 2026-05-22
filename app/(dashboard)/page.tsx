"use client";

import { useScheduler } from "../context/SchedulerContext";
import TaskCard from "../components/TaskCard";
import { FileText, Clock, CheckCircle, Calendar } from "lucide-react";

export default function DashboardPage() {
  const { store, currentUser, users } = useScheduler();

  const assigned = store.briefs.filter((b) => b.assignedTo === currentUser.id);
  const pendingReviewUploads = store.uploads.filter((u) => u.status === "pending" || u.status === "revision");
  const approvedUploads = store.uploads.filter((u) => u.status === "approved");

  const isDesigner = currentUser.role === "designer";
  const displayBriefs = isDesigner ? assigned : store.briefs.slice(0, 4);

  return (
    <>
      <div className="page-title mb-6 hidden">
        <h1 className="text-3xl font-extrabold m-0 leading-tight">Dashboard</h1>
        <p className="text-muted text-sm mt-1 capitalize">{currentUser.role} workspace</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat bg-panel border border-line rounded-custom p-[18px]">
          <div className="flex justify-between items-start mb-2 text-muted">
            <span className="text-[13px]">Total briefs</span>
            <FileText size={18} />
          </div>
          <strong className="block text-[31px] font-bold">{store.briefs.length}</strong>
        </div>
        <div className="stat bg-panel border border-line rounded-custom p-[18px]">
          <div className="flex justify-between items-start mb-2 text-muted">
            <span className="text-[13px]">Pending review</span>
            <Clock size={18} />
          </div>
          <strong className="block text-[31px] font-bold">{pendingReviewUploads.length}</strong>
        </div>
        <div className="stat bg-panel border border-line rounded-custom p-[18px]">
          <div className="flex justify-between items-start mb-2 text-muted">
            <span className="text-[13px]">Approved posts</span>
            <CheckCircle size={18} />
          </div>
          <strong className="block text-[31px] font-bold">{approvedUploads.length}</strong>
        </div>
        <div className="stat bg-panel border border-line rounded-custom p-[18px]">
          <div className="flex justify-between items-start mb-2 text-muted">
            <span className="text-[13px]">Calendar slots</span>
            <Calendar size={18} />
          </div>
          <strong className="block text-[31px] font-bold">{store.events.length}</strong>
        </div>
      </div>

      <div className="section bg-panel border border-line rounded-custom p-[18px]">
        <div className="section-head flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold m-0">{isDesigner ? "Assigned work" : "Recent briefs"}</h2>
        </div>
        
        {displayBriefs.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {displayBriefs.map((brief) => {
              const creator = users.find(u => u.id === brief.createdBy);
              return <TaskCard key={brief.id} brief={brief} user={creator} />;
            })}
          </div>
        ) : (
          <div className="empty min-h-[160px] grid place-items-center text-center text-muted border border-dashed border-strong-line rounded-custom p-5 bg-panel">
            No briefs yet.
          </div>
        )}
      </div>
    </>
  );
}
