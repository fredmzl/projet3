# Récupération dynamique des tokens de téléchargement - Tests E2E

## Problème résolu

Avant, les tokens de téléchargement étaient hardcodés dans les tests E2E :
```typescript
const tokens = {
  public: '93ae4861-3dba-424a-bb60-28bf31640cfb',
  protected: '13c0ab76-8cb4-43d6-a9ac-a31da32f148b',
  expired: 'a11ea1c6-04d2-432b-b4d2-dda976b44875'
};
```

**Problème** : Ces tokens changent à chaque `mise app:bootstrap`, ce qui obligeait à :
1. Exécuter une requête SQL pour récupérer les nouveaux tokens
2. Modifier manuellement le fichier de test
3. Commit les changements

## Solution implémentée

### 1. Fixture Playwright personnalisée

Création d'une fixture `downloadTokens` dans `e2e/fixtures/download-tokens.ts` qui :

1. **Se connecte automatiquement** à l'API avec le compte Alice
2. **Récupère la liste des fichiers** via GET /api/files
3. **Extrait les tokens** des 3 fichiers de démo :
   - `report.txt` → fichier public
   - `secret-notes.md` → fichier protégé
   - `old-document.txt` → fichier expiré
4. **Expose l'objet `downloadTokens`** aux tests

```typescript
export const test = base.extend<{ downloadTokens: DownloadTokens }>({
  downloadTokens: async ({ request }, use) => {
    // Login
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: { login: 'alice@example.com', password: 'password' }
    });
    const { token } = await loginResponse.json();

    // Get files
    const filesResponse = await request.get('http://localhost:3000/api/files', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { files } = await filesResponse.json();

    // Extract tokens
    const tokens = {
      public: files.find(f => f.filename === 'report.txt').downloadToken,
      protected: files.find(f => f.filename === 'secret-notes.md').downloadToken,
      expired: files.find(f => f.filename === 'old-document.txt').downloadToken
    };

    await use(tokens);
  }
});
```

### 2. Utilisation dans les tests

Les tests utilisent maintenant l'import depuis la fixture :

```typescript
// Avant
import { test, expect } from '@playwright/test';

// Après
import { test, expect } from './fixtures/download-tokens';
```

Et injectent `downloadTokens` comme paramètre :

```typescript
// Avant
test('should download file', async ({ page }) => {
  await page.goto(`/download/93ae4861-3dba-424a-bb60-28bf31640cfb`);
});

// Après
test('should download file', async ({ page, downloadTokens }) => {
  await page.goto(`/download/${downloadTokens.public}`);
});
```

## Avantages

✅ **Pas de maintenance manuelle** : Les tokens sont toujours à jour  
✅ **Tests idempotents** : Peuvent tourner après chaque bootstrap  
✅ **CI/CD friendly** : Pas de hardcoding de données de test  
✅ **Auto-documentation** : Les logs montrent les tokens utilisés  
✅ **Robuste** : Gestion d'erreur si les fichiers n'existent pas  

## Logs de test

```
✅ Retrieved 4 files from API
✅ Download tokens retrieved: {
  public: '93ae4861-3dba-424a-bb60-28bf31640cfb',
  protected: '13c0ab76-8cb4-43d6-a9ac-a31da32f148b',
  expired: 'a11ea1c6-04d2-432b-b4d2-dda976b44875'
}
```

## Workflow complet

```bash
# 1. Bootstrap avec nouvelles données
mise app:bootstrap

# 2. Les tests récupèrent automatiquement les nouveaux tokens
npx playwright test e2e/us01-file-download.spec.ts

# ✅ 13 tests passed
```

## Dépendances

- **Playwright Request Context** : Pour faire des appels HTTP avant les tests
- **API Backend** : Doit être accessible sur http://localhost:3000
- **Compte Alice** : `alice@example.com` / `password`
- **Fichiers de démo** : Créés par `mise app:bootstrap`

## Extension possible

Cette approche peut être étendue pour d'autres fixtures :

```typescript
// e2e/fixtures/test-users.ts
export const test = base.extend<{ testUsers: TestUsers }>({
  testUsers: async ({ request }, use) => {
    // Créer/récupérer des utilisateurs de test
    await use({ alice: {...}, bob: {...} });
  }
});

// e2e/fixtures/test-data.ts
export const test = base.extend<{ testData: TestData }>({
  testData: async ({ request }, use) => {
    // Setup complet de données de test
    await use(data);
  }
});
```

## Résultat

**13/13 tests E2E passent** avec récupération dynamique des tokens ! 🎉

Plus besoin de mettre à jour manuellement les tokens après chaque bootstrap.
