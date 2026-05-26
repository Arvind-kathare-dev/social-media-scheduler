"use client";
import { useState, useMemo } from "react";
import { useScheduler } from "../../context/SchedulerContext";
import { Plus, Hash, X, Loader2, Sparkles, Lock, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, AlertCircle, Clock, LayoutList, Check, LayoutDashboard, Users, FileText, Search } from "lucide-react";
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
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

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

    const [viewingTask, setViewingTask] = useState<any>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const briefs = store.briefs || [];

    const paginatedBriefs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return briefs.slice(startIndex, startIndex + itemsPerPage);
    }, [briefs, currentPage]);

    const totalPages = Math.ceil(briefs.length / itemsPerPage);

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
        setViewingTask(task);
        setIsViewModalOpen(true);
    };

    const handleDelete = (taskId: string) => {
        setTaskToDelete(taskId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!taskToDelete) return;

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

            // Backend currently takes a single assignee, so we'll pass the first one, or stringify if modified backend
            const parsedAssignee = formData.assignedTo.length > 0 ? parseInt(formData.assignedTo[0]) : null;
            const assigned_to_value = isNaN(parsedAssignee!) ? null : parsedAssignee;

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
                        assignedTo: formData.assignedTo
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
                            assignedTo: formData.assignedTo,
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
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-6 pb-10">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold m-0 text-text tracking-tight flex items-center gap-3">
                        <LayoutList className="text-primary" size={28} />
                        Task Management
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        Manage all project briefs, edit assignments, or delete obsolete tasks.
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn primary px-5 py-2.5 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap"
                >
                    <Plus size={18} /> New Task
                </button>
            </div>

            <div className="bg-panel border border-line rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-panel-2/50 text-xs uppercase text-muted font-bold tracking-wider border-b border-line">
                            <tr>
                                <th className="px-6 py-4 font-extrabold">Task Name</th>
                                <th className="px-6 py-4 font-extrabold">Assignee</th>
                                <th className="px-6 py-4 font-extrabold">Status</th>
                                <th className="px-6 py-4 font-extrabold">Priority</th>
                                <th className="px-6 py-4 font-extrabold">Due Date</th>
                                <th className="px-6 py-4 font-extrabold text-right">Actions</th>
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
                                        <tr key={task.id} className="hover:bg-panel-2/30 transition-colors group">
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

                {totalPages > 1 && (
                    <div className="p-4 border-t border-line flex items-center justify-between bg-panel-2/30">
                        <span className="text-xs text-muted font-medium">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, briefs.length)} of {briefs.length} entries
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-line bg-panel hover:bg-panel-2 disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="text-sm font-bold text-text px-2">{currentPage} / {totalPages}</div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-line bg-panel hover:bg-panel-2 disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
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
                                                            className={`flex items-center gap-3 px-3 py-2.5 mx-2 my-1 rounded-lg cursor-pointer transition-all border ${
                                                                isSelected 
                                                                ? 'bg-primary/5 border-primary/20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' 
                                                                : 'border-transparent hover:bg-panel-2 hover:border-line/50'
                                                            }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                                                                isSelected ? 'bg-primary text-white shadow-sm' : 'bg-panel-2 text-muted border border-line'
                                                            }`}>
                                                                {u.avatar || u.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span className={`text-[13px] font-medium truncate leading-tight ${
                                                                    isSelected ? 'text-primary' : 'text-text'
                                                                }`}>{u.name}</span>
                                                                <span className="text-[11px] text-muted capitalize truncate mt-0.5">{u.role}</span>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                                                isSelected ? 'bg-primary text-white shadow-sm scale-100' : 'border border-strong-line bg-transparent scale-90 opacity-40'
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
                                        <label className="text-text text-[13px] font-semibold">Is this a Social Media Post?</label>
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

            {/* VIEW MODAL (SlideOver) */}
            <SlideOver isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} width="max-w-[700px] w-full">
                {viewingTask && (
                    <div className="flex flex-col h-full bg-panel">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                            <h2 className="text-xl font-bold m-0 text-text">Task Details</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-panel-2 text-muted transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 md:p-8 overflow-y-auto">
                            <h1 className="text-3xl font-black text-text mb-6 tracking-tight">{viewingTask.title}</h1>
                            <div className="grid grid-cols-[120px_1fr] gap-y-4 mb-8 text-sm">
                                <div className="text-muted font-medium h-8 flex items-center">Assignee</div>
                                <div className="min-h-8 flex items-center font-bold text-text py-1">
                                    {(() => {
                                        // Prefer direct backend name fields first
                                        if (viewingTask.assignedToName) {
                                            return (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-panel-2 border border-line text-xs">
                                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                                                        {viewingTask.assignedToName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold">{viewingTask.assignedToName}</span>
                                                    {viewingTask.assignedToEmail && <span className="text-muted ml-1">({viewingTask.assignedToEmail})</span>}
                                                </span>
                                            );
                                        }
                                        const assignedIds = Array.isArray(viewingTask.assignedTo) ? viewingTask.assignedTo : (viewingTask.assignedTo ? [viewingTask.assignedTo] : []);
                                        const assignees = assignedIds.map((id: string) => users.find((u: any) => u.id === id)).filter(Boolean);
                                        if (assignees.length === 0) return <span className="text-muted">Unassigned</span>;
                                        return (
                                            <div className="flex flex-wrap gap-2">
                                                {assignees.map((a: any) => (
                                                    <span key={a.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-panel-2 border border-line text-xs">
                                                        <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-bold">
                                                            {a.avatar || "U"}
                                                        </div>
                                                        {a.name}
                                                    </span>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="text-muted font-medium h-8 flex items-center">Due Date</div>
                                <div className="h-8 flex items-center font-bold text-text gap-1.5"><Clock size={16} className="text-muted" />{formatDate(viewingTask.dueDate)}</div>

                                <div className="text-muted font-medium h-8 flex items-center">Status</div>
                                <div className="h-8 flex items-center"><span className={`px-2 py-1 rounded text-[11px] font-extrabold uppercase border ${getStatusColor(viewingTask.status)}`}>{viewingTask.status.replace("_", " ")}</span></div>

                                <div className="text-muted font-medium h-8 flex items-center">Priority</div>
                                <div className="h-8 flex items-center">
                                    <span className={`px-2 py-1 rounded text-[11px] font-extrabold uppercase border ${viewingTask.priority === "Urgent" ? "bg-danger/10 text-danger border-danger/20" :
                                            viewingTask.priority === "Low" ? "bg-muted/10 text-muted border-line" :
                                                "bg-warning/10 text-warning border-warning/20"
                                        }`}>{viewingTask.priority}</span>
                                </div>

                                {viewingTask.tone && (
                                    <>
                                        <div className="text-muted font-medium h-8 flex items-center">Tone</div>
                                        <div className="h-8 flex items-center font-bold text-text">{viewingTask.tone}</div>
                                    </>
                                )}

                                <div className="text-muted font-medium min-h-8 flex items-center py-1">Platforms</div>
                                <div className="flex flex-wrap items-center gap-1.5 min-h-8 py-1">
                                    {viewingTask.platforms?.length > 0 ? viewingTask.platforms.map((p: string) => (
                                        <span key={p} className="inline-flex items-center rounded-md px-2 py-1 text-white text-[11px] font-bold shadow-sm bg-primary">{p}</span>
                                    )) : <span className="text-muted">None selected</span>}
                                </div>

                                {viewingTask.hashtags?.length > 0 && (
                                    <>
                                        <div className="text-muted font-medium min-h-8 flex items-center py-1">Hashtags</div>
                                        <div className="flex flex-wrap items-center gap-1.5 min-h-8 py-1">
                                            {viewingTask.hashtags.map((h: string) => (
                                                <span key={h} className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-md">{h}</span>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="text-muted font-medium h-8 flex items-center">Created By</div>
                                <div className="h-8 flex items-center text-text text-sm font-semibold">
                                    {viewingTask.createdByName || viewingTask.createdBy || "—"}
                                </div>

                                <div className="text-muted font-medium h-8 flex items-center">Created</div>
                                <div className="h-8 flex items-center text-text text-sm">
                                    {new Date(viewingTask.createdAt || Date.now()).toLocaleString()}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="font-bold text-base text-text mb-3">Content Copy</h3>
                                <div className="bg-panel-2 border border-line rounded-lg p-4">
                                    <p className="text-[15px] whitespace-pre-wrap leading-relaxed m-0 font-medium text-text">{viewingTask.copy}</p>
                                </div>
                            </div>

                            {viewingTask.notes && viewingTask.notes.replace(/<[^>]*>/g, '').trim() && (
                                <div className="mb-8">
                                    <h3 className="font-bold text-base text-text mb-3 flex items-center gap-2">Notes for Assignee <AlertCircle size={14} className="text-warning" /></h3>
                                    <div className="bg-panel border border-line rounded-xl overflow-hidden">
                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                            .notes-preview img {
                                                max-width: 100%;
                                                height: auto;
                                                border-radius: 0.5rem;
                                                margin: 0.75rem 0;
                                                display: block;
                                            }
                                            .notes-preview h1 { font-size: 1.4rem; font-weight: 800; margin: 0.75rem 0 0.5rem; }
                                            .notes-preview h2 { font-size: 1.15rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
                                            .notes-preview p { margin: 0.25rem 0; }
                                            .notes-preview ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
                                            .notes-preview ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
                                            .notes-preview li { margin: 0.2rem 0; }
                                            .notes-preview strong { font-weight: 700; }
                                            .notes-preview em { font-style: italic; }
                                            .notes-preview u { text-decoration: underline; }
                                            .notes-preview s { text-decoration: line-through; }
                                            .notes-preview pre { background: rgba(0,0,0,0.2); border-radius: 0.4rem; padding: 0.75rem 1rem; font-family: monospace; font-size: 0.85em; white-space: pre-wrap; margin: 0.5rem 0; }
                                            .notes-preview code { background: rgba(0,0,0,0.2); border-radius: 0.25rem; padding: 0.1em 0.3em; font-family: monospace; font-size: 0.85em; }
                                            .notes-preview blockquote { border-left: 3px solid var(--primary, #6366f1); padding-left: 1rem; margin: 0.5rem 0; opacity: 0.8; }
                                            .notes-preview a { color: var(--primary, #6366f1); text-decoration: underline; }
                                            .notes-preview hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 0.75rem 0; }
                                        `}} />
                                        <div
                                            className="notes-preview text-sm text-text leading-relaxed p-5"
                                            dangerouslySetInnerHTML={{ __html: viewingTask.notes }}
                                        />
                                    </div>
                                </div>
                            )}

                            {viewingTask.visualReference && (
                                <div className="mb-8">
                                    <h3 className="font-bold text-base text-text mb-3">Visual Reference</h3>
                                    <div className="flex">
                                        <a
                                            href={viewingTask.visualReference}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-lg border border-line bg-panel-2 hover:bg-line/30 transition-colors max-w-sm"
                                        >
                                            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <span className="font-bold">URL</span>
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="text-sm font-bold text-text truncate">External Link</div>
                                                <div className="text-xs text-primary hover:underline truncate mt-0.5">{viewingTask.visualReference}</div>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            )}
                            <TaskComments taskId={viewingTask.id} />
                        </div>
                    </div>
                )}
            </SlideOver>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Task" maxWidth="max-w-md">
                <div className="p-6">
                    <div className="flex flex-col items-center text-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center">
                            <Trash2 size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-text mb-2">Are you sure?</h3>
                            <p className="text-muted text-sm">
                                Do you really want to delete this task? This action cannot be undone and will remove it from everyone's board.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 btn bg-panel hover:bg-panel-2 border border-line text-text font-semibold py-2.5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 btn bg-danger hover:bg-danger/90 text-white font-semibold py-2.5 shadow-sm"
                        >
                            Delete Task
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
}
