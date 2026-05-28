"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useScheduler } from "../../context/SchedulerContext";
import { Plus, Hash, X, Loader2, Sparkles, Lock, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, AlertCircle, AlertTriangle, Clock, LayoutList, Check, LayoutDashboard, Users, FileText, Search } from "lucide-react";
import Input from "../../components/Input";
import Modal from "../../components/Modal";
import SlideOver from "../../components/SlideOver";
import RichTextEditor from "../../components/RichTextEditor";
import TaskComments from "../../components/TaskComments";
import toast from "react-hot-toast";

const tones = ["Professional", "Casual", "Witty", "Inspirational", "Promotional", "Educational"];
const priorities = ["Low", "Normal", "Urgent"];
const platformOptions = ["Instagram Feed", "Instagram Story/Reel", "Facebook", "X (Twitter)", "LinkedIn", "Pinterest", "YouTube Shorts"];

export default function TasksPage() {
    const { store, updateStore, currentUser, users } = useScheduler();
    const isAllowed = currentUser.role === "admin";

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();

    // Form states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [hashtagInput, setHashtagInput] = useState("");
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [assigneeRole, setAssigneeRole] = useState("designer");
    const [assigneeSearch, setAssigneeSearch] = useState("");
    const [isPost, setIsPost] = useState(true);

    const [formData, setFormData] = useState({
        title: "", tone: tones[0], copy: "", visualReference: "",
        dueDate: "", assignedTo: [] as string[], priority: priorities[1], notes: ""
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const briefs = store.briefs || [];

    const paginatedBriefs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return briefs.slice(startIndex, startIndex + itemsPerPage);
    }, [briefs, currentPage]);

    const totalPages = Math.ceil(briefs.length / itemsPerPage);

    // Auto-open task if taskId is present in URL
    useEffect(() => {
        const taskIdFromUrl = searchParams.get("taskId");
        if (taskIdFromUrl && briefs.length > 0) {
            const task = briefs.find((b: any) => String(b.id) === taskIdFromUrl);
            if (task) {
                router.push(`/tasks/${task.id}`);
            }
            // Remove the query param to avoid re-opening on reload or navigation
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams, briefs]);

    const resetForm = () => {
        setFormData({
            title: "", tone: tones[0], copy: "", visualReference: "",
            dueDate: "", assignedTo: [], priority: priorities[1], notes: ""
        });
        setPlatforms([]);
        setHashtags([]);
        setAssigneeRole("designer");
        setAssigneeSearch("");
        setIsPost(true);
        setEditingTaskId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsFormModalOpen(true);
    };

    const openEditModal = (task: any) => {
        // Find assigned user's role if assignedTo exists
        const multiAssignees = Array.isArray(task.assignedToMulti) && task.assignedToMulti.length > 0
            ? task.assignedToMulti.map(String)
            : [];
        const assignedIds = multiAssignees.length > 0
            ? multiAssignees
            : (task.assignedTo ? [String(task.assignedTo)] : []);

        const assignedUserRole = assignedIds.length > 0 ? users.find((u: any) => u.id === assignedIds[0])?.role || "designer" : "designer";

        setFormData({
            title: task.title || "",
            tone: task.tone || tones[0],
            copy: task.copy || "",
            visualReference: task.visualReference || "",
            dueDate: task.dueDate || "",
            assignedTo: assignedIds,
            priority: task.priority || priorities[1],
            notes: task.notes || ""
        });
        setAssigneeRole(assignedUserRole);
        setIsPost(task.platforms && task.platforms.length > 0);
        setPlatforms(task.platforms || []);
        setHashtags(task.hashtags || []);
        setEditingTaskId(task.id);
        setIsFormModalOpen(true);
    };

    const openViewModal = (task: any) => {
        router.push(`/tasks/${task.id}`);
    };

    const handleDelete = (taskId: string) => {
        setTaskToDelete(taskId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!taskToDelete) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;

            // Try API delete if applicable, otherwise optimistic UI
            if (token) {
                await fetch(`${apiUrl}/tasks/${taskToDelete}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });
            }

            updateStore((prev: any) => ({
                ...prev,
                briefs: prev.briefs.filter((b: any) => b.id !== taskToDelete)
            }));
            toast.success("Task deleted successfully.");

            // Handle pagination edge case when deleting last item on page
            if (paginatedBriefs.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }
        } catch (err) {
            toast.error("Failed to delete task.");
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setTaskToDelete(null);
        }
    };

    const handleChange = (e: any) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const toggleAssignee = (id: string) => {
        setFormData(prev => {
            const arr = prev.assignedTo;
            if (arr.includes(id)) {
                return { ...prev, assignedTo: arr.filter(x => x !== id) };
            } else {
                return { ...prev, assignedTo: [...arr, id] };
            }
        });
    };

    const handleHashtagKeyDown = (e: any) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const val = hashtagInput.trim();
            if (val) {
                const tag = val.startsWith("#") ? val : `#${val}`;
                if (!hashtags.includes(tag)) setHashtags([...hashtags, tag]);
            }
            setHashtagInput("");
        }
    };

    const removeHashtag = (tagToRemove: string) => {
        setHashtags(hashtags.filter(t => t !== tagToRemove));
    };

    const handlePlatformChange = (platform: string) => {
        setPlatforms(prev =>
            prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
        );
    };

    const filteredAssignees = useMemo(() => {
        return users.filter((u: any) =>
            u.role === assigneeRole &&
            u.name.toLowerCase().includes(assigneeSearch.toLowerCase())
        );
    }, [users, assigneeRole, assigneeSearch]);

    const handleSelectAllAssignees = () => {
        if (filteredAssignees.length === 0) return;

        const filteredIds = filteredAssignees.map((u: any) => u.id);
        const allFilteredSelected = filteredIds.every((id: string) => formData.assignedTo.includes(id));

        if (allFilteredSelected) {
            setFormData(prev => ({
                ...prev,
                assignedTo: prev.assignedTo.filter(id => !filteredIds.includes(id))
            }));
        } else {
            setFormData(prev => {
                const newAssigned = new Set([...prev.assignedTo, ...filteredIds]);
                return { ...prev, assignedTo: Array.from(newAssigned) };
            });
        }
    };

    const allFilteredSelected = filteredAssignees.length > 0 && filteredAssignees.every((u: any) => formData.assignedTo.includes(u.id));

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (assigneeRole === "designer" && isPost && platforms.length === 0) {
            toast.error("Select at least one platform for the post.");
            return;
        }
        if (!formData.dueDate) {
            toast.error("Due date is required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;

            const finalPlatforms = (assigneeRole === "designer" && isPost) ? platforms : [];
            const finalHashtags = (assigneeRole === "designer" && isPost) ? hashtags : [];

            // Pass the string UUID directly
            const assigned_to_value = formData.assignedTo.length > 0 ? formData.assignedTo[0] : null;
            const payload = {
                title: formData.title,
                description: formData.copy,
                priority: formData.priority.toLowerCase(),
                assigned_to: assigned_to_value,
                assigned_to_multi: formData.assignedTo, // Fallback if backend supports it
                due_date: formData.dueDate,
                tone: formData.tone,
                hashtags: finalHashtags,
                platforms: finalPlatforms,
                visual_reference: formData.visualReference,
                notes: formData.notes,
                status: "todo"
            };

            if (editingTaskId) {
                // Edit flow
                if (token) {
                    await fetch(`${apiUrl}/tasks/${editingTaskId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify(payload)
                    });
                }
                updateStore((prev: any) => ({
                    ...prev,
                    briefs: prev.briefs.map((b: any) => b.id === editingTaskId ? {
                        ...b,
                        ...formData,
                        copy: formData.copy,
                        platforms: finalPlatforms,
                        hashtags: finalHashtags,
                        assignedTo: formData.assignedTo.length > 0 ? formData.assignedTo[0] : "",
                        assignedToMulti: formData.assignedTo
                    } : b)
                }));
                toast.success("Task updated successfully!");
            } else {
                // Create flow
                if (token) {
                    const res = await fetch(`${apiUrl}/tasks`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (res.ok && data.task) {
                        const newBrief = {
                            id: data.task.id.toString(),
                            title: data.task.title,
                            copy: data.task.description || "",
                            hashtags: data.task.hashtags ? (typeof data.task.hashtags === 'string' ? JSON.parse(data.task.hashtags) : data.task.hashtags) : [],
                            platforms: finalPlatforms,
                            tone: data.task.tone || "",
                            notes: data.task.notes || "",
                            dueDate: data.task.due_date ? new Date(data.task.due_date).toISOString().slice(0, 10) : "",
                            assignedTo: formData.assignedTo.length > 0 ? formData.assignedTo[0] : "",
                            assignedToMulti: formData.assignedTo,
                            assignedToName: "",
                            assignedToEmail: "",
                            priority: data.task.priority === "high" || data.task.priority === "urgent" ? "Urgent" : (data.task.priority === "low" ? "Low" : "Normal"),
                            createdBy: data.task.created_by ? data.task.created_by.toString() : "",
                            createdByName: "",
                            createdAt: data.task.created_at || new Date().toISOString(),
                            status: "todo",
                            visualReference: data.task.visual_reference || ""
                        };
                        updateStore((prev: any) => ({ ...prev, briefs: [newBrief, ...prev.briefs] }));
                        toast.success("Task successfully created!");
                    } else {
                        toast.error(data.error || "Failed to create task");
                        return;
                    }
                }
            }
            setIsFormModalOpen(false);
            resetForm();
        } catch (err) {
            toast.error(editingTaskId ? "Failed to update task" : "Failed to create task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "todo": return "bg-panel-2 text-muted border-line";
            case "in_progress": return "bg-primary/10 text-primary border-primary/20";
            case "qa": return "bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/30";
            case "revision": return "bg-warning/10 text-warning border-warning/30";
            case "uploaded": return "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/30";
            case "approved":
            case "completed": return "bg-ok/10 text-ok border-ok/30";
            default: return "bg-panel-2 text-muted border-line";
        }
    };

    const formatDate = (value: string) => {
        if (!value) return "";
        return new Date(`${value}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    };

    if (!isAllowed) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20 text-muted">
                <Lock className="mx-auto mb-4" size={48} />
                <h2 className="text-xl font-bold text-text">Access Denied</h2>
                <p>You do not have permission to view or manage briefs.</p>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto h-full flex flex-col gap-6 px-6 pb-10">

            {/* Header */}
            <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-panel p-5 sm:p-8 rounded-3xl border border-line shadow-sm relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                <div className="relative z-10 w-full lg:w-auto flex-1">
                    <h1 className="text-2xl sm:text-3xl font-black m-0 text-text tracking-tight flex flex-wrap items-center gap-3">
                        <div className="p-2 sm:p-2.5 bg-primary/10 rounded-2xl text-primary shrink-0">
                            <LayoutList size={24} className="fill-primary/20" />
                        </div>
                        <span className="truncate max-w-full">Task Management</span>
                    </h1>
                    <p className="text-muted text-sm mt-3 max-w-xl font-medium leading-relaxed">
                        Manage all project briefs, edit assignments, or delete obsolete tasks.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto relative z-10">
                    <button
                        onClick={openCreateModal}
                        className="w-full sm:w-auto btn primary px-5 py-2.5 text-sm font-bold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                    >
                        <Plus size={18} /> New Task
                    </button>
                </div>
            </div>

            <div className="bg-panel border border-strong-line rounded-2xl shadow-sm overflow-hidden flex flex-col mb-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-panel-2 border-b border-strong-line text-[10px] uppercase text-muted font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4 w-[35%]">Task Name</th>
                                <th className="px-6 py-4">Assignee</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {paginatedBriefs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-muted">
                                        No tasks found. Click "New Task" to create one.
                                    </td>
                                </tr>
                            ) : (
                                paginatedBriefs.map((task: any) => {
                                    // Parse assigned users
                                    const multiAssignees = Array.isArray(task.assignedToMulti) && task.assignedToMulti.length > 0
                                        ? task.assignedToMulti.map(String)
                                        : [];
                                    const assignedIds = multiAssignees.length > 0
                                        ? multiAssignees
                                        : (task.assignedTo ? [String(task.assignedTo)] : []);
                                    const assignees = assignedIds.map((id: string) => users.find((u: any) => u.id === id)).filter(Boolean);

                                    return (
                                        <tr key={task.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-4 font-semibold text-text max-w-[250px] truncate">
                                                {task.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    {assignees.length > 0 ? (
                                                        <div className="flex -space-x-2">
                                                            {assignees.map((a: any, i: number) => (
                                                                <div key={a.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-panel z-10" style={{ zIndex: 10 - i }} title={a.name}>
                                                                    {a.avatar || "U"}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="font-semibold text-muted text-xs">Unassigned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-[5px] text-[10px] font-extrabold uppercase tracking-wider border ${getStatusColor(task.status)}`}>
                                                    {task.status.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-[5px] text-[10px] font-extrabold uppercase tracking-wider ${task.priority === 'Low' ? 'bg-ok/10 text-ok border border-ok/20' :
                                                    task.priority === 'Urgent' ? 'bg-danger/10 text-danger border border-danger/20' :
                                                        'bg-panel-2 text-text border border-line'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-muted font-medium">
                                                {formatDate(task.dueDate) || "No date"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openViewModal(task)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(task)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text hover:bg-panel-2 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(task.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-danger hover:bg-danger/10 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between py-4 px-6 border-t border-line bg-panel-2/30 gap-4">
                  <div className="text-xs font-extrabold text-muted">
                    Showing <span className="text-text">{paginatedBriefs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-text">{Math.min(currentPage * itemsPerPage, briefs.length)}</span> of <span className="text-text">{briefs.length}</span> tasks
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <button 
                      className="btn ghost h-9 px-3 border border-line bg-panel hover:bg-panel-2 hover:border-strong-line transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 text-xs font-bold"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <div className="text-xs font-black text-text px-3 bg-panel border border-line rounded-lg h-9 flex items-center shadow-sm">
                      {currentPage} / {totalPages || 1}
                    </div>
                    <button 
                      className="btn ghost h-9 px-3 border border-line bg-panel hover:bg-panel-2 hover:border-strong-line transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 text-xs font-bold"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
            </div>

            {/* CREATE / EDIT MODAL */}
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingTaskId ? "Edit Task Brief" : "Create New Task"} maxWidth="max-w-3xl">
                <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto max-h-[85vh] relative bg-panel">

                    <div className="p-6 sm:p-8 space-y-10">
                        {/* SECTION: Overview */}
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-[15px] font-semibold text-text">Task Details</h3>
                                <p className="text-[13px] text-muted mt-0.5">Core information and copy for this task.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-5">
                                <Input label="Task Title" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Summer Campaign Teaser" />
                                <Input label="Content Copy" name="copy" type="textarea" value={formData.copy} onChange={handleChange} required placeholder="Write the exact text, captions, or descriptions for the post..." rows={3} />
                            </div>
                        </div>

                        <hr className="border-line" />

                        {/* SECTION: Assignment & Scheduling */}
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-[15px] font-semibold text-text">Assignment & Schedule</h3>
                                <p className="text-[13px] text-muted mt-0.5">Assign team members and set deadlines.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <Input
                                        label="Role (Filter Users)"
                                        name="assigneeRole"
                                        type="select"
                                        value={assigneeRole}
                                        onChange={(e) => setAssigneeRole(e.target.value)}
                                        options={[
                                            { label: "Designer", value: "designer" },
                                            { label: "Developer", value: "developer" },
                                            { label: "Editor", value: "editor" }
                                        ]}
                                    />
                                    <Input label="Due Date" type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required />
                                    <Input label="Priority" name="priority" type="select" value={formData.priority} onChange={handleChange} options={priorities.map(p => ({ label: p, value: p }))} />
                                </div>

                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-text text-[13px] font-semibold">Assign To (Multi-Select)</label>
                                        {filteredAssignees.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleSelectAllAssignees}
                                                className="text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
                                            >
                                                {allFilteredSelected ? "Deselect All" : "Select All"}
                                            </button>
                                        )}
                                    </div>
                                    <div className="border border-line rounded-md bg-transparent flex-1 flex flex-col min-h-[200px] max-h-[260px]">
                                        <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-panel-2/30">
                                            <Search size={14} className="text-muted shrink-0" />
                                            <input
                                                type="text"
                                                value={assigneeSearch}
                                                onChange={(e) => setAssigneeSearch(e.target.value)}
                                                placeholder={`Search ${assigneeRole}s...`}
                                                className="w-full bg-transparent border-none outline-none text-[13px] text-text placeholder:text-muted/70"
                                            />
                                            {assigneeSearch && (
                                                <button type="button" onClick={() => setAssigneeSearch("")} className="text-muted hover:text-text">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="overflow-y-auto py-1 flex-1">
                                            {filteredAssignees.length === 0 ? (
                                                <div className="text-[13px] text-muted p-6 text-center">
                                                    {assigneeSearch ? "No users match your search." : `No ${assigneeRole}s found.`}
                                                </div>
                                            ) : (
                                                filteredAssignees.map((u: any) => {
                                                    const isSelected = formData.assignedTo.includes(u.id);
                                                    return (
                                                        <div
                                                            key={u.id}
                                                            onClick={() => toggleAssignee(u.id)}
                                                            className={`flex items-center gap-3 px-3 py-2.5 mx-2 my-1 rounded-lg cursor-pointer transition-all border ${isSelected
                                                                ? 'bg-primary/5 border-primary/20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                                                                : 'border-transparent hover:bg-panel-2 hover:border-line/50'
                                                                }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${isSelected ? 'bg-primary text-white shadow-sm' : 'bg-panel-2 text-muted border border-line'
                                                                }`}>
                                                                {u.avatar || u.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span className={`text-[13px] font-medium truncate leading-tight ${isSelected ? 'text-primary' : 'text-text'
                                                                    }`}>{u.name}</span>
                                                                <span className="text-[11px] text-muted capitalize truncate mt-0.5">{u.role}</span>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-primary text-white shadow-sm scale-100' : 'border border-strong-line bg-transparent scale-90 opacity-40'
                                                                }`}>
                                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {assigneeRole === "designer" && (
                            <>
                                <hr className="border-line" />
                                {/* SECTION: Creative Brief */}
                                <div className="space-y-5">
                                    <div>
                                        <h3 className="text-[15px] font-semibold text-text">Creative Brief</h3>
                                        <p className="text-[13px] text-muted mt-0.5">Platform specific details and formatting.</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <label className="text-text text-[13px] font-semibold">Is this a UI/UX Task?</label>
                                        <div className="inline-flex p-1 bg-panel-2 rounded-lg border border-line">
                                            <label className={`cursor-pointer px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${isPost ? 'bg-panel text-text shadow-sm ring-1 ring-black/5' : 'text-muted hover:text-text'}`}>
                                                <input type="radio" name="isPost" checked={isPost === true} onChange={() => setIsPost(true)} className="hidden" />
                                                Yes
                                            </label>
                                            <label className={`cursor-pointer px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${!isPost ? 'bg-panel text-text shadow-sm ring-1 ring-black/5' : 'text-muted hover:text-text'}`}>
                                                <input type="radio" name="isPost" checked={isPost === false} onChange={() => setIsPost(false)} className="hidden" />
                                                No
                                            </label>
                                        </div>
                                    </div>

                                    {isPost && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                            <div className="md:col-span-2">
                                                <label className="block text-text text-[13px] font-semibold mb-2">Target Platforms</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {platformOptions.map(p => (
                                                        <button
                                                            key={p} type="button" onClick={() => handlePlatformChange(p)}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all border ${platforms.includes(p) ? "bg-text text-panel border-transparent shadow-sm" : "bg-transparent text-muted border-line hover:border-strong-line hover:text-text"}`}
                                                        >
                                                            {platforms.includes(p) && <Check size={14} className="shrink-0" />} {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-text text-[13px] font-semibold mb-2">Hashtags</label>
                                                <div className="flex flex-wrap gap-2 min-h-[40px] items-center border border-strong-line rounded-md p-1 bg-transparent focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                                    {hashtags.map(tag => (
                                                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-panel-2 rounded text-text text-[13px] font-medium border border-line">
                                                            {tag}
                                                            <button type="button" onClick={() => removeHashtag(tag)} className="text-muted hover:text-text ml-0.5 transition-colors">
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                    <input
                                                        className="flex-1 min-w-[150px] bg-transparent outline-none px-2 py-1 text-[13px] text-text placeholder:text-muted/60"
                                                        value={hashtagInput} onChange={e => setHashtagInput(e.target.value)} onKeyDown={handleHashtagKeyDown} placeholder="Type hashtag and press Enter..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <hr className="border-line" />

                        {/* SECTION: Additional Details */}
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-[15px] font-semibold text-text">Additional Details</h3>
                                <p className="text-[13px] text-muted mt-0.5">References, tone, and extra notes.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Desired Tone" name="tone" type="select" value={formData.tone} onChange={handleChange} options={tones.map(t => ({ label: t, value: t }))} />
                                <Input label="Visual Reference URL" name="visualReference" value={formData.visualReference} onChange={handleChange} placeholder="https://drive.google.com/..." />

                                <div className="md:col-span-2 pt-2">
                                    <label className="block text-text text-[13px] font-semibold mb-2">Notes for Assignee</label>
                                    <RichTextEditor
                                        value={formData.notes}
                                        onChange={(val) => setFormData({ ...formData, notes: val })}
                                        placeholder="Any specific instructions, links, or images..."
                                        users={users}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-line bg-panel flex items-center justify-end gap-3 sticky bottom-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.03)]">
                        <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-5 py-2 text-[13px] font-medium text-text hover:bg-panel-2 rounded-md transition-colors border border-transparent">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="btn primary px-6 py-2 rounded-md shadow-sm hover:shadow transition-all flex items-center gap-2 text-[13px] font-medium disabled:opacity-70">
                            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editingTaskId ? "Save Changes" : "Create Task"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion" maxWidth="max-w-sm">
                <div className="p-6 sm:p-8">
                    <div className="flex flex-col items-center text-center mb-8 relative">
                        <div className="absolute inset-0 bg-danger/5 rounded-full blur-2xl -z-10 w-24 h-24 mx-auto top-0"></div>
                        <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6 ring-8 ring-danger/5">
                            <AlertTriangle size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-black text-2xl text-text mb-3 tracking-tight">Delete Task?</h3>
                        <p className="text-[15px] text-muted m-0 leading-relaxed max-w-[260px]">
                            Are you sure you want to permanently delete this task? This action cannot be undone and will remove it from everyone's board.
                        </p>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                        <button disabled={isDeleting} className="btn ghost flex-1 h-11 font-bold disabled:opacity-50 border border-line hover:bg-panel-2 rounded-xl transition-all" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                        <button disabled={isDeleting} className="btn flex-1 h-11 bg-danger text-white hover:bg-danger/90 hover:shadow-md hover:shadow-danger/20 border-transparent rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all" onClick={confirmDelete}>
                            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={16} />}
                            {isDeleting ? "Deleting..." : "Yes, Delete"}
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
}
