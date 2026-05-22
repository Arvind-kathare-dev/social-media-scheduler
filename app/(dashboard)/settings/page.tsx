"use client";
import { useScheduler } from "../../context/SchedulerContext";

export default function SettingsPage() {
  const { dark, toggleDark } = useScheduler();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="page-title mb-6">
        <h1 className="text-3xl font-extrabold m-0">Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your workspace preferences.</p>
      </div>

      <div className="section">
        <h2 className="text-xl font-bold mb-4">Appearance</h2>
        <div className="flex items-center justify-between p-4 bg-panel-2 rounded-custom border border-line">
          <div>
            <div className="font-bold mb-1">Dark Mode</div>
            <div className="text-sm text-muted">Toggle the dark theme across the dashboard.</div>
          </div>
          <button 
            className={`w-12 h-6 rounded-full relative transition-colors ${dark ? 'bg-primary' : 'bg-strong-line'}`}
            onClick={toggleDark}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${dark ? 'translate-x-7' : 'translate-x-1'}`}></div>
          </button>
        </div>
      </div>
    </div>
  );
}
