require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const streamifier = require('streamifier');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const rateLimit = require('express-rate-limit');
const templates = require('./templates');
const generateImage = require('./generate');
const { supabase } = require("./config/supabase");
const adminRouter = require("./routes/admin");
const templatesRouter = require("./routes/templates");


const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup matching FRONTEND_URL environment variable in production, allowing localhost in development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3001'
];
if (process.env.FRONTEND_URL) {
  const cleanedUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, "");
  allowedOrigins.push(cleanedUrl);
}

// Secure helper to validate request origins
const isOriginAllowed = (origin) => {
  if (!origin) return false;
  const cleaned = origin.trim().replace(/\/$/, "");
  if (process.env.FRONTEND_URL === "*") return true;
  if (allowedOrigins.indexOf(cleaned) !== -1) return true;
  
  // Explicitly allow user's specific production and preview Vercel subdomains securely
  if (cleaned === 'https://auralux-umber.vercel.app') return true;
  if (/^https:\/\/auralux(?:-[a-z0-9-]+)?-wazirkazimi\.vercel\.app$/.test(cleaned)) return true;
  
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Healthcheck & Diagnostic endpoint
app.get('/api/health', async (req, res) => {
  // Set CORS headers so the browser can read it
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const diagnostics = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV || "development",
      PORT: PORT,
      HAS_SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_URL_PLACEHOLDER: process.env.SUPABASE_URL === "https://placeholder-supabase-url.supabase.co" || (process.env.SUPABASE_URL && process.env.SUPABASE_URL.includes('placeholder')),
      HAS_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_KEY_PLACEHOLDER: process.env.SUPABASE_SERVICE_ROLE_KEY === "placeholder-key" || (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')),
      HAS_OPENAI_KEY: !!process.env.OPENAI_API_KEY,
      OPENAI_KEY_MOCK: !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('mock') || process.env.OPENAI_API_KEY.startsWith('sk-your'),
      FRONTEND_URL: process.env.FRONTEND_URL || "not defined"
    },
    database: {
      connected: false,
      error: null
    }
  };

  try {
    const start = Date.now();
    const { data, error } = await supabase.from("templates").select("id").limit(1);
    const latency = Date.now() - start;

    if (error) {
      diagnostics.status = "degraded";
      diagnostics.database.error = error.message || error;
    } else {
      diagnostics.database.connected = true;
      diagnostics.database.latencyMs = latency;
    }
  } catch (err) {
    diagnostics.status = "degraded";
    diagnostics.database.error = err.message || err;
  }

  res.json(diagnostics);
});

// Mount modular routes
app.use("/api/admin", adminRouter);
app.use("/api/templates", templatesRouter);

// Helper to resolve dynamic WhatsApp link from DB
async function getWhatsappLink() {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "whatsapp_number")
      .maybeSingle();
    if (data && data.value) {
      const sanitized = data.value.replace(/\D/g, '');
      if (sanitized) {
        return `https://wa.me/${sanitized}`;
      }
    }
  } catch (err) {
    console.error("Error fetching whatsapp_number from database app_settings:", err);
  }
  return process.env.WHATSAPP_LINK || 'https://wa.me/918296608821';
}

// Public configurations route
app.get("/api/settings", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value");

    if (error) throw error;

    const settingsObj = {};
    (data || []).forEach(row => {
      settingsObj[row.key] = row.value;
    });

    return res.json({ settings: settingsObj });
  } catch (error) {
    console.error("Public fetch settings error:", error);
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'deijlb7dp',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for memory storage with file security checks
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Max file size: 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'), false);
    }
  }
});

// Helper to upload a buffer directly to Cloudinary
function uploadBufferToCloudinary(buffer, folder = "auralux-inputs") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// Local usage tracking JSON helpers
const usageFilePath = path.join(__dirname, 'usage.json');

function readUsage() {
  try {
    if (fs.existsSync(usageFilePath)) {
      const data = fs.readFileSync(usageFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading usage file:', error);
  }
  return {
    totalGenerations: 0,
    daily: {},
    lastUpdated: ""
  };
}

function writeUsage(usage) {
  try {
    fs.writeFileSync(usageFilePath, JSON.stringify(usage, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing usage file:', error);
  }
}

// Mock mode on-the-fly aspect ratio cropping helper
async function getMockImageAsBase64(imageUrl, aspectRatio) {
  const tmpPath = path.join(os.tmpdir(), `mock_${Date.now()}.png`);
  try {
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tmpPath);
      https.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download mock: ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', (err) => {
        fs.unlink(tmpPath, () => reject(err));
      });
    });

    let buffer = fs.readFileSync(tmpPath);
    if (aspectRatio === "9:16") {
      buffer = await sharp(buffer)
        .extract({ left: 224, top: 0, width: 576, height: 1024 })
        .toBuffer();
    } else if (aspectRatio === "16:9") {
      buffer = await sharp(buffer)
        .extract({ left: 0, top: 224, width: 1024, height: 576 })
        .toBuffer();
    }

    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error("Error generating cropped mock image:", error);
    return imageUrl; // Fallback to raw URL
  } finally {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (e) {}
    }
  }
}

// IP-based Rate Limiting (Max 5 requests per IP per hour)
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  handler: async (req, res) => {
    const whatsappLink = await getWhatsappLink();
    return res.status(429).json({
      error: "Too many requests. Please try again later.",
      whatsappLink
    });
  }
});

// POST /api/generate (Multipart Form Data)
// Receives image and templateId, performs Sharp PNG resize/padding, and processes using OpenAI Image edit
app.post('/api/generate', generateLimiter, upload.single('image'), async (req, res, next) => {
  let templateRecord = null;
  let inputCloudinaryUrl = null;
  let whatsappLink = process.env.WHATSAPP_LINK || 'https://wa.me/918296608821';
  const userIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "unknown";

  const startTime = Date.now();
  try {
    const { templateId, aspectRatio, presentationMode = "keep_original" } = req.body;
    const currentAspectRatio = aspectRatio || "1:1";
    
    let visitorId = req.body.visitorId || req.headers['x-visitor-id'];
    if (!visitorId) {
      visitorId = 'visitor_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // 1. Check maintenance mode first from settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("app_settings")
      .select("*");

    const settings = {};
    (settingsData || []).forEach(row => {
      settings[row.key] = row.value;
    });

    if (settings["whatsapp_number"]) {
      const sanitized = settings["whatsapp_number"].replace(/\D/g, '');
      if (sanitized) {
        whatsappLink = `https://wa.me/${sanitized}`;
      }
    }

    const maintenanceMode = settings["maintenance_mode"] === "true";
    if (maintenanceMode) {
      return res.status(503).json({
        maintenance: true,
        message: "AuraLux AI is temporarily in maintenance mode. Please try again later.",
        whatsappLink
      });
    }

    // 2. Check valid uploaded image
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // 3. Check valid template
    if (!templateId) {
      return res.status(400).json({ error: 'templateId is required' });
    }

    const { data: dbTemplate, error: templateError } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !dbTemplate) {
      return res.status(400).json({ error: "Choose a valid style template." });
    }
    templateRecord = dbTemplate;

    if (!templateRecord.is_active) {
      return res.status(400).json({ error: "This style template is currently disabled." });
    }

    // 4. Check valid presentationMode & template compatibility
    const allowedModes = ["keep_original", "set_into_ring", "set_into_pendant"];
    if (!allowedModes.includes(presentationMode)) {
      return res.status(400).json({ error: "Choose a valid presentation mode." });
    }

    if (templateRecord.allowed_presentation_modes_json) {
      try {
        const allowed = JSON.parse(templateRecord.allowed_presentation_modes_json);
        if (Array.isArray(allowed) && !allowed.includes(presentationMode)) {
          return res.status(400).json({ error: "This template is not available for the selected presentation type." });
        }
      } catch (e) {
        console.error("Failed to parse allowed presentation modes:", e);
      }
    }

    // Calculate limit rules
    const maxTotal = parseInt(settings["max_total_generations"] || "80", 10);
    const hardMaxTotal = parseInt(process.env.HARD_MAX_TOTAL_GENERATIONS || "80", 10);
    const effectiveMaxTotal = Math.min(maxTotal, hardMaxTotal);

    const maxDaily = parseInt(settings["max_daily_generations"] || "20", 10);
    const hardMaxDaily = parseInt(process.env.HARD_MAX_DAILY_GENERATIONS || "20", 10);
    const effectiveMaxDaily = Math.min(maxDaily, hardMaxDaily);

    const ipLimit = parseInt(settings["max_generations_per_ip_per_day"] || "5", 10);
    const hardIpLimit = parseInt(process.env.HARD_MAX_PER_IP_PER_DAY || "5", 10);
    const effectiveIpLimit = Math.min(ipLimit, hardIpLimit);

    const freeGenerationsLimit = parseInt(settings["free_generations_per_visitor"] || settings["free_generations_per_user"] || "3", 10);
    const estCost = parseFloat(settings["estimated_cost_per_image_usd"] || "0.056");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 5. Check visitor free generation limit
    const { count: visitorCount, error: errVisitorCount } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("visitor_id", visitorId)
      .eq("generation_status", "success");

    if (errVisitorCount) {
      throw new Error("Failed to evaluate visitor usage limit");
    }

    if (visitorCount >= freeGenerationsLimit) {
      return res.json({
        limitReached: true,
        message: `You've used your ${freeGenerationsLimit} free generations. Contact us on WhatsApp to unlock more premium images.`,
        whatsappLink
      });
    }

    // 6. Check IP daily limit
    const { count: ipDailyCount, error: errIpDailyCount } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", userIp)
      .eq("generation_status", "success")
      .gte("created_at", todayStart.toISOString());

    if (errIpDailyCount) {
      throw new Error("Failed to evaluate IP usage limit");
    }

    if (ipDailyCount >= effectiveIpLimit) {
      return res.status(403).json({
        error: "Generation limit reached. Please contact us on WhatsApp.",
        whatsappLink
      });
    }

    // Retrieve global counts
    const [
      { count: totalCount, error: errTotalCount },
      { count: todayCount, error: errTodayCount }
    ] = await Promise.all([
      supabase.from("generations").select("*", { count: "exact", head: true }).eq("generation_status", "success"),
      supabase.from("generations").select("*", { count: "exact", head: true }).eq("generation_status", "success").gte("created_at", todayStart.toISOString())
    ]);

    if (errTotalCount || errTodayCount) {
      throw new Error("Failed to evaluate budget caps");
    }

    // 7. Check daily global limit
    if (todayCount >= effectiveMaxDaily) {
      return res.status(403).json({
        error: "Generation limit reached. Please contact us on WhatsApp.",
        whatsappLink
      });
    }

    // 8. Check total global limit
    if (totalCount >= effectiveMaxTotal) {
      return res.status(403).json({
        error: "Generation limit reached. Please contact us on WhatsApp.",
        whatsappLink
      });
    }

    const isMockMode = !process.env.OPENAI_API_KEY || 
                       process.env.OPENAI_API_KEY.startsWith('sk-your') || 
                       process.env.OPENAI_API_KEY === 'sk-...' ||
                       process.env.OPENAI_API_KEY.includes('development') ||
                       !process.env.CLOUDINARY_API_KEY || 
                       process.env.CLOUDINARY_API_KEY.startsWith('your_');

    if (isMockMode) {
      console.log(`Mock Mode generate: Simulating OpenAI Image Generation for template: ${templateId}, ratio: ${currentAspectRatio}, mode: ${presentationMode}`);
      // Simulate 1.5s latency
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Retrieve dynamic cropped/processed mock output
      const outputUrl = await getMockImageAsBase64(templateRecord.output_preview_url, currentAspectRatio);

      // Increment local usage counts for mock testing
      await Promise.all([
        supabase.from("generations").insert([{
          template_id: templateRecord.id,
          template_name: templateRecord.name,
          input_image_url: null,
          output_image_url: outputUrl,
          user_ip: userIp,
          user_agent: userAgent,
          generation_status: "success",
          estimated_cost_usd: estCost,
          visitor_id: visitorId,
          user_type: "free",
          is_watermarked: true,
          openai_model: "gpt-image-1-mini",
          openai_quality: "medium",
          openai_size: "1024x1024",
          ip_address: userIp,
          presentation_mode: presentationMode
        }]),
        supabase.from("templates")
          .update({ usage_count: (templateRecord.usage_count || 0) + 1 })
          .eq("id", templateRecord.id)
      ]);

      return res.json({ 
        outputUrl,
        whatsappLink
      });
    }

    console.log(`Live Mode generate: Uploading raw input to Cloudinary...`);
    inputCloudinaryUrl = await uploadBufferToCloudinary(req.file.buffer, "auralux-inputs");

    console.log(`Live Mode generate: Calling OpenAI Image Generator for template: ${templateId}, ratio: ${currentAspectRatio}, mode: ${presentationMode}`);
    const { outputUrl, metadata } = await generateImage(
      inputCloudinaryUrl, 
      templateRecord.output_preview_url, 
      templateRecord.prompt, 
      currentAspectRatio,
      true, // free user public watermarking
      presentationMode
    );

    const durationMs = Date.now() - startTime;
    const loggedUserAgent = `${userAgent} (Model: ${metadata.model} | Quality: ${metadata.quality} | Size: ${metadata.size} | Inputs: ${metadata.inputImagesCount} | Duration: ${durationMs}ms)`;

    // Save usage tracking after successful image generation in Supabase
    await Promise.all([
      supabase.from("generations").insert([{
        template_id: templateRecord.id,
        template_name: templateRecord.name,
        input_image_url: inputCloudinaryUrl,
        output_image_url: outputUrl,
        user_ip: userIp,
        user_agent: loggedUserAgent,
        generation_status: "success",
        estimated_cost_usd: metadata.estimatedCostUsd,
        visitor_id: visitorId,
        user_type: "free",
        is_watermarked: metadata.isWatermarked,
        openai_model: metadata.model,
        openai_quality: metadata.quality,
        openai_size: metadata.size,
        ip_address: userIp,
        presentation_mode: presentationMode
      }]),
      supabase.from("templates")
        .update({ usage_count: (templateRecord.usage_count || 0) + 1 })
        .eq("id", templateRecord.id)
    ]);

    res.json({ 
      outputUrl,
      whatsappLink
    });
  } catch (error) {
    console.error('Generate error:', error);
    const durationMs = Date.now() - startTime;
    const chatModel = process.env.OPENAI_CHAT_MODEL || "gpt-4o";
    const loggedUserAgent = `${userAgent} (Model: ${chatModel} | Duration: ${durationMs}ms | FAILED)`;
    const visitorId = req.body.visitorId || "unknown";
    const presentationMode = req.body.presentationMode || "keep_original";

    // Log failure event
    try {
      await supabase.from("generations").insert([{
        template_id: templateRecord ? templateRecord.id : null,
        template_name: templateRecord ? templateRecord.name : "Unknown",
        input_image_url: inputCloudinaryUrl,
        user_ip: userIp,
        user_agent: loggedUserAgent,
        generation_status: "failed",
        error_message: error.message || "Unknown error occurred",
        estimated_cost_usd: 0,
        visitor_id: visitorId,
        user_type: "free",
        is_watermarked: true,
        openai_model: chatModel,
        ip_address: userIp,
        presentation_mode: presentationMode
      }]);
    } catch (dbLogErr) {
      console.error("Failed to log failure event in database:", dbLogErr);
    }

    next(error);
  }
});

// GET /api/free-usage
app.get('/api/free-usage', async (req, res) => {
  try {
    const visitorId = req.query.visitorId;
    const userIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";

    const { data: settingsData } = await supabase
      .from("app_settings")
      .select("*");

    const settings = {};
    (settingsData || []).forEach(row => {
      settings[row.key] = row.value;
    });

    const freeGenerationsLimit = parseInt(settings["free_generations_per_visitor"] || settings["free_generations_per_user"] || "3", 10);
    const ipLimit = parseInt(settings["max_generations_per_ip_per_day"] || "5", 10);
    const hardIpLimit = parseInt(process.env.HARD_MAX_PER_IP_PER_DAY || "5", 10);
    const effectiveIpLimit = Math.min(ipLimit, hardIpLimit);

    let visitorCount = 0;
    if (visitorId) {
      const { count, error } = await supabase
        .from("generations")
        .select("*", { count: "exact", head: true })
        .eq("visitor_id", visitorId)
        .eq("generation_status", "success");
      if (!error) visitorCount = count || 0;
    }

    // IP Fallback protection check today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: ipCount } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", userIp)
      .eq("generation_status", "success")
      .gte("created_at", todayStart.toISOString());

    let remaining = Math.max(0, freeGenerationsLimit - visitorCount);
    // If IP daily limit is reached, set remaining to 0 for safety abuse block
    if ((ipCount || 0) >= effectiveIpLimit) {
      remaining = 0;
    }

    let whatsappLink = process.env.WHATSAPP_LINK || 'https://wa.me/918296608821';
    if (settings["whatsapp_number"]) {
      const sanitized = settings["whatsapp_number"].replace(/\D/g, '');
      if (sanitized) {
        whatsappLink = `https://wa.me/${sanitized}`;
      }
    }

    const maintenanceMode = settings["maintenance_mode"] === "true";

    return res.json({
      used: visitorCount,
      limit: freeGenerationsLimit,
      remaining,
      maintenanceMode,
      whatsappLink
    });
  } catch (error) {
    console.error("Error in free-usage endpoint:", error);
    return res.status(500).json({ error: "Failed to compute usage" });
  }
});


// GET /api/visitor-limits/:visitorId
app.get('/api/visitor-limits/:visitorId', async (req, res) => {
  try {
    const { visitorId } = req.params;

    // Fetch app settings limits from Supabase
    const { data: settingsData, error: settingsError } = await supabase
      .from("app_settings")
      .select("*");

    const settings = {};
    (settingsData || []).forEach(row => {
      settings[row.key] = row.value;
    });

    const freeGenerationsLimit = parseInt(settings["free_generations_per_user"] || "3", 10);
    const maintenanceMode = settings["maintenance_mode"] === "true";

    // Count visitor's generations
    const { count: visitorCount, error: errVisitorCount } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("visitor_id", visitorId)
      .eq("generation_status", "success");

    if (errVisitorCount) {
      throw new Error("Failed to evaluate visitor usage limit");
    }

    const remaining = Math.max(0, freeGenerationsLimit - (visitorCount || 0));

    let whatsappLink = process.env.WHATSAPP_LINK || 'https://wa.me/918296608821';
    if (settings["whatsapp_number"]) {
      const sanitized = settings["whatsapp_number"].replace(/\D/g, '');
      if (sanitized) {
        whatsappLink = `https://wa.me/${sanitized}`;
      }
    }

    return res.json({
      limit: freeGenerationsLimit,
      used: visitorCount || 0,
      remaining,
      maintenanceMode,
      whatsappLink
    });
  } catch (error) {
    console.error("Error fetching visitor limits:", error);
    return res.status(500).json({ error: "Failed to fetch visitor limits" });
  }
});

// Admin usage endpoints protected using x-admin-secret
app.get('/api/usage', (req, res) => {
  const secretHeader = req.headers['x-admin-secret'];
  const expectedSecret = process.env.ADMIN_SECRET;

  if (!expectedSecret || secretHeader !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid admin secret key' });
  }

  const usage = readUsage();
  const maxGenerations = parseInt(process.env.OPENAI_MAX_GENERATIONS || '180', 10);
  const dailyMaxGenerations = parseInt(process.env.OPENAI_DAILY_MAX_GENERATIONS || '30', 10);
  const costPerImage = parseFloat(process.env.OPENAI_ESTIMATED_COST_PER_IMAGE_USD || '0.025');
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyGenerations = usage.daily[todayStr] || 0;

  return res.json({
    totalGenerations: usage.totalGenerations,
    dailyGenerations: dailyGenerations,
    maxGenerations: maxGenerations,
    dailyMaxGenerations: dailyMaxGenerations,
    estimatedSpendUsd: parseFloat((usage.totalGenerations * costPerImage).toFixed(4)),
    remainingGenerations: Math.max(0, maxGenerations - usage.totalGenerations)
  });
});

// Global secure error handling middleware
app.use(async (err, req, res, next) => {
  console.error("Global Handler Logged Error:", err);

  // Set CORS headers for error responses
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy: Request origin is not allowed.' });
  }

  if (err.message && (err.message.includes('file size') || err.message.includes('file type') || err.message.includes('LIMIT_FILE_SIZE') || err.message.includes('Only JPG, PNG, and WEBP'))) {
    return res.status(400).json({ error: err.message });
  }

  const whatsappLink = await getWhatsappLink();
  res.status(500).json({ 
    error: err.message || "Image generation failed. Please try again or contact us on WhatsApp.",
    whatsappLink
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
