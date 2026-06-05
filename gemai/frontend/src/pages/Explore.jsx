import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Search, ArrowRight, Gem, CheckCircle2 } from "lucide-react";
import { templatesApi } from "../api/templatesApi";

export default function Explore() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

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
    // Navigate to homepage with selected template as query parameter
    navigate(`/?template=${template.id}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-gray-900 font-sans selection:bg-amber-500/25 selection:text-amber-800 antialiased flex flex-col">
      {/* Floating Capsule Navbar */}
      <div className="fixed top-5 left-0 w-full px-4 z-50 flex justify-center">
        <nav className={`w-full max-w-4xl bg-white/80 backdrop-blur-xl border border-black/5 rounded-full px-6 py-3 flex justify-between items-center transition-all duration-300
          ${isScrolled ? 'shadow-lg shadow-black/5 border-black/10' : 'shadow-none'}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[#FFCE00] shadow-sm">
              <Gem size={16} className="fill-current" />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900">
              Auralux<span className="text-[#FFCE00] font-black"> AI</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-xs font-bold tracking-wider uppercase text-gray-500">
            <a href="/#how-it-works" className="hover:text-black transition-colors">How it works</a>
            <Link to="/explore" className="text-[#FFCE00] hover:text-amber-600 transition-colors font-extrabold">Explore</Link>
            <a href="/#pricing" className="hover:text-black transition-colors">Pricing</a>
            <a href="/#faq" className="hover:text-black transition-colors">FAQ</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/explore" className="text-[#FFCE00] hover:text-amber-600 transition-colors font-extrabold text-xs uppercase tracking-wider md:hidden">Explore</Link>
            <button 
              onClick={() => navigate("/")}
              className="bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 font-extrabold text-xs md:text-sm px-5 py-2 rounded-full transition-all shadow-md shadow-amber-500/10 hover:scale-[1.03] active:scale-98"
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
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Before/After comparison slider inside template card
function TemplateCard({ template, onSelect }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <div 
      className="group bg-white border border-gray-200/80 rounded-[20px] overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 flex flex-col hover:scale-[1.01]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setSliderPosition(50); // reset position
      }}
    >
      {/* Before/After comparison container */}
      <div 
        className="relative h-64 w-full overflow-hidden select-none cursor-ew-resize bg-gray-50 border-b border-gray-100"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Output Image (After) */}
        <img 
          src={template.output_preview_url} 
          alt={`${template.name} output`} 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Input Image (Before - Clipped) */}
        {template.input_preview_url ? (
          <div 
            className="absolute inset-0 overflow-hidden border-r border-[#FFCE00]/80 shadow-[0_0_10px_rgba(255,206,0,0.5)]" 
            style={{ width: `${sliderPosition}%` }}
          >
            <img 
              src={template.input_preview_url} 
              alt={`${template.name} input`} 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none max-w-none grayscale opacity-80"
              style={{ width: "100%", height: "100%" }}
            />
            {/* Label BEFORE */}
            <span className="absolute left-4 top-4 bg-black/60 backdrop-blur-sm text-[10px] tracking-wider font-extrabold text-[#FFCE00] px-2 py-1 rounded border border-[#FFCE00]/20 uppercase">
              Before
            </span>
          </div>
        ) : (
          <div 
            className="absolute left-4 top-4 bg-black/60 backdrop-blur-sm text-[10px] tracking-wider font-extrabold text-[#FFCE00] px-2 py-1 rounded border border-[#FFCE00]/20 uppercase"
            style={{ display: sliderPosition > 15 ? 'block' : 'none' }}
          >
            Raw Upload
          </div>
        )}

        {/* Label AFTER */}
        <span className="absolute right-4 top-4 bg-[#FFCE00] text-gray-950 text-[10px] tracking-wider font-extrabold px-2 py-1 rounded uppercase shadow-sm">
          AFTER (AI RENDER)
        </span>

        {/* Slider Indicator Dot */}
        {template.input_preview_url && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FFCE00] border border-gray-950 shadow-md flex items-center justify-center pointer-events-none"
            style={{ left: `calc(${sliderPosition}% - 12px)` }}
          >
            <span className="text-[10px] text-gray-950 font-black">⇄</span>
          </div>
        )}
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
