import { test as base, expect } from '@playwright/test';

/**
 * Type pour les tokens de téléchargement des fichiers de démo
 */
export interface DownloadTokens {
  public: string;
  protected: string;
  expired: string;
}

/**
 * Fixture étendue avec les tokens de téléchargement
 */
export const test = base.extend<{ downloadTokens: DownloadTokens }>({
  downloadTokens: async ({ request }, use) => {
    // 1. Se connecter avec le compte Alice
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        login: 'alice@example.com',
        password: 'password'
      }
    });

    if (!loginResponse.ok()) {
      throw new Error(`Login failed: ${loginResponse.status()} ${await loginResponse.text()}`);
    }

    const { token } = await loginResponse.json();

    // 2. Récupérer la liste des fichiers d'Alice
    const filesResponse = await request.get('http://localhost:3000/api/files', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!filesResponse.ok()) {
      throw new Error(`Failed to fetch files: ${filesResponse.status()}`);
    }

    const filesData = await filesResponse.json();
    
    // La structure peut être { files: [...] } ou { content: [...] } ou un tableau direct
    const files = filesData.files || filesData.content || (Array.isArray(filesData) ? filesData : []);

    console.log(`✅ Retrieved ${files.length} files from API`);

    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files found. Please run: mise dev:app:bootstrap');
    }

    // 3. Extraire les tokens selon le nom de fichier (utiliser 'filename' pas 'originalFilename')
    const reportFile = files.find((f: any) => f.filename === 'report.txt');
    const secretFile = files.find((f: any) => f.filename === 'secret-notes.md');
    const oldFile = files.find((f: any) => f.filename === 'old-document.txt');

    if (!reportFile || !secretFile || !oldFile) {
      throw new Error('Demo files not found. Please run: mise dev:app:bootstrap');
    }

    const tokens: DownloadTokens = {
      public: reportFile.downloadToken,
      protected: secretFile.downloadToken,
      expired: oldFile.downloadToken
    };

    console.log('✅ Download tokens retrieved:', {
      public: tokens.public,
      protected: tokens.protected,
      expired: tokens.expired
    });

    // 4. Fournir les tokens aux tests
    await use(tokens);
  }
});

export { expect };
