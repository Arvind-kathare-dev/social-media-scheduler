"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

const SchedulerContext = createContext<any>(null);

export function useScheduler() {
  return useContext(SchedulerContext);
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
}

const initialUsers = [
  { id: "u1", name: "Maya Rao", email: "maya@example.com", role: "admin", avatar: "MR", password: "password123" },
  { id: "u2", name: "Jordan Lee", email: "jordan@example.com", role: "editor", avatar: "JL", password: "password123" },
  { id: "u3", name: "Avery Kim", email: "avery@example.com", role: "designer", avatar: "AK", password: "password123" },
  { id: "u4", name: "Nina Shah", email: "nina@example.com", role: "designer", avatar: "NS", password: "password123" },
  { id: "u5", name: "Dev Singh", email: "dev@example.com", role: "developer", avatar: "DS", password: "password123" },
];

function seedStore() {
  const today = new Date();
  const iso = (offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  const briefs = [
    {
      id: "b1",
      title: "Summer launch teaser",
      copy: "The first look is almost here. Save the date ✨",
      hashtags: ["#launch", "#summer"],
      platforms: ["Instagram Feed", "Facebook", "LinkedIn"],
      tone: "Promotional",
      notes: "Bright product-led visuals with one clean CTA.",
      dueDate: iso(2),
      assignedTo: "u3",
      priority: "Urgent",
      createdBy: "u1",
      createdAt: new Date(today.getTime() - 86400000 * 2).toISOString(),
      status: "uploaded",
      visualReference: "",
    },
    {
      id: "b2",
      title: "Founder quote carousel",
      copy: "A practical note from our founder on building consistent content habits.",
      hashtags: ["#contentops", "#brand"],
      platforms: ["Instagram Feed", "LinkedIn", "Pinterest"],
      tone: "Educational",
      notes: "Editorial treatment, readable quote typography.",
      dueDate: iso(6),
      assignedTo: "u5",
      priority: "Normal",
      createdBy: "u2",
      createdAt: new Date(today.getTime() - 86400000).toISOString(),
      status: "todo",
      visualReference: "",
    },
    {
      id: "b3",
      title: "Behind the scenes reel",
      copy: "What a campaign day actually looks like.",
      hashtags: ["#behindthescenes", "#team"],
      platforms: ["Instagram Story/Reel", "YouTube Shorts", "X (Twitter)"],
      tone: "Casual",
      notes: "Fast edits, captions burned in, vertical crop.",
      dueDate: iso(-1),
      assignedTo: "u4",
      priority: "Urgent",
      createdBy: "u1",
      createdAt: new Date(today.getTime() - 86400000 * 3).toISOString(),
      status: "revision",
      visualReference: "",
    },
  ];

  const uploads = [
    {
      id: "up1",
      briefId: "b1",
      files: [
        { url: "", platform: "Instagram Feed", dimensions: "1080x1080", name: "summer-square.png", type: "image/png" },
        { url: "", platform: "Facebook", dimensions: "1200x628", name: "summer-fb.png", type: "image/png" },
        { url: "", platform: "LinkedIn", dimensions: "1200x627", name: "summer-linkedin.png", type: "image/png" },
      ],
      designerNote: "Added platform-specific crops and headline balance.",
      uploadedAt: new Date(today.getTime() - 3600000 * 9).toISOString(),
      status: "pending",
    },
    {
      id: "up2",
      briefId: "b3",
      files: [
        { url: "", platform: "Instagram Story/Reel", dimensions: "1080x1920", name: "bts-reel.mp4", type: "video/mp4" },
      ],
      designerNote: "Revised caption timing and first frame.",
      uploadedAt: new Date(today.getTime() - 3600000 * 16).toISOString(),
      status: "revision",
    },
  ];

  const comments = [
    {
      id: "c1",
      uploadId: "up2",
      authorId: "u1",
      authorRole: "admin",
      text: "@Nina Please increase caption contrast on the first three seconds.",
      type: "revision",
      createdAt: new Date(today.getTime() - 3600000 * 15).toISOString(),
      parentId: null,
    },
    {
      id: "c2",
      uploadId: "up2",
      authorId: "u4",
      authorRole: "designer",
      text: "Updated contrast and marked as revised.",
      type: "comment",
      createdAt: new Date(today.getTime() - 3600000 * 4).toISOString(),
      parentId: "c1",
    },
  ];

  return { briefs, uploads, comments, events: [], notifications: [], users: initialUsers, folders: [] };
}

export function SchedulerProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(null);
  const [dark, setDark] = useState(false);

  // Real authentication will come from localStorage later
  // but for the sake of the demo, we default to u1 (admin)
  const [currentUserId, setCurrentUserId] = useState("u1");
  const [authUser, setAuthUser] = useState(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    // Setup Socket.IO connection
    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const socketUrl = apiUrl.replace(/\/api$/, "");

    if (token) {
      const newSocket = io(socketUrl, { transports: ["websocket", "polling"] });
      setSocket(newSocket);

      newSocket.on("connect", () => {
        // We will emit joinUserRoom in a separate effect when currentUserId is available
      });

      newSocket.on("notification", (data: any) => {
        // Also add it to our store so the UI updates
        setStore(prev => prev ? {
          ...prev,
          notifications: [data, ...(prev.notifications || [])]
        } : prev);

        toast((t) => (
          <div className="flex flex-col gap-1 cursor-pointer" onClick={() => {
            toast.dismiss(t.id);
            window.location.href = '/tasks'; // Simple redirect to tasks page
          }}>
            <span className="text-sm font-semibold text-text">{data.message}</span>
            <span className="text-xs text-primary font-medium">Click to view task details &rarr;</span>
          </div>
        ), {
          icon: '🔔',
          duration: 5000,
          style: {
            background: 'var(--panel)',
            color: 'var(--text)',
            border: '1px solid var(--primary)',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }
        });
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    if (socket && currentUserId) {
      // If already connected, join now
      if (socket.connected) {
        socket.emit("joinUserRoom", currentUserId);
      }
      // Also join on any future reconnects
      const onConnect = () => {
        socket.emit("joinUserRoom", currentUserId);
      };
      socket.on("connect", onConnect);

      return () => {
        socket.off("connect", onConnect);
      };
    }
  }, [socket, currentUserId]);

  useEffect(() => {
    // Initialize with empty arrays to let the API populate the data
    if (refreshCounter === 0) {
      setStore({ briefs: [], uploads: [], comments: [], events: [], notifications: [], users: initialUsers, folders: [] });
    }

    // Try to load real auth user if available
    const authUserStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (authUserStr) {
      try {
        const authUserObj = JSON.parse(authUserStr);
        setAuthUser(authUserObj);

        const userId = authUserObj.id || authUserObj._id;
        if (userId) {
          setCurrentUserId(userId.toString());
        } else if (authUserObj.role) {
          const match = initialUsers.find(u => u.role === authUserObj.role);
          if (match) setCurrentUserId(match.id);
        }
      } catch (e) { }
    }

    if (token) {
      // Fetch users from backend
      const fetchUsers = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
          const res = await fetch(`${apiUrl}/users`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.data) {
            setStore((prev: any) => {
              if (!prev) return prev;
              const backendUsers = data.data.map((u: any) => ({
                id: u.id.toString(),
                name: u.name,
                email: u.email,
                role: u.role,
                avatar: u.name ? u.name.charAt(0).toUpperCase() : "U",
                password: "" // removed from backend
              }));
              return { ...prev, users: backendUsers };
            });
          }
        } catch (err) {
          console.error("Failed to fetch users", err);
        }
      };

      // Fetch notifications from backend
      const fetchNotifications = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
          const res = await fetch(`${apiUrl}/notifications`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.notifications) {
            setStore((prev: any) => {
              if (!prev) return prev;
              return { ...prev, notifications: data.notifications };
            });
          }
        } catch (err) {
          console.error("Failed to fetch notifications", err);
        }
      };

      // Fetch tasks from backend
      const fetchTasks = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
          const res = await fetch(`${apiUrl}/tasks`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.tasks) {
            setStore((prev: any) => {
              if (!prev) return prev;
              const backendTasks = data.tasks.map((t: any) => ({
                id: t.id.toString(),
                title: t.title,
                copy: t.description || "",
                hashtags: t.hashtags ? (typeof t.hashtags === 'string' ? JSON.parse(t.hashtags) : t.hashtags) : [],
                platforms: t.platforms ? (typeof t.platforms === 'string' ? JSON.parse(t.platforms) : t.platforms) : [],
                tone: t.tone || "Professional",
                notes: t.notes || "",
                dueDate: t.due_date ? new Date(t.due_date).toISOString().slice(0, 10) : "",
                assignedTo: t.assigned_to ? t.assigned_to.toString() : "",
                assignedToMulti: t.assigned_to_multi ? (typeof t.assigned_to_multi === 'string' ? JSON.parse(t.assigned_to_multi) : t.assigned_to_multi) : [],
                assignedToName: t.assigned_to_name || "",
                assignedToEmail: t.assigned_to_email || "",
                priority: t.priority === "high" || t.priority === "urgent" ? "Urgent" : (t.priority === "low" ? "Low" : "Normal"),
                createdBy: t.created_by ? t.created_by.toString() : "",
                createdByName: t.created_by_name || "",
                createdAt: t.created_at || new Date().toISOString(),
                status: t.status || "todo",
                visualReference: t.visual_reference || ""
              }));
              return { ...prev, briefs: backendTasks };
            });
          }
        } catch (err) {
          console.error("Failed to fetch tasks", err);
        }
      };

      // Fetch folders from backend
      const fetchFolders = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
          const res = await fetch(`${apiUrl}/folders`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.data) {
            setStore((prev: any) => {
              if (!prev) return prev;
              const backendFolders = data.data.map((f: any) => ({
                id: f.id.toString(),
                name: f.name,
                assignedTo: f.assigned_to ? (typeof f.assigned_to === 'string' ? JSON.parse(f.assigned_to) : f.assigned_to).map(String) : [],
                createdBy: f.created_by ? f.created_by.toString() : "",
                createdAt: f.created_at || new Date().toISOString(),
                platforms: f.platforms ? (typeof f.platforms === 'string' ? JSON.parse(f.platforms) : f.platforms).map(String) : []
              }));
              return { ...prev, folders: backendFolders };
            });
          }
        } catch (err) {
          console.error("Failed to fetch folders", err);
        }
      };

      // Fetch assets from backend
      const fetchAssets = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
          const res = await fetch(`${apiUrl}/assets`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.data) {
            setStore((prev: any) => {
              if (!prev) return prev;
              const backendAssets = data.data.map((a: any) => ({
                id: a.id.toString(),
                title: a.title,
                copy: a.copy || "",
                files: typeof a.files === 'string' ? JSON.parse(a.files) : (a.files || []),
                platform: a.platform,
                folderId: a.folder_id ? a.folder_id.toString() : null,
                authorId: a.author_id ? a.author_id.toString() : "",
                uploadedAt: a.created_at || new Date().toISOString(),
                status: "approved",
                isDirect: true
              }));
              
              // We need to merge them with existing uploads (like task uploads) or just replace standalone uploads.
              // For simplicity, let's keep task uploads (where briefId exists) and add these standalone ones.
              const taskUploads = (prev.uploads || []).filter((u: any) => u.briefId);
              return { ...prev, uploads: [...taskUploads, ...backendAssets] };
            });
          }
        } catch (err) {
          console.error("Failed to fetch assets", err);
        }
      };

      fetchUsers().then(fetchTasks).then(fetchNotifications).then(fetchFolders).then(fetchAssets);
    }

    if (refreshCounter === 0) {
      const isDark = localStorage.getItem("scheduler-dark") === "true";
      setDark(isDark);
    }
  }, [refreshCounter]);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      setRefreshCounter(prev => prev + 1);
    };
    socket.on('tasks_refresh_needed', handleRefresh);
    socket.on('task_updated', handleRefresh);
    return () => {
      socket.off('tasks_refresh_needed', handleRefresh);
      socket.off('task_updated', handleRefresh);
    };
  }, [socket]);

  // LocalStorage store saving has been removed to rely exclusively on the API

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("scheduler-dark", dark.toString());
  }, [dark]);

  const toggleDark = () => setDark(!dark);

  const usersList = store?.users || initialUsers;

  // Determine current user
  let baseUser = usersList.find((u: any) => u.id === currentUserId);
  let currentUser;

  if (authUser) {
    // If we have a real authenticated user, use their data, fallback to baseUser or default
    currentUser = {
      ...(baseUser || usersList[0]),
      id: (authUser.id || authUser._id || currentUserId).toString(),
      name: authUser.name || authUser.username || (baseUser ? baseUser.name : "User"),
      email: authUser.email || (baseUser ? baseUser.email : ""),
      role: authUser.role || (baseUser ? baseUser.role : "admin"),
      avatar: (authUser.name || authUser.username || (baseUser ? baseUser.name : "U")).charAt(0).toUpperCase()
    };
  } else {
    currentUser = baseUser || usersList[0];
  }

  const updateStore = (updater) => {
    setStore(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return { ...next };
    });
  };

  const addNotification = (userId, text) => {
    updateStore(prev => ({
      ...prev,
      notifications: [
        { id: uid("n"), userId, text, read: false, createdAt: new Date().toISOString() },
        ...prev.notifications
      ]
    }));
  };

  const markNotificationsRead = async () => {
    // Optimistic UI update
    updateStore(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, is_read: true }))
    }));

    // API Call
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        await fetch(`${apiUrl}/notifications/read-all`, {
          method: 'PATCH',
          headers: { "Authorization": `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error("Failed to mark notifications read", e);
    }
  };

  if (!store) return null; // loading state

  const value = {
    store,
    updateStore,
    dark,
    toggleDark,
    currentUserId,
    setCurrentUserId,
    currentUser,
    users: usersList,
    addNotification,
    markNotificationsRead,
    authUser,
    socket
  };

  return (
    <SchedulerContext.Provider value={value}>
      {children}
    </SchedulerContext.Provider>
  );
}
