"use client";

import { useState, useMemo } from "react";
import { useScheduler } from "../../context/SchedulerContext";
import { Lock, BarChart3, CheckCircle2, Clock, PlayCircle, Users, Activity, X, ExternalLink } from "lucide-react";
import TaskCard from "../../components/TaskCard";
import Modal from "../../components/Modal";

export default function WorkloadPage() {
  const { store, currentUser, users } = useScheduler();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const isAdmin = currentUser.role === "admin";
  const tasks = store.briefs || [];

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 text-muted">
        <Lock className="mx-auto mb-4" size={48} />
        <h2 className="text-xl font-bold text-text">Access Denied</h2>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }

  const roleColors: any = {
    admin: "bg-danger/10 text-danger border-danger/20",
    editor: "bg-warning/10 text-warning border-warning/20",
    designer: "bg-primary/10 text-primary border-primary/20",
    developer: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  };

  const teamUsers = useMemo(() => {
    const allUsers = store.users || users || [];
    return allUsers.filter((u: any) => u.role !== "admin");
  }, [store.users, users]);
  const selectedUser = teamUsers.find((u: any) => u.id === selectedUserId);

  // Compute tasks for the selected user
  const selectedUserTasks = useMemo(() => {
    return selectedUserId ? tasks.filter((t: any) => {
      const multi = Array.isArray(t.assignedToMulti) ? t.assignedToMulti : [];
      return t.assignedTo === selectedUserId || multi.includes(selectedUserId);
    }) : [];
  }, [tasks, selectedUserId]);

  const completedTasks = selectedUserTasks.filter((t: any) => ['approved', 'completed', 'uploaded'].includes(t.status));
  const inProgressTasks = selectedUserTasks.filter((t: any) => t.status === 'in_progress');
  const pendingTasks = selectedUserTasks.filter((t: any) => ['todo', 'revision'].includes(t.status));

  // Compute team totals
  const totalTasks = tasks.length;
  const totalCompleted = tasks.filter((t: any) => ['approved', 'completed', 'uploaded'].includes(t.status)).length;
  const totalInProgress = tasks.filter((t: any) => t.status === 'in_progress').length;

  return (
    <div className="w-full mx-auto h-full flex flex-col px-6 pb-6">
      <div className="mb-6 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 size={16} />
            </div>
            <h1 className="text-3xl font-extrabold m-0 text-text tracking-tight">Team Workload Dashboard</h1>
          </div>
          <p className="text-muted text-sm m-0 max-w-xl mt-2">
            Click on a team member's card to monitor their active tasks and manage workload distribution.
          </p>
        </div>

        {/* Global Quick Stats */}
        <div className="flex gap-4">
          <div className="bg-panel border border-line rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm min-w-[140px]">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Activity size={18} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Active Tasks</div>
              <div className="text-xl font-black text-text leading-none mt-1">{totalInProgress}</div>
            </div>
          </div>
          <div className="bg-panel border border-line rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm min-w-[140px]">
            <div className="w-10 h-10 rounded-full bg-ok/10 text-ok flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-muted uppercase tracking-wider">Completed</div>
              <div className="text-xl font-black text-text leading-none mt-1">{totalCompleted} <span className="text-sm font-medium text-muted">/ {totalTasks}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scalable Grid of User Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {teamUsers.map((u: any) => {
          const uTasks = tasks.filter((t: any) => {
            const multi = Array.isArray(t.assignedToMulti) ? t.assignedToMulti : [];
            return t.assignedTo === u.id || multi.includes(u.id);
          });
          const uCompleted = uTasks.filter((t: any) => ['approved', 'completed', 'uploaded'].includes(t.status)).length;
          const uActive = uTasks.filter((t: any) => t.status === 'in_progress').length;
          const uPending = uTasks.filter((t: any) => ['todo', 'revision'].includes(t.status)).length;

          const progressPercentage = uTasks.length > 0 ? Math.round((uCompleted / uTasks.length) * 100) : 0;

          return (
            <div
              key={u.id}
              onClick={() => setSelectedUserId(u.id)}
              className="bg-panel border border-line rounded-2xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white font-bold flex items-center justify-center text-lg shadow-sm">
                    {u.avatar || u.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-text text-[15px] leading-tight group-hover:text-primary transition-colors">{u.name}</h3>
                    <span className={`inline-flex items-center mt-1 px-1.5 py-0.5 border rounded-md text-[9px] font-extrabold uppercase tracking-widest ${roleColors[u.role] || "bg-panel-2 border-line text-muted"}`}>
                      {u.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-muted">Task Completion</span>
                  <span className="text-text">{progressPercentage}%</span>
                </div>
                <div className="h-2 bg-panel-2 rounded-full overflow-hidden flex border border-line/50">
                  <div className="bg-ok h-full rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                  <div className="bg-primary h-full rounded-full transition-all duration-500 opacity-60" style={{ width: `${uTasks.length > 0 ? (uActive / uTasks.length) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-line/50">
                <div className="flex flex-col items-center p-2 rounded-lg bg-panel-2/50 border border-line/30 group-hover:bg-ok/5 group-hover:border-ok/20 transition-colors">
                  <span className="text-[9px] font-bold text-muted uppercase mb-1">Done</span>
                  <span className="text-lg font-black text-text group-hover:text-ok transition-colors leading-none">{uCompleted}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-panel-2/50 border border-line/30 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                  <span className="text-[9px] font-bold text-muted uppercase mb-1">Active</span>
                  <span className="text-lg font-black text-text group-hover:text-primary transition-colors leading-none">{uActive}</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-panel-2/50 border border-line/30">
                  <span className="text-[9px] font-bold text-muted uppercase mb-1">Pending</span>
                  <span className="text-lg font-black text-text leading-none">{uPending}</span>
                </div>
              </div>

              {/* Overlay Action */}
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          );
        })}
      </div>

      {/* Centered Modal for Detailed Workload (Table View) */}
      <Modal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        title={selectedUser ? `${selectedUser.name}'s Workload` : "User Workload"}
        maxWidth="max-w-5xl"
      >
        {selectedUser && (
          <div className="flex flex-col max-h-[80vh]">
            {/* Modal Header Stats */}
            <div className="px-6 py-4 border-b border-line bg-panel-2/30 flex flex-wrap gap-4 items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white font-bold flex items-center justify-center shadow-sm">
                  {selectedUser.avatar || selectedUser.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 border rounded-md text-[9px] font-extrabold uppercase tracking-widest ${roleColors[selectedUser.role] || "bg-panel-2 border-line text-muted"}`}>
                      {selectedUser.role}
                    </span>
                    <span className="text-xs font-bold text-muted">
                      {selectedUserTasks.length} Total Tasks
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-ok/10 border border-ok/20 flex flex-col items-center min-w-[70px]">
                  <span className="text-[10px] font-bold text-ok uppercase">Done</span>
                  <span className="text-lg font-black text-ok leading-none mt-1">{completedTasks.length}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center min-w-[70px]">
                  <span className="text-[10px] font-bold text-primary uppercase">Active</span>
                  <span className="text-lg font-black text-primary leading-none mt-1">{inProgressTasks.length}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-panel-2 border border-line flex flex-col items-center min-w-[70px]">
                  <span className="text-[10px] font-bold text-muted uppercase">Pending</span>
                  <span className="text-lg font-black text-text leading-none mt-1">{pendingTasks.length}</span>
                </div>
              </div>
            </div>

            {/* Task Table View */}
            <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
              {selectedUserTasks.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-panel-2 rounded-full flex items-center justify-center text-muted mx-auto mb-4 border border-line">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-text">No tasks assigned</h3>
                  <p className="text-muted text-sm mt-1">This user currently has no tasks in their workload.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-8">

                  {/* Current Focus Table */}
                  {inProgressTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
                        <PlayCircle size={16} className="text-primary" /> Current Focus
                        <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold border border-primary/20">{inProgressTasks.length}</span>
                      </h4>
                      <div className="bg-panel border border-line rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-panel-2/50 border-b border-line text-xs uppercase tracking-wider text-muted font-extrabold">
                            <tr>
                              <th className="px-4 py-3 w-1/2">Task Name</th>
                              <th className="px-4 py-3">Priority</th>
                              <th className="px-4 py-3">Due Date</th>
                              <th className="px-4 py-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {inProgressTasks.map((t: any) => (
                              <tr key={t.id} className="hover:bg-panel-2/30 transition-colors">
                                <td className="px-4 py-3 font-semibold text-text">{t.title}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-[5px] text-[10px] font-extrabold uppercase tracking-wider ${t.priority === 'Low' ? 'bg-ok/10 text-ok border border-ok/20' :
                                      t.priority === 'Urgent' ? 'bg-danger/10 text-danger border border-danger/20' :
                                        'bg-panel-2 text-text border border-line'
                                    }`}>
                                    {t.priority}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-muted font-medium">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className="px-2 py-1 rounded-[5px] text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                    In Progress
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Pending Tasks Table */}
                  {pendingTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
                        <Clock size={16} className="text-muted" /> Upcoming Tasks
                        <span className="bg-panel-2 text-muted text-[10px] px-2 py-0.5 rounded-full font-bold border border-line">{pendingTasks.length}</span>
                      </h4>
                      <div className="bg-panel border border-line rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-panel-2/50 border-b border-line text-xs uppercase tracking-wider text-muted font-extrabold">
                            <tr>
                              <th className="px-4 py-3 w-1/2">Task Name</th>
                              <th className="px-4 py-3">Priority</th>
                              <th className="px-4 py-3">Due Date</th>
                              <th className="px-4 py-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {pendingTasks.map((t: any) => (
                              <tr key={t.id} className="hover:bg-panel-2/30 transition-colors">
                                <td className="px-4 py-3 font-semibold text-text">{t.title}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-[5px] text-[10px] font-extrabold uppercase tracking-wider ${t.priority === 'Low' ? 'bg-ok/10 text-ok border border-ok/20' :
                                      t.priority === 'Urgent' ? 'bg-danger/10 text-danger border border-danger/20' :
                                        'bg-panel-2 text-text border border-line'
                                    }`}>
                                    {t.priority}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-muted font-medium">
                                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="px-2 py-1 rounded-[5px] text-[10px] font-extrabold uppercase tracking-wider bg-panel-2 border border-line text-muted">
                                    {t.status === 'revision' ? 'Revision' : 'To Do'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Completed Tasks Table */}
                  {completedTasks.length > 0 && (
                    <div className="opacity-80">
                      <h4 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-ok" /> Completed
                        <span className="bg-ok/10 text-ok text-[10px] px-2 py-0.5 rounded-full font-bold border border-ok/20">{completedTasks.length}</span>
                      </h4>
                      <div className="bg-panel border border-line rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-panel-2/50 border-b border-line text-xs uppercase tracking-wider text-muted font-extrabold">
                            <tr>
                              <th className="px-4 py-3 w-1/2">Task Name</th>
                              <th className="px-4 py-3">Priority</th>
                              <th className="px-4 py-3">Due Date</th>
                              <th className="px-4 py-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {completedTasks.map((t: any) => (
                              <tr key={t.id} className="hover:bg-panel-2/30 transition-colors">
                                <td className="px-4 py-3 font-semibold text-text line-through opacity-70">{t.title}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-[5px] text-[10px] font-extrabold uppercase tracking-wider ${t.priority === 'Low' ? 'bg-ok/10 text-ok border border-ok/20' :
                                      t.priority === 'Urgent' ? 'bg-danger/10 text-danger border border-danger/20' :
                                        'bg-panel-2 text-text border border-line'
                                    }`}>
                                    {t.priority}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-muted font-medium">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`px-2 py-1 rounded-[5px] text-[10px] font-extrabold uppercase tracking-wider border ${t.status === 'uploaded' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/30' : 'bg-ok/10 text-ok border-ok/30'
                                    }`}>
                                    {t.status === 'uploaded' ? 'In Review' : 'Done'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
