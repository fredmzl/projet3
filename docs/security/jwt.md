# Système d'Authentification - JWT

## 📋 Vue d'ensemble

DataShare utilise **JSON Web Tokens (JWT)** pour l'authentification stateless selon la norme [RFC 7519](https://tools.ietf.org/html/rfc7519).

### Justification du choix technique

!!! success "Avantages"
    - **Stateless** : Pas de sessions serveur → scalabilité horizontale facilitée
    - **Standard** : RFC 7519, support natif dans toutes les stacks
    - **Auto-contenu** : Token contient les informations utilisateur (pas de requête DB à chaque appel)
    - **Compatible mobile/web** : Stockage facile (localStorage, SecureStorage)

!!! info "Alternatives écartées"
    - **OAuth2** : Trop complexe pour le MVP (pas de tiers authentifiants nécessaires)

---

## 🔍 Structure du Token JWT

### Format général

```text
HEADER.PAYLOAD.SIGNATURE
```

### Exemple concret

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDUzMzQ0MDAsImV4cCI6MTcwNTQyMDgwMH0.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

---

## 📦 Composants du Token

### 1. Header (partie 1)

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- **`alg`** : Algorithme de signature (HMAC SHA-256)
- **`typ`** : Type de token (JWT)

### 2. Payload (partie 2) - Claims

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1705334400,
  "exp": 1705420800
}
```

#### Description des claims

| Claim | Type | Description | Exemple |
|-------|------|-------------|---------|
| `userId` | UUID | Identifiant unique de l'utilisateur | `550e8400-e29b-41d4-a716-446655440000` |
| `email` | String | Email de l'utilisateur | `user@example.com` |
| `iat` | Timestamp | Issued At (date de création) | `1705334400` |
| `exp` | Timestamp | Expiration (date d'expiration) | `1705420800` |

!!! warning "Durée de validité"
    **24 heures** (86400 secondes)

!!! danger "Ce qui n'est PAS dans le token"
    - ❌ Mot de passe ou hash
    - ❌ Informations sensibles (données bancaires, etc.)
    - ❌ Données volumineuses (le token doit rester léger)

### 3. Signature (partie 3)

```javascript
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET_KEY
)
```

---

## 🔐 Clé Secrète (SECRET_KEY)

!!! abstract "Configuration"
    - **Variable d'environnement** : `JWT_SECRET`
    - **Longueur minimale** : 256 bits (32 caractères)
    - **Génération** : Aléatoire et cryptographiquement sécurisée
    - **Sécurité** : ⚠️ Jamais commitée dans Git

**Exemple de génération :**
```bash
openssl rand -base64 32
```

---

## 🛡️ Endpoints protégés vs publics

| Endpoint | Authentification | Justification |
|----------|------------------|---------------|
| `POST /api/auth/register` | ❌ Public | Création de compte |
| `POST /api/auth/login` | ❌ Public | Obtention du token |
| `POST /api/files` | ✅ JWT requis | Upload par utilisateur authentifié |
| `GET /api/files` | ✅ JWT requis | Liste des fichiers de l'utilisateur |
| `GET /api/files/{id}` | ✅ JWT requis | Détails d'un fichier (vérification propriété) |
| `DELETE /api/files/{id}` | ✅ JWT requis | Suppression (vérification propriété) |
| `GET /api/download/{token}` | ❌ Public | Affichage infos fichier (partage) |
| `POST /api/download/{token}` | ❌ Public | Téléchargement (partage anonyme) |
