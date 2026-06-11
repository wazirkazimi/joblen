const OpenAI = require("openai");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const sharp = require("sharp");

// Watermark composition using sharp
async function applyWatermark(imageBuffer, text = "Made on AuraLux AI") {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    const fontSize = Math.max(12, Math.round(width * 0.025)) || 24;
    const margin = 24; // Keep margin around 24px

    const svgText = `
      <svg width="${width}" height="${height}">
        <style>
          .w-shadow {
            fill: rgba(0, 0, 0, 0.35);
            font-family: sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
            text-anchor: end;
          }
          .w-text {
            fill: rgba(255, 255, 255, 0.50);
            font-family: sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
            text-anchor: end;
          }
        </style>
        <text x="${width - margin + 1}" y="${height - margin + 1}" class="w-shadow">${text}</text>
        <text x="${width - margin}" y="${height - margin}" class="w-text">${text}</text>
      </svg>
    `;

    return await sharp(imageBuffer)
      .composite([{
        input: Buffer.from(svgText),
        top: 0,
        left: 0
      }])
      .toBuffer();
  } catch (err) {
    console.error("Failed to apply watermark:", err);
    return imageBuffer;
  }
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

// Main generation function using OpenAI Responses API & image_generation tool
async function generateImage(cloudinaryUrl, templateOutputPreviewUrl, templatePrompt, aspectRatio = "1:1", watermark = true, presentationMode = "keep_original") {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const chatModel = process.env.OPENAI_CHAT_MODEL || "gpt-4o";

  // Map aspect ratio to DALL-E 3 size parameter
  let sizeParam = "1024x1024";
  if (aspectRatio === "9:16") {
    sizeParam = "1024x1792";
  } else if (aspectRatio === "16:9") {
    sizeParam = "1792x1024";
  }

  // Map presentation mode to prompt blocks
  let presentationPrompt = "";
  if (presentationMode === "keep_original") {
    presentationPrompt = `The uploaded product category must remain the same.

If the uploaded image is a loose gemstone, keep it as a loose gemstone.

If the uploaded image is a ring, keep it as a ring.

If the uploaded image is a pendant, keep it as a pendant.

Do not convert a loose gemstone into a ring, pendant, necklace, earring, bracelet, or any jewellery setting.

Do not add metal, prongs, halo diamonds, chain, band, or pendant loop unless they already exist in the uploaded product.

Preserve the original product type.

Only change the background, lighting, surface, camera quality, mood, and luxury styling.`;
  } else if (presentationMode === "set_into_ring") {
    presentationPrompt = `Use the uploaded gemstone as the main center stone and design a premium luxury ring around it.

Preserve the gemstone color, shape, cut style, proportions, and visual identity as much as possible.

Create a beautiful ring setting suitable for high-end jewellery advertising.

It is allowed to add:
* ring band
* prongs
* halo diamonds
* pavé diamonds
* luxury metal setting

Do not change the gemstone into a different color or shape.

The final output should be a luxury ring featuring the uploaded gemstone.`;
  } else if (presentationMode === "set_into_pendant") {
    presentationPrompt = `Use the uploaded gemstone as the main center stone and design a premium luxury pendant around it.

Preserve the gemstone color, shape, cut style, proportions, and visual identity as much as possible.

Create a beautiful pendant setting suitable for high-end jewellery advertising.

It is allowed to add:
* pendant bail
* prongs
* halo diamonds
* decorative metal setting
* chain if composition requires it

Do not change the gemstone into a different color or shape.

The final output should be a luxury pendant featuring the uploaded gemstone.`;
  }

  // Construct prompt rules matching the ChatGPT app experience
  const masterPrompt = `IMAGE 1 is the customer's uploaded product reference.
IMAGE 2 is the selected template style reference.

Use IMAGE 1 for product identity.
Use IMAGE 2 for visual style only.

Do not copy the product from IMAGE 2.

${presentationPrompt}

${templatePrompt}

Camera and composition rule:
Follow the camera angle, crop, scale, framing, and composition of IMAGE 2 as closely as possible.

If IMAGE 2 is a close-up macro photo, final output should also be a close-up macro photo.
If IMAGE 2 is a flat lay, final output should also be a flat lay.
If IMAGE 2 is a front-facing product shot, final output should also be front-facing.
If IMAGE 2 shows the product centered and large, final output should also show the product centered and large.

Do not change the camera angle randomly.
Do not invent a different composition unless required by the selected presentation mode.

Anti-Template Lock Instruction:
Generate a new model, new hand position, new facial features, new pose, new composition, and new camera angle every time. The uploaded gemstone/product must remain identical to the source image while the surrounding human subject and scene are free to vary creatively.

Final output:
A single premium photorealistic luxury jewellery/gemstone advertising image.
No text.
No logo.
No watermark except the app watermark added later by backend for free users.

Final instruction:
Generate one finished luxury jewellery product image using the image_generation tool with size "${sizeParam}". The uploaded product should be visually similar to IMAGE 1 and the style should be inspired by IMAGE 2.`;

  let response;
  let attempts = 0;

  while (attempts < 2) {
    try {
      attempts++;
      console.log(`Responses API (Attempt ${attempts}): Querying model ${chatModel} with image_generation tool...`);
      
      response = await openai.responses.create({
        model: chatModel,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: masterPrompt },
              { type: "input_image", image_url: cloudinaryUrl },
              { type: "input_image", image_url: templateOutputPreviewUrl }
            ]
          }
        ],
        tools: [{ type: "image_generation" }]
      });
      break; // Success, break out of loop
    } catch (err) {
      console.error(`Responses API image generation attempt ${attempts} failed:`, err);
      const isBillingOrQuota = err.status === 402 || err.status === 429 || (err.message && (err.message.includes('billing') || err.message.includes('rate limit') || err.message.includes('quota') || err.message.includes('insufficient_quota') || err.message.includes('limit_exceeded')));
      
      if (attempts >= 2 || isBillingOrQuota) {
        throw err;
      }
      console.log("Retrying Responses API image generation due to network error...");
    }
  }

  // Extract the generated image from the response outputs
  const imageGenerationOutputs = response.output ? response.output.filter(
    (out) => out.type === "image_generation_call"
  ) : [];

  if (imageGenerationOutputs.length === 0) {
    console.error("OpenAI Responses API did not trigger the image generation tool. Full response:", JSON.stringify(response));
    throw new Error("No image data returned from OpenAI Responses API. Make sure the model supports tool calls.");
  }

  const base64Data = imageGenerationOutputs[0].result;
  if (!base64Data) {
    throw new Error("Empty image result returned from OpenAI Responses API");
  }

  console.log("Decoding base64 image data...");
  const outputBuffer = Buffer.from(base64Data, "base64");

  // Calculate estimated cost
  let imageCost = 0.040;
  if (aspectRatio === "9:16" || aspectRatio === "16:9") {
    imageCost = 0.080;
  }
  const chatOverhead = 0.015; // Estimated Vision tokens cost
  const totalCost = parseFloat((imageCost + chatOverhead).toFixed(4));

  let processedBuffer = outputBuffer;
  if (watermark) {
    console.log("Applying watermark to free image generation output...");
    processedBuffer = await applyWatermark(outputBuffer);
  }

  console.log("Uploading final image buffer to Cloudinary...");
  const outputUrl = await uploadBufferToCloudinary(processedBuffer);

  return {
    outputUrl,
    metadata: {
      model: chatModel,
      quality: "standard",
      size: sizeParam,
      inputImagesCount: 2,
      estimatedCostUsd: totalCost,
      isWatermarked: watermark
    }
  };
}


module.exports = generateImage;
