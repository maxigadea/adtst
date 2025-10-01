// load-balancer.js
// Balanceador de carga que distribuye requests entre múltiples instancias
// Simula tráfico desde diferentes "usuarios" y "ubicaciones"

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// Lista de instancias distribuidas (VPS, servidores, etc.)
const INSTANCES = [
  'http://localhost:3001',  // Instancia 1
  'http://localhost:3002',  // Instancia 2  
  'http://localhost:3003',  // Instancia 3
  // Agregar más instancias aquí
];

let currentInstance = 0;

// Rotación round-robin
function getNextInstance() {
  const instance = INSTANCES[currentInstance];
  currentInstance = (currentInstance + 1) % INSTANCES.length;
  return instance;
}

// Headers para simular diferentes usuarios/ubicaciones
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
  
  console.log(`[LOAD-BALANCER] Enviando request a ${instance} con perfil ${userProfile['User-Agent'].substring(0, 50)}...`);
  
  try {
    const response = await fetch(`${instance}/click204`, {
      method: 'GET',
      headers: {
        ...userProfile,
        'X-Instance-Source': 'load-balancer',
        'X-Request-ID': Date.now().toString()
      }
    });
    
    if (response.ok) {
      console.log(`[LOAD-BALANCER] ✅ Request exitoso a ${instance}`);
      return res.status(204).end();
    } else {
      console.log(`[LOAD-BALANCER] ⚠️  Error en ${instance}: ${response.status}`);
      return res.status(response.status).end();
    }
  } catch (error) {
    console.log(`[LOAD-BALANCER] ❌ Error conectando a ${instance}: ${error.message}`);
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
    loadBalancer: 'active',
    instances: statuses,
    currentInstance,
    totalInstances: INSTANCES.length
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[LOAD-BALANCER] Escuchando en puerto ${PORT}`);
  console.log(`[LOAD-BALANCER] Instancias configuradas: ${INSTANCES.join(', ')}`);
});
