const { Router } = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { supabase } = require("../config/supabase");
const adminAuth = require("../middleware/adminAuth");
const rateLimit = require("express-rate-limit");

const router = Router();
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Rate limiting login attempts: max 5 requests per 15 mins per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Please try again after 15 minutes." }
});

// 1. Admin login route
router.post("/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.ADMIN_JWT_SECRET;

  if (!adminPassword || !jwtSecret) {
    console.error("ADMIN_PASSWORD or ADMIN_JWT_SECRET is missing from backend configuration.");
    return res.status(500).json({ error: "Authentication configuration missing on server" });
  }

  if (username === adminUsername && password === adminPassword) {
    const token = jwt.sign({ role: "admin", username }, jwtSecret, { expiresIn: "24h" });
    return res.json({ token });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

// Apply JWT verification middleware to protect all /api/admin/* endpoints below
router.use(adminAuth);

// Preview upload endpoint for template preview images
router.post("/upload-preview", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "auralux-previews", resource_type: "image" },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      );
      stream.end(req.file.buffer);
    });
    return res.json({ url: result.secure_url });
  } catch (error) {
    console.error("Preview upload error:", error);
    return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
  }
});

// 2. Dashboard metrics endpoint
router.get("/dashboard", async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Run parallel count requests
    const [
      { count: totalGenerations, error: errTotal },
      { count: todayGenerations, error: errToday },
      { count: monthGenerations, error: errMonth },
      { count: activeTemplates, error: errTemplates }
    ] = await Promise.all([
      supabase.from("generations").select("*", { count: "exact", head: true }),
      supabase.from("generations").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
      supabase.from("generations").select("*", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
      supabase.from("templates").select("*", { count: "exact", head: true }).eq("is_active", true)
    ]);

    if (errTotal || errToday || errMonth || errTemplates) {
      throw new Error("Failed to fetch count metrics from database");
    }

    // Most used template
    const { data: topTemplatesData } = await supabase
      .from("templates")
      .select("name, usage_count")
      .eq("is_active", true)
      .order("usage_count", { ascending: false })
      .limit(1);
    const mostUsedTemplate = topTemplatesData?.[0]?.name || "N/A";

    // Estimated spend total & today
    const { data: totalCostData } = await supabase
      .from("generations")
      .select("estimated_cost_usd")
      .eq("generation_status", "success");
    const estimatedSpendTotal = (totalCostData || []).reduce((acc, row) => acc + parseFloat(row.estimated_cost_usd || 0), 0);

    const { data: todayCostData } = await supabase
      .from("generations")
      .select("estimated_cost_usd")
      .eq("generation_status", "success")
      .gte("created_at", todayStart.toISOString());
    const estimatedSpendToday = (todayCostData || []).reduce((acc, row) => acc + parseFloat(row.estimated_cost_usd || 0), 0);

    // Recent 10 generations
    const { data: recentGenerations } = await supabase
      .from("generations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    // Top 5 templates
    const { data: top5Templates } = await supabase
      .from("templates")
      .select("*")
      .eq("is_active", true)
      .order("usage_count", { ascending: false })
      .limit(5);

    return res.json({
      totalGenerations: totalGenerations || 0,
      generationsToday: todayGenerations || 0,
      generationsThisMonth: monthGenerations || 0,
      totalActiveTemplates: activeTemplates || 0,
      mostUsedTemplate,
      estimatedTotalSpend: parseFloat(estimatedSpendTotal.toFixed(4)),
      estimatedSpendToday: parseFloat(estimatedSpendToday.toFixed(4)),
      recentGenerations: recentGenerations || [],
      topTemplates: top5Templates || []
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ error: "Failed to load dashboard metrics" });
  }
});

// 3. Templates CRUD endpoints
router.get("/templates", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json({ templates: data });
  } catch (error) {
    console.error("Fetch templates error:", error);
    return res.status(500).json({ error: "Failed to fetch templates" });
  }
});

router.post("/templates", async (req, res) => {
  try {
    const { name, slug, category, description, prompt, input_preview_url, output_preview_url, is_featured, is_beta } = req.body;
    if (!name || !slug || !category || !prompt || !output_preview_url) {
      return res.status(400).json({ error: "Missing required template fields." });
    }

    const { data, error } = await supabase
      .from("templates")
      .insert([{
        name,
        slug,
        category,
        description,
        prompt,
        input_preview_url,
        output_preview_url,
        is_featured: !!is_featured,
        is_beta: !!is_beta,
        is_active: true
      }])
      .select();

    if (error) throw error;
    return res.status(201).json({ success: true, template: data[0] });
  } catch (error) {
    console.error("Create template error:", error);
    return res.status(500).json({ error: error.message || "Failed to create template" });
  }
});

router.put("/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, category, description, prompt, input_preview_url, output_preview_url, is_featured, is_beta, is_active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (prompt !== undefined) updates.prompt = prompt;
    if (input_preview_url !== undefined) updates.input_preview_url = input_preview_url;
    if (output_preview_url !== undefined) updates.output_preview_url = output_preview_url;
    if (is_featured !== undefined) updates.is_featured = !!is_featured;
    if (is_beta !== undefined) updates.is_beta = !!is_beta;
    if (is_active !== undefined) updates.is_active = !!is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("templates")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Template not found" });
    }

    return res.json({ success: true, template: data[0] });
  } catch (error) {
    console.error("Update template error:", error);
    return res.status(500).json({ error: error.message || "Failed to update template" });
  }
});

router.delete("/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Perform soft deactivation as requested
    const { data, error } = await supabase
      .from("templates")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) throw error;
    return res.json({ success: true, message: "Template deactivated successfully" });
  } catch (error) {
    console.error("Deactivate template error:", error);
    return res.status(500).json({ error: "Failed to deactivate template" });
  }
});

// 4. Generations logs endpoints
router.get("/generations", async (req, res) => {
  try {
    const { dateRange, templateId, status } = req.query;

    let query = supabase.from("generations").select("*");

    if (templateId) {
      query = query.eq("template_id", templateId);
    }
    if (status) {
      query = query.eq("generation_status", status);
    }

    if (dateRange) {
      const start = new Date();
      if (dateRange === "today") {
        start.setHours(0, 0, 0, 0);
        query = query.gte("created_at", start.toISOString());
      } else if (dateRange === "7days") {
        start.setDate(start.getDate() - 7);
        query = query.gte("created_at", start.toISOString());
      } else if (dateRange === "30days") {
        start.setDate(start.getDate() - 30);
        query = query.gte("created_at", start.toISOString());
      }
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return res.json({ generations: data });
  } catch (error) {
    console.error("Fetch generations error:", error);
    return res.status(500).json({ error: "Failed to fetch generations logs" });
  }
});

// 5. Analytics data endpoint
router.get("/analytics", async (req, res) => {
  try {
    // 1. Success vs failed breakdown
    const { data: statusData, error: errStatus } = await supabase
      .from("generations")
      .select("generation_status");
    if (errStatus) throw errStatus;

    const statusCounts = {};
    (statusData || []).forEach(row => {
      const stat = row.generation_status || "success";
      statusCounts[stat] = (statusCounts[stat] || 0) + 1;
    });
    const statusBreakdown = Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status]
    }));

    // 2. Template usage distribution
    const { data: templateUsageData, error: errUsage } = await supabase
      .from("templates")
      .select("name, usage_count")
      .eq("is_active", true);
    if (errUsage) throw errUsage;

    const templateUsage = (templateUsageData || []).map(t => ({
      templateName: t.name,
      count: t.usage_count || 0
    }));

    // 3. Daily volume (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const { data: dailyData, error: errDaily } = await supabase
      .from("generations")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString());
    if (errDaily) throw errDaily;

    const dailyCounts = {};
    (dailyData || []).forEach(row => {
      const dateStr = new Date(row.created_at).toISOString().split("T")[0];
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    });

    // Fill empty dates in last 30 days
    const dailyGenerations = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dailyGenerations.push({
        date: dateStr,
        count: dailyCounts[dateStr] || 0
      });
    }

    // 4. Cost summaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: totalCostRows } = await supabase
      .from("generations")
      .select("estimated_cost_usd")
      .eq("generation_status", "success");
    const totalSpend = (totalCostRows || []).reduce((acc, row) => acc + parseFloat(row.estimated_cost_usd || 0), 0);

    const { data: todayCostRows } = await supabase
      .from("generations")
      .select("estimated_cost_usd")
      .eq("generation_status", "success")
      .gte("created_at", todayStart.toISOString());
    const spendToday = (todayCostRows || []).reduce((acc, row) => acc + parseFloat(row.estimated_cost_usd || 0), 0);

    return res.json({
      dailyGenerations,
      templateUsage,
      statusBreakdown,
      estimatedSpendTotal: parseFloat(totalSpend.toFixed(4)),
      estimatedSpendToday: parseFloat(spendToday.toFixed(4))
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({ error: "Failed to compute analytics charts data" });
  }
});

// 6. Settings management endpoints
router.get("/settings", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*");

    if (error) throw error;
    const settingsObj = {};
    (data || []).forEach(row => {
      settingsObj[row.key] = row.value;
    });

    return res.json({ settings: settingsObj });
  } catch (error) {
    console.error("Fetch settings error:", error);
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ error: "Invalid settings format" });
    }

    for (const key of Object.keys(settings)) {
      const val = String(settings[key]);
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key, value: val, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
    }

    return res.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Update settings error:", error);
    return res.status(500).json({ error: "Failed to update settings" });
  }
});

module.exports = router;
