require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const defaultTemplates = [
  {
    name: "Emerald Luxury",
    slug: "emerald-luxury",
    category: "gemstone",
    description: "Elegant emerald campaign photography on textured stone",
    prompt: "Luxury jewelry photography. Preserve the uploaded jewellery or gemstone as closely as possible. Elegant emerald jewelry display, dark textured stone surface, vivid green gemstones, brilliant diamond accents, dramatic studio lighting, deep emerald green luxury background, ultra-premium catalog photography, photorealistic, luxury campaign aesthetic.",
    input_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/neck_ypwtcu.jpg",
    output_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236144/neck_pv3ad2.png",
    is_active: true,
    is_featured: true,
    is_beta: false
  },
  {
    name: "Black Velvet",
    slug: "black-velvet",
    category: "gemstone",
    description: "Premium product photography set on dark velvet backdrop",
    prompt: "Luxury jewellery product photography on black velvet, dramatic side lighting, premium boutique display, rich shadows, luxury advertisement style, photorealistic.",
    input_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/red_uke10n.jpg",
    output_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236147/red_xejmap.png",
    is_active: true,
    is_featured: false,
    is_beta: false
  },
  {
    name: "Macro Detail",
    slug: "macro-detail",
    category: "gemstone",
    description: "Extreme close-up shot capturing crystal facets",
    prompt: "Extreme macro photography of the uploaded gemstone or jewellery, crystal facets visible, ultra-sharp detail, mineral photography style, diffused lighting, premium editorial quality.",
    input_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/blue_n7yxxz.png",
    output_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/blue_n7yxxz.png",
    is_active: true,
    is_featured: false,
    is_beta: false
  },
  {
    name: "Golden Hour",
    slug: "golden-hour",
    category: "gemstone",
    description: "Warm sunset lighting on natural stone",
    prompt: "Luxury gemstone editorial photography, warm golden-hour sunlight, natural stone surface, cinematic bokeh, warm tones, Instagram luxury aesthetic.",
    input_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/pink_vexyhc.png",
    output_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236149/pink_vpr9gm.png",
    is_active: true,
    is_featured: false,
    is_beta: false
  },
  {
    name: "Vogue Marble",
    slug: "vogue-marble",
    category: "gemstone",
    description: "Moody catalog style shot on polished black marble",
    prompt: "High-fashion jewellery advertisement on dark marble surface, moody lighting, deep shadows, luxury editorial photography, premium magazine campaign style.",
    input_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/blue1_np3ra3.png",
    output_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236143/blue1_zyl9fg.png",
    is_active: true,
    is_featured: true,
    is_beta: false
  },
  {
    name: "Nature Flat Lay",
    slug: "nature-flat-lay",
    category: "gemstone",
    description: "Earthy flat lay layout with elements of nature",
    prompt: "Flat lay luxury jewellery photography surrounded by dried flowers and natural elements, soft natural light, earthy tones, Pinterest luxury aesthetic.",
    input_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/qu_o7yzms.png",
    output_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236145/qu_kkjvvk.png",
    is_active: true,
    is_featured: false,
    is_beta: false
  },
  {
    name: "Ring Portrait",
    slug: "ring-portrait",
    category: "ring",
    description: "Editorial model profile wearing the product",
    prompt: "The uploaded ring is the hero product and must remain visually identical to the original ring. Create an ultra-realistic luxury jewellery campaign portrait featuring a beautiful female model partially covering her face with her hand. The uploaded ring must be placed naturally on the model's finger while preserving the original design as closely as possible. The ring is the primary focus of the image. Ring must be fully visible, sharply focused, and prominent in the frame. Do not redesign, replace, reinterpret, or modify the ring. Only change model, lighting, background, and composition.",
    input_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780241242/ring_zbvaee.png",
    output_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780241787/ring-model_t1d5l4.png",
    is_active: true,
    is_featured: false,
    is_beta: true
  },
  {
    name: "Ring Close-Up",
    slug: "ring-closeup",
    category: "ring",
    description: "Close-up hand model focusing entirely on the ring",
    prompt: "The uploaded ring is the hero product. Create a close-up luxury beauty portrait where the model's hand showcases the uploaded ring near her face. Preserve the ring's gemstone color, shape, halo design, band design, metal color, diamond arrangement, proportions, and setting details as closely as possible. Ring must be large, sharp, fully visible, and the main focal point. Do not create a different ring.",
    input_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780241242/ring_zbvaee.png",
    output_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780241955/ring-model1_xidkkl.png",
    is_active: true,
    is_featured: false,
    is_beta: true
  },
  {
    name: "Editorial Glove",
    slug: "editorial-glove",
    category: "ring",
    description: "Minimalist fashion magazine look using white gloves",
    prompt: "Editorial fashion portrait featuring white leather gloves wearing the uploaded jewellery. The uploaded jewellery is the hero product and must remain visually similar to the original. Soft sunlight, luxury fashion magazine style, clean off-white background, premium commercial photography. Do not redesign or replace the jewellery.",
    input_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780242141/Screenshot_2026-05-31_211148_n2d6sy.png",
    output_preview_url: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780242286/ring-model2_zyruro.png",
    is_active: true,
    is_featured: false,
    is_beta: true
  }
];

const defaultSettings = [
  { key: "max_total_generations", value: "180" },
  { key: "max_daily_generations", value: "30" },
  { key: "estimated_cost_per_image_usd", value: "0.025" },
  { key: "maintenance_mode", value: "false" }
];

async function seed() {
  console.log("Seeding templates into Supabase templates table...");
  
  for (const template of defaultTemplates) {
    const { data, error } = await supabase
      .from("templates")
      .upsert(template, { onConflict: "slug" })
      .select();

    if (error) {
      console.error(`Error upserting template ${template.slug}:`, error.message);
    } else {
      console.log(`Successfully seeded template: ${template.slug}`);
    }
  }

  console.log("\nSeeding app_settings...");
  for (const setting of defaultSettings) {
    const { data, error } = await supabase
      .from("app_settings")
      .upsert(setting, { onConflict: "key" })
      .select();

    if (error) {
      console.error(`Error upserting app_setting ${setting.key}:`, error.message);
    } else {
      console.log(`Successfully seeded setting: ${setting.key} = ${setting.value}`);
    }
  }

  console.log("\nSeeding complete!");
}

seed().catch(err => {
  console.error("Unhandled seed error:", err);
  process.exit(1);
});
