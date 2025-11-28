# Ensemble des tests

!!! info "Prise en main rapide"
    Afin de faciliter la prise en main et la validation de l'application, plusieurs ressources ont été mises à disposition :  
      
    - Des scripts de déploiement, création de données de démo ont été fournis pour initialiser rapidement l'application avec des utilisateurs et fichiers exemples. cf. [Quick Start Guide](index.md)  
      
    - une série de tests manuels QA a été élaborée. Ces tests couvrent les fonctionnalités principales et permettent de vérifier le bon fonctionnement de l'application dans divers scénarios d'utilisation. 

## Tests QA manuels 

Les tests manuels QA ciblent directement l'API backend via des requêtes cURL. Ces tests sont, pour la plupart, transposables au test via le frontend en utilisant les jeux de données décrits pour chaque test.  
Ces tests permettront une montée en compétences rapide de l'équipe sur le fonctionnement de l'application, ainsi qu'un moyen efficace de debug pour le support et le troubleshooting.

### Tableau des tests manuels QA
| US | tests manuels QA |  
| --- | --- |   
| US01 - Téléchargement de fichiers | [Tests manuels QA - US01](partials/tests/curl-tests-download-file.md){:target="_blank"} |  
| US02 - Création de comptes utilisateurs | [Tests manuels QA - US02](partials/tests/curl-tests-account-creation.md){:target="_blank"} |  
| US03 - Authentification utilisateur | [Tests manuels QA - US03](partials/tests/curl-tests-user-login.md){:target="_blank"} |    
| US04 - Téléversement de fichiers | [Tests manuels QA - US04](partials/tests/curl-tests-upload-file.md){:target="_blank"} |
| US05 - Historique des fichiers | [Tests manuels QA - US05](partials/tests/curl-tests-list-files.md){:target="_blank"} |
| US06 - Suppression de fichiers | [Tests manuels QA - US06](partials/tests/curl-tests-delete-file.md){:target="_blank"} |



## Tests Backend

### Couverture de code (JaCoCo)

Le rapport de couverture de code est généré automatiquement lors de l'exécution des tests.

[📊 Voir le rapport de couverture JaCoCo](backend-reports/index.html){:target="_blank"}

#### Génération du rapport

Pour générer le rapport de couverture :

```bash
mise dev:backend:tests:coverage
```

Le rapport sera disponible dans `backend/target/site/jacoco/index.html` et accessible via cette documentation.

### Plan de tests

[Plan de tests - Authentification](partials/tests/plan-tests-authentication.md){:target="_blank"}

### Exécution des tests

#### Tests unitaires et d'intégration

```bash
# Tous les tests
mise dev:backend:tests:all

# Tests avec rapport de couverture
mise dev:backend:tests:coverage
```

#### Seuil de couverture

Le projet impose un seuil minimum de **80% de couverture de code** (configuration JaCoCo dans `pom.xml`).

---

## Tests Frontend

### Couverture de code (Karma)

Le rapport de couverture de code est généré automatiquement lors de l'exécution des tests avec couverture.

[📊 Voir le rapport de couverture Karma](frontend-reports/index.html){:target="_blank"}

#### Génération du rapport

Pour générer le rapport de couverture :

```bash
mise dev:frontend:tests:coverage
```

Le rapport sera disponible dans `frontend/coverage/frontend/index.html`.

### Plan de tests

[Plan de tests - Frontend Angular](partials/tests/plan-tests-frontend.md){:target="_blank"}

### Exécution des tests

#### Tests unitaires et d'intégration

```bash
# Tous les tests (single run)
mise dev:frontend:tests:all

# Tests avec rapport de couverture
mise dev:frontend:tests:coverage

# Mode développement (watch)
cd frontend && npm test
```



