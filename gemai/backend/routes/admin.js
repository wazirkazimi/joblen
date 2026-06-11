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
  message: { error: "Too many requests. Please try again later." }
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

    // Detailed metrics from generations table
    const { data: allGenerations, error: errAllGens } = await supabase
      .from("generations")
      .select("visitor_id, ip_address, user_ip, estimated_cost_usd, generation_status, user_type, created_at, template_name");

    if (errAllGens) {
      throw errAllGens;
    }

    const todayStr = todayStart.toISOString().split("T")[0];

    let totalFreeCount = 0;
    let todayFreeCount = 0;
    let estimatedSpendTotal = 0;
    let estimatedSpendToday = 0;
    let estimatedFreeCostTotal = 0;

    const visitorCounts = {};
    const ipCounts = {};
    const freeTemplateCounts = {};

    (allGenerations || []).forEach(row => {
      const isSuccess = row.generation_status === "success";
      const isFree = row.user_type === "free" || !row.user_type; // fallback for old logs
      const cost = parseFloat(row.estimated_cost_usd || 0);
      const rowDateStr = new Date(row.created_at).toISOString().split("T")[0];
      const ip = row.ip_address || row.user_ip || "unknown";

      if (isSuccess) {
        estimatedSpendTotal += cost;
        if (rowDateStr === todayStr) {
          estimatedSpendToday += cost;
        }

        if (isFree) {
          totalFreeCount++;
          estimatedFreeCostTotal += cost;
          if (rowDateStr === todayStr) {
            todayFreeCount++;
          }
          if (row.template_name) {
            freeTemplateCounts[row.template_name] = (freeTemplateCounts[row.template_name] || 0) + 1;
          }
        }

        if (row.visitor_id) {
          visitorCounts[row.visitor_id] = (visitorCounts[row.visitor_id] || 0) + 1;
        }
        if (ip && ip !== "127.0.0.1" && ip !== "::1") {
          ipCounts[ip] = (ipCounts[ip] || 0) + 1;
        }
      }
    });

    // Determine most used free template
    let mostUsedFreeTemplate = "N/A";
    let maxFreeTempCount = 0;
    for (const [name, count] of Object.entries(freeTemplateCounts)) {
      if (count > maxFreeTempCount) {
        maxFreeTempCount = count;
        mostUsedFreeTemplate = name;
      }
    }

    // Sort top visitors & top IPs
    const topVisitors = Object.entries(visitorCounts)
      .map(([id, count]) => ({ visitor_id: id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topIps = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip_address: ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

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
      topTemplates: top5Templates || [],
      // New dashboard metrics
      totalFreeGenerations: totalFreeCount,
      freeGenerationsToday: todayFreeCount,
      estimatedFreeCost: parseFloat(estimatedFreeCostTotal.toFixed(4)),
      remainingBudget: parseFloat(Math.max(0, 5.0 - estimatedSpendTotal).toFixed(4)),
      mostUsedFreeTemplate,
      topVisitorIds: topVisitors,
      topIpAddresses: topIps
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
    const { dateFrom, dateTo, preset, templateId, status, visitorId, ip, presentationMode, watermarked, dateRange } = req.query;

    let query = supabase.from("generations").select("*");

    if (templateId) {
      query = query.eq("template_id", templateId);
    }
    if (status) {
      query = query.eq("generation_status", status);
    }
    if (visitorId) {
      query = query.eq("visitor_id", visitorId);
    }
    if (ip) {
      query = query.or(`ip_address.eq.${ip},user_ip.eq.${ip}`);
    }
    if (presentationMode) {
      query = query.eq("presentation_mode", presentationMode);
    }
    if (watermarked !== undefined && watermarked !== "") {
      query = query.eq("is_watermarked", watermarked === "true");
    }

    // Handle date filters
    if (dateFrom) {
      query = query.gte("created_at", new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }

    const activePreset = preset || dateRange;
    if (activePreset) {
      const start = new Date();
      if (activePreset === "today") {
        start.setHours(0, 0, 0, 0);
        query = query.gte("created_at", start.toISOString());
      } else if (activePreset === "7days" || activePreset === "7d") {
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        query = query.gte("created_at", start.toISOString());
      } else if (activePreset === "30days" || activePreset === "30d") {
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
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
    // 1. Fetch generations with resilient schema check
    let allGenerations;
    let errAll;

    const firstTry = await supabase
      .from("generations")
      .select("generation_status, estimated_cost_usd, created_at, presentation_mode, user_type");

    allGenerations = firstTry.data;
    errAll = firstTry.error;

    if (errAll && (errAll.message.includes("presentation_mode") || errAll.message.includes("column") || errAll.status === 400 || errAll.code === "PGRST200")) {
      console.warn("Analytics generations query failed due to presentation_mode column mismatch, trying fallback query...");
      const fallbackTry = await supabase
        .from("generations")
        .select("generation_status, estimated_cost_usd, created_at, user_type");
      
      if (fallbackTry.error) {
        throw fallbackTry.error;
      }
      allGenerations = fallbackTry.data;
      errAll = null;
    } else if (errAll) {
      throw errAll;
    }

    // 2. Fetch templates
    const { data: templateUsageData, error: errUsage } = await supabase
      .from("templates")
      .select("name, usage_count")
      .eq("is_active", true);
    if (errUsage) throw errUsage;

    const templateUsage = (templateUsageData || []).map(t => ({
      templateName: t.name,
      count: t.usage_count || 0
    }));

    // 3. Fetch settings for budget cap
    const { data: settingsData } = await supabase
      .from("app_settings")
      .select("key, value");

    const settings = {};
    (settingsData || []).forEach(row => {
      settings[row.key] = row.value;
    });

    const maxTotalGens = parseInt(settings.max_total_generations || "80", 10);
    const estCostPerImg = parseFloat(settings.estimated_cost_per_image_usd || "0.056");
    const budgetCap = maxTotalGens * estCostPerImg;

    // Process variables
    const todayStr = new Date().toISOString().split("T")[0];
    const statusCounts = {};
    const dailyCounts = {};
    
    // Presentation Mode metrics
    const gensByMode = { keep_original: 0, set_into_ring: 0, set_into_pendant: 0 };
    const costByMode = { keep_original: 0, set_into_ring: 0, set_into_pendant: 0 };

    let totalSpend = 0;
    let spendToday = 0;
    let freeTodayCount = 0;

    (allGenerations || []).forEach(row => {
      const status = row.generation_status || "success";
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const cost = parseFloat(row.estimated_cost_usd || 0);
      const dateStr = new Date(row.created_at).toISOString().split("T")[0];

      if (status === "success") {
        totalSpend += cost;
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;

        if (dateStr === todayStr) {
          spendToday += cost;
          if (row.user_type === "free" || !row.user_type) {
            freeTodayCount++;
          }
        }

        const mode = row.presentation_mode || "keep_original";
        if (gensByMode[mode] !== undefined) {
          gensByMode[mode]++;
          costByMode[mode] = parseFloat((costByMode[mode] + cost).toFixed(4));
        } else {
          gensByMode[mode] = 1;
          costByMode[mode] = cost;
        }
      }
    });

    // Success vs failed breakdown
    const statusBreakdown = Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status]
    }));

    // Find most used presentation mode
    let mostUsedMode = "keep_original";
    let maxModeCount = -1;
    for (const [mode, count] of Object.entries(gensByMode)) {
      if (count > maxModeCount) {
        maxModeCount = count;
        mostUsedMode = mode;
      }
    }

    // Fill empty dates for last 30 days
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

    return res.json({
      dailyGenerations,
      templateUsage,
      statusBreakdown,
      estimatedSpendTotal: parseFloat(totalSpend.toFixed(4)),
      estimatedSpendToday: parseFloat(spendToday.toFixed(4)),
      // Presentation Mode analytics
      generationsByMode: gensByMode,
      costByMode: costByMode,
      mostUsedPresentationMode: mostUsedMode,
      freeGenerationsUsedToday: freeTodayCount,
      remainingFreeBudgetEstimate: parseFloat(Math.max(0, budgetCap - totalSpend).toFixed(4)),
      dailyGenerationCount: dailyCounts[todayStr] || 0
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
