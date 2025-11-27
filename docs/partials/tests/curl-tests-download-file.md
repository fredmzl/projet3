# 🧪 Tests manuels cURL — Téléchargement via Lien (GET/POST /api/download/{token})

## 📋 Prérequis

### Variables d'environnement

```bash
# URL de l'API
export API_URL="http://localhost:3000"

# Créer un utilisateur de test
curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"testuser@example.com","password":"password123"}'

# Récupérer le token JWT
export USER_TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"testuser@example.net","password":"password"}' \
  | jq -r '.token')

echo "User Token: $USER_TOKEN"
```

### Créer des fichiers de test

```bash
# Créer un fichier de test
echo "Contenu du fichier de test pour téléchargement" > /tmp/test-download.txt

# Upload d'un fichier SANS mot de passe
export FILE_NO_PWD=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "file=@/tmp/test-download.txt" \
  -F "expirationDays=7" \
  | jq -r '.downloadUrl')

export TOKEN_NO_PWD=$(echo $FILE_NO_PWD | sed 's|.*/download/||')
echo "Token fichier sans mot de passe: $TOKEN_NO_PWD"

# Upload d'un fichier AVEC mot de passe
export FILE_WITH_PWD=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "file=@/tmp/test-download.txt" \
  -F "expirationDays=5" \
  -F "password=secret123" \
  | jq -r '.downloadUrl')

export TOKEN_WITH_PWD=$(echo $FILE_WITH_PWD | sed 's|.*/download/||')
echo "Token fichier avec mot de passe: $TOKEN_WITH_PWD"

# Upload d'un fichier avec expiration courte (1 jour)
export FILE_SHORT_EXP=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "file=@/tmp/test-download.txt" \
  -F "expirationDays=1" \
  | jq -r '.downloadUrl')

export TOKEN_SHORT_EXP=$(echo $FILE_SHORT_EXP | sed 's|.*/download/||')
echo "Token fichier expiration courte: $TOKEN_SHORT_EXP"
```

---

## ✅ Tests Réussis — GET /api/download/{token} (Métadonnées)

### Test 1 : Récupération des métadonnées d'un fichier sans mot de passe (200 OK)

**Description** : Obtenir les informations publiques d'un fichier sans le télécharger.

**Commande** :
```bash
curl -v -X GET "$API_URL/api/download/$TOKEN_NO_PWD"
```

**Réponse attendue** :
- **Statut** : `200 OK`
- **Corps** :
```json
{
  "originalFilename": "test-download.txt",
  "fileSize": 45,
  "mimeType": "text/plain",
  "expirationDate": "2025-11-27T...",
  "isExpired": false,
  "hasPassword": false,
  "message": null
}
```

**Vérification JSON** :
```bash
curl -s -X GET "$API_URL/api/download/$TOKEN_NO_PWD" | jq '.'
```

---

### Test 2 : Récupération des métadonnées d'un fichier avec mot de passe (200 OK)

**Description** : Les métadonnées sont publiques, mais un message indique que le fichier est protégé.

**Commande** :
```bash
curl -v -X GET "$API_URL/api/download/$TOKEN_WITH_PWD"
```

**Réponse attendue** :
- **Statut** : `200 OK`
- **Corps** :
```json
{
  "originalFilename": "test-download.txt",
  "fileSize": 45,
  "mimeType": "text/plain",
  "expirationDate": "2025-11-25T...",
  "isExpired": false,
  "hasPassword": true,
  "message": "Ce fichier est protégé par mot de passe"
}
```

**Vérification** :
```bash
curl -s -X GET "$API_URL/api/download/$TOKEN_WITH_PWD" | jq '.hasPassword'
# Doit retourner: true
```

---

## ✅ Tests Réussis — POST /api/download/{token} (Téléchargement)

### Test 3 : Téléchargement d'un fichier sans mot de passe (200 OK)

**Description** : Télécharger un fichier public sans fournir de mot de passe.

**Commande** :
```bash
curl -v -X POST "$API_URL/api/download/$TOKEN_NO_PWD" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -o /tmp/downloaded-file.txt
```

**Réponse attendue** :
- **Statut** : `200 OK`
- **Headers** :
  - `Content-Type: text/plain`
  - `Content-Disposition: attachment; filename="test-download.txt"`
  - `Content-Length: 45`
  - `X-File-Id: <UUID>`
- **Corps** : Contenu du fichier

**Vérification du fichier téléchargé** :
```bash
cat /tmp/downloaded-file.txt
# Doit afficher: "Contenu du fichier de test pour téléchargement"

# Vérifier la taille
ls -lh /tmp/downloaded-file.txt
```

---

### Test 4 : Téléchargement d'un fichier avec mot de passe correct (200 OK)

**Description** : Télécharger un fichier protégé en fournissant le bon mot de passe.

**Commande** :
```bash
curl -v -X POST "$API_URL/api/download/$TOKEN_WITH_PWD" \
  -H "Content-Type: application/json" \
  -d '{"password":"secret123"}' \
  -o /tmp/downloaded-protected.txt
```

**Réponse attendue** :
- **Statut** : `200 OK`
- **Headers** : Similaires au test 3
- **Corps** : Contenu du fichier

**Vérification** :
```bash
cat /tmp/downloaded-protected.txt
# Doit afficher le contenu correct
```

---

### Test 5 : Téléchargement avec body vide pour fichier sans mot de passe (200 OK)

**Description** : Le body peut être omis ou vide pour les fichiers publics.

**Commande 1 - Body vide** :
```bash
curl -v -X POST "$API_URL/api/download/$TOKEN_NO_PWD" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -o /tmp/downloaded-empty-body.txt
```

**Commande 2 - Sans body** :
```bash
curl -v -X POST "$API_URL/api/download/$TOKEN_NO_PWD" \
  -o /tmp/downloaded-no-body.txt
```

**Réponse attendue** :
- **Statut** : `200 OK`
- **Corps** : Contenu du fichier

---

## ❌ Tests d'Erreur — GET /api/download/{token}

### Test 6 : Token invalide ou fichier inexistant (404 Not Found)

**Description** : Tentative d'accès avec un token qui n'existe pas.

**Commande** :
```bash
curl -v -X GET "$API_URL/api/download/00000000-0000-0000-0000-000000000000"
```

**Réponse attendue** :
- **Statut** : `404 Not Found`
- **Corps** :
```json
{
  "error": "Not Found",
  "message": "Lien de téléchargement invalide ou fichier non trouvé"
}
```

---

### Test 7 : Fichier expiré — Métadonnées (410 Gone)

**Description** : Accéder aux métadonnées d'un fichier expiré.

**Note** : Pour simuler l'expiration, il faut soit :
- Attendre que le fichier expire naturellement (1 jour pour `TOKEN_SHORT_EXP`)
- Ou modifier manuellement la date d'expiration en base de données

**Commande** :
```bash
# Si le fichier TOKEN_SHORT_EXP est déjà expiré
curl -v -X GET "$API_URL/api/download/$TOKEN_SHORT_EXP"
```

**Réponse attendue** :
- **Statut** : `410 Gone`
- **Corps** :
```json
{
  "error": "Gone",
  "message": "Ce fichier a expiré et n'est plus disponible",
  "expirationDate": "2025-11-21T..."
}
```

---

## ❌ Tests d'Erreur — POST /api/download/{token}

### Test 8 : Téléchargement d'un fichier protégé sans mot de passe (401 Unauthorized)

**Description** : Tenter de télécharger un fichier protégé sans fournir de mot de passe.

**Commande 1 - Body vide** :
```bash
curl -v -X POST "$API_URL/api/download/$TOKEN_WITH_PWD" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Commande 2 - Sans body** :
```bash
curl -v -X POST "$API_URL/api/download/$TOKEN_WITH_PWD"
```

**Réponse attendue** :
- **Statut** : `401 Unauthorized`
- **Corps** :
```json
{
  "error": "Unauthorized",
  "message": "Ce fichier est protégé par mot de passe"
}
```

---

### Test 9 : Téléchargement avec mot de passe incorrect (401 Unauthorized)

**Description** : Fournir un mauvais mot de passe.

**Commande** :
```bash
curl -v -X POST "$API_URL/api/download/$TOKEN_WITH_PWD" \
  -H "Content-Type: application/json" \
  -d '{"password":"wrongpassword"}'
```

**Réponse attendue** :
- **Statut** : `401 Unauthorized`
- **Corps** :
```json
{
  "error": "Unauthorized",
  "message": "Mot de passe incorrect"
}
```

---

### Test 10 : Téléchargement d'un fichier expiré (410 Gone)

**Description** : Tenter de télécharger un fichier dont la date d'expiration est dépassée.

**Commande** :
```bash
# Si TOKEN_SHORT_EXP est expiré
curl -v -X POST "$API_URL/api/download/$TOKEN_SHORT_EXP" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Réponse attendue** :
- **Statut** : `410 Gone`
- **Corps** :
```json
{
  "error": "Gone",
  "message": "Ce fichier a expiré et n'est plus disponible",
  "expirationDate": "2025-11-21T..."
}
```

---

### Test 11 : Token invalide lors du téléchargement (404 Not Found)

**Description** : POST avec un token qui n'existe pas.

**Commande** :
```bash
curl -v -X POST "$API_URL/api/download/invalid-token-xyz" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Réponse attendue** :
- **Statut** : `404 Not Found`
- **Corps** :
```json
{
  "error": "Not Found",
  "message": "Lien de téléchargement invalide"
}
```

---

### Test 12 : Téléchargement avec fichier physique manquant (404 Not Found)

**Description** : Le fichier existe en base mais a été supprimé du disque.

**Préparation** :
```bash
# Upload un fichier
export FILE_TO_DELETE=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "file=@/tmp/test-download.txt" \
  -F "expirationDays=7" \
  | jq -r '.downloadUrl')

export TOKEN_TO_DELETE=$(echo $FILE_TO_DELETE | sed 's|.*/download/||')

# Récupérer le filepath du fichier
export FILE_PATH=$(curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $USER_TOKEN" \
  | jq -r ".content[] | select(.downloadUrl | endswith(\"$TOKEN_TO_DELETE\")) | .filepath")

# Supprimer manuellement le fichier physique (nécessite accès au serveur)
# sudo rm "/var/datashare/storage/$FILE_PATH"
```

**Commande** :
```bash
curl -v -X POST "$API_URL/api/download/$TOKEN_TO_DELETE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Réponse attendue** :
- **Statut** : `404 Not Found`
- **Corps** :
```json
{
  "error": "Not Found",
  "message": "Le fichier physique est introuvable ou illisible"
}
```

---

## 🔍 Tests de Vérification

### Vérifier les headers HTTP du téléchargement

**Description** : Inspecter les headers retournés lors d'un téléchargement réussi.

**Commande** :
```bash
curl -i -X POST "$API_URL/api/download/$TOKEN_NO_PWD" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -o /dev/null
```

**Headers attendus** :
```
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Disposition: attachment; filename="test-download.txt"
Content-Length: 45
X-File-Id: <UUID du fichier>
```

---

### Vérifier l'intégrité du fichier téléchargé

**Description** : Comparer le hash du fichier original et téléchargé.

**Commande** :
```bash
# Hash du fichier original
md5sum /tmp/test-download.txt

# Télécharger le fichier
curl -s -X POST "$API_URL/api/download/$TOKEN_NO_PWD" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -o /tmp/downloaded-verify.txt

# Hash du fichier téléchargé
md5sum /tmp/downloaded-verify.txt

# Les deux hashs doivent être identiques
```

---

### Vérifier l'accès public (pas de JWT requis)

**Description** : Confirmer que les endpoints `/api/download/*` sont accessibles sans authentification.

**Commande 1 - GET sans token** :
```bash
curl -v -X GET "$API_URL/api/download/$TOKEN_NO_PWD"
# Doit retourner 200 OK (pas de 401)
```

**Commande 2 - POST sans token** :
```bash
curl -v -X POST "$API_URL/api/download/$TOKEN_NO_PWD" \
  -H "Content-Type: application/json" \
  -d '{}'
# Doit retourner 200 OK avec le fichier
```

**Note** : Contrairement aux autres endpoints de l'API, `/api/download/*` ne nécessite PAS de `Authorization: Bearer <token>`.

---

## 📊 Scénario de Test Complet

### Script complet pour tester tous les cas

```bash
#!/bin/bash

# Configuration
export API_URL="http://localhost:3000"

echo "=== 1. Création de l'utilisateur ==="
curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"downloader@example.com","password":"pass123"}' > /dev/null

echo "=== 2. Récupération du token JWT ==="
export USER_TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"downloader@example.com","password":"pass123"}' \
  | jq -r '.token')

echo "Token JWT: ${USER_TOKEN:0:20}..."

echo "=== 3. Création des fichiers de test ==="
echo "Test content for download" > /tmp/test.txt

# Fichier sans mot de passe
export TOKEN_PUBLIC=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "file=@/tmp/test.txt" \
  -F "expirationDays=7" \
  | jq -r '.downloadUrl' | sed 's|.*/download/||')

# Fichier avec mot de passe
export TOKEN_PROTECTED=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "file=@/tmp/test.txt" \
  -F "expirationDays=5" \
  -F "password=secret456" \
  | jq -r '.downloadUrl' | sed 's|.*/download/||')

echo "Token public: $TOKEN_PUBLIC"
echo "Token protégé: $TOKEN_PROTECTED"

echo ""
echo "=== TEST 1: GET métadonnées fichier public ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$API_URL/api/download/$TOKEN_PUBLIC")
echo "Résultat: $HTTP_CODE (attendu: 200)"
curl -s -X GET "$API_URL/api/download/$TOKEN_PUBLIC" | jq -c '{hasPassword, isExpired}'

echo ""
echo "=== TEST 2: GET métadonnées fichier protégé ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$API_URL/api/download/$TOKEN_PROTECTED")
echo "Résultat: $HTTP_CODE (attendu: 200)"
curl -s -X GET "$API_URL/api/download/$TOKEN_PROTECTED" | jq -c '{hasPassword, isExpired}'

echo ""
echo "=== TEST 3: POST téléchargement fichier public ==="
HTTP_CODE=$(curl -s -o /tmp/dl-public.txt -w "%{http_code}" \
  -X POST "$API_URL/api/download/$TOKEN_PUBLIC" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "Résultat: $HTTP_CODE (attendu: 200)"
echo "Taille téléchargée: $(wc -c < /tmp/dl-public.txt) octets"

echo ""
echo "=== TEST 4: POST téléchargement avec bon mot de passe ==="
HTTP_CODE=$(curl -s -o /tmp/dl-protected.txt -w "%{http_code}" \
  -X POST "$API_URL/api/download/$TOKEN_PROTECTED" \
  -H "Content-Type: application/json" \
  -d '{"password":"secret456"}')
echo "Résultat: $HTTP_CODE (attendu: 200)"
echo "Taille téléchargée: $(wc -c < /tmp/dl-protected.txt) octets"

echo ""
echo "=== TEST 5: POST téléchargement sans mot de passe (fichier protégé) ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL/api/download/$TOKEN_PROTECTED" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "Résultat: $HTTP_CODE (attendu: 401)"

echo ""
echo "=== TEST 6: POST téléchargement avec mauvais mot de passe ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL/api/download/$TOKEN_PROTECTED" \
  -H "Content-Type: application/json" \
  -d '{"password":"wrongpass"}')
echo "Résultat: $HTTP_CODE (attendu: 401)"

echo ""
echo "=== TEST 7: GET avec token invalide ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$API_URL/api/download/invalid-token-12345")
echo "Résultat: $HTTP_CODE (attendu: 404)"

echo ""
echo "=== TEST 8: POST avec token invalide ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL/api/download/00000000-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "Résultat: $HTTP_CODE (attendu: 404)"

echo ""
echo "=== TEST 9: Vérification intégrité ==="
HASH_ORIGINAL=$(md5sum /tmp/test.txt | awk '{print $1}')
HASH_DOWNLOAD=$(md5sum /tmp/dl-public.txt | awk '{print $1}')
echo "Hash original:    $HASH_ORIGINAL"
echo "Hash téléchargé:  $HASH_DOWNLOAD"
if [ "$HASH_ORIGINAL" == "$HASH_DOWNLOAD" ]; then
  echo "✅ Intégrité vérifiée"
else
  echo "❌ Erreur d'intégrité"
fi

echo ""
echo "=== TEST 10: Accès public sans JWT ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$API_URL/api/download/$TOKEN_PUBLIC")
echo "GET sans JWT: $HTTP_CODE (attendu: 200)"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL/api/download/$TOKEN_PUBLIC" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "POST sans JWT: $HTTP_CODE (attendu: 200)"

echo ""
echo "✅ Tests terminés"
```

### Utilisation du script

```bash
# Sauvegarder le script
cat > /tmp/test-download-files.sh << 'EOF'
[... contenu du script ci-dessus ...]
EOF

# Rendre exécutable
chmod +x /tmp/test-download-files.sh

# Exécuter
/tmp/test-download-files.sh
```

---

## 📝 Résumé des Codes HTTP

| Endpoint | Code | Signification | Scénario |
|----------|------|---------------|----------|
| **GET** | **200** | OK | Métadonnées récupérées (fichier valide ou protégé) |
| **GET** | **404** | Not Found | Token invalide ou fichier inexistant |
| **GET** | **410** | Gone | Fichier expiré |
| **POST** | **200** | OK | Téléchargement réussi |
| **POST** | **401** | Unauthorized | Mot de passe manquant ou incorrect |
| **POST** | **404** | Not Found | Token invalide, fichier inexistant ou physique manquant |
| **POST** | **410** | Gone | Fichier expiré |

---

## 🎯 Checklist de Tests Manuels

### Tests GET (Métadonnées)
- [ ] Test 1: Fichier public (200)
- [ ] Test 2: Fichier protégé par mot de passe (200 + hasPassword=true)
- [ ] Test 6: Token invalide (404)
- [ ] Test 7: Fichier expiré (410)

### Tests POST (Téléchargement)
- [ ] Test 3: Fichier public sans body (200)
- [ ] Test 4: Fichier protégé avec bon mot de passe (200)
- [ ] Test 5: Fichier public avec body vide (200)
- [ ] Test 8: Fichier protégé sans mot de passe (401)
- [ ] Test 9: Fichier protégé avec mauvais mot de passe (401)
- [ ] Test 10: Fichier expiré (410)
- [ ] Test 11: Token invalide (404)
- [ ] Test 12: Fichier physique manquant (404)

### Vérifications
- [ ] Headers HTTP corrects (Content-Type, Content-Disposition, Content-Length, X-File-Id)
- [ ] Intégrité du fichier (hash MD5 identique)
- [ ] Accès public (GET et POST fonctionnent sans JWT)
- [ ] Message "Ce fichier est protégé par mot de passe" dans GET si hasPassword=true

---

## 💡 Notes Importantes

1. **Pas d'authentification JWT requise** : Les endpoints `/api/download/*` sont publics et ne nécessitent pas de header `Authorization`.

2. **GET vs POST** :
   - `GET /api/download/{token}` : Récupère les métadonnées SANS télécharger le fichier
   - `POST /api/download/{token}` : Télécharge le fichier (avec mot de passe si nécessaire)

3. **Gestion du mot de passe** :
   - Si le fichier n'a pas de mot de passe : POST avec `{}` ou sans body fonctionne
   - Si le fichier a un mot de passe : POST doit contenir `{"password":"..."}`
   - Le mot de passe est vérifié avec bcrypt (encodé côté serveur)

4. **Expiration** :
   - GET et POST retournent tous deux `410 Gone` si le fichier est expiré
   - Le body de la réponse 410 contient la date d'expiration

5. **Headers de téléchargement** :
   - `Content-Disposition: attachment; filename="..."` : Force le téléchargement avec nom original
   - `X-File-Id` : UUID du fichier pour traçabilité
   - `Content-Length` : Taille exacte du fichier

6. **Simulation d'expiration** :
   - Pour tester les cas 410 Gone, il faut soit attendre l'expiration naturelle
   - Soit modifier manuellement la base de données :
     ```sql
     UPDATE files SET expiration_date = NOW() - INTERVAL '1 day' WHERE download_token = '<token>';
     ```
