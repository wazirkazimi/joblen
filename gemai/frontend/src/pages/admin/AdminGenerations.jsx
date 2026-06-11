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
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [watermarkFilter, setWatermarkFilter] = useState("");
  const [visitorId, setVisitorId] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [presentationMode, setPresentationMode] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadFiltersData();
    loadGenerations();
  }, [dateRange, templateId, status, presentationMode, watermarkFilter]);

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
      
      const filters = {
        dateRange,
        templateId,
        status,
        visitorId,
        ip: ipAddress,
        presentationMode,
        watermarked: watermarkFilter === "yes" ? "true" : watermarkFilter === "no" ? "false" : "",
        dateFrom: dateRange === "custom" ? dateFrom : "",
        dateTo: dateRange === "custom" ? dateTo : ""
      };

      const data = await adminApi.getGenerations(filters);
      setGenerations(data.generations || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch generations logs from database.");
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setDateRange("all");
    setTemplateId("");
    setStatus("");
    setSearchQuery("");
    setUserTypeFilter("");
    setWatermarkFilter("");
    setVisitorId("");
    setIpAddress("");
    setPresentationMode("");
    setDateFrom("");
    setDateTo("");
  }

  // Filter local generations by SearchQuery, User Type
  const filteredGenerations = generations.filter(gen => {
    // 1. Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      gen.template_name?.toLowerCase().includes(query) ||
      gen.user_ip?.toLowerCase().includes(query) ||
      gen.ip_address?.toLowerCase().includes(query) ||
      gen.visitor_id?.toLowerCase().includes(query) ||
      gen.user_agent?.toLowerCase().includes(query) ||
      gen.openai_model?.toLowerCase().includes(query) ||
      (gen.error_message && gen.error_message.toLowerCase().includes(query))
    );

    if (!matchesSearch) return false;

    // 2. User Type filter
    if (userTypeFilter && gen.user_type !== userTypeFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filters Toolbar */}
      <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-5 space-y-4">
        {/* Row 1: Dropdowns */}
        <div className="flex flex-wrap items-center gap-4">
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
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Template */}
          <div className="flex flex-col gap-1 w-44">
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

          {/* Presentation Mode */}
          <div className="flex flex-col gap-1 w-44">
            <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Presentation Mode</span>
            <select
              value={presentationMode}
              onChange={e => setPresentationMode(e.target.value)}
              className="bg-zinc-950/60 border border-[#27272A] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
            >
              <option value="">All Modes</option>
              <option value="keep_original">Keep Original</option>
              <option value="set_into_ring">Set gemstone into Ring</option>
              <option value="set_into_pendant">Set gemstone into Pendant</option>
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

          {/* Watermark status */}
          <div className="flex flex-col gap-1 w-32">
            <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Watermark</span>
            <select
              value={watermarkFilter}
              onChange={e => setWatermarkFilter(e.target.value)}
              className="bg-zinc-950/60 border border-[#27272A] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
            >
              <option value="">All Statuses</option>
              <option value="yes">Watermarked</option>
              <option value="no">No Watermark</option>
            </select>
          </div>

          {/* User Type */}
          <div className="flex flex-col gap-1 w-32">
            <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">User Type</span>
            <select
              value={userTypeFilter}
              onChange={e => setUserTypeFilter(e.target.value)}
              className="bg-zinc-950/60 border border-[#27272A] px-3 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
            >
              <option value="">All Users</option>
              <option value="free">Free Users</option>
              <option value="paid">Paid/Admin</option>
            </select>
          </div>
        </div>

        {/* Row 2: Custom Date Inputs */}
        {dateRange === "custom" && (
          <div className="flex flex-wrap items-center gap-4 bg-zinc-950/40 p-4 border border-[#27272A] rounded-lg animate-fadeIn">
            <div className="flex flex-col gap-1 w-40">
              <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Start Date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-zinc-950/60 border border-[#27272A] px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
              />
            </div>
            <div className="flex flex-col gap-1 w-40">
              <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">End Date</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-zinc-950/60 border border-[#27272A] px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
              />
            </div>
            <button
              onClick={loadGenerations}
              className="mt-4 bg-[#FFCE00] hover:bg-[#FFCE00]/90 text-[#0F0F10] text-xs font-bold px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              Apply Date Range
            </button>
          </div>
        )}

        {/* Row 3: Text Inputs & Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between pt-4 border-t border-[#27272A]/40">
          <div className="flex flex-wrap gap-4 flex-1">
            {/* Visitor ID search */}
            <div className="flex flex-col gap-1 min-w-[200px] flex-1">
              <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Visitor ID</span>
              <input
                type="text"
                placeholder="Search Visitor ID..."
                value={visitorId}
                onChange={e => setVisitorId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadGenerations()}
                className="bg-zinc-950/60 border border-[#27272A] px-3 py-2 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FFCE00] transition-colors"
              />
            </div>

            {/* IP Address search */}
            <div className="flex flex-col gap-1 min-w-[150px] flex-1">
              <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">IP Address</span>
              <input
                type="text"
                placeholder="Search IP Address..."
                value={ipAddress}
                onChange={e => setIpAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadGenerations()}
                className="bg-zinc-950/60 border border-[#27272A] px-3 py-2 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FFCE00] transition-colors"
              />
            </div>

            {/* Local Search query */}
            <div className="flex flex-col gap-1 min-w-[200px] flex-1">
              <span className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Local Search (Agent, Model, Error)</span>
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search local logs..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-[#27272A] pl-9 pr-4 py-2 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FFCE00] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadGenerations}
              className="bg-[#FFCE00] hover:bg-[#FFCE00]/90 text-[#0F0F10] text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-[#FFCE00]/5 transition-colors cursor-pointer"
            >
              <Filter className="h-3.5 w-3.5" /> Apply Filters
            </button>

            <button
              onClick={resetFilters}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-350 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Reset
            </button>

            <button 
              onClick={loadGenerations} 
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 p-2.5 rounded-lg flex items-center justify-center cursor-pointer shrink-0 transition-colors"
              title="Refresh Log Entries"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
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
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-[#27272A] text-zinc-500 text-[10px] uppercase font-bold tracking-wider pb-3">
                  <th className="pb-3">Input</th>
                  <th className="pb-3">AI Render</th>
                  <th className="pb-3">Template</th>
                  <th className="pb-3">Presentation</th>
                  <th className="pb-3">Visitor ID</th>
                  <th className="pb-3">User Type</th>
                  <th className="pb-3">Watermark</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Model Details</th>
                  <th className="pb-3">IP Address</th>
                  <th className="pb-3">Est. Cost</th>
                  <th className="pb-3">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/40 text-xs">
                {filteredGenerations.map(gen => {
                  const isWatermarked = gen.is_watermarked !== undefined ? gen.is_watermarked : (gen.user_type === "free" || !gen.user_type);
                  return (
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
                          <span className="text-zinc-650 font-mono text-[9px]">no upload</span>
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
                          <span className="text-zinc-650 font-mono text-[9px]">failed</span>
                        )}
                      </td>

                      {/* Template name */}
                      <td className="py-4 font-bold text-zinc-300">
                        {gen.template_name}
                      </td>

                      {/* Presentation Mode */}
                      <td className="py-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-350 text-[10px] font-bold border border-zinc-700 uppercase tracking-wide">
                          {(gen.presentation_mode || "keep_original").replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Visitor ID */}
                      <td className="py-4 font-mono text-[10px] text-zinc-350 select-all" title={gen.visitor_id}>
                        {gen.visitor_id ? gen.visitor_id.substring(0, 12) + "..." : "N/A"}
                      </td>

                      {/* User Type */}
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          gen.user_type === "free" || !gen.user_type
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {gen.user_type || "free"}
                        </span>
                      </td>

                      {/* Watermarked status */}
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          isWatermarked 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                            : "bg-zinc-800 text-zinc-450"
                        }`}>
                          {isWatermarked ? "Yes" : "No"}
                        </span>
                      </td>

                      {/* Status */}
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
                            <span className="text-[10px] text-red-400 mt-1 max-w-[150px] line-clamp-2 leading-relaxed" title={gen.error_message}>
                              {gen.error_message}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* OpenAI Model details */}
                      <td className="py-4 text-zinc-300 font-medium max-w-[120px] truncate" title={`${gen.openai_model || 'N/A'} | Quality: ${gen.openai_quality || 'standard'} | Size: ${gen.openai_size || '1024x1024'}`}>
                        <span className="block text-[10px] font-bold text-zinc-400">{gen.openai_model || "gpt-4o"}</span>
                        {gen.openai_size && <span className="block text-[9px] text-zinc-550">{gen.openai_size} ({gen.openai_quality || "standard"})</span>}
                      </td>

                      {/* IP Address */}
                      <td className="py-4 font-mono text-zinc-400 text-[10px] select-all">
                        {gen.ip_address || gen.user_ip || "127.0.0.1"}
                      </td>

                      {/* Estimated cost */}
                      <td className="py-4 font-mono font-bold text-zinc-300">
                        ${parseFloat(gen.estimated_cost_usd || 0).toFixed(3)}
                      </td>

                      {/* Created at */}
                      <td className="py-4 text-zinc-500 text-[11px] whitespace-nowrap">
                        {new Date(gen.created_at).toLocaleDateString()}<br/>
                        {new Date(gen.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
