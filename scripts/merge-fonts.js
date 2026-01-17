// Merge two font JSON files into one
// Usage: node scripts/merge-fonts.js font1.json font2.json output.json

const fs = require('fs');

const file1 = process.argv[2] || 'public/fonts/连筋中文.json';
const file2 = process.argv[3] || 'public/fonts/连筋英文.json';
const outputFile = process.argv[4] || 'public/fonts/连筋字体.json';

console.log(`Merging ${file1} and ${file2}...`);

// Load both fonts
const font1 = JSON.parse(fs.readFileSync(file1, 'utf8'));
const font2 = JSON.parse(fs.readFileSync(file2, 'utf8'));

// Use font1 as base
const merged = { ...font1 };

// Merge glyphs from font2 into font1
// Font2 glyphs will override font1 glyphs for same characters
let added = 0;
let overwritten = 0;

for (const [char, glyph] of Object.entries(font2.glyphs)) {
  if (merged.glyphs[char]) {
    // Overwrite if font2 has the same character
    merged.glyphs[char] = glyph;
    overwritten++;
  } else {
    // Add new character
    merged.glyphs[char] = glyph;
    added++;
  }
}

// Update family name
merged.familyName = '连筋字体';

// Write merged font
fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2));

const totalGlyphs = Object.keys(merged.glyphs).length;
console.log(`Done!`);
console.log(`- Added ${added} new glyphs from ${file2}`);
console.log(`- Overwritten ${overwritten} existing glyphs`);
console.log(`- Total glyphs in merged font: ${totalGlyphs}`);
console.log(`- Output saved to: ${outputFile}`);
