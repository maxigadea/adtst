# Configuración de VPS para Click Gateway Distribuido

## VPS Recomendados (Baratos)

### 1. **DigitalOcean Droplets**
- **Plan**: Basic $4/mes
- **Specs**: 1GB RAM, 1 CPU, 25GB SSD
- **Ubicaciones**: Nueva York, San Francisco, Londres, Amsterdam

### 2. **Linode Nanode**
- **Plan**: Nanode 1GB $5/mes  
- **Specs**: 1GB RAM, 1 CPU, 25GB SSD
- **Ubicaciones**: Múltiples datacenters

### 3. **Vultr**
- **Plan**: Regular Performance $2.50/mes
- **Specs**: 512MB RAM, 1 CPU, 10GB SSD
- **Ubicaciones**: 15+ ubicaciones

### 4. **Hetzner**
- **Plan**: CX11 €3.29/mes
- **Specs**: 4GB RAM, 1 CPU, 20GB SSD
- **Ubicaciones**: Alemania, Finlandia

## Estrategia de Distribución

### Por Ubicación Geográfica
```
- VPS1: Nueva York (Norte América)
- VPS2: Londres (Europa) 
- VPS3: Singapur (Asia)
- VPS4: São Paulo (Sudamérica)
```

### Por Límites de Tráfico
```
- Cada VPS: 50 clicks/hora máximo
- 4 VPS = 200 clicks/hora total
- 24 horas = 4,800 clicks/día
```

## Comandos de Setup Rápido

### En cada VPS:
```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar dependencias
sudo apt-get install -y chromium-browser

# 4. Clonar proyecto
git clone <tu-repo> click-gateway
cd click-gateway

# 5. Configurar variables
export INSTANCE_ID="vps-$(hostname)"
export PORT=3001

# 6. Instalar y ejecutar
npm install
npm start
```

## Monitoreo

### Script de monitoreo simple:
```bash
#!/bin/bash
# check-instances.sh
INSTANCES=("vps1.example.com:3001" "vps2.example.com:3002")

for instance in "${INSTANCES[@]}"; do
    echo "Checking $instance..."
    curl -s "http://$instance/status" | jq '.'
done
```

## Costos Estimados

### Opción Conservadora (4 VPS):
- **Vultr**: $2.50 × 4 = $10/mes
- **Clicks**: 4,800/día = 144,000/mes

### Opción Agresiva (10 VPS):
- **Vultr**: $2.50 × 10 = $25/mes  
- **Clicks**: 12,000/día = 360,000/mes

## Ventajas de Esta Estrategia

1. **✅ IPs diferentes**: Cada VPS tiene IP única
2. **✅ Ubicaciones distintas**: Tráfico distribuido geográficamente  
3. **✅ Límites conservadores**: Evita detección de patrones
4. **✅ Fácil escalamiento**: Agregar/quitar VPS según necesidad
5. **✅ Bajo costo**: $10-25/mes para miles de clicks
6. **✅ Resiliente**: Si un VPS falla, otros siguen funcionando

## Configuración del Load Balancer

Actualiza `load-balancer.js` con las IPs de tus VPS:
```javascript
const INSTANCES = [
  'http://192.168.1.100:3001',  // VPS1
  'http://192.168.1.101:3002',  // VPS2
  'http://192.168.1.102:3003',  // VPS3
  'http://192.168.1.103:3004',  // VPS4
];
```

¡Con esta estrategia tendrás tráfico distribuido, difícil de detectar y muy escalable!
