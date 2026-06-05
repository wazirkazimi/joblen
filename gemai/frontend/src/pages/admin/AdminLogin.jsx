import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Lock, User, AlertCircle } from "lucide-react";
import { adminApi } from "../../api/adminApi";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      setLoading(true);
      setError(null);
      await adminApi.login(username, password);
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message || "Invalid admin username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F10] text-zinc-100 flex items-center justify-center font-sans px-4">
      <div className="w-full max-w-md bg-zinc-900/40 border border-[#27272A] rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        {/* Glow effect */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#FFCE00]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#FFCE00]/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-[#FFCE00] to-[#F59E0B] p-3 rounded-xl text-[#0F0F10] shadow-lg shadow-[#FFCE00]/10 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-zinc-200 to-[#FFCE00] bg-clip-text text-transparent uppercase">
            AURALUX AI
          </h2>
          <p className="text-zinc-500 text-xs mt-1 font-semibold uppercase tracking-wider">
            Administrative Control Panel
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-lg text-xs flex items-center gap-2.5 mb-6">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full bg-zinc-950/60 border border-[#27272A] pl-10 pr-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-[#FFCE00] transition-colors placeholder-zinc-700"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-950/60 border border-[#27272A] pl-10 pr-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-[#FFCE00] transition-colors placeholder-zinc-700"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#FFCE00] text-[#0F0F10] py-3 rounded-lg text-xs font-bold hover:bg-[#FFCE00]/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#FFCE00]/10 hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0F0F10] border-t-transparent rounded-full animate-spin"></div>
                Signing In...
              </>
            ) : (
              "Sign In to Console"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors"
          >
            ← Back to Application
          </button>
        </div>
      </div>
    </div>
  );
}
