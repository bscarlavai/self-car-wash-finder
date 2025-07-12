const fs = require('fs');
const path = require('path');

// Create a simple HTML file that can be converted to an image
function createOGImageHTML(title, filename) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      text-align: center;
    }
    .title {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .subtitle {
      font-size: 24px;
      opacity: 0.9;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }
    .icons {
      position: absolute;
      font-size: 60px;
      opacity: 0.1;
    }
    .icon1 { top: 20%; left: 20%; }
    .icon2 { bottom: 20%; right: 20%; }
  </style>
</head>
<body>
  <div class="icons icon1">🐱</div>
  <div class="icons icon2">☕</div>
  <div class="title">${title}</div>
  <div class="subtitle">Cat Cafe Directory</div>
</body>
</html>`;

  const outputDir = path.join(__dirname, '..', 'public', 'og-images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(outputDir, `${filename}.html`), html);
  console.log(`Created ${filename}.html - You can convert this to JPG using:`);
  console.log(`  - Screenshot the HTML file in a browser`);
  console.log(`  - Use a tool like wkhtmltoimage`);
  console.log(`  - Use an online HTML to image converter`);
}

// Create images for different page types
const images = [
  { title: 'Find Your Perfect Cat Cafe', filename: 'og-default' },
  { title: 'Cat Cafe Directory', filename: 'og-homepage' },
  { title: 'Cat Cafes by State', filename: 'og-state' },
  { title: 'Cat Cafes by City', filename: 'og-city' },
  { title: 'Search Cat Cafes', filename: 'og-search' },
  { title: 'Find Cat Cafes Near Me', filename: 'og-cat-cafe-near-me' }
];

console.log('Creating Open Graph image HTML files...\n');

images.forEach(({ title, filename }) => {
  createOGImageHTML(title, filename);
});

console.log('\nAll HTML files created in public/og-images/');
console.log('\nTo convert these to JPG images:');
console.log('1. Open each HTML file in a browser');
console.log('2. Take a screenshot at 1200x630 resolution');
console.log('3. Save as JPG in the public/ folder');
console.log('\nOr use online tools like:');
console.log('- https://html-to-image.com/');
console.log('- https://www.browserling.com/tools/html-to-image');
console.log('\nRecommended: Create custom designs using Canva, Figma, or Photoshop'); 