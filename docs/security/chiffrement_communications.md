!!! warning "Chiffrement des communications"
    Cette section est en cours de rédaction et sera complétée prochainement avec des détails sur les protocoles et pratiques de chiffrement utilisés pour sécuriser les communications entre le client et le serveur.

### Pourquoi HTTPS ?

!!! success "Avantages"
    - ✅ **Confidentialité** : Chiffrement TLS des données en transit
    - ✅ **Intégrité** : Protection contre la modification (Man-in-the-Middle)
    - ✅ **Authenticité** : Vérification de l'identité du serveur (certificat SSL/TLS)

!!! danger "Obligation en production"
    **HTTPS est OBLIGATOIRE en production** pour :
    
    - Transmission des mots de passe
    - Transmission des tokens JWT
    - Upload/download de fichiers
    - Toutes les communications contenant des données sensibles

---

## 🛡️ Configuration TLS

### Version du protocole

**TLS 1.2 minimum** (TLS 1.3 recommandé)
:   - TLS 1.0 et 1.1 sont dépréciés et vulnérables
    - TLS 1.2 : Standard actuel largement supporté
    - TLS 1.3 : Version la plus récente, plus rapide et sécurisée

### Certificats SSL/TLS

**Environnement de développement**
:   - Certificat auto-signé acceptable
    - Configuration locale pour tests

**Environnement de production**
:   - Certificat signé par une autorité de certification (CA) reconnue
    - Let's Encrypt (gratuit, automatisé)
    - Renouvellement automatique recommandé

---
