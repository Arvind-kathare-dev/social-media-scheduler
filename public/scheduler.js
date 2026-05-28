// (function () {
// const platformMeta = {
//   "Instagram Feed": { icon: "IG", color: "var(--ig)" },
//   "Instagram Story/Reel": { icon: "IR", color: "var(--ig)" },
//   Facebook: { icon: "FB", color: "var(--fb)" },
//   "X (Twitter)": { icon: "X", color: "var(--x)" },
//   LinkedIn: { icon: "IN", color: "var(--li)" },
//   Pinterest: { icon: "PI", color: "var(--pin)" },
//   "YouTube Shorts": { icon: "YT", color: "var(--yt)" },
// };

// const tones = ["Professional", "Casual", "Witty", "Inspirational", "Promotional", "Educational"];
// const priorities = ["Low", "Normal", "Urgent"];
// const columns = [
//   ["todo", "To Do"],
//   ["in_progress", "In Progress"],
//   ["uploaded", "Uploaded"],
//   ["revision", "Revision Requested"],
// ];

// const users = [
//   { id: "u1", name: "Maya Rao", email: "maya@example.com", role: "admin", avatar: "MR" },
//   { id: "u2", name: "Jordan Lee", email: "jordan@example.com", role: "editor", avatar: "JL" },
//   { id: "u3", name: "Avery Kim", email: "avery@example.com", role: "designer", avatar: "AK" },
//   { id: "u4", name: "Nina Shah", email: "nina@example.com", role: "designer", avatar: "NS" },
// ];

// const memoryStorage = {};

// function storageGet(key) {
//   try {
//     if (typeof window !== "undefined" && window.localStorage) return window.localStorage.getItem(key);
//   } catch {}
//   return memoryStorage[key] || null;
// }

// function storageSet(key, value) {
//   try {
//     if (typeof window !== "undefined" && window.localStorage) {
//       window.localStorage.setItem(key, value);
//       return;
//     }
//   } catch {}
//   memoryStorage[key] = value;
// }

// const navByRole = {
//   admin: ["Dashboard", "Briefs", "Task Queue", "Review", "Calendar", "Library", "Settings"],
//   editor: ["Dashboard", "Briefs", "Review", "Library"],
//   designer: ["Dashboard", "My Tasks", "My Uploads"],
// };

// const state = {
//   currentUserId: "u1",
//   view: "Dashboard",
//   dark: false,
//   showNotifications: false,
//   modal: null,
//   selectedUploadId: null,
//   calendarView: "month",
//   calendarDate: new Date().toISOString().slice(0, 10),
//   filters: { platform: "All", status: "All", from: "", to: "" },
//   drag: null,
//   store: loadStore(),
// };

// function seedStore() {
//   const today = new Date();
//   const iso = (offset) => {
//     const d = new Date(today);
//     d.setDate(today.getDate() + offset);
//     return d.toISOString().slice(0, 10);
//   };
//   const briefs = [
//     {
//       id: "b1",
//       title: "Summer launch teaser",
//       copy: "The first look is almost here. Save the date ✨",
//       hashtags: ["#launch", "#summer"],
//       platforms: ["Instagram Feed", "Facebook", "LinkedIn"],
//       tone: "Promotional",
//       notes: "Bright product-led visuals with one clean CTA.",
//       dueDate: iso(2),
//       assignedTo: "u3",
//       priority: "Urgent",
//       createdBy: "u1",
//       createdAt: new Date(today - 86400000 * 2).toISOString(),
//       status: "uploaded",
//       visualReference: "",
//     },
//     {
//       id: "b2",
//       title: "Founder quote carousel",
//       copy: "A practical note from our founder on building consistent content habits.",
//       hashtags: ["#contentops", "#brand"],
//       platforms: ["Instagram Feed", "LinkedIn", "Pinterest"],
//       tone: "Educational",
//       notes: "Editorial treatment, readable quote typography.",
//       dueDate: iso(6),
//       assignedTo: "u3",
//       priority: "Normal",
//       createdBy: "u2",
//       createdAt: new Date(today - 86400000).toISOString(),
//       status: "todo",
//       visualReference: "",
//     },
//     {
//       id: "b3",
//       title: "Behind the scenes reel",
//       copy: "What a campaign day actually looks like.",
//       hashtags: ["#behindthescenes", "#team"],
//       platforms: ["Instagram Story/Reel", "YouTube Shorts", "X (Twitter)"],
//       tone: "Casual",
//       notes: "Fast edits, captions burned in, vertical crop.",
//       dueDate: iso(-1),
//       assignedTo: "u4",
//       priority: "Urgent",
//       createdBy: "u1",
//       createdAt: new Date(today - 86400000 * 3).toISOString(),
//       status: "revision",
//       visualReference: "",
//     },
//   ];
//   const uploads = [
//     {
//       id: "up1",
//       briefId: "b1",
//       files: [
//         { url: "", platform: "Instagram Feed", dimensions: "1080x1080", name: "summer-square.png", type: "image/png" },
//         { url: "", platform: "Facebook", dimensions: "1200x628", name: "summer-fb.png", type: "image/png" },
//         { url: "", platform: "LinkedIn", dimensions: "1200x627", name: "summer-linkedin.png", type: "image/png" },
//       ],
//       designerNote: "Added platform-specific crops and headline balance.",
//       uploadedAt: new Date(today - 3600000 * 9).toISOString(),
//       status: "pending",
//     },
//     {
//       id: "up2",
//       briefId: "b3",
//       files: [
//         { url: "", platform: "Instagram Story/Reel", dimensions: "1080x1920", name: "bts-reel.mp4", type: "video/mp4" },
//       ],
//       designerNote: "Revised caption timing and first frame.",
//       uploadedAt: new Date(today - 3600000 * 16).toISOString(),
//       status: "revision",
//     },
//   ];
//   const comments = [
//     {
//       id: "c1",
//       uploadId: "up2",
//       authorId: "u1",
//       authorRole: "admin",
//       text: "@Nina Please increase caption contrast on the first three seconds.",
//       type: "revision",
//       createdAt: new Date(today - 3600000 * 15).toISOString(),
//       parentId: null,
//     },
//     {
//       id: "c2",
//       uploadId: "up2",
//       authorId: "u4",
//       authorRole: "designer",
//       text: "Updated contrast and marked as revised.",
//       type: "comment",
//       createdAt: new Date(today - 3600000 * 4).toISOString(),
//       parentId: "c1",
//     },
//   ];
//   return { briefs, uploads, comments, events: [], notifications: [] };
// }

// function loadStore() {
//   const saved = storageGet("scheduler-store");
//   if (!saved) return seedStore();
//   try {
//     return JSON.parse(saved);
//   } catch {
//     return seedStore();
//   }
// }

// function save() {
//   storageSet("scheduler-store", JSON.stringify(state.store));
// }

// function uid(prefix) {
//   return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
// }

// function currentUser() {
//   return users.find((u) => u.id === state.currentUserId);
// }

// function userById(id) {
//   return users.find((u) => u.id === id) || users[0];
// }

// function roleAllows(view) {
//   return navByRole[currentUser().role].includes(view);
// }

// function setView(view) {
//   state.view = view;
//   if (view === "Review" && !state.selectedUploadId) {
//     state.selectedUploadId = pendingReviewUploads()[0]?.id || null;
//   }
//   render();
// }

// function escapeHtml(value) {
//   return String(value ?? "")
//     .replaceAll("&", "&amp;")
//     .replaceAll("<", "&lt;")
//     .replaceAll(">", "&gt;")
//     .replaceAll('"', "&quot;");
// }

// function formatDate(value) {
//   if (!value) return "";
//   return new Date(`${value}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
// }

// function formatDateTime(value) {
//   return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
// }

// function dueClass(date) {
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   const due = new Date(`${date}T00:00:00`);
//   const diff = Math.ceil((due - today) / 86400000);
//   if (diff < 0) return "overdue";
//   if (diff <= 3) return "soon";
//   return "safe";
// }

// function platformChips(platforms) {
//   return platforms
//     .map((p) => `<span class="chip platform" style="background:${platformMeta[p]?.color || "var(--primary)"}">${platformMeta[p]?.icon || p}</span>`)
//     .join("");
// }

// function addNotification(userId, text) {
//   state.store.notifications.unshift({ id: uid("n"), userId, text, read: false, createdAt: new Date().toISOString() });
// }

// function briefUpload(briefId) {
//   return state.store.uploads.find((u) => u.briefId === briefId);
// }

// function pendingReviewUploads() {
//   return state.store.uploads.filter((u) => u.status === "pending" || u.status === "revision");
// }

// function approvedUploads() {
//   return state.store.uploads.filter((u) => u.status === "approved");
// }

// function firstAsset(upload) {
//   return upload?.files?.[0];
// }

// function assetHtml(file, className = "thumb") {
//   if (!file?.url) return `<div class="file-placeholder">Mock asset<br>${escapeHtml(file?.name || "upload")}</div>`;
//   if ((file.type || "").startsWith("video")) return `<video class="${className}" src="${file.url}" controls muted></video>`;
//   return `<img class="${className}" src="${file.url}" alt="${escapeHtml(file.name || "upload")}" />`;
// }

// function render() {
//   document.documentElement.classList.toggle("dark", state.dark);
//   const user = currentUser();
//   if (!roleAllows(state.view)) state.view = navByRole[user.role][0];
//   ensureMount().innerHTML = `
//     <div class="app">
//       <aside class="sidebar">
//         <div class="brand"><span class="brand-mark">S</span><span>Scheduler</span></div>
//         <div class="role-card">
//           <label for="roleSelect">Active user</label>
//           <select id="roleSelect" class="select">
//             ${users.map((u) => `<option value="${u.id}" ${u.id === state.currentUserId ? "selected" : ""}>${u.name} · ${u.role}</option>`).join("")}
//           </select>
//         </div>
//         <nav class="nav">
//           ${navByRole[user.role].map((item) => `<button class="${state.view === item ? "active" : ""}" data-nav="${item}">${navIcon(item)} ${item}</button>`).join("")}
//         </nav>
//       </aside>
//       <main class="main">
//         <header class="topbar">
//           <div class="page-title">
//             <h1>${state.view}</h1>
//             <p>${headerCopy(user.role, state.view)}</p>
//           </div>
//           <div class="top-actions">
//             <button class="icon-btn" id="themeToggle" title="Toggle theme">${state.dark ? "☀" : "◐"}</button>
//             <button class="icon-btn" id="bellBtn" title="Notifications">🔔${unreadCount() ? `<span class="badge-count">${unreadCount()}</span>` : ""}</button>
//             ${renderUserProfile()}
//           </div>
//         </header>
//         <section class="content">${renderView()}</section>
//       </main>
//     </div>
//     ${state.showNotifications ? renderNotifications() : ""}
//     ${renderModal()}
//   `;
//   bindCommon();
//   bindView();
// }

// function renderUserProfile() {
//   let authUser = null;
//   try {
//     const userStr = storageGet("user");
//     if (userStr) authUser = JSON.parse(userStr);
//   } catch (e) {}

//   if (!authUser) return "";

//   const name = authUser.name || authUser.username || "Admin";
//   const avatar = name.substring(0, 2).toUpperCase();

//   return `
//     <div class="user-profile-menu" style="position: relative; margin-left: 12px; display: inline-block;">
//       <button class="profile-avatar" id="profileDropdownBtn" title="${escapeHtml(name)}" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: white; border: none; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">${avatar}</button>
//       <div class="dropdown-menu" id="profileDropdown" style="display:none; position: absolute; right: 0; top: 100%; margin-top: 8px; background: var(--panel); border: 1px solid var(--strong-line); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 200px; z-index: 100; padding: 8px 0;">
//         <div class="dropdown-header" style="padding: 8px 16px; border-bottom: 1px solid var(--strong-line); margin-bottom: 8px;">
//           <div style="font-weight: 600; color: var(--text);">${escapeHtml(name)}</div>
//           <div style="font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis;">${escapeHtml(authUser.email || "")}</div>
//         </div>
//         <button class="btn ghost" id="logoutBtn" style="width: 100%; text-align: left; padding: 8px 16px; color: #dc2626; border-radius: 0; justify-content: flex-start; display: block; border: none; background: transparent; cursor: pointer;">Log out</button>
//       </div>
//     </div>
//   `;
// }

// function navIcon(item) {
//   const icons = { Dashboard: "▦", Briefs: "✎", "Task Queue": "▤", Review: "◫", Calendar: "□", Library: "▧", Settings: "⚙", "My Tasks": "▤", "My Uploads": "⇧" };
//   return `<span aria-hidden="true">${icons[item] || "•"}</span>`;
// }

// function headerCopy(role, view) {
//   const label = role.charAt(0).toUpperCase() + role.slice(1);
//   if (view === "Calendar") return "Monthly planning, week slots, and publishing controls.";
//   if (view === "Review") return "Pending design uploads and threaded feedback.";
//   if (view === "Briefs") return "Create assignments for designers.";
//   return `${label} workspace`;
// }

// function unreadCount() {
//   return state.store.notifications.filter((n) => n.userId === state.currentUserId && !n.read).length;
// }

// function renderView() {
//   const view = state.view;
//   if (view === "Dashboard") return renderDashboard();
//   if (view === "Briefs") return renderBriefs();
//   if (view === "Task Queue" || view === "My Tasks") return renderTaskQueue();
//   if (view === "Review") return renderReview();
//   if (view === "Library") return renderLibrary(false);
//   if (view === "Calendar") return renderCalendar();
//   if (view === "My Uploads") return renderMyUploads();
//   if (view === "Settings") return renderSettings();
//   return "";
// }

// function renderDashboard() {
//   const user = currentUser();
//   const assigned = state.store.briefs.filter((b) => b.assignedTo === user.id);
//   return `
//     <div class="grid dashboard-grid">
//       <div class="stat"><strong>${state.store.briefs.length}</strong><span>Total briefs</span></div>
//       <div class="stat"><strong>${pendingReviewUploads().length}</strong><span>Pending review</span></div>
//       <div class="stat"><strong>${approvedUploads().length}</strong><span>Approved posts</span></div>
//       <div class="stat"><strong>${state.store.events.length}</strong><span>Calendar slots</span></div>
//     </div>
//     <div class="section" style="margin-top:18px">
//       <div class="section-head"><h2>${user.role === "designer" ? "Assigned work" : "Recent briefs"}</h2></div>
//       ${taskListHtml(user.role === "designer" ? assigned : state.store.briefs.slice(0, 4))}
//     </div>
//   `;
// }

// function renderBriefs() {
//   return `
//     <div class="section">
//       <div class="section-head"><h2>Content Brief Form</h2></div>
//       <form id="briefForm" class="form-grid">
//         <div class="field"><label>Post title</label><input class="input" name="title" required /></div>
//         <div class="field"><label>Desired tone</label><select class="select" name="tone">${tones.map((t) => `<option>${t}</option>`).join("")}</select></div>
//         <div class="field full"><label>Content copy</label><textarea class="textarea" name="copy" required></textarea></div>
//         <div class="field full"><label>Hashtags</label><div class="chips" id="hashtagBox"><input class="chip-input" id="hashtagInput" placeholder="#campaign" /></div></div>
//         <div class="field full"><label>Target platforms</label><div class="checkbox-grid">${Object.keys(platformMeta).map((p) => `<label class="check"><input type="checkbox" name="platforms" value="${p}" /> ${p}</label>`).join("")}</div></div>
//         <div class="field"><label>Visual reference / mood board</label><input class="input" name="visualReference" placeholder="URL or file name" /></div>
//         <div class="field"><label>Due date for design delivery</label><input class="input" type="date" name="dueDate" required /></div>
//         <div class="field"><label>Assign to</label><select class="select" name="assignedTo">${users.filter((u) => u.role === "designer").map((u) => `<option value="${u.id}">${u.name}</option>`).join("")}</select></div>
//         <div class="field"><label>Priority tag</label><select class="select" name="priority">${priorities.map((p) => `<option>${p}</option>`).join("")}</select></div>
//         <div class="field full"><label>Notes for designer</label><textarea class="textarea" name="notes"></textarea></div>
//         <div class="field full"><button class="btn primary" type="submit">Create brief</button></div>
//       </form>
//     </div>
//     <div class="section">
//       <div class="section-head"><h2>Created briefs</h2></div>
//       ${taskListHtml(state.store.briefs)}
//     </div>
//   `;
// }

// function taskListHtml(briefs) {
//   if (!briefs.length) return `<div class="empty">No briefs yet.</div>`;
//   return briefs
//     .map((b) => `
//       <div class="task-card">
//         <div class="card-title">${escapeHtml(b.title)}</div>
//         <div class="meta">
//           <span class="due ${dueClass(b.dueDate)}">${formatDate(b.dueDate)}</span>
//           ${platformChips(b.platforms)}
//           <span class="priority ${b.priority.toLowerCase()}">${b.priority}</span>
//           <span>${escapeHtml(userById(b.createdBy).name)}</span>
//         </div>
//       </div>
//     `)
//     .join("");
// }

// function renderTaskQueue() {
//   const user = currentUser();
//   const designerId = user.role === "designer" ? user.id : null;
//   const briefs = state.store.briefs.filter((b) => !designerId || b.assignedTo === designerId);
//   return `
//     <div class="kanban">
//       ${columns.map(([key, label]) => {
//         const items = briefs.filter((b) => statusColumn(b) === key);
//         return `<div class="kanban-col"><div class="kanban-title"><span>${label}</span><span>${items.length}</span></div>${items.map(taskCardHtml).join("") || `<div class="empty">No cards</div>`}</div>`;
//       }).join("")}
//     </div>
//   `;
// }

// function statusColumn(brief) {
//   if (brief.status === "revision") return "revision";
//   if (brief.status === "uploaded" || briefUpload(brief.id)) return "uploaded";
//   if (brief.status === "in_progress") return "in_progress";
//   return "todo";
// }

// function taskCardHtml(b) {
//   const upload = briefUpload(b.id);
//   const lastRevision = upload ? state.store.comments.filter((c) => c.uploadId === upload.id && c.type === "revision").at(-1) : null;
//   return `
//     <article class="task-card">
//       ${b.status === "revision" && lastRevision ? `<div class="comment revision" style="margin-bottom:10px">${escapeHtml(lastRevision.text)}</div>` : ""}
//       <div class="card-title">${escapeHtml(b.title)}</div>
//       <div class="meta">
//         <span class="due ${dueClass(b.dueDate)}">${formatDate(b.dueDate)}</span>
//         ${platformChips(b.platforms)}
//         <span class="priority ${b.priority.toLowerCase()}">${b.priority}</span>
//         <span>${escapeHtml(userById(b.createdBy).name)}</span>
//       </div>
//       <div class="card-actions">
//         <button class="btn ghost" data-open-brief="${b.id}">Open brief</button>
//         ${currentUser().role === "designer" ? `<button class="btn primary" data-upload="${b.id}">Upload design</button>` : ""}
//       </div>
//     </article>
//   `;
// }

// function renderReview() {
//   const uploads = pendingReviewUploads();
//   const selected = uploads.find((u) => u.id === state.selectedUploadId) || uploads[0];
//   if (!selected) return `<div class="empty">No posts pending review — you're all caught up!</div>`;
//   state.selectedUploadId = selected.id;
//   const brief = state.store.briefs.find((b) => b.id === selected.briefId);
//   return `
//     <div class="review-layout">
//       <div class="section">
//         <div class="section-head">
//           <h2>${escapeHtml(brief.title)}</h2>
//           <select class="select" id="reviewSelect" style="max-width:260px">${uploads.map((u) => `<option value="${u.id}" ${u.id === selected.id ? "selected" : ""}>${escapeHtml(state.store.briefs.find((b) => b.id === u.briefId)?.title || "Upload")}</option>`).join("")}</select>
//         </div>
//         <div class="asset-viewer">
//           ${selected.files.map((file) => `
//             <div class="review-asset">
//               ${assetHtml(file)}
//               <div class="meta" style="margin-top:8px">${platformChips([file.platform])}<span>${escapeHtml(file.dimensions)}</span><span>${escapeHtml(file.name)}</span></div>
//             </div>
//           `).join("")}
//         </div>
//       </div>
//       <div class="section">
//         <div class="section-head"><h2>Review thread</h2><span class="status-badge ${selected.status}">${selected.status}</span></div>
//         <div class="comment-thread">${commentThreadHtml(selected.id)}</div>
//         <form id="reviewForm" style="margin-top:12px">
//           <textarea class="textarea" name="text" placeholder="@${escapeHtml(userById(brief.assignedTo).name)}"></textarea>
//           <div class="card-actions">
//             <button class="btn danger" name="action" value="revision">Request revision</button>
//             <button class="btn primary" name="action" value="approval">Approve</button>
//             <button class="btn ghost" name="action" value="comment">Comment</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   `;
// }

// function commentThreadHtml(uploadId) {
//   const comments = state.store.comments.filter((c) => c.uploadId === uploadId);
//   if (!comments.length) return `<div class="empty">No comments yet.</div>`;
//   return comments
//     .map((c) => `
//       <div class="comment ${c.type}">
//         <div class="comment-head"><span>${escapeHtml(userById(c.authorId).name)} <span class="role-badge">${c.authorRole}</span></span><span>${formatDateTime(c.createdAt)}</span></div>
//         <div>${escapeHtml(c.text).replaceAll("\n", "<br>")}</div>
//       </div>
//     `)
//     .join("");
// }

// function renderLibrary(compact) {
//   let uploads = approvedUploads();
//   uploads = uploads.filter((u) => {
//     const brief = state.store.briefs.find((b) => b.id === u.briefId);
//     const approvedComment = state.store.comments.find((c) => c.uploadId === u.id && c.type === "approval");
//     const approvalDate = approvedComment?.createdAt?.slice(0, 10) || u.uploadedAt.slice(0, 10);
//     const hasPlatform = state.filters.platform === "All" || u.files.some((f) => f.platform === state.filters.platform);
//     const event = state.store.events.find((e) => e.uploadId === u.id);
//     const statusOk = state.filters.status === "All" || (state.filters.status === "scheduled" ? event : !event);
//     const fromOk = !state.filters.from || approvalDate >= state.filters.from;
//     const toOk = !state.filters.to || approvalDate <= state.filters.to;
//     return brief && hasPlatform && statusOk && fromOk && toOk;
//   });
//   return `
//     ${compact ? "" : `<div class="section"><div class="filters">
//       <div><label>Platform</label><select class="select" id="filterPlatform"><option>All</option>${Object.keys(platformMeta).map((p) => `<option ${state.filters.platform === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
//       <div><label>Status</label><select class="select" id="filterStatus"><option>All</option><option ${state.filters.status === "scheduled" ? "selected" : ""}>scheduled</option><option ${state.filters.status === "unscheduled" ? "selected" : ""}>unscheduled</option></select></div>
//       <div><label>From</label><input class="input" type="date" id="filterFrom" value="${state.filters.from}" /></div>
//       <div><label>To</label><input class="input" type="date" id="filterTo" value="${state.filters.to}" /></div>
//     </div></div>`}
//     <div class="grid library-grid">
//       ${uploads.map(postCardHtml).join("") || `<div class="empty">No approved posts yet.</div>`}
//     </div>
//   `;
// }

// function postCardHtml(upload) {
//   const brief = state.store.briefs.find((b) => b.id === upload.briefId);
//   const asset = firstAsset(upload);
//   const approval = state.store.comments.find((c) => c.uploadId === upload.id && c.type === "approval");
//   return `
//     <article class="post-card draggable" data-drag-upload="${upload.id}">
//       ${assetHtml(asset)}
//       <div class="card-title">${escapeHtml(brief.title)}</div>
//       <div class="meta">${platformChips(upload.files.map((f) => f.platform))}</div>
//       <div class="meta" style="margin-top:7px"><span class="status-badge approved">approved</span><span>${formatDate((approval?.createdAt || upload.uploadedAt).slice(0, 10))}</span></div>
//       <div class="card-actions"><button class="btn ghost" data-share="${upload.id}">Share link</button></div>
//     </article>
//   `;
// }

// function renderCalendar() {
//   return `
//     <div class="calendar-shell">
//       <div class="section">
//         <div class="section-head"><h2>Approved Posts</h2></div>
//         ${renderLibrary(true)}
//       </div>
//       <div class="section">
//         <div class="section-head">
//           <h2>${new Date(`${state.calendarDate}T00:00:00`).toLocaleDateString([], { month: "long", year: "numeric" })}</h2>
//           <div class="calendar-tools">
//             <input class="input" style="width:155px" type="date" id="calendarDate" value="${state.calendarDate}" />
//             ${["month", "week", "day"].map((v) => `<button class="btn ${state.calendarView === v ? "primary" : "ghost"}" data-cal-view="${v}">${v}</button>`).join("")}
//           </div>
//         </div>
//         ${state.calendarView === "month" ? monthCalendarHtml() : timeCalendarHtml()}
//       </div>
//     </div>
//   `;
// }

// function monthCalendarHtml() {
//   const base = new Date(`${state.calendarDate}T00:00:00`);
//   const first = new Date(base.getFullYear(), base.getMonth(), 1);
//   const start = new Date(first);
//   start.setDate(first.getDate() - first.getDay());
//   const days = Array.from({ length: 42 }, (_, i) => {
//     const d = new Date(start);
//     d.setDate(start.getDate() + i);
//     return d;
//   });
//   return `<div class="calendar-grid month">
//     ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<div class="weekday">${d}</div>`).join("")}
//     ${days.map((d) => dayCellHtml(d)).join("")}
//   </div>`;
// }

// function dayCellHtml(date) {
//   const iso = date.toISOString().slice(0, 10);
//   return `
//     <div class="day-cell" data-date="${iso}">
//       <div class="day-num">${date.getDate()}</div>
//       ${state.store.events.filter((e) => e.scheduledDate === iso).map(eventHtml).join("")}
//     </div>
//   `;
// }

// function eventHtml(event) {
//   const upload = state.store.uploads.find((u) => u.id === event.uploadId);
//   const brief = state.store.briefs.find((b) => b.id === upload?.briefId);
//   const color = platformMeta[event.platforms[0]]?.color || "var(--primary)";
//   return `<div class="event-card" style="border-left-color:${color}" data-event="${event.id}"><strong>${escapeHtml(brief?.title)}</strong><span>${event.scheduledTime} · ${event.status}</span><span>${platformChips(event.platforms)}</span></div>`;
// }

// function timeCalendarHtml() {
//   const date = new Date(`${state.calendarDate}T00:00:00`);
//   const days = state.calendarView === "week" ? Array.from({ length: 7 }, (_, i) => {
//     const d = new Date(date);
//     d.setDate(date.getDate() - date.getDay() + i);
//     return d.toISOString().slice(0, 10);
//   }) : [state.calendarDate];
//   const step = state.calendarView === "day" ? 15 : 60;
//   const rows = [];
//   for (let m = 0; m < 24 * 60; m += step) rows.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
//   return `<div class="time-grid">${rows.map((t) => {
//     const events = state.store.events.filter((e) => days.includes(e.scheduledDate) && e.scheduledTime === t);
//     return `<div class="time-row"><div class="time-label">${t}</div><div class="time-events">${events.map(eventHtml).join("")}</div></div>`;
//   }).join("")}</div>`;
// }

// function renderMyUploads() {
//   const user = currentUser();
//   const myBriefs = state.store.briefs.filter((b) => b.assignedTo === user.id);
//   const uploads = state.store.uploads.filter((u) => myBriefs.some((b) => b.id === u.briefId));
//   if (!uploads.length) return `<div class="empty">No uploads yet.</div>`;
//   return `<div class="grid library-grid">${uploads.map((u) => {
//     const brief = state.store.briefs.find((b) => b.id === u.briefId);
//     return `<div class="post-card">${assetHtml(firstAsset(u))}<div class="card-title">${escapeHtml(brief.title)}</div><div class="meta"><span class="status-badge ${u.status}">${u.status}</span>${platformChips(u.files.map((f) => f.platform))}</div><div class="card-actions"><button class="btn ghost" data-open-brief="${brief.id}">Open brief</button>${u.status === "revision" ? `<button class="btn primary" data-revised="${u.id}">Mark revised</button>` : ""}</div><div class="comment-thread" style="margin-top:12px;max-height:260px">${commentThreadHtml(u.id)}</div><form class="designerReplyForm" data-reply-upload="${u.id}" style="margin-top:10px"><textarea class="textarea" name="text" placeholder="Reply to comments"></textarea><div class="card-actions"><button class="btn primary">Reply</button></div></form></div>`;
//   }).join("")}</div>`;
// }

// function renderSettings() {
//   return `<div class="section"><h2>Settings</h2><p class="meta">Users, roles, storage, and notification settings are ready for backend integration.</p></div>`;
// }

// function renderNotifications() {
//   const notifications = state.store.notifications.filter((n) => n.userId === state.currentUserId);
//   return `<div class="notification-menu">${notifications.length ? notifications.map((n) => `<div class="notification-item">${escapeHtml(n.text)}<div class="meta">${formatDateTime(n.createdAt)}</div></div>`).join("") : `<div class="empty">No notifications.</div>`}</div>`;
// }

// function renderModal() {
//   if (!state.modal) return "";
//   if (state.modal.type === "brief") return briefModal(state.modal.briefId);
//   if (state.modal.type === "upload") return uploadModal(state.modal.briefId);
//   if (state.modal.type === "schedule") return scheduleModal(state.modal.uploadId, state.modal.date);
//   if (state.modal.type === "event") return eventModal(state.modal.eventId);
//   if (state.modal.type === "share") return shareModal(state.modal.uploadId);
//   return "";
// }

// function modalFrame(title, body, small = false) {
//   return `<div class="modal-backdrop"><div class="modal ${small ? "small" : ""}"><div class="modal-head"><h2>${title}</h2><button class="icon-btn" id="closeModal">×</button></div>${body}</div></div>`;
// }

// function briefModal(briefId) {
//   const b = state.store.briefs.find((item) => item.id === briefId);
//   return modalFrame(escapeHtml(b.title), `
//     <div class="grid">
//       <div><strong>Copy</strong><p>${escapeHtml(b.copy).replaceAll("\n", "<br>")}</p></div>
//       <div class="meta">${platformChips(b.platforms)}<span>${b.tone}</span><span class="priority ${b.priority.toLowerCase()}">${b.priority}</span><span class="due ${dueClass(b.dueDate)}">${formatDate(b.dueDate)}</span></div>
//       <div><strong>Hashtags</strong><p>${b.hashtags.map(escapeHtml).join(" ") || "None"}</p></div>
//       <div><strong>Notes</strong><p>${escapeHtml(b.notes || "None").replaceAll("\n", "<br>")}</p></div>
//       <div><strong>Visual reference / mood board</strong><p>${escapeHtml(b.visualReference || "None")}</p></div>
//     </div>
//   `);
// }

// function uploadModal(briefId) {
//   const b = state.store.briefs.find((item) => item.id === briefId);
//   return modalFrame(`Upload design · ${escapeHtml(b.title)}`, `
//     <form id="uploadForm">
//       <div class="field"><label>Files</label><div class="dropzone" id="dropzone">Drop PNG, JPG, MP4, or GIF files here<input class="hidden" type="file" id="fileInput" multiple accept=".png,.jpg,.jpeg,.mp4,.gif,image/png,image/jpeg,video/mp4,image/gif" /></div></div>
//       <div class="upload-list" id="uploadList"></div>
//       <div class="field" style="margin-top:12px"><label>Designer note</label><textarea class="textarea" name="designerNote"></textarea></div>
//       <div class="card-actions"><button class="btn primary">Submit upload</button></div>
//     </form>
//   `);
// }

// function scheduleModal(uploadId, date) {
//   const upload = state.store.uploads.find((u) => u.id === uploadId);
//   const platforms = [...new Set(upload.files.map((f) => f.platform))];
//   return modalFrame("Schedule post", `
//     <form id="scheduleForm">
//       <div class="field"><label>Select platforms to post on</label><div class="checkbox-grid">${platforms.map((p) => `<label class="check"><input type="checkbox" name="platforms" value="${p}" checked /> ${p}</label>`).join("")}</div></div>
//       <div class="field" style="margin-top:12px"><label>Select time</label><input class="input" type="time" name="time" value="09:00" step="900" /></div>
//       <div class="card-actions"><button class="btn primary">Confirm</button></div>
//     </form>
//   `, true);
// }

// function eventModal(eventId) {
//   const event = state.store.events.find((e) => e.id === eventId);
//   const upload = state.store.uploads.find((u) => u.id === event.uploadId);
//   const brief = state.store.briefs.find((b) => b.id === upload.briefId);
//   return modalFrame(escapeHtml(brief.title), `
//     ${assetHtml(firstAsset(upload))}
//     <div class="meta" style="margin:10px 0">${platformChips(event.platforms)}<span>${formatDate(event.scheduledDate)}</span><span>${event.scheduledTime}</span><span class="status-badge">${event.status}</span></div>
//     <form id="eventForm">
//       <div class="field"><label>Edit time</label><input class="input" type="time" name="time" value="${event.scheduledTime}" step="900" /></div>
//       <div class="card-actions">
//         <button class="btn primary" name="action" value="edit">Save time</button>
//         <button class="btn primary" name="action" value="publish">Publish now</button>
//         <button class="btn danger" name="action" value="remove">Remove from calendar</button>
//         <button class="btn ghost" name="action" value="comments">View comments</button>
//       </div>
//     </form>
//   `, true);
// }

// function shareModal(uploadId) {
//   return modalFrame("Shareable link", `<input class="input" readonly value="${location.origin}${location.pathname}#review-${uploadId}" />`, true);
// }

// function bindCommon() {
//   document.querySelectorAll("[data-nav]").forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.nav)));
//   document.getElementById("roleSelect").addEventListener("change", (e) => {
//     state.currentUserId = e.target.value;
//     state.view = navByRole[currentUser().role][0];
//     state.showNotifications = false;
//     render();
//   });
//   document.getElementById("themeToggle").addEventListener("click", () => {
//     state.dark = !state.dark;
//     render();
//   });
//   document.getElementById("bellBtn").addEventListener("click", () => {
//     state.showNotifications = !state.showNotifications;
//     state.store.notifications.forEach((n) => {
//       if (n.userId === state.currentUserId) n.read = true;
//     });
//     save();
//     render();
//   });
//   document.querySelectorAll("[data-open-brief]").forEach((btn) => btn.addEventListener("click", () => {
//     state.modal = { type: "brief", briefId: btn.dataset.openBrief };
//     render();
//   }));
//   document.querySelectorAll("[data-upload]").forEach((btn) => btn.addEventListener("click", () => {
//     state.modal = { type: "upload", briefId: btn.dataset.upload };
//     render();
//   }));
//   document.querySelectorAll("[data-share]").forEach((btn) => btn.addEventListener("click", () => {
//     state.modal = { type: "share", uploadId: btn.dataset.share };
//     render();
//   }));
//   document.querySelectorAll("[data-revised]").forEach((btn) => btn.addEventListener("click", () => markRevised(btn.dataset.revised)));
//   document.getElementById("closeModal")?.addEventListener("click", () => {
//     state.modal = null;
//     render();
//   });
//   document.querySelector(".modal-backdrop")?.addEventListener("click", (e) => {
//     if (e.target.classList.contains("modal-backdrop")) {
//       state.modal = null;
//       render();
//     }
//   });

//   document.getElementById("profileDropdownBtn")?.addEventListener("click", (e) => {
//     e.stopPropagation();
//     const dropdown = document.getElementById("profileDropdown");
//     if (dropdown) dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
//   });
  
//   document.getElementById("logoutBtn")?.addEventListener("click", () => {
//     if (typeof window !== "undefined" && window.localStorage) {
//       window.localStorage.removeItem("user");
//       window.localStorage.removeItem("token");
//     } else {
//       storageSet("user", "");
//       storageSet("token", "");
//     }
//     window.location.href = "/login";
//   });
  
//   document.addEventListener("click", (e) => {
//     if (!e.target.closest(".user-profile-menu")) {
//       const dropdown = document.getElementById("profileDropdown");
//       if (dropdown) dropdown.style.display = "none";
//     }
//   });
// }

// function bindView() {
//   bindBriefForm();
//   bindReviewForm();
//   bindDesignerReplies();
//   bindLibraryFilters();
//   bindCalendar();
//   bindUploadModal();
//   bindScheduleModal();
//   bindEventModal();
//   bindHashRoute();
// }

// function bindDesignerReplies() {
//   document.querySelectorAll(".designerReplyForm").forEach((form) => form.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const text = new FormData(form).get("text").trim();
//     if (!text) return;
//     const upload = state.store.uploads.find((u) => u.id === form.dataset.replyUpload);
//     const brief = state.store.briefs.find((b) => b.id === upload.briefId);
//     state.store.comments.push({ id: uid("c"), uploadId: upload.id, authorId: state.currentUserId, authorRole: "designer", text, type: "comment", createdAt: new Date().toISOString(), parentId: null });
//     users.filter((u) => u.role === "admin" || u.role === "editor").forEach((u) => addNotification(u.id, `${currentUser().name} replied on ${brief.title}`));
//     save();
//     render();
//   }));
// }

// function bindBriefForm() {
//   const form = document.getElementById("briefForm");
//   if (!form) return;
//   const tags = [];
//   const renderTags = () => {
//     const box = document.getElementById("hashtagBox");
//     box.querySelectorAll(".chip").forEach((chip) => chip.remove());
//     tags.forEach((tag, index) => {
//       const span = document.createElement("span");
//       span.className = "chip";
//       span.innerHTML = `${escapeHtml(tag)} <button type="button">×</button>`;
//       span.querySelector("button").addEventListener("click", () => {
//         tags.splice(index, 1);
//         renderTags();
//       });
//       box.insertBefore(span, document.getElementById("hashtagInput"));
//     });
//   };
//   document.getElementById("hashtagInput").addEventListener("keydown", (e) => {
//     if (e.key === "Enter" || e.key === ",") {
//       e.preventDefault();
//       const value = e.target.value.trim();
//       if (value) tags.push(value.startsWith("#") ? value : `#${value}`);
//       e.target.value = "";
//       renderTags();
//     }
//   });
//   form.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const data = new FormData(form);
//     const platforms = data.getAll("platforms");
//     if (!platforms.length) return alert("Select at least one platform.");
//     const brief = {
//       id: uid("b"),
//       title: data.get("title").trim(),
//       copy: data.get("copy"),
//       hashtags: tags,
//       platforms,
//       tone: data.get("tone"),
//       notes: data.get("notes"),
//       dueDate: data.get("dueDate"),
//       assignedTo: data.get("assignedTo"),
//       priority: data.get("priority"),
//       createdBy: state.currentUserId,
//       createdAt: new Date().toISOString(),
//       status: "todo",
//       visualReference: data.get("visualReference"),
//     };
//     state.store.briefs.unshift(brief);
//     addNotification(brief.assignedTo, `New brief assigned to you — ${brief.title}`);
//     save();
//     render();
//   });
// }

// function bindReviewForm() {
//   document.getElementById("reviewSelect")?.addEventListener("change", (e) => {
//     state.selectedUploadId = e.target.value;
//     render();
//   });
//   const form = document.getElementById("reviewForm");
//   if (!form) return;
//   form.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const action = e.submitter?.value || "comment";
//     const upload = state.store.uploads.find((u) => u.id === state.selectedUploadId);
//     const brief = state.store.briefs.find((b) => b.id === upload.briefId);
//     const text = new FormData(form).get("text").trim() || (action === "approval" ? "Approved." : "Please revise.");
//     state.store.comments.push({ id: uid("c"), uploadId: upload.id, authorId: state.currentUserId, authorRole: currentUser().role, text, type: action, createdAt: new Date().toISOString(), parentId: null });
//     if (action === "revision") {
//       upload.status = "revision";
//       brief.status = "revision";
//       addNotification(brief.assignedTo, `Revision requested on ${brief.title} — ${currentUser().name}: ${text.slice(0, 72)}`);
//     } else if (action === "approval") {
//       upload.status = "approved";
//       brief.status = "approved";
//       addNotification(brief.assignedTo, `${brief.title} approved!`);
//     }
//     save();
//     render();
//   });
// }

// function bindLibraryFilters() {
//   ["Platform", "Status", "From", "To"].forEach((key) => {
//     document.getElementById(`filter${key}`)?.addEventListener("change", (e) => {
//       const prop = key.toLowerCase();
//       state.filters[prop] = e.target.value;
//       render();
//     });
//   });
// }

// function bindCalendar() {
//   document.getElementById("calendarDate")?.addEventListener("change", (e) => {
//     state.calendarDate = e.target.value;
//     render();
//   });
//   document.querySelectorAll("[data-cal-view]").forEach((btn) => btn.addEventListener("click", () => {
//     state.calendarView = btn.dataset.calView;
//     render();
//   }));
//   document.querySelectorAll("[data-event]").forEach((event) => event.addEventListener("click", () => {
//     state.modal = { type: "event", eventId: event.dataset.event };
//     render();
//   }));
//   if (currentUser().role !== "admin") return;
//   document.querySelectorAll("[data-drag-upload]").forEach((card) => card.addEventListener("pointerdown", startDrag));
// }

// function startDrag(e) {
//   if (e.target.closest("button")) return;
//   const card = e.currentTarget;
//   const ghost = card.cloneNode(true);
//   ghost.classList.add("drag-ghost");
//   document.body.appendChild(ghost);
//   state.drag = { uploadId: card.dataset.dragUpload, ghost };
//   moveDrag(e);
//   window.addEventListener("pointermove", moveDrag);
//   window.addEventListener("pointerup", endDrag, { once: true });
// }

// function moveDrag(e) {
//   if (!state.drag) return;
//   state.drag.ghost.style.left = `${e.clientX}px`;
//   state.drag.ghost.style.top = `${e.clientY}px`;
//   document.querySelectorAll(".day-cell.drop-target").forEach((c) => c.classList.remove("drop-target"));
//   document.elementFromPoint(e.clientX, e.clientY)?.closest(".day-cell")?.classList.add("drop-target");
// }

// function endDrag(e) {
//   window.removeEventListener("pointermove", moveDrag);
//   const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest(".day-cell");
//   const uploadId = state.drag?.uploadId;
//   state.drag?.ghost.remove();
//   state.drag = null;
//   document.querySelectorAll(".day-cell.drop-target").forEach((c) => c.classList.remove("drop-target"));
//   if (cell && uploadId) {
//     state.modal = { type: "schedule", uploadId, date: cell.dataset.date };
//     render();
//   }
// }

// function bindUploadModal() {
//   const form = document.getElementById("uploadForm");
//   if (!form) return;
//   const input = document.getElementById("fileInput");
//   const zone = document.getElementById("dropzone");
//   const pending = [];
//   const addFiles = async (files) => {
//     for (const [index, file] of Array.from(files).entries()) {
//       if (!["image/png", "image/jpeg", "video/mp4", "image/gif"].includes(file.type)) continue;
//       const platform = state.store.briefs.find((b) => b.id === state.modal.briefId).platforms[(pending.length + index) % state.store.briefs.find((b) => b.id === state.modal.briefId).platforms.length];
//       const url = URL.createObjectURL(file);
//       const dimensions = await readDimensions(file, url);
//       pending.push({ url, platform, dimensions, name: file.name, type: file.type });
//     }
//     renderPendingUploads(pending);
//   };
//   zone.addEventListener("click", () => input.click());
//   input.addEventListener("change", () => addFiles(input.files));
//   zone.addEventListener("dragover", (e) => {
//     e.preventDefault();
//     zone.style.borderColor = "var(--primary)";
//   });
//   zone.addEventListener("dragleave", () => {
//     zone.style.borderColor = "";
//   });
//   zone.addEventListener("drop", (e) => {
//     e.preventDefault();
//     zone.style.borderColor = "";
//     addFiles(e.dataTransfer.files);
//   });
//   form.addEventListener("submit", (e) => {
//     e.preventDefault();
//     if (!pending.length) return alert("Add at least one design file.");
//     const brief = state.store.briefs.find((b) => b.id === state.modal.briefId);
//     const existing = briefUpload(brief.id);
//     const upload = existing || { id: uid("up"), briefId: brief.id, files: [], designerNote: "", uploadedAt: "", status: "pending" };
//     upload.files = pending;
//     upload.designerNote = new FormData(form).get("designerNote");
//     upload.uploadedAt = new Date().toISOString();
//     upload.status = "pending";
//     if (!existing) state.store.uploads.unshift(upload);
//     brief.status = "uploaded";
//     users.filter((u) => u.role === "admin" || u.role === "editor").forEach((u) => addNotification(u.id, `${currentUser().name} uploaded designs for ${brief.title}`));
//     state.modal = null;
//     save();
//     render();
//   });
// }

// function renderPendingUploads(files) {
//   document.getElementById("uploadList").innerHTML = files.map((file, index) => `
//     <div class="upload-item">
//       ${assetHtml(file)}
//       <div>
//         <select class="select" data-upload-platform="${index}">${Object.keys(platformMeta).map((p) => `<option ${file.platform === p ? "selected" : ""}>${p}</option>`).join("")}</select>
//         <div class="meta" style="margin-top:7px"><span>${escapeHtml(file.name)}</span><span>${escapeHtml(file.dimensions)}</span></div>
//       </div>
//     </div>
//   `).join("");
//   document.querySelectorAll("[data-upload-platform]").forEach((select) => select.addEventListener("change", (e) => {
//     files[Number(select.dataset.uploadPlatform)].platform = e.target.value;
//   }));
// }

// function readDimensions(file, url) {
//   return new Promise((resolve) => {
//     if (file.type.startsWith("image")) {
//       const img = new Image();
//       img.onload = () => resolve(`${img.naturalWidth}x${img.naturalHeight}`);
//       img.onerror = () => resolve("unknown");
//       img.src = url;
//     } else if (file.type.startsWith("video")) {
//       const video = document.createElement("video");
//       video.onloadedmetadata = () => resolve(`${video.videoWidth}x${video.videoHeight}`);
//       video.onerror = () => resolve("unknown");
//       video.src = url;
//     } else {
//       resolve("unknown");
//     }
//   });
// }

// function bindScheduleModal() {
//   const form = document.getElementById("scheduleForm");
//   if (!form) return;
//   form.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const data = new FormData(form);
//     const platforms = data.getAll("platforms");
//     if (!platforms.length) return alert("Select at least one platform.");
//     const upload = state.store.uploads.find((u) => u.id === state.modal.uploadId);
//     const brief = state.store.briefs.find((b) => b.id === upload.briefId);
//     const event = { id: uid("ev"), uploadId: upload.id, scheduledDate: state.modal.date, scheduledTime: data.get("time"), platforms, status: "scheduled" };
//     state.store.events.push(event);
//     addNotification(state.currentUserId, `${brief.title} is scheduled for ${formatDate(event.scheduledDate)} on ${platforms.join(", ")}`);
//     state.modal = null;
//     save();
//     render();
//   });
// }

// function bindEventModal() {
//   const form = document.getElementById("eventForm");
//   if (!form) return;
//   form.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const action = e.submitter?.value;
//     const event = state.store.events.find((item) => item.id === state.modal.eventId);
//     if (action === "remove") {
//       state.store.events = state.store.events.filter((item) => item.id !== event.id);
//       state.modal = null;
//     } else if (action === "publish") {
//       event.status = "published";
//       state.modal = null;
//     } else if (action === "comments") {
//       state.selectedUploadId = event.uploadId;
//       state.modal = null;
//       state.view = "Review";
//     } else {
//       event.scheduledTime = new FormData(form).get("time");
//       state.modal = null;
//     }
//     save();
//     render();
//   });
// }

// function markRevised(uploadId) {
//   const upload = state.store.uploads.find((u) => u.id === uploadId);
//   const brief = state.store.briefs.find((b) => b.id === upload.briefId);
//   upload.status = "pending";
//   brief.status = "uploaded";
//   state.store.comments.push({ id: uid("c"), uploadId, authorId: state.currentUserId, authorRole: "designer", text: "Marked as revised.", type: "comment", createdAt: new Date().toISOString(), parentId: null });
//   users.filter((u) => u.role === "admin" || u.role === "editor").forEach((u) => addNotification(u.id, `${currentUser().name} submitted revision for ${brief.title}`));
//   save();
//   render();
// }

// function bindHashRoute() {
//   if (!location.hash.startsWith("#review-")) return;
//   const uploadId = location.hash.replace("#review-", "");
//   if (state.store.uploads.some((u) => u.id === uploadId) && currentUser().role !== "designer") {
//     state.selectedUploadId = uploadId;
//     state.view = "Review";
//     history.replaceState(null, "", location.pathname);
//   }
// }

// function ensureMount() {
//   let mount = document.getElementById("scheduler-root");
//   if (!mount) {
//     mount = document.createElement("div");
//     mount.id = "scheduler-root";
//     document.body.prepend(mount);
//   }
//   return mount;
// }

// function boot() {
//   ensureMount();
//   render();
// }

// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", boot, { once: true });
// } else {
//   boot();
// }
// })();
