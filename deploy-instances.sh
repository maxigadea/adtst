#!/bin/bash
# deploy-instances.sh
# Script para deployar automáticamente en múltiples VPS

# Lista de servidores (IPs o dominios)
SERVERS=(
    "user1@vps1.example.com"
    "user2@vps2.example.com" 
    "user3@vps3.example.com"
    "user4@vps4.example.com"
)

# Puerto base
BASE_PORT=3001

echo "🚀 Iniciando deploy en ${#SERVERS[@]} servidores..."

for i in "${!SERVERS[@]}"; do
    SERVER="${SERVERS[$i]}"
    PORT=$((BASE_PORT + i))
    
    echo "📦 Deployando en servidor $((i+1)): $SERVER (puerto $PORT)"
    
    # Crear directorio remoto
    ssh "$SERVER" "mkdir -p ~/click-gateway"
    
    # Copiar archivos
    scp distributed-gateway.js package.json "$SERVER:~/click-gateway/"
    
    # Instalar dependencias y ejecutar
    ssh "$SERVER" << EOF
        cd ~/click-gateway
        export INSTANCE_ID="vps-$((i+1))"
        export PORT=$PORT
        npm install
        nohup node distributed-gateway.js > gateway.log 2>&1 &
        echo "Gateway iniciado en puerto $PORT con PID \$!"
EOF
    
    echo "✅ Servidor $((i+1)) configurado"
done

echo "🎉 Deploy completado en todos los servidores"
echo "📊 Para verificar status: curl http://localhost:3000/status"
