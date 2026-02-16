const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const svgPath = path.join(__dirname, '../public/petrochemical-logos/persian-gulf-holding.svg');
  const pngPath = path.join(__dirname, '../public/petrochemical-logos/persian-gulf-holding.png');
  
  try {
    // خواندن SVG
    const svgBuffer = fs.readFileSync(svgPath);
    
    // تبدیل SVG به PNG با sharp
    await sharp(svgBuffer)
      .resize(200, 200)
      .png()
      .toFile(pngPath);
    
    console.log('✅ SVG successfully converted to PNG:', pngPath);
  } catch (error) {
    console.error('❌ Error converting SVG to PNG:', error);
    process.exit(1);
  }
}

convertSvgToPng();









