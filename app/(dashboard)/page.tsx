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
    <div className="w-full mx-auto h-full flex flex-col gap-8 px-6 pb-10">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-panel to-panel border border-primary/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-primary" />
            <span className="text-sm font-extrabold text-primary uppercase tracking-widest">{currentUser.role} Workspace</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text tracking-tight mb-2">
            {getGreeting()}, {currentUser.name.split(" ")[0]}!
          </h1>
          <p className="text-muted text-base max-w-2xl">
            {isAdmin
              ? `You have ${reviewTasks.length} tasks waiting for review across the team.`
              : `You have ${myActiveTasks.length} active tasks assigned to you right now.`}
          </p>
        </div>

        {/* Quick Progress Ring */}
        <div className="flex items-center gap-4 bg-panel p-4 rounded-xl border border-line shadow-sm shrink-0">
          <div className="relative w-16 h-16 flex items-center justify-center">
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

      {/* Global Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-panel border border-line rounded-xl p-5 hover:border-strong-line transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-panel-2 flex items-center justify-center text-muted">
              <ListTodo size={20} />
            </div>
            <span className="text-xs font-bold text-muted bg-panel-2 px-2 py-1 rounded">To Do</span>
          </div>
          <div className="text-3xl font-black text-text mb-1">{todoTasks.length}</div>
          <div className="text-xs text-muted font-medium">Not started yet</div>
        </div>

        <div className="bg-panel border border-line rounded-xl p-5 hover:border-strong-line transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Clock size={20} />
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Active</span>
          </div>
          <div className="text-3xl font-black text-text mb-1">{inProgressTasks.length}</div>
          <div className="text-xs text-muted font-medium">Currently in progress</div>
        </div>

        <div className="bg-panel border border-line rounded-xl p-5 hover:border-strong-line transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
              <AlertCircle size={20} />
            </div>
            <span className="text-xs font-bold text-warning bg-warning/10 px-2 py-1 rounded">Review</span>
          </div>
          <div className="text-3xl font-black text-text mb-1">{reviewTasks.length}</div>
          <div className="text-xs text-muted font-medium">Pending approval</div>
        </div>

        <div className="bg-panel border border-line rounded-xl p-5 hover:border-strong-line transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-ok/10 flex items-center justify-center text-ok">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-bold text-ok bg-ok/10 px-2 py-1 rounded">Done</span>
          </div>
          <div className="text-3xl font-black text-text mb-1">{completedTasks.length}</div>
          <div className="text-xs text-muted font-medium">Completed tasks</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Tasks Feed */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Urgent / Priority Focus */}
          {myUrgentTasks.length > 0 && (
            <div className="bg-danger/5 border border-danger/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 text-danger">
                <AlertCircle size={20} />
                <h2 className="text-lg font-bold m-0 tracking-tight">Your Priority Focus</h2>
              </div>
              <div className="flex flex-col gap-3">
                {myUrgentTasks.slice(0, 3).map((task: any) => {
                  const creator = users.find((u: any) => u.id === task.createdBy);
                  return <TaskCard key={task.id} brief={task} user={creator} />;
                })}
              </div>
            </div>
          )}

          {/* Recent/Assigned Tasks */}
          <div className="bg-panel border border-line rounded-xl p-6 flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <LayoutDashboard size={20} className="text-muted" />
                <h2 className="text-lg font-bold m-0 tracking-tight text-text">
                  {isAdmin ? "Recent Project Activity" : "My Upcoming Tasks"}
                </h2>
              </div>
              <Link href="/my-tasks" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                View Board <ArrowRight size={14} />
              </Link>
            </div>

            {isAdmin ? (
              <div className="flex flex-col gap-3">
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
            <div className="bg-panel border border-line rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users size={20} className="text-muted" />
                <h2 className="text-lg font-bold m-0 tracking-tight text-text">Team Workload</h2>
              </div>

              {workload.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {workload.map((w, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {w.user.avatar || w.user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-text">{w.user.name}</div>
                          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">{w.user.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-black text-text">{w.taskCount}</span>
                        <span className="text-[10px] uppercase font-bold text-muted">Tasks</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted text-sm border border-dashed border-line rounded-lg">
                  No active tasks assigned.
                </div>
              )}
            </div>
          )}

          {/* Developer Tasks Pending Review (For Admin) */}
          {isAdmin && (
            <div className="bg-panel border border-line rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-warning">
                  <AlertCircle size={20} />
                  <h2 className="text-lg font-bold m-0 tracking-tight text-text">Pending Review</h2>
                </div>
                <Link href="/review" className="text-xs font-bold text-primary hover:underline">View All</Link>
              </div>

              <div className="flex flex-col gap-4">
                {reviewTasks.length > 0 ? (
                  reviewTasks.slice(0, 4).map((task: any) => {
                    const multiAssignees = Array.isArray(task.assignedToMulti) && task.assignedToMulti.length > 0
                      ? task.assignedToMulti.map(String)
                      : (task.assignedTo ? [String(task.assignedTo)] : []);
                    const assignees = multiAssignees.map((id: string) => users.find((u: any) => String(u.id) === id)).filter(Boolean);
                    
                    return (
                      <div key={task.id} className="p-3 bg-panel-2 border border-line rounded-lg flex flex-col gap-2 relative">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-text pr-4 leading-tight">{task.title}</h4>
                          <span className="shrink-0 w-2 h-2 rounded-full bg-warning mt-1"></span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-wider">
                            <div className="flex -space-x-1.5">
                              {assignees.map((a: any, idx: number) => (
                                <div key={idx} className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[8px] shadow-sm shrink-0 ring-1 ring-panel z-10" style={{ zIndex: 10 - idx }} title={a.name}>
                                  {a.avatar || a.name.charAt(0)}
                                </div>
                              ))}
                              {assignees.length === 0 && (
                                <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[8px] shadow-sm shrink-0">U</div>
                              )}
                            </div>
                            <span className="truncate">
                              {assignees.length > 0 ? assignees.map((a: any) => a.name.split(" ")[0]).join(", ") : "Unassigned"}
                            </span>
                          </div>
                          <Link href="/review" className="text-[10px] font-bold text-text bg-panel border border-line px-2 py-1 rounded shadow-sm hover:border-primary transition-colors">
                            Review
                          </Link>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-6 text-muted text-sm border border-dashed border-line rounded-lg">
                    No tasks completed by team yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Up Next / Upcoming Calendar */}
          <div className="bg-panel border border-line rounded-xl p-6 flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-muted" />
                <h2 className="text-lg font-bold m-0 tracking-tight text-text">Up Next</h2>
              </div>
            </div>

            <div className="relative border-l-2 border-line/50 ml-3 pl-5 py-2 flex flex-col gap-6">
              {myActiveTasks.filter((t: any) => t.dueDate).slice(0, 3).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((task: any) => (
                <div key={task.id} className="relative">
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-panel ring-2 ring-primary/20"></div>
                  <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">
                    {new Date(`${task.dueDate}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </div>
                  <div className="text-sm font-bold text-text leading-tight">{task.title}</div>
                  <div className="text-[11px] text-muted font-medium mt-1 uppercase tracking-wider">{task.status.replace("_", " ")}</div>
                </div>
              ))}
              {myActiveTasks.filter((t: any) => t.dueDate).length === 0 && (
                <div className="text-sm text-muted">No upcoming deadlines.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
