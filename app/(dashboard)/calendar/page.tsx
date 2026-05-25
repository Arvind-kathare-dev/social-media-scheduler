"use client";

import { useState, useMemo } from "react";
import { useScheduler } from "../../context/SchedulerContext";
import { Calendar as CalendarIcon, List, Filter, ChevronLeft, ChevronRight, User, ExternalLink, Clock, AlertCircle, X, CheckCircle2 } from "lucide-react";
import SlideOver from "../../components/SlideOver";

export default function CalendarPage() {
  const { store, currentUser, users } = useScheduler();
  const [view, setView] = useState<"Month" | "Agenda">("Month");
  
  // Date states
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Role-based filtering
  const isAdmin = currentUser.role === "admin";
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  
  // Modal state
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Filter tasks based on role and selected filter
  const calendarTasks = useMemo(() => {
    let tasks = store.briefs || [];
    
    if (!isAdmin) {
      // Non-admins only see their own tasks
      tasks = tasks.filter((t: any) => t.assignedTo === currentUser.id);
    } else if (selectedUserFilter !== "all") {
      // Admins can filter by specific user
      tasks = tasks.filter((t: any) => t.assignedTo === selectedUserFilter);
    }
    
    return tasks;
  }, [store.briefs, isAdmin, currentUser.id, selectedUserFilter]);

  // Calendar generation
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null); // padding
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDayEvents = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarTasks.filter((b: any) => b.dueDate === dateStr);
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo": return "bg-panel-2 border-line text-muted";
      case "in_progress": return "bg-primary/10 border-primary/20 text-primary";
      case "revision": return "bg-warning/10 border-warning/30 text-warning";
      case "uploaded": return "bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-[#8b5cf6]"; // Purple for Review
      case "approved": 
      case "completed": return "bg-ok/10 border-ok/30 text-ok";
      default: return "bg-panel-2 border-line text-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case "in_progress": return "In Progress";
      case "uploaded": return "In Review";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Agenda view sorting
  const agendaTasks = [...calendarTasks].filter(t => t.dueDate).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full pb-6">
      
      {/* Header */}
      <div className="page-title mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold m-0 text-text tracking-tight flex items-center gap-3">
            <CalendarIcon className="text-primary" size={28} />
            Schedule
          </h1>
          <p className="text-muted text-sm mt-2 max-w-xl">
            {isAdmin 
              ? "Manage and track all upcoming deadlines across the team." 
              : "Keep track of your upcoming deadlines and project schedule."}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          
          {/* Admin Filter */}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-panel border border-line rounded-lg p-1">
              <Filter size={16} className="text-muted ml-2" />
              <select 
                value={selectedUserFilter} 
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-transparent border-none text-sm font-medium outline-none text-text py-1 pr-2"
              >
                <option value="all">All Team Members</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex bg-panel-2 rounded-lg p-1 border border-line">
            <button 
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${view === 'Month' ? 'bg-panel shadow-sm text-text border border-line' : 'text-muted hover:text-text border border-transparent'}`}
              onClick={() => setView('Month')}
            >
              <CalendarIcon size={16} /> Month
            </button>
            <button 
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${view === 'Agenda' ? 'bg-panel shadow-sm text-text border border-line' : 'text-muted hover:text-text border border-transparent'}`}
              onClick={() => setView('Agenda')}
            >
              <List size={16} /> Agenda
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-panel border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Calendar Controls */}
        {view === 'Month' && (
          <div className="p-5 border-b border-line flex justify-between items-center bg-panel-2/30">
            <h2 className="text-xl font-bold m-0 text-text tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="btn ghost h-9 w-9 p-0 flex items-center justify-center rounded-lg border border-line hover:bg-panel-2 hover:border-strong-line transition-all">
                <ChevronLeft size={18} />
              </button>
              <button onClick={handleToday} className="btn ghost h-9 px-4 text-sm font-bold rounded-lg border border-line hover:bg-panel-2 hover:border-strong-line transition-all">
                Today
              </button>
              <button onClick={handleNextMonth} className="btn ghost h-9 w-9 p-0 flex items-center justify-center rounded-lg border border-line hover:bg-panel-2 hover:border-strong-line transition-all">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Month View */}
        {view === 'Month' ? (
          <div className="grid grid-cols-7 flex-1 bg-line/20">
            {weekdays.map(d => (
              <div key={d} className="p-3 font-extrabold text-muted text-xs uppercase tracking-widest bg-panel-2 border-b border-line text-center">
                {d}
              </div>
            ))}
            
            {days.map((day, i) => {
              const events = getDayEvents(day);
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              
              return (
                <div key={i} className={`min-h-[140px] p-2 bg-panel border-b border-r border-line/50 transition-colors ${!day ? 'bg-panel-2/30' : 'hover:bg-panel-2/10'}`}>
                  {day && (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20' : 'text-text'}`}>
                          {day}
                        </div>
                        {events.length > 0 && <div className="text-[10px] font-bold text-muted bg-panel-2 px-1.5 py-0.5 rounded">{events.length}</div>}
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        {events.map(ev => {
                          const assignee = users.find((u: any) => u.id === ev.assignedTo);
                          return (
                            <div 
                              key={ev.id} 
                              onClick={() => setSelectedTask(ev)}
                              className={`group relative overflow-hidden text-[11px] font-semibold p-2 pl-3 border rounded-lg cursor-pointer hover:shadow-sm transition-all flex flex-col gap-1 ${getStatusColor(ev.status)}`}
                            >
                              <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-70 ${
                                ev.priority === 'Urgent' ? 'bg-danger' : ev.priority === 'Low' ? 'bg-ok' : 'bg-primary'
                              }`}></div>
                              <span className="truncate block leading-tight text-text group-hover:text-primary transition-colors">{ev.title}</span>
                              {isAdmin && assignee && (
                                <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold opacity-70 mt-0.5">
                                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[7px] shadow-sm shrink-0">
                                    {assignee.avatar || assignee.name.charAt(0)}
                                  </div>
                                  {assignee.name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Agenda / List View */
          <div className="flex-1 overflow-auto bg-panel-2/30 p-6">
            {agendaTasks.length > 0 ? (
              <div className="max-w-4xl mx-auto flex flex-col gap-5">
                {agendaTasks.map(task => {
                  const assignee = users.find((u: any) => u.id === task.assignedTo);
                  const isOverdue = new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0)) && task.status !== "approved";
                  
                  // Same platformMeta used in Review/Board pages for colored chips
                  const platformMeta: any = {
                    "Instagram Feed": { color: "var(--ig)", icon: "IG" },
                    "Instagram Story/Reel": { color: "var(--ig)", icon: "IR" },
                    Facebook: { color: "var(--fb)", icon: "FB" },
                    "X (Twitter)": { color: "var(--x)", icon: "X" },
                    LinkedIn: { color: "var(--li)", icon: "IN" },
                    Pinterest: { color: "var(--pin)", icon: "P" },
                    "YouTube Shorts": { color: "var(--yt)", icon: "YT" },
                  };

                  return (
                    <div 
                      key={task.id} 
                      onClick={() => setSelectedTask(task)}
                      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 rounded-2xl border cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 overflow-hidden ${
                        isOverdue ? 'bg-danger/5 border-danger/30' : 'bg-panel border-line hover:border-strong-line'
                      }`}
                    >
                      {/* Left Priority Strip */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        task.priority === 'Urgent' ? 'bg-danger' : task.priority === 'Low' ? 'bg-ok' : 'bg-primary'
                      }`}></div>

                      <div className="flex items-center gap-5 pl-2">
                        {/* Date Block */}
                        <div className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl shadow-sm border shrink-0 ${
                          isOverdue ? 'bg-danger text-white border-danger' : 'bg-panel-2 text-text border-line'
                        }`}>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80 leading-none mb-1">
                            {new Date(task.dueDate).toLocaleString('default', { month: 'short' })}
                          </span>
                          <span className="text-xl font-black leading-none">
                            {new Date(task.dueDate).getDate()}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="font-extrabold text-text text-base m-0 tracking-tight group-hover:text-primary transition-colors">{task.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                            <span className={`font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider text-[10px] ${getStatusColor(task.status)}`}>
                              {getStatusLabel(task.status)}
                            </span>
                            
                            {isAdmin && assignee && (
                              <span className="flex items-center gap-1.5 text-muted font-bold text-[11px] uppercase tracking-wider">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[8px] shadow-sm shrink-0">
                                  {assignee.avatar || assignee.name.charAt(0)}
                                </div>
                                {assignee.name}
                              </span>
                            )}
                            
                            {task.priority === "Urgent" && (
                              <span className="flex items-center gap-1 text-danger font-extrabold text-[11px] uppercase tracking-wider">
                                <AlertCircle size={12} strokeWidth={3} /> Urgent
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Side: Platforms */}
                      <div className="flex flex-wrap items-center gap-1.5 pl-[84px] sm:pl-0">
                        {task.platforms?.map((p: string) => (
                          <span 
                            key={p} 
                            className="text-[10px] font-bold text-white px-2 py-1 rounded shadow-sm flex items-center gap-1"
                            style={{ background: platformMeta[p]?.color || "var(--primary)" }}
                          >
                            {platformMeta[p]?.icon || p} <span className="hidden md:inline ml-0.5">{p}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted">
                <div className="w-16 h-16 bg-panel-2 rounded-full flex items-center justify-center mb-4 border border-line">
                  <CalendarIcon size={24} className="opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-text mb-1">No upcoming tasks</h3>
                <p className="text-sm">There are no deadlines scheduled in the system.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Details SlideOver (Asana Style) */}
      <SlideOver 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        width="max-w-[800px] w-full"
      >
        {selectedTask && (
          <div className="flex flex-col h-full bg-panel">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-sm font-semibold text-muted hover:bg-panel-2 transition-colors">
                  <CheckCircle2 size={16} /> Mark complete
                </button>
              </div>
              <div className="flex items-center gap-2">
                {users.find((u: any) => u.id === selectedTask.assignedTo) && (
                  <div className="flex items-center gap-2 mr-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      {users.find((u: any) => u.id === selectedTask.assignedTo)?.avatar || "U"}
                    </div>
                    <button className="px-3 py-1.5 rounded-md border border-line text-sm font-semibold text-text hover:bg-panel-2 transition-colors">
                      Share
                    </button>
                  </div>
                )}
                <div className="w-[1px] h-6 bg-line mx-1"></div>
                <button onClick={() => setSelectedTask(null)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-panel-2 text-muted hover:text-text transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 md:p-8 max-w-[700px]">
                <h1 className="text-3xl font-black text-text mb-8 tracking-tight flex items-start gap-3">
                  {selectedTask.title}
                </h1>

                {/* Properties Grid */}
                <div className="grid grid-cols-[140px_1fr] gap-y-4 mb-8 text-sm">
                  {/* Assignee */}
                  <div className="text-muted font-medium flex items-center h-8">Assignee</div>
                  <div className="flex items-center h-8">
                    <div className="flex items-center gap-2 px-2 -ml-2 rounded hover:bg-panel-2 cursor-pointer transition-colors">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        {users.find((u: any) => u.id === selectedTask.assignedTo)?.avatar || "U"}
                      </div>
                      <span className="font-semibold text-text">{users.find((u: any) => u.id === selectedTask.assignedTo)?.name || "Unassigned"}</span>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="text-muted font-medium flex items-center h-8">Due date</div>
                  <div className="flex items-center h-8">
                    <div className="flex items-center gap-2 px-2 -ml-2 rounded hover:bg-panel-2 cursor-pointer transition-colors font-semibold text-text">
                      <Clock size={16} className="text-muted" />
                      {new Date(selectedTask.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="text-muted font-medium flex items-center h-8">Priority</div>
                  <div className="flex items-center h-8">
                    <span className={`px-2 py-1 rounded-[5px] text-[11px] font-extrabold uppercase tracking-wider ${
                      selectedTask.priority === 'Low' ? 'bg-ok/10 text-ok border border-ok/20' : 
                      selectedTask.priority === 'Urgent' ? 'bg-danger/10 text-danger border border-danger/20' : 
                      'bg-panel-2 text-text border border-line'
                    }`}>
                      {selectedTask.priority}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="text-muted font-medium flex items-center h-8">Status</div>
                  <div className="flex items-center h-8">
                    <span className={`px-2 py-1 rounded-[5px] text-[11px] font-extrabold uppercase tracking-wider border ${getStatusColor(selectedTask.status)}`}>
                      {getStatusLabel(selectedTask.status)}
                    </span>
                  </div>
                </div>

                {/* Description Section */}
                <div className="mb-10">
                  <h3 className="font-bold text-base text-text mb-3">Description</h3>
                  <div className="bg-transparent border border-transparent hover:border-line rounded-lg p-2 -ml-2 transition-colors cursor-text group min-h-[100px]">
                    <p className="text-[15px] text-text whitespace-pre-wrap leading-relaxed m-0 font-medium">
                      {selectedTask.copy || <span className="text-muted">No description provided.</span>}
                    </p>
                  </div>
                </div>

                {/* Platforms & Hashtags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                  <div>
                    <h3 className="font-bold text-base text-text mb-3">Platforms</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTask.platforms?.map((p: string) => (
                        <span key={p} className="text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">{p}</span>
                      ))}
                    </div>
                  </div>
                  
                  {selectedTask.hashtags && selectedTask.hashtags.length > 0 && (
                    <div>
                      <h3 className="font-bold text-base text-text mb-3">Hashtags</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTask.hashtags.map((h: string) => (
                          <span key={h} className="text-[11px] font-bold bg-panel-2 border border-line text-text px-2 py-1 rounded-md">{h}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                {selectedTask.notes && (
                  <div className="mb-10">
                    <h3 className="font-bold text-base text-text mb-3 flex items-center gap-2">
                      Notes <AlertCircle size={14} className="text-warning" />
                    </h3>
                    <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                      <p className="text-[14px] text-text whitespace-pre-wrap leading-relaxed m-0">
                        {selectedTask.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Visual Reference */}
                {selectedTask.visualReference && (
                  <div className="mb-10">
                    <h3 className="font-bold text-base text-text mb-3">Visual Reference</h3>
                    <div className="flex">
                      <a 
                        href={selectedTask.visualReference} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 p-3 rounded-lg border border-line bg-panel-2 hover:bg-line/30 transition-colors max-w-sm"
                      >
                        <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <ExternalLink size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-sm font-bold text-text truncate">View Asset Reference</div>
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SlideOver>

    </div>
  );
}
