"use client";

import { useState } from "react";
import { useScheduler } from "../../context/SchedulerContext";
import TaskCard from "../../components/TaskCard";
import { Plus } from "lucide-react";
import Input from "../../components/Input";

const tones = ["Professional", "Casual", "Witty", "Inspirational", "Promotional", "Educational"];
const priorities = ["Low", "Normal", "Urgent"];
const platformOptions = ["Instagram Feed", "Instagram Story/Reel", "Facebook", "X (Twitter)", "LinkedIn", "Pinterest", "YouTube Shorts"];

export default function BriefsPage() {
  const { store, updateStore, currentUser, users, addNotification } = useScheduler();
  
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [platforms, setPlatforms] = useState([]);
  
  const defaultDesigner = users.find(u => u.role === "designer")?.id || "";
  
  const [formData, setFormData] = useState({
    title: "",
    tone: tones[0],
    copy: "",
    visualReference: "",
    dueDate: "",
    assignedTo: defaultDesigner,
    priority: priorities[1],
    notes: ""
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlatformChange = (p) => {
    setPlatforms(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleHashtagKeyDown = (e) => {
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

  const removeHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (platforms.length === 0) {
      alert("Select at least one platform.");
      return;
    }
    if (!formData.dueDate) {
      alert("Due date is required.");
      return;
    }

    const newBrief = {
      id: `b_${Date.now()}`,
      ...formData,
      hashtags,
      platforms,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      status: "todo"
    };

    updateStore(prev => ({
      ...prev,
      briefs: [newBrief, ...prev.briefs]
    }));

    addNotification(formData.assignedTo, `You have been assigned a new brief: ${formData.title}`);

    // Reset
    setFormData({
      title: "", tone: tones[0], copy: "", visualReference: "",
      dueDate: "", assignedTo: defaultDesigner, priority: priorities[1], notes: ""
    });
    setPlatforms([]);
    setHashtags([]);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-title mb-6">
        <h1 className="text-3xl font-extrabold m-0">Briefs</h1>
        <p className="text-muted text-sm mt-1">Create assignments for designers.</p>
      </div>

      <div className="section">
        <div className="section-head mb-4">
          <h2 className="text-xl font-bold">Content Brief Form</h2>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Post title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g. Summer Campaign Teaser"
          />
          
          <Input
            label="Desired tone"
            name="tone"
            type="select"
            value={formData.tone}
            onChange={handleChange}
            options={tones.map(t => ({ label: t, value: t }))}
          />
          
          <Input
            label="Content copy"
            name="copy"
            type="textarea"
            value={formData.copy}
            onChange={handleChange}
            required
            placeholder="Write the exact text for the post..."
            className="md:col-span-2"
          />
          <div className="field md:col-span-2">
            <label className="block text-muted text-xs font-bold uppercase tracking-wider mb-2">Hashtags</label>
            <div className="flex flex-wrap gap-2 min-h-[42px] items-center border border-strong-line rounded-[7px] p-1.5 bg-panel">
              {hashtags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 rounded-[7px] px-2 py-1 bg-panel-2 text-text text-xs">
                  {tag} <button type="button" onClick={() => removeHashtag(tag)} className="text-muted hover:text-danger">&times;</button>
                </span>
              ))}
              <input 
                className="flex-1 min-w-[150px] bg-transparent outline-none p-1 text-sm text-text" 
                value={hashtagInput}
                onChange={e => setHashtagInput(e.target.value)}
                onKeyDown={handleHashtagKeyDown}
                placeholder="Type and press enter..."
              />
            </div>
          </div>
          <div className="field md:col-span-2">
            <label className="block text-muted text-xs font-bold uppercase tracking-wider mb-2">Target platforms</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {platformOptions.map(p => (
                <label key={p} className="flex items-center gap-2 p-2 bg-panel-2 rounded-[7px] cursor-pointer text-sm">
                  <input 
                    type="checkbox" 
                    checked={platforms.includes(p)}
                    onChange={() => handlePlatformChange(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <Input
            label="Visual reference URL"
            name="visualReference"
            value={formData.visualReference}
            onChange={handleChange}
            placeholder="https://..."
          />
          
          <Input
            label="Due date"
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            required
          />
          
          <Input
            label="Assign to"
            name="assignedTo"
            type="select"
            value={formData.assignedTo}
            onChange={handleChange}
            options={users.filter((u: any) => u.role === "designer").map((u: any) => ({ label: u.name, value: u.id }))}
          />
          
          <Input
            label="Priority"
            name="priority"
            type="select"
            value={formData.priority}
            onChange={handleChange}
            options={priorities.map(p => ({ label: p, value: p }))}
          />
          
          <Input
            label="Notes for designer"
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={handleChange}
            className="md:col-span-2"
            placeholder="Any specific design instructions..."
            rows={3}
          />
          <div className="field md:col-span-2 mt-2">
            <button type="submit" className="btn primary w-full md:w-auto">
              <Plus size={18} /> Create brief
            </button>
          </div>
        </form>
      </div>

      <div className="section mt-6">
        <div className="section-head mb-4">
          <h2 className="text-xl font-bold">Created briefs</h2>
        </div>
        {store.briefs.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {store.briefs.map((brief) => {
              const creator = users.find(u => u.id === brief.createdBy);
              return <TaskCard key={brief.id} brief={brief} user={creator} />;
            })}
          </div>
        ) : (
          <div className="empty min-h-[160px] grid place-items-center text-center text-muted border border-dashed border-strong-line rounded-custom p-5 bg-panel">
            No briefs created yet.
          </div>
        )}
      </div>
    </div>
  );
}
