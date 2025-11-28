# 🧪 Tests manuels cURL — Création de Compte (US02)

## 📋 Prérequis

### Variables d'environnement

```bash
# URL de l'API
export API_URL="http://localhost:3000"

# Email de test unique (générer un timestamp pour éviter les conflits)
export TEST_EMAIL="testuser_$(date +%s)@example.com"
echo "Email de test: $TEST_EMAIL"
```

---

## ✅ Tests Réussis (201 Created)

### Test 1 : Création de compte avec données valides (201 Created)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "SecurePass123!"
  }'
```

**Réponse attendue** :
```json
{
  "message": "Compte créé avec succès",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Code HTTP** : `201 Created`

**Règles validées** :
- ✅ Email format valide
- ✅ Password ≥ 8 caractères
- ✅ Compte créé en base de données
- ✅ Mot de passe hashé avec bcrypt

---

### Test 2 : Création de compte avec mot de passe fort

**Commande** :
```bash
export TEST_EMAIL2="testuser_strong_$(date +%s)@example.com"

curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL2"'",
    "password": "MyV3ryStr0ng!P@ssw0rd#2025"
  }'
```

**Réponse attendue** :
```json
{
  "message": "Compte créé avec succès",
  "userId": "234e5678-e89b-12d3-a456-426614174001"
}
```

**Code HTTP** : `201 Created`

**Règles validées** :
- ✅ Mot de passe fort accepté (majuscules, minuscules, chiffres, caractères spéciaux)
- ✅ Longueur jusqu'à 100 caractères

---

### Test 3 : Création de compte avec mot de passe minimum (8 caractères)

**Commande** :
```bash
export TEST_EMAIL3="testuser_min_$(date +%s)@example.com"

curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL3"'",
    "password": "Pass1234"
  }'
```

**Réponse attendue** :
```json
{
  "message": "Compte créé avec succès",
  "userId": "345e6789-e89b-12d3-a456-426614174002"
}
```

**Code HTTP** : `201 Created`

**Règles validées** :
- ✅ Mot de passe minimum 8 caractères accepté

---

### Test 4 : Création de compte avec email en majuscules

**Commande** :
```bash
export TEST_EMAIL4="TESTUSER_UPPER_$(date +%s)@EXAMPLE.COM"

curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL4"'",
    "password": "SecurePass123!"
  }'
```

**Réponse attendue** :
```json
{
  "message": "Compte créé avec succès",
  "userId": "456e7890-e89b-12d3-a456-426614174003"
}
```

**Code HTTP** : `201 Created`

**Règles validées** :
- ✅ Email normalisé en minuscules avant stockage
- ✅ Pas de doublon même avec casse différente

---

### Test 5 : Création de compte avec espaces dans l'email (trimés)

**Commande** :
```bash
export TEST_EMAIL5="testuser_trim_$(date +%s)@example.com"

curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "  '"$TEST_EMAIL5"'  ",
    "password": "SecurePass123!"
  }'
```

**Réponse attendue** :
```json
{
  "message": "Compte créé avec succès",
  "userId": "567e8901-e89b-12d3-a456-426614174004"
}
```

**Code HTTP** : `201 Created`

**Règles validées** :
- ✅ Espaces avant/après l'email supprimés automatiquement

---

## ❌ Tests d'Erreur (4xx)

### Test 6 : Email déjà utilisé (409 Conflict)

**Commande** :
```bash
# 1. Créer le compte une première fois
curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "password": "SecurePass123!"
  }'

# 2. Tenter de créer le même compte
curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "password": "AnotherPassword456!"
  }'
```

**Réponse attendue** :
```json
{
  "error": "Conflict",
  "message": "Un compte existe déjà avec cet email",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `409 Conflict`

**Règles validées** :
- ✅ Email unique en base de données
- ✅ Message d'erreur explicite

---

### Test 7 : Email invalide (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/register" \
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

### Test 8 : Email vide (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/register" \
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
- ✅ Email obligatoire (non null, non vide)

---

### Test 9 : Email null (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/register" \
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

### Test 10 : Mot de passe trop court (< 8 caractères) (400 Bad Request)

**Commande** :
```bash
export TEST_EMAIL10="testuser_short_$(date +%s)@example.com"

curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL10"'",
    "password": "Pass123"
  }'
```

**Réponse attendue** :
```json
{
  "error": "Bad Request",
  "message": "Le mot de passe doit contenir au moins 8 caractères",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `400 Bad Request`

**Règles validées** :
- ✅ Mot de passe minimum 8 caractères

---

### Test 11 : Mot de passe trop long (> 100 caractères) (400 Bad Request)

**Commande** :
```bash
export TEST_EMAIL11="testuser_long_$(date +%s)@example.com"
export LONG_PASSWORD=$(python3 -c "print('A' * 101)")

curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL11"'",
    "password": "'"$LONG_PASSWORD"'"
  }'
```

**Réponse attendue** :
```json
{
  "error": "Bad Request",
  "message": "Le mot de passe est trop long",
  "timestamp": "2025-11-25T10:30:00Z"
}
```

**Code HTTP** : `400 Bad Request`

**Règles validées** :
- ✅ Mot de passe maximum 100 caractères

---

### Test 12 : Mot de passe vide (400 Bad Request)

**Commande** :
```bash
export TEST_EMAIL12="testuser_empty_$(date +%s)@example.com"

curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL12"'",
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
- ✅ Mot de passe obligatoire (non vide)

---

### Test 13 : Mot de passe null (400 Bad Request)

**Commande** :
```bash
export TEST_EMAIL13="testuser_null_$(date +%s)@example.com"

curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL13"'"
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

### Test 14 : Email sans domaine (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@",
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
- ✅ Email complet requis (avec domaine)

---

### Test 15 : Email sans arobase (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser.example.com",
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
- ✅ Email doit contenir @

---

### Test 16 : Payload JSON malformé (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/register" \
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

### Test 17 : Content-Type incorrect (415 Unsupported Media Type)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: text/plain" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Réponse attendue** :
```
HTTP/1.1 415 Unsupported Media Type
```

**Règles validées** :
- ✅ Content-Type application/json requis

---

## 🧪 Vérifications supplémentaires

### Vérifier le hachage bcrypt du mot de passe en base de données

**Note** : Cette vérification nécessite un accès direct à la base de données.

**Commande SQL** :
```sql
-- Récupérer le hash du mot de passe
SELECT id, email, password_hash 
FROM users 
WHERE email = 'testuser@example.com';

-- Vérifier que le hash commence par $2a$ ou $2b$ (indicateur bcrypt)
-- Exemple: $2a$10$N9qo8uLOickgx2ZcGSxQsudIMVoPojgvWZ3eoYXcP5yVKt1PnCqeK
```

**Règles validées** :
- ✅ Mot de passe jamais stocké en clair
- ✅ Hash bcrypt avec salt (commence par `$2a$` ou `$2b$`)
- ✅ Longueur hash = 60 caractères

**Verdict** : ⚠️ **Non testable directement via cURL** (nécessite accès DB)

---

### Vérifier la création du compte en base de données

**Commande SQL** :
```sql
-- Vérifier que le compte a été créé
SELECT id, email, created_at, updated_at 
FROM users 
WHERE email = 'testuser@example.com';

-- Vérifier les timestamps
-- created_at et updated_at doivent être définis
```

**Règles validées** :
- ✅ Compte enregistré en base
- ✅ Timestamps created_at et updated_at renseignés
- ✅ ID généré (UUID)

**Verdict** : ⚠️ **Non testable directement via cURL** (nécessite accès DB)

---

### Vérifier qu'on peut se connecter après création

**Commande** :
```bash
# 1. Créer le compte
export NEW_USER_EMAIL="testlogin_$(date +%s)@example.com"
export NEW_USER_PASSWORD="SecurePass123!"

curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$NEW_USER_EMAIL"'",
    "password": "'"$NEW_USER_PASSWORD"'"
  }'

# 2. Se connecter immédiatement
curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$NEW_USER_EMAIL"'",
    "password": "'"$NEW_USER_PASSWORD"'"
  }'
```

**Réponse attendue** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "testlogin_1732531200@example.com"
}
```

**Code HTTP** : `200 OK`

**Règles validées** :
- ✅ Compte immédiatement utilisable après création
- ✅ Mot de passe correctement hashé et vérifiable

---

### Vérifier la normalisation de l'email (minuscules)

**Commande** :
```bash
# 1. Créer un compte avec email en majuscules
export UPPER_EMAIL="TESTCASE_$(date +%s)@EXAMPLE.COM"

curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$UPPER_EMAIL"'",
    "password": "SecurePass123!"
  }'

# 2. Tenter de se connecter avec minuscules
export LOWER_EMAIL=$(echo "$UPPER_EMAIL" | tr '[:upper:]' '[:lower:]')

curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$LOWER_EMAIL"'",
    "password": "SecurePass123!"
  }'
```

**Réponse attendue** : Connexion réussie (200 OK)

**Règles validées** :
- ✅ Email normalisé en minuscules lors du register
- ✅ Connexion possible avec n'importe quelle casse

---

## 📊 Récapitulatif des tests exécutables

| Test ID | Description | Méthode | Statut HTTP attendu | Exécutable via cURL |
|---------|-------------|---------|---------------------|---------------------|
| Test 1 | Création compte valide | POST | 201 | ✅ |
| Test 2 | Mot de passe fort | POST | 201 | ✅ |
| Test 3 | Mot de passe minimum 8 car. | POST | 201 | ✅ |
| Test 4 | Email majuscules | POST | 201 | ✅ |
| Test 5 | Email avec espaces (trimé) | POST | 201 | ✅ |
| Test 6 | Email déjà utilisé | POST | 409 | ✅ |
| Test 7 | Email invalide | POST | 400 | ✅ |
| Test 8 | Email vide | POST | 400 | ✅ |
| Test 9 | Email null | POST | 400 | ✅ |
| Test 10 | Password < 8 caractères | POST | 400 | ✅ |
| Test 11 | Password > 100 caractères | POST | 400 | ✅ |
| Test 12 | Password vide | POST | 400 | ✅ |
| Test 13 | Password null | POST | 400 | ✅ |
| Test 14 | Email sans domaine | POST | 400 | ✅ |
| Test 15 | Email sans @ | POST | 400 | ✅ |
| Test 16 | JSON malformé | POST | 400 | ✅ |
| Test 17 | Content-Type incorrect | POST | 415 | ✅ |
| Vérif. 1 | Hash bcrypt en DB | - | - | ⚠️ Nécessite DB |
| Vérif. 2 | Compte créé en DB | - | - | ⚠️ Nécessite DB |
| Vérif. 3 | Login après création | POST | 200 | ✅ |
| Vérif. 4 | Normalisation email | POST | 200 | ✅ |

---

## 🎯 Résumé

### Tests entièrement exécutables via cURL (19)
- ✅ Tous les tests d'intégration de l'API (`POST /api/auth/register`)
- ✅ Tests de validation (email format, password longueur)
- ✅ Tests d'unicité (email déjà existant)
- ✅ Tests de normalisation (email majuscules/minuscules)
- ✅ Tests de connexion post-création

### Tests partiellement exécutables via cURL (2)
- ⚠️ Vérification du hash bcrypt (nécessite accès DB)
- ⚠️ Vérification des timestamps et structure DB (nécessite accès DB)

**Taux de couverture cURL** : 19/21 tests (90%) - **Excellente couverture pour des tests manuels d'API**

Les tests manuels cURL couvrent l'ensemble des fonctionnalités exposées par l'endpoint `/api/auth/register`, y compris tous les cas d'erreur de validation. Seules les vérifications de structure interne de la base de données nécessitent un accès SQL direct.
