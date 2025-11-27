import { test, expect } from '@playwright/test';

test('Test simple login manuel', async ({ page }) => {
  // Aller sur la page de login
  await page.goto('http://localhost:4200/login');
  
  // Attendre que la page soit chargée
  await page.waitForLoadState('networkidle');
  
  // Remplir le formulaire
  await page.fill('input[type="email"]', 'fred@home.lan');
  await page.fill('input[type="password"]', 'password');
  
  // Faire une capture d'écran avant
  await page.screenshot({ path: 'before-login.png' });
  
  // Écouter les requêtes réseau
  page.on('response', response => {
    console.log(`${response.status()} ${response.url()}`);
  });
  
  // Cliquer sur le bouton
  await page.getByRole('button', { name: /connexion/i }).click();
  
  // Attendre un peu
  await page.waitForTimeout(5000);
  
  // Faire une capture d'écran après
  await page.screenshot({ path: 'after-login.png' });
  
  // Afficher l'URL actuelle
  console.log('URL actuelle:', page.url());
  
  // Afficher le contenu de localStorage
  const token = await page.evaluate(() => localStorage.getItem('token'));
  console.log('Token dans localStorage:', token ? 'présent' : 'absent');
});
