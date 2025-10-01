// proxy-gateway.js
// Gateway simple: reenvía cada "click" hacia tu URL de anuncio usando Bright Data
// Node 18+
//   npm i express axios https-proxy-agent http-proxy-agent cors dotenv

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // ⚠️ opcional, solo si TLS falla

import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import puppeteer from 'puppeteer';

import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());

// -------- URL FIJA DE TU ANUNCIO --------
const TARGET_URL = "https://www.revenuecpmgate.com/p31m73dm?key=c2c7ca67de4373b7ae811c227efccf29";
// ----------------------------------------

// ---- Config del proxy (desde .env) ----
const PROXY_HOST = process.env.PROXY_HOST || 'brd.superproxy.io';
const PROXY_PORT = +(process.env.PROXY_PORT || 33335);
const PROXY_USER = process.env.PROXY_USER || 'brd-customer-hl_630c26a8-zone-scraping_browser2-country-us';
const PROXY_PASS = process.env.PROXY_PASS || '5b69xfrs9yfr';
const LISTEN_PORT = +(process.env.PORT || 3000);

if (!PROXY_USER || !PROXY_PASS) {
  console.warn('[WARN] PROXY_USER/PROXY_PASS no definidos. Edita tu .env');
}

// proxy string completo USER:PASS@HOST:PORT
const PROXY_URL = `http://${encodeURIComponent(PROXY_USER)}:${encodeURIComponent(PROXY_PASS)}@${PROXY_HOST}:${PROXY_PORT}`;

// helper → crea agent correcto según protocolo de destino
function makeAgent() {
  const u = new URL(TARGET_URL);
  
  return (u.protocol === 'https:')
    ? new HttpsProxyAgent(PROXY_URL)
    : new HttpProxyAgent(PROXY_URL);
}

function addNoCacheBust(urlStr) {
  const u = new URL(urlStr);
  u.searchParams.set('_b', String(Date.now()));
  return u.toString();
}

// --- ENDPOINT PRINCIPAL ---
app.get('/click204', async (_req, res) => {
  const agent = makeAgent();
  const url = addNoCacheBust(TARGET_URL);

  try {
    // Headers realistas para evitar detección de bot
    const browserHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"'
    };

    // Usar Puppeteer sin proxy (funciona y cuenta clicks)
    try {
      const browser = await puppeteer.launch({
        headless: true, // headless para mayor velocidad (funciona y cuenta clicks)
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      const page = await browser.newPage();
      
      // Ocultar que es automatizado
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Eliminar traces de automation
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
      });
      
      // Configurar headers del navegador
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Configurar viewport y headers adicionales
      await page.setViewport({ width: 1366, height: 768 });
      
      // Autenticación del proxy ANTES de navegar (comentado temporalmente)
      // if (PROXY_USER && PROXY_PASS) {
      //   await page.authenticate({
      //     username: PROXY_USER,
      //     password: PROXY_PASS
      //   });
      // }

      console.log(`[BROWSER] Abriendo ${url} - Sin proxy (funciona y cuenta clicks)`);
      
      // Navegar a la página y esperar a que cargue
      const response = await page.goto(url, {
        waitUntil: 'networkidle2', // esperar a que no haya requests activos por 500ms
        timeout: 30000
      });

      // Simular comportamiento humano
      await page.waitForTimeout(Math.random() * 3000 + 2000); // 2-5 segundos
      
      // Hacer scroll ligeramente para simular interacción
      await page.evaluate(() => {
        window.scrollTo(0, Math.random() * 100);
      });
      
      await page.waitForTimeout(1000);

      const title = await page.title();
      const content = await page.content();
      
      console.log(`[BROWSER] Status: ${response.status()} - Página cargada: "${title}" (${content.length} chars)`);

      await browser.close();
      
    } catch (browserErr) {
      console.log(`[BROWSER] Error: ${browserErr.message}`);
      
      // Fallback a axios si puppeteer falla
      console.log('[FALLBACK] Intentando con axios...');
      try {
        // Delay adicional para simular comportamiento humano
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        
        const getResp = await axios.get(url, {
          httpAgent: new HttpProxyAgent(PROXY_URL),
          httpsAgent: new HttpsProxyAgent(PROXY_URL),
          timeout: 30000,
          maxRedirects: 5,
          headers: {
            ...browserHeaders,
            'Referer': 'https://www.google.com/',
            'Origin': 'https://www.google.com'
          }
        });
        console.log(`[AXIOS] Status: ${getResp.status} - Contenido cargado (${getResp.data?.length || 0} bytes)`);
        
        // Verificar si el contenido indica detección de proxy
        if (getResp.data && getResp.data.includes('anonymous proxy')) {
          console.log('[WARNING] Proxy detectado como anónimo por el sitio');
        }
      } catch (axiosErr) {
        console.log(`[AXIOS] Error: ${axiosErr.response?.status || axiosErr.message}`);
      }
    }

    return res.status(204).end();
  } catch (err) {
    console.error('[click204] error', err.message || err);
    return res.status(204).end();
  }
});

app.get('/health', (_req, res) => res.json({
  ok: true,
  target: TARGET_URL,
  proxy: PROXY_URL
}));

app.listen(LISTEN_PORT, () => {
  console.log(`[gateway] escuchando en http://localhost:${LISTEN_PORT}`);
  console.log(`[gateway] target fijo: ${TARGET_URL}`);
  console.log(`[gateway] usando proxy ${PROXY_URL}`);
});
