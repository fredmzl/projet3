import { test as base } from '@playwright/test';

/**
 * Type pour les utilisateurs de test du bootstrap
 */
export interface TestUser {
  login: string;
  password: string;
  token?: string;
}

/**
 * Interface des utilisateurs de test disponibles
 */
export interface TestUsers {
  alice: TestUser;
  bob: TestUser;
}

/**
 * Fixture étendue avec les utilisateurs du bootstrap
 * 
 * Usage:
 * import { test, expect } from './fixtures/test-users';
 * 
 * test('mon test', async ({ page, testUsers }) => {
 *   await page.goto('/login');
 *   await page.fill('input[type="email"]', testUsers.alice.login);
 *   await page.fill('input[type="password"]', testUsers.alice.password);
 * });
 */
export const test = base.extend<{ testUsers: TestUsers }>({
  testUsers: async ({ request }, use) => {
    // Utilisateurs créés par le bootstrap (voir .mise/scripts/app-bootstrap.sh)
    const users: TestUsers = {
      alice: {
        login: 'alice@example.com',
        password: 'password'
      },
      bob: {
        login: 'bob@example.com',
        password: 'password'
      }
    };

    console.log('✅ Test users available:', {
      alice: users.alice.login,
      bob: users.bob.login
    });

    // Fournir les utilisateurs aux tests
    await use(users);
  }
});

export { expect } from '@playwright/test';
