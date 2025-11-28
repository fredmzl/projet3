#!/bin/bash

# ========================================
# Script de Préparation Tests K6
# ========================================
# Le provisionning des données a été préalablement effectué 
# avec :
#  - mise infra:deploy
#  - mise infra:bootstrap
# Récupère un token de téléchargement valide
# pour les tests de charge

set -e

# Configuration
BACKEND_URL="${BACKEND_URL:-https://www.datashare.projet3.oc}"
TEST_USER_EMAIL="alice@example.com"
TEST_USER_PASSWORD="password"
CURL_ARGS="-ks"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ========================================
# 1. Récupérer un token JWT
# ========================================
echo -e "\n${YELLOW}[1/4] Authentification utilisateur...${NC}"

LOGIN_RESPONSE=$(curl $CURL_ARGS -X POST "${BACKEND_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"login\": \"${TEST_USER_EMAIL}\",
    \"password\": \"${TEST_USER_PASSWORD}\"
  }")

JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$JWT_TOKEN" == "null" ] || [ -z "$JWT_TOKEN" ]; then
  echo -e "${RED}❌ Erreur authentification${NC}"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ JWT Token obtenu${NC}"

# ========================================
# 2. Récupérer la liste de token de téléchargement de l'utilisateur Alice
# ========================================

echo -e "\n${YELLOW}[2/4] Récupération des tokens de téléchargement...${NC}"
FILES_RESPONSE=$(curl $CURL_ARGS -X GET "${BACKEND_URL}/api/files" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

echo -e "\nExtraction token valide de téléchargement..."
VALID_DOWNLOAD_TOKEN=$(echo "$FILES_RESPONSE" | jq -r '.files[] | select(.filename == "report.txt") | .downloadToken')

echo -e "\n Extraction File ID..."
FILE_ID=$(echo "$FILES_RESPONSE" | jq -r '.files[] | select(.filename == "report.txt") | .id')
if [ "$VALID_DOWNLOAD_TOKEN" == "null" ] || [ -z "$VALID_DOWNLOAD_TOKEN" ]; then
  echo -e "${RED}❌ Erreur récupération token de téléchargement${NC}"
  echo "$FILES_RESPONSE" | jq '.'
  exit 1
fi
echo -e "${GREEN}✅ Token de téléchargement obtenu${NC}"
echo "File ID: ${FILE_ID}"
echo "Download Token: ${VALID_DOWNLOAD_TOKEN}"

echo -e "\nExtraction token expiré de téléchargement..."
EXPIRED_DOWNLOAD_TOKEN=$(echo "$FILES_RESPONSE" | jq -r '.files[] | select(.filename == "presentation.txt") | .downloadToken')

echo -e "\nExtraction File ID..."
EXPIRED_FILE_ID=$(echo "$FILES_RESPONSE" | jq -r '.files[] | select(.filename == "presentation.txt") | .id')
if [ "$EXPIRED_DOWNLOAD_TOKEN" == "null" ] || [ -z "$EXPIRED_DOWNLOAD_TOKEN" ]; then
  echo -e "${RED}❌ Erreur récupération token de téléchargement${NC}"
  echo "$FILES_RESPONSE" | jq '.'
  exit 1
fi
echo -e "${GREEN}✅ Token de téléchargement expiré obtenu${NC}"
echo "File ID: ${EXPIRED_FILE_ID}"
echo "Expired Token: ${EXPIRED_DOWNLOAD_TOKEN}"

echo -e "\n$ Forge token de téléchargement invalide..."
INVALID_DOWNLOAD_TOKEN="0cba697a-9496-42ff-bb0b-3c923ccaa20a"
echo "Invalid Download Token: ${INVALID_DOWNLOAD_TOKEN}"
echo -e "${GREEN}✅ Token de téléchargement invalide forgé${NC}"

# ========================================
# 3. Générer fichier .env pour K6
# ========================================
echo -e "\n${YELLOW}[3/4]Génération fichier .env...${NC}"

cat > ${MISE_CONFIG_ROOT}/k6/.env <<EOF
# K6 Load Test Configuration
# Do not edit manually! This file is auto-generated.
# Généré le $(date)

BASE_URL=${BACKEND_URL}
VALID_DOWNLOAD_TOKEN=${VALID_DOWNLOAD_TOKEN}
EXPIRED_DOWNLOAD_TOKEN=${EXPIRED_DOWNLOAD_TOKEN}
INVALID_DOWNLOAD_TOKEN=${INVALID_DOWNLOAD_TOKEN}
FILE_ID=${FILE_ID}
JWT_TOKEN=${JWT_TOKEN}
TEST_USER_EMAIL=${TEST_USER_EMAIL}
EOF

echo -e "${GREEN}✅ Fichier k6/.env créé${NC}"

# ========================================
# 6. Test de téléchargement
# ========================================
echo -e "\n${YELLOW}[4/4]Test téléchargement...${NC}"

HTTP_STATUS=$(curl $CURL_ARGS -o /dev/null -w "%{http_code}" \
  "${BACKEND_URL}/api/download/${VALID_DOWNLOAD_TOKEN}")

if [ "$HTTP_STATUS" == "200" ]; then
  echo -e "${GREEN}✅ Test téléchargement réussi (HTTP ${HTTP_STATUS})${NC}"
else
  echo -e "${RED}❌ Test téléchargement échoué (HTTP ${HTTP_STATUS})${NC}"
  exit 1
fi

# ========================================
# Résumé
# ========================================
# echo -e "\n${GREEN}=== Configuration Terminée ===${NC}"
# echo -e "Utilisateur : ${TEST_USER_EMAIL}"
# echo -e "File ID     : ${FILE_ID}"
# echo -e "Token       : ${VALID_DOWNLOAD_TOKEN}"
# echo -e "\n${YELLOW}Commande pour lancer le test K6 :${NC}"
# echo -e "  cd k6"
# echo -e "  docker-compose -f docker-compose-k6-stack.yml up"
# echo -e "\n${YELLOW}Accès Grafana :${NC}"
# echo -e "  URL      : http://localhost:3001"
# echo -e "  User     : admin"
# echo -e "  Password : admin123"
