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
      assignedTo: "u3",
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
    if (authUserStr) {
      try {
        const authUser = JSON.parse(authUserStr);
        if (authUser.id) {
          setCurrentUserId(authUser.id.toString());
        } else if (authUser.role) {
          const match = initialUsers.find(u => u.role === authUser.role);
          if (match) setCurrentUserId(match.id);
        }
      } catch (e) {}
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
  const currentUser = usersList.find((u: any) => u.id === currentUserId) || usersList[0];

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
