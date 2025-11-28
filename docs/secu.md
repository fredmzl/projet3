## Datashare - Sécurité de l'usine logicielle

Cette documentation décrit les pratiques et outils utilisés pour assurer la sécurité de l'usine logicielle du projet DataShare, couvrant à la fois le backend (Java/Spring Boot/Maven), le frontend (Angular/TypeScript/NPM) et les images dockers.

### 1. Scan Dépendances Backend - OWASP Dependency-Check

??? info "Téléchargement base de données NVD"    
    **note** : Le téléchargement de la base de données NVD peut prendre plusieurs minutes lors du premier scan.   
    Si vous avez une clef API NVD, vous pouvez la configurer dans la variable d'environnement `NVD_API_KEY` pour éviter les limitations de requêtes.  
    la tache mise charge automatiquement cette variable d'environnement depuis le fichier `backend/.env.secrets`.  

#### Commande exécutée
```bash
cd backend
mise dev:backend:cve
```

#### Rapport généré
Le rapport HTML est généré dans `backend/target/dependency-check-report.html`.  
[📊 Voir le rapport de scan dépendances OWASP Dependency-Check](backend-cve.html){:target="_blank"}

### Cas pratique : Correction CVE-2021-26291 (maven-core)
Voir le document détaillé : [Cas Pratique : Correction CVE-2021-26291 (maven-core)](partials/security/cve-maven-core.md){:target="_blank"}
