??? danger "Test E2E échoue avec Timeout waiting for element"

    ### 🔴 Symptômes

    Lors de l'exécution des tests E2E avec Playwright, certains tests échouent avec l'erreur suivante :
    ```
    TimeoutError: Timeout 5000ms exceeded. Waiting for element to be visible: text=Download File
    ``` 

    ### 🔍 Cause
    Cette erreur est généralement due au fait que l'élément attendu n'apparaît pas dans le délai imparti (5 secondes par défaut). Les causes possibles incluent :  
    - Le backend n'est pas démarré ou n'est pas accessible à l'URL configurée (http://localhost:3000).  
    - Les données de test nécessaires (fichiers, tokens) ne sont pas présentes dans la base de données.  
    - Un problème de performance ralentit le chargement de la page au-delà du délai d'attente.  

    ### 💡 Solution
    Augmenter le délai d'attente dans la configuration des tests Playwright. Par exemple, pour augmenter le timeout à 15 secondes, modifier le fichier de configuration `playwright.config.ts` comme suit :

    ```typescript
    // Augmenter le timeout et ajouter waitForLoadState
    await page.goto('/files');
    await page.waitForLoadState('networkidle'); // Attendre la fin des requêtes réseau
    await expect(page.locator('.file-card')).toBeVisible({ timeout: 10000 });
    ```