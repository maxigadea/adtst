// heroku-load-balancer.js
// Load balancer para instancias de Heroku

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// URLs de las instancias de Heroku (actualizar después del deploy)
const INSTANCES = [
  'https://click-gateway-1-XXXXXX.herokuapp.com',
  'https://click-gateway-2-XXXXXX.herokuapp.com', 
  'https://click-gateway-3-XXXXXX.herokuapp.com',
  'https://click-gateway-4-XXXXXX.herokuapp.com',
  'https://click-gateway-5-XXXXXX.herokuapp.com'
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
  
  console.log(`[HEROKU-LB] Request ${totalRequests} → ${instance}`);
  
  try {
    const response = await fetch(`${instance}/click204`, {
      method: 'GET',
      headers: {
        ...userProfile,
        'X-Instance-Source': 'heroku-load-balancer',
        'X-Request-ID': Date.now().toString()
      }
    });
    
    if (response.ok) {
      console.log(`[HEROKU-LB] ✅ Request ${totalRequests} exitoso`);
      return res.status(204).end();
    } else {
      const error = await response.json();
      console.log(`[HEROKU-LB] ⚠️  Request ${totalRequests} limitado: ${error.error}`);
      return res.status(429).json({ 
        message: 'Instance limit reached', 
        instance: instance.split('.')[0],
        totalRequests 
      });
    }
  } catch (error) {
    console.log(`[HEROKU-LB] ❌ Error en ${instance}: ${error.message}`);
    return res.status(503).json({ error: 'Service unavailable', instance });
  }
});

app.get('/status', async (req, res) => {
  const statuses = [];
  
  for (const instance of INSTANCES) {
    try {
      const response = await fetch(`${instance}/status`);
      const data = await response.json();
      statuses.push({ instance, status: 'online', data });
    } catch (error) {
      statuses.push({ instance, status: 'offline', error: error.message });
    }
  }
  
  res.json({
    loadBalancer: 'heroku-distributed',
    totalRequests,
    instances: statuses,
    currentInstance,
    totalInstances: INSTANCES.length,
    estimatedClicksPerDay: INSTANCES.length * 960,
    estimatedRevenuePerDay: (INSTANCES.length * 960 * 0.000353).toFixed(2)
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[HEROKU-LB] Load balancer iniciado en puerto ${PORT}`);
  console.log(`[HEROKU-LB] Instancias Heroku: ${INSTANCES.length}`);
  console.log(`[HEROKU-LB] Clicks estimados/día: ${INSTANCES.length * 960}`);
  console.log(`[HEROKU-LB] Revenue estimado/día: $${(INSTANCES.length * 960 * 0.000353).toFixed(2)}`);
});
