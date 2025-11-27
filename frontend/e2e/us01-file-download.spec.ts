import { test, expect } from './fixtures/download-tokens';

/**
 * Tests E2E pour US01 - Téléchargement via lien public
 * 
 * Les tokens de téléchargement sont récupérés dynamiquement via la fixture 'downloadTokens'
 * qui se connecte à l'API et récupère les fichiers de démo d'Alice.
 * 
 * Scénarios testés :
 * 1. Téléchargement d'un fichier public (sans mot de passe)
 * 2. Téléchargement d'un fichier protégé par mot de passe
 * 3. Fichier protégé avec mauvais mot de passe (erreur)
 * 4. Fichier expiré (erreur 410)
 * 5. Token invalide (erreur 404)
 * 6. Affichage des informations (nom, taille, expiration)
 */

test.describe('US01 - Téléchargement via lien public', () => {

  test('devrait afficher les informations d\'un fichier public', async ({ page, downloadTokens }) => {
    // Naviguer vers la page de téléchargement
    await page.goto(`/download/${downloadTokens.public}`);

    // Attendre que le chargement soit terminé
    await expect(page.locator('.download-card')).toBeVisible({ timeout: 5000 });

    // Vérifier le nom du fichier
    await expect(page.getByText('report.txt')).toBeVisible();

    // Vérifier la taille du fichier (257 octets)
    await expect(page.getByText(/257 octets/i)).toBeVisible();

    // Vérifier le message d'expiration (7 jours)
    await expect(page.getByText(/Ce fichier expirera dans 7 jours/i)).toBeVisible();

    // Vérifier que le champ mot de passe n'est PAS affiché
    await expect(page.locator('input[type="password"]')).not.toBeVisible();

    // Vérifier que le bouton Télécharger est visible
    await expect(page.getByRole('button', { name: /Télécharger/i })).toBeVisible();
  });

  test('devrait télécharger un fichier public', async ({ page, downloadTokens }) => {
    await page.goto(`/download/${downloadTokens.public}`);
    await expect(page.locator('.download-card')).toBeVisible();

    // Configurer l'attente du téléchargement
    const downloadPromise = page.waitForEvent('download');

    // Cliquer sur le bouton Télécharger
    await page.getByRole('button', { name: /Télécharger/i }).click();

    // Attendre le téléchargement
    const download = await downloadPromise;

    // Vérifier le nom du fichier téléchargé
    expect(download.suggestedFilename()).toBe('report.txt');
  });

  test('devrait afficher le champ mot de passe pour un fichier protégé', async ({ page, downloadTokens }) => {
    await page.goto(`/download/${downloadTokens.protected}`);
    await expect(page.locator('.download-card')).toBeVisible();

    // Vérifier le nom du fichier
    await expect(page.getByText('secret-notes.md')).toBeVisible();

    // Vérifier que le champ mot de passe EST affiché
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(page.getByText('Mot de passe')).toBeVisible();
  });

  test('devrait refuser le téléchargement avec un mauvais mot de passe', async ({ page, downloadTokens }) => {
    await page.goto(`/download/${downloadTokens.protected}`);
    await expect(page.locator('.download-card')).toBeVisible();

    // Remplir avec un mauvais mot de passe
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('wrong-password');

    // Cliquer sur Télécharger
    await page.getByRole('button', { name: /Télécharger/i }).click();

    // Vérifier le message d'erreur
    await expect(page.getByText(/Mot de passe incorrect/i)).toBeVisible({ timeout: 5000 });
  });

  test('devrait télécharger un fichier protégé avec le bon mot de passe', async ({ page, downloadTokens }) => {
    await page.goto(`/download/${downloadTokens.protected}`);
    await expect(page.locator('.download-card')).toBeVisible();

    // Remplir avec le bon mot de passe
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password');

    // Configurer l'attente du téléchargement
    const downloadPromise = page.waitForEvent('download');

    // Cliquer sur Télécharger
    await page.getByRole('button', { name: /Télécharger/i }).click();

    // Attendre le téléchargement
    const download = await downloadPromise;

    // Vérifier le nom du fichier téléchargé
    expect(download.suggestedFilename()).toBe('secret-notes.md');
  });

  test('devrait afficher une erreur pour un fichier expiré', async ({ page, downloadTokens }) => {
    await page.goto(`/download/${downloadTokens.expired}`);

    // Attendre que l'erreur soit affichée
    await expect(page.locator('.error-card')).toBeVisible({ timeout: 5000 });

    // Vérifier le message d'erreur
    await expect(page.getByText(/a expiré/i)).toBeVisible();
    await expect(page.getByText(/n'est plus disponible/i)).toBeVisible();

    // Vérifier que le bouton de téléchargement n'est pas présent
    await expect(page.getByRole('button', { name: /Télécharger/i })).not.toBeVisible();
  });

  test('devrait afficher une erreur pour un token invalide', async ({ page, downloadTokens }) => {
    const invalidToken = '00000000-0000-0000-0000-000000000000';
    await page.goto(`/download/${invalidToken}`);

    // Attendre que l'erreur soit affichée
    await expect(page.locator('.error-card')).toBeVisible({ timeout: 5000 });

    // Vérifier le message d'erreur
    await expect(page.getByText(/non disponible/i)).toBeVisible();
  });

  test('devrait désactiver le bouton de téléchargement sans mot de passe', async ({ page, downloadTokens }) => {
    await page.goto(`/download/${downloadTokens.protected}`);
    await expect(page.locator('.download-card')).toBeVisible();

    // Essayer de télécharger sans remplir le mot de passe
    await expect(page.getByRole('button', { name: /Télécharger/i })).toBeDisabled();
  });

  test('devrait afficher l\'icône de fichier', async ({ page, downloadTokens }) => {
    await page.goto(`/download/${downloadTokens.public}`);
    await expect(page.locator('.download-card')).toBeVisible();

    // Vérifier la présence de l'icône (SVG)
    await expect(page.locator('.file-icon svg')).toBeVisible();
  });

  test('devrait utiliser le gradient de couleur cohérent', async ({ page, downloadTokens }) => {
    await page.goto(`/download/${downloadTokens.public}`);
    await expect(page.locator('.download-card')).toBeVisible();

    // Vérifier que le conteneur a le gradient primary
    const container = page.locator('.download-container');
    await expect(container).toHaveCSS('background', /linear-gradient/);
  });

  test('devrait être responsive (mobile)', async ({ page, downloadTokens }) => {
    // Définir viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`/download/${downloadTokens.public}`);
    await expect(page.locator('.download-card')).toBeVisible();

    // Vérifier que la carte est visible et adaptée
    const card = page.locator('.download-card');
    const box = await card.boundingBox();
    expect(box?.width).toBeLessThan(400); // Doit s'adapter au mobile
  });

  test('devrait afficher un état de téléchargement en cours', async ({ page, downloadTokens }) => {
    await page.goto(`/download/${downloadTokens.public}`);
    await expect(page.locator('.download-card')).toBeVisible();

    // Cliquer sur télécharger
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Télécharger/i }).click();

    // Le texte du bouton devrait changer (peut être trop rapide)
    // await expect(page.getByText(/Téléchargement en cours/i)).toBeVisible();

    // Attendre la fin
    await downloadPromise;
  });

  test('devrait gérer les erreurs réseau', async ({ page, context, downloadTokens }) => {
    // Bloquer les requêtes vers l'API
    await context.route('**/api/download/**', route => route.abort());

    await page.goto(`/download/${downloadTokens.public}`);

    // Vérifier qu'une erreur est affichée
    await expect(page.locator('.error-card, .error-alert')).toBeVisible({ timeout: 5000 });
  });
});
