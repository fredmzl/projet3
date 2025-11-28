# 🧪 Tests manuels cURL — Connexion Utilisateur (US03)

## 📋 Prérequis

### Variables d'environnement

```bash
# URL de l'API
export API_URL="http://localhost:3000"

# Créer un utilisateur de test
export TEST_EMAIL="logintest_$(date +%s)@example.com"
export TEST_PASSWORD="SecurePass123!"

curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'"
  }'

echo "Compte créé: $TEST_EMAIL / $TEST_PASSWORD"
```

---

## ✅ Tests Réussis (200 OK)

### Test 1 : Connexion avec identifiants valides (200 OK)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'"
  }'
```

**Réponse attendue** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "logintest_1732531200@example.com",
    "createdAt": "2025-11-25T10:30:00Z"
  }
}
```

**Code HTTP** : `200 OK`

**Règles validées** :
- ✅ Authentification réussie avec email et password corrects
- ✅ JWT généré et retourné
- ✅ Structure du token : header.payload.signature (3 parties séparées par .)
- ✅ Informations utilisateur retournées (sans password)

---

### Test 2 : Connexion avec email en majuscules (200 OK)

**Commande** :
```bash
# Email normalisé en minuscules lors du register
export UPPER_EMAIL=$(echo "$TEST_EMAIL" | tr '[:lower:]' '[:upper:]')

curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$UPPER_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'"
  }'
```

**Réponse attendue** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "logintest_1732531200@example.com"
  }
}
```

**Code HTTP** : `200 OK`

**Règles validées** :
- ✅ Email case-insensitive (normalisation automatique)
- ✅ Connexion réussie quelle que soit la casse

---

### Test 3 : Connexion avec espaces autour de l'email (200 OK)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "  '"$TEST_EMAIL"'  ",
    "password": "'"$TEST_PASSWORD"'"
  }'
```

**Réponse attendue** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "logintest_1732531200@example.com"
  }
}
```

**Code HTTP** : `200 OK`

**Règles validées** :
- ✅ Espaces trimés automatiquement
- ✅ Connexion réussie

---

### Test 4 : Récupération des informations du JWT

**Commande** :
```bash
# Se connecter et extraire le token
export JWT_TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'"
  }' | jq -r '.token')

echo "JWT Token: $JWT_TOKEN"

# Décoder le payload (base64url)
echo "$JWT_TOKEN" | awk -F. '{print $2}' | base64 -d 2>/dev/null | jq .
```

**Payload attendu** :
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "logintest_1732531200@example.com",
  "iat": 1732531200,
  "exp": 1732617600
}
```

**Règles validées** :
- ✅ Payload contient userId et email
- ✅ iat (issued at) défini
- ✅ exp (expiration) = iat + 24h
- ✅ Signature HMAC-SHA256 (partie 3 du token)

---

### Test 5 : Utilisation du JWT pour accéder à une route protégée

**Commande** :
```bash
# Utiliser le token pour lister les fichiers
curl -v -X GET "$API_URL/api/files?page=0&size=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Réponse attendue** :
```json
{
  "files": [],
  "totalElements": 0,
  "totalPages": 0,
  "currentPage": 0,
  "pageSize": 10
}
```

**Code HTTP** : `200 OK`

**Règles validées** :
- ✅ JWT valide accepté par les routes protégées
- ✅ Header Authorization: Bearer {token} reconnu
- ✅ Extraction de l'userId depuis le JWT

---

## ❌ Tests d'Erreur (4xx)

### Test 6 : Mot de passe incorrect (401 Unauthorized)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "WrongPassword456!"
  }'
```

**Réponse attendue** :
```json
{
  "error": "Unauthorized",
  "message": "Email ou mot de passe incorrect",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `401 Unauthorized`

**Règles validées** :
- ✅ Message générique (ne révèle pas si l'email existe)
- ✅ Protection contre l'énumération de comptes

---

### Test 7 : Email inexistant (401 Unauthorized)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "SecurePass123!"
  }'
```

**Réponse attendue** :
```json
{
  "error": "Unauthorized",
  "message": "Email ou mot de passe incorrect",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `401 Unauthorized`

**Règles validées** :
- ✅ Même message que pour mot de passe incorrect
- ✅ Impossible de savoir si le compte existe

---

### Test 8 : Email vide (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "",
    "password": "SecurePass123!"
  }'
```

**Réponse attendue** :
```json
{
  "error": "Bad Request",
  "message": "L'email est obligatoire",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `400 Bad Request`

**Règles validées** :
- ✅ Validation email non vide

---

### Test 9 : Email null (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SecurePass123!"
  }'
```

**Réponse attendue** :
```json
{
  "error": "Bad Request",
  "message": "L'email est obligatoire",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `400 Bad Request`

**Règles validées** :
- ✅ Email obligatoire (champ non omissible)

---

### Test 10 : Mot de passe vide (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": ""
  }'
```

**Réponse attendue** :
```json
{
  "error": "Bad Request",
  "message": "Le mot de passe est obligatoire",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `400 Bad Request`

**Règles validées** :
- ✅ Validation mot de passe non vide

---

### Test 11 : Mot de passe null (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'"
  }'
```

**Réponse attendue** :
```json
{
  "error": "Bad Request",
  "message": "Le mot de passe est obligatoire",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `400 Bad Request`

**Règles validées** :
- ✅ Mot de passe obligatoire (champ non omissible)

---

### Test 12 : Email format invalide (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email-format",
    "password": "SecurePass123!"
  }'
```

**Réponse attendue** :
```json
{
  "error": "Bad Request",
  "message": "L'email doit être au format valide",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `400 Bad Request`

**Règles validées** :
- ✅ Validation format email (regex RFC 5322)

---

### Test 13 : JSON malformé (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
    MALFORMED JSON
  }'
```

**Réponse attendue** :
```json
{
  "error": "Bad Request",
  "message": "JSON invalide",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `400 Bad Request`

**Règles validées** :
- ✅ Validation syntaxe JSON

---

### Test 14 : Content-Type incorrect (415 Unsupported Media Type)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: text/plain" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'"
  }'
```

**Réponse attendue** :
```
HTTP/1.1 415 Unsupported Media Type
```

**Règles validées** :
- ✅ Content-Type application/json requis

---

### Test 15 : Rate limiting après 5 tentatives échouées (429 Too Many Requests)

**Commande** :
```bash
# Effectuer 5 tentatives échouées
for i in {1..5}; do
  echo "Tentative $i/5..."
  curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "'"$TEST_EMAIL"'",
      "password": "WrongPassword'$i'!"
    }' | jq .
  sleep 1
done

# 6ème tentative devrait être bloquée
echo "Tentative 6 (devrait être bloquée)..."
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "WrongPassword6!"
  }'
```

**Réponse attendue (6ème tentative)** :
```json
{
  "error": "Too Many Requests",
  "message": "Trop de tentatives. Réessayez dans 15 minutes",
  "retryAfter": "2025-11-25T10:45:00Z"
}
```

**Code HTTP** : `429 Too Many Requests`

**Règles validées** :
- ✅ Rate limiting : 5 tentatives / 15 minutes par IP
- ✅ Message avec délai de réessai
- ✅ Protection contre brute-force

---

### Test 16 : JWT expiré (401 Unauthorized)

**Note** : Ce test nécessite d'attendre 24h ou de modifier la durée d'expiration du JWT en environnement de test.

**Commande** :
```bash
# Utiliser un token expiré (exemple)
export EXPIRED_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MTYyMzkwMjIsImV4cCI6MTYxNjI0MDAwMH0.abc123"

curl -v -X GET "$API_URL/api/files?page=0&size=10" \
  -H "Authorization: Bearer $EXPIRED_TOKEN"
```

**Réponse attendue** :
```json
{
  "error": "Unauthorized",
  "message": "Token expiré",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `401 Unauthorized`

**Règles validées** :
- ✅ JWT expiré rejeté
- ✅ Nécessité de se reconnecter

---

### Test 17 : JWT invalide (signature incorrecte) (401 Unauthorized)

**Commande** :
```bash
# Token avec signature modifiée
export INVALID_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.INVALID_SIGNATURE"

curl -v -X GET "$API_URL/api/files?page=0&size=10" \
  -H "Authorization: Bearer $INVALID_TOKEN"
```

**Réponse attendue** :
```json
{
  "error": "Unauthorized",
  "message": "Token invalide",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `401 Unauthorized`

**Règles validées** :
- ✅ Signature JWT vérifiée
- ✅ Token modifié rejeté

---

## 🧪 Vérifications supplémentaires

### Vérifier la structure du JWT

**Commande** :
```bash
# Extraire et décoder chaque partie du JWT
echo "=== Header ==="
echo "$JWT_TOKEN" | awk -F. '{print $1}' | base64 -d 2>/dev/null | jq .

echo "=== Payload ==="
echo "$JWT_TOKEN" | awk -F. '{print $2}' | base64 -d 2>/dev/null | jq .

echo "=== Signature (hex) ==="
echo "$JWT_TOKEN" | awk -F. '{print $3}'
```

**Header attendu** :
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload attendu** :
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "logintest_1732531200@example.com",
  "iat": 1732531200,
  "exp": 1732617600
}
```

**Règles validées** :
- ✅ Header contient algorithme HS256
- ✅ Payload contient userId et email
- ✅ Expiration = iat + 86400 secondes (24h)
- ✅ Signature HMAC-SHA256

---

### Vérifier l'expiration du JWT (24 heures)

**Commande** :
```bash
# Extraire iat et exp
export IAT=$(echo "$JWT_TOKEN" | awk -F. '{print $2}' | base64 -d 2>/dev/null | jq -r '.iat')
export EXP=$(echo "$JWT_TOKEN" | awk -F. '{print $2}' | base64 -d 2>/dev/null | jq -r '.exp')

echo "Issued At: $(date -d @$IAT)"
echo "Expires At: $(date -d @$EXP)"

# Calculer la différence (devrait être 86400 secondes = 24h)
export DIFF=$((EXP - IAT))
echo "Durée de validité: $DIFF secondes ($(($DIFF / 3600)) heures)"

if [ $DIFF -eq 86400 ]; then
  echo "✅ Expiration correcte: 24 heures"
else
  echo "❌ Expiration incorrecte: $((DIFF / 3600)) heures au lieu de 24"
fi
```

**Règles validées** :
- ✅ Durée de validité = 24 heures exactement

---

### Vérifier le logging des tentatives échouées

**Note** : Cette vérification nécessite un accès aux logs du backend.

**Commande** :
```bash
# Tenter une connexion échouée
curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "WrongPassword!"
  }'

# Consulter les logs backend
# docker logs datashare-backend-1 | grep "Login failed"
```

**Log attendu** :
```
[WARN] 2025-11-25 10:30:00 - Login failed - Email: logintest_1732531200@example.com, IP: 172.17.0.1, Reason: Invalid password
```

**Règles validées** :
- ✅ Tentatives échouées loggées
- ✅ Informations contextuelles (email, IP, raison)
- ✅ Niveau WARN approprié

**Verdict** : ⚠️ **Non testable directement via cURL** (nécessite accès logs)

---

### Vérifier que le mot de passe n'est jamais retourné

**Commande** :
```bash
# Se connecter
RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'"
  }')

echo "$RESPONSE" | jq .

# Vérifier qu'il n'y a pas de champ "password" ou "passwordHash"
if echo "$RESPONSE" | jq -e '.user.password' > /dev/null 2>&1; then
  echo "❌ SÉCURITÉ : Le mot de passe est retourné dans la réponse!"
elif echo "$RESPONSE" | jq -e '.user.passwordHash' > /dev/null 2>&1; then
  echo "❌ SÉCURITÉ : Le hash du mot de passe est retourné dans la réponse!"
else
  echo "✅ Mot de passe et hash non présents dans la réponse"
fi
```

**Règles validées** :
- ✅ Password jamais retourné
- ✅ PasswordHash jamais retourné
- ✅ Seules informations non sensibles retournées (id, email, createdAt)

---

## 📊 Récapitulatif des tests exécutables

| Test ID | Description | Méthode | Statut HTTP attendu | Exécutable via cURL |
|---------|-------------|---------|---------------------|---------------------|
| Test 1 | Connexion identifiants valides | POST | 200 | ✅ |
| Test 2 | Email majuscules | POST | 200 | ✅ |
| Test 3 | Email avec espaces | POST | 200 | ✅ |
| Test 4 | Récupération JWT payload | - | - | ✅ |
| Test 5 | Utilisation JWT route protégée | GET | 200 | ✅ |
| Test 6 | Mot de passe incorrect | POST | 401 | ✅ |
| Test 7 | Email inexistant | POST | 401 | ✅ |
| Test 8 | Email vide | POST | 400 | ✅ |
| Test 9 | Email null | POST | 400 | ✅ |
| Test 10 | Password vide | POST | 400 | ✅ |
| Test 11 | Password null | POST | 400 | ✅ |
| Test 12 | Email format invalide | POST | 400 | ✅ |
| Test 13 | JSON malformé | POST | 400 | ✅ |
| Test 14 | Content-Type incorrect | POST | 415 | ✅ |
| Test 15 | Rate limiting (5 tentatives) | POST | 429 | ✅ |
| Test 16 | JWT expiré | GET | 401 | ⚠️ Nécessite 24h |
| Test 17 | JWT signature invalide | GET | 401 | ✅ |
| Vérif. 1 | Structure JWT | - | - | ✅ |
| Vérif. 2 | Expiration 24h | - | - | ✅ |
| Vérif. 3 | Logging tentatives échouées | - | - | ⚠️ Nécessite logs |
| Vérif. 4 | Password non retourné | POST | 200 | ✅ |

---

## 🎯 Résumé

### Tests entièrement exécutables via cURL (19)
- ✅ Tous les tests d'intégration de l'API (`POST /api/auth/login`)
- ✅ Tests de validation (email format, champs obligatoires)
- ✅ Tests de sécurité (password incorrect, email inexistant)
- ✅ Tests de JWT (structure, expiration, utilisation)
- ✅ Tests de rate limiting (5 tentatives / 15 min)
- ✅ Vérifications de sécurité (password non retourné)

### Tests partiellement exécutables via cURL (2)
- ⚠️ JWT expiré (nécessite d'attendre 24h ou configuration test)
- ⚠️ Logging (nécessite accès aux logs backend)

**Taux de couverture cURL** : 19/21 tests (90%) - **Excellente couverture pour des tests manuels d'API**

Les tests manuels cURL couvrent l'ensemble des fonctionnalités exposées par l'endpoint `/api/auth/login`, y compris tous les cas d'erreur de validation, de sécurité (brute-force, JWT), et de rate limiting. Seul le test d'expiration JWT nécessite une configuration spécifique ou un délai d'attente.
