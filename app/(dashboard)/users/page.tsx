"use client";

import { useState, useEffect } from "react";
import { useScheduler } from "../../context/SchedulerContext";
import { Plus, Edit2, Trash2, Lock, AlertTriangle, Users, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Input from "../../components/Input";
import Modal from "../../components/Modal";

export default function UsersPage() {
  const { store, updateStore, currentUser, users } = useScheduler();

  const [activeTab, setActiveTab] = useState<"directory" | "workload">("directory");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "editor",
    password: "",
    mobile: "",
  });

  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = currentUser.role === "admin";
  const tasks = store.briefs || [];

  const handleOpenForm = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: user.password || "",
        mobile: user.mobile || "",
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        role: "editor",
        password: "",
        mobile: "",
      });
    }
    setIsFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    setEditingUser(null);
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    if (editingUser) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ ...formData, mobile_number: formData.mobile })
        });
        const data = await res.json();
        if (data.status === "Success") {
          updateStore((prev: any) => ({
            ...prev,
            users: (prev.users || users).map((u: any) => u.id === editingUser.id ? { ...u, ...formData, avatar: formData.name.substring(0, 2).toUpperCase() } : u)
          }));
          handleCloseForm();
          toast.success("User updated successfully");
        } else {
          toast.error(data.message || "Failed to update user");
        }
      } catch (err) {
        toast.error("An error occurred while updating the user.");
      }
    } else {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ ...formData, mobile_number: formData.mobile })
        });
        const data = await res.json();
        if (data.status === "Success") {
          const newUser = {
            id: data.data.id.toString(),
            ...formData,
            avatar: formData.name.substring(0, 2).toUpperCase()
          };
          updateStore((prev: any) => ({
            ...prev,
            users: [...(prev.users || users), newUser]
          }));
          handleCloseForm();
          toast.success("New user created successfully");
        } else {
          toast.error(data.message || "Failed to create user");
        }
      } catch (err) {
        toast.error("An error occurred while creating the user.");
      }
    }
    setIsSubmitting(false);
  };

  const confirmDelete = (user: any) => {
    if (user.id === currentUser.id) {
      alert("You cannot delete your own active account.");
      return;
    }
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.status === "Success") {
        updateStore((prev: any) => ({
          ...prev,
          users: (prev.users || users).filter((u: any) => u.id !== userToDelete.id)
        }));
        toast.success("User deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (err) {
      toast.error("An error occurred while deleting the user.");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  useEffect(() => {
    const loadApiUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === "Success" && Array.isArray(data.data)) {
          const apiUsers = data.data.map((u: any) => ({
            id: u.id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            mobile: u.mobile_number,
            avatar: u.name ? u.name.substring(0, 2).toUpperCase() : "U",
          }));
          updateStore((prev: any) => prev ? { ...prev, users: apiUsers } : prev);
        }
      } catch (err) {
        console.error("Failed to load users from API", err);
      }
    };

    loadApiUsers();
  }, []);

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

  return (
    <div className="w-full mx-auto h-full flex flex-col px-6 pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users size={16} />
            </div>
            <h1 className="text-3xl font-extrabold m-0 text-text tracking-tight">Team Management</h1>
          </div>
          <p className="text-muted text-sm m-0 max-w-xl mt-2">
            Manage system access, roles, and track task progress across your team.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-panel-2 border border-line rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button className="btn primary flex items-center justify-center gap-2 px-5 py-2 h-9 shadow-sm hover:shadow-md transition-all whitespace-nowrap w-full sm:w-auto" onClick={() => handleOpenForm()}>
            <Plus size={18} /> <span className="font-semibold hidden sm:inline">Add Member</span>
          </button>
        </div>
      </div>

      <div className="bg-panel border border-strong-line rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-panel-2 border-b border-strong-line">
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-widest text-muted">User</th>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-widest text-muted">Role</th>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-widest text-muted">Contact Info</th>
                <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(() => {
                const allUsers = store.users || users;
                const filteredUsers = allUsers.filter((u: any) =>
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.role.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredUsers.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted">
                        No users found matching your search.
                      </td>
                    </tr>
                  );
                }

                return filteredUsers.map((u: any) => (
                  <tr key={u.id} className="border-b border-line last:border-0 hover:bg-panel-2/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-panel">
                          {u.avatar}
                        </div>
                        <div>
                          <strong className="block text-[15px] text-text font-bold leading-tight">{u.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 border rounded-md text-[10px] font-extrabold uppercase tracking-widest ${roleColors[u.role] || "bg-panel-2 border-line"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="truncate text-[13px] font-medium text-text">{u.email}</div>
                        {u.mobile ? (
                          <div className="text-[12px] text-muted">{u.mobile}</div>
                        ) : (
                          <div className="text-[11px] text-muted/50 italic">No phone</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2 transition-opacity">
                        <button className="icon-btn w-8 h-8 rounded-lg bg-panel-2 text-muted hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => handleOpenForm(u)} title="Edit user">
                          <Edit2 size={16} />
                        </button>
                        {u.id !== currentUser.id && (
                          <button className="icon-btn w-8 h-8 rounded-lg bg-panel-2 text-muted hover:text-danger hover:bg-danger/10 transition-colors" onClick={() => confirmDelete(u)} title="Delete user">
                            <Trash2 size={16} />
                          </button>
                        )}
                        {u.id === currentUser.id && (
                          <span className="text-[10px] uppercase font-bold text-muted bg-panel-2 px-2 py-1 rounded-md flex items-center">You</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        title={editingUser ? "Edit Team Member" : "Add New Member"}
      >
        <form onSubmit={handleSubmit} className="p-6 grid gap-5">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="John Doe"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="john@example.com"
            />

            <Input
              label="System Role"
              name="role"
              type="select"
              value={formData.role}
              onChange={handleChange}
              options={[
                { label: "Admin", value: "admin" },
                { label: "Editor", value: "editor" },
                { label: "Designer", value: "designer" },
                { label: "Developer", value: "developer" }
              ]}
            />
          </div>

          <Input
            label="Temporary Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!editingUser}
            placeholder="e.g. welcome123"
            hint="Provide this password to the user so they can login."
          />

          <Input
            label="Mobile Number"
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="+1 (234) 567-8900"
            hint="Optional. Used for SMS alerts."
          />

          <div className="flex justify-end gap-3 mt-2 pt-5 border-t border-line">
            <button type="button" disabled={isSubmitting} className="btn ghost px-5 font-semibold disabled:opacity-50" onClick={handleCloseForm}>Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn primary px-6 font-semibold shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
               {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
               {editingUser ? (isSubmitting ? "Saving..." : "Save Changes") : (isSubmitting ? "Creating..." : "Create User")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        maxWidth="max-w-sm"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-extrabold text-xl text-text mb-2">Remove User?</h3>
            <p className="text-sm text-muted m-0 leading-relaxed">
              Are you sure you want to permanently remove <strong className="text-text">{userToDelete?.name}</strong> from the system? They will lose all access immediately.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button disabled={isDeleting} className="btn ghost w-full font-semibold disabled:opacity-50" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button disabled={isDeleting} className="btn bg-danger text-white hover:bg-danger/90 border-transparent shadow-sm w-full font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" onClick={executeDelete}>
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
