import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Upload, 
  Check, 
  X, 
  Info,
  ExternalLink 
} from "lucide-react";
import { adminApi } from "../../api/adminApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function AdminTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("gemstone");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [inputPreviewUrl, setInputPreviewUrl] = useState("");
  const [outputPreviewUrl, setOutputPreviewUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBeta, setIsBeta] = useState(false);
  
  // Upload states
  const [uploadingInput, setUploadingInput] = useState(false);
  const [uploadingOutput, setUploadingOutput] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getTemplates();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load templates from the database.");
    } finally {
      setLoading(false);
    }
  }

  const handleToggleState = async (template, field) => {
    try {
      const val = !template[field];
      const updated = await adminApi.updateTemplate(template.id, { [field]: val });
      if (updated.success) {
        setTemplates(templates.map(t => t.id === template.id ? { ...t, [field]: val } : t));
        showSuccess(`Toggled ${field} state successfully.`);
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to update ${field} status.`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate/soft-delete this template? It will no longer show on Explore.")) {
      return;
    }
    try {
      await adminApi.deleteTemplate(id);
      setTemplates(templates.map(t => t.id === id ? { ...t, is_active: false } : t));
      showSuccess("Template deactivated successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to deactivate template.");
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("gemify_admin_token");

    try {
      if (type === "input") setUploadingInput(true);
      if (type === "output") setUploadingOutput(true);

      const res = await fetch(`${API_URL}/api/admin/upload-preview`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      if (type === "input") setInputPreviewUrl(data.url);
      if (type === "output") setOutputPreviewUrl(data.url);
      
      showSuccess(`${type === "input" ? "Input" : "Output"} image uploaded successfully.`);
    } catch (err) {
      console.error(err);
      setError("Failed to upload image to Cloudinary.");
    } finally {
      setUploadingInput(false);
      setUploadingOutput(false);
    }
  };

  const handleEditClick = (template) => {
    setIsEditing(true);
    setEditId(template.id);
    setName(template.name);
    setSlug(template.slug);
    setCategory(template.category);
    setDescription(template.description || "");
    setPrompt(template.prompt);
    setInputPreviewUrl(template.input_preview_url || "");
    setOutputPreviewUrl(template.output_preview_url);
    setIsFeatured(template.is_featured);
    setIsBeta(template.is_beta);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditId(null);
    setName("");
    setSlug("");
    setCategory("gemstone");
    setDescription("");
    setPrompt("");
    setInputPreviewUrl("");
    setOutputPreviewUrl("");
    setIsFeatured(false);
    setIsBeta(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !slug || !prompt || !outputPreviewUrl) {
      alert("Please fill in name, slug, prompt, and output preview image.");
      return;
    }

    const payload = {
      name,
      slug,
      category,
      description,
      prompt,
      input_preview_url: inputPreviewUrl || null,
      output_preview_url: outputPreviewUrl,
      is_featured: isFeatured,
      is_beta: isBeta
    };

    try {
      setError(null);
      if (editId) {
        // Edit template
        const res = await adminApi.updateTemplate(editId, payload);
        if (res.success) {
          showSuccess("Template updated successfully.");
          loadTemplates();
          handleCancelForm();
        }
      } else {
        // Add template
        const res = await adminApi.createTemplate(payload);
        if (res.success) {
          showSuccess("Template created successfully.");
          loadTemplates();
          handleCancelForm();
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save template. Check duplicate slug.");
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast notifications */}
      {success && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-[#0F0F10] px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg z-50 animate-bounce">
          <Check className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex justify-between items-center max-w-2xl">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-zinc-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Add / Edit Template Form Panel */}
      <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-6">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 mb-6 flex items-center gap-2">
          {editId ? <Edit className="h-4.5 w-4.5 text-[#FFCE00]" /> : <Plus className="h-4.5 w-4.5 text-[#FFCE00]" />}
          {editId ? "Edit Design Template" : "Add Creative Design Template"}
        </h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Row 1: Name & Slug */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">Template Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => {
                setName(e.target.value);
                if (!editId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
              }}
              placeholder="Vogue Editorial Case"
              className="w-full bg-zinc-950/40 border border-[#27272A] px-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">Unique URL Slug</label>
            <input 
              type="text" 
              value={slug} 
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
              placeholder="vogue-editorial"
              className="w-full bg-zinc-950/40 border border-[#27272A] px-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
              required
            />
          </div>

          {/* Row 2: Category & Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">Category</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-zinc-950/40 border border-[#27272A] px-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
            >
              <option value="gemstone">Gemstone</option>
              <option value="ring">Ring</option>
              <option value="model">Model</option>
              <option value="experimental">Experimental</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">Short Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Clean layout displaying flat lay items around jewelry sets"
              className="w-full bg-zinc-950/40 border border-[#27272A] px-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
            />
          </div>

          {/* Row 3: Prompts (Takes full width) */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase flex items-center gap-2">
              Style Generation Prompt
              <span className="group relative cursor-pointer text-zinc-500 hover:text-white">
                <Info className="h-3 w-3" />
                <span className="absolute hidden group-hover:block bg-zinc-950 border border-zinc-800 text-[9px] p-2 rounded w-64 -top-12 left-5 z-20 normal-case leading-normal font-medium text-zinc-400">
                  This description will be appended to the master prompt. Use placeholder [item] or [uploaded ring] where the user image will blend.
                </span>
              </span>
            </label>
            <textarea 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)}
              placeholder="create a image of Luxury jewelry photography of [item], placed on velvet fabric, warm cinematic spotlight, dramatic gold shadows..."
              className="w-full bg-zinc-950/40 border border-[#27272A] px-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00] h-24 resize-none leading-relaxed"
              required
            />
          </div>

          {/* Row 4: Image Previews */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">Before/Input Preview URL (Optional)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={inputPreviewUrl} 
                onChange={e => setInputPreviewUrl(e.target.value)}
                placeholder="https://cloudinary.com/..."
                className="flex-1 bg-zinc-950/40 border border-[#27272A] px-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
              />
              <label className="bg-zinc-800 hover:bg-zinc-700 text-white p-2.5 rounded-lg cursor-pointer flex items-center justify-center shrink-0 border border-zinc-700">
                <Upload className="h-4 w-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => handleFileUpload(e, "input")} 
                  className="hidden" 
                  disabled={uploadingInput}
                />
              </label>
            </div>
            {uploadingInput && <p className="text-[10px] text-zinc-500">Uploading file to Cloudinary...</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">After/Output Preview URL (Required)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={outputPreviewUrl} 
                onChange={e => setOutputPreviewUrl(e.target.value)}
                placeholder="https://cloudinary.com/..."
                className="flex-1 bg-zinc-950/40 border border-[#27272A] px-4 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFCE00]"
                required
              />
              <label className="bg-zinc-800 hover:bg-zinc-700 text-white p-2.5 rounded-lg cursor-pointer flex items-center justify-center shrink-0 border border-zinc-700">
                <Upload className="h-4 w-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => handleFileUpload(e, "output")} 
                  className="hidden" 
                  disabled={uploadingOutput}
                />
              </label>
            </div>
            {uploadingOutput && <p className="text-[10px] text-zinc-500">Uploading file to Cloudinary...</p>}
          </div>

          {/* Row 5: Switches */}
          <div className="flex items-center gap-6 py-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isFeatured} 
                onChange={e => setIsFeatured(e.target.checked)} 
                className="rounded border-zinc-700 text-[#FFCE00] bg-zinc-950 focus:ring-0 focus:ring-offset-0 h-4 w-4"
              />
              <span className="text-xs font-bold text-zinc-300">Featured Style</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isBeta} 
                onChange={e => setIsBeta(e.target.checked)} 
                className="rounded border-zinc-700 text-[#FFCE00] bg-zinc-950 focus:ring-0 focus:ring-offset-0 h-4 w-4"
              />
              <span className="text-xs font-bold text-zinc-300">Beta Version</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-[#27272A]/40">
            <button
              type="button"
              onClick={handleCancelForm}
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#FFCE00] hover:bg-[#FFCE00]/90 text-[#0F0F10] px-6 py-2.5 rounded-lg text-xs font-bold transition-all"
            >
              {editId ? "Update Template" : "Add Template"}
            </button>
          </div>

        </form>
      </div>

      {/* 2. Templates Management List */}
      <div className="bg-zinc-900/20 border border-[#27272A] rounded-xl p-6">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 mb-6">
          Templates Overview
        </h3>

        {loading ? (
          <div className="text-center py-8 text-zinc-500 text-xs">Loading template table...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">No templates registered in the system database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-zinc-500 text-[10px] uppercase font-bold tracking-wider pb-3">
                  <th className="pb-3">Output Preview</th>
                  <th className="pb-3">Template Info</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Stats</th>
                  <th className="pb-3 text-center">Featured</th>
                  <th className="pb-3 text-center">Beta</th>
                  <th className="pb-3 text-center">Active</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/40 text-xs">
                {templates.map(t => (
                  <tr key={t.id} className="hover:bg-zinc-900/10 transition-colors">
                    {/* Preview Thumbnail */}
                    <td className="py-4">
                      <a href={t.output_preview_url} target="_blank" rel="noreferrer" className="relative block w-12">
                        <img 
                          src={t.output_preview_url} 
                          alt={t.name} 
                          className="w-12 h-12 object-cover rounded border border-zinc-800"
                        />
                        <ExternalLink className="absolute bottom-0 right-0 h-2.5 w-2.5 text-white bg-black/60 p-0.5 rounded-tl" />
                      </a>
                    </td>

                    {/* Metadata */}
                    <td className="py-4 pr-4 max-w-xs">
                      <p className="font-extrabold text-zinc-200">{t.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{t.slug}</p>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-normal line-clamp-1">{t.description}</p>
                    </td>

                    {/* Category */}
                    <td className="py-4">
                      <span className="text-[9px] font-extrabold uppercase bg-zinc-850 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                        {t.category}
                      </span>
                    </td>

                    {/* Usage counts */}
                    <td className="py-4">
                      <span className="font-black text-[#FFCE00]">{t.usage_count || 0}</span>
                      <span className="text-zinc-600 text-[10px] ml-1">uses</span>
                    </td>

                    {/* Featured Status Toggle */}
                    <td className="py-4 text-center">
                      <button onClick={() => handleToggleState(t, "is_featured")} className="focus:outline-none">
                        {t.is_featured ? (
                          <ToggleRight className="h-6 w-6 text-[#FFCE00]" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-zinc-600" />
                        )}
                      </button>
                    </td>

                    {/* Beta Status Toggle */}
                    <td className="py-4 text-center">
                      <button onClick={() => handleToggleState(t, "is_beta")} className="focus:outline-none">
                        {t.is_beta ? (
                          <ToggleRight className="h-6 w-6 text-[#FFCE00]" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-zinc-600" />
                        )}
                      </button>
                    </td>

                    {/* Active Toggle */}
                    <td className="py-4 text-center">
                      <button onClick={() => handleToggleState(t, "is_active")} className="focus:outline-none">
                        {t.is_active ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Active</span>
                        ) : (
                          <span className="bg-zinc-800 text-zinc-500 border border-zinc-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">Disabled</span>
                        )}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(t)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded"
                          title="Edit Template"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-500 p-1.5 rounded"
                          title="Soft Delete/Disable Template"
                          disabled={!t.is_active}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
