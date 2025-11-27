# Rapports de tests

## Couverture de code (JaCoCo)

Le rapport de couverture de code est généré automatiquement lors de l'exécution des tests.

[📊 Voir le rapport de couverture JaCoCo](reports/index.html){:target="_blank"}

### Génération du rapport

Pour générer le rapport de couverture :

```bash
mise run backend:coverage
```

Le rapport sera disponible dans `backend/target/site/jacoco/index.html` et accessible via cette documentation.

## Plan de tests

[Plan de tests - Authentification](partials/tests/plan-tests-authentication.md){:target="_blank"}

## Exécution des tests

### Tests unitaires et d'intégration

```bash
# Tous les tests
mise run backend:test

# Tests avec rapport de couverture
mise run backend:coverage
```

### Types de tests

- **Tests unitaires** : UserServiceTest, JwtServiceTest (avec Mockito)
- **Tests d'intégration** : UserControllerTest (avec Testcontainers + PostgreSQL)

### Seuil de couverture

Le projet impose un seuil minimum de **80% de couverture de code** (configuration JaCoCo dans `pom.xml`).
