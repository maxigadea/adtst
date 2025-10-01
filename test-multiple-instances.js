// test-multiple-instances.js
// Simula múltiples VPS en tu PC local para probar el concepto

import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
app.use(cors());

const TARGET_URL = "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf29";
const INSTANCE_ID = process.env.INSTANCE_ID || 'local-test';
const PORT = process.env.PORT || 3001;
const MAX_CLICKS = 960; // 40 clicks/hora × 24 horas = 960/día

let clicksCount = 0;

function addNoCacheBust(urlStr) {
  const u = new URL(urlStr);
  u.searchParams.set('_b', String(Date.now()));
  u.searchParams.set('instance', INSTANCE_ID);
  return u.toString();
}

app.get('/click204', async (_req, res) => {
  if (clicksCount >= MAX_CLICKS) {
    return res.status(429).json({ 
      error: 'Test limit reached', 
      instance: INSTANCE_ID,
      clicks: clicksCount 
    });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true, // Headless para velocidad
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await browser.newPage();
    
    // Anti-detección básica
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    const url = addNoCacheBust(TARGET_URL);
    console.log(`[${INSTANCE_ID}] Click ${clicksCount + 1}/${MAX_CLICKS}`);
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    // Delay de 1.5 minutos entre clicks (40 clicks/hora)
    await page.waitForTimeout(90000); // 90 segundos = 1.5 minutos

    const title = await page.title();
    clicksCount++;
    
    console.log(`[${INSTANCE_ID}] ✅ Click ${clicksCount}/${MAX_CLICKS} - "${title}"`);

    await browser.close();
    return res.status(204).end();
    
  } catch (err) {
    console.error(`[${INSTANCE_ID}] Error:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/status', (_req, res) => {
  res.json({
    instance: INSTANCE_ID,
    clicks: clicksCount,
    maxClicks: MAX_CLICKS,
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`[${INSTANCE_ID}] Test instance escuchando en puerto ${PORT}`);
  console.log(`[${INSTANCE_ID}] Límite de prueba: ${MAX_CLICKS} clicks`);
});
