import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Layers, 
  History, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { adminApi } from "../../api/adminApi";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const dashboardData = await adminApi.getDashboard();
        setData(dashboardData);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Failed to load dashboard metrics. Check JWT validity.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-[#FFCE00] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm">Computing dashboard KPI indicators...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm max-w-lg mx-auto text-center">
        <p className="mb-3">{error}</p>
        <button 
          onClick={() => navigate("/admin/login")}
          className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold"
        >
          Re-Authenticate
        </button>
      </div>
    );
  }

  const statCards = [
    { label: "Total Generations", value: data.totalGenerations, icon: History, color: "text-[#FFCE00]" },
    { label: "Generations Today", value: data.generationsToday, icon: TrendingUp, color: "text-blue-450" },
    { label: "Free Generations (Total)", value: data.totalFreeGenerations || 0, icon: Sparkles, color: "text-purple-400" },
    { label: "Free Generations (Today)", value: data.freeGenerationsToday || 0, icon: TrendingUp, color: "text-teal-400" },
    { label: "Estimated Spend (Total)", value: `$${data.estimatedTotalSpend.toFixed(2)}`, icon: DollarSign, color: "text-amber-400" },
    { label: "Estimated Spend (Today)", value: `$${data.estimatedSpendToday.toFixed(2)}`, icon: DollarSign, color: "text-orange-400" },
    { label: "Remaining Budget (Max $5)", value: `$${(data.remainingBudget ?? 5.0).toFixed(2)}`, icon: DollarSign, color: "text-red-400" },
    { label: "Most Used Free Template", value: data.mostUsedFreeTemplate || "N/A", icon: Layers, color: "text-emerald-450" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-zinc-900/30 border border-[#27272A] rounded-xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{card.label}</span>
                <p className="text-xl font-black text-white truncate max-w-[150px]" title={card.value}>{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-805 shrink-0 ${card.color}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Row Split: Recent Generations & Top Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Generations (Cols 2/3) */}
        <div className="lg:col-span-2 bg-zinc-900/20 border border-[#27272A] rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">
              Recent Generations
            </h3>
            <button 
              onClick={() => navigate("/admin/generations")}
              className="text-[10px] font-bold text-[#FFCE00] hover:underline uppercase tracking-wider"
            >
              View All Logs →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-zinc-500 text-[10px] uppercase font-bold tracking-wider pb-3">
                  <th className="pb-3">Input</th>
                  <th className="pb-3">Output</th>
                  <th className="pb-3">Template</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/40 text-xs">
                {data.recentGenerations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-zinc-500">
                      No generations logged yet.
                    </td>
                  </tr>
                ) : (
                  data.recentGenerations.map(gen => (
                    <tr key={gen.id} className="hover:bg-zinc-900/10 transition-colors">
                      {/* Input preview */}
                      <td className="py-3">
                        {gen.input_image_url ? (
                          <a href={gen.input_image_url} target="_blank" rel="noreferrer">
                            <img 
                              src={gen.input_image_url} 
                              alt="raw input" 
                              className="w-10 h-10 object-cover rounded border border-zinc-800 hover:border-[#FFCE00] transition-colors"
                            />
                          </a>
                        ) : (
                          <span className="text-zinc-600">N/A</span>
                        )}
                      </td>
                      {/* Output preview */}
                      <td className="py-3">
                        {gen.output_image_url ? (
                          <a href={gen.output_image_url} target="_blank" rel="noreferrer" className="relative block w-10">
                            <img 
                              src={gen.output_image_url} 
                              alt="ai render" 
                              className="w-10 h-10 object-cover rounded border border-zinc-800 hover:border-[#FFCE00] transition-colors"
                            />
                            <ExternalLink className="absolute bottom-0 right-0 h-2.5 w-2.5 text-white bg-black/60 p-0.5 rounded-tl" />
                          </a>
                        ) : (
                          <span className="text-zinc-600">N/A</span>
                        )}
                      </td>
                      <td className="py-3 font-semibold text-zinc-300">
                        {gen.template_name}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          gen.generation_status === "success" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {gen.generation_status}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-500">
                        {new Date(gen.created_at).toLocaleDateString()} {new Date(gen.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Templates (Col 1) */}
        <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 mb-6">
              Top 5 Templates
            </h3>
            
            <div className="space-y-4">
              {data.topTemplates.length === 0 ? (
                <p className="text-zinc-500 text-xs py-4 text-center">No template usage recorded yet.</p>
              ) : (
                data.topTemplates.map((template, idx) => (
                  <div key={template.id} className="flex items-center justify-between border-b border-[#27272A]/40 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-zinc-600">0{idx + 1}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-200">{template.name}</span>
                        <span className="text-[9px] text-zinc-500 uppercase font-medium">{template.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#FFCE00]">{template.usage_count}</span>
                      <span className="text-[9px] text-zinc-500 font-semibold uppercase">uses</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 bg-[#FFCE00]/5 border border-[#FFCE00]/10 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-[#FFCE00] shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">MVP Limit Warning</h4>
              <p className="text-[10px] text-zinc-400 leading-normal">
                Generations are limited to 180 total. Ensure you manage your active status settings to avoid service interruption.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* New Section: Top Visitors & Top IPs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Visitors */}
        <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-6 flex flex-col">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 mb-6">
            Top Visitor IDs (Free Users)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-zinc-500 text-[10px] uppercase font-bold tracking-wider pb-3">
                  <th className="pb-3">Visitor ID</th>
                  <th className="pb-3 text-right">Generations Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/40 text-xs">
                {!data.topVisitorIds || data.topVisitorIds.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="py-4 text-center text-zinc-500">
                      No visitor activity logged yet.
                    </td>
                  </tr>
                ) : (
                  data.topVisitorIds.map((visitor, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="py-3 font-semibold text-zinc-300 select-all">
                        {visitor.visitor_id}
                      </td>
                      <td className="py-3 text-right font-black text-[#FFCE00]">
                        {visitor.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top IPs */}
        <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-6 flex flex-col">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 mb-6">
            Top IP Addresses
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-zinc-500 text-[10px] uppercase font-bold tracking-wider pb-3">
                  <th className="pb-3">IP Address</th>
                  <th className="pb-3 text-right">Generations Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/40 text-xs">
                {!data.topIpAddresses || data.topIpAddresses.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="py-4 text-center text-zinc-500">
                      No IP logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.topIpAddresses.map((ip, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="py-3 font-semibold text-zinc-350 select-all">
                        {ip.ip_address}
                      </td>
                      <td className="py-3 text-right font-black text-blue-400">
                        {ip.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
