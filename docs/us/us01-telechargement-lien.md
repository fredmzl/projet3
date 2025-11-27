# US01 - Téléchargement via Lien

## 📋 Description

**User Story :** En tant que destinataire (anonyme ou authentifié), je veux télécharger un fichier via le lien partagé pour accéder au contenu.

!!! info "Informations"
    **Acteur** : N'importe qui avec le lien  
    **Objectif** : Télécharger un fichier partagé  
    **Prérequis** : Avoir le lien de téléchargement  
    **Résultat attendu** : Fichier téléchargé sur l'appareil

---

## 🔄 Flux Nominal (Sans Mot de Passe)

```mermaid
sequenceDiagram
    participant U as Destinataire
    participant B as Browser
    participant BE as Backend
    participant FS as File System
    participant DB as Base de données

    U->>B: 1. Clique sur le lien ou copie l'URL
    Note over U,B: https://datashare.fr/download/<br/>a3f8b2c9-4e7a-41f6-b8d3-2c9e5a1f7b4d
    
    B->>BE: 2. GET /api/download/token
    
    BE->>DB: 3. SELECT * FROM files<br/>WHERE download_token = ?
    DB-->>BE: Fichier trouvé
    
    BE->>BE: 4. Vérification expiration
    Note over BE: expirationDate > NOW()
    
    alt Non expiré
        BE-->>B: 5. HTTP 200 OK
        Note over BE,B: originalFilename, fileSize,<br/>mimeType, expirationDate,<br/>hasPassword: false
        
        B->>U: 6. Affiche infos fichier
        Note over B: Nom: rapport-financier-2024.pdf<br/>Taille: 2,6 Mo<br/>Expire dans 5 jours<br/>[Télécharger]
        
        U->>B: 7. Clique "Télécharger"
        
        B->>BE: 8. POST /api/download/token
        Note over B,BE: Body vide (pas de mot de passe)
        
        BE->>BE: 9. Vérifications
        Note over BE: - Token valide<br/>- Non expiré<br/>- Pas de mot de passe requis
        
        BE->>FS: 10. Lecture fichier
        FS-->>BE: Stream binaire
        
        BE-->>B: 11. HTTP 200 OK<br/>Content-Type, Content-Disposition
        Note over BE,B: Stream du fichier<br/>Headers:<br/>- Content-Type: application/pdf<br/>- Content-Disposition: attachment<br/>- Content-Length: 2728960
        
        B->>U: 12. Téléchargement du fichier
        Note over B: Le navigateur démarre<br/>le téléchargement automatiquement
        
    else Expiré
        BE-->>B: HTTP 410 Gone
        B->>U: Affiche message erreur
    end
```

---

## 🔐 Flux avec Mot de Passe

```mermaid
sequenceDiagram
    participant U as Destinataire
    participant B as Browser
    participant BE as Backend
    participant DB as Database

    U->>B: 1. Accède au lien
    
    B->>BE: 2. GET /api/download/token
    
    BE->>DB: 3. SELECT * FROM files WHERE download_token = ?
    DB-->>BE: Fichier trouvé (avec passwordHash)
    
    BE-->>B: 4. HTTP 200 OK
    Note over BE,B: originalFilename, fileSize,<br/>hasPassword: true,<br/>message: "Ce fichier est protégé<br/>par mot de passe"
    
    B->>U: 5. Affiche formulaire mot de passe
    Note over B: 📄 contrat-confidentiel.pdf<br/>🔒 Protégé par mot de passe<br/>[Input password] [Télécharger]
    
    U->>B: 6. Saisit mot de passe
    
    U->>B: 7. Clique "Télécharger"
    
    B->>BE: 8. POST /api/download/token<br/>password: "secret123"
    
    BE->>BE: 9. Vérification mot de passe
    Note over BE: bcrypt.compare(password,<br/>storedPasswordHash)
    
    alt Mot de passe correct
        BE-->>B: 10. HTTP 200 OK + Stream fichier
        B->>U: Téléchargement démarre
        
    else Mot de passe incorrect
        BE-->>B: HTTP 401 Unauthorized
        Note over BE,B: error: "Unauthorized",<br/>message: "Mot de passe incorrect"
        
        B->>U: Affiche erreur sous le champ
        Note over B: "❌ Mot de passe incorrect"
    end
```

---

## 📝 Étapes Détaillées

### Scénario A : Fichier sans mot de passe

| Étape | Action utilisateur | Réponse système | Écran |
|-------|-------------------|-----------------|-------|
| 1 | Clique sur le lien reçu | Chargement page | - |
| 2 | - | Récupération infos fichier | Page téléchargement |
| 3 | Voit nom, taille, expiration | - | - |
| 4 | Clique "Télécharger" | Démarre téléchargement | - |
| 5 | - | Fichier téléchargé dans Downloads | - |

### Scénario B : Fichier avec mot de passe

| Étape | Action utilisateur | Réponse système | Écran |
|-------|-------------------|-----------------|-------|
| 1 | Clique sur le lien reçu | Chargement page | - |
| 2 | - | Affiche infos + formulaire password | Page avec formulaire |
| 3 | Saisit mot de passe | - | - |
| 4 | Clique "Télécharger" | Vérification password | - |
| 5 | - | Si OK : téléchargement | - |
| 6 | - | Si KO : message erreur | Erreur sous champ |

---

## 📦 API Endpoints

### GET /api/download/{token}
**Description** : Récupère les informations du fichier sans le télécharger

**Réponse Success (200 OK) - Sans mot de passe :**
```json
{
  "originalFilename": "rapport-financier-2024.pdf",
  "fileSize": 2728960,
  "mimeType": "application/pdf",
  "expirationDate": "2025-02-15T10:30:00Z",
  "hasPassword": false,
  "downloadCount": 12
}
```

**Réponse Success (200 OK) - Avec mot de passe :**
```json
{
  "originalFilename": "contrat-confidentiel.pdf",
  "fileSize": 1524288,
  "mimeType": "application/pdf",
  "expirationDate": "2025-02-20T14:00:00Z",
  "hasPassword": true,
  "message": "Ce fichier est protégé par mot de passe"
}
```

---

### POST /api/download/{token}
**Description** : Télécharge le fichier (avec mot de passe optionnel)

**Request Body (si protégé) :**
```json
{
  "password": "secret123"
}
```

**Response Headers (200 OK) :**
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="rapport-financier-2024.pdf"
Content-Length: 2728960
Cache-Control: no-cache, no-store, must-revalidate
```

**Response Body :** Stream binaire du fichier

---

## ⚠️ Cas d'Erreur

### A. Lien expiré

!!! danger "Erreur 410 Gone"
    ```json
    {
      "error": "Gone",
      "message": "Ce fichier a expiré et n'est plus disponible",
      "expirationDate": "2025-01-14T10:45:00Z"
    }
    ```

---

### B. Token invalide

!!! danger "Erreur 404 Not Found"
    ```json
    {
      "error": "Not Found",
      "message": "Lien de téléchargement invalide ou fichier non trouvé"
    }
    ```

---

### C. Mot de passe incorrect (Rate Limiting)

!!! warning "Limitation des tentatives"
    **Tentative 1-3 :**
    ```json
    {
      "error": "Unauthorized",
      "message": "Mot de passe incorrect",
      "remainingAttempts": 2
    }
    ```
    
    **Après 3 tentatives échouées :**
    ```json
    {
      "error": "Too Many Requests",
      "message": "Trop de tentatives. Réessayez dans 15 minutes",
      "retryAfter": 900
    }
    ```
---

### D. Fichier supprimé

!!! warning "Erreur 404 Not Found"
    ```json
    {
      "error": "Not Found",
      "message": "Ce fichier a été supprimé par son propriétaire"
    }
    ```

---

## 🔐 Sécurité

!!! success "Mesures de sécurité appliquées"
    - ✅ Tokens de téléchargement uniques et aléatoires (UUID v4)
    - ✅ Vérification de l'expiration côté serveur
    - ✅ Hash bcrypt pour les mots de passe de protection
    - ✅ Rate limiting : 3 tentatives de mot de passe par IP/token (15 min)
    - ✅ Rate limiting : 10 téléchargements par minute par IP
    - ✅ Pas d'énumération de fichiers possible (tokens aléatoires)
    - ✅ Headers sécurisés (Cache-Control, X-Content-Type-Options)
    - ✅ Logging des téléchargements (IP, timestamp, user-agent)

---

## 🧪 Critères d'Acceptation

!!! tip "Tests à valider"
    - [ ] Un fichier public peut être téléchargé sans mot de passe
    - [ ] Un fichier protégé affiche le formulaire de mot de passe
    - [ ] Le mot de passe correct permet le téléchargement
    - [ ] Un mot de passe incorrect affiche une erreur claire
    - [ ] Après 3 tentatives échouées, l'accès est bloqué 15 minutes
    - [ ] Un fichier expiré retourne une erreur 410 Gone
    - [ ] Un token invalide retourne une erreur 404 Not Found
    - [ ] Les headers HTTP sont corrects (Content-Type, Content-Disposition)
    - [ ] Le nom du fichier téléchargé correspond à l'original
    - [ ] Les statistiques de téléchargement sont mises à jour
    - [ ] La page est accessible sans authentification
    - [ ] Le rate limiting fonctionne (10 téléchargements/min/IP)