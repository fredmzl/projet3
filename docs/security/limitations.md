# Limites et Protections

## 📏 Limites sur l'Upload de Fichiers

### Restrictions appliquées

| Limite | Valeur | Justification |
|--------|--------|---------------|
| **Taille max par fichier** | 1 GB | Équilibre stockage/usage (freelances/PME) |
| **Nombre de fichiers simultanés** | 1 | Simplification MVP (pas de multi-upload) |
| **Types de fichiers** | Tous autorisés | Flexibilité max (validation MIME côté serveur) |
| **Durée max d'expiration** | 7 jours | Contrainte métier (nettoyage automatique) |

!!! warning "Validation des types de fichiers"
    Bien que tous les types soient autorisés, la validation MIME côté serveur est obligatoire pour :
    
    - Détecter les fichiers malveillants
    - Vérifier la cohérence extension/contenu
    - Bloquer les types dangereux (exécutables)

---

## 🚦 Rate Limiting - Protection contre les Abus

### Objectifs

!!! danger "Menaces protégées"
    - **Attaques par force brute** (login)
    - **Spam d'upload** de fichiers
    - **Déni de service** (DoS)
    - **Énumération** de ressources

### Stratégie de Rate Limiting

| Endpoint | Limite | Fenêtre | Action si dépassement |
|----------|--------|---------|----------------------|
| `POST /api/auth/login` | 5 tentatives | 15 minutes | HTTP 429 + Blocage temporaire |
| `POST /api/auth/register` | 3 comptes | 1 heure | HTTP 429 |
| `POST /api/files` (upload) | 10 uploads | 1 heure | HTTP 429 |
| `GET /api/files` | 100 requêtes | 1 minute | HTTP 429 |
| `POST /api/download/{token}` | 50 téléchargements | 1 heure | HTTP 429 |

## ⏱️ Timeouts

### Configuration des timeouts

```yaml
# application.yml
spring:
  mvc:
    async:
      request-timeout: 30000  # 30 secondes pour upload
      
server:
  tomcat:
    connection-timeout: 20000  # 20 secondes pour connexion
    threads:
      max: 200
      min-spare: 10
```

### Timeouts par opération

| Opération | Timeout | Justification |
|-----------|---------|---------------|
| Upload fichier | 5 minutes | Fichiers jusqu'à 1GB |
| Download fichier | 5 minutes | Fichiers volumineux |
| Requête API standard | 30 secondes | Opérations CRUD |
| Connexion DB | 10 secondes | Éviter blocages prolongés |

---

## 🔍 Monitoring et Logs

### Événements à logger

!!! tip "Logs de sécurité"
    - ✅ Tentatives de connexion échouées
    - ✅ Rate limit atteint (IP + endpoint)
    - ✅ Upload de fichiers suspects
    - ✅ Accès refusés (403/401)
    - ✅ Tokens JWT invalides/expirés
    - ✅ Path traversal détecté

### Exemple de log structuré

```json
{
  "timestamp": "2025-11-14T10:30:00Z",
  "level": "WARN",
  "event": "RATE_LIMIT_EXCEEDED",
  "endpoint": "/api/auth/login",
  "ip": "192.168.1.100",
  "userId": null,
  "remainingRetries": 0,
  "resetTime": "2025-11-14T10:45:00Z"
}
```

---

## ✅ Bonnes Pratiques

!!! success "Recommandations"
    - ✅ Combiner rate limiting par IP + par utilisateur authentifié
    - ✅ Adapter les limites selon les endpoints critiques
    - ✅ Retourner des headers informatifs (remaining, reset)
    - ✅ Logger les dépassements pour analyse
    - ✅ Prévoir des exceptions pour tests/monitoring
    - ✅ Tester la configuration en environnement de staging

!!! warning "À éviter"
    - ❌ Limites trop strictes (frustration utilisateurs légitimes)
    - ❌ Limites trop laxistes (abus possibles)
    - ❌ Pas de monitoring des rate limits
    - ❌ Bloquer définitivement sans possibilité de déblocage