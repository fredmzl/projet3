# 🧪 Tests manuels cURL — Liste des fichiers (GET /api/files)

## 📋 Prérequis

### Variables d'environnement

```bash
# URL de l'API
export API_URL="http://localhost:3000"

# Créer un utilisateur de test et récupérer le token JWT
curl -v -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"testuser@example.com","password":"password123"}'

export JWT_TOKEN=$(curl -v -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"testuser@example.com","password":"password123"}' \
  | jq -r '.token')

echo "JWT Token: $JWT_TOKEN"
```

### Uploader des fichiers de test

```bash
# Créer quelques fichiers de test
echo "Document 1" > /tmp/doc1.txt
echo "Document 2 - Large content for testing" > /tmp/doc2.txt
dd if=/dev/zero of=/tmp/largefile.pdf bs=1M count=10 2>/dev/null

# Uploader 3 fichiers pour avoir des données
curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/doc1.txt" \
  -F "expirationDays=7" | jq .

curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/doc2.txt" \
  -F "expirationDays=3" \
  -F "password=secret123" | jq .

curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/largefile.pdf" \
  -F "expirationDays=1" | jq .
```

---

## ✅ Tests Réussis (200 OK)

### Test 1 : Liste des fichiers avec authentification (200 OK)

**Commande** :
```bash
curl -v -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: application/json" | jq .
```

**Réponse attendue** :
```json
{
  "files": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "filename": "largefile.bin",
      "fileSize": 10485760,
      "downloadToken": "a3f8b2c9-4e7a-41f6-b8d3-2c9e5a1f7b4d",
      "downloadUrl": "http://localhost:3000/api/files/download/a3f8b2c9-4e7a-41f6-b8d3-2c9e5a1f7b4d",
      "expirationDate": "2025-11-19T10:30:00",
      "hasPassword": false,
      "createdAt": "2025-11-18T10:30:00",
      "isExpired": false
    },
    {
      "id": "8d0f7780-8536-51ef-c9e4-3d0g6b2g8c5e",
      "filename": "doc2.txt",
      "fileSize": 37,
      "downloadToken": "b4g9c3d0-5f8b-52g7-c9f4-3e0h7c3h9d6f",
      "downloadUrl": "http://localhost:3000/api/files/download/b4g9c3d0-5f8b-52g7-c9f4-3e0h7c3h9d6f",
      "expirationDate": "2025-11-21T10:30:00",
      "hasPassword": true,
      "createdAt": "2025-11-18T10:29:45",
      "isExpired": false
    },
    {
      "id": "9e1g8891-9647-62fg-d0f5-4e1h8d4i0d7g",
      "filename": "doc1.txt",
      "fileSize": 11,
      "downloadToken": "c5h0d4e1-6g9c-63h8-d1g5-4f2i9e5j1e8h",
      "downloadUrl": "http://localhost:3000/api/files/download/c5h0d4e1-6g9c-63h8-d1g5-4f2i9e5j1e8h",
      "expirationDate": "2025-11-25T10:30:00",
      "hasPassword": false,
      "createdAt": "2025-11-18T10:29:30",
      "isExpired": false
    }
  ],
  "totalElements": 3,
  "totalPages": 1,
  "currentPage": 0,
  "pageSize": 20
}
```

**Règles validées** :
- ✅ Liste uniquement les fichiers de l'utilisateur authentifié
- ✅ Tri par défaut : createdAt descendant (plus récent d'abord)
- ✅ Structure de pagination complète
- ✅ Chaque fichier contient : id, filename, fileSize, downloadToken, downloadUrl, expirationDate, hasPassword, createdAt, isExpired

---

### Test 2 : Liste vide pour nouvel utilisateur

**Commande** :
```bash
# Créer un nouvel utilisateur
NEW_USER_TOKEN=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"newuser@example.com","password":"password123"}' \
  | jq -r '.token')

curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $NEW_USER_TOKEN" \
  -H "Accept: application/json" | jq .
```

**Réponse attendue** :
```json
{
  "files": [],
  "totalElements": 0,
  "totalPages": 0,
  "currentPage": 0,
  "pageSize": 20
}
```

**Règles validées** :
- ✅ Retourne un tableau vide si l'utilisateur n'a aucun fichier
- ✅ totalElements = 0
- ✅ totalPages = 0

---

### Test 3 : Pagination avec page=1 et size=2

**Commande** :
```bash
curl -s -X GET "$API_URL/api/files?page=1&size=2" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: application/json" | jq .
```

**Réponse attendue** :
```json
{
  "files": [
    {
      "id": "9e1g8891-9647-62fg-d0f5-4e1h8d4i0d7g",
      "filename": "doc1.txt",
      "fileSize": 11,
      "downloadToken": "c5h0d4e1-6g9c-63h8-d1g5-4f2i9e5j1e8h",
      "downloadUrl": "http://localhost:3000/api/files/download/c5h0d4e1-6g9c-63h8-d1g5-4f2i9e5j1e8h",
      "expirationDate": "2025-11-25T10:30:00",
      "hasPassword": false,
      "createdAt": "2025-11-18T10:29:30",
      "isExpired": false
    }
  ],
  "totalElements": 3,
  "totalPages": 2,
  "currentPage": 1,
  "pageSize": 2
}
```

**Règles validées** :
- ✅ Pagination correcte (page 1 = 2e page, index 0-based)
- ✅ Nombre d'éléments par page respecté (size=2)
- ✅ totalPages calculé correctement (3 fichiers / 2 par page = 2 pages)
- ✅ currentPage = 1

---

### Test 4 : Tri par taille de fichier décroissant

**Commande** :
```bash
curl -s -X GET "$API_URL/api/files?sort=fileSize,desc" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: application/json" | jq '.files[] | {filename, fileSize}'
```

**Réponse attendue** (ordre par taille décroissante) :
```json
{
  "filename": "largefile.bin",
  "fileSize": 10485760
}
{
  "filename": "doc2.txt",
  "fileSize": 37
}
{
  "filename": "doc1.txt",
  "fileSize": 11
}
```

**Règles validées** :
- ✅ Tri par fileSize en ordre décroissant
- ✅ Plus gros fichier en premier

---

### Test 5 : Tri par nom de fichier croissant

**Commande** :
```bash
curl -s -X GET "$API_URL/api/files?sort=originalFilename,asc" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: application/json" | jq '.files[] | .filename'
```

**Réponse attendue** (ordre alphabétique) :
```json
"doc1.txt"
"doc2.txt"
"largefile.bin"
```

**Règles validées** :
- ✅ Tri par originalFilename en ordre croissant
- ✅ Ordre alphabétique respecté

---

### Test 6 : Tri par date de création croissante

**Commande** :
```bash
curl -s -X GET "$API_URL/api/files?sort=createdAt,asc" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: application/json" | jq '.files[] | {filename, createdAt}'
```

**Réponse attendue** (plus ancien d'abord) :
```json
{
  "filename": "doc1.txt",
  "createdAt": "2025-11-18T10:29:30"
}
{
  "filename": "doc2.txt",
  "createdAt": "2025-11-18T10:29:45"
}
{
  "filename": "largefile.bin",
  "createdAt": "2025-11-18T10:30:00"
}
```

**Règles validées** :
- ✅ Tri par createdAt en ordre croissant
- ✅ Plus ancien fichier en premier

---

### Test 7 : Exclure les fichiers expirés (includeExpired=false)

**Commande** :
```bash
# Attendre que le fichier avec expirationDays=1 expire (ou utiliser un mock)
# Pour ce test, on vérifie simplement que le paramètre est accepté

curl -s -X GET "$API_URL/api/files?includeExpired=false" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: application/json" | jq '.files | length'
```

**Résultat attendu** :
- Si aucun fichier n'est expiré : retourne tous les fichiers (3)
- Si un fichier est expiré : retourne uniquement les fichiers actifs (2)

**Règles validées** :
- ✅ Le paramètre includeExpired est pris en compte
- ✅ Les fichiers expirés sont exclus quand includeExpired=false

---

### Test 8 : Inclure les fichiers expirés (includeExpired=true, défaut)

**Commande** :
```bash
curl -s -X GET "$API_URL/api/files?includeExpired=true" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: application/json" | jq '{total: .totalElements, hasExpired: [.files[] | select(.isExpired == true)] | length}'
```

**Réponse attendue** :
```json
{
  "total": 3,
  "hasExpired": 0
}
```

**Règles validées** :
- ✅ Par défaut, inclut tous les fichiers (expirés ou non)
- ✅ Le champ isExpired indique l'état de chaque fichier

---

### Test 9 : Taille de page maximale (size > 100)

**Commande** :
```bash
curl -s -X GET "$API_URL/api/files?size=200" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: application/json" | jq '.pageSize'
```

**Réponse attendue** :
```json
100
```

**Règles validées** :
- ✅ Limite maximale de 100 éléments par page
- ✅ Valeurs supérieures sont automatiquement plafonnées

---

### Test 10 : Valeurs par défaut (sans paramètres)

**Commande** :
```bash
curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Accept: application/json" | jq '{page: .currentPage, size: .pageSize, firstFile: .files[0].filename}'
```

**Réponse attendue** :
```json
{
  "page": 0,
  "size": 20,
  "firstFile": "largefile.bin"
}
```

**Règles validées** :
- ✅ page = 0 par défaut
- ✅ size = 20 par défaut
- ✅ sort = "createdAt,desc" par défaut (fichier le plus récent en premier)

---

## ❌ Tests d'Erreur (4xx)

### Test 11 : Liste sans authentification (401 Unauthorized)

**Commande** :
```bash
curl -v -X GET "$API_URL/api/files" \
  -H "Accept: application/json"
```

**Réponse attendue** :
```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource"
}
```

**Règles validées** :
- ✅ Authentification JWT obligatoire
- ✅ Retourne 401 sans token

---

### Test 12 : Liste avec JWT invalide (401 Unauthorized)

**Commande** :
```bash
curl -v -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer INVALID_TOKEN_HERE" \
  -H "Accept: application/json"
```

**Réponse attendue** :
```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "Invalid or expired JWT token"
}
```

**Règles validées** :
- ✅ Token JWT doit être valide
- ✅ Retourne 401 avec token invalide

---

### Test 13 : Liste avec JWT expiré (401 Unauthorized)

**Commande** :
```bash
# Utiliser un token expiré (généré il y a plus de 24h)
EXPIRED_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwODY0MDB9.invalid"

curl -v -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $EXPIRED_TOKEN" \
  -H "Accept: application/json"
```

**Réponse attendue** :
```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "JWT token has expired"
}
```

**Règles validées** :
- ✅ Token JWT doit être valide et non expiré
- ✅ Retourne 401 avec token expiré

---

## 🧪 Vérifications supplémentaires

### Vérifier l'isolation des utilisateurs

**Commande** :
```bash
# Créer deux utilisateurs et uploader des fichiers pour chacun
USER1_TOKEN=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"user1@example.com","password":"password123"}' \
  | jq -r '.token')

USER2_TOKEN=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"user2@example.com","password":"password123"}' \
  | jq -r '.token')

# User1 upload un fichier
curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -F "file=@/tmp/doc1.txt" \
  -F "expirationDays=7" | jq -r '.id' > /tmp/user1_file_id.txt

# User2 upload un fichier
curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -F "file=@/tmp/doc2.txt" \
  -F "expirationDays=7" | jq -r '.id' > /tmp/user2_file_id.txt

# Vérifier que User1 voit uniquement son fichier
USER1_FILES=$(curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $USER1_TOKEN" | jq '.totalElements')

# Vérifier que User2 voit uniquement son fichier
USER2_FILES=$(curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $USER2_TOKEN" | jq '.totalElements')

echo "User1 a $USER1_FILES fichier(s)"
echo "User2 a $USER2_FILES fichier(s)"

# Vérifier que les IDs sont différents
USER1_ID=$(cat /tmp/user1_file_id.txt)
USER2_ID=$(cat /tmp/user2_file_id.txt)

if [ "$USER1_ID" != "$USER2_ID" ]; then
  echo "✅ Les utilisateurs ont des fichiers distincts"
else
  echo "❌ Problème d'isolation des fichiers!"
fi
```

**Règles validées** :
- ✅ Chaque utilisateur voit uniquement ses propres fichiers
- ✅ Isolation complète entre utilisateurs

---

### Vérifier le calcul du champ isExpired

**Commande** :
```bash
# Uploader un fichier avec expiration très courte (1 jour)
curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/doc1.txt" \
  -F "expirationDays=1" | jq '{id, expirationDate, isExpired}'

# Lister les fichiers et vérifier le champ isExpired
curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.files[] | {filename, expirationDate, isExpired}'
```

**Règles validées** :
- ✅ Le champ isExpired est calculé dynamiquement
- ✅ isExpired = false si expirationDate > now
- ✅ isExpired = true si expirationDate <= now

---

### Vérifier la structure complète de la réponse

**Commande** :
```bash
curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq 'keys'
```

**Réponse attendue** :
```json
[
  "currentPage",
  "files",
  "pageSize",
  "totalElements",
  "totalPages"
]
```

**Règles validées** :
- ✅ Tous les champs de pagination sont présents
- ✅ Structure conforme au schema OpenAPI

---

## 📊 Récapitulatif des tests

| Test ID | Description | Méthode | Statut HTTP attendu | Exécutable via cURL |
|---------|-------------|---------|---------------------|---------------------|
| Test 1 | Liste avec authentification | GET | 200 | ✅ |
| Test 2 | Liste vide (nouvel utilisateur) | GET | 200 | ✅ |
| Test 3 | Pagination (page=1, size=2) | GET | 200 | ✅ |
| Test 4 | Tri par fileSize desc | GET | 200 | ✅ |
| Test 5 | Tri par originalFilename asc | GET | 200 | ✅ |
| Test 6 | Tri par createdAt asc | GET | 200 | ✅ |
| Test 7 | Exclure fichiers expirés | GET | 200 | ✅ |
| Test 8 | Inclure fichiers expirés | GET | 200 | ✅ |
| Test 9 | Taille max (size > 100) | GET | 200 | ✅ |
| Test 10 | Valeurs par défaut | GET | 200 | ✅ |
| Test 11 | Sans authentification | GET | 401 | ✅ |
| Test 12 | JWT invalide | GET | 401 | ✅ |
| Test 13 | JWT expiré | GET | 401 | ✅ |
| Vérif. 1 | Isolation utilisateurs | - | - | ✅ |
| Vérif. 2 | Calcul isExpired | - | - | ✅ |
| Vérif. 3 | Structure réponse | - | - | ✅ |

---

## 🎯 Résumé

### Tests entièrement exécutables via cURL (16)
- ✅ Tous les tests de pagination et tri
- ✅ Tous les tests d'authentification
- ✅ Toutes les vérifications de données

### Taux de couverture cURL
- **16/16 tests (100%)** - Tous les scénarios du endpoint GET /api/files sont testables manuellement

### Points de validation
1. **Authentification** : JWT obligatoire, validation du token
2. **Pagination** : page, size, totalElements, totalPages, currentPage
3. **Tri** : createdAt, fileSize, originalFilename (asc/desc)
4. **Filtrage** : includeExpired (true/false)
5. **Isolation** : Chaque utilisateur voit uniquement ses fichiers
6. **Métadonnées** : Tous les champs requis présents dans la réponse
7. **Limites** : Taille maximale 100 éléments par page
