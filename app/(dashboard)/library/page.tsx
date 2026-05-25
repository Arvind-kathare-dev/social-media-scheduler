"use client";

import { useState, useMemo } from "react";
import { useScheduler } from "../../context/SchedulerContext";
import { Download, Copy, Check, Filter, Search, Image as ImageIcon, ExternalLink, Calendar as CalendarIcon, Tag, Clock, Folder, FolderPlus, ArrowLeft, Users as UsersIcon, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LibraryPage() {
  const { store, users, updateStore, currentUserId } = useScheduler();
  const [platformFilter, setPlatformFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ title: "", fileUrl: "", platform: "Instagram Feed", copy: "", folderId: "" });

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderData, setFolderData] = useState({ name: "", assignedTo: [] as string[] });
  const [folderAssigneeRole, setFolderAssigneeRole] = useState("designer");

  const folders = store.folders || [];
  const isAdmin = store.users?.find((u: any) => u.id === currentUserId)?.role === "admin" || users.find((u: any) => u.id === currentUserId)?.role === "admin";

  const STANDARD_PLATFORMS = [
    "Instagram Feed",
    "Instagram Story/Reel",
    "Facebook",
    "X (Twitter)",
    "LinkedIn",
    "Pinterest",
    "YouTube Shorts"
  ];
  
  const libraryItems = useMemo(() => {
    const items: any[] = [];
    const uploads = store.uploads || [];
    const briefs = store.briefs || [];

    // 1. Standalone Uploads
    uploads.filter((u: any) => !u.briefId).forEach((u: any) => {
      items.push({
        id: u.id,
        title: u.title || u.files?.[0]?.name || "Asset",
        copy: u.copy || "",
        platforms: u.files?.map((f: any) => f.platform) || ["General"],
        hashtags: [],
        dueDate: u.uploadedAt,
        authorId: u.authorId || currentUserId,
        files: u.files || [],
        isDirect: true,
        visualReference: "",
        folderId: u.folderId || null
      });
    });

    // 2. Uploads from approved/completed briefs
    briefs.filter((b: any) => b.status === 'approved' || b.status === 'completed').forEach((b: any) => {
      const bUploads = uploads.filter((u: any) => u.briefId === b.id);
      if (bUploads.length > 0) {
        const latest = bUploads[0];
        items.push({
          id: b.id,
          title: b.title,
          copy: b.copy,
          platforms: b.platforms,
          hashtags: b.hashtags,
          dueDate: b.dueDate,
          authorId: b.assignedTo,
          files: latest.files || [],
          isDirect: false,
          visualReference: b.visualReference,
          folderId: null
        });
      }
    });

    // Return all items if we just want to count them for folders, 
    // but for display, we only care about the active folder.
    return items.sort((a: any, b: any) => new Date(b.dueDate || 0).getTime() - new Date(a.dueDate || 0).getTime());
  }, [store.uploads, store.briefs, currentUserId]);

  // Assets to display in the current folder (filtered by search and platform)
  const displayedAssets = useMemo(() => {
    if (!activeFolderId) return [];
    return libraryItems.filter((item: any) => {
      const inFolder = item.folderId === activeFolderId;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (item.copy && item.copy.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPlatform = platformFilter === "All" || (item.platforms && item.platforms.includes(platformFilter));
      return inFolder && matchesSearch && matchesPlatform;
    });
  }, [libraryItems, activeFolderId, searchQuery, platformFilter]);

  // Folders to display on root (filtered by search)
  const visibleFolders = useMemo(() => {
    const baseFolders = folders.filter((f: any) => isAdmin || f.assignedTo.includes(currentUserId));
    if (!activeFolderId && searchQuery) {
      return baseFolders.filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return baseFolders;
  }, [folders, isAdmin, currentUserId, activeFolderId, searchQuery]);

  const allPlatforms = useMemo(() => {
    const platforms = new Set<string>();
    displayedAssets.forEach((item: any) => {
      item.platforms?.forEach((p: string) => platforms.add(p));
    });
    return ["All", ...Array.from(platforms)];
  }, [libraryItems]);

  const handleCopyCaption = (id: string, copy: string) => {
    if (!copy) {
      toast.error("No caption available to copy");
      return;
    }
    navigator.clipboard.writeText(copy);
    setCopiedId(id);
    toast.success("Caption copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (item: any) => {
    if (item.files && item.files.length > 0) {
      item.files.forEach((file: any) => {
        if (file.url) {
          const a = document.createElement("a");
          a.href = file.url;
          a.download = file.name || "download";
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
      toast.success(`Downloading ${item.files.length} asset(s)...`);
    } else if (item.visualReference) {
      window.open(item.visualReference, "_blank");
      toast.success("Opening visual reference...");
    } else {
      toast.error("No assets to download");
    }
  };

  const handleDirectUpload = () => {
    if (!uploadData.title || !uploadData.fileUrl) {
      toast.error("Please provide a title and file link/upload");
      return;
    }
    
    const newUpload = {
      id: `lib_${Date.now()}`,
      files: [
        {
          url: uploadData.fileUrl,
          platform: uploadData.platform,
          name: uploadData.title,
          type: "image/png"
        }
      ],
      copy: uploadData.copy,
      title: uploadData.title,
      authorId: currentUserId,
      uploadedAt: new Date().toISOString(),
      status: "approved",
      folderId: uploadData.folderId || null
    };

    updateStore((prev: any) => ({
      ...prev,
      uploads: [newUpload, ...(prev.uploads || [])]
    }));

    toast.success("Asset uploaded to Library!");
    setIsUploadModalOpen(false);
    setUploadData({ title: "", fileUrl: "", platform: "Instagram Feed", copy: "", folderId: activeFolderId || "" });
  };

  const handleSaveFolder = () => {
    if (!folderData.name.trim()) {
      toast.error("Folder name is required.");
      return;
    }

    if (editingFolderId) {
      updateStore((prev: any) => ({
        ...prev,
        folders: prev.folders.map((f: any) => f.id === editingFolderId ? { ...f, name: folderData.name, assignedTo: folderData.assignedTo } : f)
      }));
      toast.success("Folder updated successfully!");
    } else {
      const newFolder = {
        id: `folder_${Date.now()}`,
        name: folderData.name,
        assignedTo: folderData.assignedTo,
        createdBy: currentUserId,
        createdAt: new Date().toISOString()
      };
      updateStore((prev: any) => ({
        ...prev,
        folders: [...(prev.folders || []), newFolder]
      }));
      toast.success("Folder created successfully!");
    }
    
    setIsFolderModalOpen(false);
    setFolderData({ name: "", assignedTo: [] });
    setEditingFolderId(null);
  };

  const handleDeleteFolder = () => {
    if (!editingFolderId) return;
    if (confirm("Are you sure you want to delete this folder? Assets will be moved to the General Library.")) {
      updateStore((prev: any) => ({
        ...prev,
        folders: prev.folders.filter((f: any) => f.id !== editingFolderId),
        uploads: prev.uploads?.map((u: any) => u.folderId === editingFolderId ? { ...u, folderId: null } : u) || []
      }));
      toast.success("Folder deleted.");
      setIsFolderModalOpen(false);
      setEditingFolderId(null);
      setActiveFolderId(null);
    }
  };

  const toggleFolderAssignee = (userId: string) => {
    setFolderData(prev => {
      if (prev.assignedTo.includes(userId)) {
        return { ...prev, assignedTo: prev.assignedTo.filter(id => id !== userId) };
      }
      return { ...prev, assignedTo: [...prev.assignedTo, userId] };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadData(prev => ({ ...prev, fileUrl: url, title: file.name }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pb-6">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 bg-panel p-6 sm:p-8 rounded-3xl border border-line shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black m-0 text-text tracking-tight flex items-center gap-3">
            {activeFolderId ? (
              <>
                <button 
                  onClick={() => { setActiveFolderId(null); setSearchQuery(""); setPlatformFilter("All"); }}
                  className="p-2 hover:bg-panel-2 rounded-xl text-muted hover:text-text transition-colors mr-1"
                >
                  <ArrowLeft size={24} />
                </button>
                <Folder size={28} className="text-primary fill-primary/20" />
                {folders.find((f: any) => f.id === activeFolderId)?.name || "Folder"}
              </>
            ) : (
              <>
                <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                  <Folder size={24} className="fill-primary/20" />
                </div>
                Project Library
              </>
            )}
          </h1>
          <p className="text-muted text-sm mt-3 max-w-xl font-medium leading-relaxed">
            {activeFolderId 
              ? "Browse, manage, and download all approved assets for this specific project." 
              : "Access all your project folders. Select a project to view its approved assets and campaigns."}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 relative z-10 w-full sm:w-auto">
          {!activeFolderId && isAdmin && (
            <button 
              onClick={() => {
                setEditingFolderId(null);
                setFolderData({ name: "", assignedTo: [] });
                setFolderAssigneeRole("designer");
                setIsFolderModalOpen(true);
              }}
              className="w-full sm:w-auto btn primary px-5 py-2.5 text-sm font-bold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <FolderPlus size={18} /> Create Project
            </button>
          )}
          
          {activeFolderId && isAdmin && (
            <button 
              onClick={() => {
                setUploadData(prev => ({ ...prev, folderId: activeFolderId || "" }));
                setIsUploadModalOpen(true);
              }}
              className="w-full sm:w-auto btn primary px-5 py-2.5 text-sm font-bold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ImageIcon size={18} /> Add Assets
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text" 
            placeholder={activeFolderId ? "Search assets in this project..." : "Search project folders by name..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-panel border border-line rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-text placeholder:text-muted/70 shadow-sm font-medium"
          />
        </div>
        
        {activeFolderId && (
          <div className="flex items-center gap-2 bg-panel border border-line rounded-2xl px-4 py-2 min-w-[200px] shadow-sm">
            <Filter size={16} className="text-muted shrink-0" />
            <select 
              className="bg-transparent border-none text-sm font-bold outline-none text-text w-full cursor-pointer pr-2 focus:ring-0" 
              value={platformFilter} 
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              {allPlatforms.map(p => <option key={p} value={p}>{p === 'All' ? 'All Platforms' : p}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Folders Grid (Root View) */}
      {!activeFolderId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleFolders.length > 0 ? (
            visibleFolders.map((folder: any) => {
              const assetCount = libraryItems.filter((item: any) => item.folderId === folder.id).length;
              
              return (
                <div 
                  key={folder.id} 
                  onClick={() => { setActiveFolderId(folder.id); setSearchQuery(""); }}
                  className="bg-panel border border-line rounded-3xl p-6 flex flex-col gap-4 cursor-pointer hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <Folder size={28} className="fill-primary/20" />
                    </div>
                    
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const firstAssignedUser = users.find((u: any) => folder.assignedTo.includes(u.id));
                          setFolderAssigneeRole(firstAssignedUser?.role || "designer");
                          setFolderData({ name: folder.name, assignedTo: folder.assignedTo });
                          setEditingFolderId(folder.id);
                          setIsFolderModalOpen(true);
                        }}
                        className="p-2.5 rounded-xl bg-panel-2 border border-transparent hover:border-line hover:bg-white text-muted hover:text-primary transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                        title="Edit Folder"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-2 z-10">
                    <h3 className="font-extrabold text-text text-lg truncate mb-1.5 group-hover:text-primary transition-colors">{folder.name}</h3>
                    <div className="flex items-center gap-4">
                      <p className="text-xs font-semibold text-muted flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-muted/70" /> {assetCount} Assets
                      </p>
                      <p className="text-xs font-semibold text-muted flex items-center gap-1.5">
                        <UsersIcon size={14} className="text-muted/70" /> {folder.assignedTo.length} Members
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-panel border-2 border-dashed border-line rounded-3xl">
              <div className="w-20 h-20 bg-panel-2 rounded-full flex items-center justify-center text-muted border border-line mb-5 shadow-inner">
                <FolderPlus size={32} />
              </div>
              <h3 className="text-2xl font-black text-text mb-3 tracking-tight">No projects found</h3>
              <p className="text-muted max-w-md font-medium leading-relaxed">
                {searchQuery ? "No projects match your search criteria." : "Get started by creating your first project folder. You can assign specific team members and organize all your creative assets."}
              </p>
              {!searchQuery && isAdmin && (
                <button 
                  onClick={() => setIsFolderModalOpen(true)}
                  className="mt-6 btn primary px-6 py-3 font-bold shadow-md shadow-primary/20"
                >
                  Create First Project
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Library Grid (Assets in Folder) */}
      {activeFolderId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedAssets.length > 0 ? (
            displayedAssets.map((item: any) => {
            const author = users.find((u: any) => u.id === item.authorId);
            
            return (
              <div key={item.id} className="bg-panel border border-line rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                {/* Visual Asset */}
                <div className="aspect-[4/3] bg-panel-2 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
                  {item.files?.length > 0 ? (
                    <>
                      {item.files[0].url?.startsWith('blob:') ? (
                        <img src={item.files[0].url} alt="Preview" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <ImageIcon size={48} className="text-muted/50 mb-3" />
                      )}
                    </>
                  ) : item.visualReference ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="absolute inset-0 bg-primary/5"></div>
                      <ImageIcon size={48} className="text-primary/40 mb-2" />
                      <span className="text-sm font-bold text-muted">Visual Reference</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-50">
                      <ImageIcon size={48} className="text-muted mb-3" />
                      <span className="text-sm font-bold text-muted">Asset Missing</span>
                    </div>
                  )}
                  
                  {/* Quick Action Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-30 backdrop-blur-[2px]">
                    {item.files?.[0]?.url && (
                      <a href={item.files[0].url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all transform translate-y-4 group-hover:translate-y-0" title="View File">
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <button 
                      onClick={() => handleDownload(item)}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-lg"
                      title="Download Asset"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 flex flex-col gap-3 bg-panel relative border-t border-line/50">
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-extrabold text-sm text-text leading-tight line-clamp-2" title={item.title}>{item.title}</h3>
                    {item.dueDate && (
                      <span className="text-[10px] font-bold text-muted bg-panel-2 px-2 py-1 rounded-md border border-line shrink-0 flex items-center gap-1">
                        <Clock size={10} /> {new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-[8px] font-bold shadow-sm">
                      {author?.avatar || author?.name?.charAt(0) || "U"}
                    </div>
                    <span className="text-xs font-semibold text-muted truncate">{author?.name || "Designer"}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-panel border-2 border-dashed border-line/60 rounded-3xl">
            <div className="w-16 h-16 bg-panel-2 rounded-full flex items-center justify-center text-muted border border-line mb-4 shadow-sm">
              <ImageIcon size={24} />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">No approved assets yet</h3>
            <p className="text-muted max-w-md">
              Tasks that are marked as "Approved" will automatically appear here for easy downloading and publishing.
            </p>
          </div>
        )}
      </div>
      )}

          {/* Upload Modal (Only triggered from inside a folder) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-panel w-full max-w-md rounded-2xl border border-line shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-line flex justify-between items-center bg-panel-2/50">
              <h2 className="font-bold text-text text-lg">Add to Library</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-line/50 hover:text-text transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <label className="border-2 border-dashed border-line hover:border-primary/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center bg-panel-2/30 cursor-pointer relative overflow-hidden group">
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                  onChange={handleFileChange} 
                />
                <div className="w-12 h-12 bg-panel rounded-full flex items-center justify-center text-primary border border-line mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon size={20} />
                </div>
                <h3 className="font-bold text-text text-sm mb-1">Click to upload file</h3>
                <p className="text-xs text-muted">Supports JPG, PNG, MP4 up to 50MB</p>
                {uploadData.fileUrl && uploadData.fileUrl.startsWith('blob:') && (
                  <div className="absolute inset-0 bg-panel z-20 flex flex-col items-center justify-center">
                    <Check size={32} className="text-ok mb-2" />
                    <span className="font-bold text-ok text-sm">File Selected</span>
                    <span className="text-xs text-text mt-1">{uploadData.title}</span>
                  </div>
                )}
              </label>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text uppercase tracking-wider">Asset Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Logo Pack 2026"
                  className="w-full bg-panel border border-line rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text uppercase tracking-wider">Platform</label>
                  <select 
                    className="w-full bg-panel border border-line rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-text"
                    value={uploadData.platform}
                    onChange={(e) => setUploadData({...uploadData, platform: e.target.value})}
                  >
                    {allPlatforms.filter(p => p !== 'All').map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="General">General / Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text uppercase tracking-wider">External Link</label>
                  <input 
                    type="url" 
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-panel border border-line rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-text"
                    value={uploadData.fileUrl}
                    onChange={(e) => setUploadData({...uploadData, fileUrl: e.target.value})}
                  />
                </div>
              </div>

              <div className="hidden">
                <input type="hidden" value={uploadData.folderId} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-text uppercase tracking-wider">Default Caption (Optional)</label>
                <textarea 
                  placeholder="Write a caption to go along with this asset..."
                  className="w-full bg-panel border border-line rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-text min-h-[80px] resize-y"
                  value={uploadData.copy}
                  onChange={(e) => setUploadData({...uploadData, copy: e.target.value})}
                />
              </div>

              <button onClick={handleDirectUpload} className="btn primary w-full mt-2 font-bold shadow-sm">
                Upload to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="bg-panel w-full max-w-[500px] rounded-3xl border border-line shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="p-5 border-b border-line flex justify-between items-center bg-panel-2/50">
              <h2 className="font-extrabold text-text text-lg flex items-center gap-2">
                <FolderPlus size={20} className="text-primary" /> {editingFolderId ? "Edit Project Folder" : "Create Project Folder"}
              </h2>
              <button onClick={() => { setIsFolderModalOpen(false); setEditingFolderId(null); }} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-line/80 hover:text-text transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 sm:p-8 flex flex-col gap-6">
              
              {/* Folder Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-extrabold text-muted uppercase tracking-widest">Folder Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Folder size={16} className="text-muted" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="e.g. Summer Campaign Assets"
                    className="w-full bg-panel border-2 border-line rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-text font-semibold"
                    value={folderData.name}
                    onChange={(e) => setFolderData({...folderData, name: e.target.value})}
                  />
                </div>
              </div>

              {/* Assignment Section */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-muted uppercase tracking-widest">Assign Access To</label>
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md tracking-wider">
                    {folderData.assignedTo.length} SELECTED
                  </span>
                </div>

                {/* Role Tabs */}
                <div className="flex bg-panel-2 rounded-xl p-1.5 gap-1 border border-line shadow-inner">
                  {["designer", "developer", "editor"].map(role => (
                    <button 
                      key={role}
                      onClick={() => setFolderAssigneeRole(role)}
                      className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition-all ${
                        folderAssigneeRole === role 
                          ? 'bg-white text-primary shadow-sm ring-1 ring-black/5 scale-[1.02]' 
                          : 'text-muted hover:text-text hover:bg-line/50'
                      }`}
                    >
                      {role}s
                    </button>
                  ))}
                </div>

                {/* User List */}
                <div className="border border-line rounded-2xl bg-panel-2/30 max-h-[250px] overflow-y-auto p-2 flex flex-col gap-2 relative">
                  {users.filter((u: any) => u.role === folderAssigneeRole).map((u: any) => {
                    const isSelected = folderData.assignedTo.includes(u.id);
                    return (
                      <label 
                        key={u.id} 
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                          isSelected ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-panel border-transparent hover:border-line hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={isSelected}
                            onChange={() => toggleFolderAssignee(u.id)}
                          />
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-sm font-extrabold shadow-sm ring-2 ring-white">
                            {u.avatar || u.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-text font-bold leading-tight">{u.name}</span>
                            <span className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5">{u.role}</span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isSelected ? 'bg-primary text-white scale-110 shadow-sm' : 'border-2 border-line bg-panel-2 text-transparent scale-100'
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </label>
                    );
                  })}
                  
                  {users.filter((u: any) => u.role === folderAssigneeRole).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <div className="w-12 h-12 bg-panel rounded-full flex items-center justify-center mb-3 shadow-sm border border-line">
                        <UsersIcon size={20} className="text-muted" />
                      </div>
                      <p className="text-sm font-bold text-text">No {folderAssigneeRole}s found.</p>
                      <p className="text-xs text-muted mt-1">Try selecting a different role.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-4 pt-6 border-t border-line">
                {editingFolderId ? (
                  <button 
                    onClick={handleDeleteFolder} 
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-sm bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all flex items-center justify-center gap-2 border border-danger/20 hover:border-danger shadow-sm"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                ) : <div className="hidden sm:block" />}
                
                <div className="flex gap-3 w-full sm:w-auto flex-col sm:flex-row">
                  <button 
                    onClick={() => { setIsFolderModalOpen(false); setEditingFolderId(null); }} 
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-extrabold text-sm bg-panel border-2 border-line text-text hover:bg-line/50 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveFolder} 
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-extrabold text-sm bg-primary text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/30"
                  >
                    {editingFolderId ? "Save Changes" : "Create Folder"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
