// test-load-balancer.js
// Load balancer de prueba para simular múltiples instancias

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// Simular 3 "VPS" locales
const INSTANCES = [
  'http://localhost:3001',
  'http://localhost:3002', 
  'http://localhost:3003'
];

let currentInstance = 0;
let totalRequests = 0;

function getNextInstance() {
  const instance = INSTANCES[currentInstance];
  currentInstance = (currentInstance + 1) % INSTANCES.length;
  return instance;
}

app.get('/click204', async (req, res) => {
  const instance = getNextInstance();
  totalRequests++;
  
  console.log(`[LOAD-BALANCER] Request ${totalRequests} → ${instance}`);
  
  try {
    const response = await fetch(`${instance}/click204`);
    
    if (response.ok) {
      console.log(`[LOAD-BALANCER] ✅ Request ${totalRequests} exitoso`);
      return res.status(204).end();
    } else {
      const error = await response.json();
      console.log(`[LOAD-BALANCER] ⚠️  Request ${totalRequests} limitado: ${error.error}`);
      return res.status(429).json({ 
        message: 'Instance limit reached', 
        instance: instance.split(':')[2],
        totalRequests 
      });
    }
  } catch (error) {
    console.log(`[LOAD-BALANCER] ❌ Error en ${instance}: ${error.message}`);
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
    loadBalancer: 'test-mode',
    totalRequests,
    instances: statuses,
    currentInstance,
    totalInstances: INSTANCES.length
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`[TEST-LOAD-BALANCER] Escuchando en puerto ${PORT}`);
  console.log(`[TEST-LOAD-BALANCER] Instancias de prueba: ${INSTANCES.join(', ')}`);
  console.log(`[TEST-LOAD-BALANCER] Para probar: curl http://localhost:${PORT}/click204`);
});
