const { Router } = require("express");
const { supabase } = require("../config/supabase");

const router = Router();

// GET /api/templates
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("templates")
      .select("id, name, slug, category, description, input_preview_url, output_preview_url, is_featured, is_beta, usage_count")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({ templates: data || [] });
  } catch (error) {
    console.error("Public templates fetch error:", error);
    return res.status(500).json({ error: "Failed to load creative templates" });
  }
});

module.exports = router;
