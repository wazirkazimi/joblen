import React, { useState, useEffect } from "react";
import { 
  Filter, 
  Download, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search
} from "lucide-react";
import { adminApi } from "../../api/adminApi";

export default function AdminGenerations() {
  const [generations, setGenerations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [dateRange, setDateRange] = useState("all");
  const [templateId, setTemplateId] = useState("");
  const [status, setStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadFiltersData();
    loadGenerations();
  }, [dateRange, templateId, status]);

  async function loadFiltersData() {
    try {
      const data = await adminApi.getTemplates();
      setTemplates(data.templates || []);
    } catch (e) {
      console.error("Failed to load templates for filter dropdown:", e);
    }
  }

  async function loadGenerations() {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getGenerations({ dateRange, templateId, status });
      setGenerations(data.generations || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch generations logs from database.");
    } finally {
      setLoading(false);
    }
  }

  // Filter local generations by SearchQuery (user IP or agent check)
  const filteredGenerations = generations.filter(gen => {
    const query = searchQuery.toLowerCase();
    return (
      gen.template_name?.toLowerCase().includes(query) ||
      gen.user_ip?.toLowerCase().includes(query) ||
      gen.user_agent?.toLowerCase().includes(query) ||
      (gen.error_message && gen.error_message.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filters Toolbar */}
      <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Selection items */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Date range */}
          <div className="flex flex-col gap-1 w-36">
            <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Date Range</span>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="bg-zinc-950/60 border border-[#27272A] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          {/* Template */}
          <div className="flex flex-col gap-1 w-48">
            <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Filter by Design</span>
            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              className="bg-zinc-950/60 border border-[#27272A] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
            >
              <option value="">All Templates</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1 w-32">
            <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Status</span>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="bg-zinc-950/60 border border-[#27272A] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search IP, Agent, Error..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/60 border border-[#27272A] pl-9 pr-4 py-2 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FFCE00] transition-colors"
          />
        </div>

        <button 
          onClick={loadGenerations} 
          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 p-2.5 rounded-lg flex items-center justify-center cursor-pointer shrink-0"
          title="Refresh Log Entries"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Generations Log list */}
      <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-6">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-xs">Querying database schema...</div>
        ) : filteredGenerations.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">No generation logs match the filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-zinc-500 text-[10px] uppercase font-bold tracking-wider pb-3">
                  <th className="pb-3">Input Image</th>
                  <th className="pb-3">AI Rendered</th>
                  <th className="pb-3">Template Name</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">IP Address</th>
                  <th className="pb-3 max-w-xs">User Agent</th>
                  <th className="pb-3">Est. Cost</th>
                  <th className="pb-3">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/40 text-xs">
                {filteredGenerations.map(gen => (
                  <tr key={gen.id} className="hover:bg-zinc-900/10 transition-colors">
                    {/* Input preview */}
                    <td className="py-4">
                      {gen.input_image_url ? (
                        <a href={gen.input_image_url} target="_blank" rel="noreferrer" className="relative block w-10">
                          <img 
                            src={gen.input_image_url} 
                            alt="input raw" 
                            className="w-10 h-10 object-cover rounded border border-zinc-800 hover:border-[#FFCE00] transition-colors"
                          />
                        </a>
                      ) : (
                        <span className="text-zinc-600 font-mono text-[9px]">no upload</span>
                      )}
                    </td>

                    {/* Output preview */}
                    <td className="py-4">
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
                        <span className="text-zinc-600 font-mono text-[9px]">failed</span>
                      )}
                    </td>

                    {/* Template name */}
                    <td className="py-4 font-bold text-zinc-300">
                      {gen.template_name}
                    </td>

                    {/* Status with error hover tooltips */}
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className={`px-2 py-0.5 w-max rounded text-[9px] font-extrabold uppercase ${
                          gen.generation_status === "success" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {gen.generation_status}
                        </span>
                        {gen.error_message && (
                          <span className="text-[10px] text-red-400 mt-1 max-w-[180px] line-clamp-2 leading-relaxed" title={gen.error_message}>
                            {gen.error_message}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* User IP */}
                    <td className="py-4 font-mono text-zinc-400 text-[10px]">
                      {gen.user_ip || "127.0.0.1"}
                    </td>

                    {/* User Agent */}
                    <td className="py-4 text-zinc-550 max-w-[180px] truncate leading-normal" title={gen.user_agent}>
                      {gen.user_agent || "N/A"}
                    </td>

                    {/* Estimated cost */}
                    <td className="py-4 font-mono font-bold text-zinc-300">
                      ${parseFloat(gen.estimated_cost_usd || 0).toFixed(3)}
                    </td>

                    {/* Created at */}
                    <td className="py-4 text-zinc-500 text-[11px]">
                      {new Date(gen.created_at).toLocaleDateString()}<br/>
                      {new Date(gen.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
