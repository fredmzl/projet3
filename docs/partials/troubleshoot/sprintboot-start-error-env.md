??? danger "SpringBoot : Erreur au démarrage liée aux variables d'environnement"

    ### 🔴 Symptômes

    Lors du démarrage du backend, l'erreur suivante apparaît :
    ```bash
    main] ConfigServletWebServerApplicationContext : Exception encountered during context initialization - cancelling refresh attempt: org.springframework.beans.factory.BeanInitializationException: Could not load properties
    ...
    org.springframework.beans.factory.BeanInitializationException: Could not load properties
    ...
    Caused by: java.io.FileNotFoundException: .env
    ```

    ### 🔍 Cause
    Cette erreur est due au fait que l'application Spring Boot tente de charger un fichier `.env` pour récupérer les variables d'environnement nécessaires à la configuration (notamment les paramètres de connexion à la base de données), mais ce fichier est introuvable. 

    ### 💡 Solution
    Rendre le chargement du fichier `.env` optionnel en modifiant la configuration Spring Boot.
    Dans `/backend/src/main/java/com/openclassrooms/datashare/configuration/AppConfig.java`, ajouter la ligne `configurer.setIgnoreResourceNotFound(true);` comme suit :

    ```java
    @Configuration
    public class AppConfig {
        @Bean
        public static PropertySourcesPlaceholderConfigurer propertySourcesPlaceholderConfigurer() {     
            PropertySourcesPlaceholderConfigurer configurer = new PropertySourcesPlaceholderConfigurer();
            configurer.setLocation(new FileSystemResource(".env"));  // ← Charge .env
            configurer.setIgnoreResourceNotFound(true);              // ← Rendre optionnel
            return configurer;
        }
    }
    ``` 
    Cette modification permet à l'application de démarrer même si le fichier `.env` est absent, en utilisant uniquement les variables d'environnement définies dans le système ou le conteneur Docker.