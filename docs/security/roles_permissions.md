# Gestion des Rôles et Permissions

## 🔑 Modèle de Permissions Simplifié

DataShare utilise un modèle binaire pour le MVP :

!!! info "Niveaux d'accès"
    **Anonyme**
    :   Accès aux endpoints publics uniquement
    
    **Authentifié**
    :   - Accès à tous les endpoints
        - Gestion de ses propres fichiers

!!! note "Simplification MVP"
    Pas de système de rôles complexes (Admin, User, Guest, etc.)

---

## 🛡️ Contrôle d'Accès par Ressource

!!! abstract "Principe fondamental"
    Un utilisateur ne peut accéder qu'à **SES PROPRES fichiers**.

### Matrice de permissions

| Action | Anonyme | Propriétaire | Autre utilisateur |
|--------|---------|--------------|-------------------|
| Upload fichier | ❌ | ✅ | ❌ |
| Voir liste fichiers | ❌ | ✅ (ses fichiers) | ❌ |
| Voir détails fichier | ❌ | ✅ (son fichier) | ❌ |
| Supprimer fichier | ❌ | ✅ (son fichier) | ❌ |
| Télécharger via token | ✅ (si lien valide) | ✅ | ✅ (si lien valide) |

---

## 🚨 Codes HTTP de Sécurité

| Code | Signification | Cas d'usage |
|------|---------------|-------------|
| **401 Unauthorized** | Non authentifié | Token manquant/invalide/expiré |
| **403 Forbidden** | Authentifié mais non autorisé | Tentative d'accès au fichier d'un autre |
| **404 Not Found** | Ressource inexistante | Fichier non trouvé (masque aussi 403) |

!!! warning "Bonne pratique de sécurité"
    **Retourner 404 plutôt que 403** quand un utilisateur tente d'accéder au fichier d'un autre.
    
    ➡️ **Empêche l'énumération** : impossible de savoir si un fichier existe ou non