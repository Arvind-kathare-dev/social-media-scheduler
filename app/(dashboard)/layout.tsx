"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { SchedulerProvider, useScheduler } from "../context/SchedulerContext";
import {
  LayoutDashboard, FileEdit, ListTodo, MessageSquareCheck,
  CalendarDays, Image as ImageIcon, Settings, UploadCloud,
  Sun, Moon, Bell, Users, BarChart3, Clock, Menu, X
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

function Topbar({ toggleSidebar }: { toggleSidebar?: () => void }) {
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

  const handleNotificationClick = (n: any) => {
    setShowNotifications(false);

    // Redirect logic
    if (n.task_id || n.taskId || n.brief_id) {
      const tid = n.task_id || n.taskId || n.brief_id;
      router.push(`/tasks/${tid}`);
    }
  };

  return (
    <header className="topbar flex items-center justify-between h-[64px] px-4 md:px-6 border-b border-line bg-panel/90 backdrop-blur-md shrink-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button className="lg:hidden p-2 -ml-2 rounded-md hover:bg-panel-2 text-muted hover:text-text transition-colors" onClick={toggleSidebar} aria-label="Toggle Menu">
          <Menu size={20} />
        </button>
        <div className="page-title min-w-0 hidden md:block">
          {/* Title rendering handled by individual pages, but we could put breadcrumbs here */}
        </div>
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
                store.notifications.map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 border-b border-line last:border-0 text-sm transition-all hover:bg-panel-2 cursor-pointer group relative overflow-hidden ${!n.is_read ? 'bg-primary/5' : ''}`}
                  >
                    {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                    <div className="flex gap-3 items-start">
                      {n.type === 'mention' ? (
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                          <span className="font-bold text-lg">@</span>
                        </div>
                      ) : n.type === 'task_assigned' ? (
                        <div className="w-9 h-9 rounded-full bg-ok/10 text-ok flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-ok group-hover:text-white transition-colors shadow-sm">
                          <FileEdit size={16} />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-panel-2 text-text flex items-center justify-center shrink-0 border border-line mt-0.5 group-hover:bg-text group-hover:text-panel transition-colors shadow-sm">
                          <MessageSquareCheck size={16} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] leading-snug break-words text-text font-medium group-hover:text-primary transition-colors">
                          {n.message}
                        </div>
                        <div className="text-[11px] font-semibold text-muted mt-1.5 uppercase tracking-wide flex items-center gap-1.5">
                          <Clock size={10} />
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

function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean; setIsOpen?: (val: boolean) => void }) {
  const { currentUser, users, setCurrentUserId } = useScheduler();
  const pathname = usePathname();
  const navItems = navByRole[currentUser.role] || [];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen?.(false)}
        />
      )}
      <aside 
        className={`sidebar bg-panel border-r border-line p-5 h-full overflow-y-auto shrink-0 transition-transform duration-300 z-50 fixed lg:relative top-0 bottom-0 left-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} 
        style={{ width: '260px' }}
      >
        <div className="flex items-center justify-between pb-8 pt-2 px-2">
          <div className="brand flex items-center gap-2.5 font-extrabold">
            <div className="brand-mark w-[34px] h-[34px] rounded-lg grid place-items-center text-white bg-gradient-to-br from-primary to-[#14a879] font-black shadow-sm">
              S
            </div>
            <span className="text-lg tracking-tight">VTM</span>
          </div>
          <button 
            className="lg:hidden p-1.5 rounded-md hover:bg-panel-2 text-muted hover:text-text"
            onClick={() => setIsOpen?.(false)}
          >
            <X size={20} />
          </button>
        </div>

      <nav className="nav grid gap-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
              <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsOpen?.(false)}
              className={`w-full flex items-center gap-2.5 rounded-[7px] px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-panel-2 text-text font-medium' : 'text-muted hover:bg-panel-2 hover:text-text'}`}
            >
              <span aria-hidden="true" className="w-5 flex items-center justify-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      </aside>
    </>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    <div className="app h-screen flex overflow-hidden bg-bg text-text w-full">
      <Sidebar isOpen={isMobileSidebarOpen} setIsOpen={setIsMobileSidebarOpen} />
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden w-full">
        <Topbar toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <section className="content flex-1 overflow-y-auto px-4 py-4">
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
