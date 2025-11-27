import { test, expect } from './fixtures/test-users';

test('Test simple login manuel', async ({ page, testUsers }) => {
  test.setTimeout(60000); // Augmenter le timeout pour le debug

  // Aller sur la page de login
  await page.goto('http://localhost:4200/login');
  
  // Attendre que la page soit chargée
  await page.waitForLoadState('networkidle');
  
  // Remplir le formulaire avec les données du bootstrap (Alice)
  await page.fill('input[type="email"]', testUsers.alice.login);
  await page.fill('input[type="password"]', testUsers.alice.password);
    
  // Écouter les requêtes réseau
  page.on('response', response => {
    console.log(`${response.status()} ${response.url()}`);
  });
  
  // Cliquer sur le bouton
  await page.getByRole('button', { name: /Connexion/i }).click();
  
  // Attendre un peu
  await page.waitForTimeout(5000);
    
  // Afficher l'URL actuelle
  console.log('URL actuelle:', page.url());
  
  // Afficher le contenu de localStorage
  const token = await page.evaluate(() => localStorage.getItem('jwt_token'));
  console.log('Token dans localStorage:', token ? 'found' : 'not found');
});
