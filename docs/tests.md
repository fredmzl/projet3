# Rapports de tests

## Tests Backend

### Couverture de code (JaCoCo)

Le rapport de couverture de code est généré automatiquement lors de l'exécution des tests.

[📊 Voir le rapport de couverture JaCoCo](backend-reports/index.html){:target="_blank"}

#### Génération du rapport

Pour générer le rapport de couverture :

```bash
mise run backend:coverage
```

Le rapport sera disponible dans `backend/target/site/jacoco/index.html` et accessible via cette documentation.

### Plan de tests

[Plan de tests - Authentification](partials/tests/plan-tests-authentication.md){:target="_blank"}

### Exécution des tests

#### Tests unitaires et d'intégration

```bash
# Tous les tests
mise run backend:test

# Tests avec rapport de couverture
mise run backend:coverage
```

#### Types de tests

- **Tests unitaires** : UserServiceTest, JwtServiceTest (avec Mockito)
- **Tests d'intégration** : UserControllerTest (avec Testcontainers + PostgreSQL)

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
mise run frontend:tests:coverage
```

Le rapport sera disponible dans `frontend/coverage/frontend/index.html`.

### Plan de tests

[Plan de tests - Frontend Angular](partials/tests/plan-tests-frontend.md){:target="_blank"}

### Exécution des tests

#### Tests unitaires et d'intégration

```bash
# Tous les tests (single run)
mise run frontend:tests:all

# Tests avec rapport de couverture
mise run frontend:tests:coverage

# Mode développement (watch)
cd frontend && npm test
```

#### Types de tests

- **Tests unitaires** : AuthService, RegisterComponent, LoginComponent, AuthGuard
- **Tests d'intégration** : User flows (inscription → connexion → navigation)
- **Tests composants UI** : Header, Footer, Callout

#### Résultats

- **Total** : 172 tests ✅
- **Couverture** : ~90%
- **Temps d'exécution** : ~3.5 secondes
