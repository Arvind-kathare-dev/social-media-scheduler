"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { SchedulerProvider, useScheduler } from "../context/SchedulerContext";
import {
  LayoutDashboard, FileEdit, ListTodo, MessageSquareCheck,
  CalendarDays, Image as ImageIcon, Settings, UploadCloud,
  Sun, Moon, Bell, Users, BarChart3
} from "lucide-react";

const navByRole = {
  admin: [
    { label: "Dashboard", path: "/", icon: <LayoutDashboard size={18} /> },
    { label: "Users", path: "/users", icon: <Users size={18} /> },
    { label: "Workload", path: "/workload", icon: <BarChart3 size={18} /> },
    { label: "Tasks", path: "/tasks", icon: <FileEdit size={18} /> },
    { label: "Review", path: "/review", icon: <MessageSquareCheck size={18} /> },
    { label: "Calendar", path: "/calendar", icon: <CalendarDays size={18} /> },
    { label: "Library", path: "/library", icon: <ImageIcon size={18} /> },
    { label: "Settings", path: "/settings", icon: <Settings size={18} /> },
  ],
  editor: [
    { label: "Dashboard", path: "/", icon: <LayoutDashboard size={18} /> },
    { label: "My Tasks", path: "/my-tasks", icon: <ListTodo size={18} /> },
    { label: "Calendar", path: "/calendar", icon: <CalendarDays size={18} /> },
    { label: "Library", path: "/library", icon: <ImageIcon size={18} /> },
  ],
  designer: [
    { label: "Dashboard", path: "/", icon: <LayoutDashboard size={18} /> },
    { label: "My Tasks", path: "/my-tasks", icon: <ListTodo size={18} /> },
    { label: "My Uploads", path: "/my-uploads", icon: <UploadCloud size={18} /> },
    { label: "Calendar", path: "/calendar", icon: <CalendarDays size={18} /> },
    { label: "Library", path: "/library", icon: <ImageIcon size={18} /> },
  ],
  developer: [
    { label: "Dashboard", path: "/", icon: <LayoutDashboard size={18} /> },
    { label: "My Tasks", path: "/my-tasks", icon: <ListTodo size={18} /> },
    { label: "Calendar", path: "/calendar", icon: <CalendarDays size={18} /> },
    { label: "Library", path: "/library", icon: <ImageIcon size={18} /> },
  ],
};

function Topbar() {
  const { dark, toggleDark, store, currentUser, markNotificationsRead } = useScheduler();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const unreadCount = store.notifications ? store.notifications.filter((n) => !n.is_read).length : 0;

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
        markNotificationsRead();
    }
  };

  return (
    <header className="topbar flex items-center justify-between h-[68px] px-6 border-b border-line bg-panel/80 backdrop-blur-md sticky top-0 z-10">
      <div className="page-title min-w-0">
        {/* Title rendering handled by individual pages, but we could put breadcrumbs here */}
      </div>
      <div className="top-actions flex items-center gap-3">
        <button className="icon-btn" onClick={toggleDark} title="Toggle theme">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="relative">
          <button className="icon-btn" onClick={handleBellClick} title="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="badge-count absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-danger text-white text-[11px] grid place-items-center">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[320px] max-h-[400px] overflow-auto bg-panel border border-strong-line rounded-custom shadow-custom z-50">
                <div className="p-3 border-b border-line sticky top-0 bg-panel/90 backdrop-blur-sm flex justify-between items-center z-10">
                    <span className="font-bold text-sm">Notifications</span>
                    {unreadCount === 0 && <span className="text-xs text-muted font-medium">All caught up!</span>}
                </div>
              {store.notifications && store.notifications.length > 0 ? (
                store.notifications.map(n => (
                  <div key={n.id} className={`p-3 border-b border-line last:border-0 text-sm transition-colors hover:bg-panel-2 cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`}>
                    <div className="flex gap-2.5 items-start">
                        {n.type === 'mention' ? (
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                <span className="font-bold text-sm">@</span>
                            </div>
                        ) : n.type === 'task_assigned' ? (
                            <div className="w-8 h-8 rounded-full bg-ok/20 text-ok flex items-center justify-center shrink-0 mt-0.5">
                                <FileEdit size={14} />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-panel-2 text-text flex items-center justify-center shrink-0 border border-line mt-0.5">
                                <MessageSquareCheck size={14} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] leading-snug break-words">
                                {n.message}
                            </div>
                            <div className="text-[11px] font-medium text-muted mt-1.5 uppercase tracking-wide">
                                {new Date(n.created_at || n.createdAt).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted p-6 text-sm flex flex-col items-center justify-center gap-2">
                    <Bell size={24} className="opacity-20" />
                    No notifications yet.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative ml-3">
          <button
            className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center border-none cursor-pointer"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {currentUser.avatar}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 bg-panel border border-strong-line rounded-[8px] shadow-custom w-[200px] z-50 py-2">
              <div className="px-4 py-2 border-b border-strong-line mb-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="font-semibold text-text truncate max-w-[110px]">{currentUser.name}</div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-xs text-muted truncate">{currentUser.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-danger hover:bg-panel-2 transition-colors text-sm"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  const { currentUser, users, setCurrentUserId } = useScheduler();
  const pathname = usePathname();
  const navItems = navByRole[currentUser.role] || [];

  return (
    <aside className="sidebar bg-panel border-r border-line p-5 sticky top-0 h-screen overflow-auto">
      <div className="brand flex items-center gap-2.5 pb-8 pt-2 px-2 font-extrabold">
        <div className="brand-mark w-[34px] h-[34px] rounded-lg grid place-items-center text-white bg-gradient-to-br from-primary to-[#14a879] font-black shadow-sm">
          S
        </div>
        <span className="text-lg tracking-tight">Scheduler</span>
      </div>

      <nav className="nav grid gap-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`w-full flex items-center gap-2.5 rounded-[7px] px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-panel-2 text-text font-medium' : 'text-muted hover:bg-panel-2 hover:text-text'}`}
            >
              <span aria-hidden="true" className="w-5 flex items-center justify-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-bg flex items-center justify-center text-muted">Loading...</div>;
  }

  return (
    <div className="app min-h-screen grid grid-cols-[260px_minmax(0,1fr)] bg-bg text-text">
      <Sidebar />
      <main className="main flex flex-col min-w-0">
        <Topbar />
        <section className="content p-6">
          {children}
        </section>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SchedulerProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SchedulerProvider>
  );
}
