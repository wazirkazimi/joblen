import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Upload, Sparkles, Download, Loader2, X, Gem, CheckCircle2, RefreshCw, ChevronDown } from 'lucide-react';

const loadingMessages = [
  "Analysing your stone...",
  "Applying the style...",
  "Enhancing details...",
  "Almost ready..."
];

const Highlight = ({ children }) => (
  <span className="text-[#FFCE00] font-bold underline decoration-[#FFCE00] underline-offset-4">
    {children}
  </span>
);

const faqs = [
  {
    question: "Why should I use Auralux AI when I can use ChatGPT?",
    answer: (
      <>
        ChatGPT image generation is great, but it has <Highlight>daily generation limits</Highlight> and requires you to <Highlight>experiment with prompts yourself</Highlight>.
        <br /><br />
        Auralux AI is built specifically for <Highlight>jewellery and gemstone sellers</Highlight>.
        <br /><br />
        We've already created <Highlight>professional luxury templates</Highlight> designed for <Highlight>product photography</Highlight>.
        <br /><br />
        Simply <Highlight>upload your image</Highlight>, <Highlight>choose a style</Highlight>, and generate a <Highlight>professional marketing image in seconds</Highlight> without trial and error.
      </>
    )
  },
  {
    question: "Will my generated image look exactly like my uploaded product?",
    answer: (
      <>
        Auralux AI tries to preserve the <Highlight>overall appearance</Highlight>, <Highlight>gemstone characteristics</Highlight>, <Highlight>colors</Highlight>, and <Highlight>design details</Highlight> of your uploaded item while applying the selected visual style.
      </>
    )
  },
  {
    question: "How long does image generation take?",
    answer: (
      <>
        Most images are generated within <Highlight>a few seconds</Highlight>.
      </>
    )
  },
  {
    question: "Can I download my generated images?",
    answer: (
      <>
        Yes. Every image can be downloaded in <Highlight>high quality</Highlight> and used for <Highlight>Instagram</Highlight>, <Highlight>WhatsApp</Highlight>, <Highlight>catalogs</Highlight>, <Highlight>websites</Highlight>, and <Highlight>marketing materials</Highlight>.
      </>
    )
  },
  {
    question: "Do you create custom AI product videos and reels?",
    answer: (
      <>
        Yes. We also offer <Highlight>custom AI images</Highlight>, <Highlight>AI video reels</Highlight>, <Highlight>luxury advertisements</Highlight>, and <Highlight>social media creatives</Highlight> through our WhatsApp service.
      </>
    )
  },
  {
    question: "What kind of products work best?",
    answer: (
      <>
        Auralux AI works best with <Highlight>gemstones</Highlight>, <Highlight>rings</Highlight>, <Highlight>necklaces</Highlight>, <Highlight>earrings</Highlight>, <Highlight>bracelets</Highlight>, <Highlight>diamonds</Highlight>, and most jewellery products.
      </>
    )
  }
];

const marqueePairs = [
  {
    input: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/neck_ypwtcu.jpg",
    output: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236144/neck_pv3ad2.png"
  },
  {
    input: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780241242/ring_zbvaee.png",
    output: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780241955/ring-model1_xidkkl.png"
  },
  {
    input: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/red_uke10n.jpg",
    output: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236147/red_xejmap.png"
  },
  {
    input: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/blue1_np3ra3.png",
    output: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236143/blue1_zyl9fg.png"
  },
  {
    input: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/qu_o7yzms.png",
    output: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236145/qu_kkjvvk.png"
  },
  {
    input: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780242141/Screenshot_2026-05-31_211148_n2d6sy.png",
    output: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780242286/ring-model2_zyruro.png"
  },
  {
    input: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/pink_vexyhc.png",
    output: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236149/pink_vpr9gm.png"
  }
];

const repeatedPairs = [
  ...marqueePairs,
  ...marqueePairs,
  ...marqueePairs,
  ...marqueePairs
];

export default function Home() {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [outputUrl, setOutputUrl] = useState(null);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [error, setError] = useState(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");

  const [showResults, setShowResults] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const fileInputRef = useRef(null);

  const [searchParams] = useSearchParams();
  const templateParam = searchParams.get("template");

  // Fetch templates dynamically
  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoadingTemplates(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/templates`);
        if (!res.ok) throw new Error("Failed templates fetch");
        const data = await res.json();
        setTemplates(data.templates || []);
      } catch (e) {
        console.error("Failed to load active templates:", e);
      } finally {
        setLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, []);

  // Preselect template if passed from Explore query parameters
  useEffect(() => {
    if (templateParam && templates.length > 0) {
      const match = templates.find(t => t.id === templateParam);
      if (match) {
        setSelectedTemplateId(match.id);
        setTimeout(() => {
          document.getElementById('step-1-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }
    }
  }, [templateParam, templates]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Handle results fade-in
  useEffect(() => {
    if (outputUrl) {
      const timer = setTimeout(() => setShowResults(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [outputUrl]);

  // Derive categories list dynamically
  const categoriesList = React.useMemo(() => {
    const unique = new Set(templates.map(t => t.category));
    return Array.from(unique).map(c => {
      let displayName = c.charAt(0).toUpperCase() + c.slice(1);
      if (c === "jewelry-sets") displayName = "Jewelry Sets";
      if (c === "fashion-models") displayName = "Fashion Models";
      return { id: c, name: displayName };
    });
  }, [templates]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(selected.type)) {
        setError("Invalid format. Please upload JPG, JPEG, PNG, or WEBP.");
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError("File size must be under 10MB.");
        return;
      }
      setUploadedFile(selected);
      setUploadedPreviewUrl(URL.createObjectURL(selected));
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(droppedFile.type)) {
        setError("Invalid format. Please upload JPG, JPEG, PNG, or WEBP.");
        return;
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError("File size must be under 10MB.");
        return;
      }
      setUploadedFile(droppedFile);
      setUploadedPreviewUrl(URL.createObjectURL(droppedFile));
      setError(null);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setUploadedFile(null);
    setUploadedPreviewUrl(null);
    setOutputUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!uploadedFile || !selectedTemplateId) return;

    setIsGenerating(true);
    setOutputUrl(null);
    setError(null);

    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("templateId", selectedTemplateId);
      formData.append("aspectRatio", aspectRatio);

      const genRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/generate`, {
        method: "POST",
        body: formData,
      });
      
      let errorMsg = "Image generation failed. Please try again or contact us on WhatsApp.";
      if (!genRes.ok) {
        try {
          const data = await genRes.json();
          if (data && data.error) {
            errorMsg = data.error;
          }
          if (data && data.whatsappLink) {
            setWhatsappLink(data.whatsappLink);
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }
      
      const data = await genRes.json();
      setOutputUrl(data.outputUrl);
      setWhatsappLink(data.whatsappLink || '');
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong - please try again");
    } finally {
      setIsGenerating(false);
    }
  };

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

  const handleTryAgain = () => {
    setOutputUrl(null);
    setError(null);
    document.getElementById('step-1-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToUpload = () => {
    document.getElementById('step-1-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FAF9F6] text-gray-900 selection:bg-amber-500/25 selection:text-amber-800 antialiased">
      
      {/* Section 1 - Floating Capsule Navbar */}
      <div className="fixed top-5 left-0 w-full px-4 z-50 flex justify-center">
        <nav className={`w-full max-w-4xl bg-white/80 backdrop-blur-xl border border-black/5 rounded-full px-6 py-3 flex justify-between items-center transition-all duration-300
          ${isScrolled ? 'shadow-lg shadow-black/5 border-black/10' : 'shadow-none'}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[#FFCE00] shadow-sm">
              <Gem size={16} className="fill-current" />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900">
              Auralux<span className="text-[#FFCE00] font-black"> AI</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-xs font-bold tracking-wider uppercase text-gray-500">
            <a href="#how-it-works" className="hover:text-black transition-colors">How it works</a>
            <Link to="/explore" className="text-[#FFCE00] hover:text-amber-600 transition-colors font-extrabold">Explore</Link>
            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/explore" className="text-[#FFCE00] hover:text-amber-600 transition-colors font-extrabold text-xs uppercase tracking-wider md:hidden">Explore</Link>
            <button 
              onClick={scrollToUpload}
              className="bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 font-extrabold text-xs md:text-sm px-5 py-2 rounded-full transition-all shadow-md shadow-amber-500/10 hover:scale-[1.03] active:scale-98"
            >
              Create Free
            </button>
          </div>
        </nav>
      </div>

      {/* Section 2 - GemAI Light Hero */}
      <section className="text-center pt-40 pb-20 flex flex-col items-center justify-center relative overflow-hidden bg-[#FAF9F6]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="px-6 max-w-4xl z-10">
          <h1 className="text-4xl md:text-6xl lg:text-[72px] font-black leading-[1.05] tracking-tight mb-6 text-gray-900">
            Make Luxury Jewellery <br />
            Ads From A Single Photo
          </h1>
          
          <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed font-medium">
            Upload a gemstone or jewellery photo. Auralux AI turns it into polished AI product images in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={scrollToUpload}
              className="bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 font-black px-8 py-4 rounded-full shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.03] active:scale-98 flex items-center gap-1 group text-sm md:text-base"
            >
              Create Your First Image Free &darr;
            </button>
            <Link 
              to="/explore"
              className="bg-white hover:bg-gray-50 border border-gray-250 text-gray-800 font-extrabold px-8 py-4 rounded-full shadow-md transition-all hover:scale-[1.03] active:scale-98 text-sm md:text-base flex items-center gap-2"
            >
              <Sparkles size={16} className="text-[#FFCE00]" />
              Explore Templates
            </Link>
          </div>
          
          <p className="text-xs text-gray-400 font-extrabold tracking-wider uppercase mt-4">
            Built for jewellery sellers.
          </p>
        </div>

        {/* 3D Showcase Carousel */}
        <div className="w-full relative mt-20 z-15 select-none overflow-hidden py-10 bg-black/[0.01] border-t border-b border-gray-200/50 perspective-container">
          <div className="absolute top-0 bottom-0 left-1/2 w-[3px] bg-[#FFCE00] shadow-[0_0_12px_#FFCE00] z-35 -translate-x-1/2"></div>
          <div className="relative w-full h-52 md:h-72 overflow-hidden flex justify-center items-center">
            
            {/* Left Marquee */}
            <div className="absolute top-0 bottom-0 left-0 w-1/2 overflow-hidden z-20 origin-right" style={{ transform: "rotateY(18deg)", transformStyle: "preserve-3d" }}>
              <div className="absolute top-0 bottom-0 left-0 w-[200%] h-full">
                <div className="animate-marquee-right flex gap-4 md:gap-6 pr-4 md:pr-6 whitespace-nowrap h-full items-center">
                  {repeatedPairs.map((pair, index) => (
                    <div 
                      key={`left-${index}`} 
                      className="w-36 h-48 md:w-48 md:h-64 rounded-2xl md:rounded-[20px] overflow-hidden shadow-xl border border-black/5 shrink-0 bg-gray-100"
                    >
                      <img src={pair.input} alt="Showcase Product Raw" className="w-full h-full object-cover pointer-events-none grayscale opacity-80" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right Marquee */}
            <div className="absolute top-0 bottom-0 right-0 w-1/2 overflow-hidden z-20 origin-left" style={{ transform: "rotateY(-18deg)", transformStyle: "preserve-3d" }}>
              <div className="absolute top-0 bottom-0 left-[-100%] w-[200%] h-full">
                <div className="animate-marquee-right flex gap-4 md:gap-6 pr-4 md:pr-6 whitespace-nowrap h-full items-center">
                  {repeatedPairs.map((pair, index) => (
                    <div 
                      key={`right-${index}`} 
                      className="w-36 h-48 md:w-48 md:h-64 rounded-2xl md:rounded-[20px] overflow-hidden shadow-xl border border-black/5 shrink-0 bg-gray-100"
                    >
                      <img src={pair.output} alt="Showcase Product Final" className="w-full h-full object-cover pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3 - Timeline Workspace */}
      <section id="workspace" className="py-24 px-6 md:px-12 max-w-6xl mx-auto w-full relative">
        <h2 id="how-it-works" className="text-3xl md:text-5xl font-black text-center mb-20 text-gray-900 tracking-tight">
          How It Works
        </h2>
        <div className="absolute left-1/2 top-[240px] bottom-[150px] w-[2px] bg-gradient-to-b from-[#FFCE00] via-amber-500/10 to-transparent -translate-x-1/2 hidden md:block"></div>
        
        <div className="space-y-36 relative">
          
          {/* Step 1: Upload Dropzone */}
          <div id="step-1-section" className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[#FFCE00] flex items-center justify-center font-black text-xs text-[#FFCE00] z-10 hidden md:flex">
              01
            </div>
            
            <div className="bg-white p-6 md:p-8 rounded-[24px] border border-gray-200/50 shadow-md shadow-black/[0.01]">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !uploadedPreviewUrl && fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-[16px] min-h-[180px] p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group
                  ${uploadedPreviewUrl 
                    ? 'border-[#FFCE00] bg-amber-500/[0.03] cursor-default' 
                    : 'border-gray-200 hover:border-[#FFCE00] hover:bg-gray-50/50'
                  }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg, image/png, image/webp" 
                  onChange={handleFileChange}
                />
                {uploadedPreviewUrl ? (
                  <div className="relative w-full max-w-[140px] flex flex-col items-center">
                    <div className="relative aspect-square w-28 h-28 rounded-[12px] overflow-hidden border border-gray-200/80 bg-white shadow-xs">
                      <img src={uploadedPreviewUrl} alt="Preview Thumbnail" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleClear}
                        className="absolute top-1.5 right-1.5 bg-black/80 hover:bg-red-600 text-white p-1 rounded-full backdrop-blur-xs transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 truncate max-w-[120px] mt-2">{uploadedFile?.name}</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-3 text-[#FFCE00] group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-gray-900 font-bold text-sm text-center">Drop your photo here, or tap to choose</p>
                    <p className="text-gray-400 text-[10px] mt-1 font-semibold">JPG, JPEG, PNG, WEBP (Max 10MB)</p>
                  </>
                )}
              </div>
              {error && <p className="text-red-500 text-xs mt-3 font-semibold text-center">{error}</p>}
            </div>

            <div className="md:pl-12">
              <div className="inline-flex md:hidden w-8 h-8 rounded-full bg-white border border-[#FFCE00] items-center justify-center font-black text-xs text-[#FFCE00] mb-3">
                01
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">Upload one photo of your business</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                Show us your product. Select a raw gemstone or jewellery shot. Supported formats are JPG, JPEG, PNG, and WEBP.
              </p>
            </div>
          </div>

          {/* Step 2: Choose style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[#FFCE00] flex items-center justify-center font-black text-xs text-[#FFCE00] z-10 hidden md:flex">
              02
            </div>
            
            <div className="md:pr-12 md:text-right order-2 md:order-1">
              <div className="inline-flex md:hidden w-8 h-8 rounded-full bg-white border border-[#FFCE00] items-center justify-center font-black text-xs text-[#FFCE00] mb-3">
                02
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">Choose from luxury design styles</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-md md:ml-auto">
                Explore creative styling presets. Review reference templates and choose the environment you want to create. Or browse the complete catalog in <Link to="/explore" className="text-[#FFCE00] underline font-bold">Explore page</Link>.
              </p>
            </div>
            
            <div className="order-1 md:order-2">
              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all border shrink-0
                    ${activeCategory === "all" 
                      ? 'bg-[#FFCE00] text-gray-950 border-[#FFCE00]' 
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-black'}`}
                >
                  All Styles
                </button>
                {categoriesList.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all border shrink-0
                      ${activeCategory === cat.id 
                        ? 'bg-[#FFCE00] text-gray-950 border-[#FFCE00]' 
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-black'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Grid */}
              {loadingTemplates ? (
                <div className="text-center py-10 text-zinc-400 text-xs">Loading styling templates...</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {templates
                    .filter(t => activeCategory === "all" || t.category === activeCategory)
                    .map(t => {
                      const isSelected = selectedTemplateId === t.id;
                      const beforeImg = t.input_preview_url || "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780241242/ring_zbvaee.png";
                      return (
                        <div
                          key={t.id}
                          onClick={() => { setSelectedTemplateId(t.id); setOutputUrl(null); }}
                          className={`bg-white rounded-[12px] overflow-hidden cursor-pointer border transition-all duration-200 flex flex-col group
                            ${isSelected ? 'border-[#FFCE00] scale-[1.01] shadow-md shadow-amber-500/5' : 'border-gray-200 hover:border-gray-300 hover:shadow-xs'}`}
                        >
                          <div className="w-full aspect-[4/3] grid grid-cols-2 bg-gray-50 border-b border-gray-200/50 relative">
                            <div className="w-full h-full relative overflow-hidden">
                              <img src={beforeImg} alt="Before preview" className="w-full h-full object-cover grayscale opacity-70" />
                            </div>
                            <div className="w-full h-full relative overflow-hidden border-l border-gray-100">
                              <img src={t.output_preview_url} alt="After preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                          </div>
                          <div className="p-2.5 flex justify-between items-center bg-gray-50/50">
                            <span className="font-extrabold text-xs text-gray-800 truncate">{t.name}</span>
                            {isSelected && (
                              <div className="bg-[#FFCE00] text-black w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0">
                                <CheckCircle2 size={11} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Generate & Result */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start relative">
            <div className="absolute left-1/2 top-8 -translate-x-1/2 w-10 h-10 rounded-full bg-white border border-[#FFCE00] flex items-center justify-center font-black text-xs text-[#FFCE00] z-10 hidden md:flex">
              03
            </div>
            
            <div className="md:pl-12 md:sticky md:top-32">
              <div className="inline-flex md:hidden w-8 h-8 rounded-full bg-white border border-[#FFCE00] items-center justify-center font-black text-xs text-[#FFCE00] mb-3">
                03
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">Get the perfect luxury AI image</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-md mb-6">
                Click below to render your product into high-converting visual assets instantly.
              </p>

              {/* Aspect Ratio */}
              <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-200/50 shadow-xs">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                  Select Output Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "1:1", name: "Square (1:1)" },
                    { id: "9:16", name: "Portrait (9:16)" },
                    { id: "16:9", name: "Landscape (16:9)" }
                  ].map((ratio) => {
                    const isSelected = aspectRatio === ratio.id;
                    return (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => { setAspectRatio(ratio.id); setOutputUrl(null); }}
                        className={`py-2.5 px-1 rounded-xl text-[10px] font-black tracking-wider transition-all border text-center select-none
                          ${isSelected 
                            ? 'bg-[#FFCE00] text-gray-950 border-[#FFCE00] shadow-md shadow-amber-500/10' 
                            : 'bg-white text-gray-400 border-gray-250 hover:bg-gray-50 hover:text-black'}`}
                      >
                        {ratio.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <button 
                type="button"
                onClick={handleGenerate}
                disabled={!uploadedFile || !selectedTemplateId || isGenerating}
                className={`w-full py-4 rounded-[12px] font-extrabold text-base flex items-center justify-center transition-all duration-150 shadow-lg min-h-[56px]
                  ${(!uploadedFile || !selectedTemplateId) 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                    : isGenerating 
                      ? 'bg-amber-300 text-gray-900 cursor-wait' 
                      : 'bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.99] hover:scale-[1.01]'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin mr-2.5 h-5 w-5" />
                    Generating...
                  </>
                ) : (
                  "Generate AI Image"
                )}
              </button>
              {(!uploadedFile || !selectedTemplateId) && (
                <p className="text-[10px] text-center text-gray-400 font-bold mt-3">
                  * Please upload an image in Step 1 and select a template in Step 2 to enable generation.
                </p>
              )}
            </div>

            <div id="results-section" className="bg-white p-6 rounded-[24px] border border-gray-200/50 shadow-lg shadow-black/[0.02] w-full min-h-[360px] flex flex-col justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center py-10">
                  <div className="w-64 h-64 rounded-xl bg-gray-50 animate-pulse flex items-center justify-center mb-6">
                    <Sparkles size={32} className="text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-[#FFCE00] font-bold text-sm tracking-wider uppercase animate-pulse">
                      {loadingMessages[loadingMessageIndex]}
                    </span>
                    <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#FFCE00] h-full rounded-full animate-progress-bar"></div>
                    </div>
                  </div>
                </div>
              ) : outputUrl ? (
                <div className={`transform transition-all duration-500 ${showResults ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                  <div className={`w-full ${aspectRatio === "9:16" ? "aspect-[9/16] max-h-[420px]" : aspectRatio === "16:9" ? "aspect-[16/9]" : "aspect-square"} mx-auto rounded-[16px] overflow-hidden border border-gray-200/60 bg-gray-50 mb-6`}>
                    <img src={outputUrl} alt="AI output" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleDownload(outputUrl, `auralux-${selectedTemplateId}.png`)}
                      className="flex-1 bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 font-extrabold py-3.5 rounded-[12px] text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/10"
                    >
                      <Download size={15} /> Download Image
                    </button>
                    <button 
                      onClick={handleTryAgain}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-3.5 rounded-[12px] text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <RefreshCw size={14} /> Clear State
                    </button>
                  </div>
                  
                  <div className="mt-8 border-t border-gray-150 pt-6 text-center">
                    <h4 className="font-extrabold text-sm text-gray-800 mb-1">Need Custom High-Res Images?</h4>
                    <p className="text-gray-400 text-xs mb-4">We also offer custom AI product video reels & premium catalogue styling.</p>
                    <a
                      href={whatsappLink || 'https://wa.me/919999999999'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 font-extrabold text-xs px-6 py-2.5 rounded-[10px] tracking-wide shadow-md"
                    >
                      Contact on WhatsApp
                    </a>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-red-50 border border-red-250 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <X size={24} />
                  </div>
                  <h4 className="font-extrabold text-red-600 mb-2">Generation Failed</h4>
                  <p className="text-gray-650 text-xs max-w-[280px] mb-6 font-semibold leading-relaxed">
                    {error}
                  </p>
                  <a
                    href={whatsappLink || 'https://wa.me/919999999999'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 font-extrabold text-xs px-6 py-2.5 rounded-[10px] tracking-wide shadow-md"
                  >
                    Contact on WhatsApp
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-200/60 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-1.5">AI Render Preview</h4>
                  <p className="text-gray-400 text-xs max-w-[240px]">
                    Upload an image in Step 1, select a template in Step 2, and click Generate to see the magic.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Section 4 - Pricing */}
      <section id="pricing" className="py-24 px-6 md:px-12 bg-black/[0.01] border-t border-b border-gray-200/60 w-full relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-6xl mx-auto z-10 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Simple Pricing</h2>
            <p className="text-sm md:text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
              Create professional jewellery and gemstone product photos in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white border border-gray-200/80 hover:border-gray-300 hover:shadow-lg transition-all duration-300 rounded-3xl p-8 flex flex-col justify-between hover:scale-[1.01]">
              <div>
                <h3 className="text-xl font-bold text-gray-950 mb-2">Starter</h3>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl font-black text-[#FFCE00]">₹49</span>
                </div>
                <ul className="space-y-4 text-sm text-gray-500 mb-8 border-t border-gray-100 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>5 AI Image Generations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>Access to All Templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>HD Image Download</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>Fast Generation</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={scrollToUpload}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-extrabold py-3.5 px-6 rounded-xl transition-all border border-gray-200 text-center text-sm shadow-sm"
              >
                Get Started
              </button>
            </div>

            {/* Pro */}
            <div className="bg-white border-2 border-[#FFCE00] shadow-[0_15px_30px_rgba(245,158,11,0.06)] rounded-3xl p-8 relative flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute -top-3.5 right-6 bg-[#FFCE00] text-gray-950 text-[10px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow-md">
                Most Popular
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-950 mb-2">Pro</h3>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl font-black text-[#FFCE00]">₹99</span>
                </div>
                <ul className="space-y-4 text-sm text-gray-600 mb-8 border-t border-gray-100 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>15 AI Image Generations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>Access to All Templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>HD Image Download</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>Priority Processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>Best Value</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={scrollToUpload}
                className="w-full bg-[#FFCE00] hover:bg-[#E5B800] text-gray-950 font-black py-3.5 px-6 rounded-xl transition-all text-center text-sm shadow-md"
              >
                Choose Pro
              </button>
            </div>

            {/* Premium */}
            <div className="bg-white border border-gray-200/80 hover:border-gray-300 hover:shadow-lg transition-all duration-300 rounded-3xl p-8 flex flex-col justify-between hover:scale-[1.01]">
              <div>
                <h3 className="text-xl font-bold text-gray-950 mb-2">Premium</h3>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl font-black text-[#FFCE00]">₹139</span>
                </div>
                <ul className="space-y-4 text-sm text-gray-500 mb-8 border-t border-gray-100 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>30 AI Image Generations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>Access to All Templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>HD Image Download</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>Priority Processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#FFCE00] shrink-0" />
                    <span>Best for Frequent Sellers</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={scrollToUpload}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-extrabold py-3.5 px-6 rounded-xl transition-all border border-gray-200 text-center text-sm shadow-sm"
              >
                Go Premium
              </button>
            </div>
          </div>

          <div className="mt-14 text-center max-w-lg mx-auto">
            <p className="text-xs md:text-sm text-gray-500 font-semibold leading-relaxed">
              Need custom AI product images, reels, or luxury ad creatives?<br />
              <a 
                href={whatsappLink || 'https://wa.me/919999999999'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#FFCE00] hover:text-[#E5B800] font-extrabold underline underline-offset-4 ml-1 transition-colors"
              >
                Contact us on WhatsApp for custom work.
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 - FAQ */}
      <section id="faq" className="py-24 px-6 md:px-12 bg-white w-full relative">
        <div className="max-w-3xl mx-auto z-10 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-gray-300 shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center p-5 text-left font-bold text-sm md:text-base text-gray-800 hover:text-[#FFCE00] transition-colors gap-4"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown 
                      className={`w-4 h-4 text-[#FFCE00] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>
                  <div 
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isOpen ? '240px' : '0px' }}
                  >
                    <p className="px-5 pb-5 text-xs md:text-sm text-gray-500 leading-relaxed bg-gray-50/20 border-t border-gray-100 pt-3">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 6 - Footer */}
      <footer className="w-full py-10 px-6 md:px-12 bg-[#FAF9F6] border-t border-gray-200/60 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs font-semibold text-gray-400 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-gray-900">Auralux AI</span>
            <span>© 2026</span>
          </div>
          <div>Built for Indian gem & jewellery sellers</div>
        </div>
      </footer>

    </div>
  );
}
