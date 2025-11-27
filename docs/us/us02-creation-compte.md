# US02 - Création de Compte

## 📋 Description

**User Story :** En tant qu'utilisateur non authentifié, je veux créer un compte pour pouvoir uploader et gérer des fichiers.

!!! info "Informations"
    **Acteur** : Utilisateur non authentifié  
    **Objectif** : Créer un compte avec email et mot de passe  
    **Prérequis** : Aucun  
    **Résultat attendu** : Compte créé, redirection vers la page de connexion

---

## 🔄 Diagramme de Séquence

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant B as Backend
    participant DB as Base de données

    U->>F: 1. Accède à la page d'inscription
    F->>U: Affiche formulaire (email, password, confirm password)
    
    U->>F: 2. Remplit le formulaire
    Note over U,F: email: user@example.com<br/>password: SecurePass123!<br/>confirm: SecurePass123!
    
    U->>F: 3. Clique sur "Créer mon compte"
    
    F->>F: 4. Validation côté client
    Note over F: - Email format valide<br/>- Password ≥ 8 caractères<br/>- Password = Confirm
    
    F->>B: 5. POST /api/auth/register<br/>{email, password}
    
    B->>B: 6. Validation côté serveur
    Note over B: - Email format valide<br/>- Email unique<br/>- Password ≥ 8 caractères
    
    B->>DB: 7. Vérification unicité email
    DB-->>B: Email disponible
    
    B->>B: 8. Hash du mot de passe (bcrypt)
    Note over B: $2a$10$N9qo8uLOickgx...
    
    B->>DB: 9. INSERT INTO users
    DB-->>B: Compte créé (userId)
    
    B-->>F: 10. HTTP 201 Created<br/>{message, userId}
    
    F->>F: 11. Affiche message succès
    Note over F: "Compte créé avec succès"
    
    F->>U: 12. Redirection vers /login
```

---

## 📝 Étapes Détaillées

| Étape | Action utilisateur | Réponse système | Écran |
|-------|-------------------|-----------------|-------|
| 1 | Clique sur "Créer un compte" | Affiche formulaire d'inscription | Écran inscription |
| 2 | Saisit email | Validation format en temps réel | - |
| 3 | Saisit mot de passe | Indicateur de force affiché | - |
| 4 | Confirme mot de passe | Vérification correspondance | - |
| 5 | Clique "Créer mon compte" | Désactive bouton, affiche loader | - |
| 6 | - | Validation backend + création compte | - |
| 7 | - | Message succès + redirection | Page connexion |

---

## ⚠️ Cas d'Erreur

### A. Email déjà utilisé

```mermaid
graph TD
    A[Utilisateur saisit: user@example.com] --> B[Backend: SELECT * FROM users WHERE email = ...]
    B --> C{Email trouvé ?}
    C -->|Oui| D[HTTP 409 Conflict]
    D --> E[Message: 'Un compte existe déjà avec cet email']
    E --> F[Affichage erreur sous le champ email]
```

**Réponse API :**
```json
{
  "error": "Conflict",
  "message": "Un compte existe déjà avec cet email",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Affichage frontend :** Message d'erreur sous le champ email

---

### B. Mot de passe trop faible

!!! danger "Validation frontend"
    ```
    Utilisateur saisit : "123" (trop court)
         ↓
    Validation : password.length < 8
         ↓
    Affichage : "Le mot de passe doit contenir au moins 8 caractères"
         ↓
    Bouton "Créer mon compte" : Désactivé
    ```

---

### C. Email invalide

!!! warning "Validation frontend"
    ```
    Utilisateur saisit : "invalid-email" (pas de @)
         ↓
    Validation : !email.includes('@')
         ↓
    Affichage : "L'email doit être au format valide"
    ```

---

### D. Mots de passe ne correspondent pas

!!! warning "Validation frontend"
    ```
    password : "SecurePass123!"
    confirm  : "SecurePass456!" (différent)
         ↓
    Validation : password !== confirmPassword
         ↓
    Affichage : "Les mots de passe ne correspondent pas"
    ```

---

## ✅ Règles de Validation

| Champ | Règle | Message d'erreur |
|-------|-------|------------------|
| **Email** | Format valide (regex RFC 5322) | "L'email doit être au format valide" |
| **Email** | Unique en base de données | "Un compte existe déjà avec cet email" |
| **Password** | Minimum 8 caractères | "Le mot de passe doit contenir au moins 8 caractères" |
| **Password** | Maximum 100 caractères | "Le mot de passe est trop long" |
| **Password** | Au moins 1 majuscule (recommandé) | "Le mot de passe doit contenir au moins une majuscule" |
| **Password** | Au moins 1 chiffre (recommandé) | "Le mot de passe doit contenir au moins un chiffre" |
| **Confirm** | Identique à password | "Les mots de passe ne correspondent pas" |

---

## 🔐 Sécurité

!!! success "Mesures de sécurité appliquées"
    - ✅ Hash bcrypt du mot de passe (jamais stocké en clair)
    - ✅ Validation côté serveur obligatoire (ne jamais faire confiance au client)
    - ✅ Rate limiting : 3 créations de compte par heure par IP
    - ✅ HTTPS obligatoire en production
    - ✅ Protection CSRF non nécessaire (API stateless avec JWT)

---

## 🧪 Critères d'Acceptation

!!! tip "Tests à valider"
    - [ ] Le formulaire d'inscription s'affiche correctement
    - [ ] La validation frontend fonctionne pour tous les champs
    - [ ] Un compte est créé avec succès avec des données valides
    - [ ] Une erreur 409 est retournée si l'email existe déjà
    - [ ] Le mot de passe est hashé avec bcrypt avant stockage
    - [ ] L'utilisateur est redirigé vers la page de connexion après création
    - [ ] Un message de succès est affiché
    - [ ] Les erreurs de validation sont affichées correctement
