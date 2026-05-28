"use client";

import { useScheduler } from "../context/SchedulerContext";
import TaskCard from "../components/TaskCard";
import {
  CheckCircle2, Clock, AlertCircle, ListTodo,
  ArrowRight, Users, LayoutDashboard, Calendar, Sparkles
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { store, currentUser, users } = useScheduler();

  // Task Collections
  const tasks = store.briefs || [];
  const todoTasks = tasks.filter((t: any) => t.status === "todo");
  const inProgressTasks = tasks.filter((t: any) => t.status === "in_progress" || t.status === "revision");
  const reviewTasks = tasks.filter((t: any) => t.status === "uploaded");
  const completedTasks = tasks.filter((t: any) => t.status === "approved" || t.status === "completed");

  const myTasks = tasks.filter((t: any) => {
    const multi = Array.isArray(t.assignedToMulti) ? t.assignedToMulti.map(String) : [];
    return String(t.assignedTo) === String(currentUser.id) || multi.includes(String(currentUser.id));
  });
  const myActiveTasks = myTasks.filter((t: any) => t.status !== "approved" && t.status !== "completed");
  const myUrgentTasks = myActiveTasks.filter((t: any) => t.priority === "Urgent" || t.priority === "high");

  // Team Workload (for admins)
  const isAdmin = currentUser.role === "admin";
  const workload = users.map((u: any) => ({
    user: u,
    taskCount: tasks.filter((t: any) => {
      const multi = Array.isArray(t.assignedToMulti) ? t.assignedToMulti.map(String) : [];
      const assigned = String(t.assignedTo) === String(u.id) || multi.includes(String(u.id));
      return assigned && t.status !== "approved" && t.status !== "completed";
    }).length
  })).filter(w => w.taskCount > 0).sort((a, b) => b.taskCount - a.taskCount).slice(0, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="w-full mx-auto min-h-full flex flex-col gap-8 px-2 md:px-6 pb-16">

      {/* Welcome Banner */}
      <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-panel p-5 sm:p-8 rounded-3xl border border-line shadow-sm relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 w-full lg:w-auto flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-extrabold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-md">{currentUser.role} Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black m-0 text-text tracking-tight flex flex-wrap items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-primary/10 rounded-2xl text-primary shrink-0">
              <Sparkles size={24} className="fill-primary/20" />
            </div>
            <span className="truncate max-w-full">{getGreeting()}, {currentUser.name.split(" ")[0]}!</span>
          </h1>
          <p className="text-muted text-sm mt-3 max-w-xl font-medium leading-relaxed">
            {isAdmin
              ? `You have ${reviewTasks.length} tasks waiting for review across the team.`
              : `You have ${myActiveTasks.length} active tasks assigned to you right now.`}
          </p>
        </div>

        {/* Quick Progress Ring */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
          <div className="flex items-center gap-4 bg-panel-2 p-4 rounded-2xl border border-line shadow-sm shrink-0 w-full sm:w-auto">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path strokeDasharray="100" strokeDashoffset="0" className="stroke-line" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path strokeDasharray="100" strokeDashoffset={100 - progressPercentage} className="stroke-primary transition-all duration-1000 ease-out" strokeWidth="3" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span className="absolute text-sm font-bold text-text">{progressPercentage}%</span>
            </div>
            <div>
              <div className="text-sm font-bold text-text">Project Progress</div>
              <div className="text-xs text-muted mt-0.5">{completedTasks.length} of {tasks.length} tasks done</div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tasks */}
        <div className="bg-panel border border-line rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg relative overflow-hidden group cursor-default">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-[2.5] transition-transform duration-700 ease-out"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <LayoutDashboard size={22} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">Total</span>
          </div>
          <div className="text-4xl font-black text-text mb-1 relative z-10 tracking-tight">{tasks.length}</div>
          <div className="text-[11px] text-muted font-extrabold uppercase tracking-wider relative z-10">Workspace Tasks</div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-6 hover:border-strong-line transition-all duration-300 hover:shadow-lg relative overflow-hidden group cursor-default">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-muted/5 rounded-full group-hover:scale-[2.5] transition-transform duration-700 ease-out"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-panel-2 flex items-center justify-center text-muted shadow-sm border border-line group-hover:bg-muted group-hover:text-white transition-colors duration-300">
              <ListTodo size={22} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted bg-panel-2 px-2.5 py-1 rounded-lg border border-line">To Do</span>
          </div>
          <div className="text-4xl font-black text-text mb-1 relative z-10 tracking-tight">{todoTasks.length}</div>
          <div className="text-[11px] text-muted font-extrabold uppercase tracking-wider relative z-10">Not Started Yet</div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-6 hover:border-[#0ea5e9]/30 transition-all duration-300 hover:shadow-lg relative overflow-hidden group cursor-default">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#0ea5e9]/5 rounded-full group-hover:scale-[2.5] transition-transform duration-700 ease-out"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9] shadow-sm border border-[#0ea5e9]/20 group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors duration-300">
              <Clock size={22} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0ea5e9] bg-[#0ea5e9]/10 px-2.5 py-1 rounded-lg border border-[#0ea5e9]/20">Active</span>
          </div>
          <div className="text-4xl font-black text-text mb-1 relative z-10 tracking-tight">{inProgressTasks.length}</div>
          <div className="text-[11px] text-[#0ea5e9] font-extrabold uppercase tracking-wider relative z-10 opacity-80">In Progress</div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-6 hover:border-warning/30 transition-all duration-300 hover:shadow-lg relative overflow-hidden group cursor-default">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-warning/5 rounded-full group-hover:scale-[2.5] transition-transform duration-700 ease-out"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center text-warning shadow-sm border border-warning/20 group-hover:bg-warning group-hover:text-white transition-colors duration-300">
              <AlertCircle size={22} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-warning bg-warning/10 px-2.5 py-1 rounded-lg border border-warning/20">Review</span>
          </div>
          <div className="text-4xl font-black text-text mb-1 relative z-10 tracking-tight">{reviewTasks.length}</div>
          <div className="text-[11px] text-warning font-extrabold uppercase tracking-wider relative z-10 opacity-80">Pending Approval</div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-6 hover:border-ok/30 transition-all duration-300 hover:shadow-lg relative overflow-hidden group cursor-default">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-ok/5 rounded-full group-hover:scale-[2.5] transition-transform duration-700 ease-out"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-ok/10 flex items-center justify-center text-ok shadow-sm border border-ok/20 group-hover:bg-ok group-hover:text-white transition-colors duration-300">
              <CheckCircle2 size={22} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-ok bg-ok/10 px-2.5 py-1 rounded-lg border border-ok/20">Done</span>
          </div>
          <div className="text-4xl font-black text-text mb-1 relative z-10 tracking-tight">{completedTasks.length}</div>
          <div className="text-[11px] text-ok font-extrabold uppercase tracking-wider relative z-10 opacity-80">Completed Tasks</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Tasks Feed */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Urgent / Priority Focus */}
          {myUrgentTasks.length > 0 && (
            <div className="bg-danger/5 border border-danger/20 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-danger/10 to-transparent rounded-bl-full pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-6 text-danger relative z-10">
                <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center text-danger border border-danger/20 shadow-sm">
                  <AlertCircle size={20} />
                </div>
                <h2 className="text-xl font-extrabold m-0 tracking-tight">Your Priority Focus</h2>
              </div>
              <div className="flex flex-col gap-3 relative z-10">
                {myUrgentTasks.slice(0, 3).map((task: any) => {
                  const creator = users.find((u: any) => u.id === task.createdBy);
                  return <TaskCard key={task.id} brief={task} user={creator} />;
                })}
              </div>
            </div>
          )}

          {/* Recent/Assigned Tasks */}
          <div className="bg-panel border border-line rounded-2xl p-6 md:p-8 flex-1 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-panel-2 flex items-center justify-center text-muted border border-line shadow-sm">
                  <LayoutDashboard size={20} />
                </div>
                <h2 className="text-xl font-extrabold m-0 tracking-tight text-text">
                  {isAdmin ? "Recent Project Activity" : "My Upcoming Tasks"}
                </h2>
              </div>
              <Link href={isAdmin ? "/tasks" : "/my-tasks"} className="text-xs font-bold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 transition-colors hover:bg-primary/10 flex items-center gap-1">
                View Board <ArrowRight size={14} />
              </Link>
            </div>

            {isAdmin ? (
              <div className="flex flex-col gap-3 relative z-10">
                {tasks.slice(0, 4).map((task: any) => {
                  const creator = users.find((u: any) => u.id === task.createdBy);
                  return <TaskCard key={task.id} brief={task} user={creator} />;
                })}
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-muted text-sm border border-dashed border-line rounded-lg">No tasks in the system yet.</div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myActiveTasks.slice(0, 4).map((task: any) => {
                  const creator = users.find((u: any) => u.id === task.createdBy);
                  return <TaskCard key={task.id} brief={task} user={creator} />;
                })}
                {myActiveTasks.length === 0 && (
                  <div className="text-center py-10 flex flex-col items-center gap-3 border border-dashed border-line rounded-lg">
                    <div className="w-12 h-12 bg-ok/10 text-ok rounded-full flex items-center justify-center">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <strong className="block text-text mb-1">You're all caught up!</strong>
                      <span className="text-muted text-sm">No active tasks assigned to you.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="flex flex-col gap-6">

          {/* Admin Team Workload */}
          {isAdmin && (
            <div className="bg-panel border border-line rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-panel-2 flex items-center justify-center text-muted border border-line shadow-sm">
                  <Users size={20} />
                </div>
                <h2 className="text-xl font-extrabold m-0 tracking-tight text-text">Team Workload</h2>
              </div>

              {workload.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {workload.map((w, idx) => (
                    <div key={idx} className="flex items-center justify-between group hover:bg-panel-2 p-3 -mx-3 rounded-xl transition-colors cursor-default">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-panel group-hover:ring-panel-2 transition-all">
                          {w.user.avatar || w.user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[15px] font-bold text-text group-hover:text-primary transition-colors">{w.user.name}</div>
                          <div className="text-[11px] font-extrabold text-muted uppercase tracking-wider">{w.user.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-text">{w.taskCount}</span>
                        <span className="text-[10px] uppercase font-extrabold text-muted bg-panel-2 group-hover:bg-panel px-2.5 py-1 rounded-md border border-line transition-colors">Tasks</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted text-sm font-bold bg-panel-2 rounded-xl border border-dashed border-line">
                  No active tasks assigned.
                </div>
              )}
            </div>
          )}

          {/* Developer Tasks Pending Review (For Admin) */}
          {isAdmin && (
            <div className="bg-panel border border-line rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-warning/10 to-transparent rounded-bl-full pointer-events-none"></div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3 text-warning">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning border border-warning/20 shadow-sm">
                    <AlertCircle size={20} />
                  </div>
                  <h2 className="text-xl font-extrabold m-0 tracking-tight text-text">Pending Review</h2>
                </div>
                <Link href="/review" className="text-xs font-bold text-warning hover:underline bg-warning/5 px-3 py-1.5 rounded-lg border border-warning/20 transition-colors hover:bg-warning/10">View All</Link>
              </div>

              <div className="flex flex-col gap-4 relative z-10">
                {reviewTasks.length > 0 ? (
                  reviewTasks.slice(0, 4).map((task: any) => {
                    const multiAssignees = Array.isArray(task.assignedToMulti) && task.assignedToMulti.length > 0
                      ? task.assignedToMulti.map(String)
                      : (task.assignedTo ? [String(task.assignedTo)] : []);
                    const assignees = multiAssignees.map((id: string) => users.find((u: any) => String(u.id) === id)).filter(Boolean);

                    return (
                      <div key={task.id} className="p-4 bg-panel border border-line rounded-xl flex flex-col gap-3 relative hover:border-warning/40 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-text pr-4 leading-snug group-hover:text-warning transition-colors">{task.title}</h4>
                          <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-warning mt-1 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-extrabold text-muted uppercase tracking-wider">
                            <div className="flex -space-x-1.5">
                              {assignees.map((a: any, idx: number) => (
                                <div key={idx} className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[9px] shadow-sm shrink-0 ring-2 ring-panel z-10" style={{ zIndex: 10 - idx }} title={a.name}>
                                  {a.avatar || a.name.charAt(0)}
                                </div>
                              ))}
                              {assignees.length === 0 && (
                                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[9px] shadow-sm shrink-0">U</div>
                              )}
                            </div>
                            <span className="truncate max-w-[100px]">
                              {assignees.length > 0 ? assignees.map((a: any) => a.name.split(" ")[0]).join(", ") : "Unassigned"}
                            </span>
                          </div>
                          <Link href="/review" className="text-[10px] font-extrabold text-text bg-panel-2 border border-line px-3 py-1.5 rounded-lg shadow-sm hover:border-warning/50 hover:bg-warning/5 hover:text-warning transition-all">
                            Review
                          </Link>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-muted text-sm font-bold bg-panel-2 rounded-xl border border-dashed border-line">
                    No tasks completed by team yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Up Next / Upcoming Calendar */}
          <div className="bg-panel border border-line rounded-2xl p-6 md:p-8 flex-1 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-panel-2 flex items-center justify-center text-muted border border-line shadow-sm">
                  <Calendar size={20} />
                </div>
                <h2 className="text-xl font-extrabold m-0 tracking-tight text-text">Up Next</h2>
              </div>
            </div>

            <div className="relative border-l-2 border-line/50 ml-4 pl-6 py-2 flex flex-col gap-8">
              {myActiveTasks.filter((t: any) => t.dueDate).slice(0, 3).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((task: any) => (
                <div key={task.id} className="relative group cursor-default">
                  <div className="absolute -left-[33px] top-1 w-3.5 h-3.5 rounded-full bg-panel border-[3px] border-primary ring-4 ring-primary/10 group-hover:ring-primary/30 group-hover:scale-110 transition-all"></div>
                  <div className="text-xs font-black text-primary mb-1.5 uppercase tracking-widest bg-primary/10 inline-block px-2 py-0.5 rounded-md border border-primary/20">
                    {new Date(`${task.dueDate}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </div>
                  <div className="text-[15px] font-bold text-text leading-snug group-hover:text-primary transition-colors">{task.title}</div>
                  <div className="text-[10px] text-muted font-extrabold mt-1.5 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted"></span>
                    {task.status.replace("_", " ")}
                  </div>
                </div>
              ))}
              {myActiveTasks.filter((t: any) => t.dueDate).length === 0 && (
                <div className="text-sm font-bold text-muted bg-panel-2 p-4 rounded-xl border border-dashed border-line text-center">No upcoming deadlines.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
