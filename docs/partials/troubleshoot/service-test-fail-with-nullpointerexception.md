??? danger "`NullPointerException` dans un test de service"

    ### 🔴 Symptômes

    Lors de l'exécution d'un test unitaire ou d'intégration d'un service Spring Boot, l'erreur suivante apparaît :
    ```
    java.lang.NullPointerException
        at com.openclassrooms.datashare.service.FileService.getFileInfo(FileService.java:45)
        at com.openclassrooms.datashare.service.FileServiceTest.testGetFileInfo(FileServiceTest.java:30)
    ...  

    ### 🔍 Cause
    Cette erreur est généralement due au fait qu'une dépendance du service testé n'a pas été correctement simulée (mockée) ou injectée dans le contexte de test.   
    Par exemple, si le service dépend d'un repository ou d'un autre service, et que cette dépendance est `null` lors de l'exécution du test, toute tentative d'appel de méthode sur cette dépendance entraînera un `NullPointerException`.

    ### 💡 Solution
    Assurez-vous que toutes les dépendances du service sont correctement mockées ou injectées dans le contexte de test. Par exemple, utilisez des annotations comme `@MockBean` ou `@Mock` avec Mockito, et `@Autowired` pour injecter les dépendances dans votre classe de test.  
    
    Voici un exemple de configuration correcte d'un test de service avec Mockito :

    ```java
    // Vérifier les mocks
    @Mock
    private FileRepository fileRepository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this); // Initialisation des mocks
        fileService = new FileService(fileRepository, storageService);
    }