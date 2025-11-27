??? danger "SpringBoot : Connexion à la base de données PostgreSQL échouée"

    ### 🔴 Symptômes

    Lors du démarrage du backend, l'erreur suivante apparaît :
    ```bash
    org.hibernate.exception.JDBCConnectionException: unable to obtain isolated JDBC connection [The connection attempt failed.]
    ...
    Caused by: org.postgresql.util.PSQLException: The connection attempt failed.
    ...
    Caused by: java.net.UnknownHostException: postgres
    ...
    ...
    org.hibernate.HibernateException: Unable to determine Dialect without JDBC metadata (please set 'jakarta.persistence.jdbc.url' for common cases or 'hibernate.dialect' when a custom Dialect implementation must be provided)
    ```

    ### 🔍 Cause
    Cette erreur est due au fait que l'application Spring Boot ne parvient pas à se connecter à la base de données PostgreSQL car le service PostgreSQL n'est pas accessible à l'adresse spécifiée.
    **Causes possibles :**
    1. PostgreSQL n'est pas démarré
    2. Mauvais `DB_HOST` (localhost vs postgresql vs IP)
    3. Mauvais `DB_PORT`
    4. Réseau Docker non configuré correctement

    ### 💡 Solution
    ```bash
    # 1. Vérifier que PostgreSQL tourne
    docker ps | grep postgres
    # Ou
    sudo ss -ltnp | grep :5432

    # 2. Tester la connexion manuellement
    psql -h localhost -p 5432 -U db_user -d datashare
    # Ou
    docker exec -it postgresql psql -U db_user -d datashare

    # 3. Vérifier le .env
    cat .env | grep DB_HOST
    # Local : DB_HOST=localhost
    # Docker : DB_HOST=postgresql (nom du service)

    # 4. Vérifier le réseau Docker Compose
    docker network ls
    docker network inspect datashare-net
    ```