// api/index.js
// Función serverless limpia para Vercel

import express from 'express';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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

const INSTANCE_ID = process.env.INSTANCE_ID || `vercel-${Date.now()}`;
const MAX_CLICKS_PER_HOUR = 600; // 30 clicks/hora × 20 links = 600 total
const MAX_CLICKS_PER_DAY = 14400; // 600 × 24 = 14,400 total

let clicksThisHour = 0;
let clicksToday = 0;
let hourStart = new Date();
let dayStart = new Date();

function getCurrentLink() {
  const linkIndex = Math.floor(Math.random() * SMART_LINKS.length);
  return SMART_LINKS[linkIndex];
}

function addNoCacheBust(urlStr) {
  const u = new URL(urlStr);
  u.searchParams.set('_b', String(Date.now()));
  u.searchParams.set('instance', INSTANCE_ID);
  u.searchParams.set('platform', 'vercel');
  return u.toString();
}

export default async function handler(req, res) {
  try {
    const { method, url: requestUrl, query } = req;
    
    if (method === 'GET') {
      // Obtener el path del query parameter o de la URL
      const path = query.path || new URL(requestUrl, 'http://localhost').pathname;
      
      // Endpoint de status
      if (path === '/status') {
        return res.json({
          instance: INSTANCE_ID,
          clicksThisHour,
          clicksToday,
          maxClicksPerHour: MAX_CLICKS_PER_HOUR,
          maxClicksPerDay: MAX_CLICKS_PER_DAY,
          uptime: process.uptime(),
          platform: 'vercel',
          smartLinks: SMART_LINKS.length,
          method: 'puppeteer'
        });
      }
      
      // Endpoint de click
      if (path === '/click204') {
        // Verificar límites
        if (clicksThisHour >= MAX_CLICKS_PER_HOUR) {
          return res.status(429).json({ 
            error: 'Hourly limit reached', 
            instance: INSTANCE_ID,
            clicksThisHour,
            platform: 'vercel',
            resetTime: new Date(hourStart.getTime() + 60*60*1000)
          });
        }
        
        if (clicksToday >= MAX_CLICKS_PER_DAY) {
          return res.status(429).json({ 
            error: 'Daily limit reached', 
            instance: INSTANCE_ID,
            clicksToday,
            platform: 'vercel'
          });
        }

        const currentLink = getCurrentLink();
        const url = addNoCacheBust(currentLink);
        const linkIndex = SMART_LINKS.indexOf(currentLink) + 1;
        
        console.log(`[${INSTANCE_ID}] Click ${clicksToday + 1}/${MAX_CLICKS_PER_DAY} (${clicksThisHour + 1}/${MAX_CLICKS_PER_HOUR}) - Link ${linkIndex}/20 - Vercel`);

        // Configuración optimizada para Vercel con @sparticuz/chromium
        const executablePath = await chromium.executablePath();
        
        const browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath,
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        // Anti-detección mejorada
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          });
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });
          Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
          });
          window.chrome = {
            runtime: {},
          };
        });

        // Headers realistas
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Headers adicionales
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        });

        // Navegar a la URL con manejo de redirecciones
        try {
          await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
          });
          
          console.log(`[${INSTANCE_ID}] Página cargada: ${page.url()}`);
          
          // Esperar un poco para que se estabilice
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Scroll aleatorio para simular comportamiento humano
          await page.evaluate(() => {
            window.scrollTo(0, Math.random() * 500);
          });

          // Esperar más tiempo para que se complete la carga
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          console.log(`[${INSTANCE_ID}] Click completado en: ${page.url()}`);
          
          // Screenshot para debug
          try {
            const screenshot = await page.screenshot({ 
              encoding: 'base64',
              fullPage: true 
            });
            console.log(`[${INSTANCE_ID}] Screenshot tomado (${screenshot.length} chars)`);
            
            // Log del screenshot en base64 (para debug)
            console.log(`[${INSTANCE_ID}] Screenshot base64 (primeros 100 chars): ${screenshot.substring(0, 100)}`);
            
            // Verificar si hay contenido de anuncio
            const pageContent = await page.content();
            if (pageContent.includes('advertisement') || pageContent.includes('ad') || pageContent.includes('banner')) {
              console.log(`[${INSTANCE_ID}] ✅ Contenido de anuncio detectado`);
            } else {
              console.log(`[${INSTANCE_ID}] ❌ No se detectó contenido de anuncio`);
            }
            
            // Log del contenido de la página para debug
            console.log(`[${INSTANCE_ID}] URL final: ${page.url()}`);
            console.log(`[${INSTANCE_ID}] Título de la página: ${await page.title()}`);
            
          } catch (screenshotError) {
            console.log(`[${INSTANCE_ID}] Error tomando screenshot: ${screenshotError.message}`);
          }
          
        } catch (navError) {
          console.log(`[${INSTANCE_ID}] Error de navegación: ${navError.message}`);
          // Continuar aunque haya error de navegación
        }

        await browser.close();

        clicksThisHour++;
        clicksToday++;
        
        console.log(`[${INSTANCE_ID}] ✅ Click completado - Vercel`);

        return res.status(204).end();
      }
      
      // Endpoint de screenshot
      if (path === '/screenshot') {
        try {
          const currentLink = getCurrentLink();
          const url = addNoCacheBust(currentLink);
          
          const executablePath = await chromium.executablePath();
          
          const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
          });

          const page = await browser.newPage();
          
          // Anti-detección
          await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
              get: () => undefined,
            });
          });

          await page.setViewport({ width: 1366, height: 768 });
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: true 
          });
          
          await browser.close();
          
          res.setHeader('Content-Type', 'image/png');
          return res.send(Buffer.from(screenshot, 'base64'));
          
        } catch (err) {
          return res.status(500).json({ error: err.message });
        }
      }
      
      // Endpoint raíz
      return res.json({
        message: 'Click Gateway - Vercel Instance (Puppeteer)',
        instance: INSTANCE_ID,
        platform: 'vercel',
        status: 'active',
        method: 'puppeteer',
        endpoints: ['/click204', '/status', '/screenshot'],
        smartLinks: SMART_LINKS.length
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (err) {
    console.error(`[${INSTANCE_ID}] Error:`, err.message);
    return res.status(500).json({ error: err.message, instance: INSTANCE_ID, platform: 'vercel' });
  }
}
