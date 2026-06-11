const { Router } = require("express");
const { supabase } = require("../config/supabase");

const router = Router();

// GET /api/templates
router.get("/", async (req, res) => {
  try {
    let data;
    let error;

    // 1. Attempt to fetch templates with the new presentation mode columns
    const result = await supabase
      .from("templates")
      .select("id, name, slug, category, description, input_preview_url, output_preview_url, is_featured, is_beta, usage_count, allowed_presentation_modes_json, preferred_presentation_mode")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    data = result.data;
    error = result.error;

    // 2. Fallback to legacy columns if database migration hasn't run yet on production
    if (error && (error.message.includes("column") || error.code === "PGRST200" || error.status === 400)) {
      console.warn("Supabase templates query failed due to schema mismatch, falling back to legacy query:", error.message);
      const fallbackResult = await supabase
        .from("templates")
        .select("id, name, slug, category, description, input_preview_url, output_preview_url, is_featured, is_beta, usage_count")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (fallbackResult.error) {
        throw fallbackResult.error;
      }
      data = fallbackResult.data;
      error = null;
    } else if (error) {
      throw error;
    }

    // 3. Format templates and ensure default values are populated for compatibility
    const formattedTemplates = (data || []).map(item => {
      let allowed = item.allowed_presentation_modes_json;
      if (!allowed) {
        allowed = '["keep_original", "set_into_ring", "set_into_pendant"]';
      }
      
      let preferred = item.preferred_presentation_mode;
      if (!preferred) {
        // Default based on category
        if (item.category === "ring" || item.category === "model") {
          preferred = "set_into_ring";
        } else {
          preferred = "keep_original";
        }
      }

      return {
        ...item,
        allowed_presentation_modes_json: allowed,
        preferred_presentation_mode: preferred
      };
    });

    return res.json({ templates: formattedTemplates });
  } catch (error) {
    console.error("Public templates fetch error:", error);
    return res.status(500).json({ error: "Failed to load creative templates" });
  }
});

module.exports = router;
