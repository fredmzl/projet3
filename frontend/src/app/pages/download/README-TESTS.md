# Tests US01 - Téléchargement via lien public

## Vue d'ensemble

L'implémentation de l'US01 comprend **80 tests automatisés** couvrant le service, le composant et les scénarios E2E.

## Structure des tests

### Tests unitaires (80 tests)

#### DownloadService (36 tests)
- **Emplacement**: `src/app/core/services/download.service.spec.ts`
- **Couverture**:
  - Initialisation du service
  - `getFileInfo()`: Récupération métadonnées (public, protégé, expiré)
  - `downloadFile()`: Téléchargement avec/sans mot de passe
  - `saveFile()`: Déclenchement téléchargement navigateur
  - `formatFileSize()`: Formatage taille (octets, Ko, Mo, Go)
  - `getDaysUntilExpiration()`: Calcul jours restants
  - Gestion erreurs HTTP (404, 410, 401)
  - Cas limites (fichiers volumineux, noms spéciaux)

**Commande**:
```bash
npm test -- --include='**/download.service.spec.ts' --watch=false
```

#### DownloadComponent (44 tests)
- **Emplacement**: `src/app/pages/download/download.component.spec.ts`
- **Couverture**:
  - Initialisation composant
  - Extraction token depuis route
  - Chargement informations fichier
  - Affichage conditionnel champ mot de passe
  - Validation formulaire
  - Téléchargement (public et protégé)
  - Gestion erreurs (404, 410, 401, 500)
  - Messages d'expiration
  - États de chargement et téléchargement
  - Cas limites (noms longs, caractères spéciaux)

**Commande**:
```bash
npm test -- --include='**/download.component.spec.ts' --watch=false
```

#### Tous les tests US01
```bash
npm test -- --include='**/download*.spec.ts' --watch=false
```

### Tests E2E - Playwright (14 tests)

#### us01-file-download.spec.ts
- **Emplacement**: `e2e/us01-file-download.spec.ts`
- **Scénarios testés**:
  1. ✅ Affichage informations fichier public (nom, taille, expiration)
  2. ✅ Téléchargement fichier public
  3. ✅ Affichage champ mot de passe pour fichier protégé
  4. ✅ Refus téléchargement avec mauvais mot de passe
  5. ✅ Téléchargement fichier protégé avec bon mot de passe
  6. ✅ Affichage erreur pour fichier expiré (410)
  7. ✅ Affichage erreur pour token invalide (404)
  8. ✅ Validation formulaire mot de passe
  9. ✅ Affichage icône fichier
  10. ✅ Vérification gradient couleur
  11. ✅ Responsive (mobile)
  12. ✅ Spinner pendant chargement
  13. ✅ État téléchargement en cours
  14. ✅ Gestion erreurs réseau

**Prérequis**:
- Backend démarré (`cd backend && mvn spring-boot:run`)
- Frontend démarré (`cd frontend && npm start`)
- Données de démo (`mise app:dev:bootstrap`)

**Note importante**: Les tokens dans le fichier E2E doivent être mis à jour après chaque `bootstrap`. Pour obtenir les nouveaux tokens :
```bash
cd backend
docker compose exec -T postgresql psql -U db_user -d datashare -c \
  "SELECT download_token, original_filename FROM files f \
   JOIN users u ON f.user_id = u.id \
   WHERE u.login = 'alice@example.com' ORDER BY original_filename;"
```

Mettre à jour les tokens dans `e2e/us01-file-download.spec.ts` (lignes 15-19).

**Commande**:
```bash
# Tous les tests E2E US01
npx playwright test e2e/us01-file-download.spec.ts

# Mode UI (interactif)
npx playwright test e2e/us01-file-download.spec.ts --ui

# Mode headed (voir le navigateur)
npx playwright test e2e/us01-file-download.spec.ts --headed

# Un test spécifique
npx playwright test e2e/us01-file-download.spec.ts -g "devrait télécharger un fichier public"
```

## Résultats des tests

### Tests unitaires
```
✅ DownloadService: 36/36 SUCCESS
✅ DownloadComponent: 44/44 SUCCESS
---
TOTAL: 80/80 SUCCESS (100%)
```

### Tests E2E
```
✅ 14 scénarios complets testés
✅ Couverture des 3 cas d'usage principaux:
   - Fichier public
   - Fichier protégé par mot de passe
   - Fichier expiré
```

## Cas de test principaux

### 1. Fichier public
- **Token**: Voir bootstrap output
- **Fichier**: `report.txt` (257 octets)
- **État**: Valide, expire dans 7 jours
- **Mot de passe**: Non
- **Tests**: Affichage infos + téléchargement

### 2. Fichier protégé
- **Token**: Voir bootstrap output
- **Fichier**: `secret-notes.md` (271 octets)
- **État**: Valide, expire dans 7 jours
- **Mot de passe**: `password`
- **Tests**: Validation mot de passe + téléchargement

### 3. Fichier expiré
- **Token**: Voir bootstrap output
- **Fichier**: `old-document.txt` (121 octets)
- **État**: Expiré (hier)
- **Mot de passe**: Non
- **Tests**: Affichage erreur 410

## Couverture des tests

- ✅ **Service HTTP**: getFileInfo, downloadFile (36 tests)
- ✅ **Composant Angular**: Formulaire, validation, états (44 tests)
- ✅ **Intégration E2E**: Scénarios utilisateur complets (14 tests)
- ✅ **Gestion erreurs**: 404, 410, 401, 500, réseau
- ✅ **Cas limites**: Fichiers volumineux, noms spéciaux, responsive

## CI/CD

Les tests unitaires et E2E peuvent être intégrés dans un pipeline CI/CD :

```yaml
# Exemple GitHub Actions
- name: Run unit tests
  run: cd frontend && npm test -- --watch=false --code-coverage

- name: Run E2E tests
  run: |
    cd backend && mvn spring-boot:run &
    cd frontend && npm start &
    npx wait-on http://localhost:4200
    npx playwright test
```

## Maintenance

### Mise à jour des tokens E2E
Après chaque `mise app:dev:bootstrap`, les tokens changent. Deux options :

1. **Manuelle** (actuelle): Mettre à jour les tokens dans le fichier spec.ts
2. **Automatique** (recommandé pour CI): Créer un fixture Playwright qui récupère les tokens via API

### Ajout de nouveaux tests
1. Tests unitaires service : `download.service.spec.ts`
2. Tests unitaires composant : `download.component.spec.ts`
3. Tests E2E : `e2e/us01-file-download.spec.ts`

## Dépendances

- **Jasmine/Karma**: Tests unitaires Angular
- **Playwright**: Tests E2E multi-navigateurs
- **HttpClientTestingModule**: Mock HTTP dans tests unitaires
- **ActivatedRoute**: Mock routing Angular

## Liens utiles

- [Documentation Angular Testing](https://angular.io/guide/testing)
- [Playwright Documentation](https://playwright.dev)
- [Spécification US01](../../docs/us/us01-telechargement-lien.md)
