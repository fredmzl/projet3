# US03 - Connexion Utilisateur

## 📋 Description

**User Story :** En tant qu'utilisateur avec un compte, je veux me connecter pour accéder à mon espace personnel et gérer mes fichiers.

!!! info "Informations"
    **Acteur** : Utilisateur avec compte existant  
    **Objectif** : S'authentifier et obtenir un token JWT  
    **Prérequis** : Compte créé  
    **Résultat attendu** : Token JWT reçu, redirection vers l'espace utilisateur

---

## 🔄 Diagramme de Séquence

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant B as Backend
    participant DB as Base de données

    U->>F: 1. Accède à la page de connexion
    F->>U: Affiche formulaire (email, password)
    
    U->>F: 2. Saisit identifiants
    Note over U,F: email: user@example.com<br/>password: SecurePass123!
    
    U->>F: 3. Clique sur "Connexion"
    
    F->>B: 4. POST /api/auth/login<br/>{email, password}
    
    B->>DB: 5. SELECT * FROM users WHERE email = ?
    DB-->>B: User trouvé {id, email, passwordHash}
    
    B->>B: 6. Vérification mot de passe
    Note over B: bcrypt.compare(password, passwordHash)
    
    alt Mot de passe correct
        B->>B: 7. Génération JWT
        Note over B: Payload: {userId, email}<br/>Signature: HMAC-SHA256<br/>Expiration: 24h
        
        B-->>F: 8. HTTP 200 OK<br/>{token, user}
        
        F->>F: 9. Stockage token
        Note over F: localStorage.setItem('jwt', token)
        
        F->>U: 10. Redirection vers /files
        
    else Mot de passe incorrect
        B-->>F: HTTP 401 Unauthorized<br/>{error, message}
        F->>U: Affiche erreur
    end
```

---

## 📝 Étapes Détaillées

| Étape | Action utilisateur | Réponse système | Écran |
|-------|-------------------|-----------------|-------|
| 1 | Clique sur "Se connecter" | Affiche formulaire de connexion | Écran connexion |
| 2 | Saisit email et mot de passe | - | - |
| 3 | Clique "Connexion" | Désactive bouton, affiche loader | - |
| 4 | - | Vérification identifiants backend | - |
| 5 | - | Génération token JWT | - |
| 6 | - | Stockage token + redirection | Espace utilisateur |

---

## 📦 API Endpoint

### POST /api/auth/login
**Description** : Authentifie un utilisateur et retourne un JWT

**Request Body :**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Réponse Success (200 OK) :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE2MTYyMzkwMjIsImV4cCI6MTYxNjMyNTQyMn0.5_abc123xyz",
  "user": {
    "id": "123456",
    "email": "user@example.com",
    "createdAt": "2025-01-10T08:30:00Z"
  }
}
```

**Structure du JWT :**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "123456",
    "email": "user@example.com",
    "iat": 1616239022,
    "exp": 1616325422
  }
}
```

---

## ⚠️ Cas d'Erreur

### A. Email ou mot de passe incorrect

!!! danger "Erreur 401 Unauthorized"
    **Scénario :**
    ```
    Utilisateur saisit : user@example.com / WrongPassword
         ↓
    Backend vérifie : bcrypt.compare('WrongPassword', storedHash)
         ↓
    Résultat : false (pas de match)
         ↓
    Response : HTTP 401 Unauthorized
    ```
    
    **Réponse API :**
    ```json
    {
      "error": "Unauthorized",
      "message": "Email ou mot de passe incorrect",
      "timestamp": "2025-01-15T10:30:00Z"
    }
    ```
    
    **Affichage frontend :**
    ```
    ❌ Email ou mot de passe incorrect
    ```
    
    !!! warning "Sécurité : Message générique"
        Même message pour email inexistant ou mot de passe incorrect.  
        **Objectif :** Ne pas révéler si l'email existe dans la base de données (prévention énumération).

---

### B. Champs vides

!!! warning "Validation frontend"
    ```
    Utilisateur laisse un champ vide
         ↓
    Validation : email === '' || password === ''
         ↓
    Affichage : Erreur sous le champ vide
    "Ce champ est obligatoire"
         ↓
    Bouton "Connexion" : Désactivé
    ```

---

### C. Trop de tentatives (Rate Limiting)

!!! danger "Erreur 429 Too Many Requests"
    **Scénario :**
    ```
    Utilisateur échoue 5 fois en 15 minutes
         ↓
    Backend détecte : rateLimiter.tryConsume() = false
         ↓
    Response : HTTP 429 Too Many Requests
    ```
    
    **Réponse API :**
    ```json
    {
      "error": "Too Many Requests",
      "message": "Trop de tentatives. Réessayez dans 15 minutes",
      "retryAfter": "2025-01-15T10:45:00Z"
    }
    ```
    
    **Affichage frontend :**
    ```
    🚫 Trop de tentatives. Réessayez dans 15 minutes.
    ```
    
    **Configuration Rate Limiting :**
    
    : **Limite**
    : 5 tentatives par 15 minutes par IP
    
    : **Compteur**
    : Par adresse IP (pas par email pour éviter le verrouillage de comptes)
    
    : **Réinitialisation**
    : Automatique après 15 minutes

---

### D. Email invalide

!!! warning "Validation frontend"
    ```json
    {
      "email": "invalid-email-format"
    }
    ```
    
    **Validation :**
    ```
    Format email invalide
         ↓
    Affichage : "L'email doit être au format valide"
         ↓
    Bouton "Connexion" : Désactivé
    ```

---

## 🔐 Sécurité

!!! success "Mesures de sécurité appliquées"
    - ✅ Hash bcrypt du mot de passe (jamais comparé en clair)
    - ✅ JWT avec expiration (24 heures)
    - ✅ JWT signé avec clé secrète HMAC-SHA256
    - ✅ Rate limiting : 5 tentatives / 15 minutes par IP
    - ✅ Message d'erreur générique (pas de révélation d'existence de compte)
    - ✅ HTTPS obligatoire en production
    - ✅ Pas de stockage du mot de passe côté frontend
    - ✅ Token stocké en localStorage (alternative : httpOnly cookie)
    - ✅ Logging des tentatives échouées pour détection d'attaques

---

## 🔑 Gestion du JWT

### Stockage du token

Dans le LocalStorage du navigateur

### Expiration et refresh

!!! info "Durée de validité"
    - **Expiration :** 24 heures
    - **Après expiration :** Utilisateur doit se reconnecter
    - **Refresh token (optionnel) :** Non implémenté dans v1

---

## 📊 Logging et Monitoring

!!! tip "Événements à logger"
    ### Connexion réussie
    ```
    [INFO] Login successful - User: user@example.com, IP: 192.168.1.10, Timestamp: 2025-01-15T10:30:00Z
    ```
    
    ### Échec de connexion
    ```
    [WARN] Login failed - Email: user@example.com, IP: 192.168.1.10, Reason: Invalid password, Timestamp: 2025-01-15T10:30:00Z
    ```
    
    ### Rate limiting déclenché
    ```
    [ALERT] Rate limit exceeded - IP: 192.168.1.10, Attempts: 5, Timestamp: 2025-01-15T10:30:00Z
    ```
    
    ### Métriques à surveiller
    - Nombre de connexions par heure
    - Taux d'échec de connexion
    - Adresses IP bloquées par rate limiting
    - Tentatives de brute-force détectées

---

## 🧪 Critères d'Acceptation

!!! tip "Tests à valider"
    - [ ] Le formulaire de connexion s'affiche correctement
    - [ ] Un utilisateur avec identifiants valides peut se connecter
    - [ ] Un JWT valide est retourné en cas de succès
    - [ ] Le token est stocké en localStorage
    - [ ] L'utilisateur est redirigé vers `/files` après connexion
    - [ ] Un mot de passe incorrect affiche un message d'erreur générique
    - [ ] Un email inexistant affiche le même message d'erreur
    - [ ] Les champs vides désactivent le bouton de connexion
    - [ ] Le rate limiting bloque après 5 tentatives échouées
    - [ ] Le JWT expire après 24 heures
    - [ ] Les tentatives échouées sont loggées
    - [ ] Le mot de passe n'est jamais stocké côté frontend
