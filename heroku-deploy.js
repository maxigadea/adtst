// heroku-deploy.js
// Versión optimizada para deploy en múltiples instancias de Heroku

import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
app.use(cors());

// Array de 10 smart links adultos para rotación
const SMART_LINKS = [
  "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf29",
  "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf30",
  "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf31",
  "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf32",
  "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf33",
  "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf34",
  "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf35",
  "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf36",
  "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf37",
  "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf38"
];
const INSTANCE_ID = process.env.INSTANCE_ID || `heroku-${Date.now()}`;
const MAX_CLICKS_PER_HOUR = 400; // 40 clicks/hora × 10 links = 400 total
const MAX_CLICKS_PER_DAY = 9600; // 400 × 24 = 9,600 total

let clicksThisHour = 0;
let clicksToday = 0;
let hourStart = new Date();
let dayStart = new Date();

// Reset contadores
setInterval(() => {
  const now = new Date();
  
  // Reset cada hora
  if (now.getHours() !== hourStart.getHours()) {
    clicksThisHour = 0;
    hourStart = now;
    console.log(`[${INSTANCE_ID}] Contador horario reseteado`);
  }
  
  // Reset cada día
  if (now.getDate() !== dayStart.getDate()) {
    clicksToday = 0;
    dayStart = now;
    console.log(`[${INSTANCE_ID}] Contador diario reseteado`);
  }
}, 60000);

function getCurrentLink() {
  // Rotación aleatoria en lugar de por minuto
  const linkIndex = Math.floor(Math.random() * SMART_LINKS.length);
  return SMART_LINKS[linkIndex];
}

function addNoCacheBust(urlStr) {
  const u = new URL(urlStr);
  u.searchParams.set('_b', String(Date.now()));
  u.searchParams.set('instance', INSTANCE_ID);
  u.searchParams.set('heroku', 'true');
  return u.toString();
}

app.get('/click204', async (_req, res) => {
  // Verificar límites
  if (clicksThisHour >= MAX_CLICKS_PER_HOUR) {
    return res.status(429).json({ 
      error: 'Hourly limit reached', 
      instance: INSTANCE_ID,
      clicksThisHour,
      resetTime: new Date(hourStart.getTime() + 60*60*1000)
    });
  }
  
  if (clicksToday >= MAX_CLICKS_PER_DAY) {
    return res.status(429).json({ 
      error: 'Daily limit reached', 
      instance: INSTANCE_ID,
      clicksToday
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
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    
    // Anti-detección
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    });
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    const currentLink = getCurrentLink();
    const url = addNoCacheBust(currentLink);
    const linkIndex = SMART_LINKS.indexOf(currentLink) + 1;
    console.log(`[${INSTANCE_ID}] Click ${clicksToday + 1}/${MAX_CLICKS_PER_DAY} (${clicksThisHour + 1}/${MAX_CLICKS_PER_HOUR}) - Link ${linkIndex}/10`);
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Delay de 9 segundos (400 clicks/hora total, 40 por link)
    await page.waitForTimeout(9000);

    // Scroll aleatorio
    await page.evaluate(() => {
      window.scrollTo(0, Math.random() * 100);
    });

    const title = await page.title();
    const content = await page.content();
    
    clicksThisHour++;
    clicksToday++;
    
    console.log(`[${INSTANCE_ID}] ✅ Click completado - "${title}" (${content.length} chars)`);

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
    clicksToday,
    maxClicksPerHour: MAX_CLICKS_PER_HOUR,
    maxClicksPerDay: MAX_CLICKS_PER_DAY,
    uptime: process.uptime(),
    target: TARGET_URL,
    platform: 'heroku'
  });
});

app.get('/', (_req, res) => {
  res.json({
    message: 'Click Gateway - Heroku Instance',
    instance: INSTANCE_ID,
    status: 'active',
    endpoints: ['/click204', '/status']
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[${INSTANCE_ID}] Heroku instance iniciada en puerto ${PORT}`);
  console.log(`[${INSTANCE_ID}] Límites: ${MAX_CLICKS_PER_HOUR}/hora, ${MAX_CLICKS_PER_DAY}/día`);
});
