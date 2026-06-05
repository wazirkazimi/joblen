import React, { useState, useEffect } from "react";
import { Save, AlertTriangle, ShieldCheck, Check } from "lucide-react";
import { adminApi } from "../../api/adminApi";

export default function AdminSettings() {
  const [maxTotal, setMaxTotal] = useState("180");
  const [maxDaily, setMaxDaily] = useState("30");
  const [costPerImage, setCostPerImage] = useState("0.025");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getSettings();
      const settings = data.settings || {};
      
      if (settings.max_total_generations) setMaxTotal(settings.max_total_generations);
      if (settings.max_daily_generations) setMaxDaily(settings.max_daily_generations);
      if (settings.estimated_cost_per_image_usd) setCostPerImage(settings.estimated_cost_per_image_usd);
      if (settings.maintenance_mode) setMaintenanceMode(settings.maintenance_mode === "true");
    } catch (err) {
      console.error(err);
      setError("Failed to load app settings from database.");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!maxTotal || !maxDaily || !costPerImage) {
      alert("All fields are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const payload = {
        max_total_generations: maxTotal,
        max_daily_generations: maxDaily,
        estimated_cost_per_image_usd: costPerImage,
        maintenance_mode: String(maintenanceMode)
      };

      const res = await adminApi.updateSettings(payload);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save configuration settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-[#FFCE00] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm">Querying configurations from database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl animate-fadeIn space-y-6">
      
      {/* Toast notifications */}
      {success && (
        <div className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="h-4.5 w-4.5 shrink-0" />
          <span>System configuration parameters saved and updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Settings Panel */}
      <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-6">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 mb-6 flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5 text-[#FFCE00]" />
          Cost Guard & Generation Safeguards
        </h3>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Max Total generations */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
              Maximum Total Generations (Hard Cap)
            </label>
            <input
              type="number"
              value={maxTotal}
              onChange={e => setMaxTotal(e.target.value)}
              className="w-full bg-zinc-950/40 border border-[#27272A] px-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
              required
            />
            <p className="text-[10px] text-zinc-500 leading-normal">
              Once the total number of successful generated images reaches this threshold, the API will refuse generations to protect your budget.
            </p>
          </div>

          {/* Max Daily Generations */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
              Maximum Daily Generations (Throttle)
            </label>
            <input
              type="number"
              value={maxDaily}
              onChange={e => setMaxDaily(e.target.value)}
              className="w-full bg-zinc-950/40 border border-[#27272A] px-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
              required
            />
            <p className="text-[10px] text-zinc-500 leading-normal">
              Limits daily generations to prevent rapid credit depletion. Enforced against the generations log timestamps.
            </p>
          </div>

          {/* Cost Per Image */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
              Estimated Cost per Image (USD)
            </label>
            <input
              type="number"
              step="0.0001"
              value={costPerImage}
              onChange={e => setCostPerImage(e.target.value)}
              className="w-full bg-zinc-950/40 border border-[#27272A] px-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
              required
            />
            <p className="text-[10px] text-zinc-500 leading-normal">
              Used strictly for analytics dashboard spend modeling (e.g. gpt-image-1 API cost per generation call).
            </p>
          </div>

          {/* Maintenance Mode Toggle */}
          <div className="border-t border-[#27272A]/40 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Maintenance Mode</h4>
                <p className="text-[10px] text-zinc-500 leading-normal max-w-md">
                  Enable this to temporarily suspend all image generation calls. Public interface will display a service warning message.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={e => setMaintenanceMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FFCE00] peer-checked:after:bg-[#0F0F10] peer-checked:after:border-transparent"></div>
              </label>
            </div>
            
            {maintenanceMode && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-[#FFCE00] p-4 rounded-lg flex gap-3 text-xs leading-normal">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>
                  <strong>Caution:</strong> Maintenance mode is currently active. Public users will receive a service interruption notice and will not be able to generate images.
                </span>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-[#27272A]/40 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#FFCE00] hover:bg-[#FFCE00]/90 text-[#0F0F10] px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-[#FFCE00]/10 hover:scale-[1.01]"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0F0F10] border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
