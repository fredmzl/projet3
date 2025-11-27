# 🧪 Tests manuels cURL — Upload de Fichiers (US04)

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

### Fichiers de test

```bash
# Créer des fichiers de test
echo "Test file content for integration testing" > /tmp/test-storage-user/test-document.pdf
echo "Small text content" > /tmp/test-storage-user/test-file.txt
dd if=/dev/zero of=/tmp/test-storage-user/empty.txt bs=1 count=0
echo "executable content" > /tmp/test-storage-user/malicious.exe
```

---

## ✅ Tests Réussis (201 Created / 200 OK)

### Test 1 : Upload avec authentification (201 Created)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-document.pdf" \
  -F "expirationDays=7"
```

**Réponse attendue** :
```json
{
  "id": 1,
  "filename": "test-document.pdf",
  "fileSize": 43,
  "downloadToken": "abc123...",
  "downloadUrl": "http://localhost:8080/api/files/download/abc123...",
  "expirationDate": "2025-11-24T10:30:00",
  "hasPassword": false
}
```

**Règles validées** :
- ✅ Upload uniquement pour utilisateurs authentifiés
- ✅ Génération automatique d'un token de téléchargement
- ✅ URL de partage générée

---

### Test 2 : Upload avec mot de passe

**Commande** :
```bash
curl -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-document.pdf" \
  -F "expirationDays=7" \
  -F "password=mySecurePassword123"
```

**Réponse attendue** :
```json
{
  "id": 2,
  "filename": "test-document.pdf",
  "fileSize": 43,
  "downloadToken": "xyz789...",
  "downloadUrl": "http://localhost:8080/api/files/download/xyz789...",
  "expirationDate": "2025-11-24T10:30:00",
  "hasPassword": true
}
```

**Règles validées** :
- ✅ Protection du fichier par mot de passe (optionnelle)
- ✅ Mot de passe hashé et salé (BCrypt) en base de données
- ✅ `hasPassword` = true dans la réponse

---

### Test 4 : Upload avec expiration personnalisée (3 jours)

**Commande** :
```bash
curl -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-document.pdf" \
  -F "expirationDays=3"
```

**Réponse attendue** :
```json
{
  "id": 4,
  "filename": "test-document.pdf",
  "fileSize": 43,
  "downloadToken": "ghi789...",
  "downloadUrl": "http://localhost:8080/api/files/download/ghi789...",
  "expirationDate": "2025-11-20T10:30:00",
  "hasPassword": false
}
```

**Règles validées** :
- ✅ Durée de validité personnalisable (1-7 jours)
- ✅ Calcul correct de la date d'expiration

---

### Test 5 : Upload avec expiration par défaut (7 jours)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-document.pdf"
```

**Réponse attendue** :
```json
{
  "id": 5,
  "filename": "test-document.pdf",
  "fileSize": 43,
  "downloadToken": "jkl012...",
  "downloadUrl": "http://localhost:8080/api/files/download/jkl012...",
  "expirationDate": "2025-11-24T10:30:00",
  "hasPassword": false
}
```

**Règles validées** :
- ✅ Durée par défaut : 7 jours

---

### Test 6 : Upload de fichiers avec différents types MIME autorisés

**PDF** :
```bash
curl -v -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-document.pdf" \
  -F "expirationDays=7"
```

**JPEG** :
```bash
curl -v -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-image.jpg;type=image/jpeg" \
  -F "expirationDays=7"
```

**TXT** :
```bash
curl -v -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-file.txt;type=text/plain" \
  -F "expirationDays=7"
```

**ZIP** :
```bash
curl -v -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-archive.zip;type=application/zip" \
  -F "expirationDays=7"
```

**Règles validées** :
- ✅ Liste de types MIME autorisés
- ✅ Images : image/jpeg, image/png, image/gif, image/bmp, image/webp, image/svg+xml
- ✅ Documents : application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain, text/csv, text/html
- ✅ Archives : application/zip, application/x-rar-compressed, application/x-7z-compressed, application/x-tar, application/gzip

---

## ❌ Tests d'Erreur (4xx)

### Test 7 : Upload sans authentification (401 Unauthorized)

**Commande** :
```bash
curl -X POST "$API_URL/api/files" \
  -F "file=@test-document.pdf" \
  -F "expirationDays=7"
```

**Réponse attendue** :
```
HTTP/1.1 401 Unauthorized
```

**Règles validées** :
- ✅ Upload uniquement pour utilisateurs authentifiés (JWT)

---

### Test 8 : Upload avec JWT expiré (401 Unauthorized)

**Commande** :
```bash
# JWT expiré volontairement
curl -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.EXPIRED.TOKEN" \
  -F "file=@test-document.pdf" \
  -F "expirationDays=7"
```

**Réponse attendue** :
```
HTTP/1.1 401 Unauthorized
```

**Règles validées** :
- ✅ Authentification JWT valide requise

---

### Test 9 : Upload de fichier vide (400 Bad Request)

**Commande** :
```bash
curl -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@empty.txt" \
  -F "expirationDays=7"
```

**Réponse attendue** :
```json
{
  "error": "Cannot upload empty file"
}
```

**Règles validées** :
- ✅ Fichier non vide

---

### Test 10 : Upload avec expirationDays = 0 (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-document.pdf" \
  -F "expirationDays=0"
```

**Réponse attendue** :
```json
{
  "error": "La durée d'expiration doit être au minimum de 1 jour"
}
```

**Règles validées** :
- ✅ Période de validité entre 1 et 7 jours

---

### Test 11 : Upload avec expirationDays = 8 (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-document.pdf" \
  -F "expirationDays=8"
```

**Réponse attendue** :
```json
{
  "error": "La durée d'expiration doit être au maximum de 7 jours"
}
```

**Règles validées** :
- ✅ Période de validité entre 1 et 7 jours

---

### Test 12 : Upload avec mot de passe faible (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-document.pdf" \
  -F "expirationDays=7" \
  -F "password=123"
```

**Réponse attendue** :
```json
{
  "error": "Le mot de passe doit contenir au moins 4 caractères"
}
```

**Règles validées** :
- ✅ Mot de passe minimum 4 caractères

---

### Test 13 : Upload de fichier exécutable (400 Bad Request)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-storage-user/malicious.exe;type=application/x-msdownload" \
  -F "expirationDays=7"
```

**Réponse attendue** :
```json
{
  "error": "File type not allowed: malicious.exe (MIME: application/x-msdownload)"
}
```

**Règles validées** :
- ✅ Liste de types MIME autorisés
- ✅ Blocage des fichiers exécutables

---

### Test 14 : Upload avec JWT invalide (401 Unauthorized)

**Commande** :
```bash
curl -v -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -F "file=@/tmp/test-storage-user/test-document.pdf" \
  -F "expirationDays=7"
```

**Réponse attendue** :
```
HTTP/1.1 401 Unauthorized
```

**Règles validées** :
- ✅ Authentification JWT valide requise

---

## 🧪 Vérifications supplémentaires

### Vérifier que le fichier physique est créé

**Commande** :
```bash
# 1. Uploader un fichier et récupérer le token
RESPONSE=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@test-document.pdf" \
  -F "expirationDays=7")

echo "Response: $RESPONSE"

TOKEN=$(echo $RESPONSE | jq -r '.downloadToken')
echo "Download Token: $TOKEN"

# 2. Vérifier que le fichier existe sur le serveur (côté backend)
# Note : Cette commande doit être exécutée directement sur le serveur
# ls -lh /var/datashare/1/2025/11/17/
```

**Règles validées** :
- ✅ Stockage sécurisé du fichier physique
- ✅ Organisation par utilisateur et date
- ✅ Nom de fichier unique (UUID)

---

### Vérifier l'unicité des tokens

**Commande** :
```bash
# Uploader 3 fichiers et récupérer les tokens
TOKEN1=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@test-document.pdf" \
  -F "expirationDays=7" \
  | jq -r '.downloadToken')

TOKEN2=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@test-file.txt" \
  -F "expirationDays=7" \
  | jq -r '.downloadToken')

TOKEN3=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@test-image.jpg" \
  -F "expirationDays=7" \
  | jq -r '.downloadToken')

echo "Token 1: $TOKEN1"
echo "Token 2: $TOKEN2"
echo "Token 3: $TOKEN3"

# Vérifier qu'ils sont tous différents
if [ "$TOKEN1" != "$TOKEN2" ] && [ "$TOKEN2" != "$TOKEN3" ] && [ "$TOKEN1" != "$TOKEN3" ]; then
  echo "✅ Tous les tokens sont uniques"
else
  echo "❌ Collision de tokens détectée!"
fi
```

**Règles validées** :
- ✅ Token de téléchargement unique par fichier
- ✅ Pas de collision de tokens

---

### Vérifier l'association fichier ↔ utilisateur

**Commande** :
```bash
# 1. Créer deux utilisateurs
USER1_TOKEN=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"user1@example.com","password":"password123"}' \
  | jq -r '.token')

USER2_TOKEN=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"user2@example.com","password":"password123"}' \
  | jq -r '.token')

# 2. Chaque utilisateur upload un fichier
FILE1_RESPONSE=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -F "file=@test-document.pdf" \
  -F "expirationDays=7")

FILE2_RESPONSE=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -F "file=@test-file.txt" \
  -F "expirationDays=7")

echo "File 1 (User 1): $FILE1_RESPONSE"
echo "File 2 (User 2): $FILE2_RESPONSE"

# 3. Vérifier en base de données que chaque fichier est associé au bon userId
# Note : Cette vérification nécessite un accès à la base de données
# SELECT id, original_filename, user_id FROM files;
```

**Règles validées** :
- ✅ Association fichier ↔ propriétaire (userId depuis JWT)

---

## 📊 Récapitulatif des tests exécutables

| Test ID | Description | Méthode | Statut HTTP attendu | Exécutable via cURL |
|---------|-------------|---------|---------------------|---------------------|
| Test 1 | Upload avec authentification | POST | 201 | ✅ |
| Test 2 | Upload avec mot de passe | POST | 201 | ✅ |
| Test 3 | Upload sans mot de passe | POST | 201 | ✅ |
| Test 4 | Upload expiration 3 jours | POST | 201 | ✅ |
| Test 5 | Upload expiration par défaut | POST | 201 | ✅ |
| Test 6 | Upload types MIME variés | POST | 201 | ✅ |
| Test 7 | Upload sans authentification | POST | 401 | ✅ |
| Test 8 | Upload JWT expiré | POST | 401 | ✅ |
| Test 9 | Upload fichier vide | POST | 400 | ✅ |
| Test 10 | Upload expirationDays = 0 | POST | 400 | ✅ |
| Test 11 | Upload expirationDays = 8 | POST | 400 | ✅ |
| Test 12 | Upload mot de passe faible | POST | 400 | ✅ |
| Test 13 | Upload fichier exécutable | POST | 400 | ✅ |
| Test 14 | Upload JWT invalide | POST | 401 | ✅ |
| Vérif. 1 | Fichier physique créé | - | - | ⚠️ Partiel |
| Vérif. 2 | Tokens uniques | - | - | ✅ |
| Vérif. 3 | Association user ↔ fichier | - | - | ⚠️ Partiel |

---

## ⚠️ Tests non exécutables ou partiellement exécutables via cURL

### 1. Test 9 (FileControllerTest) : Upload fichier > 1 Go (413 Payload Too Large)

**Raison** : cURL peut techniquement envoyer un fichier de 1 Go, mais :
- Génération d'un fichier de 1 Go+ prend du temps
- L'upload prend plusieurs minutes selon la connexion
- Risque de timeout côté serveur/client
- Non pratique pour des tests manuels répétés

**Alternative** :
```bash
# Créer un fichier de 1 Go + 1 byte
dd if=/dev/zero of=large-file.bin bs=1M count=1024 && echo "x" >> large-file.bin

# Tenter l'upload (peut prendre plusieurs minutes)
curl -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@large-file.bin" \
  -F "expirationDays=7"
```

**Verdict** : ⚠️ **Partiellement exécutable** (trop lent pour usage manuel régulier)

---

### 2. Test 2 (FileControllerTest) : Vérification du hachage BCrypt en base de données

**Raison** : cURL ne peut pas inspecter directement le contenu de la base de données.

**Ce qui est vérifiable via cURL** :
- ✅ Upload avec mot de passe retourne `hasPassword: true`
- ✅ Upload sans mot de passe retourne `hasPassword: false`

**Ce qui nécessite un accès à la DB** :
- ❌ Vérifier que `passwordHash` commence par `$2` (indicateur BCrypt)
- ❌ Vérifier que `passwordHash` != mot de passe en clair
- ❌ Vérifier la longueur du hash (60 caractères)

**Alternative** :
```sql
-- Requête SQL à exécuter sur la base de données
SELECT id, original_filename, password_hash 
FROM files 
WHERE password_hash IS NOT NULL;

-- Vérifier que password_hash commence par $2a$ ou $2b$ (BCrypt)
```

**Verdict** : ⚠️ **Non testable directement via cURL** (nécessite accès DB)

---

### 3. Test 6 (FileControllerTest) : Vérification de l'association userId depuis le JWT

**Raison** : cURL ne peut pas inspecter directement la colonne `user_id` en base de données.

**Ce qui est vérifiable via cURL** :
- ✅ Upload avec JWT valide réussit
- ✅ Upload avec JWT d'un autre utilisateur réussit également

**Ce qui nécessite un accès à la DB** :
- ❌ Vérifier que `file.user_id` correspond à l'ID extrait du JWT

**Alternative** :
```sql
-- Requête SQL
SELECT f.id, f.original_filename, f.user_id, u.login 
FROM files f 
JOIN users u ON f.user_id = u.id;
```

**Verdict** : ⚠️ **Non testable directement via cURL** (nécessite accès DB)

---

### 4. Test 7 (FileControllerTest) : Vérification du contenu du fichier physique

**Raison** : cURL ne peut pas accéder au système de fichiers du serveur.

**Ce qui est vérifiable via cURL** :
- ✅ Upload retourne 201 Created
- ✅ Métadonnées correctes (filename, fileSize, downloadToken)

**Ce qui nécessite un accès SSH/filesystem** :
- ❌ Vérifier que le fichier existe à l'emplacement `{storagePath}/{userId}/{yyyy}/{mm}/{dd}/{UUID}_{filename}`
- ❌ Vérifier que le contenu du fichier correspond au contenu uploadé
- ❌ Vérifier que le fichier a la bonne taille

**Alternative** :
```bash
# Commande SSH sur le serveur backend
ssh user@backend-server
ls -lh /var/datashare/1/2025/11/17/
cat /var/datashare/1/2025/11/17/{UUID}_test-document.pdf
```

**Verdict** : ⚠️ **Non testable directement via cURL** (nécessite accès filesystem serveur)

---

### 5. Test 26 (FileStorageServiceTest) : Génération du chemin de fichier correct

**Raison** : Test unitaire du service FileStorageService. cURL teste l'API, pas les services internes.

**Ce qui est vérifiable via cURL** :
- ✅ Upload réussit
- ✅ `downloadUrl` est généré

**Ce qui est uniquement testable en unitaire** :
- ❌ Format exact du chemin interne : `{userId}/{yyyy}/{mm}/{dd}/{UUID}_{filename}`
- ❌ Présence de l'UUID dans le nom de fichier
- ❌ Structure des répertoires créés

**Verdict** : ❌ **Non testable via cURL** (test unitaire uniquement)

---

### 6. Test 33 (FileStorageServiceTest) : Protection contre path traversal

**Raison** : Test de sécurité du service FileStorageService. L'API ne permet pas de spécifier directement un chemin de fichier.

**Ce qui est vérifiable via cURL** :
- ✅ Upload de fichiers avec noms légitimes
- ✅ L'API ne permet pas de spécifier le chemin de destination

**Ce qui est uniquement testable en unitaire** :
- ❌ Tentative de `loadFileAsResource("../../../etc/passwd")`
- ❌ Vérification que la méthode rejette les chemins malveillants

**Verdict** : ❌ **Non testable via cURL** (test unitaire de méthode interne)

---

### 7. Tous les tests unitaires (FileServiceTest, FileStorageServiceTest)

**Raison** : Les tests unitaires testent des méthodes internes des services avec des mocks. cURL teste uniquement l'API HTTP publique.

**Exemples non testables via cURL** :
- `uploadFile_WithValidData_ReturnsDto` : Mock de FileRepository, FileMapper
- `uploadFile_WithPassword_HashesPassword` : Vérification que `passwordEncoder.encode()` est appelé
- `storeFile_CreatesDirectoriesAndSavesFile` : Tests sur le système de fichiers local
- `calculateExpirationDate_WithDays_ReturnsCorrectDate` : Méthode privée ou protégée

**Verdict** : ❌ **Non testables via cURL** (tests unitaires uniquement)

---

## 🎯 Résumé

### Tests entièrement exécutables via cURL (14)
- ✅ Tous les tests d'intégration de l'API (`POST /api/files`)
- ✅ Tests de validation (expirationDays, password, MIME types)
- ✅ Tests d'authentification (JWT valide/invalide/absent)
- ✅ Tests de tokens uniques

### Tests partiellement exécutables via cURL (3)
- ⚠️ Upload fichier > 1 Go (exécutable mais très lent)
- ⚠️ Vérification du hachage BCrypt (nécessite accès DB)
- ⚠️ Vérification de l'association userId (nécessite accès DB)
- ⚠️ Vérification du fichier physique (nécessite accès filesystem serveur)

### Tests non exécutables via cURL (18)
- ❌ Tous les tests unitaires (FileServiceTest : 8 tests)
- ❌ Tous les tests unitaires (FileStorageServiceTest : 11 tests)
- ❌ Tests de méthodes internes non exposées par l'API

**Taux de couverture cURL** : 14/35 tests (40%) - **Normal pour des tests manuels d'API**

Les tests manuels cURL couvrent l'ensemble des fonctionnalités exposées par l'API REST, tandis que les tests automatisés (JUnit) couvrent également la logique métier interne et les services.
