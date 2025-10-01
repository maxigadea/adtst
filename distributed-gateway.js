// distributed-gateway.js
// Gateway distribuido: cada instancia maneja un pequeño número de clicks
// para evitar detección de tráfico concentrado

import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
app.use(cors());

// Configuración por instancia
const TARGET_URL = "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf29";
const MAX_CLICKS_PER_HOUR = 50; // Límite conservador por instancia
const INSTANCE_ID = process.env.INSTANCE_ID || `instance-${Date.now()}`;
const LISTEN_PORT = +(process.env.PORT || 3000);

// Tracking de clicks por hora
let clicksThisHour = 0;
let hourStart = new Date();

// Reset contador cada hora
setInterval(() => {
  const now = new Date();
  if (now.getHours() !== hourStart.getHours()) {
    clicksThisHour = 0;
    hourStart = now;
    console.log(`[${INSTANCE_ID}] Contador de clicks reseteado para nueva hora`);
  }
}, 60000); // Check cada minuto

function addNoCacheBust(urlStr) {
  const u = new URL(urlStr);
  u.searchParams.set('_b', String(Date.now()));
  u.searchParams.set('instance', INSTANCE_ID);
  return u.toString();
}

app.get('/click204', async (_req, res) => {
  // Verificar límite de clicks por hora
  if (clicksThisHour >= MAX_CLICKS_PER_HOUR) {
    console.log(`[${INSTANCE_ID}] Límite de clicks alcanzado (${MAX_CLICKS_PER_HOUR}/hora)`);
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      instance: INSTANCE_ID,
      clicksThisHour 
    });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await browser.newPage();
    
    // Anti-detección
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    const url = addNoCacheBust(TARGET_URL);
    console.log(`[${INSTANCE_ID}] Click ${clicksThisHour + 1}/${MAX_CLICKS_PER_HOUR} - ${url}`);
    
    // Navegar con delays aleatorios
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Comportamiento humano
    await page.waitForTimeout(Math.random() * 3000 + 2000);
    await page.evaluate(() => {
      window.scrollTo(0, Math.random() * 100);
    });
    await page.waitForTimeout(1000);

    const title = await page.title();
    const content = await page.content();
    
    clicksThisHour++;
    console.log(`[${INSTANCE_ID}] ✅ Click ${clicksThisHour}/${MAX_CLICKS_PER_HOUR} - Status: 200 - "${title}" (${content.length} chars)`);

    await browser.close();
    return res.status(204).end();
    
  } catch (err) {
    console.error(`[${INSTANCE_ID}] Error:`, err.message);
    return res.status(500).json({ error: err.message, instance: INSTANCE_ID });
  }
});

app.get('/status', (_req, res) => {
  res.json({
    instance: INSTANCE_ID,
    clicksThisHour,
    maxClicksPerHour: MAX_CLICKS_PER_HOUR,
    uptime: process.uptime(),
    target: TARGET_URL
  });
});

app.listen(LISTEN_PORT, () => {
  console.log(`[${INSTANCE_ID}] Gateway distribuido escuchando en puerto ${LISTEN_PORT}`);
  console.log(`[${INSTANCE_ID}] Límite: ${MAX_CLICKS_PER_HOUR} clicks/hora`);
  console.log(`[${INSTANCE_ID}] Target: ${TARGET_URL}`);
});
