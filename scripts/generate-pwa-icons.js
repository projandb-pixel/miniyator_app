// این اسکریپت برای ایجاد آیکون‌های PWA استفاده می‌شود
// برای استفاده: node scripts/generate-pwa-icons.js

const fs = require('fs');
const path = require('path');

// SVG آیکون (بدون متن فارسی برای سازگاری بهتر)
const svgIcon = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="#2563eb"/>
  <circle cx="256" cy="256" r="200" stroke="white" stroke-width="8" fill="none"/>
  
  <!-- Megaphone body -->
  <path d="M 180 200 L 180 312 L 260 280 L 260 232 Z" fill="white"/>
  
  <!-- Sound waves -->
  <path d="M 260 240 L 300 220 L 260 250 L 320 230 L 260 256 L 340 240" stroke="white" stroke-width="12" stroke-linecap="round" fill="none"/>
  <path d="M 260 256 L 300 276 L 260 262 L 320 282 L 260 272 L 340 288" stroke="white" stroke-width="12" stroke-linecap="round" fill="none"/>
</svg>`;

// ذخیره SVG
const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

// تلاش برای استفاده از sharp برای ایجاد PNG
try {
  const sharp = require('sharp');
  
  const svgBuffer = Buffer.from(svgIcon);
  
  // ایجاد آیکون 192x192
  sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192x192.png'))
    .then(() => {
      console.log('✅ icon-192x192.png created');
    })
    .catch((err) => {
      console.error('❌ Error creating icon-192x192.png:', err.message);
    });
  
  // ایجاد آیکون 512x512
  sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512x512.png'))
    .then(() => {
      console.log('✅ icon-512x512.png created');
      console.log('');
      console.log('✅ تمام آیکون‌های PWA ایجاد شدند!');
    })
    .catch((err) => {
      console.error('❌ Error creating icon-512x512.png:', err.message);
    });
  
  console.log('✅ SVG icon created at public/icon.svg');
  console.log('⏳ در حال ایجاد PNG آیکون‌ها...');
  
} catch (error) {
  console.log('✅ SVG icon created at public/icon.svg');
  console.log('');
  console.log('⚠️  sharp نصب نشده است. برای ایجاد PNG آیکون‌ها:');
  console.log('');
  console.log('1. نصب sharp: npm install sharp --save-dev');
  console.log('2. اجرای مجدد این اسکریپت');
  console.log('');
  console.log('یا استفاده از ابزار آنلاین:');
  console.log('   - https://realfavicongenerator.net/');
  console.log('   - https://www.pwabuilder.com/imageGenerator');
}
