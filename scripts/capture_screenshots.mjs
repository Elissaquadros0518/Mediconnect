import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const puppeteer = require(path.resolve('frontend/node_modules/puppeteer-core'));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const screens = [
  {
    name: '01_doctor_dashboard',
    title: 'Doctor Dashboard',
    url: 'http://localhost:5173/doctor/dashboard?demo=doctor'
  },
  {
    name: '02_doctor_manage_slots',
    title: 'Doctor Availability Management (Manage Slots)',
    url: 'http://localhost:5173/doctor/manage-slots?demo=doctor'
  },
  {
    name: '03_patient_profile',
    title: 'Patient Profile Management',
    url: 'http://localhost:5173/patient/profile?demo=patient'
  },
  {
    name: '04_admin_dashboard',
    title: 'Admin Dashboard & Operations Center',
    url: 'http://localhost:5173/admin/dashboard?demo=admin'
  },
  {
    name: '05_admin_inventory',
    title: 'Admin Hospital Inventory & Stock Management',
    url: 'http://localhost:5173/admin/inventory?demo=admin'
  }
];

const localDir = path.resolve('screenshots');
const artifactDir = 'C:\\Users\\Dylan Noronha\\.gemini\\antigravity\\brain\\4bea3482-437e-41fb-802b-74cfe1d49d9e';

if (!fs.existsSync(localDir)) {
  fs.mkdirSync(localDir, { recursive: true });
}

async function captureAll() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1440,960'
    ],
    defaultViewport: {
      width: 1440,
      height: 960,
      deviceScaleFactor: 1.5
    }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log(`[Browser ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log('[Browser Error]:', err.message));

  for (const screen of screens) {
    console.log(`\n--- Capturing: ${screen.title} ---`);
    try {
      await page.goto(screen.url, { waitUntil: 'networkidle0', timeout: 15000 });
      console.log('Navigated URL:', page.url());
      // Brief pause for animations and chart renders
      await new Promise(r => setTimeout(r, 1500));

      const localFile = path.join(localDir, `${screen.name}.png`);
      const artifactFile = path.join(artifactDir, `${screen.name}.png`);

      await page.screenshot({ path: localFile, fullPage: false });
      fs.copyFileSync(localFile, artifactFile);
      console.log(`Saved screenshot: ${localFile}`);
    } catch (err) {
      console.error(`Failed to capture ${screen.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('All 5 screenshots captured successfully!');
}

captureAll().catch(err => {
  console.error('Screenshot script error:', err);
  process.exit(1);
});
