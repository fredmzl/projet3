# Tests E2E - US04 Upload de fichiers

## Prérequis

1. **Backend** : Le backend doit être lancé sur le port 3000
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

2. **Base de données** : Créer l'utilisateur de test
   ```bash
   cd backend
   ./seed-test-data.sh
   ```
   
   Cela créera l'utilisateur : `testuser@example.net` / `password`

3. **Frontend** : Les dépendances Playwright doivent être installées
   ```bash
   cd frontend
   npm install
   ```

## Lancer les tests

### Mode headless (CI)
```bash
cd frontend
npm run e2e
```

### Mode UI interactif
```bash
npm run e2e:ui
```

### Mode headed (voir le navigateur)
```bash
npm run e2e:headed
```

### Mode debug
```bash
npm run e2e:debug
```

## Tests couverts

Les tests E2E pour l'US04 couvrent les scénarios suivants :

1. ✅ **Affichage de la page files** - Vérification de l'état vide
2. ✅ **Ouverture du modal** - Clic sur "Ajouter des fichiers"
3. ✅ **Upload simple** - Sélection et upload d'un fichier
4. ✅ **Upload avec options** - Mot de passe + expiration personnalisée
5. ✅ **Validation mot de passe** - Minimum 6 caractères
6. ✅ **Erreur fichier trop gros** - Gestion erreur 413
7. ✅ **Erreur type MIME** - Gestion erreur 400
8. ✅ **Fermeture du modal** - Après succès
9. ✅ **Annulation** - Bouton annuler
10. ✅ **Drag & drop** - Interface de glisser-déposer

## Structure des tests

```
frontend/
├── e2e/
│   ├── fixtures/
│   │   └── test-file.txt       # Fichier de test pour les uploads
│   └── us04-file-upload.spec.ts # Suite de tests E2E
├── playwright.config.ts         # Configuration Playwright
└── package.json                 # Scripts npm
```

## Résultats

Après exécution, un rapport HTML est généré :
```bash
npx playwright show-report
```

Les screenshots des échecs sont sauvegardés dans `test-results/`.

## Troubleshooting

### Le login échoue
- Vérifier que l'utilisateur existe : `./backend/seed-test-data.sh`
- Vérifier que le backend est accessible : `curl http://localhost:3000/actuator/health`

### Les tests timeout
- Augmenter le timeout dans `playwright.config.ts`
- Vérifier que le frontend démarre bien sur le port 4200

### Le fichier de test n'est pas trouvé
- Vérifier que `e2e/fixtures/test-file.txt` existe
