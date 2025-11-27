#!/bin/bash

# 🧪 Script de test pour GET /api/files - Isolation par utilisateur
# Usage: ./test-user-files.sh <username>
# Exemple: ./test-user-files.sh testuser1

set -e  # Exit on error

# Vérifier qu'un nom d'utilisateur est fourni
if [ -z "$1" ]; then
    echo "❌ Erreur: Nom d'utilisateur requis"
    echo "Usage: $0 <username>"
    echo "Exemple: $0 testuser1"
    exit 1
fi

USERNAME="$1"
USER_EMAIL="${USERNAME}@example.com"
USER_PASSWORD="password123"
API_URL="${API_URL:-http://localhost:3000}"

echo "=========================================="
echo "🧪 Test utilisateur: $USERNAME"
echo "=========================================="
echo ""

# 1. Enregistrer le nouvel utilisateur
echo "📝 1. Enregistrement de l'utilisateur: $USER_EMAIL"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"login\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

if echo "$REGISTER_RESPONSE" | grep -q "error"; then
    echo "⚠️  Utilisateur déjà existant ou erreur:"
    echo "$REGISTER_RESPONSE" | jq -r '.error // .message // .'
    echo ""
    echo "🔄 Tentative de connexion avec l'utilisateur existant..."
else
    echo "✅ Utilisateur créé avec succès"
fi
echo ""

# 2. Connexion et export du JWT_TOKEN
echo "🔐 2. Connexion de l'utilisateur: $USER_EMAIL"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"login\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$JWT_TOKEN" = "null" ] || [ -z "$JWT_TOKEN" ]; then
    echo "❌ Échec de la connexion:"
    echo "$LOGIN_RESPONSE" | jq .
    exit 1
fi

export JWT_TOKEN
echo "✅ Token JWT obtenu"
echo "JWT_TOKEN=$JWT_TOKEN"
echo ""

# 3. Générer 3 fichiers de test
echo "📄 3. Génération des fichiers de test dans /tmp"

TXT_FILE="/tmp/${USERNAME}_document.txt"
MD_FILE="/tmp/${USERNAME}_readme.md"
ZIP_FILE="/tmp/${USERNAME}_archive.zip"

# Générer fichier TXT
cat > "$TXT_FILE" << EOF
Test document for user: $USERNAME
Created at: $(date)
This is a test file to validate file upload functionality.
EOF
echo "   ✅ Créé: $TXT_FILE ($(wc -c < "$TXT_FILE") bytes)"

# Générer fichier MD
cat > "$MD_FILE" << EOF
# README - $USERNAME

## Description
Test markdown file for user **$USERNAME**.

## Date
$(date)

## Content
- Item 1
- Item 2
- Item 3
EOF
echo "   ✅ Créé: $MD_FILE ($(wc -c < "$MD_FILE") bytes)"

# Générer fichier ZIP (contenant les deux fichiers précédents)
(cd /tmp && zip -q "$ZIP_FILE" "$(basename "$TXT_FILE")" "$(basename "$MD_FILE")")
echo "   ✅ Créé: $ZIP_FILE ($(wc -c < "$ZIP_FILE") bytes)"
echo ""

# 4. Uploader les 3 fichiers
echo "⬆️  4. Upload des fichiers vers l'API"

echo "   📤 Upload: $TXT_FILE"
UPLOAD1=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@$TXT_FILE" \
  -F "expirationDays=7")

FILE1_ID=$(echo "$UPLOAD1" | jq -r '.id')
FILE1_TOKEN=$(echo "$UPLOAD1" | jq -r '.downloadToken')
echo "      ✅ ID: $FILE1_ID | Token: ${FILE1_TOKEN:0:20}..."

echo "   📤 Upload: $MD_FILE"
UPLOAD2=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@$MD_FILE;type=text/markdown" \
  -F "expirationDays=5" \
  -F "password=secret123")

FILE2_ID=$(echo "$UPLOAD2" | jq -r '.id')
FILE2_TOKEN=$(echo "$UPLOAD2" | jq -r '.downloadToken')
echo "      ✅ ID: $FILE2_ID | Token: ${FILE2_TOKEN:0:20}... | 🔒 Protected"

echo "   📤 Upload: $ZIP_FILE"
UPLOAD3=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@$ZIP_FILE;type=application/zip" \
  -F "expirationDays=3")

FILE3_ID=$(echo "$UPLOAD3" | jq -r '.id')
FILE3_TOKEN=$(echo "$UPLOAD3" | jq -r '.downloadToken')
echo "      ✅ ID: $FILE3_ID | Token: ${FILE3_TOKEN:0:20}..."
echo ""

# 5. Récupérer la liste des fichiers
echo "📋 5. Récupération de la liste des fichiers"
LIST_RESPONSE=$(curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: application/json")

TOTAL_FILES=$(echo "$LIST_RESPONSE" | jq -r '.totalElements')
echo "   ✅ Total de fichiers: $TOTAL_FILES"
echo ""

echo "📊 Détails des fichiers:"
echo "$LIST_RESPONSE" | jq -r '.files[] | "   • \(.filename) - \(.fileSize) bytes - Expires: \(.expirationDate) - Password: \(.hasPassword)"'
echo ""

echo "=========================================="
echo "✅ Test terminé pour l'utilisateur: $USERNAME"
echo "=========================================="
echo ""
echo "💾 Variables exportées:"
echo "   export JWT_TOKEN=\"$JWT_TOKEN\""
echo ""
echo "📝 Fichiers de test créés:"
echo "   - $TXT_FILE"
echo "   - $MD_FILE"
echo "   - $ZIP_FILE"
echo ""
echo "🔗 Commandes utiles:"
echo "   # Lister les fichiers:"
echo "   curl -s -X GET \"$API_URL/api/files\" -H \"Authorization: Bearer \$JWT_TOKEN\" | jq ."
echo ""
echo "   # Avec pagination:"
echo "   curl -s -X GET \"$API_URL/api/files?page=0&size=10\" -H \"Authorization: Bearer \$JWT_TOKEN\" | jq ."
echo ""
echo "   # Avec tri:"
echo "   curl -s -X GET \"$API_URL/api/files?sort=fileSize,desc\" -H \"Authorization: Bearer \$JWT_TOKEN\" | jq ."
echo ""
