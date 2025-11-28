# 🧪 Tests cURL - Endpoint Propriétaire (US05 Enhancement)

## 📋 Nouveau Endpoint Implémenté

**GET /api/download/owner/{token}**

Permet à un utilisateur authentifié de télécharger ses propres fichiers **sans fournir de mot de passe**, même si le fichier est protégé.

### Règles de Sécurité

- ✅ JWT requis (utilisateur authentifié)
- ✅ Vérifie que `userId` du JWT = `userId` du fichier
- ✅ Vérifie que le fichier n'est pas expiré
- ❌ Ne demande PAS le mot de passe (car propriétaire)
- ❌ Bloque l'accès si l'utilisateur n'est pas propriétaire (403 Forbidden)

---

## 🔧 Prérequis

### 1. Créer un utilisateur et se connecter

```bash
# URL de l'API
export API_URL="http://localhost:3000"

# Créer un compte
export TEST_EMAIL="alice@example.com"
export TEST_PASSWORD="password"

curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'"
  }'

# Se connecter et récupérer le JWT
export JWT_TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'"
  }' | jq -r '.token')

echo "JWT Token: $JWT_TOKEN"
```

### 2. Uploader un fichier de test

#### a) Fichier SANS mot de passe

```bash
echo "Test file content without password" > /tmp/test-no-password.txt

RESPONSE_NO_PWD=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-no-password.txt" \
  -F "expirationDays=7")

echo "$RESPONSE_NO_PWD" | jq .

# Extraire le token de téléchargement
export TOKEN_NO_PWD=$(echo "$RESPONSE_NO_PWD" | jq -r '.downloadToken')
echo "Token (no password): $TOKEN_NO_PWD"
```

#### b) Fichier AVEC mot de passe

```bash
echo "Test file content with password" > /tmp/test-with-password.txt

RESPONSE_WITH_PWD=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-with-password.txt" \
  -F "expirationDays=7" \
  -F "password=MySecretPass123")

echo "$RESPONSE_WITH_PWD" | jq .

# Extraire le token de téléchargement
export TOKEN_WITH_PWD=$(echo "$RESPONSE_WITH_PWD" | jq -r '.downloadToken')
echo "Token (with password): $TOKEN_WITH_PWD"
```

---

## ✅ Tests de Succès (200 OK)

### Test 1 : Télécharger son fichier SANS mot de passe (propriétaire)

**Commande** :
```bash
curl -v -X GET "$API_URL/api/download/owner/$TOKEN_NO_PWD" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o /tmp/downloaded-no-pwd.txt

# Vérifier le contenu
cat /tmp/downloaded-no-pwd.txt
```

**Réponse attendue** :
- HTTP 200 OK
- Headers :
  ```
  Content-Type: text/plain
  Content-Disposition: attachment; filename="test-no-password.txt"
  Content-Length: 33
  X-File-Id: 1
  X-Owner-Download: true
  ```
- Body : Contenu du fichier

**Règles validées** :
- ✅ Propriétaire peut télécharger sans mot de passe
- ✅ JWT valide requis
- ✅ Header `X-Owner-Download: true` présent

---

### Test 2 : Télécharger son fichier AVEC mot de passe (propriétaire, SANS fournir le password)

**Commande** :
```bash
curl -v -X GET "$API_URL/api/download/owner/$TOKEN_WITH_PWD" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o /tmp/downloaded-with-pwd.txt

# Vérifier le contenu
cat /tmp/downloaded-with-pwd.txt
```

**Réponse attendue** :
- HTTP 200 OK
- Headers :
  ```
  Content-Type: text/plain
  Content-Disposition: attachment; filename="test-with-password.txt"
  Content-Length: 35
  X-File-Id: 2
  X-Owner-Download: true
  ```
- Body : Contenu du fichier

**Règles validées** :
- ✅ Propriétaire peut télécharger son fichier protégé **sans fournir le mot de passe**
- ✅ Pas de vérification de password pour le propriétaire
- ✅ Amélioration UX : Accès direct depuis l'historique (US05)

---

## ❌ Tests d'Erreur (4xx)

### Test 3 : Sans JWT (401 Unauthorized)

**Commande** :
```bash
curl -v -X GET "$API_URL/api/download/owner/$TOKEN_NO_PWD"
```

**Réponse attendue** :
```json
{
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource"
}
```

**Code HTTP** : `401 Unauthorized`

**Règles validées** :
- ✅ JWT obligatoire pour cet endpoint
- ✅ Pas d'accès anonyme

---

### Test 4 : Avec JWT invalide (401 Unauthorized)

**Commande** :
```bash
curl -v -X GET "$API_URL/api/download/owner/$TOKEN_NO_PWD" \
  -H "Authorization: Bearer INVALID_TOKEN_12345"
```

**Réponse attendue** :
```json
{
  "error": "Unauthorized",
  "message": "Invalid JWT token"
}
```

**Code HTTP** : `401 Unauthorized`

**Règles validées** :
- ✅ Signature JWT vérifiée
- ✅ Token modifié/invalide rejeté

---

### Test 5 : Tenter de télécharger un fichier d'un AUTRE utilisateur (403 Forbidden)

**Préparation** : Créer un second utilisateur

```bash
# Créer un second utilisateur
export USER2_EMAIL="other_user_$(date +%s)@example.com"
export USER2_PASSWORD="OtherPass123!"

curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "'"$USER2_EMAIL"'",
    "password": "'"$USER2_PASSWORD"'"
  }'

# Se connecter en tant que User2
export JWT_TOKEN_USER2=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "'"$USER2_EMAIL"'",
    "password": "'"$USER2_PASSWORD"'"
  }' | jq -r '.token')

echo "JWT Token User2: $JWT_TOKEN_USER2"
```

**Commande** : User2 tente de télécharger le fichier de User1

```bash
curl -v -X GET "$API_URL/api/download/owner/$TOKEN_NO_PWD" \
  -H "Authorization: Bearer $JWT_TOKEN_USER2"
```

**Réponse attendue** :
```json
{
  "error": "Forbidden",
  "message": "Vous n'êtes pas autorisé à télécharger ce fichier",
  "timestamp": "2025-11-25T10:30:00"
}
```

**Code HTTP** : `403 Forbidden`

**Règles validées** :
- ✅ Vérification propriétaire : `userId` du JWT ≠ `userId` du fichier
- ✅ Impossible de télécharger les fichiers d'autres utilisateurs
- ✅ Sécurité : Isolation des données par utilisateur

---

### Test 6 : Token de fichier invalide (404 Not Found)

**Commande** :
```bash
curl -v -X GET "$API_URL/api/download/owner/INVALID_TOKEN_XYZ" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Réponse attendue** :
```json
{
  "error": "Not Found",
  "message": "Fichier non trouvé",
  "timestamp": "2025-11-25T10:30:00"
}
```

**Code HTTP** : `404 Not Found`

**Règles validées** :
- ✅ Token inexistant géré correctement

---

### Test 7 : Fichier expiré (410 Gone)

**Préparation** : Uploader un fichier avec expiration très courte (nécessite modification temporaire du code ou attendre l'expiration)

**Alternative** : Modifier manuellement en base de données pour tester

```sql
-- En base de données (pour test uniquement)
UPDATE files 
SET expiration_date = NOW() - INTERVAL '1 day' 
WHERE download_token = 'TOKEN_NO_PWD';
```

**Commande** :
```bash
curl -v -X GET "$API_URL/api/download/owner/$TOKEN_NO_PWD" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Réponse attendue** :
```json
{
  "error": "Gone",
  "message": "Le fichier a expiré",
  "expirationDate": "2025-11-24T10:30:00",
  "timestamp": "2025-11-25T10:30:00"
}
```

**Code HTTP** : `410 Gone`

**Règles validées** :
- ✅ Vérification expiration même pour le propriétaire
- ✅ Pas d'accès aux fichiers expirés

---

## 🆚 Comparaison : Endpoint Public vs Endpoint Propriétaire

| Critère | GET /api/download/{token} (public) | POST /api/download/{token} (public) | GET /api/download/owner/{token} (propriétaire) |
|---------|-----------------------------------|-------------------------------------|-----------------------------------------------|
| **Authentification** | ❌ Aucune | ❌ Aucune | ✅ JWT requis |
| **Mot de passe requis** | N/A (métadonnées) | ✅ Oui si `hasPassword=true` | ❌ Non (bypass si propriétaire) |
| **Vérification propriétaire** | ❌ Non | ❌ Non | ✅ Oui (`userId` du JWT vs fichier) |
| **Use Case** | Consulter infos fichier | Télécharger via lien partagé | Télécharger depuis son historique (US05) |
| **Accès autres users** | ✅ Oui (avec password si protégé) | ✅ Oui (avec password si protégé) | ❌ Non (403 Forbidden) |

---

## 📊 Récapitulatif des Tests

| Test ID | Description | Méthode | Auth | Statut HTTP attendu | Exécutable cURL |
|---------|-------------|---------|------|---------------------|-----------------|
| Test 1 | Download fichier sans password (owner) | GET | JWT | 200 | ✅ |
| Test 2 | Download fichier avec password sans le fournir (owner) | GET | JWT | 200 | ✅ |
| Test 3 | Sans JWT | GET | ❌ | 401 | ✅ |
| Test 4 | JWT invalide | GET | ❌ | 401 | ✅ |
| Test 5 | Fichier d'un autre user | GET | JWT | 403 | ✅ |
| Test 6 | Token invalide | GET | JWT | 404 | ✅ |
| Test 7 | Fichier expiré | GET | JWT | 410 | ⚠️ Nécessite modification DB |

**Taux de couverture cURL** : 6/7 tests (86%) - Excellent

---

## 🎯 Validation de l'Implémentation

### Checklist Backend

- [ ] Exception `AccessDeniedException` créée (403 Forbidden)
- [ ] Handler `@ExceptionHandler(AccessDeniedException.class)` dans `GlobalExceptionHandler`
- [ ] Nouveau endpoint `GET /api/download/owner/{token}` dans `DownloadController`
- [ ] Extraction `userId` depuis `Authentication.getName()`
- [ ] Vérification propriétaire : `file.getUser().getId().equals(userId)`
- [ ] Vérification expiration : `file.getExpirationDate().isBefore(LocalDateTime.now())`
- [ ] Appel `downloadService.downloadFile(token, null)` sans vérification password
- [ ] Configuration Spring Security : `.requestMatchers("/api/download/owner/**").authenticated()`
- [ ] Header `X-Owner-Download: true` ajouté dans la réponse

### Tests à Exécuter

```bash
# 1. Test succès (propriétaire, sans password requis)
curl -X GET "$API_URL/api/download/owner/$TOKEN_WITH_PWD" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o /tmp/test.txt && echo "✅ Test 1 OK"

# 2. Test 401 (sans JWT)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$API_URL/api/download/owner/$TOKEN_NO_PWD")
[ "$STATUS" = "401" ] && echo "✅ Test 2 OK" || echo "❌ Test 2 FAILED"

# 3. Test 403 (autre user)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$API_URL/api/download/owner/$TOKEN_NO_PWD" \
  -H "Authorization: Bearer $JWT_TOKEN_USER2")
[ "$STATUS" = "403" ] && echo "✅ Test 3 OK" || echo "❌ Test 3 FAILED"

# 4. Test 404 (token invalide)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$API_URL/api/download/owner/INVALID_TOKEN" \
  -H "Authorization: Bearer $JWT_TOKEN")
[ "$STATUS" = "404" ] && echo "✅ Test 4 OK" || echo "❌ Test 4 FAILED"
```

---

## 🚀 Avantages de cette Implémentation

1. **Meilleure UX (US05)** :
   - Pas de popup password pour ses propres fichiers
   - Téléchargement instantané depuis l'historique
   - Fluidité de navigation

2. **Sécurité maintenue** :
   - JWT requis (utilisateur authentifié)
   - Vérification stricte du propriétaire
   - Fichiers expirés toujours bloqués
   - Isolation des données entre utilisateurs

3. **Backward Compatibility** :
   - Endpoint public `/api/download/{token}` inchangé
   - Liens partagés continuent de fonctionner
   - Ajout non-breaking d'une nouvelle route

4. **Séparation des responsabilités** :
   - `/api/download/{token}` : Partage public (avec password si protégé)
   - `/api/download/owner/{token}` : Accès propriétaire (sans password)

---

## 📝 Prochaines Étapes

✅ **Étape 1 : Backend implémenté** (en cours de validation)

⏳ **Étape 2 : Frontend** (à implémenter après validation backend)
- Créer `FileService.downloadFileAsOwner(token): Observable<Blob>`
- Modifier `FilesComponent.onDownloadFile()` pour utiliser le nouveau endpoint
- Gestion erreurs 403/410 dans le composant

⏳ **Étape 3 : Documentation** (après validation frontend)
- Mettre à jour `docs/swagger.json` avec le nouveau endpoint
- Réviser `docs/us/us05-consultation-historique.md`
- Mettre à jour `docs/api.md`
- Réviser les tests manuels QA
