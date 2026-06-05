const buildPrompts = (gemType) => ({

  flatlay: `product photography of a ${gemType} gemstone on a textured stone surface 
  surrounded by dried flowers, dried roses, lavender sprigs, natural earthy elements, 
  overhead flat lay shot, warm natural window light, soft shadows, 
  Pinterest aesthetic, editorial lifestyle, pastel tones, 
  highly detailed, 8K resolution, professional product photo`,

  ring: `luxury jewellery product photography, ${gemType} gemstone set in 
  18k gold solitaire ring, pure white background, studio lighting, 
  soft box diffused light, sharp focus on stone, specular highlights on metal, 
  ecommerce hero shot, GIA grading photograph style, 
  8K resolution, professional jewellery advertisement`

});

module.exports = buildPrompts;
