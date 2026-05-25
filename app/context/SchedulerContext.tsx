"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

  return { briefs, uploads, comments, events: [], notifications: [], users: initialUsers };
}

export function SchedulerProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(null);
  const [dark, setDark] = useState(false);
  
  // Real authentication will come from localStorage later
  // but for the sake of the demo, we default to u1 (admin)
  const [currentUserId, setCurrentUserId] = useState("u1");
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    // Load store from localStorage on mount
    const saved = localStorage.getItem("scheduler-store");
    if (saved) {
      try {
        setStore(JSON.parse(saved));
      } catch {
        setStore(seedStore());
      }
    } else {
      setStore(seedStore());
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
      } catch (e) {}
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
      
      fetchUsers().then(fetchTasks);
    }

    const isDark = localStorage.getItem("scheduler-dark") === "true";
    setDark(isDark);
  }, []);

  useEffect(() => {
    if (store) {
      localStorage.setItem("scheduler-store", JSON.stringify(store));
    }
  }, [store]);

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

  const markNotificationsRead = () => {
    updateStore(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.userId === currentUserId ? { ...n, read: true } : n
      )
    }));
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
    markNotificationsRead
  };

  return (
    <SchedulerContext.Provider value={value}>
      {children}
    </SchedulerContext.Provider>
  );
}
