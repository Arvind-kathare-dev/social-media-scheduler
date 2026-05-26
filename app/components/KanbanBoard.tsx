"use client";

import { useScheduler } from "../context/SchedulerContext";
import TaskCard from "./TaskCard";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Clock, AlertCircle, PlayCircle, Send } from "lucide-react";

export default function KanbanBoard({ title, isAssignedToMe = false }: any) {
  const { store, updateStore, currentUser, users } = useScheduler();
  
  const briefs = isAssignedToMe 
    ? store.briefs.filter((b: any) => {
        if (b.assignedToMulti && Array.isArray(b.assignedToMulti) && b.assignedToMulti.length > 0) {
          return b.assignedToMulti.some((id: any) => String(id) === String(currentUser.id));
        }
        if (b.assignedTo) {
          return String(b.assignedTo) === String(currentUser.id);
        }
        return false;
      })
    : store.briefs;

  const searchParams = useSearchParams();
  const router = useRouter();
  const [autoOpenTaskId, setAutoOpenTaskId] = useState<string | null>(null);

  useEffect(() => {
    const tid = searchParams.get("taskId");
    if (tid && briefs.length > 0) {
      setAutoOpenTaskId(tid);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, briefs]);

  const cols = [
    { id: "todo", title: "To Do", icon: <CheckCircle2 size={16} />, color: "text-muted" },
    { id: "in_progress", title: "In Progress", icon: <PlayCircle size={16} />, color: "text-primary" },
    { id: "revision", title: "Needs Revision", icon: <AlertCircle size={16} />, color: "text-warning" },
    { id: "uploaded", title: "Completed (Pending)", icon: <Send size={16} />, color: "text-ok" }
  ];

  const handleDragStart = (e: any, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "var(--panel)";
    e.currentTarget.style.borderColor = "var(--primary)";
  };

  const handleDragLeave = (e: any) => {
    e.currentTarget.style.backgroundColor = "transparent";
    e.currentTarget.style.borderColor = "var(--line)";
  };

  const handleDrop = async (e: any, status: string) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "transparent";
    e.currentTarget.style.borderColor = "var(--line)";
    
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    
    const task = store.briefs.find((b: any) => b.id === id);
    if (task?.status === status) return; // No change

    // Optimistic UI update
    updateStore((prev: any) => ({
      ...prev,
      briefs: prev.briefs.map((b: any) => b.id === id ? { ...b, status } : b)
    }));

    if (status === "uploaded") {
      toast.success("Task sent to Admin for review!");
    } else {
      toast.success(`Task moved to ${cols.find(c => c.id === status)?.title}`);
    }

    // Update backend
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/tasks/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update on server");
    } catch (err) {
      console.error("Failed to update task status", err);
      toast.error("Failed to sync with server. Please refresh.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="page-title mb-6">
        <h1 className="text-3xl font-extrabold m-0 text-text tracking-tight">{title}</h1>
        <p className="text-muted text-sm mt-2">
          Drag and drop tasks across columns to update their progress. Moving a task to "Ready for Review" will send it to the Admin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-2 items-start flex-1 min-h-[500px]">
        {cols.map(col => {
          const colBriefs = briefs.filter((b: any) => b.status === col.id);
          return (
            <div 
              key={col.id} 
              className="kanban-col bg-panel-2/30 border border-line rounded-2xl p-4 min-h-[420px] transition-all flex flex-col"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex justify-between items-center mb-4">
                <div className={`flex items-center gap-2 font-bold ${col.color}`}>
                  {col.icon}
                  <span className="text-text">{col.title}</span>
                </div>
                <span className="text-xs font-bold bg-panel text-text px-2.5 py-1 rounded-md border border-line shadow-sm">
                  {colBriefs.length}
                </span>
              </div>
              
              <div className="flex flex-col gap-3 flex-1">
                {colBriefs.map((brief: any) => {
                  const creator = users.find((u: any) => u.id === brief.createdBy);
                  return (
                    <div 
                      key={brief.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, brief.id)}
                      className="cursor-grab active:cursor-grabbing hover:-translate-y-0.5 transition-transform"
                    >
                      <TaskCard brief={brief} user={creator} autoOpen={String(brief.id) === autoOpenTaskId} />
                    </div>
                  );
                })}
                
                {colBriefs.length === 0 && (
                  <div className="h-full flex-1 flex flex-col items-center justify-center text-center text-muted border-2 border-dashed border-line/50 rounded-xl p-6 bg-panel/30">
                    <span className="text-sm font-medium">Drop tasks here</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
