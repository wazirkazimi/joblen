import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { BarChart3, TrendingUp, HelpCircle, DollarSign } from "lucide-react";
import { adminApi } from "../../api/adminApi";

const COLORS = ["#FFCE00", "#3B82F6", "#EF4444", "#10B981", "#8B5CF6", "#F59E0B"];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await adminApi.getAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
        setError("Failed to load analytics charts data from database.");
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-[#FFCE00] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm">Aggregating historical metrics charts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs max-w-lg mx-auto text-center">
        {error}
      </div>
    );
  }

  const hasDailyData = data.dailyGenerations && data.dailyGenerations.length > 0;
  const hasTemplateUsage = data.templateUsage && data.templateUsage.length > 0;
  const hasStatusData = data.statusBreakdown && data.statusBreakdown.length > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Spend Analytics Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/30 border border-[#27272A] rounded-xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Spend (Est.)</span>
            <p className="text-3xl font-black text-[#FFCE00]">${data.estimatedSpendTotal.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#FFCE00]/5 border border-[#FFCE00]/10 text-[#FFCE00]">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-zinc-900/30 border border-[#27272A] rounded-xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Spend Today (Est.)</span>
            <p className="text-3xl font-black text-[#FFCE00]">${data.estimatedSpendToday.toFixed(3)}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#FFCE00]/5 border border-[#FFCE00]/10 text-[#FFCE00]">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Daily Volume Chart */}
      <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-6">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 mb-6 flex items-center gap-2">
          <TrendingUp className="h-4.5 w-4.5 text-[#FFCE00]" />
          Daily Volume (Last 30 Days)
        </h3>
        
        <div className="h-80 w-full text-xs">
          {hasDailyData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyGenerations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFCE00" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FFCE00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="date" stroke="#71717A" tickLine={false} axisLine={false} />
                <YAxis stroke="#71717A" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#18181B", borderColor: "#27272A", color: "#F4F4F5" }} 
                  itemStyle={{ color: "#FFCE00" }} 
                />
                <Area type="monotone" dataKey="count" name="Generations" stroke="#FFCE00" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-650">No daily logs found.</div>
          )}
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Template Share of Usage */}
        <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-6">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 mb-6">
            Template Usage Comparison
          </h3>
          <div className="h-80 w-full text-xs">
            {hasTemplateUsage ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.templateUsage} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
                  <XAxis type="number" stroke="#71717A" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="templateName" stroke="#F4F4F5" width={80} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181B", borderColor: "#27272A", color: "#F4F4F5" }}
                    itemStyle={{ color: "#FFCE00" }}
                  />
                  <Bar dataKey="count" name="Usage Count" fill="#FFCE00" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-650">No template data.</div>
            )}
          </div>
        </div>

        {/* Success/Failure Ratio */}
        <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-6">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 mb-6">
            Status Breakdown (Success vs Failure)
          </h3>
          <div className="h-80 w-full text-xs flex flex-col md:flex-row items-center justify-center gap-6">
            {hasStatusData ? (
              <>
                <div className="h-60 w-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.statusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                      >
                        {data.statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.status === "success" ? "#10B981" : "#EF4444"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#18181B", borderColor: "#27272A" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legends */}
                <div className="flex flex-col gap-3">
                  {data.statusBreakdown.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: row.status === "success" ? "#10B981" : "#EF4444" }}></div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white capitalize">{row.status}</span>
                        <span className="text-[10px] text-zinc-500 font-semibold">{row.count} instances</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-zinc-650">No generation attempts recorded yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
