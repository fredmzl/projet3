# US06 - Suppression d'un Fichier

## 📋 Description

**User Story :** En tant qu'utilisateur authentifié, je veux supprimer définitivement un de mes fichiers pour libérer de l'espace ou retirer un partage.

!!! info "Informations"
    **Acteur** : Utilisateur authentifié  
    **Objectif** : Supprimer un fichier avant son expiration  
    **Prérequis** : Authentifié, être propriétaire du fichier  
    **Résultat attendu** : Fichier supprimé (physique + métadonnées)

---

## 🔄 Diagramme de Séquence

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend
    participant B as Backend
    participant FS as File System
    participant DB as Base de données

    U->>F: 1. Consulte l'historique
    F->>U: Affiche liste fichiers
    
    U->>F: 2. Clique "Supprimer" sur un fichier
    
    F->>U: 3. Affiche confirmation
    Note over F: "Êtes-vous sûr de vouloir<br/>supprimer ce fichier ?<br/>Cette action est irréversible."<br/>[Annuler] [Confirmer]
    
    U->>F: 4. Clique "Confirmer"
    
    F->>B: 5. DELETE /api/files/{fileId}<br/>Authorization: Bearer <token>
    
    B->>B: 6. Extraction userId du JWT
    
    B->>DB: 7. SELECT * FROM files WHERE id = ?
    DB-->>B: Fichier trouvé {userId, filepath, ...}
    
    B->>B: 8. Vérification propriété
    Note over B: file.userId === currentUserId
    
    alt Propriétaire
        B->>FS: 9. Suppression fichier physique
        Note over FS: Files.deleteIfExists(filepath)
        FS-->>B: Fichier supprimé
        
        B->>DB: 10. DELETE FROM files WHERE id = ?
        DB-->>B: Métadonnées supprimées
        
        B-->>F: 11. HTTP 204 No Content
        
        F->>F: 12. Retrait fichier de la liste
        
        F->>U: 13. Message succès (toast)
        Note over F: "Fichier supprimé avec succès"
        
    else Pas propriétaire
        B-->>F: HTTP 403 Forbidden
        F->>U: Message erreur
    end
```

---

## 📝 Étapes Détaillées

| Étape | Action utilisateur | Réponse système | Écran |
|-------|-------------------|-----------------|-------|
| 1 | Clique bouton "Supprimer" | Affiche modal de confirmation | Modal |
| 2 | Lit l'avertissement | - | - |
| 3 | Clique "Confirmer" | Désactive boutons, affiche loader | - |
| 4 | - | Suppression backend (fichier + BDD) | - |
| 5 | - | Fichier retiré de la liste | Historique mis à jour |
| 6 | - | Notification succès affichée | Toast notification |

---

## 📦 API Endpoint

### DELETE /api/files/{fileId}
**Description** : Supprime définitivement un fichier et ses métadonnées

**Headers :**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Path Parameters :**
- `fileId` : UUID du fichier à supprimer

**Réponse Success (204 No Content) :**
```http
HTTP/1.1 204 No Content
```
_Pas de body. Le fichier et ses métadonnées ont été supprimés avec succès._

---

## ⚠️ Cas d'Erreur

### A. Tentative de suppression d'un fichier d'un autre utilisateur

!!! danger "Erreur 404 Not Found (masque 403 pour sécurité)"
    **Scénario :**
    ```
    Utilisateur A tente : DELETE /api/files/file-de-utilisateur-B
         ↓
    Backend vérifie : file.userId !== currentUserId
         ↓
    Response : HTTP 404 Not Found (masque 403)
    ```
    
    **Réponse API :**
    ```json
    {
      "error": "Not Found",
      "message": "Fichier non trouvé"
    }
    ```
    
    !!! warning "Note de sécurité"
        Retourner `404` au lieu de `403` empêche l'énumération des fichiers existants. Un attaquant ne peut pas déterminer si un fichier existe mais appartient à quelqu'un d'autre.

---

### B. Fichier déjà supprimé (Race Condition)

!!! warning "Erreur 404 Not Found"
    **Scénario :**
    ```
    1. Utilisateur clique "Supprimer"
    2. Pendant la requête, le fichier expire et est auto-supprimé
    3. Backend : SELECT * FROM files WHERE id = ?
    4. Résultat : Aucun fichier trouvé
    ```
    
    **Réponse API :**
    ```json
    {
      "error": "Not Found",
      "message": "Fichier non trouvé"
    }
    ```
---

### C. Erreur de suppression du fichier physique

!!! danger "Stratégie de gestion des erreurs"
    **Scénario :**
    ```
    1. Suppression métadonnées en BDD : ✅ OK
    2. Tentative suppression fichier physique
    3. Exception : IOException (permissions, fichier verrouillé, etc.)
    ```
    
    **Stratégie recommandée (souple) :**
    
    1. **Logger l'erreur** pour traçabilité
       ```java
       log.error("Failed to delete physical file: {}", filepath, exception);
       ```
    
    2. **Retourner quand même HTTP 204**  
       _Métadonnées supprimées = fichier "logiquement" supprimé_
    
    3. **Tâche de nettoyage périodique**  
       Un job cron supprime les fichiers orphelins
    
    **Stratégie alternative (stricte) :**
    
    1. **Rollback transaction** (si transactionnelle)
    2. **Retourner HTTP 500 Internal Server Error**
       ```json
       {
         "error": "Internal Server Error",
         "message": "Impossible de supprimer le fichier"
       }
       ```

---

### D. Utilisateur non authentifié

!!! danger "Erreur 401 Unauthorized"
    ```json
    {
      "error": "Unauthorized",
      "message": "Token JWT manquant ou invalide"
    }
    ```
    **Action frontend** : Redirection vers `/login`

---

## 🔐 Sécurité

!!! success "Mesures de sécurité appliquées"
    - ✅ JWT obligatoire dans header `Authorization: Bearer <token>`
    - ✅ Vérification de propriété (`userId` extrait du JWT)
    - ✅ Retour 404 au lieu de 403 (prévention énumération)
    - ✅ Confirmation obligatoire côté frontend (modal)
    - ✅ Rate limiting : 20 suppressions par heure par utilisateur
    - ✅ Logging de toutes les suppressions (audit trail)
    - ✅ Transaction atomique (BDD) si possible

---

## 🗑️ Gestion des Fichiers Orphelins

!!! info "Nettoyage automatique"
    ### Job de nettoyage périodique
    
    **Tâche cron quotidienne** pour supprimer les fichiers physiques orphelins :
    
    ```java
    @Scheduled(cron = "0 0 2 * * *") // Tous les jours à 2h du matin
    public void cleanOrphanFiles() {
        // 1. Lister tous les fichiers sur le disque
        List<Path> physicalFiles = listAllFilesInStorage();
        
        // 2. Récupérer tous les filepath en base
        List<String> dbFilepaths = fileRepository.findAllFilepaths();
        
        // 3. Identifier les orphelins
        List<Path> orphans = physicalFiles.stream()
            .filter(file -> !dbFilepaths.contains(file.toString()))
            .collect(Collectors.toList());
        
        // 4. Supprimer les orphelins
        orphans.forEach(orphan -> {
            try {
                Files.deleteIfExists(orphan);
                log.info("Orphan file deleted: {}", orphan);
            } catch (IOException e) {
                log.error("Failed to delete orphan: {}", orphan, e);
            }
        });
    }
    ```
    
    ### Métriques
    - Nombre de fichiers orphelins trouvés
    - Nombre de fichiers orphelins supprimés avec succès
    - Nombre d'échecs de suppression

---

## 📊 Logging et Audit

!!! tip "Traçabilité des suppressions"
    Chaque suppression est enregistrée pour audit :
    
    ```java
    log.info("File deletion - User: {}, FileId: {}, Filename: {}, Size: {}, Timestamp: {}", 
        userId, fileId, filename, fileSize, LocalDateTime.now());
    ```
    
    **Informations enregistrées :**
    - `userId` : ID de l'utilisateur
    - `fileId` : UUID du fichier
    - `filename` : Nom du fichier
    - `fileSize` : Taille du fichier
    - `timestamp` : Date/heure de suppression
    - `ipAddress` : IP de l'utilisateur
    - `success` : Succès ou échec

---

## 🧪 Critères d'Acceptation

!!! tip "Tests à valider"
    - [ ] La modal de confirmation s'affiche lors du clic sur "Supprimer"
    - [ ] Le fichier physique est supprimé du File System
    - [ ] Les métadonnées sont supprimées de la base de données
    - [ ] Le fichier disparaît de la liste de l'historique
    - [ ] Un message de succès est affiché (toast)
    - [ ] Un utilisateur ne peut pas supprimer le fichier d'un autre (404)
    - [ ] Une erreur 401 redirige vers la page de connexion
    - [ ] La suppression est enregistrée dans les logs (audit)
    - [ ] Le lien de téléchargement ne fonctionne plus après suppression
    - [ ] Une tentative de suppression d'un fichier déjà supprimé retourne 404
    - [ ] Le rate limiting empêche les suppressions en masse
    - [ ] Les fichiers orphelins sont nettoyés par le job périodique
