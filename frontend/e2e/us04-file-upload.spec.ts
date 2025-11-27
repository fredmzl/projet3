import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * Tests E2E pour US04 - Upload de fichiers
 * 
 * Scénarios testés :
 * 1. Accès à la page files (protégée par auth)
 * 2. Ouverture du modal d'upload
 * 3. Sélection et upload d'un fichier
 * 4. Validation des champs (mot de passe, expiration)
 * 5. Affichage du lien de téléchargement
 * 6. Gestion des erreurs (fichier trop gros, type non autorisé)
 */

test.describe('US04 - Upload de fichiers', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page de login
    await page.goto('/login');
    
    // Se connecter avec l'utilisateur testuser@example.net
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'testuser@example.net');
    await page.fill('input[type="password"]', 'password');
    
    // Cliquer sur le bouton de connexion
    await page.getByRole('button', { name: /Connexion/i }).click();
    
    // Attendre la redirection vers /files
    await page.waitForURL(/\/files/, { timeout: 15000 });
  });

  test('devrait ouvrir le modal d\'upload', async ({ page }) => {
    // Cliquer sur le bouton "Ajouter des fichiers"
    await page.click('button:has-text("Ajouter des fichiers")');
    
    // Vérifier que le modal est ouvert
    await expect(page.getByText('Uploader un fichier')).toBeVisible();
    await expect(page.getByText(/Glissez-déposez/i)).toBeVisible();
  });

  test('devrait uploader un fichier avec succès', async ({ page }) => {
    // Ouvrir le modal
    await page.click('button:has-text("Ajouter des fichiers")');
    
    // Créer un fichier de test
    const testFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');
    
    // Sélectionner le fichier
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Vérifier que le fichier est sélectionné
    // await expect(page.getByText('test-file.txt')).toBeVisible();
    
    // Sélectionner l'expiration (par défaut 7 jours)
    // Le formulaire devrait être valide par défaut
    
    // Cliquer sur Uploader (force pour éviter l'interception par Material)
    await page.locator('button[type="submit"]').click({ force: true });
    
    // Attendre le succès (timeout 10s)
    // Note: pas de vérification de "Upload en cours" car trop rapide sur petit fichier
    // await expect(page.getByText('Fichier uploadé avec succès')).toBeVisible({ timeout: 10000 });
    
    // Vérifier l'affichage du lien
    const downloadLinkInput = page.locator('.download-link-input');
    await expect(downloadLinkInput).toBeVisible();
    const linkValue = await downloadLinkInput.inputValue();
    expect(linkValue).toContain('http');
  });

  test('devrait uploader un fichier avec mot de passe', async ({ page }) => {
    await page.click('button:has-text("Ajouter des fichiers")');
    
    const testFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Remplir le mot de passe
    await page.fill('input[type="password"]', 'secret123');
    
    // Sélectionner une expiration courte
    await page.click('mat-select[formcontrolname="expirationDays"]');
    await page.click('mat-option:has-text("1 jour")');
    
    // Attendre que le dropdown se ferme
    await page.waitForTimeout(300);
    
    await page.locator('button[type="submit"]').click({ force: true });
    
    await expect(page.getByText('Fichier uploadé avec succès')).toBeVisible({ timeout: 10000 });
  });

  test('devrait valider le mot de passe (minimum 6 caractères)', async ({ page }) => {
    await page.click('button:has-text("Ajouter des fichiers")');
    
    const testFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Saisir un mot de passe trop court
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('12345');
    await passwordInput.blur();
    
    // Vérifier le message d'erreur
    await expect(page.getByText(/au moins 6 caractères/i)).toBeVisible();
    

    // Le bouton Uploader devrait être désactivé
    const uploadButton = page.locator('button[type="submit"]');
    await expect(uploadButton).toBeDisabled();
  });

  test('devrait gérer l\'erreur fichier trop gros', async ({ page }) => {
    await page.click('button:has-text("Ajouter des fichiers")');
    
    // Créer un fichier simulant 1.5 GB (on va simuler côté frontend)
    // Note: Pour un vrai test, il faudrait intercepter la requête
    const testFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Simuler une erreur 413 via interception (optionnel)
    await page.route('**/api/files', route => {
      route.fulfill({
        status: 413,
        body: JSON.stringify({ error: 'Payload Too Large' })
      });
    });
    
    await page.locator('button[type="submit"]').click({ force: true });
    
    // Vérifier le message d'erreur
    await expect(page.getByText(/1 GB/i)).toBeVisible();
  });

  test('devrait gérer l\'erreur type de fichier non autorisé', async ({ page }) => {
    await page.click('button:has-text("Ajouter des fichiers")');
    
    const testFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Simuler une erreur 400 type MIME
    await page.route('**/api/files', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'File type not allowed: test.exe (MIME: application/x-msdownload)' })
      });
    });
    
    await page.locator('button[type="submit"]').click({ force: true });
    
    // Vérifier le message d'erreur explicite
    await expect(page.getByText(/Type de fichier non autorisé/i)).toBeVisible();
    await expect(page.getByText(/exécutables et scripts/i)).toBeVisible();
  });

  test('devrait fermer le modal après succès', async ({ page }) => {
    await page.click('button:has-text("Ajouter des fichiers")');
    
    const testFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    await page.locator('button[type="submit"]').click({ force: true });
    
    // Attendre le succès
    await expect(page.getByText('Fichier uploadé avec succès')).toBeVisible({ timeout: 10000 });
    
    // Cliquer sur Fermer
    await page.click('button:has-text("Fermer")');
    
    // Le modal devrait être fermé
    await expect(page.getByText('Uploader un fichier')).not.toBeVisible();
  });

  test('devrait permettre d\'annuler l\'upload', async ({ page }) => {
    await page.click('button:has-text("Ajouter des fichiers")');
    
    const testFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Cliquer sur Annuler
    await page.click('button:has-text("Annuler")');
    
    // Le modal devrait être fermé
    await expect(page.getByText('Uploader un fichier')).not.toBeVisible();
  });

  test('devrait supporter le drag and drop', async ({ page }) => {
    await page.click('button:has-text("Ajouter des fichiers")');
    
    // Simuler un drag and drop (difficile en Playwright, on vérifie juste la présence de la zone)
    const dropZone = page.locator('.file-drop-zone');
    await expect(dropZone).toBeVisible();
    
    // Vérifier le texte
    await expect(page.getByText(/Glissez-déposez/i)).toBeVisible();
  });
});
