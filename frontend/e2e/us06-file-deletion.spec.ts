import { test, expect } from './fixtures/test-users';

// Déclarer Buffer pour TypeScript (disponible globalement dans Node.js)
declare const Buffer: any;

/**
 * Tests end-to-end pour l'US06 : Suppression de fichier
 * 
 * Utilise les données du bootstrap:
 * - alice@example.com / password (4 fichiers)
 * - bob@example.com / password (3 fichiers)
 * 
 * Scénarios testés :
 * - Suppression d'un fichier avec confirmation
 * - Annulation de la suppression
 * - Gestion des erreurs (404, 403, 401)
 * - Mise à jour de la liste après suppression
 */

test.describe('US06 - Suppression de fichier', () => {
  const baseURL = 'http://localhost:4200';
  const apiURL = 'http://localhost:3000/api';

  let authToken: string;
  let testFileId: string;

  test.beforeEach(async ({ page, testUsers }) => {
    // 1. Login pour obtenir le token (utilise Alice du bootstrap)
    const loginResponse = await page.request.post(`${apiURL}/auth/login`, {
      data: {
        login: testUsers.alice.login,
        password: testUsers.alice.password
      }
    });
    
    if (!loginResponse.ok()) {
      const errorBody = await loginResponse.text();
      console.error('Login failed:', loginResponse.status(), errorBody);
    }
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.token;

    // 2. Uploader un fichier de test
    const fileContent = 'Test file content for deletion';
    
    const uploadResponse = await page.request.post(`${apiURL}/files`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      multipart: {
        file: {
          name: 'test-delete.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from(fileContent)
        },
        expirationDays: '7'
      }
    });

    expect(uploadResponse.ok()).toBeTruthy();
    const uploadData = await uploadResponse.json();
    testFileId = uploadData.id;
    
    // Vérifier que l'upload a réussi
    expect(testFileId).toBeTruthy();

    // 3. Définir le token dans localStorage AVANT de naviguer
    await page.goto(baseURL); // Aller sur la page d'accueil d'abord
    await page.evaluate((token) => {
      localStorage.setItem('jwt_token', token); // Utiliser la même clé que AuthService
    }, authToken);
    
    // 4. Naviguer vers la page des fichiers (le token est déjà en place)
    await page.goto(`${baseURL}/files`);
    await page.waitForLoadState('networkidle');
    
   
    // Attendre que les fichiers soient chargés
    await page.waitForTimeout(2000);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: tenter de supprimer le fichier s'il existe encore
    try {
      await page.request.delete(`${apiURL}/files/${testFileId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    } catch (error) {
      // Ignore errors (fichier déjà supprimé)
    }
  });

  test('devrait afficher le bouton Supprimer pour chaque fichier', async ({ page, testUsers }) => {
    // Attendre que la liste soit chargée
    await page.waitForSelector('.file-row', { timeout: 5000 });

    // Vérifier qu'il y a au moins un bouton Supprimer
    const deleteButtons = page.locator('button:has-text("Supprimer")');
    await expect(deleteButtons.first()).toBeVisible();
  });

  test('devrait ouvrir la modal de confirmation au clic sur Supprimer', async ({ page, testUsers }) => {
    // Attendre le fichier de test
    await page.waitForSelector('.file-row', { timeout: 5000 });

    // Cliquer sur le premier bouton Supprimer
    await page.locator('button:has-text("Supprimer")').first().click();

    // Vérifier que la modal s'ouvre
    await expect(page.locator('h2:has-text("Supprimer le fichier")')).toBeVisible();
  });

  test('devrait afficher le nom du fichier dans la modal de confirmation', async ({ page, testUsers }) => {
    await page.waitForSelector('.file-row', { timeout: 5000 });

    // Récupérer le nom du fichier
    const fileName = await page.locator('.file-row__name').first().textContent();

    // Cliquer sur Supprimer
    await page.locator('button:has-text("Supprimer")').first().click();

    // Vérifier que le nom du fichier apparaît dans le message
    const dialogMessage = page.locator('.dialog-message');
    await expect(dialogMessage).toContainText(fileName!);
  });

  test('devrait fermer la modal sans supprimer quand on clique sur Annuler', async ({ page, testUsers }) => {
    await page.waitForSelector('.file-row', { timeout: 5000 });
    
    const initialFileCount = await page.locator('.file-row').count();

    // Ouvrir la modal
    await page.locator('button:has-text("Supprimer")').first().click();
    await expect(page.locator('h2:has-text("Supprimer le fichier")')).toBeVisible();

    // Cliquer sur Annuler
    await page.locator('button:has-text("Annuler")').click();

    // Vérifier que la modal est fermée
    await expect(page.locator('h2:has-text("Supprimer le fichier")')).not.toBeVisible();

    // Vérifier que le nombre de fichiers n'a pas changé
    const finalFileCount = await page.locator('.file-row').count();
    expect(finalFileCount).toBe(initialFileCount);
  });

  test('devrait gérer l\'erreur 404 (fichier non trouvé)', async ({ page, testUsers }) => {
    // Mock d'une requête DELETE qui retourne 404
    await page.route('**/api/files/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Not Found',
            message: 'Fichier non trouvé',
            timestamp: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${baseURL}/files`);
    await page.waitForSelector('.file-row', { timeout: 5000 });

    // Tenter de supprimer
    await page.locator('button:has-text("Supprimer")').first().click();
    await page.locator('mat-dialog-actions button:has-text("Supprimer")').click();

    // Vérifier le message d'erreur
    await expect(page.locator('.mat-mdc-snack-bar-label').first()).toContainText('Fichier non trouvé');
  });

  test('devrait gérer l\'erreur 403 (non autorisé)', async ({ page, testUsers }) => {
    // Mock d'une requête DELETE qui retourne 403
    await page.route('**/api/files/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Forbidden',
            message: 'Vous n\'avez pas l\'autorisation de supprimer ce fichier',
            timestamp: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${baseURL}/files`);
    await page.waitForSelector('.file-row', { timeout: 5000 });

    // Tenter de supprimer
    await page.locator('button:has-text("Supprimer")').first().click();
    await page.locator('mat-dialog-actions button:has-text("Supprimer")').click();

    // Vérifier le message d'erreur
    await expect(page.locator('.mat-mdc-snack-bar-label').first()).toContainText('autorisation');
  });

  test('devrait rediriger vers login en cas d\'erreur 401', async ({ page, testUsers }) => {
    // Mock d'une requête DELETE qui retourne 401
    await page.route('**/api/files/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Token d\'authentification requis',
            timestamp: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${baseURL}/files`);
    await page.waitForSelector('.file-row', { timeout: 5000 });

    // Tenter de supprimer
    await page.locator('button:has-text("Supprimer")').first().click();
    await page.locator('mat-dialog-actions button:has-text("Supprimer")').click();

    // Vérifier la redirection vers login
    await page.waitForURL('**/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});
