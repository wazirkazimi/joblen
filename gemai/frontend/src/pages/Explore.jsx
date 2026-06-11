import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Search, ArrowRight, Gem, CheckCircle2, X, Upload, Download, Loader2, RefreshCw, Eye, AlertTriangle } from "lucide-react";
import { templatesApi } from "../api/templatesApi";

const loadingMessages = [
  "Analysing your stone...",
  "Applying the style...",
  "Enhancing details...",
  "Almost ready..."
];

// Helper functions for cookie management
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax`;
}

function getOrCreateVisitorId() {
  let vId = localStorage.getItem('visitor_id') || getCookie('visitor_id');
  if (!vId) {
    vId = 'visitor_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  localStorage.setItem('visitor_id', vId);
  setCookie('visitor_id', vId);
  return vId;
}

export default function Explore() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // In-place generation states
  const [selectedTemplateForGen, setSelectedTemplateForGen] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [outputUrl, setOutputUrl] = useState(null);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [presentationMode, setPresentationMode] = useState("keep_original");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [exploreGenError, setExploreGenError] = useState(null);

  // Visitor tracking and limit states
  const [visitorId, setVisitorId] = useState('');
  const [freeLimits, setFreeLimits] = useState({ limit: 3, used: 0, remaining: 3 });
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [hidePricing, setHidePricing] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    const vId = getOrCreateVisitorId();
    setVisitorId(vId);
    loadLimits(vId);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          const settings = data.settings || {};
          if (settings.hide_pricing) {
            setHidePricing(settings.hide_pricing === "true");
          }
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
    loadSettings();
  }, []);

  const loadLimits = async (vId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/free-usage?visitorId=${vId}`);
      if (res.ok) {
        const data = await res.json();
        setFreeLimits({
          limit: data.limit,
          used: data.used,
          remaining: data.remaining
        });
        if (data.whatsappLink) {
          setWhatsappLink(data.whatsappLink);
        }
        if (data.maintenanceMode !== undefined) {
          setMaintenanceMode(data.maintenanceMode);
        }
      }
    } catch (e) {
      console.error("Failed to load visitor limits:", e);
    }
  };

  // Cycle loading messages
  useEffect(() => {
    let interval;
    if (isGenerating) {
      setLoadingMessageIndex(0);
      interval = setInterval(() => {
        setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleDownload = async (url, filename) => {
    try {
      if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("CORS error");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      window.open(url, '_blank');
    }
  };

  const handleModalGenerate = async () => {
    let isCompatible = true;
    if (selectedTemplateForGen && selectedTemplateForGen.allowed_presentation_modes_json) {
      try {
        const allowed = JSON.parse(selectedTemplateForGen.allowed_presentation_modes_json);
        if (Array.isArray(allowed)) {
          isCompatible = allowed.includes(presentationMode);
        }
      } catch (e) {}
    }

    if (!isCompatible) {
      setExploreGenError("This template is not available for the selected presentation type.");
      return;
    }

    const isOutOfLimits = freeLimits.remaining <= 0;
    if (isOutOfLimits) {
      setShowLimitModal(true);
      return;
    }

    if (!uploadedFile || !selectedTemplateForGen) return;

    setIsGenerating(true);
    setOutputUrl(null);
    setExploreGenError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("templateId", selectedTemplateForGen.id);
      formData.append("aspectRatio", aspectRatio);
      formData.append("visitorId", visitorId);
      formData.append("presentationMode", presentationMode);

      const genRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/generate`, {
        method: "POST",
        body: formData,
      });

      let errorMsg = "Image generation failed. Please try again or contact us on WhatsApp.";
      if (!genRes.ok) {
        try {
          const data = await genRes.json();
          if (data && data.maintenance) {
            errorMsg = data.message;
            throw new Error(errorMsg);
          }
          if (data && data.limitReached) {
            setFreeLimits(prev => ({ ...prev, remaining: 0 }));
            setShowLimitModal(true);
            throw new Error(data.message);
          }
          if (data && data.error) {
            errorMsg = data.error;
          }
          if (data && data.whatsappLink) {
            setWhatsappLink(data.whatsappLink);
          }
        } catch (e) {
          if (e.message && (e.message.includes("generations") || e.message.includes("maintenance"))) {
            throw e;
          }
        }
        throw new Error(errorMsg);
      }

      const data = await genRes.json();
      setOutputUrl(data.outputUrl);
      setWhatsappLink(data.whatsappLink || '');
      loadLimits(visitorId);
    } catch (err) {
      console.error(err);
      setExploreGenError(err.message || "Something went wrong - please try again");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoading(true);
        const data = await templatesApi.getTemplates();
        setTemplates(data.templates || []);
      } catch (err) {
        console.error("Failed to load templates:", err);
        setError("Failed to fetch templates. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = ["All", "Gemstone", "Ring", "Model", "Experimental"];

  const filteredTemplates = templates.filter(template => {
    // 1. Search filter
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 2. Category filter
    if (activeCategory === "All") return true;
    if (activeCategory === "Experimental") return template.is_beta;
    
    const cat = template.category.toLowerCase();
    if (activeCategory === "Gemstone") {
      return cat === "gemstone" || cat === "gemstones" || cat === "jewelry-sets" || cat === "editorial" || cat === "lifestyle";
    }
    if (activeCategory === "Ring") {
      return cat === "ring" || cat === "rings";
    }
    if (activeCategory === "Model") {
      return cat === "model" || cat === "fashion-models";
    }
    
    return true;
  });

  const handleUseTemplate = (template) => {
    setUploadedFile(null);
    setUploadedPreviewUrl(null);
    setOutputUrl(null);
    setExploreGenError(null);
    setAspectRatio("1:1");
    if (template.preferred_presentation_mode) {
      setPresentationMode(template.preferred_presentation_mode);
    } else if (template.category === 'ring' || template.category === 'model') {
      setPresentationMode('set_into_ring');
    } else {
      setPresentationMode('keep_original');
    }
    setSelectedTemplateForGen(template);
  };

  const isCompatible = (() => {
    if (selectedTemplateForGen && selectedTemplateForGen.allowed_presentation_modes_json) {
      try {
        const allowed = JSON.parse(selectedTemplateForGen.allowed_presentation_modes_json);
        if (Array.isArray(allowed)) {
          return allowed.includes(presentationMode);
        }
      } catch (e) {}
    }
    return true;
  })();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-gray-900 font-sans selection:bg-amber-500/25 selection:text-amber-800 antialiased flex flex-col overflow-x-hidden">
      
      {/* Maintenance Mode Banner */}
      {maintenanceMode && (
        <div className="bg-amber-500 text-gray-950 text-center py-3.5 px-4 text-xs font-black tracking-wide uppercase sticky top-24 z-40 shadow-md flex items-center justify-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          <span>AuraLux AI is temporarily in maintenance mode. You can explore templates, but image generation is currently paused.</span>
        </div>
      )}

      {/* Floating Capsule Navbar */}
      <div className="fixed top-5 left-0 w-full px-4 z-50 flex justify-center">
        <nav className={`w-full max-w-4xl bg-white/80 backdrop-blur-xl border border-black/5 rounded-full px-6 py-3 flex justify-between items-center transition-all duration-300
          ${isScrolled ? 'shadow-lg shadow-black/5 border-black/10' : 'shadow-none'}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <span className="text-lg md:text-xl font-black tracking-tight text-gray-900">
              Auralux<span className="text-[#FFCE00] font-black"> AI</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-xs font-bold tracking-wider uppercase text-gray-500">
            <a href="/#how-it-works" className="hover:text-black transition-colors">How it works</a>
            <Link to="/explore" className="text-[#FFCE00] hover:text-amber-600 transition-colors font-extrabold">Explore</Link>
            {!hidePricing && <a href="/#pricing" className="hover:text-black transition-colors">Pricing</a>}
            <a href="/#faq" className="hover:text-black transition-colors">FAQ</a>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/")}
              className="bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 font-extrabold text-xs md:text-sm px-5 py-2.5 md:px-5 md:py-2.5 rounded-full transition-all shadow-md shadow-amber-500/10 hover:scale-[1.03] active:scale-98"
            >
              Create Free
            </button>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-36 pb-8 z-10 relative">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4">
          Explore AI Product Templates
        </h1>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-medium">
          Browse our curated catalog of professional luxury settings. Choose a template to transform your raw jewelry photography instantly.
        </p>
      </section>

      {/* Filters & Search */}
      <section className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-gray-200/60 mb-8">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                activeCategory === cat
                  ? "bg-[#FFCE00] text-gray-950 shadow-md shadow-amber-500/10"
                  : "bg-white text-gray-500 hover:bg-gray-50 hover:text-black border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FFCE00] transition-colors shadow-xs"
          />
        </div>
      </section>

      {/* Templates Grid */}
      <main className="max-w-7xl mx-auto w-full px-6 pb-24 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-[#FFCE00] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-sm">Loading design library...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white border border-red-200 rounded-2xl p-8 max-w-md mx-auto shadow-xs">
            <p className="text-red-500 mb-4 font-semibold">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#FFCE00] text-gray-950 px-4 py-2 rounded-full hover:bg-[#E5B800] text-xs font-bold transition-all shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20 text-gray-450">
            <p className="text-lg font-bold">No templates found matching your criteria.</p>
            <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map(template => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onSelect={() => handleUseTemplate(template)} 
                onZoom={(url) => setLightboxImage(url)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Inline Generation Modal overlay */}
      {selectedTemplateForGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-4xl w-full p-6 md:p-8 border border-gray-200 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedTemplateForGen(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-655 transition-colors p-1"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl md:text-2xl font-black text-gray-900">
                Generate Image with <span className="text-[#FFCE00]">{selectedTemplateForGen.name}</span>
              </h3>
              <p className="text-gray-500 text-xs mt-1">
                Upload your jewelry or gemstone photo and get it rendered instantly in this style.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Left Column: Template Preview & Upload Dropzone */}
              <div className="space-y-6">
                {/* Template Preview Box */}
                <div className="bg-neutral-50 border border-gray-200/50 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Style Template Preview</span>
                  <div className="w-full aspect-[4/3] max-h-[160px] bg-white rounded-xl overflow-hidden border border-gray-150 flex items-center justify-center">
                    <img src={selectedTemplateForGen.output_preview_url} alt="Style template" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Upload Area */}
                <div className="bg-white p-5 rounded-2xl border border-gray-250 shadow-xs">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Step 1: Upload Product Photo</span>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 10 * 1024 * 1024) {
                        setUploadedFile(file);
                        setUploadedPreviewUrl(URL.createObjectURL(file));
                        setExploreGenError(null);
                      }
                    }}
                    onClick={() => !uploadedPreviewUrl && document.getElementById('explore-file-input')?.click()}
                    className={`w-full border-2 border-dashed rounded-xl p-6 min-h-[140px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                      ${uploadedPreviewUrl 
                        ? 'border-[#FFCE00] bg-amber-50/[0.02] cursor-default' 
                        : 'border-gray-250 hover:border-[#FFCE00] hover:bg-gray-50'}`}
                  >
                    <input 
                      type="file" 
                      id="explore-file-input"
                      className="hidden" 
                      accept="image/jpeg, image/png, image/webp" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setUploadedFile(file);
                          setUploadedPreviewUrl(URL.createObjectURL(file));
                          setExploreGenError(null);
                        }
                      }}
                    />
                    {uploadedPreviewUrl ? (
                      <div className="relative w-full max-w-[120px] flex flex-col items-center">
                        <div className="relative aspect-square w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white">
                          <img src={uploadedPreviewUrl} alt="Upload Thumbnail" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFile(null);
                              setUploadedPreviewUrl(null);
                              setOutputUrl(null);
                              setExploreGenError(null);
                            }}
                            className="absolute top-1 right-1 bg-black/80 hover:bg-red-650 text-white p-0.5 rounded-full"
                          >
                            <X size={10} />
                          </button>
                        </div>
                        <span className="text-[9px] font-bold text-gray-500 truncate max-w-[100px] mt-1.5">{uploadedFile?.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-450 mb-2" />
                        <p className="text-gray-900 font-bold text-xs text-center">Tap or Drag to Upload</p>
                        <p className="text-gray-450 text-[9px] mt-0.5 font-semibold">JPG, PNG, WEBP (Max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Settings, Generate & Output */}
              <div className="flex flex-col h-full justify-between space-y-6">
                <div>
                  {/* Presentation Mode Selector */}
                  <div className="mb-5 bg-white p-4 rounded-xl border border-gray-250 shadow-xs">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                      Step 2: Presentation Type
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: "keep_original", name: "Keep Original Product" },
                        { id: "set_into_ring", name: "Set Gemstone into Ring" },
                        { id: "set_into_pendant", name: "Set Gemstone into Pendant" }
                      ].map((mode) => {
                        const isSelected = presentationMode === mode.id;
                        let isAllowed = true;
                        if (selectedTemplateForGen && selectedTemplateForGen.allowed_presentation_modes_json) {
                          try {
                            const allowed = JSON.parse(selectedTemplateForGen.allowed_presentation_modes_json);
                            if (Array.isArray(allowed)) {
                              isAllowed = allowed.includes(mode.id);
                            }
                          } catch (e) {}
                        }

                        return (
                          <button
                            key={mode.id}
                            type="button"
                            disabled={!isAllowed}
                            onClick={() => { setPresentationMode(mode.id); setOutputUrl(null); }}
                            className={`py-2 px-3 rounded-lg text-[10px] font-black tracking-wider transition-all border flex justify-between items-center
                              ${!isAllowed 
                                ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed opacity-50' 
                                : isSelected 
                                  ? 'bg-[#FFCE00] text-gray-950 border-[#FFCE00] shadow-sm' 
                                  : 'bg-white text-gray-400 border-gray-250 hover:bg-gray-50 hover:text-black'}`}
                          >
                            <span>{mode.name}</span>
                            {!isAllowed && <span className="text-[8px] font-bold text-red-400 font-sans">Not compatible</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="mb-5 bg-white p-4 rounded-xl border border-gray-250 shadow-xs">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                      Step 3: Aspect Ratio
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["1:1", "9:16", "16:9"].map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => { setAspectRatio(ratio); setOutputUrl(null); }}
                          className={`py-2 px-1 rounded-lg text-[10px] font-black tracking-wider transition-all border text-center
                            ${aspectRatio === ratio 
                              ? 'bg-[#FFCE00] text-gray-950 border-[#FFCE00] shadow-sm' 
                              : 'bg-white text-gray-400 border-gray-250 hover:bg-gray-50 hover:text-black'}`}
                        >
                          {ratio === "1:1" ? "Square (1:1)" : ratio === "9:16" ? "Portrait (9:16)" : "Landscape (16:9)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Warnings */}
                  {!isCompatible && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-3 text-xs font-bold flex gap-2 items-center leading-normal">
                      <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                      <span>This template is not available for the selected presentation type.</span>
                    </div>
                  )}

                  {maintenanceMode && (
                    <div className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl p-3 text-xs font-bold flex gap-2 items-center leading-normal">
                      <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                      <span>AuraLux AI is temporarily in maintenance mode. Image generation is currently paused.</span>
                    </div>
                  )}

                  {/* Generate Trigger */}
                  <button 
                    type="button"
                    onClick={handleModalGenerate}
                    disabled={isGenerating || maintenanceMode || !isCompatible || ((!uploadedFile) && freeLimits.remaining > 0)}
                    className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center transition-all duration-150 shadow-md
                      ${((!uploadedFile) && freeLimits.remaining > 0) || !isCompatible || maintenanceMode
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-205 shadow-none' 
                        : isGenerating 
                          ? 'bg-amber-300 text-gray-900 cursor-wait' 
                          : freeLimits.remaining <= 0
                            ? 'bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-black border border-gray-350 cursor-pointer shadow-none'
                            : 'bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 active:scale-98'
                      }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Generating...
                      </>
                    ) : freeLimits.remaining <= 0 ? (
                      "Limit Reached - Get More"
                    ) : (
                      "Generate AI Image"
                    )}
                  </button>

                  <div className="mt-2.5 text-center">
                    <span className="text-[11px] font-semibold text-gray-500">
                      {freeLimits.remaining > 0 ? (
                        <>You have <span className="font-bold text-gray-900">{freeLimits.remaining}</span> free generations left</>
                      ) : (
                        <span className="text-red-500 font-bold">0 free generations left. Limit reached!</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Render Output Area */}
                <div className="bg-neutral-50 rounded-2xl border border-gray-200/50 p-4 min-h-[200px] flex flex-col justify-center">
                  {isGenerating ? (
                    <div className="flex flex-col items-center py-6 text-center">
                      <Sparkles size={24} className="text-amber-500 animate-spin mb-3" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider animate-pulse">
                        {loadingMessages[loadingMessageIndex]}
                      </span>
                    </div>
                  ) : outputUrl ? (
                    <div className="w-full">
                      <div className={`w-full ${aspectRatio === "9:16" ? "aspect-[9/16] max-h-[220px]" : aspectRatio === "16:9" ? "aspect-[16/9]" : "aspect-square"} mx-auto rounded-xl overflow-hidden border border-gray-200/65 bg-white mb-4`}>
                        <img src={outputUrl} alt="AI output" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <button 
                          onClick={() => handleDownload(outputUrl, `auralux-${selectedTemplateForGen.id}.png`)}
                          className="flex-1 bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 font-black py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          <Download size={13} /> Download
                        </button>
                        <button 
                          onClick={() => setLightboxImage(outputUrl)}
                          className="flex-1 bg-white hover:bg-gray-50 border border-gray-205 text-gray-750 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Eye size={13} /> View Full Size
                        </button>
                        <button 
                          onClick={() => setOutputUrl(null)}
                          className="flex-1 bg-white hover:bg-gray-50 border border-gray-250 text-gray-750 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RefreshCw size={12} /> Clear
                        </button>
                      </div>
                      <div className="text-center pt-2 border-t border-gray-200/60">
                        <span className="text-[10px] text-gray-455 block font-bold mb-1.5">Need custom images, higher resolution or video reels?</span>
                        <a
                          href={whatsappLink || 'https://wa.me/918296608821'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 font-extrabold text-[10px] px-4 py-1.5 rounded-md shadow-sm"
                        >
                          WhatsApp Custom Request
                        </a>
                      </div>
                    </div>
                  ) : exploreGenError ? (
                    <div className="flex flex-col items-center justify-center text-center py-6">
                      <span className="text-red-500 font-bold text-xs mb-1">Generation Failed</span>
                      <p className="text-gray-655 text-[10px] max-w-[240px] mb-4 font-semibold leading-relaxed">{exploreGenError}</p>
                      <a
                        href={whatsappLink || 'https://wa.me/918296608821'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#FFCE00] hover:bg-[#E5B800] text-gray-955 font-black px-4 py-2 rounded-lg text-xs"
                      >
                        Contact on WhatsApp
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-8 text-gray-400">
                      <Sparkles size={20} className="mb-2" />
                      <h4 className="font-bold text-gray-750 text-xs">AI Render Result</h4>
                      <p className="text-[10px] text-gray-455 mt-0.5 max-w-[200px]">
                        Upload a photo and click generate to render it here in seconds.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Limit Reached Modal overlay */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-md w-full p-8 border border-gray-200 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowLimitModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-655 transition-colors p-1"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-500/10 text-[#FFCE00] rounded-full flex items-center justify-center mb-6">
                <Sparkles size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Free Limit Reached</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                You have used your 3 free high-quality generations. WhatsApp us to get more images or unlock custom video reels and catalogues!
              </p>
              <div className="flex flex-col w-full gap-3">
                <a
                  href={whatsappLink || 'https://wa.me/918296608821'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 font-black py-4 rounded-xl text-center text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Contact on WhatsApp
                </a>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-655 font-bold py-3.5 rounded-xl text-center text-xs transition-all border border-gray-205"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Lightbox Modal for Original Size Image Preview */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            type="button"
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X size={24} />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img 
              src={lightboxImage} 
              alt="Original Template View" 
              className="max-w-full max-h-[80vh] rounded-lg object-contain shadow-2xl border border-white/5"
            />
            <p className="text-gray-400 text-xs mt-3 font-semibold">Original Aspect Ratio & Sizing</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Single Preview Template card
function TemplateCard({ template, onSelect, onZoom }) {
  return (
    <div className="group bg-white border border-gray-200/80 rounded-[20px] overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 flex flex-col hover:scale-[1.01]">
      <div className="relative h-64 w-full bg-neutral-50 border-b border-gray-100 flex items-center justify-center overflow-hidden">
        <img 
          src={template.output_preview_url} 
          alt={template.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onZoom(template.output_preview_url); }}
          className="absolute bottom-3 left-3 bg-black/60 hover:bg-black/80 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide flex items-center gap-1 transition-colors z-20 backdrop-blur-xs shadow-sm"
        >
          View Original Size
        </button>
        <span className="absolute right-4 top-4 bg-[#FFCE00] text-gray-950 text-[10px] tracking-wider font-extrabold px-2 py-1 rounded uppercase shadow-sm">
          AI Render
        </span>
      </div>

      {/* Info Body */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-extrabold tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full uppercase">
              {template.category}
            </span>
            {template.is_beta && (
              <span className="text-[10px] font-extrabold tracking-wider text-[#FFCE00] bg-amber-500/10 px-2.5 py-1 rounded-full uppercase">
                Beta
              </span>
            )}
            {template.is_featured && (
              <span className="text-[10px] font-extrabold tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase border border-teal-100">
                Featured
              </span>
            )}
          </div>
          <h3 className="text-lg font-black text-gray-900 tracking-tight group-hover:text-amber-600 transition-colors">
            {template.name}
          </h3>
          <p className="text-gray-500 text-xs mt-1.5 leading-relaxed font-medium">
            {template.description || "Transform jewelry into catalog photography settings instantly."}
          </p>
        </div>

        <button 
          onClick={onSelect}
          className="w-full mt-6 bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 py-3 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2"
        >
          Use This Template <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
