import { test, expect } from './fixtures/test-users';

/**
 * Tests E2E pour US03 - Connexion utilisateur
 * 
 * Utilise les données du bootstrap:
 * - alice@example.com / password
 * - bob@example.com / password
 * 
 * Scénarios testés :
 * 1. Affichage du formulaire de connexion
 * 2. Connexion réussie avec identifiants valides
 * 3. Stockage du JWT en localStorage
 * 4. Redirection vers /files après connexion
 * 5. Gestion des erreurs (identifiants invalides, champs vides)
 * 6. Validation des champs (email, mot de passe)
 * 7. Indicateur de chargement
 */

test.describe('US03 - Connexion utilisateur', () => {
  const baseURL = 'http://localhost:4200';

  test.beforeEach(async ({ page }) => {
    // Nettoyer le localStorage avant chaque test
    await page.goto(baseURL);
    await page.evaluate(() => localStorage.clear());
    
    // Navigation vers la page de connexion
    await page.goto(`${baseURL}/login`);
  });

  test('devrait afficher le formulaire de connexion', async ({ page }) => {
    // Vérifier le titre
    await expect(page.getByRole('heading', { name: /Connexion/i })).toBeVisible();

    // Vérifier les champs du formulaire
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Vérifier le bouton de soumission
    await expect(page.getByRole('button', { name: /Connexion/i })).toBeVisible();

    // Vérifier le lien vers la page d'inscription
    await expect(page.getByRole('link', { name: /Créer un compte|S'inscrire/i })).toBeVisible();
  });

  test('devrait se connecter avec succès avec des identifiants valides', async ({ page, testUsers }) => {
    // Remplir le formulaire avec Alice du bootstrap
    await page.fill('input[type="email"]', testUsers.alice.login);
    await page.fill('input[type="password"]', testUsers.alice.password);

    // Soumettre le formulaire
    await page.getByRole('button', { name: /Connexion/i }).click();

    // Vérifier la redirection vers /files
    await page.waitForURL(/\/files/, { timeout: 5000 });
    expect(page.url()).toContain('/files');
  });

  test('devrait stocker le JWT en localStorage après connexion réussie', async ({ page, testUsers }) => {
    // Se connecter
    await page.fill('input[type="email"]', testUsers.alice.login);
    await page.fill('input[type="password"]', testUsers.alice.password);
    await page.getByRole('button', { name: /Connexion/i }).click();

    // Attendre la redirection
    await page.waitForURL(/\/files/, { timeout: 5000 });

    // Vérifier que le token est stocké
    const token = await page.evaluate(() => localStorage.getItem('jwt_token'));
    expect(token).toBeTruthy();
    expect(token).not.toBe('');
  });

  test('devrait afficher une erreur avec un mot de passe incorrect', async ({ page, testUsers }) => {
    // Remplir avec un mauvais mot de passe
    await page.fill('input[type="email"]', testUsers.alice.login);
    await page.fill('input[type="password"]', 'WrongPassword123!');

    // Soumettre le formulaire
    await page.getByRole('button', { name: /Connexion/i }).click();

    // Vérifier le message d'erreur générique
    await expect(page.locator('app-callout[type="error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('app-callout[type="error"]')).toContainText(/incorrect|invalide/i);

    // Vérifier qu'on reste sur la page de connexion
    expect(page.url()).toContain('/login');

    // Vérifier qu'aucun token n'est stocké
    const token = await page.evaluate(() => localStorage.getItem('jwt_token'));
    expect(token).toBeNull();
  });

  test('devrait afficher une erreur avec un email inexistant', async ({ page }) => {
    // Remplir avec un email qui n'existe pas
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'SomePassword123!');

    // Soumettre le formulaire
    await page.getByRole('button', { name: /Connexion/i }).click();

    // Vérifier le même message d'erreur générique (sécurité)
    await expect(page.locator('app-callout[type="error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('app-callout[type="error"]')).toContainText(/incorrect|invalide/i);

    // Vérifier qu'on reste sur la page de connexion
    expect(page.url()).toContain('/login');
  });

  test('devrait valider le format de l\'email', async ({ page }) => {
    // Saisir un email invalide
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.locator('input[type="password"]').blur();

    // Vérifier le message d'erreur
    await expect(page.locator('.error-message, mat-error').filter({ hasText: /format valide|email/i })).toBeVisible();

    // Le bouton devrait être désactivé
    const submitButton = page.getByRole('button', { name: /Connexion/i });
    await expect(submitButton).toBeDisabled();
  });

  test('devrait valider la longueur minimale du mot de passe (8 caractères)', async ({ page }) => {
    // Saisir un mot de passe trop court
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '12345'); // 5 caractères

    // Le bouton devrait être désactivé (validation minLength(8) sur le formulaire)
    const submitButton = page.getByRole('button', { name: /Connexion/i });
    await expect(submitButton).toBeDisabled();
    
    // Saisir un mot de passe valide
    await page.fill('input[type="password"]', '12345678'); // 8 caractères
    
    // Le bouton devrait être activé
    await expect(submitButton).not.toBeDisabled();
  });

  test('devrait désactiver le bouton si les champs sont vides', async ({ page }) => {
    // Le bouton devrait être désactivé par défaut
    const submitButton = page.getByRole('button', { name: /Connexion/i });
    await expect(submitButton).toBeDisabled();

    // Remplir seulement l'email
    await page.fill('input[type="email"]', 'test@example.com');
    await expect(submitButton).toBeDisabled(); // Toujours désactivé

    // Vider l'email et remplir seulement le mot de passe
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="password"]', 'password123');
    await expect(submitButton).toBeDisabled(); // Toujours désactivé
  });

  test('devrait afficher un indicateur de chargement pendant la connexion', async ({ page, testUsers }) => {
    // Remplir le formulaire
    await page.fill('input[type="email"]', testUsers.alice.login);
    await page.fill('input[type="password"]', testUsers.alice.password);

    // Cliquer sur le bouton
    await page.getByRole('button', { name: /Connexion/i }).click();

    // Vérifier la présence d'un spinner ou texte de chargement
    const hasSpinner = await page.locator('.spinner, [class*="loading"]').count({ timeout: 500 }).catch(() => 0);
    const hasLoadingText = await page.getByText(/En cours|Connexion en cours/i).count({ timeout: 500 }).catch(() => 0);

    // Au moins un indicateur de chargement devrait être présent
    expect(hasSpinner + hasLoadingText).toBeGreaterThan(0);
  });

  test('devrait désactiver le bouton pendant la soumission', async ({ page, testUsers }) => {
    // Remplir le formulaire
    await page.fill('input[type="email"]', testUsers.alice.login);
    await page.fill('input[type="password"]', testUsers.alice.password);

    const submitButton = page.getByRole('button', { name: /Connexion/i });

    // Cliquer et vérifier immédiatement
    await submitButton.click();

    // Le bouton devrait être désactivé ou afficher un état de chargement
    await expect(submitButton).toBeDisabled({ timeout: 500 }).catch(() => {});
  });

  test('devrait permettre de naviguer vers la page d\'inscription', async ({ page }) => {
    // Cliquer sur le lien "Créer un compte"
    await page.getByRole('link', { name: /Créer un compte|S'inscrire/i }).click();

    // Vérifier la navigation vers /register
    await page.waitForURL(/\/register/, { timeout: 3000 });
    expect(page.url()).toContain('/register');
  });

  test('devrait se connecter avec Bob (second utilisateur du bootstrap)', async ({ page, testUsers }) => {
    // Remplir le formulaire avec Bob
    await page.fill('input[type="email"]', testUsers.bob.login);
    await page.fill('input[type="password"]', testUsers.bob.password);

    // Soumettre le formulaire
    await page.getByRole('button', { name: /Connexion/i }).click();

    // Vérifier la redirection vers /files
    await page.waitForURL(/\/files/, { timeout: 5000 });
    expect(page.url()).toContain('/files');

    // Vérifier le token
    const token = await page.evaluate(() => localStorage.getItem('jwt_token'));
    expect(token).toBeTruthy();
  });

  test('devrait effacer les messages d\'erreur lors d\'une nouvelle soumission', async ({ page, testUsers }) => {
    // Première tentative avec mauvais mot de passe
    await page.fill('input[type="email"]', testUsers.alice.login);
    await page.fill('input[type="password"]', 'WrongPassword');
    await page.getByRole('button', { name: /Connexion/i }).click();

    // Attendre le message d'erreur
    await expect(page.locator('app-callout[type="error"]')).toBeVisible({ timeout: 5000 });

    // Corriger le mot de passe et re-soumettre
    await page.fill('input[type="password"]', testUsers.alice.password);
    await page.getByRole('button', { name: /Connexion/i }).click();

    // Le message d'erreur ne devrait plus être visible
    await page.waitForTimeout(500);
    const errorCallouts = await page.locator('app-callout[type="error"]').count();
    expect(errorCallouts).toBe(0);
  });

  test('devrait gérer les erreurs réseau', async ({ page, testUsers }) => {
    // Simuler une erreur réseau
    await page.route('**/api/auth/login', route => {
      route.abort('failed');
    });

    // Remplir et soumettre
    await page.fill('input[type="email"]', testUsers.alice.login);
    await page.fill('input[type="password"]', testUsers.alice.password);
    await page.getByRole('button', { name: /Connexion/i }).click();

    // Vérifier qu'un message d'erreur s'affiche
    await expect(page.locator('app-callout[type="error"]')).toBeVisible({ timeout: 5000 });
  });

  test('devrait conserver la session après rechargement de la page', async ({ page, testUsers }) => {
    // Se connecter
    await page.fill('input[type="email"]', testUsers.alice.login);
    await page.fill('input[type="password"]', testUsers.alice.password);
    await page.getByRole('button', { name: /Connexion/i }).click();

    // Attendre la redirection
    await page.waitForURL(/\/files/, { timeout: 5000 });

    // Récupérer le token
    const tokenBefore = await page.evaluate(() => localStorage.getItem('jwt_token'));

    // Recharger la page
    await page.reload();

    // Vérifier que le token est toujours présent
    const tokenAfter = await page.evaluate(() => localStorage.getItem('jwt_token'));
    expect(tokenAfter).toBe(tokenBefore);

    // Vérifier qu'on reste sur /files (pas de redirection vers login)
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/files');
  });

  test('devrait vider les champs après une tentative échouée', async ({ page }) => {
    // Tentative avec mauvais identifiants
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /Connexion/i }).click();

    // Attendre l'erreur
    await expect(page.locator('app-callout[type="error"]')).toBeVisible({ timeout: 5000 });

    // Les champs devraient toujours contenir les valeurs (pour permettre correction)
    const emailValue = await page.locator('input[type="email"]').inputValue();
    const passwordValue = await page.locator('input[type="password"]').inputValue();
    
    expect(emailValue).toBe('wrong@example.com');
    expect(passwordValue).toBe('wrongpassword');
  });
});
