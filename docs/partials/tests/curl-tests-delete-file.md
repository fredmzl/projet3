# 🧪 Tests manuels cURL — Suppression de Fichiers (DELETE /api/files/{fileId})

## 📋 Prérequis

### Variables d'environnement

```bash
# URL de l'API
export API_URL="http://localhost:3000"

# Créer deux utilisateurs de test
curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"alice@example.com","password":"password123"}'

curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"bob@example.com","password":"password123"}'

# Récupérer les tokens JWT
export ALICE_TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"alice@example.com","password":"password123"}' \
  | jq -r '.token')

export BOB_TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"bob@example.com","password":"password123"}' \
  | jq -r '.token')

echo "Alice Token: $ALICE_TOKEN"
echo "Bob Token: $BOB_TOKEN"
```

### Créer des fichiers de test

```bash
# Créer un fichier de test
echo "Test file content" > /tmp/test-file.txt

# Alice upload un fichier
export FILE_ID=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -F "file=@/tmp/test-file.txt" \
  -F "expirationDays=7" \
  | jq -r '.id')

echo "File ID créé par Alice: $FILE_ID"

# Bob upload un fichier
export BOB_FILE_ID=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -F "file=@/tmp/test-file.txt" \
  -F "expirationDays=3" \
  | jq -r '.id')

echo "File ID créé par Bob: $BOB_FILE_ID"
```

---

## ✅ Tests Réussis (204 No Content)

### Test 1 : Suppression avec authentification et propriétaire (204 No Content)

**Description** : Alice supprime son propre fichier.

**Commande** :
```bash
curl -v -X DELETE "$API_URL/api/files/$FILE_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**Réponse attendue** :
- **Statut** : `204 No Content`
- **Corps** : (vide)

**Vérification** :
```bash
# Vérifier que le fichier n'existe plus
curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  | jq ".files[] | select(.id == \"$FILE_ID\")"
# Devrait retourner rien (fichier supprimé)
```

---

### Test 2 : Suppression d'un fichier avec mot de passe (204 No Content)

**Description** : Le propriétaire peut supprimer sans fournir le mot de passe.

**Préparation** :
```bash
# Alice upload un fichier avec mot de passe
export PWD_FILE_ID=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -F "file=@/tmp/test-file.txt" \
  -F "expirationDays=5" \
  -F "password=secret123" \
  | jq -r '.id')

echo "File ID avec mot de passe: $PWD_FILE_ID"
```

**Commande** :
```bash
curl -v -X DELETE "$API_URL/api/files/$PWD_FILE_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**Réponse attendue** :
- **Statut** : `204 No Content`
- **Corps** : (vide)

**Note** : Pas besoin de fournir le mot de passe pour la suppression par le propriétaire.

---

### Test 3 : Suppression d'un fichier expiré (204 No Content)

**Description** : Le propriétaire peut supprimer un fichier expiré.

**Préparation** :
```bash
# Alice upload un fichier avec expiration très courte (1 jour)
export EXPIRED_FILE_ID=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -F "file=@/tmp/test-file.txt" \
  -F "expirationDays=1" \
  | jq -r '.id')

echo "File ID qui expirera: $EXPIRED_FILE_ID"

# Note: En production, attendre l'expiration ou modifier la date en base
# Pour ce test, on suppose que le fichier peut être supprimé même s'il est expiré
```

**Commande** :
```bash
curl -v -X DELETE "$API_URL/api/files/$EXPIRED_FILE_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**Réponse attendue** :
- **Statut** : `204 No Content`
- **Corps** : (vide)

---

## ❌ Tests d'Erreur

### Test 4 : Suppression sans authentification (401 Unauthorized)

**Description** : Tentative de suppression sans token JWT.

**Commande** :
```bash
curl -v -X DELETE "$API_URL/api/files/$BOB_FILE_ID"
```

**Réponse attendue** :
- **Statut** : `401 Unauthorized`

**Vérification** :
```bash
# Vérifier que le fichier existe toujours
curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  | jq ".files[] | select(.id == \"$BOB_FILE_ID\")"
# Devrait retourner le fichier (non supprimé)
```

---

### Test 5 : Suppression avec token JWT invalide (401 Unauthorized)

**Description** : Tentative de suppression avec un token malformé.

**Commande** :
```bash
curl -v -X DELETE "$API_URL/api/files/$BOB_FILE_ID" \
  -H "Authorization: Bearer INVALID_TOKEN_123"
```

**Réponse attendue** :
- **Statut** : `401 Unauthorized`

---

### Test 6 : Suppression d'un fichier inexistant (404 Not Found)

**Description** : Tentative de suppression d'un UUID qui n'existe pas.

**Commande** :
```bash
curl -v -X DELETE "$API_URL/api/files/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**Réponse attendue** :
- **Statut** : `404 Not Found`
- **Corps** :
```json
{
  "error": "Not Found",
  "message": "Fichier non trouvé"
}
```

---

### Test 7 : Suppression du fichier d'un autre utilisateur (403 Forbidden)

**Description** : Alice tente de supprimer le fichier de Bob.

**Commande** :
```bash
curl -v -X DELETE "$API_URL/api/files/$BOB_FILE_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**Réponse attendue** :
- **Statut** : `403 Forbidden`
- **Corps** :
```json
{
  "error": "Forbidden",
  "message": "Vous n'êtes pas autorisé à supprimer ce fichier"
}
```

**Vérification** :
```bash
# Vérifier que le fichier de Bob existe toujours
curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  | jq ".files[] | select(.id == \"$BOB_FILE_ID\")"
# Devrait retourner le fichier (non supprimé)
```

---

### Test 8 : Suppression avec UUID malformé (400 Bad Request)

**Description** : Tentative de suppression avec un UUID invalide.

**Commande** :
```bash
curl -v -X DELETE "$API_URL/api/files/invalid-uuid-format" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**Réponse attendue** :
- **Statut** : `400 Bad Request`
- **Corps** :
```json
{
  "error": "Invalid parameter",
  "message": "Le paramètre 'fileId' a une valeur invalide: invalid-uuid-format"
}
```

---

## 🔍 Tests de Vérification Post-Suppression

### Vérifier la suppression du fichier physique

**Description** : Vérifier que le fichier est bien supprimé du système de fichiers.

**Commande** :
```bash
# Lister les fichiers dans le répertoire de stockage
ls -lah /var/datashare/storage/

# Vérifier qu'il n'y a plus de fichier pour l'utilisateur
find /var/datashare/storage/ -name "*$FILE_ID*"
```

**Résultat attendu** : Aucun fichier trouvé.

---

### Vérifier la suppression en base de données

**Description** : Vérifier via l'API que le fichier n'apparaît plus dans la liste.

**Commande** :
```bash
# Lister tous les fichiers d'Alice
curl -s -X GET "$API_URL/api/files?page=0&size=50" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  | jq '.content'

# Rechercher spécifiquement le fichier supprimé
curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  | jq ".files[] | select(.id == \"$FILE_ID\")"
```

**Résultat attendu** : Le fichier ne doit pas apparaître dans la liste.

---

## 📊 Scénario de Test Complet

### Script complet pour tester tous les cas

```bash
#!/bin/bash

# Configuration
export API_URL="http://localhost:3000"

echo "=== 1. Création des utilisateurs ==="
curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"alice@example.com","password":"password123"}' > /dev/null

curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"login":"bob@example.com","password":"password123"}' > /dev/null

echo "=== 2. Récupération des tokens ==="
export ALICE_TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"alice@example.com","password":"password123"}' \
  | jq -r '.token')

export BOB_TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"login":"bob@example.com","password":"password123"}' \
  | jq -r '.token')

echo "Alice Token: ${ALICE_TOKEN:0:20}..."
echo "Bob Token: ${BOB_TOKEN:0:20}..."

echo "=== 3. Création des fichiers de test ==="
echo "Test content" > /tmp/test-file.txt

export ALICE_FILE=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -F "file=@/tmp/test-file.txt" \
  -F "expirationDays=7" \
  | jq -r '.id')

export BOB_FILE=$(curl -s -X POST "$API_URL/api/files" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -F "file=@/tmp/test-file.txt" \
  -F "expirationDays=3" \
  | jq -r '.id')

echo "Alice File ID: $ALICE_FILE"
echo "Bob File ID: $BOB_FILE"

echo ""
echo "=== TEST 1: Suppression réussie par le propriétaire ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "$API_URL/api/files/$ALICE_FILE" \
  -H "Authorization: Bearer $ALICE_TOKEN")
echo "Résultat: $HTTP_CODE (attendu: 204)"

echo ""
echo "=== TEST 2: Suppression sans authentification ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "$API_URL/api/files/$BOB_FILE")
echo "Résultat: $HTTP_CODE (attendu: 401)"

echo ""
echo "=== TEST 3: Suppression du fichier d'un autre utilisateur ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "$API_URL/api/files/$BOB_FILE" \
  -H "Authorization: Bearer $ALICE_TOKEN")
echo "Résultat: $HTTP_CODE (attendu: 403)"

echo ""
echo "=== TEST 4: Suppression avec UUID invalide ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "$API_URL/api/files/invalid-uuid" \
  -H "Authorization: Bearer $ALICE_TOKEN")
echo "Résultat: $HTTP_CODE (attendu: 400)"

echo ""
echo "=== TEST 5: Suppression de fichier inexistant ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "$API_URL/api/files/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $ALICE_TOKEN")
echo "Résultat: $HTTP_CODE (attendu: 404)"

echo ""
echo "=== TEST 6: Bob supprime son propre fichier ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "$API_URL/api/files/$BOB_FILE" \
  -H "Authorization: Bearer $BOB_TOKEN")
echo "Résultat: $HTTP_CODE (attendu: 204)"

echo ""
echo "=== Vérification finale: Liste des fichiers ==="
echo "Fichiers d'Alice:"
curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  | jq '.content | length'

echo "Fichiers de Bob:"
curl -s -X GET "$API_URL/api/files" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  | jq '.content | length'

echo ""
echo "✅ Tests terminés"
```

### Utilisation du script

```bash
# Sauvegarder le script
cat > /tmp/test-delete-files.sh << 'EOF'
[... contenu du script ci-dessus ...]
EOF

# Rendre exécutable
chmod +x /tmp/test-delete-files.sh

# Exécuter
/tmp/test-delete-files.sh
```

---

## 📝 Résumé des Codes HTTP

| Code | Signification | Scénario |
|------|---------------|----------|
| **204** | No Content | Suppression réussie par le propriétaire |
| **400** | Bad Request | UUID malformé |
| **401** | Unauthorized | Pas de token JWT ou token invalide |
| **403** | Forbidden | Utilisateur pas propriétaire du fichier |
| **404** | Not Found | Fichier inexistant |

---

## 🎯 Checklist de Tests Manuels

- [ ] Test 1: Suppression réussie (204)
- [ ] Test 2: Suppression fichier avec mot de passe (204)
- [ ] Test 3: Suppression fichier expiré (204)
- [ ] Test 4: Sans authentification (401)
- [ ] Test 5: Token invalide (401)
- [ ] Test 6: Fichier inexistant (404)
- [ ] Test 7: Fichier d'un autre utilisateur (403)
- [ ] Test 8: UUID malformé (400)
- [ ] Vérification: Fichier physique supprimé
- [ ] Vérification: Fichier absent de la liste API
