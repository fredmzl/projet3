# US05 - Consultation de l'Historique

## 📋 Description

**User Story :** En tant qu'utilisateur authentifié, je veux consulter la liste de tous mes fichiers uploadés pour gérer mes partages.

!!! info "Informations"
    **Acteur** : Utilisateur authentifié  
    **Objectif** : Voir l'historique des fichiers uploadés  
    **Prérequis** : Authentifié, avoir uploadé au moins 1 fichier  
    **Résultat attendu** : Liste des fichiers avec état (actif/expiré)

---

## 🔄 Diagramme de Séquence

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant B as Backend
    participant DB as Base de données

    U->>F: 1. Accède à "Mes fichiers"
    
    F->>B: 2. GET /api/files?page=0&size=20<br/>Authorization: Bearer <token>
    
    B->>B: 3. Extraction userId du JWT
    
    B->>DB: 4. SELECT * FROM files<br/>WHERE user_id = ? ORDER BY created_at DESC
    DB-->>B: Liste des fichiers
    
    B->>B: 5. Calcul état pour chaque fichier
    Note over B: isExpired = expirationDate < NOW()<br/>hasPassword = passwordHash IS NOT NULL
    
    B-->>F: 6. HTTP 200 OK
    Note over B,F: {files: [{id, originalFilename,<br/>fileSize, downloadLink,<br/>expirationDate, isExpired,<br/>hasPassword, createdAt}, ...],<br/>totalElements, totalPages, ...}
    
    F->>U: 7. Affichage liste fichiers
    Note over F: Pour chaque fichier :<br/>- Nom<br/>- Taille<br/>- État (expire dans X jours / Expiré)<br/>- Icône cadenas si protégé<br/>- Boutons : Accéder, Supprimer
```

---

## 📝 Étapes Détaillées

| Étape | Action utilisateur | Réponse système | Écran |
|-------|-------------------|-----------------|-------|
| 1 | Clique sur "Mes fichiers" dans le menu | Affiche loader | Dashboard |
| 2 | - | Requête API avec pagination | - |
| 3 | - | Extraction JWT et validation | - |
| 4 | - | Récupération fichiers en base | - |
| 5 | - | Calcul état (expiré, protégé) | - |
| 6 | - | Retour JSON avec fichiers | - |
| 7 | Visualise la liste | Affichage tableau/grille | Page historique |

---

## 📦 Structure de la Réponse API

### Endpoint
```http
GET /api/files?page=0&size=20&sort=createdAt,desc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Réponse Success (200 OK)
```json
{
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalFilename": "rapport_2025.pdf",
      "fileSize": 2048576,
      "downloadLink": "https://api.datashare.com/download/abc123def456",
      "expirationDate": "2025-02-15T10:30:00Z",
      "isExpired": false,
      "hasPassword": true,
      "createdAt": "2025-01-15T10:30:00Z",
      "downloadCount": 12
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "originalFilename": "photo_vacances.jpg",
      "fileSize": 5242880,
      "downloadLink": "https://api.datashare.com/download/xyz789ghi012",
      "expirationDate": "2025-01-16T08:00:00Z",
      "isExpired": false,
      "hasPassword": false,
      "createdAt": "2024-12-10T08:00:00Z",
      "downloadCount": 3
    }
  ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 42,
    "totalPages": 3
  }
}
```

---

## 🎨 Affichage des Fichiers

### Informations affichées par fichier

### États possibles

| État | Icône | Couleur | Condition |
|------|-------|---------|-----------|
| **Actif** | ✅ | Vert | `expirationDate > now()` |
| **Expire bientôt** | ⚠️ | Orange | `expirationDate - now() < 3 jours` |
| **Expiré** | ❌ | Rouge | `expirationDate < now()` |
| **Protégé** | 🔒 | Bleu | `hasPassword = true` |

---

## ⚠️ Cas d'Erreur

### A. Utilisateur non authentifié

!!! danger "Erreur 401 Unauthorized"
    ```json
    {
      "error": "Unauthorized",
      "message": "Token JWT manquant ou invalide",
      "timestamp": "2025-01-15T10:30:00Z"
    }
    ```
    **Action frontend** : Redirection vers `/login`

### B. Token expiré

!!! warning "Erreur 401 Unauthorized"
    ```json
    {
      "error": "Unauthorized",
      "message": "Token JWT expiré",
      "timestamp": "2025-01-15T10:30:00Z"
    }
    ```
    **Action frontend** : Redirection vers `/login` avec message "Session expirée"

### C. Aucun fichier uploadé

!!! info "Liste vide"
    ```json
    {
      "files": [],
      "pagination": {
        "page": 0,
        "size": 20,
        "totalElements": 0,
        "totalPages": 0
      }
    }
    ```
    **Affichage frontend** :
    ```
    ┌────────────────────────────────────┐
    │  📂 Aucun fichier uploadé         │
    │                                    │
    │  Commencez par uploader           │
    │  votre premier fichier !           │
    │                                    │
    │  [➕ Uploader un fichier]         │
    └────────────────────────────────────┘
    ```

---

## 🔐 Sécurité

!!! success "Mesures de sécurité appliquées"
    - ✅ JWT obligatoire dans header `Authorization: Bearer <token>`
    - ✅ Filtrage par `userId` extrait du JWT (pas du body/params)
    - ✅ Pagination limitée à 100 éléments max par page
    - ✅ CORS restreint aux origines autorisées

---

## 🧪 Critères d'Acceptation

!!! tip "Tests à valider"
    - [ ] La liste des fichiers s'affiche correctement
    - [ ] Les fichiers sont triés par date de création (plus récent en premier)
    - [ ] L'état (actif/expiré) est calculé correctement
    - [ ] Les fichiers protégés affichent l'icône 🔒
    - [ ] La pagination fonctionne (navigation page précédente/suivante)
    - [ ] Le compteur de téléchargements est affiché
    - [ ] Le bouton "Copier le lien" copie l'URL dans le presse-papier
    - [ ] Le bouton "Supprimer" déclenche une confirmation avant suppression
    - [ ] Une erreur 401 redirige vers la page de connexion
    - [ ] Un message approprié s'affiche si aucun fichier n'est uploadé
    - [ ] Les informations de fichier (taille, date) sont formatées lisiblement
