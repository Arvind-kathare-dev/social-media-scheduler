"use client";
import { useState } from "react";
import { useScheduler } from "../../context/SchedulerContext";
import toast from "react-hot-toast";
import { 
  Moon, Sun, Bell, Shield, User, Briefcase, 
  Settings as SettingsIcon, Link2, CheckCircle2, 
  Smartphone, Mail, Lock
} from "lucide-react";

export default function SettingsPage() {
  const { dark, toggleDark, currentUser, updateStore } = useScheduler();
  const [activeTab, setActiveTab] = useState("profile");

  const isAdmin = currentUser.role === "admin";

  // --- State for Profile ---
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileBio, setProfileBio] = useState(currentUser.bio || "");

  const handleSaveProfile = () => {
    updateStore((prev: any) => ({
      ...prev,
      users: (prev.users || []).map((u: any) => 
        u.id === currentUser.id 
          ? { ...u, name: profileName, bio: profileBio, avatar: String(profileName).charAt(0).toUpperCase() } 
          : u
      )
    }));
    toast.success("Profile updated successfully!");
  };

  // --- State for Notifications ---
  const [notifState, setNotifState] = useState({
    email: true,
    push: true,
    sms: false
  });

  const toggleNotif = (key: keyof typeof notifState) => {
    setNotifState((prev: any) => {
      const newState = { ...prev, [key]: !prev[key] };
      const keyStr = String(key);
      if (newState[key]) {
        toast.success(`${keyStr.charAt(0).toUpperCase() + keyStr.slice(1)} notifications enabled.`);
      } else {
        toast.error(`${keyStr.charAt(0).toUpperCase() + keyStr.slice(1)} notifications disabled.`);
      }
      return newState;
    });
  };

  // --- State for Integrations ---
  const [integrations, setIntegrations] = useState({
    fb: true,
    ig: false,
    li: true,
    x: false
  });

  const toggleIntegration = (key: keyof typeof integrations, platformName: string) => {
    setIntegrations((prev: any) => {
      const newState = { ...prev, [key]: !prev[key] };
      if (newState[key]) {
        toast.success(`Successfully connected to ${platformName}`);
      } else {
        toast.success(`Disconnected from ${platformName}`);
      }
      return newState;
    });
  };

  // --- State for Workspace ---
  const [workspaceName, setWorkspaceName] = useState("Veloc Social Scheduler");
  
  const handleSaveWorkspace = () => {
    toast.success("Workspace configuration saved!");
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: <User size={18} /> },
    { id: "appearance", label: "Appearance", icon: dark ? <Moon size={18} /> : <Sun size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "security", label: "Security", icon: <Shield size={18} /> },
    ...(isAdmin ? [
      { id: "workspace", label: "Workspace Settings", icon: <Briefcase size={18} /> },
      { id: "integrations", label: "Integrations", icon: <Link2 size={18} /> }
    ] : [])
  ];

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col pb-10">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <SettingsIcon size={20} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold m-0 text-text tracking-tight">Settings</h1>
          <p className="text-muted text-sm m-0 mt-1">Manage your account preferences and workspace settings.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0 bg-panel border border-line rounded-xl p-3 flex flex-col gap-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted hover:text-text hover:bg-panel-2'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 w-full bg-panel border border-line rounded-xl shadow-sm overflow-hidden min-h-[500px]">
          
          {/* PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-6 py-5 border-b border-line bg-panel-2/30">
                <h2 className="text-lg font-bold text-text m-0">Public Profile</h2>
                <p className="text-xs text-muted mt-1">This information will be displayed publicly to your team.</p>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[#14a879] text-white flex items-center justify-center text-3xl font-bold shadow-sm ring-4 ring-panel-2 transition-all">
                    {profileName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <button className="btn bg-panel-2 border border-line text-text font-bold px-4 py-2 text-sm shadow-sm hover:border-primary transition-colors mb-2">Change Avatar</button>
                    <p className="text-xs text-muted">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div className="input-group">
                    <label className="block text-sm font-bold text-text mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-strong-line bg-panel text-text text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    />
                  </div>
                  <div className="input-group">
                    <label className="block text-sm font-bold text-text mb-2">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={currentUser.email} 
                      disabled 
                      className="w-full px-4 py-2.5 rounded-lg border border-line bg-panel-2 text-muted text-sm outline-none cursor-not-allowed" 
                    />
                  </div>
                  <div className="input-group md:col-span-2">
                    <label className="block text-sm font-bold text-text mb-2">Bio / Tagline</label>
                    <input 
                      type="text" 
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-strong-line bg-panel text-text text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                      placeholder="E.g. Lead Designer" 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 mt-2">
                  <button onClick={handleSaveProfile} className="btn primary px-6 font-semibold shadow-sm hover:opacity-90">Save Profile</button>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE SETTINGS */}
          {activeTab === "appearance" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-6 py-5 border-b border-line bg-panel-2/30">
                <h2 className="text-lg font-bold text-text m-0">Appearance</h2>
                <p className="text-xs text-muted mt-1">Customize how the application looks on your device.</p>
              </div>
              <div className="p-6">
                <div 
                  onClick={toggleDark}
                  className="flex items-center justify-between p-5 bg-panel-2 hover:bg-line/20 rounded-xl border border-line cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      {dark ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-text mb-1">Dark Theme</div>
                      <div className="text-sm text-muted">Switch between light and dark mode styling.</div>
                    </div>
                  </div>
                  <button 
                    className={`w-12 h-6 rounded-full relative transition-colors shadow-inner ${dark ? 'bg-primary' : 'bg-strong-line'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${dark ? 'translate-x-7' : 'translate-x-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeTab === "notifications" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-6 py-5 border-b border-line bg-panel-2/30">
                <h2 className="text-lg font-bold text-text m-0">Notifications</h2>
                <p className="text-xs text-muted mt-1">Choose how and when you want to be alerted.</p>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {[
                  { id: "email", icon: <Mail size={18} />, title: "Email Notifications", desc: "Receive daily digests and urgent alerts via email." },
                  { id: "push", icon: <Bell size={18} />, title: "Push Notifications", desc: "Get real-time alerts in your browser when tasks are assigned." },
                  { id: "sms", icon: <Smartphone size={18} />, title: "SMS Alerts", desc: "Get text messages for critical timeline breaches." }
                ].map((item: any) => (
                  <div 
                    key={item.id} 
                    onClick={() => toggleNotif(item.id)}
                    className="flex items-center justify-between p-4 border border-line rounded-lg hover:border-primary/50 bg-panel transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${notifState[item.id as keyof typeof notifState] ? 'bg-primary/10 text-primary' : 'bg-panel-2 text-muted group-hover:text-text'}`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-bold text-text text-sm mb-0.5">{item.title}</div>
                        <div className="text-xs text-muted">{item.desc}</div>
                      </div>
                    </div>
                    <button className={`w-11 h-6 rounded-full relative transition-colors shadow-inner ${notifState[item.id as keyof typeof notifState] ? 'bg-primary' : 'bg-strong-line'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${notifState[item.id as keyof typeof notifState] ? 'translate-x-6' : 'translate-x-1'}`}></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY SETTINGS */}
          {activeTab === "security" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-6 py-5 border-b border-line bg-panel-2/30">
                <h2 className="text-lg font-bold text-text m-0">Security</h2>
                <p className="text-xs text-muted mt-1">Keep your account and data safe.</p>
              </div>
              <div className="p-6 flex flex-col gap-8">
                <div>
                  <h3 className="text-sm font-bold text-text mb-4">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="input-group">
                      <input type="password" placeholder="Current Password" className="w-full px-4 py-2.5 rounded-lg border border-strong-line bg-panel text-text text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div></div>
                    <div className="input-group">
                      <input type="password" placeholder="New Password" className="w-full px-4 py-2.5 rounded-lg border border-strong-line bg-panel text-text text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div className="input-group">
                      <input type="password" placeholder="Confirm New Password" className="w-full px-4 py-2.5 rounded-lg border border-strong-line bg-panel text-text text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    </div>
                  </div>
                  <button onClick={() => toast.success("Password successfully updated.")} className="btn primary px-5 py-2 text-sm mt-5 shadow-sm">Update Password</button>
                </div>
                
                <hr className="border-line" />
                
                <div className="flex items-center justify-between p-4 border border-line rounded-xl bg-panel-2/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                      <Lock size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-text text-sm">Two-Factor Authentication</div>
                      <div className="text-xs text-muted mt-0.5">Add an extra layer of security to your account.</div>
                    </div>
                  </div>
                  <button onClick={() => toast.success("2FA Setup link sent to email.")} className="px-4 py-2 border border-strong-line rounded-lg text-sm font-bold text-text hover:border-primary transition-colors bg-panel shadow-sm">Enable 2FA</button>
                </div>
              </div>
            </div>
          )}

          {/* WORKSPACE SETTINGS (ADMIN) */}
          {activeTab === "workspace" && isAdmin && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-6 py-5 border-b border-line bg-panel-2/30">
                <h2 className="text-lg font-bold text-text m-0">Workspace Configuration</h2>
                <p className="text-xs text-muted mt-1">Global settings that apply to all team members.</p>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="input-group md:col-span-2">
                    <label className="block text-sm font-bold text-text mb-2">Company / Workspace Name</label>
                    <input 
                      type="text" 
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-strong-line bg-panel text-text text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    />
                  </div>
                  <div className="input-group">
                    <label className="block text-sm font-bold text-text mb-2">Default Timezone</label>
                    <select className="w-full px-4 py-2.5 rounded-lg border border-strong-line bg-panel text-text text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                      <option>Pacific Time (US & Canada)</option>
                      <option>Eastern Time (US & Canada)</option>
                      <option>Greenwich Mean Time (London)</option>
                      <option>India Standard Time (IST)</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="block text-sm font-bold text-text mb-2">Default Date Format</label>
                    <select className="w-full px-4 py-2.5 rounded-lg border border-strong-line bg-panel text-text text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 mt-2">
                  <button onClick={handleSaveWorkspace} className="btn primary px-6 font-semibold shadow-sm hover:opacity-90">Save Workspace</button>
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONS (ADMIN) */}
          {activeTab === "integrations" && isAdmin && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-6 py-5 border-b border-line bg-panel-2/30">
                <h2 className="text-lg font-bold text-text m-0">Integrations</h2>
                <p className="text-xs text-muted mt-1">Connect your workspace with third-party social platforms.</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { id: "fb", name: "Facebook Page", color: "bg-[#1877F2]", text: "text-[#1877F2]", logo: "f" },
                  { id: "ig", name: "Instagram Business", color: "bg-gradient-to-tr from-[#FFDC80] via-[#F56040] to-[#C13584]", text: "text-[#E1306C]", logo: "ig" },
                  { id: "li", name: "LinkedIn Profile", color: "bg-[#0A66C2]", text: "text-[#0A66C2]", logo: "in" },
                  { id: "x", name: "X (Twitter)", color: "bg-black dark:bg-white", text: "text-black dark:text-white", logo: "𝕏" }
                ].map((platform) => {
                  const isConnected = integrations[platform.id as keyof typeof integrations];
                  return (
                    <div key={platform.id} className={`flex items-center justify-between p-4 border rounded-xl transition-all ${isConnected ? 'border-primary/30 bg-primary/5' : 'border-line hover:border-strong-line bg-panel'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl text-white flex items-center justify-center font-black text-xl shadow-sm ${platform.color}`}>
                          {platform.logo}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-text">{platform.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isConnected ? (
                              <><span className="w-1.5 h-1.5 rounded-full bg-ok"></span><span className="text-[10px] uppercase font-bold text-ok">Connected</span></>
                            ) : (
                              <><span className="w-1.5 h-1.5 rounded-full bg-muted"></span><span className="text-[10px] uppercase font-bold text-muted">Disconnected</span></>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleIntegration(platform.id as keyof typeof integrations, platform.name)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${isConnected ? 'border-line text-muted hover:text-danger hover:border-danger/30' : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}
                      >
                        {isConnected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
