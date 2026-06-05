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
require('dotenv').config();


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
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(o => origin.startsWith(o));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Mount modular routes
app.use("/api/admin", adminRouter);
app.use("/api/templates", templatesRouter);

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

// IP-based Rate Limiting (Max 3 requests per IP per hour)
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  handler: (req, res) => {
    return res.status(429).json({
      error: "Too many generations. Please try again later or contact us on WhatsApp.",
      whatsappLink: process.env.WHATSAPP_LINK || 'https://wa.me/919999999999'
    });
  }
});

// IP-based Rate Limiting (Max 10 requests per IP per day)
const generateDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10,
  handler: (req, res) => {
    return res.status(429).json({
      error: "Too many generations. Please try again later or contact us on WhatsApp.",
      whatsappLink: process.env.WHATSAPP_LINK || 'https://wa.me/919999999999'
    });
  }
});

// POST /api/generate (Multipart Form Data)
// Receives image and templateId, performs Sharp PNG resize/padding, and processes using OpenAI Image edit
app.post('/api/generate', generateLimiter, generateDailyLimiter, upload.single('image'), async (req, res, next) => {
  let templateRecord = null;
  let inputCloudinaryUrl = null;
  const whatsappLink = process.env.WHATSAPP_LINK || 'https://wa.me/919999999999';
  const userIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "unknown";

  try {
    const { templateId, aspectRatio } = req.body;
    const currentAspectRatio = aspectRatio || "1:1";
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    if (!templateId) {
      return res.status(400).json({ error: 'templateId is required' });
    }

    // 1. Fetch template from Supabase
    const { data: dbTemplate, error: templateError } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !dbTemplate) {
      return res.status(400).json({ error: "Choose a valid style template." });
    }
    templateRecord = dbTemplate;

    // Check if template is active
    if (!templateRecord.is_active) {
      return res.status(400).json({ error: "This style template is currently disabled." });
    }

    // 2. Fetch app settings limits from Supabase
    const { data: settingsData, error: settingsError } = await supabase
      .from("app_settings")
      .select("*");

    const settings = {};
    (settingsData || []).forEach(row => {
      settings[row.key] = row.value;
    });

    const maintenanceMode = settings["maintenance_mode"] === "true";
    const maxTotal = parseInt(settings["max_total_generations"] || "180", 10);
    const maxDaily = parseInt(settings["max_daily_generations"] || "30", 10);
    const estCost = parseFloat(settings["estimated_cost_per_image_usd"] || "0.025");

    if (maintenanceMode) {
      return res.status(503).json({
        error: "System is undergoing maintenance. Please try again later or contact us on WhatsApp.",
        whatsappLink
      });
    }

    // Compute counts from generations table
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

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

    if (totalCount >= maxTotal || todayCount >= maxDaily) {
      return res.status(403).json({
        error: "Generation limit reached. Please contact us on WhatsApp.",
        whatsappLink
      });
    }

    // 3. Convert uploaded image buffer to correct aspect ratio sizing using sharp
    let pngBuffer;
    if (currentAspectRatio === "9:16") {
      // Resize fitting 576x1024, composite centered onto transparent 1024x1024 canvas
      const resized = await sharp(req.file.buffer)
        .resize(576, 1024, { fit: 'cover' })
        .toBuffer();

      pngBuffer = await sharp({
        create: {
          width: 1024,
          height: 1024,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
      .composite([{ input: resized, top: 0, left: 224 }])
      .png()
      .toBuffer();
    } else if (currentAspectRatio === "16:9") {
      // Resize fitting 1024x576, composite centered onto transparent 1024x1024 canvas
      const resized = await sharp(req.file.buffer)
        .resize(1024, 576, { fit: 'cover' })
        .toBuffer();

      pngBuffer = await sharp({
        create: {
          width: 1024,
          height: 1024,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
      .composite([{ input: resized, top: 224, left: 0 }])
      .png()
      .toBuffer();
    } else {
      // Default Square 1:1
      pngBuffer = await sharp(req.file.buffer)
        .resize(1024, 1024, { fit: 'cover' })
        .png()
        .toBuffer();
    }

    const isMockMode = !process.env.OPENAI_API_KEY || 
                       process.env.OPENAI_API_KEY.startsWith('sk-your') || 
                       process.env.OPENAI_API_KEY === 'sk-...' ||
                       process.env.OPENAI_API_KEY.includes('development') ||
                       !process.env.CLOUDINARY_API_KEY || 
                       process.env.CLOUDINARY_API_KEY.startsWith('your_');

    if (isMockMode) {
      console.log(`Mock Mode generate: Simulating OpenAI Image Edit for template: ${templateId}, ratio: ${currentAspectRatio}`);
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
          estimated_cost_usd: estCost
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

    console.log(`Live Mode generate: Uploading padded input PNG to Cloudinary...`);
    inputCloudinaryUrl = await uploadBufferToCloudinary(pngBuffer, "auralux-inputs");

    // Construct master prompt securely from template details in the database
    const masterPrefix = "Using the uploaded jewellery or gemstone as the primary subject, preserve the overall appearance, color, gemstone type, and visible design details as closely as possible. ";
    const masterSuffix = " Do not create a completely different jewellery piece. Only modify styling, background, lighting, composition, and environment.";
    const fullPrompt = `${masterPrefix}${templateRecord.prompt}${masterSuffix}`;

    console.log(`Live Mode generate: Calling OpenAI Image edit for template: ${templateId}, ratio: ${currentAspectRatio}`);
    const outputUrl = await generateImage(inputCloudinaryUrl, fullPrompt, currentAspectRatio);

    // Save usage tracking after successful image generation in Supabase
    await Promise.all([
      supabase.from("generations").insert([{
        template_id: templateRecord.id,
        template_name: templateRecord.name,
        input_image_url: inputCloudinaryUrl,
        output_image_url: outputUrl,
        user_ip: userIp,
        user_agent: userAgent,
        generation_status: "success",
        estimated_cost_usd: estCost
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

    // Log failure event
    try {
      await supabase.from("generations").insert([{
        template_id: templateRecord ? templateRecord.id : null,
        template_name: templateRecord ? templateRecord.name : "Unknown",
        input_image_url: inputCloudinaryUrl,
        user_ip: userIp,
        user_agent: userAgent,
        generation_status: "failed",
        error_message: error.message || "Unknown error occurred",
        estimated_cost_usd: 0
      }]);
    } catch (dbLogErr) {
      console.error("Failed to log failure event in database:", dbLogErr);
    }

    next(error);
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
app.use((err, req, res, next) => {
  console.error("Global Handler Logged Error:", err);

  if (err.message && (err.message.includes('file size') || err.message.includes('file type') || err.message.includes('LIMIT_FILE_SIZE') || err.message.includes('Only JPG, PNG, and WEBP'))) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ 
    error: "Image generation failed. Please try again or contact us on WhatsApp.",
    whatsappLink: process.env.WHATSAPP_LINK || 'https://wa.me/919999999999'
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
