const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const https = require("https");
const os = require("os");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const sharp = require("sharp");

// Helper to download a file from URL to local file path
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

// Upload buffer to Cloudinary
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "auralux-outputs", resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// Main generation function using OpenAI Image Edit API
async function generateImage(cloudinaryUrl, prompt, aspectRatio = "1:1") {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const tmpPath = path.join(os.tmpdir(), `input_${Date.now()}.png`);
  
  try {
    // 1. Download image from Cloudinary into a temp file
    await downloadFile(cloudinaryUrl, tmpPath);

    // 2. Call OpenAI edit API with a retry mechanism (maximum 1 retry on network failures)
    const modelName = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";
    let response;
    let attempts = 0;

    while (attempts < 2) {
      try {
        attempts++;
        response = await openai.images.edit({
          model: modelName,
          image: fs.createReadStream(tmpPath),
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "low",
          response_format: "b64_json"
        });
        break; // Success, break out of loop
      } catch (err) {
        console.error(`OpenAI image generation attempt ${attempts} failed:`, err);
        const isBillingOrQuota = err.status === 402 || err.status === 429 || (err.message && (err.message.includes('billing') || err.message.includes('rate limit') || err.message.includes('quota') || err.message.includes('insufficient_quota') || err.message.includes('limit_exceeded')));
        
        if (attempts >= 2 || isBillingOrQuota) {
          throw err; // Re-throw the error, do not retry
        }
        console.log("Retrying OpenAI image generation due to network error...");
      }
    }

    // 3. Get output base64 data
    const base64 = response.data[0].b64_json;
    if (!base64) {
      throw new Error("No image data returned from OpenAI");
    }
    let outputBuffer = Buffer.from(base64, "base64");

    // Crop the square output to matching aspect ratio if needed
    if (aspectRatio === "9:16") {
      outputBuffer = await sharp(outputBuffer)
        .extract({ left: 224, top: 0, width: 576, height: 1024 })
        .toBuffer();
    } else if (aspectRatio === "16:9") {
      outputBuffer = await sharp(outputBuffer)
        .extract({ left: 0, top: 224, width: 1024, height: 576 })
        .toBuffer();
    }

    // 4. Upload output to Cloudinary
    const outputUrl = await uploadBufferToCloudinary(outputBuffer);

    return outputUrl;
  } finally {
    // 5. Cleanup temp file
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch (err) {
        console.error("Failed to delete temp file:", err);
      }
    }
  }
}

module.exports = generateImage;
