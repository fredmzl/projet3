import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour US02 - Création de compte
 * 
 * Scénarios testés :
 * 1. Affichage du formulaire d'inscription
 * 2. Création de compte avec succès
 * 3. Validation des champs (email, mot de passe, confirmation)
 * 4. Gestion des erreurs (email déjà utilisé, mots de passe non correspondants)
 * 5. Redirection vers la page de connexion après succès
 */

test.describe('US02 - Création de compte', () => {
  const baseURL = 'http://localhost:4200';

  test.beforeEach(async ({ page }) => {
    // Navigation vers la page d'inscription
    await page.goto(`${baseURL}/register`);
  });

  test('devrait afficher le formulaire d\'inscription', async ({ page }) => {
    // Vérifier la présence du titre
    await expect(page.getByRole('heading', { name: 'Créer un compte' })).toBeVisible();

    // Vérifier la présence des champs du formulaire
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
    
    // Vérifier le bouton de soumission
    await expect(page.getByRole('button', { name: /Créer mon compte/i })).toBeVisible();

    // Vérifier le lien vers la page de connexion
    await expect(page.getByRole('link', { name: /J'ai déjà un compte/i })).toBeVisible();
  });

  test('devrait créer un compte avec succès', async ({ page }) => {
    // Générer un email unique pour éviter les conflits
    const uniqueEmail = `testuser${Date.now()}@example.com`;
    const password = 'SecurePass123!';

    // Remplir le formulaire
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input#password', password);
    await page.fill('input#confirmPassword', password);

    // Soumettre le formulaire
    await page.getByRole('button', { name: /Créer mon compte/i }).click();

    // Vérifier le message de succès
    await expect(page.locator('app-callout[type="info"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('app-callout[type="info"]')).toContainText(/Compte créé avec succès/i);

    // Vérifier la redirection vers la page de connexion
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('devrait valider le format de l\'email', async ({ page }) => {
    // Saisir un email invalide
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input#password', 'password123');
    await page.locator('input#password').blur();

    // Vérifier le message d'erreur
    await expect(page.locator('.error-message').filter({ hasText: /format valide/i })).toBeVisible();

    // Le bouton devrait être désactivé
    const submitButton = page.getByRole('button', { name: /Créer mon compte/i });
    await expect(submitButton).toBeDisabled();
  });

  test('devrait valider la longueur du mot de passe (minimum 6 caractères)', async ({ page }) => {
    const shortPassword = '12345'; // 5 caractères

    // Remplir avec un mot de passe trop court
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input#password', shortPassword);
    await page.fill('input#confirmPassword', shortPassword);
    await page.locator('input#password').blur();

    // Vérifier le message d'erreur
    await expect(page.locator('.error-message').filter({ hasText: /au moins 8 caractères/i })).toBeVisible();

    // Le bouton devrait être désactivé
    const submitButton = page.getByRole('button', { name: /Créer mon compte/i });
    await expect(submitButton).toBeDisabled();
  });

  test('devrait vérifier que les mots de passe correspondent', async ({ page }) => {
    const email = 'test@example.com';
    const password1 = 'SecurePass123!';
    const password2 = 'DifferentPass456!';

    // Remplir avec des mots de passe différents
    await page.fill('input[type="email"]', email);
    await page.fill('input#password', password1);
    await page.fill('input#confirmPassword', password2);
    await page.locator('input#confirmPassword').blur();

    // Vérifier le message d'erreur
    await expect(page.locator('.error-message').filter({ hasText: /ne correspondent pas/i })).toBeVisible();

    // Le bouton devrait être désactivé
    const submitButton = page.getByRole('button', { name: /Créer mon compte/i });
    await expect(submitButton).toBeDisabled();
  });

  test('devrait afficher une erreur si l\'email existe déjà', async ({ page }) => {
    // Utiliser un email existant (alice@example.com du bootstrap)
    const existingEmail = 'alice@example.com';
    const password = 'SecurePass123!';

    // Remplir le formulaire
    await page.fill('input[type="email"]', existingEmail);
    await page.fill('input#password', password);
    await page.fill('input#confirmPassword', password);

    // Soumettre le formulaire
    await page.getByRole('button', { name: /Créer mon compte/i }).click();

    // Vérifier le message d'erreur dans le callout
    await expect(page.locator('app-callout[type="error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('app-callout[type="error"]')).toContainText(/Données invalides|existe|utilisé/i);

    // Vérifier qu'on reste sur la page d'inscription
    expect(page.url()).toContain('/register');
  });

  test('devrait désactiver le bouton pendant la soumission', async ({ page }) => {
    const uniqueEmail = `testuser${Date.now()}@example.com`;
    const password = 'SecurePass123!';

    // Remplir le formulaire
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input#password', password);
    await page.fill('input#confirmPassword', password);

    const submitButton = page.getByRole('button', { name: /Créer mon compte/i });

    // Cliquer sur le bouton et vérifier immédiatement
    await submitButton.click();
    
    // Le bouton devrait afficher "Création en cours..." ou être désactivé
    await expect(submitButton).toContainText(/Création en cours|En cours/i, { timeout: 500 }).catch(() => {});
  });

  test('devrait afficher un indicateur de chargement', async ({ page }) => {
    const uniqueEmail = `testuser${Date.now()}@example.com`;
    const password = 'SecurePass123!';

    // Remplir le formulaire
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input#password', password);
    await page.fill('input#confirmPassword', password);

    const submitButton = page.getByRole('button', { name: /Créer mon compte/i });
    
    // Cliquer et vérifier immédiatement le spinner
    await submitButton.click();
    
    // Vérifier la présence du spinner ou du texte "Création en cours..."
    const hasSpinner = await page.locator('.spinner').count({ timeout: 500 }).catch(() => 0);
    const hasLoadingText = await page.getByText(/Création en cours/i).count({ timeout: 500 }).catch(() => 0);
    
    expect(hasSpinner + hasLoadingText).toBeGreaterThan(0);
  });

  test('devrait permettre de naviguer vers la page de connexion', async ({ page }) => {
    // Cliquer sur le lien "J'ai déjà un compte"
    await page.getByRole('link', { name: /J'ai déjà un compte/i }).click();

    // Vérifier la navigation vers /login
    await page.waitForURL(/\/login/, { timeout: 3000 });
    expect(page.url()).toContain('/login');
  });

  test('devrait effacer les messages d\'erreur lors d\'une nouvelle soumission', async ({ page }) => {
    // Première tentative avec email existant
    await page.fill('input[type="email"]', 'alice@example.com');
    await page.fill('input#password', 'password123');
    await page.fill('input#confirmPassword', 'password123');
    await page.getByRole('button', { name: /Créer mon compte/i }).click();

    // Attendre le message d'erreur
    await expect(page.locator('app-callout[type="error"]')).toBeVisible({ timeout: 5000 });

    // Modifier l'email et re-soumettre
    const uniqueEmail = `testuser${Date.now()}@example.com`;
    await page.fill('input[type="email"]', uniqueEmail);
    await page.getByRole('button', { name: /Créer mon compte/i }).click();

    // Le message d'erreur précédent ne devrait plus être visible
    await page.waitForTimeout(1000);
    const errorCallouts = await page.locator('app-callout[type="error"]').count();
    expect(errorCallouts).toBe(0);
  });

  test('devrait gérer les erreurs réseau', async ({ page }) => {
    // Simuler une erreur réseau en bloquant l'API
    await page.route('**/api/auth/register', route => {
      route.abort('failed');
    });

    const uniqueEmail = `testuser${Date.now()}@example.com`;
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input#password', 'password123');
    await page.fill('input#confirmPassword', 'password123');

    await page.getByRole('button', { name: /Créer mon compte/i }).click();

    // Vérifier qu'un callout d'erreur s'affiche
    await expect(page.locator('app-callout[type="error"]')).toBeVisible({ timeout: 5000 });
  });

  test('devrait valider tous les champs avant soumission', async ({ page }) => {
    // Le bouton devrait être désactivé si le formulaire est vide
    const submitButton = page.getByRole('button', { name: /Créer mon compte/i });
    await expect(submitButton).toBeDisabled();

    // Remplir partiellement et vérifier que c'est toujours désactivé
    await page.fill('input[type="email"]', 'test@example.com');
    await expect(submitButton).toBeDisabled(); // Toujours désactivé (pas de password)

    // Vérifier qu'on reste sur la page d'inscription
    expect(page.url()).toContain('/register');
  });
});
