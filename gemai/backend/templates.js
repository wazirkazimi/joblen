const templates = [
  {
    id: "luxury-emerald-campaign",
    name: "Luxury Emerald Campaign",
    category: "jewelry-sets",
    featured: true,
    previewInput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/neck_ypwtcu.jpg",
    previewOutput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236144/neck_pv3ad2.png",
    prompt: "create a image of Luxury jewelry photography of [item], elegant emerald jewelry set displayed on dark textured stone, multi-strand faceted emerald bead necklace, matching floral emerald earrings with gold detailing, vivid green gemstones, brilliant diamond accents, dramatic studio lighting, deep emerald green gradient background, ultra sharp focus, premium luxury brand aesthetic, rich reflections, high-end catalog photography, macro gemstone detail, sophisticated composition, photorealistic, 8K quality, luxury fashion campaign."
  },
  {
    id: "ring-boutique-display",
    name: "Boutique Ring Display",
    category: "rings",
    featured: true,
    previewInput: null,
    previewOutput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780241242/ring_zbvaee.png",
    prompt: "[gem] on black velvet, single spotlight, dramatic shadows, high-end jewellery boutique display"
  },
  {
    id: "ring-model-closeup",
    name: "Luxury Hand Model",
    category: "fashion-models",
    featured: true,
    previewInput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780241242/ring_zbvaee.png",
    previewOutput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780241955/ring-model1_xidkkl.png",
    prompt: "An ultra-realistic luxury jewellery campaign portrait featuring a beautiful female model partially covering her face with her hand. The uploaded ring [item/uploaded ring] must be placed naturally on the model's finger while preserving the original design exactly. Preserve the ring's exact gemstone color, exact gemstone shape, exact gemstone size, exact halo design, exact band design, exact metal color, exact diamond arrangement, exact proportions, and exact setting details. The ring is the primary focus of the image. Composition requirements: Ring occupies a prominent portion of the frame, is fully visible, and is razor-sharp and in focus. Face and hand support the product presentation. Luxury beauty campaign composition, natural skin texture with visible pores, elegant editorial lighting, premium jewellery advertisement aesthetic, high-end commercial photography, realistic reflections and gemstone sparkle, photorealistic, ultra detailed, luxury fashion magazine quality. The model exists only to showcase the ring. Do NOT redesign the ring, replace the ring, generate a new ring, change gemstone color, change gemstone shape, change gemstone size, alter halo structure, alter band structure, alter stone arrangement, alter metal color, invent new jewellery details, crop out the ring, or blur the ring. The uploaded jewellery is an existing commercial product. Do not redesign, reinterpret, replace, or modify the jewellery. Preserve the original design as closely as possible. Only change background, lighting, environment, styling, camera angle, and model presentation. Treat the uploaded ring as a real commercial product that must be preserved while changing only the model, lighting, background, and composition."
  },
  {
    id: "tiffany-product-shot",
    name: "Tiffany Style Product Shot",
    category: "gemstones",
    featured: false,
    previewInput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/red_uke10n.jpg",
    previewOutput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236147/red_xejmap.png",
    prompt: "luxury jewellery product shot of [item] on black velvet, dramatic side lighting, specular highlights, depth of field, Tiffany advertisement style"
  },
  {
    id: "macro-gem-photography",
    name: "Macro Gem Photography",
    category: "gemstones",
    featured: false,
    previewInput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/blue_n7yxxz.png",
    previewOutput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/blue_n7yxxz.png",
    prompt: "extreme macro photography of [uplaoded item], crystal facets visible, mineral photography, sharp throughout, f/11, diffused light, National Geographic style"
  },
  {
    id: "golden-hour-editorial",
    name: "Golden Hour Editorial",
    category: "editorial",
    featured: false,
    previewInput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/pink_vexyhc.png",
    previewOutput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236149/pink_vpr9gm.png",
    prompt: "gemstone product editorial, warm golden hour sunlight, placed on natural stone surface, bokeh background, Instagram luxury lifestyle, warm tones"
  },
  {
    id: "vogue-dark-marble",
    name: "Vogue Editorial",
    category: "editorial",
    featured: true,
    previewInput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/blue1_np3ra3.png",
    previewOutput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236143/blue1_zyl9fg.png",
    prompt: "[item] on dark marble surface, moody atmospheric lighting, deep shadows, single key light, high fashion jewellery advertisement, Vogue editorial"
  },
  {
    id: "pinterest-flatlay",
    name: "Pinterest Flat Lay",
    category: "lifestyle",
    featured: false,
    previewInput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236130/qu_o7yzms.png",
    previewOutput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780236145/qu_kkjvvk.png",
    prompt: "flat lay photography of [item] surrounded by dried flowers and natural elements, soft natural window light, earthy tones, Pinterest aesthetic, overhead shot"
  },
  {
    id: "white-glove-fashion",
    name: "White Glove Editorial",
    category: "fashion-models",
    featured: false,
    previewInput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780242141/Screenshot_2026-05-31_211148_n2d6sy.png",
    previewOutput: "https://res.cloudinary.com/deijlb7dp/image/upload/q_auto/f_auto/v1780242286/ring-model2_zyruro.png",
    prompt: "Bright editorial fashion portrait, close-up detail of a model wearing white leather gloves, [item/uploaded img ], natural sunlight illumination, soft and airy atmosphere, realistic textures, high-resolution photography, minimalistic off-white background, elegant fashion magazine style."
  }
];

module.exports = templates;
