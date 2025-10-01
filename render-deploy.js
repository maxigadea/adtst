// render-deploy.js
// Versión optimizada para Render (mejor compatibilidad con Puppeteer)

import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
app.use(cors());

// Array de 20 smart links adultos para rotación
const SMART_LINKS = [
  "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf29",
  "https://www.revenuecpmgate.com/t4r3fthh?key=c9f6f8d345e33e904b87242120059577",
  "https://www.revenuecpmgate.com/wixs7n8w?key=70b031a100a5bbf65b4904afcef22268",
  "https://www.revenuecpmgate.com/usk19ar7w?key=ee0c8ad746b0c15b9a59dfe3915b762f",
  "https://www.revenuecpmgate.com/ri1fgug17?key=3c7c7e4cb4d776b32c271a5d3103a851",
  "https://www.revenuecpmgate.com/kqvaw310q?key=7a9d24a7b45731137bedadc49217195e",
  "https://www.revenuecpmgate.com/s15pz04y7?key=b8f480ba1b511e45b0a35f8b61f9bc57",
  "https://www.revenuecpmgate.com/qe8hgybe?key=7e66998252f25aaded17283088319052",
  "https://www.revenuecpmgate.com/ui00nfiy4?key=64b7e83ab8cdf070f5604225338b779d",
  "https://www.revenuecpmgate.com/kqc1bjd5?key=08262a98c777ca3e28945ce704b2fd15",
  "https://www.revenuecpmgate.com/p7axme5cxc?key=e0b3c923312c98ceceefd3ff70e15139",
  "https://www.revenuecpmgate.com/amrwg0kmev?key=bf77af80b17c01ce63531be731a274ce",
  "https://www.revenuecpmgate.com/afcwyaa2s?key=3574c1e8fd6c0d6da71965a24630a2bd",
  "https://www.revenuecpmgate.com/ycs9vw7fp?key=8d4bc021840e163e60781283654c544a",
  "https://www.revenuecpmgate.com/hr8gyu964?key=ef150f1068d9cec666eb04bfeaac8e65",
  "https://www.revenuecpmgate.com/nubzywa0j?key=acd3221a5a5ad7311e45cc8fa3953cf2",
  "https://www.revenuecpmgate.com/w214cam0ii?key=023b9bcc11bb92a61049e94faf5f1fb9",
  "https://www.revenuecpmgate.com/y93t60gex?key=70fa98fd45a475827a7720ddb07a9bad",
  "https://www.revenuecpmgate.com/d58xb3fix?key=47ed04c7a412758f29680627f9dafe25",
  "https://www.revenuecpmgate.com/ayft0a9jqn?key=10ead0573b4509c692e6faf5bcb5fdf9"
];

const INSTANCE_ID = process.env.INSTANCE_ID || `render-${Date.now()}`;
const MAX_CLICKS_PER_HOUR = 600; // 30 clicks/hora × 20 links = 600 total
const MAX_CLICKS_PER_DAY = 14400; // 600 × 24 = 14,400 total

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
  // Rotación aleatoria
  const linkIndex = Math.floor(Math.random() * SMART_LINKS.length);
  return SMART_LINKS[linkIndex];
}

function addNoCacheBust(urlStr) {
  const u = new URL(urlStr);
  u.searchParams.set('_b', String(Date.now()));
  u.searchParams.set('instance', INSTANCE_ID);
  u.searchParams.set('platform', 'render');
  return u.toString();
}

app.get('/click204', async (_req, res) => {
  // Verificar límites
  if (clicksThisHour >= MAX_CLICKS_PER_HOUR) {
    return res.status(429).json({ 
      error: 'Hourly limit reached', 
      instance: INSTANCE_ID,
      clicksThisHour,
      platform: 'render',
      resetTime: new Date(hourStart.getTime() + 60*60*1000)
    });
  }
  
  if (clicksToday >= MAX_CLICKS_PER_DAY) {
    return res.status(429).json({ 
      error: 'Daily limit reached', 
      instance: INSTANCE_ID,
      clicksToday,
      platform: 'render'
    });
  }

  try {
    const currentLink = getCurrentLink();
    const url = addNoCacheBust(currentLink);
    const linkIndex = SMART_LINKS.indexOf(currentLink) + 1;
    
    console.log(`[${INSTANCE_ID}] Click ${clicksToday + 1}/${MAX_CLICKS_PER_DAY} (${clicksThisHour + 1}/${MAX_CLICKS_PER_HOUR}) - Link ${linkIndex}/20 - Render`);

    // Configuración optimizada para Render (como tu Dockerfile)
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--single-process',
        '--no-zygote'
      ],
      executablePath: '/usr/bin/chromium-browser', // Render tiene Chromium preinstalado
      timeout: 60000
    });

    const page = await browser.newPage();
    
    // Anti-detección
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // Headers realistas
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navegar a la URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Scroll aleatorio para simular comportamiento humano
    await page.evaluate(() => {
      window.scrollTo(0, Math.random() * 500);
    });

    // Esperar un poco más para que cargue completamente
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));

    await browser.close();

    clicksThisHour++;
    clicksToday++;
    
    console.log(`[${INSTANCE_ID}] ✅ Click completado - Render`);

    return res.status(204).end();
    
  } catch (err) {
    console.error(`[${INSTANCE_ID}] Error:`, err.message);
    return res.status(500).json({ error: err.message, instance: INSTANCE_ID, platform: 'render' });
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
    platform: 'render',
    smartLinks: SMART_LINKS.length,
    method: 'puppeteer'
  });
});

app.get('/', (_req, res) => {
  res.json({
    message: 'Click Gateway - Render Instance (Puppeteer)',
    instance: INSTANCE_ID,
    platform: 'render',
    status: 'active',
    method: 'puppeteer',
    endpoints: ['/click204', '/status'],
    smartLinks: SMART_LINKS.length
  });
});

// Para Render, exportamos la app
export default app;

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[${INSTANCE_ID}] Render instance iniciada en puerto ${PORT}`);
    console.log(`[${INSTANCE_ID}] Límites: ${MAX_CLICKS_PER_HOUR}/hora, ${MAX_CLICKS_PER_DAY}/día`);
    console.log(`[${INSTANCE_ID}] Método: Puppeteer con Chromium`);
  });
}
