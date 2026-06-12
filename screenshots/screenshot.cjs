const puppeteer = require('puppeteer');
const path = require('path');

// iPhone 14 Pro Max: logical 430×932, deviceScaleFactor 3 → 1290×2796
// We use 414×896 @ dpr 3 = 1242×2688 (classic spec)
const W  = 414;
const H  = 896;
const DPR = 3;

const pages = [
  { file: 'dashboard.html', out: 'dashboard.png' },
  { file: 'summary.html',   out: 'summary.png'   },
  { file: 'chat.html',      out: 'chat.png'       },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const { file, out } of pages) {
    const page = await browser.newPage();

    await page.setViewport({ width: W, height: H, deviceScaleFactor: DPR });

    const url = 'file://' + path.resolve(__dirname, file);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait a tick for fonts / animations to settle
    await new Promise(r => setTimeout(r, 800));

    const outPath = path.resolve(__dirname, out);
    // Clip to exactly the target viewport — 414×896 logical = 1242×2688 physical
    await page.screenshot({
      path: outPath,
      clip: { x: 0, y: 0, width: W, height: H },
    });

    console.log(`✅  ${out}  (${W * DPR} × ${H * DPR} px)`);
    await page.close();
  }

  await browser.close();
})();
