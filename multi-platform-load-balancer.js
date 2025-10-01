// multi-platform-load-balancer.js
// Load balancer para múltiples plataformas (Heroku, Render, Vercel)

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// URLs de todas las instancias distribuidas
const INSTANCES = [
  // Heroku (5 instancias) - AGREGAR URLs DESPUÉS DEL DEPLOY
  'https://click-gateway-1-XXXXXX.herokuapp.com',
  'https://click-gateway-2-XXXXXX.herokuapp.com',
  'https://click-gateway-3-XXXXXX.herokuapp.com',
  'https://click-gateway-4-XXXXXX.herokuapp.com',
  'https://click-gateway-5-XXXXXX.herokuapp.com',
  
  // Render (5 instancias) - AGREGAR URLs DESPUÉS DEL DEPLOY
  'https://click-gateway-1-XXXXXX.onrender.com',
  'https://click-gateway-2-XXXXXX.onrender.com',
  'https://click-gateway-3-XXXXXX.onrender.com',
  'https://click-gateway-4-XXXXXX.onrender.com',
  'https://click-gateway-5-XXXXXX.onrender.com',
  
  // Vercel (5 instancias) - AGREGAR URLs DESPUÉS DEL DEPLOY
  'https://click-gateway-1-XXXXXX.vercel.app',
  'https://click-gateway-2-XXXXXX.vercel.app',
  'https://click-gateway-3-XXXXXX.vercel.app',
  'https://click-gateway-4-XXXXXX.vercel.app',
  'https://click-gateway-5-XXXXXX.vercel.app'
];

let currentInstance = 0;
let totalRequests = 0;

function getNextInstance() {
  const instance = INSTANCES[currentInstance];
  currentInstance = (currentInstance + 1) % INSTANCES.length;
  return instance;
}

// Headers para simular diferentes usuarios
const USER_PROFILES = [
  {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-Forwarded-For': '192.168.1.100'
  },
  {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-GB,en;q=0.9',
    'X-Forwarded-For': '10.0.0.50'
  },
  {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.8',
    'X-Forwarded-For': '172.16.0.25'
  }
];

app.get('/click204', async (req, res) => {
  const instance = getNextInstance();
  const userProfile = USER_PROFILES[Math.floor(Math.random() * USER_PROFILES.length)];
  totalRequests++;
  
  // Detectar plataforma por URL
  let platform = 'unknown';
  if (instance.includes('herokuapp.com')) platform = 'heroku';
  else if (instance.includes('onrender.com')) platform = 'render';
  else if (instance.includes('vercel.app')) platform = 'vercel';
  
  console.log(`[MULTI-PLATFORM-LB] Request ${totalRequests} → ${platform.toUpperCase()} (${instance})`);
  
  try {
    const response = await fetch(`${instance}/click204`, {
      method: 'GET',
      headers: {
        ...userProfile,
        'X-Instance-Source': 'multi-platform-load-balancer',
        'X-Request-ID': Date.now().toString(),
        'X-Platform': platform
      }
    });
    
    if (response.ok) {
      console.log(`[MULTI-PLATFORM-LB] ✅ Request ${totalRequests} exitoso en ${platform.toUpperCase()}`);
      return res.status(204).end();
    } else {
      const error = await response.json();
      console.log(`[MULTI-PLATFORM-LB] ⚠️  Request ${totalRequests} limitado en ${platform.toUpperCase()}: ${error.error}`);
      return res.status(429).json({ 
        message: 'Instance limit reached', 
        platform,
        instance: instance.split('.')[0],
        totalRequests 
      });
    }
  } catch (error) {
    console.log(`[MULTI-PLATFORM-LB] ❌ Error en ${platform.toUpperCase()} (${instance}): ${error.message}`);
    return res.status(503).json({ error: 'Service unavailable', platform, instance });
  }
});

app.get('/status', async (req, res) => {
  const statuses = {
    heroku: [],
    render: [],
    vercel: []
  };
  
  for (const instance of INSTANCES) {
    let platform = 'unknown';
    if (instance.includes('herokuapp.com')) platform = 'heroku';
    else if (instance.includes('onrender.com')) platform = 'render';
    else if (instance.includes('vercel.app')) platform = 'vercel';
    
    try {
      const response = await fetch(`${instance}/status`);
      const data = await response.json();
      statuses[platform].push({ instance, status: 'online', data });
    } catch (error) {
      statuses[platform].push({ instance, status: 'offline', error: error.message });
    }
  }
  
  const totalInstances = INSTANCES.length;
  const estimatedClicksPerDay = totalInstances * 9600; // 400 clicks/hora × 24 = 9600 por instancia
  const estimatedRevenuePerDay = (estimatedClicksPerDay * 0.000353).toFixed(2);
  
  res.json({
    loadBalancer: 'multi-platform-distributed',
    platforms: {
      heroku: statuses.heroku.length,
      render: statuses.render.length,
      vercel: statuses.vercel.length
    },
    totalRequests,
    instances: statuses,
    currentInstance,
    totalInstances,
    estimatedClicksPerDay,
    estimatedRevenuePerDay: `$${estimatedRevenuePerDay}`,
    estimatedRevenuePerMonth: `$${(estimatedRevenuePerDay * 30).toFixed(2)}`
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[MULTI-PLATFORM-LB] Load balancer iniciado en puerto ${PORT}`);
  console.log(`[MULTI-PLATFORM-LB] Plataformas: Heroku (5) + Render (5) + Vercel (5) = 15 instancias`);
  console.log(`[MULTI-PLATFORM-LB] Clicks estimados/día: ${INSTANCES.length * 9600}`);
  console.log(`[MULTI-PLATFORM-LB] Revenue estimado/día: $${(INSTANCES.length * 9600 * 0.000353).toFixed(2)}`);
  console.log(`[MULTI-PLATFORM-LB] Revenue estimado/mes: $${(INSTANCES.length * 9600 * 0.000353 * 30).toFixed(2)}`);
});
