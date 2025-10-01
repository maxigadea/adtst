#!/bin/bash
# deploy-heroku-instances.sh
# Script para deployar múltiples instancias en Heroku

echo "🚀 Deployando múltiples instancias en Heroku..."

# Lista de nombres para las apps (deben ser únicos)
APP_NAMES=(
    "click-gateway-1-$(date +%s)"
    "click-gateway-2-$(date +%s)"
    "click-gateway-3-$(date +%s)"
    "click-gateway-4-$(date +%s)"
    "click-gateway-5-$(date +%s)"
)

# URLs de las instancias
INSTANCES=()

echo "📦 Creando apps de Heroku..."

for i in "${!APP_NAMES[@]}"; do
    APP_NAME="${APP_NAMES[$i]}"
    INSTANCE_ID="heroku-instance-$((i+1))"
    
    echo "Creando app: $APP_NAME (Instancia $INSTANCE_ID)"
    
    # Crear app de Heroku
    heroku create "$APP_NAME" --region us
    
    # Configurar variables de entorno
    heroku config:set INSTANCE_ID="$INSTANCE_ID" --app "$APP_NAME"
    
    # Agregar buildpack para Puppeteer
    heroku buildpacks:add --index 1 https://github.com/jontewks/puppeteer-heroku-buildpack.git --app "$APP_NAME"
    heroku buildpacks:add --index 2 heroku/nodejs --app "$APP_NAME"
    
    # Deploy
    git remote add "$APP_NAME" "https://git.heroku.com/$APP_NAME.git"
    git push "$APP_NAME" main
    
    # Agregar a la lista de instancias
    INSTANCES+=("https://$APP_NAME.herokuapp.com")
    
    echo "✅ App $APP_NAME desplegada"
    sleep 5
done

echo ""
echo "🎉 Todas las instancias desplegadas:"
for instance in "${INSTANCES[@]}"; do
    echo "  - $instance"
done

echo ""
echo "📊 Para verificar status:"
for instance in "${INSTANCES[@]}"; do
    echo "  curl $instance/status"
done

echo ""
echo "🔧 Para configurar load balancer, actualiza load-balancer.js con:"
echo "const INSTANCES = ["
for instance in "${INSTANCES[@]}"; do
    echo "  '$instance',"
done
echo "];"
