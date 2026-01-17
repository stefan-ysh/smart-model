// Font converter script - converts TTF to Three.js typeface JSON format
const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || 'public/fonts/连筋字体.ttf';
const outputFile = process.argv[3] || 'public/fonts/stencil_font.json';

console.log(`Converting ${inputFile} to ${outputFile}...`);

// Load the font
const font = opentype.loadSync(inputFile);

// Build the typeface JSON format that Three.js expects
const result = {
  glyphs: {},
  familyName: font.names.fontFamily?.en || font.names.fullName?.en || 'StencilFont',
  ascender: font.ascender,
  descender: font.descender,
  underlinePosition: font.tables.post?.underlinePosition || -100,
  underlineThickness: font.tables.post?.underlineThickness || 50,
  boundingBox: {
    xMin: font.tables.head.xMin,
    xMax: font.tables.head.xMax,
    yMin: font.tables.head.yMin,
    yMax: font.tables.head.yMax
  },
  resolution: 1000, // Standard resolution for Three.js fonts
  original_font_information: {
    postscript_name: font.names.postScriptName?.en || '',
    version_string: font.names.version?.en || '',
    vendor_url: font.names.manufacturerURL?.en || '',
    full_font_name: font.names.fullName?.en || '',
    font_family_name: font.names.fontFamily?.en || '',
    copyright: font.names.copyright?.en || '',
    description: font.names.description?.en || '',
    license: font.names.license?.en || '',
    license_url: font.names.licenseURL?.en || '',
    manufacturer_name: font.names.manufacturer?.en || '',
    designer: font.names.designer?.en || ''
  }
};

// Get all glyphs
const scale = 1000 / font.unitsPerEm;

for (let i = 0; i < font.glyphs.length; i++) {
  const glyph = font.glyphs.get(i);
  
  if (glyph.unicode === undefined) continue;
  
  const char = String.fromCharCode(glyph.unicode);
  const glyphData = {
    ha: Math.round(glyph.advanceWidth * scale),
    x_min: glyph.xMin !== undefined ? Math.round(glyph.xMin * scale) : 0,
    x_max: glyph.xMax !== undefined ? Math.round(glyph.xMax * scale) : 0,
    o: ''
  };
  
  // Convert path commands
  if (glyph.path && glyph.path.commands) {
    const commands = [];
    for (const cmd of glyph.path.commands) {
      switch (cmd.type) {
        case 'M':
          commands.push(`m ${Math.round(cmd.x * scale)} ${Math.round(cmd.y * scale)}`);
          break;
        case 'L':
          commands.push(`l ${Math.round(cmd.x * scale)} ${Math.round(cmd.y * scale)}`);
          break;
        case 'Q':
          commands.push(`q ${Math.round(cmd.x1 * scale)} ${Math.round(cmd.y1 * scale)} ${Math.round(cmd.x * scale)} ${Math.round(cmd.y * scale)}`);
          break;
        case 'C':
          commands.push(`b ${Math.round(cmd.x1 * scale)} ${Math.round(cmd.y1 * scale)} ${Math.round(cmd.x2 * scale)} ${Math.round(cmd.y2 * scale)} ${Math.round(cmd.x * scale)} ${Math.round(cmd.y * scale)}`);
          break;
        case 'Z':
          commands.push('z');
          break;
      }
    }
    glyphData.o = commands.join(' ');
  }
  
  result.glyphs[char] = glyphData;
}

// Write the result
fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
console.log(`Done! Converted ${Object.keys(result.glyphs).length} glyphs`);
console.log(`Output saved to: ${outputFile}`);
