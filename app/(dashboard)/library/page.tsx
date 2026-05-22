"use client";
import { useState } from "react";
import { useScheduler } from "../../context/SchedulerContext";
import { Download } from "lucide-react";

export default function LibraryPage() {
  const { store } = useScheduler();
  const [platformFilter, setPlatformFilter] = useState("All");
  
  const approvedUploads = store.uploads.filter(u => u.status === 'approved');
  
  const files = approvedUploads.flatMap(u => {
    const brief = store.briefs.find(b => b.id === u.briefId);
    return u.files.map(f => ({ ...f, briefTitle: brief?.title || "Unknown brief", dueDate: brief?.dueDate }));
  });

  const filtered = platformFilter === "All" 
    ? files 
    : files.filter(f => f.platform.toLowerCase().includes(platformFilter.toLowerCase()));

  const platforms = ["All", "Instagram", "Facebook", "LinkedIn", "X", "YouTube", "Pinterest"];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="page-title mb-6">
        <h1 className="text-3xl font-extrabold m-0">Library</h1>
        <p className="text-muted text-sm mt-1">Approved assets ready for publishing.</p>
      </div>

      <div className="filters flex flex-wrap gap-3 mb-6 bg-panel p-4 rounded-custom border border-line">
        <div className="w-full sm:w-auto">
          <label className="block text-muted text-xs font-bold uppercase tracking-wider mb-2">Platform filter</label>
          <select 
            className="select min-w-[200px]" 
            value={platformFilter} 
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.length > 0 ? (
          filtered.map((file, i) => (
            <div key={i} className="post-card bg-panel border border-line rounded-custom p-3 relative group">
              <div className="thumb aspect-[4/3] bg-panel-2 border border-dashed border-line rounded-[7px] mb-3 flex items-center justify-center text-muted font-medium text-sm">
                {file.name}
              </div>
              <h4 className="font-bold text-sm mb-1 truncate">{file.briefTitle}</h4>
              <div className="flex justify-between items-center text-xs text-muted">
                <span>{file.platform}</span>
                <span className="font-medium text-text">{file.dimensions}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn ghost w-full text-xs py-1.5 h-auto">
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full empty min-h-[160px] grid place-items-center text-center text-muted border border-dashed border-strong-line rounded-custom p-5 bg-panel">
            No approved assets found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
