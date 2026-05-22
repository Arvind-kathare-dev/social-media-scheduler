"use client";

import { useScheduler } from "../context/SchedulerContext";
import TaskCard from "./TaskCard";

export default function KanbanBoard({ title, isDesignerOnly = false }) {
  const { store, updateStore, currentUser, users } = useScheduler();
  
  const briefs = isDesignerOnly 
    ? store.briefs.filter(b => b.assignedTo === currentUser.id)
    : store.briefs;

  const cols = [
    { id: "todo", title: "To do" },
    { id: "in_progress", title: "In progress" },
    { id: "revision", title: "Revision" },
    { id: "uploaded", title: "Uploaded" }
  ];

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "var(--panel)";
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = "var(--panel-2)";
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "var(--panel-2)";
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    
    updateStore(prev => ({
      ...prev,
      briefs: prev.briefs.map(b => b.id === id ? { ...b, status } : b)
    }));
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="page-title mb-6">
        <h1 className="text-3xl font-extrabold m-0">{title}</h1>
        <p className="text-muted text-sm mt-1">Drag and drop to update progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-2 items-start overflow-x-auto flex-1">
        {cols.map(col => {
          const colBriefs = briefs.filter(b => b.status === col.id);
          return (
            <div 
              key={col.id} 
              className="kanban-col bg-panel-2 border border-line rounded-custom p-3 min-h-[420px] transition-colors"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="kanban-title flex justify-between items-center font-extrabold mb-3 text-text">
                {col.title}
                <span className="text-xs text-muted font-normal bg-panel px-2 py-0.5 rounded-full border border-line">
                  {colBriefs.length}
                </span>
              </div>
              
              <div className="flex flex-col gap-2.5">
                {colBriefs.map(brief => {
                  const creator = users.find(u => u.id === brief.createdBy);
                  return (
                    <div 
                      key={brief.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, brief.id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <TaskCard brief={brief} user={creator} />
                    </div>
                  );
                })}
                {colBriefs.length === 0 && (
                  <div className="text-center text-muted text-sm p-4 border border-dashed border-strong-line rounded-custom">
                    Empty
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
