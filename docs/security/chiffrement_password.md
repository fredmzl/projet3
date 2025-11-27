# Chiffrement des Mots de Passe

## 🔐 Algorithme : bcrypt

### Pourquoi bcrypt ?

!!! success "Avantages"
    - ✅ **Salage automatique** : Chaque hash est unique même avec le même mot de passe
    - ✅ **Coût adaptatif** : Paramètre de "rounds" ajustable selon la puissance CPU
    - ✅ **Lent par design** : Résistant aux attaques par force brute
    - ✅ **Standard éprouvé** : Utilisé depuis 1999, résistant aux attaques modernes

### Alternatives écartées

!!! danger "Algorithmes non sécurisés"
    - ❌ **MD5/SHA1** : Cassés, ne doivent JAMAIS être utilisés pour les mots de passe
    - ❌ **SHA-256** : Trop rapide, vulnérable aux attaques par force brute

!!! info "Alternative moderne"
    - ⚠️ **Argon2** : Plus récent et théoriquement meilleur, mais bcrypt largement suffisant pour MVP

---

## ⚙️ Configuration

### Paramètres bcrypt

**Nombre de rounds** : `10` (par défaut)
:   - Balance entre sécurité et performance
    - Temps de hachage : ~100ms
    - 2^10 = 1024 itérations

**Format du hash**
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
 │  │  │                  22 chars                 │       31 chars
 │  │  └─ Salt (128 bits)                          └─ Hash (184 bits)
 │  └─ Cost factor (10)
 └─ Version (2a)
```

---

## 🔒 Bonnes Pratiques

!!! tip "Recommandations"
    - ✅ Toujours hasher côté serveur (jamais côté client uniquement)
    - ✅ Ne jamais logger les mots de passe en clair
    - ✅ Utiliser HTTPS pour transmettre les mots de passe
    - ✅ Forcer une longueur minimale (8 caractères minimum)
    - ✅ Encourager l'utilisation de mots de passe complexes

!!! warning "À ne jamais faire"
    - ❌ Stocker les mots de passe en clair
    - ❌ Utiliser le même salt pour tous les utilisateurs
    - ❌ Hasher côté client sans re-hasher côté serveur
    - ❌ Envoyer les mots de passe par email

---

## 🛡️ Protection Additionnelle

### Rate Limiting
- Limitation du nombre de tentatives de connexion
- Blocage temporaire après 5 échecs consécutifs
- Prévention des attaques par force brute

### Validation des mots de passe
```javascript
// Règles minimales
- Longueur : 8-64 caractères
- Au moins 1 lettre majuscule
- Au moins 1 lettre minuscule  
- Au moins 1 chiffre
- Caractères spéciaux recommandés
```