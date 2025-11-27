# US04 - Upload de Fichier

## 📋 Description

**User Story :** En tant qu'utilisateur authentifié, je veux uploader un fichier pour obtenir un lien de partage que je peux envoyer à d'autres personnes.

!!! info "Informations"
    **Acteur** : Utilisateur authentifié  
    **Objectif** : Uploader un fichier et obtenir un lien de téléchargement  
    **Prérequis** : Authentifié (token JWT valide)  
    **Résultat attendu** : Fichier uploadé, lien généré, ajout à l'historique

---

## 🔄 Diagramme de Séquence

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant B as Backend
    participant FS as File System
    participant DB as Base de données

    U->>F: 1. Accède à l'espace utilisateur
    F->>U: Affiche bouton "Ajouter un fichier"
    
    U->>F: 2. Clique sur le bouton upload
    F->>U: Ouvre sélecteur de fichiers
    
    U->>F: 3. Sélectionne un fichier
    Note over U,F: document.pdf (2,6 Mo)
    
    F->>F: 4. Validation côté client
    Note over F: - Taille < 1 GB<br/>- Fichier non vide
    
    F->>U: Affiche formulaire options
    Note over F: - Mot de passe (optionnel)<br/>- Expiration (1-7 jours)
    
    U->>F: 5. Configure options
    Note over U,F: Expiration: 7 jours<br/>Pas de mot de passe
    
    U->>F: 6. Clique "Téléverser"
    
    F->>F: 7. Affiche barre de progression
    
    F->>B: 8. POST /api/files (multipart)<br/>Authorization: Bearer <token>
    Note over F,B: file, expirationDays=7
    
    B->>B: 9. Extraction userId du JWT
    
    B->>B: 10. Validation fichier
    Note over B: - Taille < 1 GB<br/>- MIME type valide
    
    B->>B: 11. Génération métadonnées
    Note over B: - UUID (id)<br/>- Token download (UUID)<br/>- Filename avec token<br/>- Expiration date
    
    B->>FS: 12. Stockage fichier physique
    Note over FS: /var/datashare/uploads/<br/>2025/01/15/user-uuid/<br/>token-document.pdf
    FS-->>B: Fichier stocké (filepath)
    
    B->>DB: 13. INSERT INTO files
    Note over DB: id, user_id, filename,<br/>filepath, file_size, mime_type,<br/>download_token, expiration_date
    DB-->>B: Métadonnées sauvegardées
    
    B-->>F: 14. HTTP 201 Created
    Note over B,F: {message, file: {id, originalFilename,<br/>downloadLink, expirationDate, ...}}
    
    F->>F: 15. Masque barre progression
    
    F->>U: 16. Affiche confirmation + lien
    Note over F: "Félicitations, ton fichier sera<br/>conservé chez nous pendant<br/>une semaine !"<br/><br/>https://datashare.fr/download/a3f8b2c9...
    
    F->>U: 17. Bouton "Copier le lien"
```

---

## 📝 Étapes Détaillées

| Étape | Action utilisateur | Réponse système | Écran |
|-------|-------------------|-----------------|-------|
| 1 | Clique sur zone upload ou bouton | Ouvre sélecteur de fichiers OS | - |
| 2 | Sélectionne fichier | Affiche nom + taille fichier | Formulaire upload |
| 3 | (Optionnel) Saisit mot de passe | Indication "protégé" | - |
| 4 | Sélectionne durée expiration | Affichage date calculée | - |
| 5 | Clique "Téléverser" | Barre de progression 0% → 100% | - |
| 6 | - | Upload + traitement backend | - |
| 7 | - | Affichage lien + confirmation | Modal succès |
| 8 | Clique "Copier le lien" | Lien copié dans presse-papiers | - |

---

## 📦 API Endpoint

### POST /api/files
**Description** : Upload d'un fichier avec options de partage

**Headers :**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data) :**
```
--boundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

[binary file data]
--boundary
Content-Disposition: form-data; name="expirationDays"

7
--boundary
Content-Disposition: form-data; name="password"

secret123
--boundary--
```

**Form Fields :**
- `file` : Fichier binaire (obligatoire)
- `expirationDays` : Durée en jours (1-7, défaut: 7)
- `password` : Mot de passe de protection (optionnel)

**Réponse Success (201 Created) :**
```json
{
  "message": "Fichier uploadé avec succès",
  "file": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalFilename": "document.pdf",
    "fileSize": 2728960,
    "mimeType": "application/pdf",
    "downloadLink": "https://datashare.fr/download/a3f8b2c9-4e7a-41f6-b8d3-2c9e5a1f7b4d",
    "downloadToken": "a3f8b2c9-4e7a-41f6-b8d3-2c9e5a1f7b4d",
    "expirationDate": "2025-01-22T10:30:00Z",
    "hasPassword": false,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

---

## ⚠️ Cas d'Erreur

### A. Fichier trop volumineux

!!! danger "Erreur 400 Bad Request"
    **Validation frontend :**
    ```
    Utilisateur sélectionne : video.mp4 (3.1 GB > 1 GB)
         ↓
    Validation : file.size > 1073741824 (1 GB)
         ↓
    Affichage : "La taille des fichiers est limitée à 1 Go"
         ↓
    Bouton "Téléverser" : Désactivé
    ```
    
    **Validation backend (si contournement) :**
    ```json
    {
      "error": "Bad Request",
      "message": "La taille du fichier dépasse la limite autorisée (1 GB)",
      "maxSize": 1073741824
    }
    ```

---

### B. Token JWT expiré pendant l'upload

!!! warning "Erreur 401 Unauthorized"
    **Scénario :**
    ```
    Upload en cours... (fichier volumineux)
         ↓
    JWT expire (24h dépassées)
         ↓
    Backend : HTTP 401 Unauthorized
    ```
    
    **Réponse API :**
    ```json
    {
      "error": "Unauthorized",
      "message": "Token expiré (validité 24h)"
    }
    ```
    
    **Action frontend :**
    1. Arrête l'upload
    2. Affiche message : "Votre session a expiré. Veuillez vous reconnecter"
    3. Redirige vers `/login`

---

### C. Erreur réseau pendant l'upload

!!! warning "Interruption de connexion"
    **Scénario :**
    ```
    Upload en cours... 45%
         ↓
    Connexion interrompue (timeout, perte réseau)
         ↓
    Frontend détecte : xhr.onerror() ou timeout
    ```
    
    **Affichage frontend :**
    ```
    ⚠️ Erreur d'upload : connexion interrompue
    
    [Réessayer] [Annuler]
    ```
    
    **Possibilités d'amélioration (v2) :**
    - Reprise automatique de l'upload
    - Upload par chunks (chunked upload)

---

### D. Espace disque insuffisant (serveur)

!!! danger "Erreur 507 Insufficient Storage"
    **Scénario :**
    ```
    Backend reçoit le fichier
         ↓
    Tentative d'écriture : Files.write(path, bytes)
         ↓
    Exception : IOException (No space left on device)
    ```
    
    **Réponse API :**
    ```json
    {
      "error": "Insufficient Storage",
      "message": "Espace de stockage insuffisant sur le serveur"
    }
    ```
    
    **Affichage frontend :**
    ```
    🚫 Le serveur manque d'espace de stockage.
       Veuillez réessayer plus tard.
    ```

---

### E. Type de fichier non supporté (optionnel)

!!! warning "Erreur 415 Unsupported Media Type"
    **Si whitelist MIME types activée :**
    ```json
    {
      "error": "Unsupported Media Type",
      "message": "Type de fichier non autorisé (.exe)",
      "allowedTypes": ["image/*", "application/pdf", "text/*"]
    }
    ```

---

### F. Fichier vide

!!! warning "Erreur 400 Bad Request"
    ```json
    {
      "error": "Bad Request",
      "message": "Le fichier est vide",
      "fileSize": 0
    }
    ```

---

## 🔐 Sécurité

!!! success "Mesures de sécurité appliquées"
    - ✅ JWT obligatoire dans header `Authorization`
    - ✅ Validation taille fichier côté client ET serveur (1 GB max)
    - ✅ Stockage dans répertoire sécurisé (hors webroot)
    - ✅ Noms de fichiers générés avec UUID (pas d'overwrite)
    - ✅ Hash bcrypt pour les mots de passe de protection
    - ✅ Rate limiting : 10 uploads par heure par utilisateur
    - ✅ Scan antivirus (optionnel, recommandé en production)
    - ✅ Validation MIME type côté serveur
    - ✅ Logging de tous les uploads (audit trail)

---

## 📂 Organisation du Stockage

!!! info "Structure des répertoires"
    ```
    /var/datashare/uploads/
    ├── 2025/
    │   └── 01/
    │       └── 15/
    │           └── user-123456/
    │               ├── a3f8b2c9-document.pdf
    │               ├── b4e9c3d1-image.jpg
    │               └── c5f0d4e2-rapport.xlsx
    ```
    
    **Structure :**
    - Organisation par date (YYYY/MM/DD)
    - Sous-répertoire par utilisateur (userId)
    - Nom de fichier : `{downloadToken}-{originalFilename}`
    
    **Avantages :**
    - Facilite le nettoyage des fichiers expirés
    - Évite les collisions de noms
    - Permet l'isolation par utilisateur

---

## 📊 Métadonnées en Base de Données

!!! tip "Table `files`"
    ```sql
    CREATE TABLE files (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      original_filename VARCHAR(255) NOT NULL,
      filepath VARCHAR(512) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      download_token UUID UNIQUE NOT NULL,
      password_hash VARCHAR(255) NULL,
      expiration_date TIMESTAMP NOT NULL,
      download_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX idx_files_user_id ON files(user_id);
    CREATE INDEX idx_files_download_token ON files(download_token);
    CREATE INDEX idx_files_expiration_date ON files(expiration_date);
    ```

---

## 🧪 Critères d'Acceptation

!!! tip "Tests à valider"
    - [ ] Un utilisateur authentifié peut uploader un fichier
    - [ ] La barre de progression s'affiche pendant l'upload
    - [ ] Un lien de téléchargement unique est généré
    - [ ] Le lien peut être copié dans le presse-papiers
    - [ ] La durée d'expiration peut être configurée (1-7 jours)
    - [ ] Un mot de passe optionnel peut être défini
    - [ ] Les fichiers > 1 GB sont rejetés
    - [ ] Les fichiers vides sont rejetés
    - [ ] Une erreur 401 est retournée si le JWT est invalide
    - [ ] Le fichier est ajouté à l'historique de l'utilisateur
    - [ ] Le fichier physique est stocké correctement
    - [ ] Les métadonnées sont sauvegardées en base
    - [ ] Le rate limiting empêche les uploads en masse