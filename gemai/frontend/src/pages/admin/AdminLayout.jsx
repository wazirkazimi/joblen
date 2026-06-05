import React, { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  LayoutDashboard, 
  Image as ImageIcon, 
  History, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { adminApi } from "../../api/adminApi";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication check on load
  useEffect(() => {
    if (!adminApi.isAuthenticated()) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    adminApi.logout();
    navigate("/admin/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Templates", path: "/admin/templates", icon: ImageIcon },
    { label: "Generations", path: "/admin/generations", icon: History },
    { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    { label: "App Settings", path: "/admin/settings", icon: SettingsIcon },
  ];

  if (!adminApi.isAuthenticated()) {
    return (
      <div className="min-h-screen bg-[#0F0F10] text-zinc-400 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FFCE00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F10] text-zinc-100 font-sans flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#27272A] bg-zinc-950/80 backdrop-blur flex flex-col shrink-0">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-[#27272A] flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="bg-gradient-to-tr from-[#FFCE00] to-[#F59E0B] p-1.5 rounded-lg text-[#0F0F10]">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-white via-zinc-200 to-[#FFCE00] bg-clip-text text-transparent uppercase">
              AURALUX AI
            </span>
            <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">
              MVP Console
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all group ${
                  isActive 
                    ? "bg-[#FFCE00] text-[#0F0F10]" 
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`h-3 w-3 transition-transform ${isActive ? "text-[#0F0F10]" : "text-zinc-600 group-hover:text-zinc-400"}`} />
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-[#27272A]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="px-8 py-5 border-b border-[#27272A] bg-zinc-950/20 flex justify-between items-center">
          <h1 className="text-lg font-bold tracking-wide text-white">
            {navItems.find(item => location.pathname === item.path)?.label || "Control Panel"}
          </h1>
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-zinc-500 uppercase tracking-wider text-[10px]">Connected to Supabase</span>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
