# ========================================
# Stage 1: Build l'application avec Maven
# ========================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build

WORKDIR /build

COPY backend/pom.xml .
RUN mvn dependency:go-offline -f ./pom.xml -B
COPY backend/src ./src

# Builder le projet (skip tests pour l'image)
RUN mvn clean package -f ./pom.xml -DskipTests -B

# ========================================
# Stage 2: Image finale avec JRE uniquement
# ========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copier le JAR depuis l'étape de build
COPY --from=build /build/target/datashare-*.jar app.jar

# Créer le dossier de stockage des fichiers
RUN mkdir -p /var/datashare/storage && \
    chmod 777 /var/datashare/storage

EXPOSE 3000

# Variables d'environnement par défaut (peuvent être overridées)
ENV SPRING_PROFILES_ACTIVE=prod \
    SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/datashare \
    APP_STORAGE_PATH=/var/datashare/storage \
    CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200,http://192.168.10.163:4200,http://frontend:4200,https://www.datashare.projet3.oc

# Lancer l'application
ENTRYPOINT ["java", "-jar", "app.jar"]
